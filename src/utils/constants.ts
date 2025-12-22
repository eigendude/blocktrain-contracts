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
 * @description The decimal count for YIELD
 */
const YIELD_DECIMALS: number = 18;

/**
 * @description The decimal count for BORROW
 */
const BORROW_DECIMALS: number = 16;

/**
 * @description The decimal count for LPYIELD
 */
const LPYIELD_DECIMALS: number = 16;

/**
 * @description The decimal count for LPBORROW
 */
const LPBORROW_DECIMALS: number = 9;

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
 * @description The initial supply of YIELD
 */
const INITIAL_YIELD_SUPPLY: bigint = ethers.parseUnits("10000", YIELD_DECIMALS); // 10,000 YIELD ($100)

/**
 * @description The initial pool deposit of BORROW
 */
const INITIAL_BORROW_DEPOSIT: bigint = ethers.parseUnits(
  "2000",
  BORROW_DECIMALS,
); // 2,000 BORROW ($100)

////////////////////////////////////////////////////////////////////////////////
// DeFi constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The initial price of YIELD, in dollars
 */
const INITIAL_YIELD_PRICE: number = 0.01; // $0.01

/**
 * @description The initial price of BORROW, in dollars
 */
const INITIAL_BORROW_PRICE: number = 0.05; // $0.05

/**
 * @description The initial value of WETH paired in the LPYIELD pool
 */
const INITIAL_LPYIELD_WETH_VALUE: number = 100; // $100

/**
 * @description The initial value of USDC paired in the LPBORROW pool
 */
const INITIAL_LPBORROW_USDC_VALUE: number = 100; // $100

/**
 * @description The initial LPYIELD amount, sqrt(YIELD * WETH)
 */
const INITIAL_LPYIELD_AMOUNT: bigint = 20_036_097_492_521_525_709n; // 2,004 LPYIELD

/**
 * @description The initial BORROW amount
 */
const INITIAL_BORROW_AMOUNT: bigint = ethers.parseUnits(
  "2000",
  BORROW_DECIMALS,
); // 2,000 BORROW

/**
 * @description The initial LPBORROW liquidity amount, sqrt(BORROW * USDC)
 */
const INITIAL_LPBORROW_AMOUNT: bigint = 44_721_359_549_995n; // 44 LPBORROW

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
 * @description The fee for the LPBORROW pool
 */
const LPBORROW_POOL_FEE: UNI_V3_FEE_AMOUNT = UNI_V3_FEE_AMOUNT.HIGH;

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
  INITIAL_LPBORROW_AMOUNT,
  INITIAL_LPBORROW_USDC_VALUE,
  INITIAL_YIELD_PRICE,
  INITIAL_YIELD_SUPPLY,
  INITIAL_BORROW_AMOUNT,
  INITIAL_BORROW_DEPOSIT,
  INITIAL_BORROW_PRICE,
  LPYIELD_DECIMALS,
  LPYIELD_POOL_FEE,
  LPBORROW_DECIMALS,
  LPBORROW_POOL_FEE,
  MAX_SQRT_RATIO,
  MAX_TICK,
  MIN_SQRT_RATIO,
  MIN_TICK,
  DEBT_DECIMALS,
  YIELD_DECIMALS,
  BORROW_DECIMALS,
  TICK_SPACINGS,
  UNI_V3_FEE_AMOUNT,
  USDC_DECIMALS,
  WETH_DECIMALS,
  ZERO_ADDRESS,
};
