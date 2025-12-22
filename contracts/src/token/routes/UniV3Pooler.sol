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

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {LiquidityMath} from "../../utils/math/LiquidityMath.sol";

import {UniV3Swapper} from "./UniV3Swapper.sol";

/**
 * @dev Token router send to liquidity to the Uniswap V3 pool in exchange for
 *      an LP-NFT
 */
abstract contract UniV3Pooler is Context, ERC721Holder, UniV3Swapper {
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  int24 private constant TICK_LOWER = -887200;

  int24 private constant TICK_UPPER = 887200;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager internal immutable _uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param numeratorToken_ The address of the numerator token of the pair
   * @param denominatorToken_ The address of the denominator token of the pair
   * @param uniswapV3Pool_ The address of the Uniswap V3 pool contract for the
   *        pair
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT
   *        manager
   */
  constructor(
    address numeratorToken_,
    address denominatorToken_,
    address uniswapV3Pool_,
    address uniswapV3NftManager_
  ) UniV3Swapper(numeratorToken_, denominatorToken_, uniswapV3Pool_) {
    // Validate parameters
    require(uniswapV3NftManager_ != address(0), "Invalid NFT mgr");

    // Initialize routes
    _uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints an LP-NFT and deposits liquidity into the pool using the
   * numerator token
   *
   * A swap will occur to allow for single-sided supply.
   *
   * @param numeratorTokenAmount The amounts of the numerator token to deposit
   * @param recipient The recipient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted NFT
   */
  function _mintLpNftWithNumeratorToken(
    uint256 numeratorTokenAmount,
    address recipient
  )
    internal
    returns (
      uint256 lpNftTokenId,
      uint256 numeratorTokenShare,
      uint256 denominatorTokenShare,
      uint128 liquidityAmount
    )
  {
    // Validate parameters
    require(numeratorTokenAmount > 0, "No numerator token");
    require(recipient != address(0), "Invalid recipient");

    // Receive numerator token
    _receiveNumeratorToken(numeratorTokenAmount);

    // Get numerator token reserve
    uint256 numeratorTokenReserve = _numeratorToken.balanceOf(
      address(_uniswapV3Pool)
    );

    // Get the pool fee
    uint24 poolFee = _uniswapV3Pool.fee();

    // Calculate numerator swap amount
    uint256 numeratorSwapAmount = LiquidityMath.computeSwapAmountV2(
      numeratorTokenReserve,
      numeratorTokenAmount,
      poolFee
    );
    require(numeratorSwapAmount <= numeratorTokenAmount, "Bad liquidity math");

    // Swap the numerator token into the denominator token
    uint256 denominatorTokenAmount = _swapNumeratorForDenominator(
      numeratorSwapAmount
    );

    // Update numerator token amount
    numeratorTokenAmount -= numeratorSwapAmount;

    // Mint the LP-NFT
    (
      lpNftTokenId,
      numeratorTokenShare,
      denominatorTokenShare,
      liquidityAmount
    ) = _mintLpNft(numeratorTokenAmount, denominatorTokenAmount, recipient);

    // Return any numerator or denominator token dust
    _returnDust(recipient);

    return (
      lpNftTokenId,
      numeratorTokenAmount,
      denominatorTokenAmount,
      liquidityAmount
    );
  }

  /**
   * @dev Mints an LP-NFT and deposits liquidity into the pool using the
   * denominator token
   *
   * A swap will occur to allow for single-sided supply.
   *
   * @param denominatorTokenAmount The amount of the denominator token to
   *        deposit
   * @param recipient The recipient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted NFT
   */
  function _mintLpNftWithDenominatorToken(
    uint256 denominatorTokenAmount,
    address recipient
  )
    internal
    returns (
      uint256 lpNftTokenId,
      uint256 numeratorTokenShare,
      uint256 denominatorTokenShare,
      uint128 liquidityAmount
    )
  {
    // Validate parameters
    require(denominatorTokenAmount > 0, "No denominator token");
    require(recipient != address(0), "Invalid recipient");

    // Receive denominator token
    _receiveDenominatorToken(denominatorTokenAmount);

    // Get denominator token reserve
    uint256 denominatorTokenReserve = _denominatorToken.balanceOf(
      address(_uniswapV3Pool)
    );

    // Get the pool fee
    uint24 poolFee = _uniswapV3Pool.fee();

    // Calculate denominator swap amount
    uint256 denominatorSwapAmount = LiquidityMath.computeSwapAmountV2(
      denominatorTokenReserve,
      denominatorTokenAmount,
      poolFee
    );
    require(
      denominatorSwapAmount <= denominatorTokenAmount,
      "Bad liquidity math"
    );

    // Swap the denominator token into the numerator token
    uint256 numeratorTokenAmount = _swapDenominatorForNumerator(
      denominatorSwapAmount
    );

    // Update denominator token amount
    denominatorTokenAmount -= denominatorSwapAmount;

    // Mint the LP-NFT
    (
      lpNftTokenId,
      numeratorTokenShare,
      denominatorTokenShare,
      liquidityAmount
    ) = _mintLpNft(numeratorTokenAmount, denominatorTokenAmount, recipient);

    // Return any numerator or denominator token dust
    _returnDust(recipient);

    return (
      lpNftTokenId,
      numeratorTokenAmount,
      denominatorTokenAmount,
      liquidityAmount
    );
  }

  /**
   * @dev Mints a Uniswap V3 LP-NFT and deposits liquidity into the pool
   * without performing a token swap
   *
   * @param numeratorTokenAmount The amount of the numerator token to deposit
   * @param denominatorTokenAmount The amount of the denominator token to deposit
   * @param recipient The recient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted NFT
   */
  function _mintLpNftImbalance(
    uint256 numeratorTokenAmount,
    uint256 denominatorTokenAmount,
    address recipient
  )
    internal
    returns (
      uint256 lpNftTokenId,
      uint256 numeratorTokenShare,
      uint256 denominatorTokenShare,
      uint128 liquidityAmount
    )
  {
    // Validate parameters
    require(
      numeratorTokenAmount > 0 || denominatorTokenAmount > 0,
      "No amounts"
    );
    require(recipient != address(0), "Invalid recipient");

    // Receive the tokens
    _receiveNumeratorToken(numeratorTokenAmount);
    _receiveDenominatorToken(denominatorTokenAmount);

    // Mint the LP-NFT
    (
      lpNftTokenId,
      numeratorTokenShare,
      denominatorTokenShare,
      liquidityAmount
    ) = _mintLpNft(numeratorTokenAmount, denominatorTokenAmount, recipient);

    // Return any numerator or denominator token dust
    _returnDust(recipient);

    return (
      lpNftTokenId,
      numeratorTokenAmount,
      denominatorTokenAmount,
      liquidityAmount
    );
  }

  /**
   * @dev Collects the tokens and fees from an LP-NFT and returns the
   * denominator token and empty LP-NFT to the recipient
   *
   * @param lpNftTokenId The ID of the LP-NFT
   * @param recipient The recipient of the fees and the LP-NFT
   *
   * @return liquidityAmount The amount of liquidity collected
   * @return numeratorTokenCollected The amount of the numerator token collected
   * @return denominatorTokenCollected The amount of the denominator token collected
   * @return denominatorTokenReturned The amount of the denominator token returned
   */
  function _collectFromLpNft(
    uint256 lpNftTokenId,
    address recipient
  )
    internal
    returns (
      uint128 liquidityAmount,
      uint256 numeratorTokenCollected,
      uint256 denominatorTokenCollected,
      uint256 denominatorTokenReturned
    )
  {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , liquidityAmount, , , , ) = _uniswapV3NftManager.positions(
      lpNftTokenId
    );

    // Collect tokens and fees from the LP-NFT
    (
      numeratorTokenCollected,
      denominatorTokenCollected
    ) = _collectTokensAndFees(lpNftTokenId, liquidityAmount);

    // Track token amount
    uint256 denominatorTokenAmount = denominatorTokenCollected;

    // Swap the numerator token for the denominator token
    if (numeratorTokenCollected > 0) {
      uint256 denominatorTokenBought = _sellNumeratorToken(
        numeratorTokenCollected,
        address(this)
      );

      // Update token balance
      denominatorTokenAmount += denominatorTokenBought;
    }

    // Return the denominator token from this contract
    _returnDenominatorToken(denominatorTokenAmount, recipient);

    // Return the LP-NFT to the recipient
    _uniswapV3NftManager.safeTransferFrom(
      _msgSender(),
      recipient,
      lpNftTokenId
    );

    return (
      liquidityAmount,
      numeratorTokenCollected,
      denominatorTokenCollected,
      denominatorTokenAmount
    );
  }

  /**
   * @dev Liquidates everything to the denominator token in one transaction and
   * returns the empty LP-NFT
   *
   * @param lpNftTokenId The ID of the LP-NFT
   *
   * @return liquidityAmount The amount of liquidity collected
   * @return numeratorTokenCollected The amount of the numerator token collected
   * @return denominatorTokenCollected The amount of the denominator token collected
   * @return denominatorTokenReturned The amount of the denominator token returned
   */
  function _exitPooler(
    uint256 lpNftTokenId
  )
    internal
    returns (
      uint128 liquidityAmount,
      uint256 numeratorTokenCollected,
      uint256 denominatorTokenCollected,
      uint256 denominatorTokenReturned
    )
  {
    // Collect and transfer the LP-NFT back to the sender
    (
      liquidityAmount,
      numeratorTokenCollected,
      denominatorTokenCollected,
      denominatorTokenReturned
    ) = _collectFromLpNft(lpNftTokenId, _msgSender());

    return (
      liquidityAmount,
      numeratorTokenCollected,
      denominatorTokenCollected,
      denominatorTokenReturned
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Approve the NFT manager to spend the tokens
   *
   * @param numeratorTokenAmount The amount of the numerator token to approve
   * @param denominatorTokenAmount The amount of the denominator token to approve
   */
  function _approveTokens(
    uint256 numeratorTokenAmount,
    uint256 denominatorTokenAmount
  ) private {
    // Call external contracts
    if (numeratorTokenAmount > 0) {
      _numeratorToken.safeIncreaseAllowance(
        address(_uniswapV3NftManager),
        numeratorTokenAmount
      );
    }
    if (denominatorTokenAmount > 0) {
      _denominatorToken.safeIncreaseAllowance(
        address(_uniswapV3NftManager),
        denominatorTokenAmount
      );
    }
  }

  /**
   * @dev Mint an LP-NFT
   *
   * @param numeratorTokenAmount The amount of the numerator token to add to the pool
   * @param denominatorTokenAmount The amount of the denominator token to add to the pool
   * @param recipient The recipient of the minted LP-NFT
   *
   * @return lpNftTokenId The ID of the minted LP-NFT
   * @return numeratorTokenShare The amount of the numerator token in the LP-NFT
   * @return denominatorTokenShare The amount of the denominator token in the LP-NFT
   * @return liquidityAmount The amount of liquidity in the LP-NFT
   */
  function _mintLpNft(
    uint256 numeratorTokenAmount,
    uint256 denominatorTokenAmount,
    address recipient
  )
    private
    returns (
      uint256 lpNftTokenId,
      uint256 numeratorTokenShare,
      uint256 denominatorTokenShare,
      uint128 liquidityAmount
    )
  {
    // Approve the NFT manager to spend the numerator and denominator tokens
    _approveTokens(numeratorTokenAmount, denominatorTokenAmount);

    // Get the pool fee
    uint24 poolFee = _uniswapV3Pool.fee();

    // Mint the LP-NFT
    uint256 amount0;
    uint256 amount1;
    (lpNftTokenId, liquidityAmount, amount0, amount1) = _uniswapV3NftManager
      .mint(
        INonfungiblePositionManager.MintParams({
          token0: _numeratorIsToken0
            ? address(_numeratorToken)
            : address(_denominatorToken),
          token1: _numeratorIsToken0
            ? address(_denominatorToken)
            : address(_numeratorToken),
          fee: poolFee,
          tickLower: TICK_LOWER,
          tickUpper: TICK_UPPER,
          amount0Desired: _numeratorIsToken0
            ? numeratorTokenAmount
            : denominatorTokenAmount,
          amount1Desired: _numeratorIsToken0
            ? denominatorTokenAmount
            : numeratorTokenAmount,
          amount0Min: 0,
          amount1Min: 0,
          recipient: recipient,
          // slither-disable-next-line timestamp
          deadline: block.timestamp
        })
      );

    // Calculate results
    numeratorTokenShare = _numeratorIsToken0 ? amount0 : amount1;
    denominatorTokenShare = _numeratorIsToken0 ? amount1 : amount0;

    return (
      lpNftTokenId,
      numeratorTokenShare,
      denominatorTokenShare,
      liquidityAmount
    );
  }

  /**
   * @dev Collect tokens and fees from an LP-NFT
   *
   * @param lpNftTokenId The ID of the LP-NFT
   * @param liquidityAmount The amount of liquidity to collect
   *
   * @return numeratorTokenCollected The amount of the numerator token collected
   * @return denominatorTokenCollected The amount of the denominator token collected
   */
  function _collectTokensAndFees(
    uint256 lpNftTokenId,
    uint128 liquidityAmount
  )
    private
    returns (uint256 numeratorTokenCollected, uint256 denominatorTokenCollected)
  {
    if (liquidityAmount > 0) {
      // Withdraw tokens from the pool
      // slither-disable-next-line unused-return
      _uniswapV3NftManager.decreaseLiquidity(
        INonfungiblePositionManager.DecreaseLiquidityParams({
          tokenId: lpNftTokenId,
          liquidity: liquidityAmount,
          amount0Min: 0,
          amount1Min: 0,
          // slither-disable-next-line timestamp
          deadline: block.timestamp
        })
      );
    }

    // Collect the tokens and fees
    (uint256 amount0, uint256 amount1) = _uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: lpNftTokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Calculate results
    numeratorTokenCollected = _numeratorIsToken0 ? amount0 : amount1;
    denominatorTokenCollected = _numeratorIsToken0 ? amount1 : amount0;

    return (numeratorTokenCollected, denominatorTokenCollected);
  }

  /**
   * @dev Return any numerator or denominator token dust to the recipient
   *
   * @param recipient The recipient of the dust
   */
  function _returnDust(address recipient) private {
    // Return the denominator token dust to the recipient
    uint256 denominatorTokenDust = _denominatorToken.balanceOf(address(this));
    if (denominatorTokenDust > 0) {
      _returnDenominatorToken(denominatorTokenDust, recipient);
    }

    // Return the numerator token dust to the recipient
    uint256 numeratorTokenDust = _numeratorToken.balanceOf(address(this));
    if (numeratorTokenDust > 0) {
      _returnNumeratorToken(numeratorTokenDust, recipient);
    }
  }
}
