/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IDutchAuctionErrors} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionErrors.sol";
import {IDutchAuctionEvents} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionEvents.sol";
import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuction} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuction.sol";

import {DutchAuctionState} from "./DutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction, Base Functionality
 */
abstract contract DutchAuctionBase is
  IDutchAuctionErrors,
  IDutchAuctionEvents,
  AccessControl,
  ReentrancyGuard,
  DutchAuctionState
{
  using EnumerableSet for EnumerableSet.UintSet;
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuction}, {AccessControl}
  // and {IDutchAuctionState}
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
    override(AccessControl, DutchAuctionState)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuction).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal utility functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mint an LP-NFT
   *
   * Tokens provided are returned, minus a small amount lost to dust.
   *
   * @param yieldAmount The amount of YIELD used to mint the LP-NFT
   * @param marketTokenAmount The amount of the market token used to mint the LP-NFT
   *
   * @return lpNftTokenId The token ID of the LP-NFT minted
   */
  function _mintLpNft(
    uint256 yieldAmount,
    uint256 marketTokenAmount
  ) internal returns (uint256 lpNftTokenId) {
    // Uniswap V3 cannot mint a token with zero liquidity
    require(yieldAmount > 0, "No YIELD");
    require(marketTokenAmount > 0, "No market token");

    // Approve pooler to spend tokens
    _routes.yieldToken.safeIncreaseAllowance(
      address(_routes.yieldMarketPooler),
      yieldAmount
    );
    _routes.marketToken.safeIncreaseAllowance(
      address(_routes.yieldMarketPooler),
      marketTokenAmount
    );

    // Mint an LP-NFT
    // slither-disable-next-line calls-loop
    lpNftTokenId = _routes.yieldMarketPooler.mintLpNftImbalance(
      yieldAmount,
      marketTokenAmount,
      address(this)
    );

    // Validate external state
    // slither-disable-next-line calls-loop
    require(
      _routes.uniswapV3NftManager.ownerOf(lpNftTokenId) == address(this),
      "Not owner"
    );

    // Read external state
    // slither-disable-next-line calls-loop,unused-return
    (, , , , , , , uint128 liquidityAmount, , , , ) = _routes
      .uniswapV3NftManager
      .positions(lpNftTokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line calls-loop,reentrancy-no-eth,unused-return
    _routes.uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: lpNftTokenId,
        liquidity: liquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp
      })
    );

    // Collect the tokens and fees
    // slither-disable-next-line calls-loop,reentrancy-no-eth,unused-return
    _routes.uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: lpNftTokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    return lpNftTokenId;
  }

  function _establishAuctionState(uint256 lpNftTokenId) internal {
    // Calculate starting price for the new LP-NFT
    uint256 startingPriceBips = _calculateNextStartingPriceBips();

    // Initialize AuctionState for the new LP-NFT
    AuctionState memory newAuctionState = AuctionState({
      lpNftTokenId: lpNftTokenId,
      startPriceBips: startingPriceBips,
      endPriceBips: _auctionSettings.minPriceBips,
      startTime: block.timestamp,
      salePrice: 0
    });

    // Store the auction state
    _auctionStates[lpNftTokenId] = newAuctionState;

    // Update BureauState
    _bureauState.totalAuctions += 1;

    // Add lpNftTokenId to current auctions set
    require(_currentAuctions.add(lpNftTokenId), "Already added");
  }

  /**
   * @dev Calculates the starting price for the next LP-NFT based on the growth rate
   *
   * @return newStartingPriceBips The calculated starting price (scaled by 1e18)
   */
  function _calculateNextStartingPriceBips()
    internal
    view
    returns (uint256 newStartingPriceBips)
  {
    uint256 lastSalePriceBips = _bureauState.lastSalePriceBips;

    // TODO
    // Calculate new starting price using growth rate
    // slither-disable-next-line incorrect-equality
    if (lastSalePriceBips == 0) {
      newStartingPriceBips = _auctionSettings.initialPriceBips;
    } else {
      newStartingPriceBips = lastSalePriceBips * 2;
    }

    // Ensure new price does not exceed max price
    if (newStartingPriceBips > _auctionSettings.maxPriceBips) {
      newStartingPriceBips = _auctionSettings.maxPriceBips;
    }

    return newStartingPriceBips;
  }
}
