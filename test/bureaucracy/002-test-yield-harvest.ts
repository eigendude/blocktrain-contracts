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
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_YIELD_SUPPLY,
  YIELD_DECIMALS,
  ZERO_ADDRESS,
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

// Token IDs of minted LP-NFTs
const LPYIELD_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau 2: Yield Harvest", () => {
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
      dutchAuctionContract.address,
      INITIAL_YIELD_SUPPLY,
    );
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
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
  // Spec: Mint YIELD reward to YIELD LP-SFT lend farm
  /////////////////////////////////////////////////////////////////////////////

  it("should mint YIELD reward to the YIELD LP-SFT lend farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract, yieldLpSftLendFarmContract } = deployerContracts;

    // Grant issuer role to deployer
    await yieldContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);

    // Mint YIELD to the YIELD LP-SFT lend farm
    await yieldContract.mint(
      yieldLpSftLendFarmContract.address,
      ethers.parseUnits("5000", YIELD_DECIMALS), // TODO: Handle rewards
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Lend LP-SFT to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT is not lent before lending", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = deployerContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPYIELD_LPNFT_TOKEN_ID))
      .to.equal(beneficiaryAddress);
    chai
      .expect(await noLpSftContract.ownerOf(LPYIELD_LPNFT_TOKEN_ID))
      .to.equal(ZERO_ADDRESS);
  });

  it("should lend LP-SFT to YieldHarvest", async function (): Promise<void> {
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

  it("should verify LP-SFT is lent to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract, yieldHarvestContract } =
      deployerContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPYIELD_LPNFT_TOKEN_ID))
      .to.equal(yieldHarvestContract.address);
    chai
      .expect(await noLpSftContract.ownerOf(LPYIELD_LPNFT_TOKEN_ID))
      .to.equal(beneficiaryAddress);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT from YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract, yieldHarvestContract } = beneficiaryContracts;

    // Withdraw LP-SFT from YieldHarvest
    await noLpSftContract.safeTransferFrom(
      beneficiaryAddress,
      yieldHarvestContract.address,
      LPYIELD_LPNFT_TOKEN_ID,
      1n,
    );
  });

  it("should verify LP-SFT is not lent after withdrawing", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = deployerContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPYIELD_LPNFT_TOKEN_ID))
      .to.equal(beneficiaryAddress);
    chai
      .expect(await noLpSftContract.ownerOf(LPYIELD_LPNFT_TOKEN_ID))
      .to.equal(ZERO_ADDRESS);
  });
});
