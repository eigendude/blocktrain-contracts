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

import { ethers } from "ethers";

/*
 * Constants
 */

////////////////////////////////////////////////////////////////////////////////
// Token constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The decimal count for POW1
 */
const POW1_DECIMALS: number = 18;

/**
 * @description The decimal count for POW5
 */
const POW5_DECIMALS: number = 16;

/**
 * @description The decimal count for LPYIELD
 */
const LPYIELD_DECIMALS: number = 16;

/**
 * @description The decimal count for LPPOW5
 */
const LPPOW5_DECIMALS: number = 9;

/**
 * @description The decimal count for DEBT
 */
const DEBT_DECIMALS: number = 16;

/**
 * @description The decimal count for USDC
 */
const USDC_DECIMALS: number = 6;

/**
 * @description The decimal count for W-ETH
 */
const WETH_DECIMALS: number = 18;

/**
 * @description The initial supply of POW1
 */
const INITIAL_POW1_SUPPLY: bigint = ethers.parseUnits("10000", POW1_DECIMALS); // 10,000 POW1 ($100)

/**
 * @description The initial pool deposit of POW5
 */
const INITIAL_POW5_DEPOSIT: bigint = ethers.parseUnits("2000", POW5_DECIMALS); // 2,000 POW1 ($100)

////////////////////////////////////////////////////////////////////////////////
// DeFi constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The initial price of POW1, in dollars
 */
const INITIAL_POW1_PRICE: number = 0.01; // $0.01

/**
 * @description The initial price of POW5, in dollars
 */
const INITIAL_POW5_PRICE: number = 0.05; // $0.05

/**
 * @description The initial value of WETH paired in the LPYIELD pool
 */
const INITIAL_LPYIELD_WETH_VALUE: number = 100; // $100

/**
 * @description The initial value of USDC paired in the LPPOW5 pool
 */
const INITIAL_LPPOW5_USDC_VALUE: number = 100; // $100

/**
 * @description The initial LPYIELD amount, sqrt(POW1 * WETH)
 */
const INITIAL_LPYIELD_AMOUNT: bigint = 20_036_097_492_521_525_709n; // 2,004 LPYIELD

/**
 * @description The initial POW5 amount
 */
const INITIAL_POW5_AMOUNT: bigint = ethers.parseUnits("2000", POW5_DECIMALS); // 2,000 POW5

/**
 * @description The initial LPPOW5 liquidity amount, sqrt(POW5 * USDC)
 */
const INITIAL_LPPOW5_AMOUNT: bigint = 44_721_359_549_995n; // 44 LPPOW5

////////////////////////////////////////////////////////////////////////////////
// Uniswap constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description Represents the minimum tick value for Uniswap pools
 *
 * Computed from log base 1.0001 of 2**-128.
 */
const MIN_TICK: number = -887272;

/**
 * @description Represents the maximum tick value for Uniswap pools
 *
 * Computed from log base 1.0001 of 2**128.
 */
const MAX_TICK: number = 887272;

/**
 * @description Represents the minimum square root ratio of token prices in
 * Uniswap pools
 *
 * Equivalent to getSqrtRatioAtTick(MIN_TICK).
 */
const MIN_SQRT_RATIO: bigint = 4295128739n;

/**
 * @description Represents the maximum square root ratio of token prices in
 * Uniswap pools
 *
 * Equivalent to getSqrtRatioAtTick(MAX_TICK).
 */
const MAX_SQRT_RATIO: bigint =
  1461446703485210103287273052203988822378723970342n;

/**
 * @description The fee amount for Uniswap V3 pools, in hundredths of a bip
 */
const enum UNI_V3_FEE_AMOUNT {
  LOW = 500, // 0.05%
  MEDIUM = 3_000, // 0.3%
  HIGH = 10_000, // 1%
}

/**
 * @description The tick spacings for Uniswap V3 pools
 */
const TICK_SPACINGS: { [amount in UNI_V3_FEE_AMOUNT]: number } = {
  [UNI_V3_FEE_AMOUNT.LOW]: 10,
  [UNI_V3_FEE_AMOUNT.MEDIUM]: 60,
  [UNI_V3_FEE_AMOUNT.HIGH]: 200,
};

/**
 * @description The fee for the LPYIELD pool
 */
const LPYIELD_POOL_FEE: UNI_V3_FEE_AMOUNT = UNI_V3_FEE_AMOUNT.HIGH;

/**
 * @description The fee for the LPPOW5 pool
 */
const LPPOW5_POOL_FEE: UNI_V3_FEE_AMOUNT = UNI_V3_FEE_AMOUNT.HIGH;

////////////////////////////////////////////////////////////////////////////////
// Utility constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The zero or absent address
 */
const ZERO_ADDRESS: `0x${string}` =
  "0x0000000000000000000000000000000000000000";

////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

export {
  INITIAL_LPYIELD_AMOUNT,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_LPPOW5_AMOUNT,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_DEPOSIT,
  INITIAL_POW5_PRICE,
  LPYIELD_DECIMALS,
  LPYIELD_POOL_FEE,
  LPPOW5_DECIMALS,
  LPPOW5_POOL_FEE,
  MAX_SQRT_RATIO,
  MAX_TICK,
  MIN_SQRT_RATIO,
  MIN_TICK,
  DEBT_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
  TICK_SPACINGS,
  UNI_V3_FEE_AMOUNT,
  USDC_DECIMALS,
  WETH_DECIMALS,
  ZERO_ADDRESS,
};
