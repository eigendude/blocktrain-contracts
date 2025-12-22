/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Bureau of the Dutch Auction, State Interface
 *
 * @dev This includes both state and derived state of the current enabled
 * auctions
 */
interface IDutchAuctionState is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Types
  //////////////////////////////////////////////////////////////////////////////

  struct AuctionSettings {
    uint256 priceDecayRate; // The rate at which the price decreases (scaled by 1e18)
    uint256 mintDustAmount; // Amount of dust required for pre-minting
    uint256 priceIncrement; // Price increase ratio after each purchase (scaled by 1e18)
    uint256 initialPriceBips; // Initial starting price (scaled by 1e18)
    uint256 minPriceBips; // Minimum possible price (scaled by 1e18)
    uint256 maxPriceBips; // Maximum possible price (scaled by 1e18)
  }

  struct BureauState {
    uint256 totalAuctions; // Total number of LP-NFTs that have gone up for auction
    uint256 lastSalePriceBips; // The price at which the last NFT was sold (scaled by 1e18)
  }

  struct AuctionState {
    uint256 lpNftTokenId; // ID of the LP-NFT for sale
    uint256 startPriceBips; // The starting price of the NFT (scaled by 1e18)
    uint256 endPriceBips; // The end price after the auction's decay (minPrice)
    uint256 startTime; // The time the auction starts
    uint256 salePrice; // Set when the NFT has been sold, or 0 if unsold
  }

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Returns the auction settings
   *
   * @return The AuctionSettings struct containing the auction configuration
   */
  function getAuctionSettings() external view returns (AuctionSettings memory);

  /**
   * @dev Returns the metadata of the Dutch Auction
   *
   * @return The BureauState struct containing the bureau state
   */
  function getBureauState() external view returns (BureauState memory);

  /**
   * @dev Returns the number of active auctions
   *
   * @return The total number of auctions in progress
   */
  function getCurrentAuctionCount() external view returns (uint256);

  /**
   * @dev Returns the list of current LP-NFT token IDs on auction
   *
   * @return An array of LP-NFT token IDs
   */
  function getCurrentAuctions() external view returns (uint256[] memory);

  /**
   * @dev Returns the auction states of the current auctions
   *
   * @return An array of AuctionState structs
   */
  function getCurrentAuctionStates()
    external
    view
    returns (AuctionState[] memory);

  /**
   * @dev Returns the auction state for a given LP-NFT
   *
   * @param lpNftTokenId The token ID of the LP-NFT
   * @return The AuctionState struct containing the auction details
   */
  function getAuctionState(
    uint256 lpNftTokenId
  ) external view returns (AuctionState memory);

  /**
   * @dev Get the current tip price for an LP-NFT
   *
   * @param lpNftTokenId The LP-NFT token ID
   *
   * @return currentPriceBips The LP-NFT tip price, scaled by 1e18
   */
  function getCurrentPriceBips(
    uint256 lpNftTokenId
  ) external view returns (uint256 currentPriceBips);

  /**
   * @dev Get the token URI for an LP-NFT
   *
   * @param lpNftTokenId The LP-NFT token ID
   *
   * @return tokenUri The URI of the LP-NFT
   */
  function getTokenUri(
    uint256 lpNftTokenId
  ) external view returns (string memory);
}
