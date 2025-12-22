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
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {IUniswapV3SwapCallback} from "../../../interfaces/uniswap-v3-core/callback/IUniswapV3SwapCallback.sol";
import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";

/**
 * @dev Token router to swap between the numerator token and a yielding denominator token
 */
abstract contract UniV3Swapper is Context, IUniswapV3SwapCallback {
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The minimum value that can be returned from {TickMath-getSqrtRatioAtTick}
   *
   * Equivalent to getSqrtRatioAtTick(MIN_TICK).
   */
  uint160 private constant MIN_SQRT_RATIO = 4295128739;

  /**
   * @dev The maximum value that can be returned from {TickMath-getSqrtRatioAtTick}
   *
   * Equivalent to getSqrtRatioAtTick(MAX_TICK).
   */
  uint160 private constant MAX_SQRT_RATIO =
    1461446703485210103287273052203988822378723970342;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The numerator token
   */
  IERC20 internal immutable _numeratorToken;

  /**
   * @dev The denominator token
   */
  IERC20 internal immutable _denominatorToken;

  /**
   * @dev The Uniswap V3 pool for the token pair
   */
  IUniswapV3Pool internal immutable _uniswapV3Pool;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev True if the numerator token is sorted first in the Uniswap V3 pool,
   * false otherwise
   */
  bool internal immutable _numeratorIsToken0;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param numeratorToken_ The address of the numerator token of the pair
   * @param denominatorToken_ The address of the denominator token of the pair
   * @param uniswapV3Pool_ The address of the Uniswap V3 pool contract for the pair
   */
  constructor(
    address numeratorToken_,
    address denominatorToken_,
    address uniswapV3Pool_
  ) {
    // Validate parameters
    require(numeratorToken_ != address(0), "Invalid numerator");
    require(denominatorToken_ != address(0), "Invalid denominator");
    require(uniswapV3Pool_ != address(0), "Invalid pool");

    // Read external contracts
    address token0 = IUniswapV3Pool(uniswapV3Pool_).token0();
    address token1 = IUniswapV3Pool(uniswapV3Pool_).token1();

    // Validate external contracts
    require(token0 != address(0), "Invalid token0");
    require(token1 != address(0), "Invalid token1");

    // Determine token order
    bool numeratorIsToken0_ = numeratorToken_ == token0;

    // Validate external contracts
    if (numeratorIsToken0_) {
      require(token0 == numeratorToken_, "Invalid token0 for num");
      require(token1 == denominatorToken_, "Invalid token1 for denom");
    } else {
      require(token0 == denominatorToken_, "Invalid token0 for denom");
      require(token1 == numeratorToken_, "Invalid token1 for num");
    }

    // Initialize routes
    _numeratorToken = IERC20(numeratorToken_);
    _denominatorToken = IERC20(denominatorToken_);
    _uniswapV3Pool = IUniswapV3Pool(uniswapV3Pool_);

    // Initialize state
    _numeratorIsToken0 = numeratorIsToken0_;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IUniswapV3SwapCallback}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IUniswapV3SwapCallback-uniswapV3SwapCallback}
   *
   * This function is called to the sender after a swap is executed on
   * Uniswap V3.
   *
   * The pool tokens owed for the swap must be payed. The caller of this
   * method must be checked to be a UniswapV3Pool deployed by the canonical
   * UniswapV3Factory.
   *
   * amount0Delta and amount1Delta can both be 0 if no tokens were swapped.
   */
  function uniswapV3SwapCallback(
    // slither-disable-next-line similar-names
    int256 amount0Delta,
    int256 amount1Delta,
    bytes calldata
  ) public override {
    // Validate caller
    require(_msgSender() == address(_uniswapV3Pool), "Invalid caller");

    // Pay fees
    if (amount0Delta > 0) {
      IERC20(IUniswapV3Pool(_msgSender()).token0()).safeTransfer(
        _msgSender(),
        uint256(amount0Delta)
      );
    }
    if (amount1Delta > 0) {
      IERC20(IUniswapV3Pool(_msgSender()).token1()).safeTransfer(
        _msgSender(),
        uint256(amount1Delta)
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal market interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Buy the numerator token, spending the denominator token
   *
   * @param denominatorTokenAmount Amount of the denominator token to spend
   * @param recipient Address to receive the numerator token
   *
   * @return numeratorTokenReturned Amount of the numerator token received
   */
  function _buyNumeratorToken(
    uint256 denominatorTokenAmount,
    address recipient
  ) internal returns (uint256 numeratorTokenReturned) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the denominator token
    _receiveDenominatorToken(denominatorTokenAmount);

    // Buy the numerator token
    numeratorTokenReturned = _swapDenominatorForNumerator(
      denominatorTokenAmount
    );

    // Return the numerator token
    _returnNumeratorToken(numeratorTokenReturned, recipient);

    return numeratorTokenReturned;
  }

  /**
   * @dev Sell the numerator token, receiving the denominator token
   *
   * @param numeratorTokenAmount Amount of the numerator token to spend
   * @param recipient Address to receive the denominator token
   *
   * @return denominatorTokenReturned Amount of the denominator token received
   */
  function _sellNumeratorToken(
    uint256 numeratorTokenAmount,
    address recipient
  ) internal returns (uint256 denominatorTokenReturned) {
    // Validate parameters
    require(numeratorTokenAmount > 0, "Invalid amount");
    require(recipient != address(0), "Invalid recipient");

    // Receive the numerator token
    _receiveNumeratorToken(numeratorTokenAmount);

    // Sell the numerator token
    denominatorTokenReturned = _swapNumeratorForDenominator(
      numeratorTokenAmount
    );

    // Return the denominator token
    _returnDenominatorToken(denominatorTokenReturned, recipient);

    return denominatorTokenReturned;
  }

  /**
   * @dev Exit the protocol, selling the numerator token for the denominator token
   *
   * @return numeratorTokenAmount Amount of the numerator token spent
   * @return denominatorTokenReturned Amount of the denominator token received
   */
  function _exitSwapper()
    internal
    returns (uint256 numeratorTokenAmount, uint256 denominatorTokenReturned)
  {
    // Read state
    numeratorTokenAmount = _numeratorToken.balanceOf(_msgSender());

    // Swap everything
    denominatorTokenReturned = _sellNumeratorToken(
      numeratorTokenAmount,
      _msgSender()
    );

    return (numeratorTokenAmount, denominatorTokenReturned);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal swapping interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swap the denominator token for the numerator token
   *
   * @param denominatorTokenAmount Amount of the denominator token to swap
   *
   * @return numeratorTokenReturned Amount of the numerator token received
   */
  function _swapDenominatorForNumerator(
    uint256 denominatorTokenAmount
  ) internal returns (uint256 numeratorTokenReturned) {
    // Approve Uniswap V3 pool to spend the denominator token
    _denominatorToken.safeIncreaseAllowance(
      address(_uniswapV3Pool),
      denominatorTokenAmount
    );

    //
    // Swap the denominator token for the numerator token
    //
    // A note about amount0 and amount1:
    //
    // amount0 is the delta of the balance of token0 of the pool
    // amount1 is the delta of the balance of token1 of the pool
    //
    // Amounts are exact when negative, minimum when positive.
    //
    bool zeroForOne = _numeratorIsToken0 ? false : true;
    (int256 amount0, int256 amount1) = _uniswapV3Pool.swap(
      address(this),
      zeroForOne,
      SafeCast.toInt256(denominatorTokenAmount),
      _numeratorIsToken0 ? MAX_SQRT_RATIO - 1 : MIN_SQRT_RATIO + 1, // TODO
      ""
    );

    // Calculate numerator token amount
    numeratorTokenReturned = _numeratorIsToken0
      ? SafeCast.toUint256(-amount0)
      : SafeCast.toUint256(-amount1);

    return numeratorTokenReturned;
  }

  /**
   * @dev Swap the numerator token for the denominator token
   *
   * @param numeratorTokenAmount Amount of the numerator token to swap
   *
   * @return denominatorTokenReturned Amount of the denominator token received
   */
  function _swapNumeratorForDenominator(
    uint256 numeratorTokenAmount
  ) internal returns (uint256 denominatorTokenReturned) {
    // Approve Uniswap V3 pool to spend the numerator token
    _numeratorToken.safeIncreaseAllowance(
      address(_uniswapV3Pool),
      numeratorTokenAmount
    );

    //
    // Swap the numerator token for the denominator token
    //
    // A note about amount0 and amount1:
    //
    // amount0 is the delta of the balance of token0 of the pool
    // amount1 is the delta of the balance of token1 of the pool
    //
    // Amounts are exact when negative, minimum when positive.
    //
    bool zeroForOne = _numeratorIsToken0 ? true : false;
    (int256 amount0, int256 amount1) = _uniswapV3Pool.swap(
      address(this),
      zeroForOne,
      SafeCast.toInt256(numeratorTokenAmount),
      _numeratorIsToken0 ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1, // TODO
      ""
    );

    // Calculate denominator token amount
    denominatorTokenReturned = _numeratorIsToken0
      ? SafeCast.toUint256(-amount1)
      : SafeCast.toUint256(-amount0);

    return denominatorTokenReturned;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal routing interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Procure the numerator token from the sender
   *
   * @param numeratorTokenAmount Amount of the numerator token to transfer
   */
  function _receiveNumeratorToken(uint256 numeratorTokenAmount) internal {
    // Call external contracts
    if (numeratorTokenAmount > 0) {
      _numeratorToken.safeTransferFrom(
        _msgSender(),
        address(this),
        numeratorTokenAmount
      );
    }
  }

  /**
   * @dev Procure the denominator token from the sender
   *
   * @param denominatorTokenAmount Amount of the denominator token to transfer
   */
  function _receiveDenominatorToken(uint256 denominatorTokenAmount) internal {
    // Call external contracts
    if (denominatorTokenAmount > 0) {
      _denominatorToken.safeTransferFrom(
        _msgSender(),
        address(this),
        denominatorTokenAmount
      );
    }
  }

  /**
   * @dev Return the numerator token to the recipient
   *
   * @param numeratorTokenAmount Amount of the numerator token to transfer
   * @param recipient Address to transfer the numerator token to
   */
  function _returnNumeratorToken(
    uint256 numeratorTokenAmount,
    address recipient
  ) internal {
    // Call external contracts
    if (numeratorTokenAmount > 0) {
      _numeratorToken.safeTransfer(recipient, numeratorTokenAmount);
    }
  }

  /**
   * @dev Return the denominator token to the recipient
   *
   * @param denominatorTokenAmount Amount of the denominator token to transfer
   * @param recipient Address to transfer the denominator token to
   */
  function _returnDenominatorToken(
    uint256 denominatorTokenAmount,
    address recipient
  ) internal {
    // Call external contracts
    if (denominatorTokenAmount > 0) {
      _denominatorToken.safeTransfer(recipient, denominatorTokenAmount);
    }
  }
}
