/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the Uniswap V3 project after the BSL lapsed into
 * the GPL v2 license on 2023/04/01.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND GPL-2.0-or-later
 * See the file LICENSE.txt for more information.
 */

import {
  MAX_TICK,
  MIN_TICK,
  TICK_SPACINGS,
  UNI_V3_FEE_AMOUNT,
} from "./constants";

/**
 * @description Calculates the minimum tick that can be set for a given fee
 * tier in Uniswap V3 pools
 *
 * @param {UNI_V3_FEE_AMOUNT} fee - The fee tier of the pool
 *
 * @return {number} The minimum tick, aligned with the specified fee tier's
 * tick spacing
 */
function getMinTick(fee: UNI_V3_FEE_AMOUNT): number {
  const tickSpacing = TICK_SPACINGS[fee];
  return Math.ceil(MIN_TICK / tickSpacing) * tickSpacing;
}

/**
 * @description Calculates the maximum tick that can be set for a given
 * tier in Uniswap V3 pools
 *
 * @param {UNI_V3_FEE_AMOUNT} fee - The fee tier of the pool
 *
 * @return {number} The maximum tick, aligned with the specified fee tier's
 * tick spacing
 */
function getMaxTick(fee: UNI_V3_FEE_AMOUNT): number {
  const tickSpacing = TICK_SPACINGS[fee];
  return Math.floor(MAX_TICK / tickSpacing) * tickSpacing;
}

export { getMaxTick, getMinTick };
