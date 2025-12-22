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

import BigNumber from "bignumber.js";

// Setup bignuber.js
BigNumber.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

/**
 * @description Decodes a 128-bit fixed-point number to a bigint
 *
 * This function is used to convert blockchain-stored fixed-point numbers
 * into a more manageable bigint format for further computation or display.
 *
 * @param {bigint} x128Int - The 128-bit fixed-point number to be decoded
 *
 * @return {bigint} The decoded bigint, representing the original value
 *                  adjusted from the 128-bit fixed-point format
 */
function decodeX128Int(x128Int: bigint): bigint {
  return x128Int / 2n ** 128n;
}

/**
 * @description Returns the sqrt price as a 64x96
 *
 * This function encodes the square root of the ratio of two reserve values
 * into a fixed-point format.
 *
 * The square root of the ratio between two token reserves is computed, which
 * is often used in automated market maker algorithms to determine pricing.
 *
 * The result is scaled up by 2^96 to conform to fixed-point arithmetic
 * standards used in blockchain applications.
 *
 * @param {bigint} reserve1 - The reserve amount of the first token
 * @param {bigint} reserve0 - The reserve amount of the second token
 *
 * @return {bigint} The square root of the ratio of reserve1 to reserve0, scaled
 *                  by 2^96. Returns 0 if reserve0 is 0 to prevent division by
 *                  zero errors.
 */
function encodePriceSqrt(reserve1: bigint, reserve0: bigint): bigint {
  // Prevent division by zero
  if (reserve0 === 0n) {
    return 0n;
  }

  // Calculate the price ratio
  const priceRatio: BigNumber = new BigNumber(reserve1.toString()).dividedBy(
    reserve0.toString(),
  );

  // Calculate the square root of the price ratio
  const sqrtPrice: BigNumber = priceRatio.sqrt();

  // Scale the result by 2^96
  const scaledPrice: BigNumber = sqrtPrice.multipliedBy(
    new BigNumber(2).pow(96),
  );

  // Converting the result back to a bigint
  return BigInt(scaledPrice.integerValue(BigNumber.ROUND_DOWN).toString());
}

export { decodeX128Int, encodePriceSqrt };
