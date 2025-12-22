/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
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

//
// Test cases
//

describe("RewardMath", () => {
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
  // Spec: Test reward math
  //////////////////////////////////////////////////////////////////////////////

  it("should correctly calculate reward per token", async function () {
    const { testRewardMathContract } = contracts;

    const rewardPerTokenStored: bigint = ethers.parseUnits("1", 18); // 1 token
    const secondsElapsed: bigint = 3600n; // 1 hour has elapsed
    const rewardRate: bigint = ethers.parseUnits("0.1", 18); // 0.1 tokens per second
    const totalStaked: bigint = ethers.parseUnits("100", 18); // 100 tokens staked
    const precision: bigint = ethers.WeiPerEther; // 10**18 for matching Solidity precision

    // Calculate the additional reward per token
    const additionalRewardPerToken =
      (rewardRate * secondsElapsed * precision) / totalStaked;

    // Expected reward per token is the stored value plus the newly calculated additional reward per token
    const expectedRewardPerToken =
      rewardPerTokenStored + additionalRewardPerToken;

    const actualRewardPerToken =
      await testRewardMathContract.calculateRewardPerToken(
        rewardPerTokenStored,
        secondsElapsed,
        rewardRate,
        totalStaked,
      );

    chai
      .expect(actualRewardPerToken.toString())
      .to.equal(expectedRewardPerToken.toString());
  });

  it("should correctly calculate earned rewards", async function () {
    const { testRewardMathContract } = contracts;

    const staked: bigint = ethers.parseUnits("50", 18); // 50 tokens staked
    const rewardPerToken: bigint = ethers.parseUnits("2", 18); // Current reward per token is 2
    const userRewardPerTokenPaid: bigint = ethers.parseUnits("1", 18); // User's last recorded reward per token
    const accruedRewards: bigint = ethers.parseUnits("10", 18); // Rewards already accrued for the user

    // Calculate the reward difference per token since the user's last update
    const rewardDifference = rewardPerToken - userRewardPerTokenPaid;

    // Calculate the new rewards earned based on the staked amount and the reward difference
    const newRewards = (staked * rewardDifference) / ethers.WeiPerEther;

    // Calculate the expected total earned rewards by adding new rewards to previously accrued rewards
    const expectedEarnedRewards = newRewards + accruedRewards;

    const actualEarnedRewards = await testRewardMathContract.calculateEarned(
      staked,
      rewardPerToken,
      userRewardPerTokenPaid,
      accruedRewards,
    );

    chai
      .expect(actualEarnedRewards.toString())
      .to.equal(expectedEarnedRewards.toString());
  });
});
