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
import { ETH_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPYIELD_AMOUNT,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_PRICE,
  INITIAL_YIELD_SUPPLY,
  LPYIELD_DECIMALS,
  POW5_DECIMALS,
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

// YIELD test reward for LPYIELD staking incentive
const LPYIELD_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", YIELD_DECIMALS); // 1,000 YIELD ($10)

// Token IDs of minted LP-NFTs
const LPYIELD_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau 3: Liquidity Forge", () => {
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

    // Get the contract library
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
  // Spec: Initialize the LPYIELD pool
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize the LPYIELD pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const poolManager: PoolManager = new PoolManager(deployer, {
      yieldToken: addressBook.yieldToken!,
      marketToken: addressBook.wrappedNativeToken!,
      yieldMarketPool: addressBook.yieldMarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });

    const transactions: Array<ethers.ContractTransactionReceipt> =
      await poolManager.initializePools();

    chai.expect(transactions.length).to.equal(2);
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
  // Test setup: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract, yieldContract, wrappedNativeContract } =
      deployerContracts;

    // Obtain tokens
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Approve tokens
    await yieldContract.approve(
      addressBook.dutchAuction!,
      INITIAL_YIELD_SUPPLY,
    );
    await wrappedNativeContract.approve(
      addressBook.dutchAuction!,
      INITIAL_WETH_AMOUNT,
    );

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

    const { yieldContract } = deployerContracts;
    const { lpSftContract } = beneficiaryContracts;

    // Grant roles
    await yieldContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);

    // Mint YIELD to the YIELD LP-SFT lend farm
    await yieldContract.mint(
      addressBook.yieldLpSftLendFarm!,
      LPYIELD_REWARD_AMOUNT,
    );

    // Lend LP-SFT to YieldHarvest
    await lpSftContract.safeTransferFrom(
      beneficiaryAddress,
      addressBook.yieldHarvest!,
      LPYIELD_LPNFT_TOKEN_ID,
      1n,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Borrow POW5 from LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to exceed 100x collateralization ratio", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;

    // Borrow POW5 from LiquidityForge
    try {
      await liquidityForgeContract.borrowPow5(
        LPYIELD_LPNFT_TOKEN_ID, // tokenId
        INITIAL_LPYIELD_AMOUNT + 1n, // amount
        beneficiaryAddress, // receiver
      );
      chai.assert.fail("Expected an error");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  it("should check YIELD LP-SFT LPPOW balance", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Calculate DeFi properties
    const lpYieldValue: string = ethers.formatUnits(
      INITIAL_LPYIELD_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      LPYIELD_DECIMALS,
    );

    console.log(
      `    LP-SFT LPYIELD balance: ${ethers.formatUnits(
        INITIAL_LPYIELD_AMOUNT,
        LPYIELD_DECIMALS,
      )} LPYIELD ($${lpYieldValue.toLocaleString()})`,
    );
  });

  it("should borrow POW5 from LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    console.log(
      `    Borrowing POW5: ${ethers.formatUnits(
        INITIAL_POW5_AMOUNT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after borrowing POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after borrowing POW5", async function (): Promise<void> {
    const { defiManagerContract, pow5Contract } = beneficiaryContracts;

    const pow5Amount: bigint = await pow5Contract.balanceOf(beneficiaryAddress);
    chai.expect(pow5Amount).to.equal(INITIAL_POW5_AMOUNT);

    const debtAmount: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );
    chai.expect(debtAmount).to.equal(INITIAL_POW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test withdrawing LP-SFT before POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to withdraw LP-SFT before POW5 loan is repaid", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract } = beneficiaryContracts;

    // Attempt to withdraw LP-SFT before POW5 loan is repaid
    try {
      await noLpSftContract.safeTransferFrom(
        beneficiaryAddress,
        addressBook.yieldHarvest!,
        LPYIELD_LPNFT_TOKEN_ID,
        1n,
      );
      chai.assert.fail("Expected an error");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve LiquidityForge to spend POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should approve LiquidityForge to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = beneficiaryContracts;

    // Approve LiquidityForge to spend POW5
    await pow5Contract.approve(
      addressBook.liquidityForge!,
      INITIAL_POW5_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Repay POW5 loan
  //////////////////////////////////////////////////////////////////////////////

  it("should repay POW5 loan", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;
    // Repay POW5 loan
    await liquidityForgeContract.repayPow5(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after repaying POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract, pow5Contract } = beneficiaryContracts;

    const pow5Amount: bigint = await pow5Contract.balanceOf(deployerAddress);
    chai.expect(pow5Amount).to.equal(0n);

    const debtAmount: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );
    chai.expect(debtAmount).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT after POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest after POW5 loan is repaid", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract } = beneficiaryContracts;

    // Withdraw LP-SFT from YieldHarvest
    await noLpSftContract.safeTransferFrom(
      beneficiaryAddress,
      addressBook.yieldHarvest!,
      LPYIELD_LPNFT_TOKEN_ID,
      1n,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after withdrawing LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    const yieldAmount: bigint = await defiManagerContract.yieldBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );
    chai.expect(yieldAmount).to.not.equal(0n);

    const lpYieldAmount: bigint = await defiManagerContract.lpYieldBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );
    chai.expect(lpYieldAmount).to.equal(INITIAL_LPYIELD_AMOUNT);

    const debtAmount: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );
    chai.expect(debtAmount).to.equal(0n);
  });
});
