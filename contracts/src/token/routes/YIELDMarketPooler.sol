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

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IGameTokenPooler} from "../../interfaces/token/routes/IGameTokenPooler.sol";

import {UniV3Pooler} from "./UniV3Pooler.sol";

/**
 * @dev Token router send to liquidity to the Uniswap V3 pool in exchange for
 *      an LP-NFT
 */
contract YIELDMarketPooler is
  Context,
  ReentrancyGuard,
  UniV3Pooler,
  IGameTokenPooler
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param yieldToken_ The address of the YIELD token
   * @param marketToken_ The address of the market token
   * @param yieldMarketPool_ The address of the Uniswap V3 pool contract
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT
   *        manager
   */
  constructor(
    address yieldToken_,
    address marketToken_,
    address yieldMarketPool_,
    address uniswapV3NftManager_
  )
    UniV3Pooler(
      yieldToken_,
      marketToken_,
      yieldMarketPool_,
      uniswapV3NftManager_
    )
  {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IGameTokenPooler}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IGameTokenPooler-gameIsToken0}
   */
  function gameIsToken0() public view override returns (bool) {
    return _numeratorIsToken0;
  }

  /**
   * @dev See {IGameTokenPooler-mintLpNftWithGameToken}
   */
  function mintLpNftWithGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 lpNftTokenId) {
    // Call ancestor
    uint256 gameTokenShare;
    uint256 assetTokenShare;
    uint128 liquidityAmount;
    (
      lpNftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    ) = _mintLpNftWithNumeratorToken(gameTokenAmount, recipient);

    // Dispatch event
    emit LpNftMinted(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      address(_uniswapV3NftManager),
      lpNftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    );

    return lpNftTokenId;
  }

  /**
   * @dev See {IGameTokenPooler-mintLpNftWithAssetToken}
   */
  function mintLpNftWithAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 lpNftTokenId) {
    // Call ancestor
    uint256 gameTokenShare;
    uint256 assetTokenShare;
    uint128 liquidityAmount;
    (
      lpNftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    ) = _mintLpNftWithDenominatorToken(assetTokenAmount, recipient);

    // Dispatch event
    emit LpNftMinted(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      address(_uniswapV3NftManager),
      lpNftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    );

    return lpNftTokenId;
  }

  /**
   * @dev See {IGameTokenPooler-mintLpNftImbalance}
   */
  function mintLpNftImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 lpNftTokenId) {
    // Call ancestor
    uint256 gameTokenShare;
    uint256 assetTokenShare;
    uint128 liquidityAmount;
    (
      lpNftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    ) = _mintLpNftImbalance(gameTokenAmount, assetTokenAmount, recipient);

    // Dispatch event
    emit LpNftMinted(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      address(_uniswapV3NftManager),
      lpNftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    );

    return lpNftTokenId;
  }

  /**
   * @dev See {IGameTokenPooler-collectFromLpNft}
   */
  function collectFromLpNft(
    uint256 lpNftTokenId,
    address recipient
  ) public override nonReentrant returns (uint256 assetTokenReturned) {
    // Call ancestor
    uint128 liquidityAmount;
    uint256 gameTokenCollected;
    uint256 assetTokenCollected;
    (
      liquidityAmount,
      gameTokenCollected,
      assetTokenCollected,
      assetTokenReturned
    ) = _collectFromLpNft(lpNftTokenId, recipient);

    // Dispatch event
    emit LpNftCollected(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      address(_uniswapV3NftManager),
      lpNftTokenId,
      liquidityAmount,
      gameTokenCollected,
      assetTokenCollected,
      assetTokenReturned
    );

    return assetTokenReturned;
  }

  /**
   * @dev See {IGameTokenPooler-exit}
   */
  function exit(
    uint256 lpNftTokenId
  ) public override nonReentrant returns (uint256 assetTokenReturned) {
    // Call ancestor
    uint128 liquidityAmount;
    uint256 gameTokenCollected;
    uint256 assetTokenCollected;
    (
      liquidityAmount,
      gameTokenCollected,
      assetTokenCollected,
      assetTokenReturned
    ) = _exitPooler(lpNftTokenId);

    // Dispatch event
    emit LpNftCollected(
      _msgSender(),
      _msgSender(),
      address(_numeratorToken),
      address(_denominatorToken),
      address(_uniswapV3NftManager),
      lpNftTokenId,
      liquidityAmount,
      gameTokenCollected,
      assetTokenCollected,
      assetTokenReturned
    );

    return assetTokenReturned;
  }
}
