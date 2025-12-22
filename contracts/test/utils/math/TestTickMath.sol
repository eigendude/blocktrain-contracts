/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Uniswap V3 project after the BSL lapsed
 * into the GPL v2 license on 2023/04/01.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND GPL-2.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {TickMath} from "../../../depends/uniswap-v3-core/libraries/TickMath.sol";

/**
 * @dev Helper contract for testing Uniswap V3 tick math computation
 */
contract TestTickMath {
  /**
   * @dev The minimum tick that may be passed to {getSqrtRatioAtTick}
   *
   * Computed from log base 1.0001 of 2**-128.
   */
  int24 public constant MIN_TICK = TickMath.MIN_TICK;

  /**
   * @dev The maximum tick that may be passed to {getSqrtRatioAtTick}
   *
   * Computed from log base 1.0001 of 2**128.
   */
  int24 public constant MAX_TICK = TickMath.MAX_TICK;

  /**
   * @dev The minimum value that can be returned from {getSqrtRatioAtTick}
   *
   * Equivalent to getSqrtRatioAtTick(MIN_TICK).
   */
  uint160 public constant MIN_SQRT_RATIO = TickMath.MIN_SQRT_RATIO;

  /**
   * @dev The maximum value that can be returned from {getSqrtRatioAtTick}
   *
   * Equivalent to getSqrtRatioAtTick(MAX_TICK).
   */
  uint160 public constant MAX_SQRT_RATIO = TickMath.MAX_SQRT_RATIO;

  /**
   * @dev Get the square root ratio at a tick
   *
   * Calculates sqrt(1.0001^tick) * 2^96.
   *
   * Throws if |tick| > max tick.
   *
   * @param tick The input tick for the above formula
   *
   * @return sqrtPriceX96 A Fixed point Q64.96 number representing the sqrt
   * of the ratio of the two assets (token1/token0)
   */
  function getSqrtRatioAtTick(
    int24 tick
  ) external pure returns (uint160 sqrtPriceX96) {
    sqrtPriceX96 = TickMath.getSqrtRatioAtTick(tick);
    return sqrtPriceX96;
  }

  /**
   * @dev Get the tick at a square root ratio
   *
   * Calculates the greatest tick value such that getRatioAtTick(tick) <= ratio.
   *
   * Throws in case sqrtPriceX96 < MIN_SQRT_RATIO, as MIN_SQRT_RATIO is the
   * lowest value getRatioAtTick may ever return.
   *
   * @param sqrtPriceX96 The sqrt ratio for which to compute the tick as a Q64.96
   *
   * @return tick The greatest tick for which the ratio is less than or equal
   *              to the input ratio
   */
  function getTickAtSqrtRatio(
    uint160 sqrtPriceX96
  ) external pure returns (int24 tick) {
    tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
    return tick;
  }
}
