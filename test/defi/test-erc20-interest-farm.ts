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
import { POW1_DECIMALS } from "../../src/utils/constants";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of ETH to start with
const INITIAL_ETH: string = "1"; // 1 ETH

// Amount of POW1 to give to the stake farm for rewards
const POW1_REWARD_AMOUNT: bigint = ethers.parseUnits("10000", 18); // 10,000 POW1

// Amount of POW5 to stake in the stake farm
const POW5_LOAN_AMOUNT: bigint = ethers.parseUnits("100", 18); // 100 POW5

// Duration of time to stake POW5
const POW5_LOAN_DURATION: number = 10 * 60; // 10 minutes

// Amount of POW1 to yield from staking POW5
const POW1_YIELD_AMOUNT: bigint =
  ethers.parseUnits("1", 18) * BigInt(POW5_LOAN_DURATION); // 600 POW1

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

  it("should grant POW1 issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Grant issuer role to deployer
    await pow1Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should grant POW5 issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = deployerContracts;

    // Grant issuer role to deployer
    await pow5Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint POW1 reward to POW5 interest farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Mint POW1
    await pow1Contract.mint(addressBook.pow5InterestFarm!, POW1_REWARD_AMOUNT);
  });

  it("should mint POW5 principal to beneficiary", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = deployerContracts;

    // Mint POW5
    await pow5Contract.mint(beneficiaryAddress, POW5_LOAN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20_FARM_OPERATOR_ROLE to beneficiary
  //////////////////////////////////////////////////////////////////////////////

  it("should grant ERC20_FARM_OPERATOR_ROLE to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract } = deployerContracts;

    // Approve POW1Staker spending POW1
    await pow5InterestFarmContract.grantRole(
      ERC20_FARM_OPERATOR_ROLE,
      deployerAddress,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the interest farm spending POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should allow interest farm to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = beneficiaryContracts;

    // Approve POW1Staker spending POW1
    await pow5Contract.approve(addressBook.pow5InterestFarm!, POW5_LOAN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Stake POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check empty interest farm", async function () {
    const { pow5InterestFarmContract } = beneficiaryContracts;

    const totalLiquidity: bigint =
      await pow5InterestFarmContract.totalLiquidity();
    chai.expect(totalLiquidity).to.equal(0n);
  });

  it("should loan POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract } = deployerContracts;

    await pow5InterestFarmContract.recordLoan(
      beneficiaryAddress,
      POW5_LOAN_AMOUNT,
    );
  });

  it("should check balance", async function (): Promise<void> {
    const { pow5InterestFarmContract } = beneficiaryContracts;

    const balanceAmount: bigint =
      await pow5InterestFarmContract.balanceOf(beneficiaryAddress);
    chai.expect(balanceAmount).to.equal(POW5_LOAN_AMOUNT);
  });

  it("should check total loaned", async function () {
    const { pow5InterestFarmContract } = beneficiaryContracts;

    const totalLiquidity: bigint =
      await pow5InterestFarmContract.totalLiquidity();
    chai.expect(totalLiquidity).to.equal(POW5_LOAN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Advance time and check reward
  //////////////////////////////////////////////////////////////////////////////

  it("should check for no staking reward", async function (): Promise<void> {
    const { pow5InterestFarmContract } = beneficiaryContracts;

    const rewardAmount: bigint =
      await pow5InterestFarmContract.earned(beneficiaryAddress);
    chai.expect(rewardAmount).to.equal(0n);
  });

  it("should advance time 10 minutes", async function () {
    // Increase the time 10 minutes
    await hardhat.network.provider.request({
      method: "evm_increaseTime",
      params: [POW5_LOAN_DURATION],
    });

    // Mine the next block
    await hardhat.network.provider.request({
      method: "evm_mine",
      params: [],
    });
  });

  it("should check staking reward", async function (): Promise<void> {
    const { pow5InterestFarmContract } = beneficiaryContracts;

    const rewardAmount: bigint =
      await pow5InterestFarmContract.earned(beneficiaryAddress);

    try {
      chai.expect(rewardAmount).to.equal(POW1_YIELD_AMOUNT);
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Handle small delay causing accrual of additional POW1
        try {
          chai.expect(rewardAmount).to.equal(POW1_YIELD_AMOUNT + 1n);
        } catch (error: unknown) {
          if (error instanceof AssertionError) {
            // Handle large delay causing accrual of additional POW1
            chai
              .expect(rewardAmount)
              .to.equal(POW1_YIELD_AMOUNT + ethers.parseUnits("1", 18));
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

    const { pow5InterestFarmContract } = deployerContracts;

    await pow5InterestFarmContract.claimReward(beneficiaryAddress);
  });

  it("should check POW1 balances", async function () {
    const { pow1Contract } = beneficiaryContracts;

    const beneficiaryBalance: bigint =
      await pow1Contract.balanceOf(beneficiaryAddress);

    try {
      // Add 1 second of POW1
      chai
        .expect(beneficiaryBalance)
        .to.equal(POW1_YIELD_AMOUNT + ethers.parseUnits("1", POW1_DECIMALS));
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Add 2 seconds of POW1
        chai
          .expect(beneficiaryBalance)
          .to.equal(POW1_YIELD_AMOUNT + ethers.parseUnits("2", POW1_DECIMALS));
      }
    }

    const remainingBalance: bigint = await pow1Contract.balanceOf(
      addressBook.pow5InterestFarm!,
    );

    try {
      // Subtract 1 second of POW1
      chai
        .expect(remainingBalance)
        .to.equal(
          POW1_REWARD_AMOUNT -
            POW1_YIELD_AMOUNT -
            ethers.parseUnits("1", POW1_DECIMALS),
        );
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Subtract 2 seconds of POW1
        chai
          .expect(remainingBalance)
          .to.equal(
            POW1_REWARD_AMOUNT -
              POW1_YIELD_AMOUNT -
              ethers.parseUnits("2", POW1_DECIMALS),
          );
      }
    }
  });
});
