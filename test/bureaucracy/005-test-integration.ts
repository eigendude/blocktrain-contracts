/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { PermissionManager } from "../../src/game/admin/permissionManager";
import { PoolManager } from "../../src/game/admin/poolManager";
import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { TestERC20MintableContract } from "../../src/interfaces/test/token/erc20/extensions/testErc20MintableContract";
import { ERC20Contract } from "../../src/interfaces/zeppelin/token/erc20/erc20Contract";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPBORROW_USDC_VALUE,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_DEPOSIT,
  INITIAL_YIELD_SUPPLY,
  USDC_DECIMALS,
  YIELD_DECIMALS,
} from "../../src/utils/constants";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of ETH to start with
const INITIAL_ETH: string = "1"; // 1 ETH

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPYIELD_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// Initial amount of USDC to deposit into the Reverse Repo
const INITIAL_USDC_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPBORROW_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// YIELD test reward for LPYIELD staking incentive
const LPYIELD_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", YIELD_DECIMALS); // 1,000 YIELD ($10)

// YIELD test reward for LPBORROW staking incentive
const LPBORROW_REWARD_AMOUNT: bigint = ethers.parseUnits(
  "1000",
  YIELD_DECIMALS,
); // 1,000 YIELD ($10)

// Token IDs of minted LP-NFTs
const LPYIELD_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau integration test", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");

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

    // Use ethers to get the accounts
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
  // Test setup: Initialize pools
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Uniswap V3 pools", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const poolManager: PoolManager = new PoolManager(deployer, {
      yieldToken: addressBook.yieldToken!,
      marketToken: addressBook.wrappedNativeToken!,
      yieldMarketPool: addressBook.yieldMarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });

    await poolManager.initializePools();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Grant roles
  //////////////////////////////////////////////////////////////////////////////

  it("should grant roles to contracts", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const permissionManager: PermissionManager = new PermissionManager(
      deployer,
      {
        yieldToken: addressBook.yieldToken!,
        pow5Token: addressBook.pow5Token!,
        lpYieldToken: addressBook.lpYieldToken!,
        lpBorrowToken: addressBook.lpBorrowToken!,
        debtToken: addressBook.debtToken!,
        lpSft: addressBook.lpSft!,
        noLpSft: addressBook.noLpSft!,
        dutchAuction: addressBook.dutchAuction!,
        yieldHarvest: addressBook.yieldHarvest!,
        liquidityForge: addressBook.liquidityForge!,
        reverseRepo: addressBook.reverseRepo!,
        yieldLpNftStakeFarm: addressBook.yieldLpNftStakeFarm!,
        pow5LpNftStakeFarm: addressBook.pow5LpNftStakeFarm!,
        yieldLpSftLendFarm: addressBook.yieldLpSftLendFarm!,
        pow5LpSftLendFarm: addressBook.pow5LpSftLendFarm!,
        defiManager: addressBook.defiManager!,
        pow5InterestFarm: addressBook.pow5InterestFarm!,
      },
    );

    const transactions: Array<ethers.ContractTransactionReceipt> =
      await permissionManager.initializeRoles();

    chai.expect(transactions.length).to.equal(11);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Obtain tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should grant YIELD minting role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract }: ContractLibrary = deployerContracts;

    await yieldContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should obtain tokens", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract, yieldLpSftLendFarmContract, wrappedNativeContract } =
      deployerContracts;
    const testErc20MintableContract: TestERC20MintableContract =
      new TestERC20MintableContract(deployer, addressBook.usdcToken!);

    // Deposit W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Mint YIELD
    await yieldContract.mint(
      yieldLpSftLendFarmContract.address,
      LPYIELD_REWARD_AMOUNT,
    );
    await yieldContract.mint(deployerAddress, LPBORROW_REWARD_AMOUNT);

    // Mint USDC
    await testErc20MintableContract.mint(deployerAddress, INITIAL_USDC_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Approve tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should approve tokens", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      dutchAuctionContract,
      yieldContract,
      pow5Contract,
      pow5LpNftStakeFarmContract,
      reverseRepoContract,
      wrappedNativeContract,
    } = deployerContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Approve Dutch Auction
    await yieldContract.approve(
      dutchAuctionContract.address,
      INITIAL_YIELD_SUPPLY,
    );
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      INITIAL_WETH_AMOUNT,
    );

    // Approve LPBORROW stake farm
    await yieldContract.approve(
      pow5LpNftStakeFarmContract.address,
      LPBORROW_REWARD_AMOUNT,
    );

    // Approve Reverse Repo
    await pow5Contract.approve(
      reverseRepoContract.address,
      INITIAL_POW5_DEPOSIT,
    );
    await usdcTokenContract.approve(
      reverseRepoContract.address,
      INITIAL_USDC_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize farms
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize farms", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5LpNftStakeFarmContract } = deployerContracts;

    // Create LPBORROW incentive
    await pow5LpNftStakeFarmContract.createIncentive(LPBORROW_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_YIELD_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Yield Harvest
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, yieldHarvestContract } = beneficiaryContracts;

    // Lend LP-SFT to YieldHarvest
    await lpSftContract.safeTransferFrom(
      beneficiaryAddress,
      yieldHarvestContract.address,
      LPYIELD_LPNFT_TOKEN_ID,
      1n,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Liquidity Forge
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;
    const { pow5Contract } = beneficiaryContracts;

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
      beneficiaryAddress, // receiver
    );

    // Transfer POW5 to deployer
    await pow5Contract.transfer(deployerAddress, INITIAL_POW5_DEPOSIT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test Setup: Initialize Reverse Repo
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Reverse Repo", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = deployerContracts;

    // Initialize ReverseRepo
    reverseRepoContract.initialize(
      INITIAL_POW5_DEPOSIT, // gameTokenAmount
      INITIAL_USDC_AMOUNT, // assetTokenAmount
      beneficiaryAddress, // receiver
    );
  });
});
