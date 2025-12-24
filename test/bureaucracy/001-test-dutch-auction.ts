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
  INITIAL_LPPOW1_AMOUNT,
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  POW1_DECIMALS,
} from "../../src/utils/constants";
import { getContractLibrary } from "../../src/utils/getContractLibrary";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of ETH to start with
const INITIAL_ETH: string = "1"; // 1 ETH

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH

// Initial amount of WETH to mint initial auction LP-NFTs
const INITIAL_WETH_DUST: bigint =
  ethers.parseEther("0.01") / BigInt(ETH_PRICE) / 1_000_000_000n; // 1 billionth of a cent of WETH

// Amount of WETH lost to the pool when minting initial auction LP-NFT
const INITIAL_WETH_LOSS: bigint = 42n; // 42 wei

// Amount of WETH lost to the pool when minting next two auction LP-NFTs
const NEXT_WETH_LOSS: bigint = 42n; // 42 wei

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Remaining dust balances after depositing into LP pool
const LPPOW1_POW1_DUST: bigint = 443n;
const LPPOW1_WETH_DUST: bigint = 1n;

// Token ID of initial minted LP-NFT/L-SFT
const POW1_LPNFT_TOKEN_ID: bigint = 1n;

// Token IDs of LP-NFTs for sale
const POW1_LPNFT_FIRST_TOKEN_ID: bigint = 2n;
const POW1_LPNFT_SECOND_TOKEN_ID: bigint = 3n;
const POW1_LPNFT_THIRD_TOKEN_ID: bigint = 4n;

// Amount of WETH to use to purchase first LP-NFT for
const POW1_LPNFT_FIRST_WETH_AMOUNT: bigint =
  ethers.parseEther("10") / BigInt(ETH_PRICE); // $10 in WETH

// Amount of WETH left over after purchasing first LP-NFT
const POW1_LPNFT_FIRST_WETH_LEFTOVER: bigint = 955_968_108_113n; // About $0.002

//
// Test cases
//

describe("Bureau 1: Dutch Auction", () => {
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
  // Spec: Test routes
  //////////////////////////////////////////////////////////////////////////////

  it("should test routes", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      dutchAuctionContract,
      lpSftContract,
      pow1Contract,
      pow1LpNftStakeFarmContract,
      pow1MarketPoolContract,
      pow1MarketPoolerContract,
      pow1MarketSwapperContract,
      pow5Contract,
      pow5StableSwapperContract,
      usdcContract,
      wrappedNativeContract,
      wrappedNativeUsdcSwapperContract,
    } = deployerContracts;

    // Test routes
    chai
      .expect(await dutchAuctionContract.pow1Token())
      .to.equal(pow1Contract.address);
    chai
      .expect(await dutchAuctionContract.pow5Token())
      .to.equal(pow5Contract.address);
    chai
      .expect(await dutchAuctionContract.marketToken())
      .to.equal(wrappedNativeContract.address);
    chai
      .expect(await dutchAuctionContract.stableToken())
      .to.equal(usdcContract.address);
    chai
      .expect(await dutchAuctionContract.lpSft())
      .to.equal(lpSftContract.address);
    chai
      .expect(await dutchAuctionContract.pow1MarketPool())
      .to.equal(pow1MarketPoolContract.address);
    chai
      .expect(await dutchAuctionContract.pow1MarketSwapper())
      .to.equal(pow1MarketSwapperContract.address);
    chai
      .expect(await dutchAuctionContract.pow5StableSwapper())
      .to.equal(pow5StableSwapperContract.address);
    chai
      .expect(await dutchAuctionContract.marketStableSwapper())
      .to.equal(wrappedNativeUsdcSwapperContract.address);
    chai
      .expect(await dutchAuctionContract.pow1MarketPooler())
      .to.equal(pow1MarketPoolerContract.address);
    chai
      .expect(await dutchAuctionContract.pow1LpNftStakeFarm())
      .to.equal(pow1LpNftStakeFarmContract.address);
    chai
      .expect(await dutchAuctionContract.uniswapV3NftManager())
      .to.equal(addressBook.uniswapV3NftManager!);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant roles
  //////////////////////////////////////////////////////////////////////////////

  it("should grant roles to contracts", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const permissionManager: PermissionManager = new PermissionManager(
      deployer,
      {
        pow1Token: addressBook.pow1Token!,
        pow5Token: addressBook.pow5Token!,
        lpPow1Token: addressBook.lpPow1Token!,
        lpPow5Token: addressBook.lpPow5Token!,
        debtToken: addressBook.debtToken!,
        lpSft: addressBook.lpSft!,
        noLpSft: addressBook.noLpSft!,
        dutchAuction: addressBook.dutchAuction!,
        yieldHarvest: addressBook.yieldHarvest!,
        liquidityForge: addressBook.liquidityForge!,
        reverseRepo: addressBook.reverseRepo!,
        pow1LpNftStakeFarm: addressBook.pow1LpNftStakeFarm!,
        pow5LpNftStakeFarm: addressBook.pow5LpNftStakeFarm!,
        pow1LpSftLendFarm: addressBook.pow1LpSftLendFarm!,
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
  // Spec: Mint POW1 reward to POW1 LP-NFT stake farm
  //////////////////////////////////////////////////////////////////////////////

  it("should grant deployer ERC20_ISSUER_ROLE for POW1 token", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Grant ERC-20 issuer role to deployer
    await pow1Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint POW1 reward to POW1 LP-NFT stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, pow1LpNftStakeFarmContract } = deployerContracts;

    // Mint POW1 to the POW1 LP-SFT lend farm
    await pow1Contract.mint(
      pow1LpNftStakeFarmContract.address,
      LPPOW1_REWARD_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Get pool token order
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW1", async function (): Promise<void> {
    const { pow1Contract, pow1MarketPoolContract, wrappedNativeContract } =
      deployerContracts;

    let pow1IsToken0: boolean;

    const token0: `0x${string}` = await pow1MarketPoolContract.token0();
    const token1: `0x${string}` = await pow1MarketPoolContract.token1();

    if (
      token0.toLowerCase() === pow1Contract.address.toLowerCase() &&
      token1.toLowerCase() === wrappedNativeContract.address.toLowerCase()
    ) {
      pow1IsToken0 = true;
    } else if (
      token0.toLowerCase() === wrappedNativeContract.address.toLowerCase() &&
      token1.toLowerCase() === pow1Contract.address.toLowerCase()
    ) {
      pow1IsToken0 = false;
    } else {
      throw new Error("POW1 pool tokens are incorrect");
    }

    chai.expect(pow1IsToken0).to.be.a("boolean");

    console.log(
      `    POW1 is ${pow1IsToken0 ? "token0" : "token1"} ($${INITIAL_POW1_PRICE})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW1 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize the LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const poolManager: PoolManager = new PoolManager(deployer, {
      pow1Token: addressBook.pow1Token!,
      marketToken: addressBook.wrappedNativeToken!,
      pow1MarketPool: addressBook.pow1MarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });

    const transactions: Array<ethers.ContractTransactionReceipt> =
      await poolManager.initializePools();

    chai.expect(transactions.length).to.equal(2);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check uninitialized Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should check uninitialized Dutch Auction", async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Check if the Dutch Auction is initialized
    const isInitialized: boolean = await dutchAuctionContract.isInitialized();
    chai.expect(isInitialized).to.equal(false);
  });

  it("should check getAuctionSettings", async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Get auction settings
    const auctionSettings = await dutchAuctionContract.getAuctionSettings();
    chai.expect(auctionSettings.priceDecayRate).to.equal(192_540_000_000_000n); // TODO
    chai.expect(auctionSettings.mintDustAmount).to.equal(1_000n);
    chai
      .expect(auctionSettings.priceIncrement)
      .to.equal(ethers.parseUnits("1", 18));
    chai
      .expect(auctionSettings.initialPriceBips)
      .to.equal(ethers.parseUnits(".0002", 18));
    chai
      .expect(auctionSettings.minPriceBips)
      .to.equal(ethers.parseUnits(".0001", 18));
    chai
      .expect(auctionSettings.maxPriceBips)
      .to.equal(ethers.parseUnits("1", 18));
  });

  it("should check getBureauState", async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Get auction metadata
    const bureauState = await dutchAuctionContract.getBureauState();
    chai.expect(bureauState.totalAuctions).to.equal(0n);
    chai.expect(bureauState.lastSalePriceBips).to.equal(0n);
  });

  it("should check getCurrentAuctionCount", async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Get current auction count
    const currentAuctionCount: bigint =
      await dutchAuctionContract.getCurrentAuctionCount();
    chai.expect(currentAuctionCount).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain W-ETH to initialize DutchAuction
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain W-ETH to initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Calculate DeFi metrics
    const wethValue: string = ethers.formatEther(
      INITIAL_WETH_AMOUNT * BigInt(ETH_PRICE),
    );

    console.log(
      `    Wrapping: ${ethers.formatEther(INITIAL_WETH_AMOUNT)} WETH ($${
        wethValue
      })`,
    );

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the Dutch Auction spending POW1 and WETH
  //////////////////////////////////////////////////////////////////////////////

  it("should approve Dutch Auction to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract, pow1Contract } = deployerContracts;

    // Approve Dutch Auction spending POW1 for deployer
    await pow1Contract.approve(
      dutchAuctionContract.address,
      INITIAL_POW1_SUPPLY,
    );
  });

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract, wrappedNativeContract } = deployerContracts;

    // Approve Dutch Auction spending WETH
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      INITIAL_WETH_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it('should check "isInitialized" state before initialization', async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Check if DutchAuction is initialized
    const isInitialized: boolean = await dutchAuctionContract.isInitialized();
    chai.expect(isInitialized).to.be.false;
  });

  it("should initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

    // Calculate DeFi metrics
    const pow1Value: string = ethers.formatUnits(
      INITIAL_POW1_SUPPLY / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    const wethValue: string = ethers.formatEther(
      INITIAL_WETH_AMOUNT * BigInt(ETH_PRICE),
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_POW1_SUPPLY,
        POW1_DECIMALS,
      )} POW1 ($${pow1Value})`,
    );
    console.log(
      `    Depositing: ${ethers
        .formatEther(INITIAL_WETH_AMOUNT)
        .toLocaleString()} ETH ($${wethValue})`,
    );

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // pow1Amount
      INITIAL_WETH_AMOUNT, // marketTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  it('should check "isInitialized" state after initialization', async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Check if DutchAuction is initialized
    const isInitialized: boolean = await dutchAuctionContract.isInitialized();
    chai.expect(isInitialized).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT POW1 balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT POW1 balance
    const pow1Balance: bigint =
      await defiManagerContract.pow1Balance(POW1_LPNFT_TOKEN_ID);

    // Calculate DeFi properties
    const pow1Value: string = ethers.formatUnits(
      pow1Balance / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );

    // Log LP-SFT POW1 balance
    console.log(
      `    LP-SFT POW1 dust: ${parseInt(
        pow1Balance.toString(),
      ).toLocaleString()} POW1 wei ($${pow1Value.toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.equal(LPPOW1_POW1_DUST);
  });

  it("should check beneficiary WETH balance", async function (): Promise<void> {
    const { wrappedNativeContract } = beneficiaryContracts;

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(beneficiaryAddress);

    // Log WETH balance
    if (wethBalance > 0n) {
      console.log(
        `    Beneficiary WETH balance: ${ethers
          .formatEther(wethBalance)
          .toLocaleString()} WETH`,
      );
    }

    chai.expect(wethBalance).to.equal(LPPOW1_WETH_DUST);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, pow1MarketPoolContract, wrappedNativeContract } =
      deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      pow1MarketPoolContract.address,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      pow1MarketPoolContract.address,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST);
    chai.expect(wethBalance).to.equal(INITIAL_WETH_AMOUNT - LPPOW1_WETH_DUST);
  });

  it("should check initial LP-SFT LPPOW1 balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT LPPOW1 balance
    const lpPow1Balance: bigint =
      await defiManagerContract.lpPow1Balance(POW1_LPNFT_TOKEN_ID);

    // Calculate DeFi properties
    // TODO: Calculate LPPOW1 price instead of using POW5 price
    const lpPow1Price: number = INITIAL_POW5_PRICE;
    const lpPow1Value: string = ethers.formatUnits(
      lpPow1Balance / BigInt(1 / lpPow1Price),
      LPPOW1_DECIMALS,
    );

    // Log LP-SFT LPPOW1 balance
    console.log(
      `    Initial LP-SFT LPPOW1 balance: ${ethers
        .formatUnits(lpPow1Balance, LPPOW1_DECIMALS)
        .toLocaleString()} LPPOW1 ($${lpPow1Value.toLocaleString()})`,
    );

    chai.expect(lpPow1Balance).to.equal(INITIAL_LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW1 total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPPOW1 total supply", async function (): Promise<void> {
    const { lpPow1Contract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpPow1Contract.totalSupply();
    chai.expect(totalSupply).to.equal(INITIAL_LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT ownership", async function (): Promise<void> {
    const { lpSftContract } = beneficiaryContracts;

    // Get owner
    const owner: `0x${string}` =
      await lpSftContract.ownerOf(POW1_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(beneficiaryAddress);
  });

  it("should check POW1 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(beneficiaryTokenIds.length).to.equal(1);
    chai.expect(beneficiaryTokenIds[0]).to.equal(POW1_LPNFT_TOKEN_ID);

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
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create initial Dutch Auction LP-NFT for sale
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain W-ETH to mint initial LP-NFT for sale", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Calculate DeFi metrics
    const wethValue: string = ethers.formatEther(
      INITIAL_WETH_DUST * BigInt(ETH_PRICE),
    );

    console.log(
      `    Wrapping: ${ethers.formatEther(INITIAL_WETH_DUST)} WETH ($${
        wethValue
      })`,
    );

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_DUST);
  });

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract, wrappedNativeContract } = deployerContracts;

    // Approve Dutch Auction spending WETH
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      INITIAL_WETH_DUST,
    );
  });

  it("should create initial LP-NFT for sale", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

    // Initialize DutchAuction
    await dutchAuctionContract.setAuctionCount(1, INITIAL_WETH_DUST);
  });

  it("should check dust lost to minting initial LP-NFT for sale", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);

    // Calculate DeFi metrics
    const dustAmount: bigint = INITIAL_WETH_DUST - wethBalance;
    const dustValue: string = ethers.formatEther(
      dustAmount * BigInt(ETH_PRICE),
    );

    // Log DeFi metrics
    console.log(
      `    WETH dust lost: ${dustAmount.toLocaleString()} wei ($${dustValue})`,
    );

    chai.expect(dustAmount).to.equal(INITIAL_WETH_LOSS);
  });

  it("should log Uniswap pool reserves after minting initial LP-NFT for sale", async function (): Promise<void> {
    const { pow1Contract, pow1MarketPoolContract, wrappedNativeContract } =
      deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      pow1MarketPoolContract.address,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      pow1MarketPoolContract.address,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST);
    chai
      .expect(wethBalance)
      .to.equal(INITIAL_WETH_AMOUNT - LPPOW1_WETH_DUST + INITIAL_WETH_LOSS);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create next two Dutch Auction LP-NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract, wrappedNativeContract } = deployerContracts;

    const marketTokenAmount: bigint = INITIAL_WETH_DUST - INITIAL_WETH_LOSS;

    // Approve Dutch Auction spending WETH
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      marketTokenAmount,
    );
  });

  it("should create next two DutchAuction LP-NFTs", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

    const marketTokenAmount: bigint = INITIAL_WETH_DUST - INITIAL_WETH_LOSS;

    // Initialize DutchAuction
    await dutchAuctionContract.setAuctionCount(3, marketTokenAmount);
  });

  it("should check WETH dust lost to LP-NFT creation", async function (): Promise<void> {
    const { wrappedNativeContract } = deployerContracts;

    const marketTokenAmount: bigint = INITIAL_WETH_DUST - INITIAL_WETH_LOSS;

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);

    // Calculate DeFi metrics
    const wethDustAmount: bigint = marketTokenAmount - wethBalance;
    const wethDustValue: string = ethers.formatEther(
      wethDustAmount * BigInt(ETH_PRICE),
    );

    // Log DeFi metrics
    console.log(
      `    WETH dust lost: ${wethDustAmount.toLocaleString()} wei ($${
        wethDustValue
      })`,
    );

    chai.expect(wethDustAmount).to.equal(NEXT_WETH_LOSS);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, pow1MarketPoolContract, wrappedNativeContract } =
      deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      pow1MarketPoolContract.address,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      pow1MarketPoolContract.address,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST);
    chai
      .expect(wethBalance)
      .to.equal(
        INITIAL_WETH_AMOUNT -
          LPPOW1_WETH_DUST +
          INITIAL_WETH_LOSS +
          NEXT_WETH_LOSS,
      );
  });

  it("should get current auctions", async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    const currentAuctionCount: bigint =
      await dutchAuctionContract.getCurrentAuctionCount();
    chai.expect(currentAuctionCount).to.equal(3n);

    const currentAuctions: bigint[] =
      await dutchAuctionContract.getCurrentAuctions();
    chai.expect(currentAuctions.length).to.equal(3);
    chai.expect(currentAuctions[0]).to.equal(POW1_LPNFT_FIRST_TOKEN_ID);
    chai.expect(currentAuctions[1]).to.equal(POW1_LPNFT_SECOND_TOKEN_ID);
    chai.expect(currentAuctions[2]).to.equal(POW1_LPNFT_THIRD_TOKEN_ID);

    const currentAuctionStates: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    }[] = await dutchAuctionContract.getCurrentAuctionStates();
    chai.expect(currentAuctionStates.length).to.equal(3);

    chai
      .expect(currentAuctionStates[0].lpNftTokenId)
      .to.equal(POW1_LPNFT_FIRST_TOKEN_ID);
    chai
      .expect(currentAuctionStates[0].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[0].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[0].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[0].salePrice).to.equal(0n);

    chai
      .expect(currentAuctionStates[1].lpNftTokenId)
      .to.equal(POW1_LPNFT_SECOND_TOKEN_ID);
    chai
      .expect(currentAuctionStates[1].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[1].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[1].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[1].salePrice).to.equal(0n);

    chai
      .expect(currentAuctionStates[2].lpNftTokenId)
      .to.equal(POW1_LPNFT_THIRD_TOKEN_ID);
    chai
      .expect(currentAuctionStates[2].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[2].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[2].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[2].salePrice).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Purchase first LP-NFT for sale
  //////////////////////////////////////////////////////////////////////////////

  it('should deposit into W-ETH for "purchase" transaction', async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = beneficiaryContracts;

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(POW1_LPNFT_FIRST_WETH_AMOUNT);
  });

  it("should check WETH balance before purchasing first LP-NFT", async function (): Promise<void> {
    const { wrappedNativeContract } = beneficiaryContracts;

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const wethValue: string = ethers.formatEther(
      wethBalance * BigInt(ETH_PRICE),
    );

    // Log WETH balance
    console.log(
      `    Beneficiary WETH balance: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${wethValue})`,
    );

    try {
      chai.expect(wethBalance).to.equal(POW1_LPNFT_FIRST_WETH_AMOUNT);
    } catch (error: unknown) {
      if (error instanceof chai.AssertionError) {
        chai.expect(wethBalance).to.equal(POW1_LPNFT_FIRST_WETH_AMOUNT + 1n);
      }
    }
  });

  it("should approve Dutch Auction to spend W-ETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract, wrappedNativeContract } =
      beneficiaryContracts;

    // Approve Dutch Auction spending WETH
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      POW1_LPNFT_FIRST_WETH_AMOUNT,
    );
  });

  it("should purchase first LP-NFT for sale", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = beneficiaryContracts;

    // Purchase first LP-NFT for sale
    await dutchAuctionContract.purchase(
      POW1_LPNFT_FIRST_TOKEN_ID,
      0n,
      POW1_LPNFT_FIRST_WETH_AMOUNT,
      deployerAddress,
      beneficiaryAddress,
    );
  });

  it("should check WETH balance after purchasing first LP-NFT", async function (): Promise<void> {
    const { wrappedNativeContract } = beneficiaryContracts;

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const wethValue: string = ethers.formatEther(
      wethBalance * BigInt(ETH_PRICE),
    );

    // Log WETH balance
    console.log(
      `    Beneficiary WETH balance: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${wethValue})`,
    );

    // TODO
    chai.expect(wethBalance).to.equal(POW1_LPNFT_FIRST_WETH_LEFTOVER);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, pow1MarketPoolContract, wrappedNativeContract } =
      deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      pow1MarketPoolContract.address,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      pow1MarketPoolContract.address,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );

    chai
      .expect(pow1Balance)
      .to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST - 363n);
    chai
      .expect(wethBalance)
      .to.equal(
        INITIAL_WETH_AMOUNT -
          LPPOW1_WETH_DUST +
          INITIAL_WETH_LOSS +
          POW1_LPNFT_FIRST_WETH_AMOUNT -
          1_758_085_942_872n,
      );
  });

  it("should check balances after purchasing first LP-NFT", async function (): Promise<void> {
    const { defiManagerContract, wrappedNativeContract } = beneficiaryContracts;

    // Check LP-SFT POW1 balance
    const pow1Balance: bigint =
      await defiManagerContract.pow1Balance(POW1_LPNFT_TOKEN_ID);
    chai.expect(pow1Balance).to.equal(LPPOW1_POW1_DUST);

    // Check beneficiary WETH balance
    const wethBalance: bigint =
      await wrappedNativeContract.balanceOf(beneficiaryAddress);
    chai.expect(wethBalance).to.equal(POW1_LPNFT_FIRST_WETH_LEFTOVER);
  });
});
