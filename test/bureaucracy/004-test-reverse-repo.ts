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

import { uniswapV3NftManagerAbi } from "../../src/abi/depends";
import { PermissionManager } from "../../src/game/admin/permissionManager";
import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { TestERC20MintableContract } from "../../src/interfaces/test/token/erc20/extensions/testErc20MintableContract";
import { ERC20Contract } from "../../src/interfaces/zeppelin/token/erc20/erc20Contract";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW5_AMOUNT,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_LPYIELD_AMOUNT,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_DEPOSIT,
  INITIAL_POW5_PRICE,
  //LPDEBT_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
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
  ethers.parseEther(INITIAL_LPYIELD_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// Initial amount of USDC to deposit into the Reverse Repo
const INITIAL_USDC_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// POW1 test reward for LPYIELD staking incentive
const LPYIELD_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// POW1 test reward for LPPOW5 staking incentive
const LPPOW5_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Remaining dust balances after depositing into LP pool
const LPPOW5_POW5_DUST: bigint = 355_055n;
const LPPOW5_USDC_DUST: bigint = 0n;

// Token IDs of minted LP-NFTs
const LPYIELD_LPNFT_TOKEN_ID: bigint = 1n;
const LPPOW5_LPNFT_TOKEN_ID: bigint = 2n;
const PURCHASED_LPNFT_TOKEN_ID: bigint = 3n;

// Amount of USDC to deposit in the Reverse Repo
const PURCHASE_USDC_AMOUNT: bigint =
  ethers.parseUnits("1000", USDC_DECIMALS) / BigInt(USDC_PRICE); // 1,000 USDC ($1,000)

// Amount of LPPOW5 minted in the first sale
//const PURCHASE_LPPOW5_AMOUNT: bigint = 103_082_902_006_930n; // 103 LPPOW5

// Returned USDC after buying
//const PURCHASE_POW5_RETURNED: bigint = 32_875n; // TODO

// USDC lost when a POW5 LP-SFT is purchased and then liquidated
//const PURCHASE_USDC_LOST: bigint = 3_030_617n; // 3.031 USDC ($3.03)

//
// Debug parameters
//

// Debug option to print the LP-NFT's image data URI
const DEBUG_PRINT_LPNFT_IMAGE: boolean = false;

//
// Test cases
//

describe("Bureau 4: Reverse Repo", () => {
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
  let pow5IsToken0: boolean;

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
  // Test setup: Grant roles
  //////////////////////////////////////////////////////////////////////////////

  it("should grant roles to contracts", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const permissionManager: PermissionManager = new PermissionManager(
      deployer,
      {
        pow1Token: addressBook.pow1Token!,
        pow5Token: addressBook.pow5Token!,
        lpYieldToken: addressBook.lpYieldToken!,
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
  // Test setup: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      dutchAuctionContract,
      pow1Contract,
      pow1MarketPoolContract,
      wrappedNativeContract,
    } = deployerContracts;

    // Obtain tokens
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Get pool token order
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

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
      pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    await pow1MarketPoolContract.initialize(INITIAL_PRICE);

    // Approve tokens
    await pow1Contract.approve(
      dutchAuctionContract.address,
      INITIAL_POW1_SUPPLY,
    );
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      INITIAL_WETH_AMOUNT,
    );

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // pow1Amount
      INITIAL_WETH_AMOUNT, // marketTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Yield Harvest
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, pow1LpSftLendFarmContract, yieldHarvestContract } =
      deployerContracts;
    const { lpSftContract } = beneficiaryContracts;

    // Grant roles
    await pow1Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);

    // Mint POW1 to the POW1 LP-SFT lend farm
    await pow1Contract.mint(
      pow1LpSftLendFarmContract.address,
      LPYIELD_REWARD_AMOUNT,
    );

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

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Get pool token order
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW5", async function (): Promise<void> {
    const { pow5Contract, pow5StablePoolContract, usdcContract } =
      deployerContracts;

    // Get pool token order
    const token0: `0x${string}` = await pow5StablePoolContract.token0();
    const token1: `0x${string}` = await pow5StablePoolContract.token1();
    if (
      token0.toLowerCase() === pow5Contract.address.toLowerCase() &&
      token1.toLowerCase() === usdcContract.address.toLowerCase()
    ) {
      pow5IsToken0 = true;
    } else if (
      token0.toLowerCase() === usdcContract.address.toLowerCase() &&
      token1.toLowerCase() === pow5Contract.address.toLowerCase()
    ) {
      pow5IsToken0 = false;
    } else {
      throw new Error("POW5 pool tokens are incorrect");
    }
    chai.expect(pow5IsToken0).to.be.a("boolean");

    console.log(
      `    POW5 is ${pow5IsToken0 ? "token0" : "token1"} ($${INITIAL_POW5_PRICE})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Send POW5 to deployer
  //////////////////////////////////////////////////////////////////////////////

  it("should send POW5 to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = beneficiaryContracts;

    // Transfer POW5 to deployer
    await pow5Contract.transfer(deployerAddress, INITIAL_POW5_DEPOSIT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain USDC to initialize ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const usdcTokenContract: TestERC20MintableContract =
      new TestERC20MintableContract(deployer, addressBook.usdcToken!);

    // Mint USDC to deployer
    await usdcTokenContract.mint(deployerAddress, INITIAL_USDC_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize the LPPOW5 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5StablePoolContract } = deployerContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow5IsToken0 ? INITIAL_USDC_AMOUNT : INITIAL_POW5_DEPOSIT,
      pow5IsToken0 ? INITIAL_POW5_DEPOSIT : INITIAL_USDC_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    await pow5StablePoolContract.initialize(INITIAL_PRICE);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW1 for LPPOW5 incentive reward", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Mint POW1 for LPPOW5 incentive reward
    await pow1Contract.mint(deployerAddress, LPPOW5_REWARD_AMOUNT);
  });

  it("should approve POW5LpNftStakeFarm spending POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, pow5LpNftStakeFarmContract } = deployerContracts;

    // Approve POW5LpNftStakeFarm spending POW1
    await pow1Contract.approve(
      pow5LpNftStakeFarmContract.address,
      LPPOW5_REWARD_AMOUNT,
    );
  });

  it("should create incentive for LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5LpNftStakeFarmContract } = deployerContracts;

    // Calculate DeFi properties
    const pow1Value: string = ethers.formatUnits(
      LPPOW5_REWARD_AMOUNT / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    console.log(
      `    Creating LPPOW5 incentive with ${ethers.formatUnits(
        LPPOW5_REWARD_AMOUNT,
        POW1_DECIMALS,
      )} POW1 ($${pow1Value})`,
    );

    // Create incentive
    await pow5LpNftStakeFarmContract.createIncentive(LPPOW5_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the ReverseRepo spending POW5 and USDC
  //////////////////////////////////////////////////////////////////////////////

  it("should approve ReverseRepo to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract, reverseRepoContract } = deployerContracts;

    // Approve ReverseRepo spending POW5
    await pow5Contract.approve(
      reverseRepoContract.address,
      INITIAL_POW5_DEPOSIT,
    );
  });

  it("should approve ReverseRepo to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = deployerContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Approve ReverseRepo spending USDC
    await usdcTokenContract.approve(
      reverseRepoContract.address,
      INITIAL_USDC_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize ReverseRepo", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = deployerContracts;

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_DEPOSIT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      INITIAL_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_POW5_DEPOSIT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_USDC_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    // Initialize ReverseRepo
    reverseRepoContract.initialize(
      INITIAL_POW5_DEPOSIT, // pow5Amount
      INITIAL_USDC_AMOUNT, // stableTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances after initialization
  //////////////////////////////////////////////////////////////////////////////

  it("should check beneficiary POW5 balance after initialization", async function (): Promise<void> {
    const { pow5Contract } = beneficiaryContracts;

    // Check beneficiary POW5 balance
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);
    const pow5Dust: bigint =
      pow5Balance + INITIAL_POW5_DEPOSIT - INITIAL_POW5_AMOUNT;

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const pow5DustValue: string = ethers.formatUnits(
      pow5Dust / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log LP-SFT POW5 balance
    console.log(
      `    Pool POW5 dust: ${parseInt(
        pow5Dust.toString(),
      ).toLocaleString()} POW5 wei ($${pow5DustValue.toLocaleString()})`,
    );
    console.log(
      `    Beneficiary POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );

    chai
      .expect(pow5Balance)
      .to.equal(
        INITIAL_POW5_AMOUNT - INITIAL_POW5_DEPOSIT /*+ LPPOW5_POW5_DUST*/,
      );
    chai.expect(pow5Dust).to.equal(0n /*LPPOW5_POW5_DUST*/);
  });

  it("should check beneficiary USDC balance after initialization", async function (): Promise<void> {
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Check USDC balance
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);

    // Calculate USDC value
    const usdcValue: string = ethers.formatUnits(
      INITIAL_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log USDC balance
    if (LPPOW5_USDC_DUST > 0n) {
      console.log(
        `    Beneficiary USDC balance: ${ethers.formatUnits(
          usdcBalance,
          USDC_DECIMALS,
        )} USDC ($${usdcValue})`,
      );
    }

    chai.expect(usdcBalance).to.equal(LPPOW5_USDC_DUST);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow5Contract, pow5StablePoolContract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Get Uniswap pool reserves
    const pow5Balance: bigint = await pow5Contract.balanceOf(
      pow5StablePoolContract.address,
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      pow5StablePoolContract.address,
    );

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW5 reserves: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Pool USDC reserves: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    chai.expect(pow5Balance).to.equal(INITIAL_POW5_DEPOSIT - LPPOW5_POW5_DUST);
    //chai.expect(usdcBalance).to.equal(INITIAL_USDC_AMOUNT - LPPOW5_USDC_DUST);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW5 total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPPOW5 total supply", async function (): Promise<void> {
    const { lpPow5Contract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpPow5Contract.totalSupply();
    chai.expect(totalSupply).to.equal(INITIAL_LPPOW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT ownership", async function (): Promise<void> {
    const { lpSftContract } = beneficiaryContracts;

    // Get owner
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      LPPOW5_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(beneficiaryAddress);
  });

  it("should check POW5 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      LPPOW5_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(beneficiaryAddress);

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(beneficiaryTokenIds.length).to.equal(1);
    chai.expect(beneficiaryTokenIds[0]).to.equal(LPPOW5_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(LPPOW5_LPNFT_TOKEN_ID);

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

    if (DEBUG_PRINT_LPNFT_IMAGE) {
      console.log(`    LP-NFT image: ${nftContent.image}`);
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint USDC to beneficiary for second POW5 LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC to beneficiary", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const usdcTokenContract: TestERC20MintableContract =
      new TestERC20MintableContract(deployer, addressBook.usdcToken!);

    // Mint USDC to beneficiary
    await usdcTokenContract.mint(beneficiaryAddress, PURCHASE_USDC_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve Reverse Repo spending USDC
  //////////////////////////////////////////////////////////////////////////////

  it("should approve ReverseRepo to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = deployerContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      beneficiary,
      addressBook.usdcToken!,
    );

    // Approve ReverseRepo spending USDC
    await usdcTokenContract.approve(
      reverseRepoContract.address,
      PURCHASE_USDC_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Buy an POW5 LP-SFT from ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should buy POW5 LP-SFT from ReverseRepo", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = beneficiaryContracts;

    // Calculate DeFi metrics
    const usdcValue: string = ethers.formatUnits(
      PURCHASE_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Spending: ${ethers.formatUnits(
        PURCHASE_USDC_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    // Buy POW5 LP-SFT from ReverseRepo
    await reverseRepoContract.purchase(
      0n, // pow5Amount
      PURCHASE_USDC_AMOUNT, // stableTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances after purchase
  //////////////////////////////////////////////////////////////////////////////

  /*
  it("should check POW5 balance after purchase", async function (): Promise<void> {
    const { pow5Contract } = beneficiaryContracts;

    // Check POW5 balance
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log POW5 balance
    console.log(
      `    Leftover POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );

    chai
      .expect(pow5Balance)
      .to.equal(
        INITIAL_POW5_AMOUNT -
          INITIAL_POW5_DEPOSIT +
          LPPOW5_POW5_DUST +
          PURCHASE_POW5_RETURNED,
      );
  });
  */

  /*
  it("should check USDC balance after purchase", async function (): Promise<void> {
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Check USDC balance
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(usdcBalance).to.equal(5_366_724n); // TODO: Magic constant
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances
  //////////////////////////////////////////////////////////////////////////////

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow5Contract, pow5StablePoolContract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Get Uniswap pool reserves
    const pow5Balance: bigint = await pow5Contract.balanceOf(
      pow5StablePoolContract.address,
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      pow5StablePoolContract.address,
    );

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW5 reserves: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Pool USDC reserves: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );
  });

  /*
  it("should check purchase LP-SFT LPPOW5 balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT LPPOW5 balance
    const lpPow5Balance: bigint = await defiManagerContract.lpPow5Balance(
      PURCHASED_LPNFT_TOKEN_ID,
    );

    // Log LP-SFT LPPOW5 balance
    console.log(
      `    Purchased LPPOW5: ${ethers.formatUnits(
        lpPow5Balance,
        LPPOW5_DECIMALS,
      )} LPPOW5`,
    );

    chai.expect(lpPow5Balance).to.equal(PURCHASE_LPPOW5_AMOUNT);
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW5 total supply
  //////////////////////////////////////////////////////////////////////////////

  /*
  it("should check LPPOW5 total supply", async function (): Promise<void> {
    const { lpPow5Contract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpPow5Contract.totalSupply();
    chai
      .expect(totalSupply)
      .to.equal(INITIAL_LPPOW5_AMOUNT + PURCHASE_LPPOW5_AMOUNT);
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Liquidate the purchased POW5 LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW1 balance before liquidation to calculate earnings", async function (): Promise<void> {
    const { pow1Contract } = beneficiaryContracts;

    // Check POW1 balance
    const pow1Balance: bigint =
      await pow1Contract.balanceOf(beneficiaryAddress);
    chai.expect(pow1Balance).to.equal(0n);
  });

  it("should approve ReverseRepo to manager POW5 LP-SFTs", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, reverseRepoContract } = beneficiaryContracts;

    // Approve ReverseRepo to manage POW5 LP-SFT
    await lpSftContract.setApprovalForAll(reverseRepoContract.address, true);
  });

  it("should liquidate purchased POW5 LP-SFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = beneficiaryContracts;

    // Liquidate POW5 LP-SFT
    await reverseRepoContract.exit(PURCHASED_LPNFT_TOKEN_ID);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token amounts after liquidation
  //////////////////////////////////////////////////////////////////////////////

  /*
  it("should check earnings and losses after liquidation", async function (): Promise<void> {
    const { pow1Contract, pow5Contract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Check balances
    const pow1Balance: bigint =
      await pow1Contract.balanceOf(beneficiaryAddress);
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);

    // Calculate token metrics
    const pow1Returned: bigint = pow1Balance;
    const pow5Returned: bigint =
      pow5Balance -
      INITIAL_POW5_AMOUNT +
      INITIAL_POW5_DEPOSIT -
      LPPOW5_POW5_DUST;
    const usdcLost: bigint = -(usdcBalance - PURCHASE_USDC_AMOUNT);

    // Calculate DeFi metrics
    const pow1ReturnedValue: string = ethers.formatUnits(
      pow1Returned / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    const pow5ReturnedValue: string = ethers.formatUnits(
      pow5Returned / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcLostValue: string = ethers.formatUnits(
      usdcLost * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );
    const totalLost: number =
      parseFloat(usdcLostValue) -
      parseFloat(pow1ReturnedValue) -
      parseFloat(pow5ReturnedValue);
    const totalLostValue: string = totalLost.toLocaleString();
    const totalLostPercent: string = (
      (100 * totalLost) /
      parseFloat(ethers.formatUnits(PURCHASE_USDC_AMOUNT, USDC_DECIMALS))
    ).toLocaleString();

    // Log amounts
    console.log(
      `    Earned POW1: ${ethers.formatUnits(
        pow1Returned,
        POW1_DECIMALS,
      )} POW1 ($${pow1ReturnedValue})`,
    );
    console.log(
      `    Earned POW5: ${ethers.formatUnits(
        pow5Returned,
        POW5_DECIMALS,
      )} POW5 ($${pow5ReturnedValue})`,
    );
    console.log(
      `    Lost USDC: ${ethers.formatUnits(
        usdcLost,
        USDC_DECIMALS,
      )} USDC ($${usdcLostValue})`,
    );
    console.log(`    Total loss: ${totalLostPercent}% ($${totalLostValue})`);

    chai.expect(pow1Returned).to.equal(0n); // This will change after adding rewards
    chai.expect(pow5Returned).to.equal(PURCHASE_POW5_RETURNED);
    chai.expect(usdcLost).to.equal(PURCHASE_USDC_LOST);
  });
  */

  /*
  it("should check balances after liquidation", async function (): Promise<void> {
    const { pow1Contract, pow5Contract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Check balances
    const pow1Balance: bigint =
      await pow1Contract.balanceOf(beneficiaryAddress);
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const pow1Value: string = ethers.formatUnits(
      pow1Balance / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log balances
    console.log(
      `    Beneficiary POW1 balance: ${ethers.formatUnits(
        pow1Balance,
        POW1_DECIMALS,
      )} POW1 ($${pow1Value})`,
    );
    console.log(
      `    Beneficiary POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Beneficiary USDC balance: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    chai.expect(pow1Balance).to.equal(0n); // TODO: Simulate rewards
    chai
      .expect(pow5Balance)
      .to.equal(
        INITIAL_POW5_AMOUNT -
          INITIAL_POW5_DEPOSIT +
          LPPOW5_POW5_DUST +
          PURCHASE_POW5_RETURNED,
      );
    chai.expect(parseInt(usdcBalance.toString())).to.be.greaterThan(0);
    chai
      .expect(parseInt(usdcBalance.toString()))
      .to.be.lessThan(parseInt(PURCHASE_USDC_AMOUNT.toString()));
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check POW5 LP-NFT and LP-SFT owners after liquidation
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW5 LP-NFT owner after liquidation", async function (): Promise<void> {
    const uniswapV3NftManagerContract: ethers.Contract = new ethers.Contract(
      addressBook.uniswapV3NftManager!,
      uniswapV3NftManagerAbi,
      beneficiary,
    );

    // Check LP-NFT owner
    const owner: `0x${string}` = (await uniswapV3NftManagerContract.ownerOf(
      PURCHASED_LPNFT_TOKEN_ID,
    )) as `0x${string}`;
    chai.expect(owner).to.equal(beneficiaryAddress);
  });

  it("should check POW5 LP-SFT owner after liquidation", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check LP-SFT owner
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      PURCHASED_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(ZERO_ADDRESS);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint POW5 to repay loan
  //////////////////////////////////////////////////////////////////////////////

  it("should check DEBT balance of POW1 LP-SFT", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check DEBT balance
    const debtBalance: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );

    // Calculate DeFi metrics
    const debtValue: string = ethers.formatUnits(
      debtBalance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log DEBT balance
    console.log(
      `    DEBT balance of POW1 LP-SFT: ${ethers.formatUnits(
        debtBalance,
        POW5_DECIMALS,
      )} DEBT ($${debtValue})`,
    );
  });

  it("should check POW5 deficit", async function (): Promise<void> {
    const { defiManagerContract, pow5Contract } = beneficiaryContracts;

    // Check POW5 and DEBT balances
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);
    const debtBalance: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );

    // Calculate deficit
    const deficit: bigint = debtBalance - pow5Balance;

    // Calculate DeFi metrics
    const deficitValue: string = ethers.formatUnits(
      deficit / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log amounts
    console.log(
      `    Deficit: ${ethers.formatUnits(
        deficit,
        POW5_DECIMALS,
      )} POW5 ($${deficitValue})`,
    );
  });

  it("should grant POW5 issuer role to deployer", async function (): Promise<void> {
    const { pow5Contract } = deployerContracts;

    // Grant ERC20_ISSUER_ROLE to deployer
    await pow5Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint missing POW5 deficit", async function (): Promise<void> {
    const { defiManagerContract, pow5Contract } = deployerContracts;

    // Check POW5 and DEBT balances
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);
    const debtBalance: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );

    // Calculate deficit
    const deficit: bigint = debtBalance - pow5Balance;

    // Mint missing POW5 deficit
    await pow5Contract.mint(beneficiaryAddress, deficit);
  });

  it("should log new POW5 balance after minting POW5", async function (): Promise<void> {
    const { pow5Contract } = beneficiaryContracts;

    // Check POW5 balance
    const pow5Balance: bigint =
      await pow5Contract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log POW5 balance
    console.log(
      `    Beneficiary POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Repay POW5 loan to LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should approve LiquidityForge to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract, pow5Contract } = beneficiaryContracts;

    // Approve LiquidityForge to spend POW5
    await pow5Contract.approve(
      liquidityForgeContract.address,
      INITIAL_POW5_AMOUNT,
    );
  });

  it("should repay POW5 loan", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;

    // Repay POW5 loan
    liquidityForgeContract.repayPow5(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT after POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest after POW5 loan is repaid", async function (): Promise<void> {
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

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after withdrawing LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    const pow1Amount: bigint = await defiManagerContract.pow1Balance(
      LPYIELD_LPNFT_TOKEN_ID,
    );
    chai.expect(pow1Amount).to.not.equal(0n);

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
