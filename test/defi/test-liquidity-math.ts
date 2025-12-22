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

import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { ContractLibraryEthers } from "../../src/hardhat/contractLibraryEthers";
import { setupFixture } from "../../src/testing/setupFixture";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Reserve of token A
const RESERVE_A_AMOUNT: bigint = ethers.parseEther("1000");

// Amount of token A to add to the pool
const ADD_A_AMOUNT: bigint = ethers.parseEther("100");

// Swap fee, denominated in hundredths of a bip
const SWAP_FEE: number = 3_000; // 0.3% fee

// Correct amounts of A to swap
const A_SWAP_AMOUNT: bigint = 48_882_173_994_193_580_692n;
const A_SWAP_FEE: bigint = 73_325_824_042_033_701n;
const A_SWAP_AMOUNT_NO_FEE: bigint = A_SWAP_AMOUNT - A_SWAP_FEE;

//
// Test cases
//

describe("LiquidityMath", () => {
  let contracts: ContractLibraryEthers;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // A single fixture is used for the test suite
    contracts = await setupTest();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test liquidity math
  //////////////////////////////////////////////////////////////////////////////

  it("should correctly compute swap amount for V2 pools", async function (): Promise<void> {
    const { testLiquidityMathContract } = contracts;

    const swapAmountA: bigint =
      await testLiquidityMathContract.computeSwapAmountV2(
        RESERVE_A_AMOUNT,
        ADD_A_AMOUNT,
        SWAP_FEE,
      );
    chai.expect(swapAmountA).to.equal(A_SWAP_AMOUNT);
  });

  it("should handle zero amounts", async function (): Promise<void> {
    const { testLiquidityMathContract } = contracts;

    let swapAmountA: bigint =
      await testLiquidityMathContract.computeSwapAmountV2(
        0n,
        ADD_A_AMOUNT,
        SWAP_FEE,
      );
    chai.expect(swapAmountA).to.equal(0n);

    swapAmountA = await testLiquidityMathContract.computeSwapAmountV2(
      RESERVE_A_AMOUNT,
      0n,
      SWAP_FEE,
    );
    chai.expect(swapAmountA).to.equal(0n);

    swapAmountA = await testLiquidityMathContract.computeSwapAmountV2(
      0n,
      0n,
      SWAP_FEE,
    );
    chai.expect(swapAmountA).to.equal(0n);

    swapAmountA = await testLiquidityMathContract.computeSwapAmountV2(
      RESERVE_A_AMOUNT,
      ADD_A_AMOUNT,
      0,
    );
    chai.expect(swapAmountA).to.equal(A_SWAP_AMOUNT_NO_FEE);
  });
});
