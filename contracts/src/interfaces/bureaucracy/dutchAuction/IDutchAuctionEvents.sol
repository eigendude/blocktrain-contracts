/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IDutchAuctionState} from "./IDutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction, Event Interface
 */
interface IDutchAuctionEvents {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Event to emit when the Bureau of the Dutch Auction is initialized
   *
   * @param lpNftTokenId The token ID of the LP-NFT minted in the initialization
   * @param gameTokenAmount The amount of game tokens used to initialize the pool
   * @param assetTokenAmount The amount of asset tokens used to initialize the pool
   * @param receiver The address of the receiver of the LP-SFT holding the staked LP-NFT
   */
  event AuctionInitialized(
    uint256 lpNftTokenId,
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address indexed initializer,
    address indexed receiver
  );

  // TODO
  /**
   * @dev Event to emit when a new auction is created
   *
   * @param lpNftTokenId The token ID of the LP-NFT minted for the auction
   * @param auctionStartTime The time when the auction started
   * @param vrgdaParams The VRGDA parameters for the auction schedule
   *
  event AuctionCreated(
    uint256 indexed lpNftTokenId,
    uint256 auctionStartTime,
    IDutchAuctionState.VRGDAParams vrgdaParams
  );

  /**
   * @dev Event to emit when an LP-NFT is purchased
   *
   * @param lpNftTokenId The token ID of the LP-NFT purchased
   * @param liquidityAmount The amount of LPPOW1 tokens in the purchased LP-NFT
   * @param beneficiaryTip The beneficiary tip, in bips scaled by 1e18
   * @param buyer The address of the buyer of the LP-NFT
   * @param receiver The address of the receiver of the LP-NFT
   *
  event AuctionPurchased(
    uint256 indexed lpNftTokenId,
    uint128 liquidityAmount,
    uint256 beneficiaryTip,
    address indexed buyer,
    address indexed receiver
  );

  /**
   * @dev Event to emit when an LP-NFT position is exited, returning the
   * underlying assets in the form of the asset token
   *
   * @param lpNftTokenId The token ID of the LP-NFT exited
   * @param operator The address exiting the LP-NFT position
   *
  event AuctionExited(uint256 indexed lpNftTokenId, address indexed operator);
  */
}
