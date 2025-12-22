/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai, { AssertionError } from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { setupFixture } from "../../src/testing/setupFixture";
import { YIELD_DECIMALS } from "../../src/utils/constants";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of ETH to start with
const INITIAL_ETH: string = "1"; // 1 ETH

// Amount of YIELD to give to the stake farm for rewards
const YIELD_REWARD_AMOUNT: bigint = ethers.parseUnits("10000", 18); // 10,000 YIELD

// Amount of BORROW to stake in the stake farm
const BORROW_LOAN_AMOUNT: bigint = ethers.parseUnits("100", 18); // 100 BORROW

// Duration of time to stake BORROW
const BORROW_LOAN_DURATION: number = 10 * 60; // 10 minutes

// Amount of YIELD to yield from staking BORROW
const YIELD_YIELD_AMOUNT: bigint =
  ethers.parseUnits("1", 18) * BigInt(BORROW_LOAN_DURATION); // 600 YIELD

//
// Test cases
//

describe("ERC20 Interest Farm", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const ERC20_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
    "ERC20_FARM_OPERATOR_ROLE",
  );

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let deployerAddress: `0x${string}`;
  let beneficiary: SignerWithAddress;
  let beneficiaryAddress: `0x${string}`;
  let addressBook: AddressBook;
  let deployerContracts: ContractLibrary;
  let beneficiaryContracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the deployer, which is the first account and used to
    // deploy the contracts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    deployerAddress = (await deployer.getAddress()) as `0x${string}`;
    beneficiary = signers[1];
    beneficiaryAddress = (await beneficiary.getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);

    // Get the contract libraries
    deployerContracts = getContractLibrary(deployer, addressBook);
    beneficiaryContracts = getContractLibrary(beneficiary, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Obtain ETH
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain ETH", async function (): Promise<void> {
    // Convert ETH to hex
    const balanceInWeiHex: string = ethers.toQuantity(
      ethers.parseEther(INITIAL_ETH),
    );

    await hardhat.network.provider.send("hardhat_setBalance", [
      beneficiaryAddress,
      balanceInWeiHex,
    ]);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should grant YIELD issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Grant issuer role to deployer
    await yieldContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should grant BORROW issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = deployerContracts;

    // Grant issuer role to deployer
    await borrowContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint YIELD reward to BORROW interest farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Mint YIELD
    await yieldContract.mint(
      addressBook.borrowInterestFarm!,
      YIELD_REWARD_AMOUNT,
    );
  });

  it("should mint BORROW principal to beneficiary", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = deployerContracts;

    // Mint BORROW
    await borrowContract.mint(beneficiaryAddress, BORROW_LOAN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20_FARM_OPERATOR_ROLE to beneficiary
  //////////////////////////////////////////////////////////////////////////////

  it("should grant ERC20_FARM_OPERATOR_ROLE to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowInterestFarmContract } = deployerContracts;

    // Approve YIELDStaker spending YIELD
    await borrowInterestFarmContract.grantRole(
      ERC20_FARM_OPERATOR_ROLE,
      deployerAddress,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the interest farm spending BORROW
  //////////////////////////////////////////////////////////////////////////////

  it("should allow interest farm to spend BORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = beneficiaryContracts;

    // Approve YIELDStaker spending YIELD
    await borrowContract.approve(
      addressBook.borrowInterestFarm!,
      BORROW_LOAN_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Stake BORROW
  //////////////////////////////////////////////////////////////////////////////

  it("should check empty interest farm", async function () {
    const { borrowInterestFarmContract } = beneficiaryContracts;

    const totalLiquidity: bigint =
      await borrowInterestFarmContract.totalLiquidity();
    chai.expect(totalLiquidity).to.equal(0n);
  });

  it("should loan BORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowInterestFarmContract } = deployerContracts;

    await borrowInterestFarmContract.recordLoan(
      beneficiaryAddress,
      BORROW_LOAN_AMOUNT,
    );
  });

  it("should check balance", async function (): Promise<void> {
    const { borrowInterestFarmContract } = beneficiaryContracts;

    const balanceAmount: bigint =
      await borrowInterestFarmContract.balanceOf(beneficiaryAddress);
    chai.expect(balanceAmount).to.equal(BORROW_LOAN_AMOUNT);
  });

  it("should check total loaned", async function () {
    const { borrowInterestFarmContract } = beneficiaryContracts;

    const totalLiquidity: bigint =
      await borrowInterestFarmContract.totalLiquidity();
    chai.expect(totalLiquidity).to.equal(BORROW_LOAN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Advance time and check reward
  //////////////////////////////////////////////////////////////////////////////

  it("should check for no staking reward", async function (): Promise<void> {
    const { borrowInterestFarmContract } = beneficiaryContracts;

    const rewardAmount: bigint =
      await borrowInterestFarmContract.earned(beneficiaryAddress);
    chai.expect(rewardAmount).to.equal(0n);
  });

  it("should advance time 10 minutes", async function () {
    // Increase the time 10 minutes
    await hardhat.network.provider.request({
      method: "evm_increaseTime",
      params: [BORROW_LOAN_DURATION],
    });

    // Mine the next block
    await hardhat.network.provider.request({
      method: "evm_mine",
      params: [],
    });
  });

  it("should check staking reward", async function (): Promise<void> {
    const { borrowInterestFarmContract } = beneficiaryContracts;

    const rewardAmount: bigint =
      await borrowInterestFarmContract.earned(beneficiaryAddress);

    try {
      chai.expect(rewardAmount).to.equal(YIELD_YIELD_AMOUNT);
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Handle small delay causing accrual of additional YIELD
        try {
          chai.expect(rewardAmount).to.equal(YIELD_YIELD_AMOUNT + 1n);
        } catch (error: unknown) {
          if (error instanceof AssertionError) {
            // Handle large delay causing accrual of additional YIELD
            chai
              .expect(rewardAmount)
              .to.equal(YIELD_YIELD_AMOUNT + ethers.parseUnits("1", 18));
          }
        }
      }
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Claim reward
  //////////////////////////////////////////////////////////////////////////////

  it("should claim reward", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowInterestFarmContract } = deployerContracts;

    await borrowInterestFarmContract.claimReward(beneficiaryAddress);
  });

  it("should check YIELD balances", async function () {
    const { yieldContract } = beneficiaryContracts;

    const beneficiaryBalance: bigint =
      await yieldContract.balanceOf(beneficiaryAddress);

    try {
      // Add 1 second of YIELD
      chai
        .expect(beneficiaryBalance)
        .to.equal(YIELD_YIELD_AMOUNT + ethers.parseUnits("1", YIELD_DECIMALS));
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Add 2 seconds of YIELD
        chai
          .expect(beneficiaryBalance)
          .to.equal(
            YIELD_YIELD_AMOUNT + ethers.parseUnits("2", YIELD_DECIMALS),
          );
      }
    }

    const remainingBalance: bigint = await yieldContract.balanceOf(
      addressBook.borrowInterestFarm!,
    );

    try {
      // Subtract 1 second of YIELD
      chai
        .expect(remainingBalance)
        .to.equal(
          YIELD_REWARD_AMOUNT -
            YIELD_YIELD_AMOUNT -
            ethers.parseUnits("1", YIELD_DECIMALS),
        );
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Subtract 2 seconds of YIELD
        chai
          .expect(remainingBalance)
          .to.equal(
            YIELD_REWARD_AMOUNT -
              YIELD_YIELD_AMOUNT -
              ethers.parseUnits("2", YIELD_DECIMALS),
          );
      }
    }
  });
});
