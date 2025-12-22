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
import { TestBORROWStableStakerContract } from "../../src/interfaces/test/token/routes/testBorrowStableStakerContract";
import { TestYIELDMarketStakerContract } from "../../src/interfaces/test/token/routes/testYieldMarketStakerContract";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import { TokenTracker } from "../../src/testing/tokenTracker";
import {
  BORROW_DECIMALS,
  INITIAL_BORROW_DEPOSIT,
  INITIAL_BORROW_PRICE,
  INITIAL_LPBORROW_AMOUNT,
  INITIAL_LPBORROW_USDC_VALUE,
  INITIAL_LPYIELD_AMOUNT,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_YIELD_PRICE,
  INITIAL_YIELD_SUPPLY,
  LPBORROW_DECIMALS,
  LPBORROW_POOL_FEE,
  LPYIELD_DECIMALS,
  LPYIELD_POOL_FEE,
  USDC_DECIMALS,
  YIELD_DECIMALS,
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

// YIELD test reward for LPYIELD and LPBORROW staking incentives, in wei of YIELD
const LPYIELD_REWARD_AMOUNT: bigint = 1_000_000n;
const LPBORROW_REWARD_AMOUNT: bigint = 1_000n;

// Initial amount of WETH to deposit into the Dutch Auction
const WETH_TOKEN_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPYIELD_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH
const USDC_TOKEN_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPBORROW_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// The LPYIELD and LPBORROW LP-NFT token IDs
const YIELD_LPNFT_TOKEN_ID: bigint = 1n;
const BORROW_LPNFT_TOKEN_ID: bigint = 2n;

// Remaining dust balances after depositing into LP pools
const LPYIELD_YIELD_DUST: bigint = 443n;
const LPYIELD_WETH_DUST: bigint = 0n;
const LPBORROW_BORROW_DUST: bigint = 355_055n;
const LPBORROW_USDC_DUST: bigint = 0n;

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
  let yieldIsToken0: boolean;
  let borrowIsToken0: boolean;
  let deployerContracts: ContractLibrary;
  let testYieldMarketStakerContract: TestYIELDMarketStakerContract;
  let testBorrowStableStakerContract: TestBORROWStableStakerContract;

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
    testYieldMarketStakerContract = new TestYIELDMarketStakerContract(
      deployer,
      addressBook.testYieldMarketStakerContract!,
    );
    testBorrowStableStakerContract = new TestBORROWStableStakerContract(
      deployer,
      addressBook.testBorrowStableStakerContract!,
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
  // Test setup: Mint USDC for the LPBORROW pool
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC for LPBORROW pool", async function (): Promise<void> {
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
  // Test setup: Mint LPYIELD and LPBORROW staking rewards
  //////////////////////////////////////////////////////////////////////////////

  it("should grant YIELD issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Grant issuer role to deployer
    await yieldContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint LPYIELD reward to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Mint YIELD
    const receipt: ethers.ContractTransactionReceipt = await yieldContract.mint(
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
      token: yieldContract.address,
      from: ZERO_ADDRESS,
      to: deployerAddress,
      value: LPYIELD_REWARD_AMOUNT,
    });
  });

  it("should mint LPBORROW reward to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Mint YIELD
    const receipt: ethers.ContractTransactionReceipt = await yieldContract.mint(
      deployerAddress,
      LPBORROW_REWARD_AMOUNT,
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
      token: yieldContract.address,
      from: ZERO_ADDRESS,
      to: deployerAddress,
      value: LPBORROW_REWARD_AMOUNT,
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant YIELD issuer role to YIELDStaker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have YIELD issuer role on YIELDStaker", async function (): Promise<void> {
    const { yieldContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await yieldContract.hasRole(
      ERC20_ISSUER_ROLE,
      testYieldMarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant YIELD issuer role to YIELDStaker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Grant issuer role to YIELDStaker
    const receipt: ethers.ContractTransactionReceipt =
      await yieldContract.grantRole(
        ERC20_ISSUER_ROLE,
        testYieldMarketStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(yieldContract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(ERC20_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testYieldMarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have YIELD issuer role on YIELDStaker", async function (): Promise<void> {
    const { yieldContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await yieldContract.hasRole(
      ERC20_ISSUER_ROLE,
      testYieldMarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant YIELD issuer role to BORROWStaker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have YIELD issuer role on BORROWStaker", async function (): Promise<void> {
    const { yieldContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await yieldContract.hasRole(
      ERC20_ISSUER_ROLE,
      testBorrowStableStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant YIELD issuer role to BORROWStaker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Grant issuer role to borrowStableStaker
    const receipt: ethers.ContractTransactionReceipt =
      await yieldContract.grantRole(
        ERC20_ISSUER_ROLE,
        testBorrowStableStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(yieldContract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(ERC20_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testBorrowStableStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have YIELD issuer role on BORROWStaker", async function (): Promise<void> {
    const { yieldContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await yieldContract.hasRole(
      ERC20_ISSUER_ROLE,
      testBorrowStableStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT issuer role to YIELDStaker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have LPSFT issuer role on YIELDStaker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testYieldMarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant LPSFT issuer role to YIELDStaker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = deployerContracts;

    // Grant issuer role
    const receipt: ethers.ContractTransactionReceipt =
      await lpSftContract.grantRole(
        LPSFT_ISSUER_ROLE,
        testYieldMarketStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(lpSftContract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(LPSFT_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testYieldMarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have LPSFT issuer role on YIELDStaker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testYieldMarketStakerContract.address,
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT issuer role to BORROWStaker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have LPSFT issuer role on BORROWStaker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testBorrowStableStakerContract.address,
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant LPSFT issuer role to BORROWStaker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = deployerContracts;

    // Grant issuer role
    const receipt: ethers.ContractTransactionReceipt =
      await lpSftContract.grantRole(
        LPSFT_ISSUER_ROLE,
        testBorrowStableStakerContract.address,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(lpSftContract.address);
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(LPSFT_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(testBorrowStableStakerContract.address);
    chai.expect(log.args[2]).to.equal(deployerAddress);
  });

  it("should have LPSFT issuer role on on BORROWStaker", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      testBorrowStableStakerContract.address,
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

  it("should grant LPBORROW issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpBorrowContract, lpSftContract } = deployerContracts;

    // Grant issuer role
    await lpBorrowContract.grantRole(ERC20_ISSUER_ROLE, lpSftContract.address);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve spending YIELD reward for LPYIELD staking incentive
  //////////////////////////////////////////////////////////////////////////////

  it("should approve spending YIELD for LPYIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Approve YIELDStaker spending YIELD
    const receipt: ethers.ContractTransactionReceipt =
      await yieldContract.approve(
        testYieldMarketStakerContract.address,
        LPYIELD_REWARD_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(yieldContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testYieldMarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(LPYIELD_REWARD_AMOUNT);
  });

  it("should check YIELD allowance for LPYIELD", async function (): Promise<void> {
    const { yieldContract } = deployerContracts;

    // Check allowance
    const allowance: bigint = await yieldContract.allowance(
      deployerAddress,
      testYieldMarketStakerContract.address,
    );
    chai.expect(allowance).to.equal(LPYIELD_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve spending YIELD reward for LPBORROW staking incentive
  //////////////////////////////////////////////////////////////////////////////

  it("should approve spending BORROW for LPBORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Approve BORROWStaker spending YIELD
    const receipt: ethers.ContractTransactionReceipt =
      await yieldContract.approve(
        testBorrowStableStakerContract.address,
        LPBORROW_REWARD_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(yieldContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testBorrowStableStakerContract.address);
    chai.expect(log.args[2]).to.equal(LPBORROW_REWARD_AMOUNT);
  });

  it("should check YIELD allowance for LPBORROW", async function (): Promise<void> {
    const { yieldContract } = deployerContracts;

    // Check allowance
    const allowance: bigint = await yieldContract.allowance(
      deployerAddress,
      testBorrowStableStakerContract.address,
    );
    chai.expect(allowance).to.equal(LPBORROW_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPYIELD pool
  //////////////////////////////////////////////////////////////////////////////

  it("should create incentive for LPYIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Create incentive
    const receipt: ethers.ContractTransactionReceipt =
      await testYieldMarketStakerContract.createIncentive(
        LPYIELD_REWARD_AMOUNT,
      );
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
      token: addressBook.yieldToken,
      from: deployerAddress,
      to: testYieldMarketStakerContract.address,
      value: LPYIELD_REWARD_AMOUNT,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.yieldToken,
      from: testYieldMarketStakerContract.address,
      to: addressBook.uniswapV3Staker,
      value: LPYIELD_REWARD_AMOUNT,
    });
  });

  it("should check incentive for LPYIELD", async function (): Promise<void> {
    // Check incentive
    const incentive = await testYieldMarketStakerContract.getIncentive();
    chai.expect(incentive.totalRewardUnclaimed).to.equal(LPYIELD_REWARD_AMOUNT); // totalRewardUnclaimed
    chai.expect(incentive.totalSecondsClaimedX128).to.equal(0n); // totalSecondsClaimedX128
    chai.expect(incentive.numberOfStakes).to.equal(0n); // numberOfStakes
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPBORROW pool
  //////////////////////////////////////////////////////////////////////////////

  it("should create incentive for LPBORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Create incentive
    const receipt: ethers.ContractTransactionReceipt =
      await testBorrowStableStakerContract.createIncentive(
        LPBORROW_REWARD_AMOUNT,
      );

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
      token: addressBook.yieldToken,
      from: deployerAddress,
      to: testBorrowStableStakerContract.address,
      value: LPBORROW_REWARD_AMOUNT,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.yieldToken,
      from: testBorrowStableStakerContract.address,
      to: addressBook.uniswapV3Staker,
      value: LPBORROW_REWARD_AMOUNT,
    });
  });

  it("should check incentive for LPBORROW", async function (): Promise<void> {
    // Check incentive
    const incentive = await testBorrowStableStakerContract.getIncentive();
    chai
      .expect(incentive.totalRewardUnclaimed)
      .to.equal(LPBORROW_REWARD_AMOUNT); // totalRewardUnclaimed
    chai.expect(incentive.totalSecondsClaimedX128).to.equal(0n); // totalSecondsClaimedX128
    chai.expect(incentive.numberOfStakes).to.equal(0n); // numberOfStakes
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPYIELD pool
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPYIELD", async function (): Promise<void> {
    const { yieldMarketPoolerContract } = deployerContracts;

    // Get pool token order
    yieldIsToken0 = await yieldMarketPoolerContract.gameIsToken0();
    chai.expect(yieldIsToken0).to.be.a("boolean");

    console.log(`    YIELD is ${yieldIsToken0 ? "token0" : "token1"}`);
  });

  it("should initialize the LPYIELD pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldMarketPoolContract } = deployerContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      yieldIsToken0 ? WETH_TOKEN_AMOUNT : INITIAL_YIELD_SUPPLY,
      yieldIsToken0 ? INITIAL_YIELD_SUPPLY : WETH_TOKEN_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const receipt: ethers.ContractTransactionReceipt =
      await yieldMarketPoolContract.initialize(INITIAL_PRICE);

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.equal(1);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(yieldMarketPoolContract.address);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPBORROW pool
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPBORROW", async function (): Promise<void> {
    const { borrowStablePoolerContract } = deployerContracts;

    // Get pool token order
    borrowIsToken0 = await borrowStablePoolerContract.gameIsToken0();
    chai.expect(borrowIsToken0).to.be.a("boolean");

    console.log(`    BORROW is ${borrowIsToken0 ? "token0" : "token1"}`);
  });

  it("should initialize the LPBORROW pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowStablePoolContract } = deployerContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      borrowIsToken0 ? USDC_TOKEN_AMOUNT : INITIAL_BORROW_DEPOSIT,
      borrowIsToken0 ? INITIAL_BORROW_DEPOSIT : USDC_TOKEN_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const receipt: ethers.ContractTransactionReceipt =
      await borrowStablePoolContract.initialize(INITIAL_PRICE);

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.equal(1);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the LPYIELD pool spending YIELD and WETH tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should check YIELD and WETH balances", async function (): Promise<void> {
    const { yieldContract, wrappedNativeContract } = deployerContracts;

    // Check YIELD balance
    const yieldBalance: bigint = await yieldContract.balanceOf(deployerAddress);
    chai.expect(yieldBalance).to.equal(INITIAL_YIELD_SUPPLY);

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);
    chai.expect(wethBalance).to.equal(WETH_TOKEN_AMOUNT);
  });

  it("should allow YIELDStaker to spend YIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Approve YIELDStaker spending YIELD
    const receipt: ethers.ContractTransactionReceipt =
      await yieldContract.approve(
        testYieldMarketStakerContract.address,
        INITIAL_YIELD_SUPPLY,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(yieldContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testYieldMarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(INITIAL_YIELD_SUPPLY);
  });

  it("should allow YIELDStaker to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Approve YIELDStaker spending WETH
    const receipt: ethers.ContractTransactionReceipt =
      await wrappedNativeContract.approve(
        testYieldMarketStakerContract.address,
        WETH_TOKEN_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(wrappedNativeContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testYieldMarketStakerContract.address);
    chai.expect(log.args[2]).to.equal(WETH_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Stake YIELD and WETH tokens and mint LPYIELD LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint YIELD/WETH LP-NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // TODO
    // const { lpSftContract } = deployerContracts;

    // Calculate DeFi metrics
    const yieldDepositAmount: number = parseInt(
      ethers.formatUnits(INITIAL_YIELD_SUPPLY, YIELD_DECIMALS),
    );
    const microWethDepositAmount: number = parseInt(
      ethers.formatEther(WETH_TOKEN_AMOUNT * 1_000_000n),
    );
    const yieldDepositValue: number = yieldDepositAmount * INITIAL_YIELD_PRICE;
    const wethDepositValue: number =
      (microWethDepositAmount * ETH_PRICE) / 1_000_000.0; // TODO: Fix rounding

    // Log DeFi metrics
    console.log(
      `    Depositing: ${yieldDepositAmount.toLocaleString()} YIELD ($${yieldDepositValue.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${(
        microWethDepositAmount / 1_000_000.0
      ).toLocaleString()} ETH ($${wethDepositValue.toLocaleString()})`,
    );

    const receipt: ethers.ContractTransactionReceipt =
      await testYieldMarketStakerContract.stakeLpNftImbalance(
        INITIAL_YIELD_SUPPLY, // gameTokenAmount
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
            .to.equal(testYieldMarketStakerContract.address);
          chai.expect(eventLog.args.length).to.equal(4);
          chai.expect(eventLog.args[0]).to.equal(deployerAddress); // sender
          chai.expect(eventLog.args[1]).to.equal(deployerAddress); // recipient
          chai
            .expect(eventLog.args[2])
            .to.equal(addressBook.uniswapV3NftManager!); // nftAddress
          chai.expect(eventLog.args[3]).to.equal(YIELD_LPNFT_TOKEN_ID); // nftTokenId
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
      token: addressBook.yieldToken,
      from: deployerAddress,
      to: testYieldMarketStakerContract.address,
      value: INITIAL_YIELD_SUPPLY,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: deployerAddress,
      to: testYieldMarketStakerContract.address,
      value: WETH_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[2]).to.deep.equal({
      token: addressBook.yieldToken,
      from: testYieldMarketStakerContract.address,
      to: addressBook.yieldMarketPooler,
      value: INITIAL_YIELD_SUPPLY,
    });

    chai.expect(tokenRoutes[3]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: testYieldMarketStakerContract.address,
      to: addressBook.yieldMarketPooler,
      value: WETH_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[4]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: addressBook.yieldMarketPooler,
      to: addressBook.yieldMarketPool,
      value: WETH_TOKEN_AMOUNT - 1n,
    });

    chai.expect(tokenRoutes[5]).to.deep.equal({
      token: addressBook.yieldToken,
      from: addressBook.yieldMarketPooler,
      to: addressBook.yieldMarketPool,
      value: INITIAL_YIELD_SUPPLY - LPYIELD_YIELD_DUST,
    });

    chai.expect(tokenRoutes[6]).to.deep.equal({
      token: addressBook.wrappedNativeToken,
      from: addressBook.yieldMarketPooler,
      to: testYieldMarketStakerContract.address,
      value: 1n,
    });

    chai.expect(tokenRoutes[7]).to.deep.equal({
      token: addressBook.yieldToken,
      from: addressBook.yieldMarketPooler,
      to: testYieldMarketStakerContract.address,
      value: LPYIELD_YIELD_DUST,
    });

    chai.expect(tokenRoutes[8]).to.deep.equal({
      token: addressBook.lpYieldToken,
      from: ZERO_ADDRESS,
      to: await lpSftContract.tokenIdToAddress(YIELD_LPNFT_TOKEN_ID),
      value: INITIAL_LPYIELD_AMOUNT,
    });

    chai.expect(tokenRoutes[9]).to.deep.equal({
      token: addressBook.yieldToken,
      from: testYieldMarketStakerContract.address,
      to: deployerAddress,
      value: LPYIELD_YIELD_DUST,
    });
    */
  });

  it("should check LPYIELD LP-NFT position", async function (): Promise<void> {
    const {
      yieldContract,
      uniswapV3NftManagerContract,
      wrappedNativeContract,
    } = deployerContracts;

    // Calculate DeFi metrics
    const lpYieldPrice: number = INITIAL_BORROW_PRICE;
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
    } = await uniswapV3NftManagerContract.positions(YIELD_LPNFT_TOKEN_ID);

    chai.expect(position).to.deep.equal({
      nonce: 0n,
      operator: ZERO_ADDRESS,
      token0: yieldIsToken0
        ? yieldContract.address
        : wrappedNativeContract.address,
      token1: yieldIsToken0
        ? wrappedNativeContract.address
        : yieldContract.address,
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

  it("should check YIELD balances", async function (): Promise<void> {
    const { yieldContract, yieldMarketPoolContract } = deployerContracts;

    const deployerBalance: bigint =
      await yieldContract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPYIELD_YIELD_DUST);

    // Log DeFi metrics
    console.log(
      `    Beneficiary YIELD dust: ${LPYIELD_YIELD_DUST.toLocaleString()}`,
    );

    const yieldMarketPoolBalance: bigint = await yieldContract.balanceOf(
      yieldMarketPoolContract.address as `0x${string}`,
    );
    chai
      .expect(yieldMarketPoolBalance)
      .to.equal(INITIAL_YIELD_SUPPLY - LPYIELD_YIELD_DUST);
  });

  it("should check WETH balances", async function (): Promise<void> {
    const { yieldMarketPoolContract, wrappedNativeContract } =
      deployerContracts;

    const deployerBalance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPYIELD_WETH_DUST);

    const yieldMarketPoolBalance: bigint =
      await wrappedNativeContract.balanceOf(yieldMarketPoolContract.address);
    try {
      chai
        .expect(yieldMarketPoolBalance)
        .to.equal(WETH_TOKEN_AMOUNT - LPYIELD_WETH_DUST);
    } catch (error: unknown) {
      if (error instanceof chai.AssertionError) {
        // Handle rounding error
        chai
          .expect(yieldMarketPoolBalance)
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
      await lpSftContract.ownerOf(YIELD_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(deployerAddress);

    // Test getTokenIds()
    const deployerTokenIds: bigint[] =
      await lpSftContract.getTokenIds(deployerAddress);
    chai.expect(deployerTokenIds.length).to.equal(1);
    chai.expect(deployerTokenIds[0]).to.equal(YIELD_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(YIELD_LPNFT_TOKEN_ID);

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
  // Test setup: Mint BORROW for testing
  //////////////////////////////////////////////////////////////////////////////

  it("should grant BORROW issuer role", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = deployerContracts;

    // Grant issuer role to deployer
    await borrowContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint BORROW to deployer for testing", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = deployerContracts;

    // Mint BORROW
    await borrowContract.mint(deployerAddress, INITIAL_BORROW_DEPOSIT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the LPBORROW pool spending BORROW and USDC tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should check BORROW and USDC balances", async function (): Promise<void> {
    const { borrowContract, usdcContract } = deployerContracts;

    // Check BORROW balance
    const borrowBalance: bigint =
      await borrowContract.balanceOf(deployerAddress);
    chai.expect(borrowBalance).to.equal(INITIAL_BORROW_DEPOSIT);

    // Check USDC balance
    const usdcBalance: bigint = await usdcContract.balanceOf(deployerAddress);
    chai.expect(usdcBalance).to.equal(USDC_TOKEN_AMOUNT);
  });

  it("should allow BORROWStaker to spend BORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = deployerContracts;

    // Approve BORROWStaker spending BORROW
    const receipt: ethers.ContractTransactionReceipt =
      await borrowContract.approve(
        testBorrowStableStakerContract.address,
        INITIAL_BORROW_DEPOSIT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(borrowContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testBorrowStableStakerContract.address);
    chai.expect(log.args[2]).to.equal(INITIAL_BORROW_DEPOSIT);
  });

  it("should allow BORROWStaker to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcContract } = deployerContracts;

    // Approve BORROWStaker spending USDC
    const receipt: ethers.ContractTransactionReceipt =
      await usdcContract.approve(
        testBorrowStableStakerContract.address,
        USDC_TOKEN_AMOUNT,
      );

    const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(usdcContract.address);
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(testBorrowStableStakerContract.address);
    chai.expect(log.args[2]).to.equal(USDC_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Deposit BORROW and USDC tokens and mint LPBORROW LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint BORROW/USDC LP-NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // TODO
    // const { lpSftContract } = deployerContracts;

    // Calculate DeFi properties
    const borrowValue: string = ethers.formatUnits(
      INITIAL_BORROW_DEPOSIT / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      USDC_TOKEN_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_BORROW_DEPOSIT,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${ethers.formatUnits(
        USDC_TOKEN_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue.toLocaleString()})`,
    );

    const receipt: ethers.ContractTransactionReceipt =
      await testBorrowStableStakerContract.stakeLpNftImbalance(
        INITIAL_BORROW_DEPOSIT, // gameTokenAmount
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
            .to.equal(testBorrowStableStakerContract.address);
          chai.expect(eventLog.args.length).to.equal(4);
          chai.expect(eventLog.args[0]).to.equal(deployerAddress); // sender
          chai.expect(eventLog.args[1]).to.equal(deployerAddress); // recipient
          chai
            .expect(eventLog.args[2])
            .to.equal(addressBook.uniswapV3NftManager!); // nftAddress
          chai.expect(eventLog.args[3]).to.equal(BORROW_LPNFT_TOKEN_ID); // nftTokenId
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
      token: addressBook.borrowToken,
      from: deployerAddress,
      to: testBorrowStableStakerContract.address,
      value: INITIAL_BORROW_DEPOSIT,
    });

    chai.expect(tokenRoutes[1]).to.deep.equal({
      token: addressBook.usdcToken,
      from: deployerAddress,
      to: testBorrowStableStakerContract.address,
      value: USDC_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[2]).to.deep.equal({
      token: addressBook.borrowToken,
      from: testBorrowStableStakerContract.address,
      to: addressBook.borrowStablePooler,
      value: INITIAL_BORROW_DEPOSIT,
    });

    chai.expect(tokenRoutes[3]).to.deep.equal({
      token: addressBook.usdcToken,
      from: testBorrowStableStakerContract.address,
      to: addressBook.borrowStablePooler,
      value: USDC_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[4]).to.deep.equal({
      token: addressBook.borrowToken,
      from: addressBook.borrowStablePooler,
      to: addressBook.borrowStablePool,
      value: INITIAL_BORROW_DEPOSIT - LPBORROW_BORROW_DUST,
    });

    chai.expect(tokenRoutes[5]).to.deep.equal({
      token: addressBook.usdcToken,
      from: addressBook.borrowStablePooler,
      to: addressBook.borrowStablePool,
      value: USDC_TOKEN_AMOUNT,
    });

    chai.expect(tokenRoutes[6]).to.deep.equal({
      token: addressBook.borrowToken,
      from: addressBook.borrowStablePooler,
      to: testBorrowStableStakerContract.address,
      value: LPBORROW_BORROW_DUST,
    });

    chai.expect(tokenRoutes[7]).to.deep.equal({
      token: addressBook.lpBorrowToken,
      from: ZERO_ADDRESS,
      to: await lpSftContract.tokenIdToAddress(BORROW_LPNFT_TOKEN_ID),
      value: INITIAL_LPBORROW_AMOUNT,
    });

    chai.expect(tokenRoutes[8]).to.deep.equal({
      token: addressBook.borrowToken,
      from: testBorrowStableStakerContract.address,
      to: deployerAddress,
      value: LPBORROW_BORROW_DUST,
    });
    */
  });

  it("should check LPBORROW LP-NFT position", async function (): Promise<void> {
    const { borrowContract, uniswapV3NftManagerContract, usdcContract } =
      deployerContracts;

    /*
    // Calculate DeFi metrics
    const lpYieldPrice: number = INITIAL_BORROW_PRICE;
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
        .formatUnits(INITIAL_LPBORROW_AMOUNT, LPBORROW_DECIMALS)
        .toLocaleString()} LPBORROW`,
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
    } = await uniswapV3NftManagerContract.positions(BORROW_LPNFT_TOKEN_ID);

    chai.expect(position).to.deep.equal({
      nonce: 0n,
      operator: ZERO_ADDRESS,
      token0: borrowIsToken0 ? borrowContract.address : usdcContract.address,
      token1: borrowIsToken0 ? usdcContract.address : borrowContract.address,
      fee: LPBORROW_POOL_FEE,
      tickLower: getMinTick(LPBORROW_POOL_FEE),
      tickUpper: getMaxTick(LPBORROW_POOL_FEE),
      liquidity: INITIAL_LPBORROW_AMOUNT,
      feeGrowthInside0LastX128: 0n,
      feeGrowthInside1LastX128: 0n,
      tokensOwed0: 0n,
      tokensOwed1: 0n,
    });
  });

  it("should check BORROW balances", async function (): Promise<void> {
    const { borrowContract, borrowStablePoolContract } = deployerContracts;

    const deployerBalance: bigint =
      await borrowContract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPBORROW_BORROW_DUST);

    // Log DeFi metrics
    console.log(
      `    Beneficiary BORROW dust: ${LPBORROW_BORROW_DUST.toLocaleString()}`,
    );

    const borrowStablePoolBalance: bigint = await borrowContract.balanceOf(
      borrowStablePoolContract.address as `0x${string}`,
    );
    chai
      .expect(borrowStablePoolBalance)
      .to.equal(INITIAL_BORROW_DEPOSIT - LPBORROW_BORROW_DUST);
  });

  it("should check USDC balances", async function (): Promise<void> {
    const { borrowStablePoolContract, usdcContract } = deployerContracts;

    const deployerBalance: bigint =
      await usdcContract.balanceOf(deployerAddress);
    chai.expect(deployerBalance).to.equal(LPBORROW_USDC_DUST);

    const borrowStablePoolBalance: bigint = await usdcContract.balanceOf(
      borrowStablePoolContract.address,
    );
    chai
      .expect(borrowStablePoolBalance)
      .to.equal(USDC_TOKEN_AMOUNT - LPBORROW_USDC_DUST);
  });

  it("should check BORROW LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = deployerContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      BORROW_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(deployerAddress);

    // Test getTokenIds()
    const deployerTokenIds: bigint[] =
      await lpSftContract.getTokenIds(deployerAddress);
    chai.expect(deployerTokenIds.length).to.equal(2);
    chai.expect(deployerTokenIds[0]).to.equal(YIELD_LPNFT_TOKEN_ID);
    chai.expect(deployerTokenIds[1]).to.equal(BORROW_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(BORROW_LPNFT_TOKEN_ID);

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
