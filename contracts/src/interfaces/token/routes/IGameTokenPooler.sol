/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

/**
 * @dev Token router send to liquidity to the Uniswap V3 pool in exchange for
 * an LP-NFT
 */
interface IGameTokenPooler {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when an LP-NFT is minted
   *
   * @param sender The sender of the assets being paid
   * @param recipient The address of the recipient of the LP-NFT
   * @param gameTokenAddress The address of the game token
   * @param assetTokenAddress The address of the asset token
   * @param nftAddress The address of the NFT manager contract
   * @param lpNftTokenId The ID of the LP-NFT
   * @param gameTokenShare The amount of the game token in the NFT
   * @param assetTokenShare The amount of the asset token in the NFT
   * @param liquidityAmount The amount of liquidity created
   */
  event LpNftMinted(
    address indexed sender,
    address indexed recipient,
    address indexed gameTokenAddress,
    address assetTokenAddress,
    address nftAddress,
    uint256 lpNftTokenId,
    uint256 gameTokenShare,
    uint256 assetTokenShare,
    uint128 liquidityAmount
  );

  /**
   * @dev Emitted when liquidity and fees are collected from an LP-NFT.
   *
   * @param sender The sender of the collection request
   * @param recipient The address of the recipient of the LP-NFT fees
   * @param gameTokenAddress The address of the game token
   * @param assetTokenAddress The address of the asset token
   * @param nftAddress The address of the NFT manager contract
   * @param lpNftTokenId The ID of the NFT
   * @param liquidityAmount The amount of liquidity in the NFT before collection
   * @param gameTokenCollected The amount of game token fees collected
   * @param assetTokenCollected The amount of asset token fees collected
   * @param assetTokenReturned The amount of the asset token returned to the
   *        recipient
   */
  event LpNftCollected(
    address indexed sender,
    address indexed recipient,
    address indexed gameTokenAddress,
    address assetTokenAddress,
    address nftAddress,
    uint256 lpNftTokenId,
    uint128 liquidityAmount,
    uint256 gameTokenCollected,
    uint256 assetTokenCollected,
    uint256 assetTokenReturned
  );

  //////////////////////////////////////////////////////////////////////////////
  // External accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Returns true if the game token is token0 in the pool
   *
   * @return True if the game token is token0, false otherwise
   */
  function gameIsToken0() external view returns (bool);

  //////////////////////////////////////////////////////////////////////////////
  // External interface for adding liquidity
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints an LP-NFT and deposits liquidity into the pool using the game
   *      token
   *
   * A swap will occur to allow for single-sided supply.
   *
   * @param gameTokenAmount The amounts of the game token to deposit
   * @param recipient The recipient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted NFT
   */
  function mintLpNftWithGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) external returns (uint256 lpNftTokenId);

  /**
   * @dev Mints an LP-NFT and deposits liquidity into the pool using the asset
   * token
   *
   * A swap will occur to allow for single-sided supply.
   *
   * @param assetTokenAmount The amount of the the asset token to use
   * @param recipient The recipient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted NFT
   */
  function mintLpNftWithAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) external returns (uint256 lpNftTokenId);

  /**
   * @dev Mints a Uniswap V3 LP-NFT and deposits liquidity into the pool
   * without performing a token swap
   *
   * @param gameTokenAmount The amount of the game token to deposit
   * @param assetTokenAmount The amounts of the asset token to deposit
   * @param recipient The recient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted NFT
   */
  function mintLpNftImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) external returns (uint256 lpNftTokenId);

  //////////////////////////////////////////////////////////////////////////////
  // External interface for removing liquidity
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Collects the tokens and fees from an LP-NFT and returns the asset
   * token and empty LP-NFT to the recipient
   *
   * @param lpNftTokenId The ID of the LP-NFT
   * @param recipient The recipient of the fees and the LP-NFT
   *
   * @return assetTokenReturned The amount of the asset token returned to the
   * recipient
   */
  function collectFromLpNft(
    uint256 lpNftTokenId,
    address recipient
  ) external returns (uint256 assetTokenReturned);

  /**
   * @dev Liquidates everything to the asset token in one transaction and
   * returns the empty LP-NFT
   *
   * @param lpNftTokenId The ID of the LP-NFT
   *
   * @return assetTokenReturned The amount of the asset token returned to the
   * sender
   */
  function exit(
    uint256 lpNftTokenId
  ) external returns (uint256 assetTokenReturned);
}
