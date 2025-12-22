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

import chai from "chai";
import * as hardhat from "hardhat";

import { ContractLibraryEthers } from "../../src/hardhat/contractLibraryEthers";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  MAX_SQRT_RATIO,
  MAX_TICK,
  MIN_SQRT_RATIO,
  MIN_TICK,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test cases
//

describe("TickMath", () => {
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
  // Spec: Test constants
  //////////////////////////////////////////////////////////////////////////////

  it("should test tick math constants", async function (): Promise<void> {
    const { testTickMathContract } = contracts;

    const minTick: number = await testTickMathContract.MIN_TICK();
    chai.expect(minTick).to.equal(BigInt(MIN_TICK));

    const maxTick: number = await testTickMathContract.MAX_TICK();
    chai.expect(maxTick).to.equal(BigInt(MAX_TICK));

    const minSqrtRation: number = await testTickMathContract.MIN_SQRT_RATIO();
    chai.expect(minSqrtRation).to.equal(MIN_SQRT_RATIO);

    const maxSqrtRation: number = await testTickMathContract.MAX_SQRT_RATIO();
    chai.expect(maxSqrtRation).to.equal(MAX_SQRT_RATIO);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test tick math functions
  //////////////////////////////////////////////////////////////////////////////

  it("should correctly compute sqrt ratio at a given tick", async function (): Promise<void> {
    const { testTickMathContract } = contracts;

    const testTick: number = 0;

    const expectedSqrtPriceX96: bigint =
      await testTickMathContract.getSqrtRatioAtTick(testTick);
    chai.expect(expectedSqrtPriceX96).to.equal(encodePriceSqrt(1n, 1n));
  });

  it("should correctly compute the tick at a given sqrt ratio", async function (): Promise<void> {
    const { testTickMathContract } = contracts;

    const tickMin: number =
      await testTickMathContract.getTickAtSqrtRatio(MIN_SQRT_RATIO);
    chai.expect(tickMin).to.equal(BigInt(MIN_TICK));

    const tickMax: number = await testTickMathContract.getTickAtSqrtRatio(
      MAX_SQRT_RATIO - 1n,
    );
    chai.expect(tickMax).to.equal(BigInt(MAX_TICK - 1));
  });
});
