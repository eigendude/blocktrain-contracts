/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {wadMul, wadExp, toWadUnsafe} from "solmate/src/utils/SignedWadMath.sol";

import {IDutchAuctionState} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionState.sol";

import {VRGDA} from "../../utils/auction/VRGDA.sol";

import {DutchAuctionRoutes} from "./DutchAuctionRoutes.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionState is
  IDutchAuctionState,
  ERC721Holder,
  ERC1155Holder,
  DutchAuctionRoutes
{
  using EnumerableSet for EnumerableSet.UintSet;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  uint256 internal constant INITIAL_PRICE_BIPS = 2e14; // 0.02%
  uint256 internal constant MIN_PRICE_BIPS = 1e14; // 0.01%
  uint256 internal constant MAX_PRICE_BIPS = 1e18; // 100%
  uint256 internal constant GROWTH_RATE = 1e18; // 100% increase in price per sale
  uint256 internal constant DECAY_CONSTANT = 192_540_000_000_000; // Scaled by 1e18 for a 50% price drop per hour

  //////////////////////////////////////////////////////////////////////////////
  // Internal State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialization flag
   */
  bool internal _initialized = false;

  /**
   * @dev Target number of LP-NFTs for sale
   */
  uint32 internal _targetLpNftCount;

  // Auction metadata
  BureauState internal _bureauState;

  // Auction settings
  AuctionSettings internal _auctionSettings;

  // Set of current LP-NFT token IDs on auction
  EnumerableSet.UintSet internal _currentAuctions;

  // Mapping from LP-NFT token ID to AuctionState
  mapping(uint256 => AuctionState) internal _auctionStates;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ERC1155Holder} and {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(IERC165, ERC1155Holder, DutchAuctionRoutes)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC721Receiver).interfaceId ||
      interfaceId == type(IDutchAuctionState).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionState-getBureauState}
   */
  function getBureauState()
    external
    view
    override
    returns (BureauState memory)
  {
    return _bureauState;
  }

  /**
   * @dev See {IDutchAuctionState-getAuctionSettings}
   */
  function getAuctionSettings()
    external
    view
    override
    returns (AuctionSettings memory)
  {
    return _auctionSettings;
  }

  /**
   * @dev See {IDutchAuctionState-getCurrentAuctionCount}
   */
  function getCurrentAuctionCount() external view override returns (uint256) {
    return _bureauState.totalAuctions;
  }

  /**
   * @dev Returns the list of current LP-NFT token IDs on auction
   *
   * @return An array of LP-NFT token IDs
   */
  function getCurrentAuctions() external view returns (uint256[] memory) {
    uint256 length = _currentAuctions.length();
    uint256[] memory auctionIds = new uint256[](length);

    for (uint256 i = 0; i < length; i++) {
      auctionIds[i] = _currentAuctions.at(i);
    }

    return auctionIds;
  }

  /**
   * @dev Returns the auction states of the current auctions
   *
   * @return An array of AuctionState structs
   */
  function getCurrentAuctionStates()
    external
    view
    override
    returns (AuctionState[] memory)
  {
    uint256 length = _currentAuctions.length();
    AuctionState[] memory auctionStates = new AuctionState[](length);

    for (uint256 i = 0; i < length; i++) {
      uint256 lpNftTokenId = _currentAuctions.at(i);
      auctionStates[i] = _auctionStates[lpNftTokenId];
    }

    return auctionStates;
  }

  /**
   * @dev See {IDutchAuctionState-getAuctionState}
   */
  function getAuctionState(
    uint256 lpNftTokenId
  ) external view override returns (AuctionState memory) {
    return _auctionStates[lpNftTokenId];
  }

  /**
   * @dev See {IDutchAuctionState-getCurrentPrice}
   */
  function getCurrentPriceBips(
    uint256 lpNftTokenId
  ) public view override returns (uint256 currentPriceBips) {
    // Read state
    AuctionState memory auction = _auctionStates[lpNftTokenId];

    // Validate state
    // slither-disable-next-line incorrect-equality
    require(auction.lpNftTokenId == lpNftTokenId, "LP-NFT not for sale");
    // slither-disable-next-line incorrect-equality
    require(auction.salePrice == 0, "Auction already sold");
    require(auction.startTime > 0, "Auction not started");

    // Calculate the time elapsed since the auction start
    uint256 elapsedTime = block.timestamp - auction.startTime;

    // Convert elapsedTime to WAD (scaled by 1e18)
    int256 elapsedTimeWad = toWadUnsafe(elapsedTime);

    // Convert decay constant to int256 (already scaled by 1e18)
    int256 decayConstantWad = int256(_auctionSettings.priceDecayRate);

    // Calculate the decay exponent: -decayConstant * elapsedTime
    int256 decayExponent = -wadMul(decayConstantWad, elapsedTimeWad);

    // Calculate the decay factor: e^( -decayConstant * elapsedTime )
    int256 decayFactor = wadExp(decayExponent);

    // Calculate current price: startPriceBips * decayFactor
    int256 startPriceBips = int256(auction.startPriceBips);
    int256 currentPriceBipsInt = wadMul(startPriceBips, decayFactor);

    // Ensure current price is not less than the end price
    uint256 endPriceBips = auction.endPriceBips;
    if (currentPriceBipsInt < int256(endPriceBips)) {
      currentPriceBips = endPriceBips;
    } else {
      currentPriceBips = uint256(currentPriceBipsInt);
    }

    return currentPriceBips;
  }

  /**
   * @dev See {IDutchAuctionState-getTokenUri}
   */
  function getTokenUri(
    uint256 lpNftTokenId
  ) external view override returns (string memory) {
    return _routes.uniswapV3NftManager.tokenURI(lpNftTokenId);
  }
}
