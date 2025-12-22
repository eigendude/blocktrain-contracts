/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IDutchAuctionState} from "./IDutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction, Admin Action Interface
 */
interface IDutchAuctionAdminActions is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Admin interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialize the Dutch Auction
   *
   * The Dutch Auction is initialized my minting the first POW1 LP-NFT and its
   * holding LP-SFT. No creator tip is paid.
   *
   * It is assumed that this will be the first liquidity deposited in the pool,
   * so both pow1Amount and marketTokenAmount are required to be non-zero.
   *
   * @param pow1Amount The amount of the game token to deposit
   * @param marketTokenAmount The amount of the asset token to deposit
   * @param receiver The receiver of the POW1 LP-SFT
   *
   * @return nftTokenId The initial LP-NFT/LP-SFT token ID
   */
  function initialize(
    uint256 pow1Amount,
    uint256 marketTokenAmount,
    address receiver
  ) external returns (uint256 nftTokenId);

  /**
   * @dev Check if the Dutch Auction is initialized
   *
   * @return True if the Dutch Auction is initialized, false otherwise
   */
  function isInitialized() external view returns (bool);

  /**
   * @dev Set the total number of LP-NFTs for sale
   *
   * If this is greater than the current number of LP-NFTs, the difference will
   * be minted and added to the sale. If it is less, LP-NFTs won't be minted to
   * replace the current ones as they are sold.
   *
   * @param auctionCount The target number of LP-NFTs for sale
   * @param marketTokenDust Some dust to produre, if needed, to mint the LP-NFTs
   */
  function setAuctionCount(
    uint32 auctionCount,
    uint256 marketTokenDust
  ) external;

  /**
   * @dev Get the total number of LP-NFTs for sale
   *
   * @return The total number of LP-NFTs for sale
   */
  function getAuctionCount() external view returns (uint32);
}
