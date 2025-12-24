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

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { TestERC20MintableContract } from "../../src/interfaces/test/token/erc20/extensions/testErc20MintableContract";
import { TestPOW1MarketStakerContract } from "../../src/interfaces/test/token/routes/testPow1MarketStakerContract";
import { TestPOW5StableStakerContract } from "../../src/interfaces/test/token/routes/testPow5StableStakerContract";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import { TokenTracker } from "../../src/testing/tokenTracker";
import {
  INITIAL_LPPOW5_AMOUNT,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_LPYIELD_AMOUNT,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_DEPOSIT,
  INITIAL_POW5_PRICE,
  LPPOW5_DECIMALS,
  LPPOW5_POOL_FEE,
  LPYIELD_DECIMALS,
  LPYIELD_POOL_FEE,
  POW1_DECIMALS,
  POW5_DECIMALS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { getContractLibrary } from "../../src/utils/getContractLibrary";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";
import { getMaxTick, getMinTick } from "../../src/utils/tickMath";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// POW1 test reward for LPYIELD and LPPOW5 staking incentives, in wei of POW1
const LPYIELD_REWARD_AMOUNT: bigint = 1_000_000n;
const LPPOW5_REWARD_AMOUNT: bigint = 1_000n;

// Initial amount of WETH to deposit into the Dutch Auction
const WETH_TOKEN_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPYIELD_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH
const USDC_TOKEN_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// The LPYIELD and LPPOW5 LP-NFT token IDs
const POW1_LPNFT_TOKEN_ID: bigint = 1n;
const POW5_LPNFT_TOKEN_ID: bigint = 2n;

// Remaining dust balances after depositing into LP pools
const LPYIELD_POW1_DUST: bigint = 443n;
const LPYIELD_WETH_DUST: bigint = 0n;
const LPPOW5_POW5_DUST: bigint = 355_055n;
const LPPOW5_USDC_DUST: bigint = 0n;

//
// Debug parameters
//

// Debug option to print the NFT's image data URI
const DEBUG_PRINT_NFT_IMAGE: boolean = false;

//
// Test cases
//

describe("Token Pools", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const LPSFT_ISSUER_ROLE: string =
    ethers.encodeBytes32String("LPSFT_ISSUER_ROLE");

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let deployerAddress: `0x${string}`;
  let addressBook: AddressBook;
  let pow1IsToken0: boolean;
  let pow5IsToken0: boolean;
  let deployerContracts: ContractLibrary;
  let testPow1MarketStakerContract: TestPOW1MarketStakerContract;
  let testPow5StableStakerContract: TestPOW5StableStakerContract;

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

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);

    // Get the contract library
    deployerContracts = getContractLibrary(deployer, addressBook);

    // Create the test contracts
    testPow1MarketStakerContract = new TestPOW1MarketStakerContract(
      deployer,
      addressBook.testPow1MarketStakerContract!,
    );
    testPow5StableStakerContract = new TestPOW5StableStakerContract(
      deployer,
      addressBook.testPow5StableStakerContract!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Wrap into WETH for LPYIELD pool
  //////////////////////////////////////////////////////////////////////////////

  it("should wrap ETH for LPYIELD pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Wrap ETH
    await wrappedNativeContract.deposit(WETH_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint USDC for the LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC for LPPOW5 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const usdcContract: TestERC20MintableContract =
      new TestERC20MintableContract(deployer, addressBook.usdcToken!);

    // Mint USDC
    const receipt: ethers.ContractTransactionReceipt = await usdcContract.mint(
      deployerAddress,
      USDC_TOKEN_AMOUNT,
    );

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(1);

    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: usdcContract.address,
      from: ZERO_ADDRESS,
      to: deployerAddress,
      value: USDC_TOKEN_AMOUNT,
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint LPYIELD and LPPOW5 staking rewards
  //////////////////////////////////////////////////////////////////////////////

  it("should grant POW1 issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Grant issuer role to deployer
    await pow1Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint LPYIELD reward to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Mint POW1
    const receipt: ethers.ContractTransactionReceipt = await pow1Contract.mint(
      deployerAddress,
      LPYIELD_REWARD_AMOUNT,
    );

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(1);

    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: pow1Contract.address,
      from: ZERO_ADDRESS,
      to: deployerAddress,
      value: LPYIELD_REWARD_AMOUNT,
    });
  });

  it("should mint LPPOW5 reward to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Mint POW1
    const receipt: ethers.ContractTransactionReceipt = await pow1Contract.mint(
      deployerAddress,
      LPPOW5_REWARD_AMOUNT,
    );

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(1);

    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: pow1Contract.address,
      from: ZERO_ADDRESS,
      to: deployerAddress,
      value: LPPOW5_REWARD_AMOUNT,
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant POW1 issuer role to POW1Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have POW1 issuer role on POW1Staker", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await pow1Contract.hasRole(
      ERC20_ISSUER_ROLE,
      testPow1MarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant POW1 issuer role to POW1Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Grant issuer role to POW1Staker
    const receipt: ethers.ContractTransactionReceipt =
      await pow1Contract.grantRole(
        ERC20_ISSUER_ROLE,
        testPow1MarketStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow1Contract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(ERC20_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testPow1MarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have POW1 issuer role on POW1Staker", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await pow1Contract.hasRole(
      ERC20_ISSUER_ROLE,
      testPow1MarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant POW1 issuer role to POW5Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have POW1 issuer role on POW5Staker", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await pow1Contract.hasRole(
      ERC20_ISSUER_ROLE,
      testPow5StableStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant POW1 issuer role to POW5Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Grant issuer role to pow5StableStaker
    const receipt: ethers.ContractTransactionReceipt =
      await pow1Contract.grantRole(
        ERC20_ISSUER_ROLE,
        testPow5StableStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow1Contract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(ERC20_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testPow5StableStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have POW1 issuer role on POW5Staker", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await pow1Contract.hasRole(
      ERC20_ISSUER_ROLE,
      testPow5StableStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT issuer role to POW1Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have LPSFT issuer role on POW1Staker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testPow1MarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant LPSFT issuer role to POW1Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = deployerContracts;

    // Grant issuer role
    const receipt: ethers.ContractTransactionReceipt =
      await lpSftContract.grantRole(
        LPSFT_ISSUER_ROLE,
        testPow1MarketStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(lpSftContract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(LPSFT_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testPow1MarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have LPSFT issuer role on POW1Staker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testPow1MarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT issuer role to POW5Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have LPSFT issuer role on POW5Staker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testPow5StableStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant LPSFT issuer role to POW5Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = deployerContracts;

    // Grant issuer role
    const receipt: ethers.ContractTransactionReceipt =
      await lpSftContract.grantRole(
        LPSFT_ISSUER_ROLE,
        testPow5StableStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(lpSftContract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(LPSFT_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testPow5StableStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have LPSFT issuer role on on POW5Staker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testPow5StableStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20 issuer role to LPSFT
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPYIELD issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpYieldContract, lpSftContract } = deployerContracts;

    // Grant issuer role
    await lpYieldContract.grantRole(ERC20_ISSUER_ROLE, lpSftContract.address);
  });

  it("should grant LPPOW5 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow5Contract, lpSftContract } = deployerContracts;

    // Grant issuer role
    await lpPow5Contract.grantRole(ERC20_ISSUER_ROLE, lpSftContract.address);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve spending POW1 reward for LPYIELD staking incentive
  //////////////////////////////////////////////////////////////////////////////

  it("should approve spending POW1 for LPYIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Approve POW1Staker spending POW1
    const receipt: ethers.ContractTransactionReceipt =
      await pow1Contract.approve(
        testPow1MarketStakerContract.address,
        LPYIELD_REWARD_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow1Contract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testPow1MarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(LPYIELD_REWARD_AMOUNT);
  });

  it("should check POW1 allowance for LPYIELD", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check allowance
    const allowance: bigint = await pow1Contract.allowance(
      deployerAddress,
      testPow1MarketStakerContract.address,
    );
    chai.expect(allowance).to.equal(LPYIELD_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve spending POW1 reward for LPPOW5 staking incentive
  //////////////////////////////////////////////////////////////////////////////

  it("should approve spending POW5 for LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Approve POW5Staker spending POW1
    const receipt: ethers.ContractTransactionReceipt =
      await pow1Contract.approve(
        testPow5StableStakerContract.address,
        LPPOW5_REWARD_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow1Contract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testPow5StableStakerContract.address);
    chai.expect(log.args[2]).to.equal(LPPOW5_REWARD_AMOUNT);
  });

  it("should check POW1 allowance for LPPOW5", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check allowance
    const allowance: bigint = await pow1Contract.allowance(
      deployerAddress,
      testPow5StableStakerContract.address,
    );
    chai.expect(allowance).to.equal(LPPOW5_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPYIELD pool
  //////////////////////////////////////////////////////////////////////////////

  it("should create incentive for LPYIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Create incentive
    const receipt: ethers.ContractTransactionReceipt =
      await testPow1MarketStakerContract.createIncentive(LPYIELD_REWARD_AMOUNT);
    chai.expect(receipt.logs.length).to.equal(4);

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(2);

    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: addressBook.pow1Token,
      from: deployerAddress,
      to: testPow1MarketStakerContract.address,
      value: LPYIELD_REWARD_AMOUNT,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.pow1Token,
      from: testPow1MarketStakerContract.address,
      to: addressBook.uniswapV3Staker,
      value: LPYIELD_REWARD_AMOUNT,
    });
  });

  it("should check incentive for LPYIELD", async function (): Promise<void> {
    // Check incentive
    const incentive = await testPow1MarketStakerContract.getIncentive();
    chai.expect(incentive.totalRewardUnclaimed).to.equal(LPYIELD_REWARD_AMOUNT); // totalRewardUnclaimed
    chai.expect(incentive.totalSecondsClaimedX128).to.equal(0n); // totalSecondsClaimedX128
    chai.expect(incentive.numberOfStakes).to.equal(0n); // numberOfStakes
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should create incentive for LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Create incentive
    const receipt: ethers.ContractTransactionReceipt =
      await testPow5StableStakerContract.createIncentive(LPPOW5_REWARD_AMOUNT);

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.equal(4);

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(2);

    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: addressBook.pow1Token,
      from: deployerAddress,
      to: testPow5StableStakerContract.address,
      value: LPPOW5_REWARD_AMOUNT,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.pow1Token,
      from: testPow5StableStakerContract.address,
      to: addressBook.uniswapV3Staker,
      value: LPPOW5_REWARD_AMOUNT,
    });
  });

  it("should check incentive for LPPOW5", async function (): Promise<void> {
    // Check incentive
    const incentive = await testPow5StableStakerContract.getIncentive();
    chai.expect(incentive.totalRewardUnclaimed).to.equal(LPPOW5_REWARD_AMOUNT); // totalRewardUnclaimed
    chai.expect(incentive.totalSecondsClaimedX128).to.equal(0n); // totalSecondsClaimedX128
    chai.expect(incentive.numberOfStakes).to.equal(0n); // numberOfStakes
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPYIELD pool
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPYIELD", async function (): Promise<void> {
    const { pow1MarketPoolerContract } = deployerContracts;

    // Get pool token order
    pow1IsToken0 = await pow1MarketPoolerContract.gameIsToken0();
    chai.expect(pow1IsToken0).to.be.a("boolean");

    console.log(`    POW1 is ${pow1IsToken0 ? "token0" : "token1"}`);
  });

  it("should initialize the LPYIELD pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1MarketPoolContract } = deployerContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow1IsToken0 ? WETH_TOKEN_AMOUNT : INITIAL_POW1_SUPPLY,
      pow1IsToken0 ? INITIAL_POW1_SUPPLY : WETH_TOKEN_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const receipt: ethers.ContractTransactionReceipt =
      await pow1MarketPoolContract.initialize(INITIAL_PRICE);

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.equal(1);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow1MarketPoolContract.address);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW5", async function (): Promise<void> {
    const { pow5StablePoolerContract } = deployerContracts;

    // Get pool token order
    pow5IsToken0 = await pow5StablePoolerContract.gameIsToken0();
    chai.expect(pow5IsToken0).to.be.a("boolean");

    console.log(`    POW5 is ${pow5IsToken0 ? "token0" : "token1"}`);
  });

  it("should initialize the LPPOW5 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5StablePoolContract } = deployerContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow5IsToken0 ? USDC_TOKEN_AMOUNT : INITIAL_POW5_DEPOSIT,
      pow5IsToken0 ? INITIAL_POW5_DEPOSIT : USDC_TOKEN_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const receipt: ethers.ContractTransactionReceipt =
      await pow5StablePoolContract.initialize(INITIAL_PRICE);

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.equal(1);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the LPYIELD pool spending POW1 and WETH tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW1 and WETH balances", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Check POW1 balance
    const pow1Balance: bigint = await pow1Contract.balanceOf(deployerAddress);
    chai.expect(pow1Balance).to.equal(INITIAL_POW1_SUPPLY);

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);
    chai.expect(wethBalance).to.equal(WETH_TOKEN_AMOUNT);
  });

  it("should allow POW1Staker to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Approve POW1Staker spending POW1
    const receipt: ethers.ContractTransactionReceipt =
      await pow1Contract.approve(
        testPow1MarketStakerContract.address,
        INITIAL_POW1_SUPPLY,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow1Contract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testPow1MarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(INITIAL_POW1_SUPPLY);
  });

  it("should allow POW1Staker to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Approve POW1Staker spending WETH
    const receipt: ethers.ContractTransactionReceipt =
      await wrappedNativeContract.approve(
        testPow1MarketStakerContract.address,
        WETH_TOKEN_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(wrappedNativeContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testPow1MarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(WETH_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Stake POW1 and WETH tokens and mint LPYIELD LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW1/WETH LP-NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // TODO
    // const { lpSftContract } = deployerContracts;

    // Calculate DeFi metrics
    const pow1DepositAmount: number = parseInt(
      ethers.formatUnits(INITIAL_POW1_SUPPLY, POW1_DECIMALS),
    );
    const microWethDepositAmount: number = parseInt(
      ethers.formatEther(WETH_TOKEN_AMOUNT * 1_000_000n),
    );
    const pow1DepositValue: number = pow1DepositAmount * INITIAL_POW1_PRICE;
    const wethDepositValue: number =
      (microWethDepositAmount * ETH_PRICE) / 1_000_000.0; // TODO: Fix rounding

    // Log DeFi metrics
    console.log(
      `    Depositing: ${pow1DepositAmount.toLocaleString()} POW1 ($${pow1DepositValue.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${(
        microWethDepositAmount / 1_000_000.0
      ).toLocaleString()} ETH ($${wethDepositValue.toLocaleString()})`,
    );

    const receipt: ethers.ContractTransactionReceipt =
      await testPow1MarketStakerContract.stakeLpNftImbalance(
        INITIAL_POW1_SUPPLY, // gameTokenAmount
        WETH_TOKEN_AMOUNT, // assetTokenAmount
        deployerAddress, // recipient
      );

    // Check events
    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(19); // 20 events for perfectly balanced liquidity

    // Loop through logs looking for NFTStaked event
    for (const log of logs) {
      if (log instanceof ethers.EventLog) {
        const eventLog: ethers.EventLog = log as ethers.EventLog;
        if (log.fragment.name === "NFTStaked") {
          // Found the event
          chai
            .expect(eventLog.address)
            .to.equal(testPow1MarketStakerContract.address);
          chai.expect(eventLog.args.length).to.equal(4);
          chai.expect(eventLog.args[0]).to.equal(deployerAddress); // sender
          chai.expect(eventLog.args[1]).to.equal(deployerAddress); // recipient
          chai
            .expect(eventLog.args[2])
            .to.equal(addressBook.uniswapV3NftManager!); // nftAddress
          chai.expect(eventLog.args[3]).to.equal(POW1_LPNFT_TOKEN_ID); // nftTokenId
        }
      }
    }

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(10);

    // TODO
    /*
    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: addressBook.pow1Token,
      from: deployerAddress,
      to: testPow1MarketStakerContract.address,
      value: INITIAL_POW1_SUPPLY,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: deployerAddress,
      to: testPow1MarketStakerContract.address,
      value: WETH_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[2]).to.deep.equal({
      token: addressBook.pow1Token,
      from: testPow1MarketStakerContract.address,
      to: addressBook.pow1MarketPooler,
      value: INITIAL_POW1_SUPPLY,
    });

    chai.expect(tokenRoutes[3]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: testPow1MarketStakerContract.address,
      to: addressBook.pow1MarketPooler,
      value: WETH_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[4]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: addressBook.pow1MarketPooler,
      to: addressBook.pow1MarketPool,
      value: WETH_TOKEN_AMOUNT - 1n,
    });

    chai.expect(tokenRoutes[5]).to.deep.equal({
      token: addressBook.pow1Token,
      from: addressBook.pow1MarketPooler,
      to: addressBook.pow1MarketPool,
      value: INITIAL_POW1_SUPPLY - LPYIELD_POW1_DUST,
    });

    chai.expect(tokenRoutes[6]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: addressBook.pow1MarketPooler,
      to: testPow1MarketStakerContract.address,
      value: 1n,
    });

    chai.expect(tokenRoutes[7]).to.deep.equal({
      token: addressBook.pow1Token,
      from: addressBook.pow1MarketPooler,
      to: testPow1MarketStakerContract.address,
      value: LPYIELD_POW1_DUST,
    });

    chai.expect(tokenRoutes[8]).to.deep.equal({
      token: addressBook.lpYieldToken,
      from: ZERO_ADDRESS,
      to: await lpSftContract.tokenIdToAddress(POW1_LPNFT_TOKEN_ID),
      value: INITIAL_LPYIELD_AMOUNT,
    });

    chai.expect(tokenRoutes[9]).to.deep.equal({
      token: addressBook.pow1Token,
      from: testPow1MarketStakerContract.address,
      to: deployerAddress,
      value: LPYIELD_POW1_DUST,
    });
    */
  });

  it("should check LPYIELD LP-NFT position", async function (): Promise<void> {
    const { pow1Contract, uniswapV3NftManagerContract, wrappedNativeContract } =
      deployerContracts;

    // Calculate DeFi metrics
    const lpYieldPrice: number = INITIAL_POW5_PRICE;
    const lpYieldValue: number = parseInt(
      ethers.formatUnits(
        INITIAL_LPYIELD_AMOUNT / BigInt(1 / lpYieldPrice),
        LPYIELD_DECIMALS,
      ),
    );

    // Log DeFi metrics
    console.log(
      `    Minted: ${ethers
        .formatUnits(INITIAL_LPYIELD_AMOUNT, LPYIELD_DECIMALS)
        .toLocaleString()} LPYIELD ($${lpYieldValue.toLocaleString()})`,
    );

    const position: {
      nonce: bigint;
      operator: `0x${string}`;
      token0: `0x${string}`;
      token1: `0x${string}`;
      fee: number;
      tickLower: number;
      tickUpper: number;
      liquidity: bigint;
      feeGrowthInside0LastX128: bigint;
      feeGrowthInside1LastX128: bigint;
      tokensOwed0: bigint;
      tokensOwed1: bigint;
    } = await uniswapV3NftManagerContract.positions(POW1_LPNFT_TOKEN_ID);

    chai.expect(position).to.deep.equal({
      nonce: 0n,
      operator: ZERO_ADDRESS,
      token0: pow1IsToken0
        ? pow1Contract.address
        : wrappedNativeContract.address,
      token1: pow1IsToken0
        ? wrappedNativeContract.address
        : pow1Contract.address,
      fee: LPYIELD_POOL_FEE,
      tickLower: getMinTick(LPYIELD_POOL_FEE),
      tickUpper: getMaxTick(LPYIELD_POOL_FEE),
      liquidity: INITIAL_LPYIELD_AMOUNT,
      feeGrowthInside0LastX128: 0n,
      feeGrowthInside1LastX128: 0n,
      tokensOwed0: 0n,
      tokensOwed1: 0n,
    });
  });

  it("should check POW1 balances", async function (): Promise<void> {
    const { pow1Contract, pow1MarketPoolContract } = deployerContracts;

    const deployerBalance: bigint =
      await pow1Contract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPYIELD_POW1_DUST);

    // Log DeFi metrics
    console.log(
      `    Beneficiary POW1 dust: ${LPYIELD_POW1_DUST.toLocaleString()}`,
    );

    const pow1MarketPoolBalance: bigint = await pow1Contract.balanceOf(
      pow1MarketPoolContract.address as `0x${string}`,
    );
    chai
      .expect(pow1MarketPoolBalance)
      .to.equal(INITIAL_POW1_SUPPLY - LPYIELD_POW1_DUST);
  });

  it("should check WETH balances", async function (): Promise<void> {
    const { pow1MarketPoolContract, wrappedNativeContract } = deployerContracts;

    const deployerBalance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPYIELD_WETH_DUST);

    const pow1MarketPoolBalance: bigint = await wrappedNativeContract.balanceOf(
      pow1MarketPoolContract.address,
    );
    try {
      chai
        .expect(pow1MarketPoolBalance)
        .to.equal(WETH_TOKEN_AMOUNT - LPYIELD_WETH_DUST);
    } catch (error: unknown) {
      if (error instanceof chai.AssertionError) {
        // Handle rounding error
        chai
          .expect(pow1MarketPoolBalance)
          .to.equal(WETH_TOKEN_AMOUNT - LPYIELD_WETH_DUST - 1n);
      }
    }
  });

  it("should check LPYIELD LP-NFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = deployerContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Test ownerOf()
    const owner: `0x${string}` =
      await lpSftContract.ownerOf(POW1_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(deployerAddress);

    // Test getTokenIds()
    const deployerTokenIds: bigint[] =
      await lpSftContract.getTokenIds(deployerAddress);
    chai.expect(deployerTokenIds.length).to.equal(1);
    chai.expect(deployerTokenIds[0]).to.equal(POW1_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(POW1_LPNFT_TOKEN_ID);

    // Check that data URI has correct mime type
    chai.expect(nftTokenUri).to.match(/data:application\/json;base64,.+/);

    // Content should be valid JSON and structure
    const nftContent = extractJSONFromURI(nftTokenUri);
    if (!nftContent) {
      throw new Error("Failed to extract JSON from URI");
    }
    chai.expect(nftContent).to.haveOwnProperty("name").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("description").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("image").is.a("string");

    if (DEBUG_PRINT_NFT_IMAGE) {
      console.log(`    NFT image: ${nftContent.image}`);
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint POW5 for testing
  //////////////////////////////////////////////////////////////////////////////

  it("should grant POW5 issuer role", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = deployerContracts;

    // Grant issuer role to deployer
    await pow5Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint POW5 to deployer for testing", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = deployerContracts;

    // Mint POW5
    await pow5Contract.mint(deployerAddress, INITIAL_POW5_DEPOSIT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the LPPOW5 pool spending POW5 and USDC tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW5 and USDC balances", async function (): Promise<void> {
    const { pow5Contract, usdcContract } = deployerContracts;

    // Check POW5 balance
    const pow5Balance: bigint = await pow5Contract.balanceOf(deployerAddress);
    chai.expect(pow5Balance).to.equal(INITIAL_POW5_DEPOSIT);

    // Check USDC balance
    const usdcBalance: bigint = await usdcContract.balanceOf(deployerAddress);
    chai.expect(usdcBalance).to.equal(USDC_TOKEN_AMOUNT);
  });

  it("should allow POW5Staker to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = deployerContracts;

    // Approve POW5Staker spending POW5
    const receipt: ethers.ContractTransactionReceipt =
      await pow5Contract.approve(
        testPow5StableStakerContract.address,
        INITIAL_POW5_DEPOSIT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(pow5Contract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testPow5StableStakerContract.address);
    chai.expect(log.args[2]).to.equal(INITIAL_POW5_DEPOSIT);
  });

  it("should allow POW5Staker to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcContract } = deployerContracts;

    // Approve POW5Staker spending USDC
    const receipt: ethers.ContractTransactionReceipt =
      await usdcContract.approve(
        testPow5StableStakerContract.address,
        USDC_TOKEN_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(usdcContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testPow5StableStakerContract.address);
    chai.expect(log.args[2]).to.equal(USDC_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Deposit POW5 and USDC tokens and mint LPPOW5 LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW5/USDC LP-NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // TODO
    // const { lpSftContract } = deployerContracts;

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_DEPOSIT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      USDC_TOKEN_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_POW5_DEPOSIT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${ethers.formatUnits(
        USDC_TOKEN_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue.toLocaleString()})`,
    );

    const receipt: ethers.ContractTransactionReceipt =
      await testPow5StableStakerContract.stakeLpNftImbalance(
        INITIAL_POW5_DEPOSIT, // gameTokenAmount
        USDC_TOKEN_AMOUNT, // assetTokenAmount
        deployerAddress, // recipient
      );

    // Check events
    const logs: (ethers.EventLog | ethers.Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(19); // 20 events for perfectly balanced liquidity

    // Loop through logs looking for NFTStaked event
    for (const log of logs) {
      if (log instanceof ethers.EventLog) {
        const eventLog: ethers.EventLog = log as ethers.EventLog;
        if (log.fragment.name === "NFTStaked") {
          // Found the event
          chai
            .expect(eventLog.address)
            .to.equal(testPow5StableStakerContract.address);
          chai.expect(eventLog.args.length).to.equal(4);
          chai.expect(eventLog.args[0]).to.equal(deployerAddress); // sender
          chai.expect(eventLog.args[1]).to.equal(deployerAddress); // recipient
          chai
            .expect(eventLog.args[2])
            .to.equal(addressBook.uniswapV3NftManager!); // nftAddress
          chai.expect(eventLog.args[3]).to.equal(POW5_LPNFT_TOKEN_ID); // nftTokenId
        }
      }
    }

    // Check token transfers
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);
    chai.expect(tokenRoutes.length).to.equal(9);

    // TODO
    /*
    chai.expect(tokenRoutes[0]).to.deep.equal({
      token: addressBook.pow5Token,
      from: deployerAddress,
      to: testPow5StableStakerContract.address,
      value: INITIAL_POW5_DEPOSIT,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.usdcToken,
      from: deployerAddress,
      to: testPow5StableStakerContract.address,
      value: USDC_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[2]).to.deep.equal({
      token: addressBook.pow5Token,
      from: testPow5StableStakerContract.address,
      to: addressBook.pow5StablePooler,
      value: INITIAL_POW5_DEPOSIT,
    });

    chai.expect(tokenRoutes[3]).to.deep.equal({
      token: addressBook.usdcToken,
      from: testPow5StableStakerContract.address,
      to: addressBook.pow5StablePooler,
      value: USDC_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[4]).to.deep.equal({
      token: addressBook.pow5Token,
      from: addressBook.pow5StablePooler,
      to: addressBook.pow5StablePool,
      value: INITIAL_POW5_DEPOSIT - LPPOW5_POW5_DUST,
    });

    chai.expect(tokenRoutes[5]).to.deep.equal({
      token: addressBook.usdcToken,
      from: addressBook.pow5StablePooler,
      to: addressBook.pow5StablePool,
      value: USDC_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[6]).to.deep.equal({
      token: addressBook.pow5Token,
      from: addressBook.pow5StablePooler,
      to: testPow5StableStakerContract.address,
      value: LPPOW5_POW5_DUST,
    });

    chai.expect(tokenRoutes[7]).to.deep.equal({
      token: addressBook.lpPow5Token,
      from: ZERO_ADDRESS,
      to: await lpSftContract.tokenIdToAddress(POW5_LPNFT_TOKEN_ID),
      value: INITIAL_LPPOW5_AMOUNT,
    });

    chai.expect(tokenRoutes[8]).to.deep.equal({
      token: addressBook.pow5Token,
      from: testPow5StableStakerContract.address,
      to: deployerAddress,
      value: LPPOW5_POW5_DUST,
    });
    */
  });

  it("should check LPPOW5 LP-NFT position", async function (): Promise<void> {
    const { pow5Contract, uniswapV3NftManagerContract, usdcContract } =
      deployerContracts;

    /*
    // Calculate DeFi metrics
    const lpYieldPrice: number = INITIAL_POW5_PRICE;
    const lpYieldValue: number = parseInt(
      ethers.formatUnits(
        (INITIAL_LPYIELD_AMOUNT * 1n) / BigInt(1 / lpYieldPrice),
        LPYIELD_DECIMALS,
      ),
    );
    */

    // Log DeFi metrics
    console.log(
      `    Minted: ${ethers
        .formatUnits(INITIAL_LPPOW5_AMOUNT, LPPOW5_DECIMALS)
        .toLocaleString()} LPPOW5`,
    );

    const position: {
      nonce: bigint;
      operator: `0x${string}`;
      token0: `0x${string}`;
      token1: `0x${string}`;
      fee: number;
      tickLower: number;
      tickUpper: number;
      liquidity: bigint;
      feeGrowthInside0LastX128: bigint;
      feeGrowthInside1LastX128: bigint;
      tokensOwed0: bigint;
      tokensOwed1: bigint;
    } = await uniswapV3NftManagerContract.positions(POW5_LPNFT_TOKEN_ID);

    chai.expect(position).to.deep.equal({
      nonce: 0n,
      operator: ZERO_ADDRESS,
      token0: pow5IsToken0 ? pow5Contract.address : usdcContract.address,
      token1: pow5IsToken0 ? usdcContract.address : pow5Contract.address,
      fee: LPPOW5_POOL_FEE,
      tickLower: getMinTick(LPPOW5_POOL_FEE),
      tickUpper: getMaxTick(LPPOW5_POOL_FEE),
      liquidity: INITIAL_LPPOW5_AMOUNT,
      feeGrowthInside0LastX128: 0n,
      feeGrowthInside1LastX128: 0n,
      tokensOwed0: 0n,
      tokensOwed1: 0n,
    });
  });

  it("should check POW5 balances", async function (): Promise<void> {
    const { pow5Contract, pow5StablePoolContract } = deployerContracts;

    const deployerBalance: bigint =
      await pow5Contract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPPOW5_POW5_DUST);

    // Log DeFi metrics
    console.log(
      `    Beneficiary POW5 dust: ${LPPOW5_POW5_DUST.toLocaleString()}`,
    );

    const pow5StablePoolBalance: bigint = await pow5Contract.balanceOf(
      pow5StablePoolContract.address as `0x${string}`,
    );
    chai
      .expect(pow5StablePoolBalance)
      .to.equal(INITIAL_POW5_DEPOSIT - LPPOW5_POW5_DUST);
  });

  it("should check USDC balances", async function (): Promise<void> {
    const { pow5StablePoolContract, usdcContract } = deployerContracts;

    const deployerBalance: bigint =
      await usdcContract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPPOW5_USDC_DUST);

    const pow5StablePoolBalance: bigint = await usdcContract.balanceOf(
      pow5StablePoolContract.address,
    );
    chai
      .expect(pow5StablePoolBalance)
      .to.equal(USDC_TOKEN_AMOUNT - LPPOW5_USDC_DUST);
  });

  it("should check POW5 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = deployerContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: `0x${string}` =
      await lpSftContract.ownerOf(POW5_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(deployerAddress);

    // Test getTokenIds()
    const deployerTokenIds: bigint[] =
      await lpSftContract.getTokenIds(deployerAddress);
    chai.expect(deployerTokenIds.length).to.equal(2);
    chai.expect(deployerTokenIds[0]).to.equal(POW1_LPNFT_TOKEN_ID);
    chai.expect(deployerTokenIds[1]).to.equal(POW5_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(POW5_LPNFT_TOKEN_ID);

    // Check that data URI has correct mime type
    chai.expect(nftTokenUri).to.match(/data:application\/json;base64,.+/);

    // Content should be valid JSON and structure
    const nftContent = extractJSONFromURI(nftTokenUri);
    if (!nftContent) {
      throw new Error("Failed to extract JSON from URI");
    }
    chai.expect(nftContent).to.haveOwnProperty("name").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("description").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("image").is.a("string");

    if (DEBUG_PRINT_NFT_IMAGE) {
      console.log(`    NFT image: ${nftContent.image}`);
    }
  });
});
