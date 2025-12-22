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

import "../../../src/utils/math/LiquidityMath.sol";

/**
 * @dev Contract wrapper for testing liquidity math
 */
contract TestLiquidityMath {
  /**
   * @dev See {LiquidityMath-computeSwapAmountV2}
   */
  function computeSwapAmountV2(
    uint256 reserveA,
    uint256 amountA,
    uint24 swapFee
  ) external pure returns (uint256) {
    return LiquidityMath.computeSwapAmountV2(reserveA, amountA, swapFee);
  }
}
