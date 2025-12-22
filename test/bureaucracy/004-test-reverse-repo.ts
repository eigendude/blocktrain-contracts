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
  BORROW_DECIMALS,
  INITIAL_BORROW_AMOUNT,
  INITIAL_BORROW_DEPOSIT,
  INITIAL_BORROW_PRICE,
  INITIAL_LPBORROW_AMOUNT,
  INITIAL_LPBORROW_USDC_VALUE,
  INITIAL_LPYIELD_AMOUNT,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_YIELD_PRICE,
  INITIAL_YIELD_SUPPLY,
  USDC_DECIMALS,
  //LPDEBT_DECIMALS,
  YIELD_DECIMALS,
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
  ethers.parseUnits(INITIAL_LPBORROW_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// YIELD test reward for LPYIELD staking incentive
const LPYIELD_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", YIELD_DECIMALS); // 1,000 YIELD ($10)

// YIELD test reward for LPBORROW staking incentive
const LPBORROW_REWARD_AMOUNT: bigint = ethers.parseUnits(
  "1000",
  YIELD_DECIMALS,
); // 1,000 YIELD ($10)

// Remaining dust balances after depositing into LP pool
const LPBORROW_BORROW_DUST: bigint = 355_055n;
const LPBORROW_USDC_DUST: bigint = 0n;

// Token IDs of minted LP-NFTs
const LPYIELD_LPNFT_TOKEN_ID: bigint = 1n;
const LPBORROW_LPNFT_TOKEN_ID: bigint = 2n;
const PURCHASED_LPNFT_TOKEN_ID: bigint = 3n;

// Amount of USDC to deposit in the Reverse Repo
const PURCHASE_USDC_AMOUNT: bigint =
  ethers.parseUnits("1000", USDC_DECIMALS) / BigInt(USDC_PRICE); // 1,000 USDC ($1,000)

// Amount of LPBORROW minted in the first sale
//const PURCHASE_LPBORROW_AMOUNT: bigint = 103_082_902_006_930n; // 103 LPBORROW

// Returned USDC after buying
//const PURCHASE_BORROW_RETURNED: bigint = 32_875n; // TODO

// USDC lost when a BORROW LP-SFT is purchased and then liquidated
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
  let borrowIsToken0: boolean;

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
        yieldToken: addressBook.yieldToken!,
        borrowToken: addressBook.borrowToken!,
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
        borrowLpNftStakeFarm: addressBook.borrowLpNftStakeFarm!,
        yieldLpSftLendFarm: addressBook.yieldLpSftLendFarm!,
        borrowLpSftLendFarm: addressBook.borrowLpSftLendFarm!,
        defiManager: addressBook.defiManager!,
        borrowInterestFarm: addressBook.borrowInterestFarm!,
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
      yieldContract,
      yieldMarketPoolContract,
      wrappedNativeContract,
    } = deployerContracts;

    // Obtain tokens
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Get pool token order
    let yieldIsToken0: boolean;
    const token0: `0x${string}` = await yieldMarketPoolContract.token0();
    const token1: `0x${string}` = await yieldMarketPoolContract.token1();
    if (
      token0.toLowerCase() === yieldContract.address.toLowerCase() &&
      token1.toLowerCase() === wrappedNativeContract.address.toLowerCase()
    ) {
      yieldIsToken0 = true;
    } else if (
      token0.toLowerCase() === wrappedNativeContract.address.toLowerCase() &&
      token1.toLowerCase() === yieldContract.address.toLowerCase()
    ) {
      yieldIsToken0 = false;
    } else {
      throw new Error("YIELD pool tokens are incorrect");
    }

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      yieldIsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_YIELD_SUPPLY,
      yieldIsToken0 ? INITIAL_YIELD_SUPPLY : INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    await yieldMarketPoolContract.initialize(INITIAL_PRICE);

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
      INITIAL_YIELD_SUPPLY, // yieldAmount
      INITIAL_WETH_AMOUNT, // marketTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Yield Harvest
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract, yieldLpSftLendFarmContract, yieldHarvestContract } =
      deployerContracts;
    const { lpSftContract } = beneficiaryContracts;

    // Grant roles
    await yieldContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);

    // Mint YIELD to the YIELD LP-SFT lend farm
    await yieldContract.mint(
      yieldLpSftLendFarmContract.address,
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

    // Borrow BORROW from LiquidityForge
    await liquidityForgeContract.borrowBorrow(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_BORROW_AMOUNT, // amount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Get pool token order
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPBORROW", async function (): Promise<void> {
    const { borrowContract, borrowStablePoolContract, usdcContract } =
      deployerContracts;

    // Get pool token order
    const token0: `0x${string}` = await borrowStablePoolContract.token0();
    const token1: `0x${string}` = await borrowStablePoolContract.token1();
    if (
      token0.toLowerCase() === borrowContract.address.toLowerCase() &&
      token1.toLowerCase() === usdcContract.address.toLowerCase()
    ) {
      borrowIsToken0 = true;
    } else if (
      token0.toLowerCase() === usdcContract.address.toLowerCase() &&
      token1.toLowerCase() === borrowContract.address.toLowerCase()
    ) {
      borrowIsToken0 = false;
    } else {
      throw new Error("BORROW pool tokens are incorrect");
    }
    chai.expect(borrowIsToken0).to.be.a("boolean");

    console.log(
      `    BORROW is ${borrowIsToken0 ? "token0" : "token1"} ($${INITIAL_BORROW_PRICE})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Send BORROW to deployer
  //////////////////////////////////////////////////////////////////////////////

  it("should send BORROW to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract } = beneficiaryContracts;

    // Transfer BORROW to deployer
    await borrowContract.transfer(deployerAddress, INITIAL_BORROW_DEPOSIT);
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
  // Spec: Initialize the LPBORROW pool
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize the LPBORROW pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowStablePoolContract } = deployerContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      borrowIsToken0 ? INITIAL_USDC_AMOUNT : INITIAL_BORROW_DEPOSIT,
      borrowIsToken0 ? INITIAL_BORROW_DEPOSIT : INITIAL_USDC_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    await borrowStablePoolContract.initialize(INITIAL_PRICE);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPBORROW pool
  //////////////////////////////////////////////////////////////////////////////

  it("should mint YIELD for LPBORROW incentive reward", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract } = deployerContracts;

    // Mint YIELD for LPBORROW incentive reward
    await yieldContract.mint(deployerAddress, LPBORROW_REWARD_AMOUNT);
  });

  it("should approve BORROWLpNftStakeFarm spending YIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldContract, borrowLpNftStakeFarmContract } = deployerContracts;

    // Approve BORROWLpNftStakeFarm spending YIELD
    await yieldContract.approve(
      borrowLpNftStakeFarmContract.address,
      LPBORROW_REWARD_AMOUNT,
    );
  });

  it("should create incentive for LPBORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowLpNftStakeFarmContract } = deployerContracts;

    // Calculate DeFi properties
    const yieldValue: string = ethers.formatUnits(
      LPBORROW_REWARD_AMOUNT / BigInt(1 / INITIAL_YIELD_PRICE),
      YIELD_DECIMALS,
    );
    console.log(
      `    Creating LPBORROW incentive with ${ethers.formatUnits(
        LPBORROW_REWARD_AMOUNT,
        YIELD_DECIMALS,
      )} YIELD ($${yieldValue})`,
    );

    // Create incentive
    await borrowLpNftStakeFarmContract.createIncentive(LPBORROW_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the ReverseRepo spending BORROW and USDC
  //////////////////////////////////////////////////////////////////////////////

  it("should approve ReverseRepo to spend BORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { borrowContract, reverseRepoContract } = deployerContracts;

    // Approve ReverseRepo spending BORROW
    await borrowContract.approve(
      reverseRepoContract.address,
      INITIAL_BORROW_DEPOSIT,
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
    const borrowValue: string = ethers.formatUnits(
      INITIAL_BORROW_DEPOSIT / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      INITIAL_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_BORROW_DEPOSIT,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue})`,
    );
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_USDC_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    // Initialize ReverseRepo
    reverseRepoContract.initialize(
      INITIAL_BORROW_DEPOSIT, // borrowAmount
      INITIAL_USDC_AMOUNT, // stableTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances after initialization
  //////////////////////////////////////////////////////////////////////////////

  it("should check beneficiary BORROW balance after initialization", async function (): Promise<void> {
    const { borrowContract } = beneficiaryContracts;

    // Check beneficiary BORROW balance
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);
    const borrowDust: bigint =
      borrowBalance + INITIAL_BORROW_DEPOSIT - INITIAL_BORROW_AMOUNT;

    // Calculate DeFi properties
    const borrowValue: string = ethers.formatUnits(
      borrowBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const borrowDustValue: string = ethers.formatUnits(
      borrowDust / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );

    // Log LP-SFT BORROW balance
    console.log(
      `    Pool BORROW dust: ${parseInt(
        borrowDust.toString(),
      ).toLocaleString()} BORROW wei ($${borrowDustValue.toLocaleString()})`,
    );
    console.log(
      `    Beneficiary BORROW balance: ${ethers.formatUnits(
        borrowBalance,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue.toLocaleString()})`,
    );

    chai
      .expect(borrowBalance)
      .to.equal(
        INITIAL_BORROW_AMOUNT -
          INITIAL_BORROW_DEPOSIT /*+ LPBORROW_BORROW_DUST*/,
      );
    chai.expect(borrowDust).to.equal(0n /*LPBORROW_BORROW_DUST*/);
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
    if (LPBORROW_USDC_DUST > 0n) {
      console.log(
        `    Beneficiary USDC balance: ${ethers.formatUnits(
          usdcBalance,
          USDC_DECIMALS,
        )} USDC ($${usdcValue})`,
      );
    }

    chai.expect(usdcBalance).to.equal(LPBORROW_USDC_DUST);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { borrowContract, borrowStablePoolContract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Get Uniswap pool reserves
    const borrowBalance: bigint = await borrowContract.balanceOf(
      borrowStablePoolContract.address,
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      borrowStablePoolContract.address,
    );

    // Calculate DeFi metrics
    const borrowValue: string = ethers.formatUnits(
      borrowBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool BORROW reserves: ${ethers.formatUnits(
        borrowBalance,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue})`,
    );
    console.log(
      `    Pool USDC reserves: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    chai
      .expect(borrowBalance)
      .to.equal(INITIAL_BORROW_DEPOSIT - LPBORROW_BORROW_DUST);
    //chai.expect(usdcBalance).to.equal(INITIAL_USDC_AMOUNT - LPBORROW_USDC_DUST);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPBORROW total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPBORROW total supply", async function (): Promise<void> {
    const { lpBorrowContract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpBorrowContract.totalSupply();
    chai.expect(totalSupply).to.equal(INITIAL_LPBORROW_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT ownership", async function (): Promise<void> {
    const { lpSftContract } = beneficiaryContracts;

    // Get owner
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      LPBORROW_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(beneficiaryAddress);
  });

  it("should check BORROW LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      LPBORROW_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(beneficiaryAddress);

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(beneficiaryTokenIds.length).to.equal(1);
    chai.expect(beneficiaryTokenIds[0]).to.equal(LPBORROW_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(
      LPBORROW_LPNFT_TOKEN_ID,
    );

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
  // Spec: Mint USDC to beneficiary for second BORROW LP-SFT
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
  // Spec: Buy an BORROW LP-SFT from ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should buy BORROW LP-SFT from ReverseRepo", async function (): Promise<void> {
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

    // Buy BORROW LP-SFT from ReverseRepo
    await reverseRepoContract.purchase(
      0n, // borrowAmount
      PURCHASE_USDC_AMOUNT, // stableTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances after purchase
  //////////////////////////////////////////////////////////////////////////////

  /*
  it("should check BORROW balance after purchase", async function (): Promise<void> {
    const { borrowContract } = beneficiaryContracts;

    // Check BORROW balance
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const borrowValue: string = ethers.formatUnits(
      borrowBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );

    // Log BORROW balance
    console.log(
      `    Leftover BORROW balance: ${ethers.formatUnits(
        borrowBalance,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue})`,
    );

    chai
      .expect(borrowBalance)
      .to.equal(
        INITIAL_BORROW_AMOUNT -
          INITIAL_BORROW_DEPOSIT +
          LPBORROW_BORROW_DUST +
          PURCHASE_BORROW_RETURNED,
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
    const { borrowContract, borrowStablePoolContract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Get Uniswap pool reserves
    const borrowBalance: bigint = await borrowContract.balanceOf(
      borrowStablePoolContract.address,
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      borrowStablePoolContract.address,
    );

    // Calculate DeFi metrics
    const borrowValue: string = ethers.formatUnits(
      borrowBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool BORROW reserves: ${ethers.formatUnits(
        borrowBalance,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue})`,
    );
    console.log(
      `    Pool USDC reserves: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );
  });

  /*
  it("should check purchase LP-SFT LPBORROW balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT LPBORROW balance
    const lpBorrowBalance: bigint = await defiManagerContract.lpBorrowBalance(
      PURCHASED_LPNFT_TOKEN_ID,
    );

    // Log LP-SFT LPBORROW balance
    console.log(
      `    Purchased LPBORROW: ${ethers.formatUnits(
        lpBorrowBalance,
        LPBORROW_DECIMALS,
      )} LPBORROW`,
    );

    chai.expect(lpBorrowBalance).to.equal(PURCHASE_LPBORROW_AMOUNT);
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPBORROW total supply
  //////////////////////////////////////////////////////////////////////////////

  /*
  it("should check LPBORROW total supply", async function (): Promise<void> {
    const { lpBorrowContract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpBorrowContract.totalSupply();
    chai
      .expect(totalSupply)
      .to.equal(INITIAL_LPBORROW_AMOUNT + PURCHASE_LPBORROW_AMOUNT);
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Liquidate the purchased BORROW LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check YIELD balance before liquidation to calculate earnings", async function (): Promise<void> {
    const { yieldContract } = beneficiaryContracts;

    // Check YIELD balance
    const yieldBalance: bigint =
      await yieldContract.balanceOf(beneficiaryAddress);
    chai.expect(yieldBalance).to.equal(0n);
  });

  it("should approve ReverseRepo to manager BORROW LP-SFTs", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, reverseRepoContract } = beneficiaryContracts;

    // Approve ReverseRepo to manage BORROW LP-SFT
    await lpSftContract.setApprovalForAll(reverseRepoContract.address, true);
  });

  it("should liquidate purchased BORROW LP-SFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = beneficiaryContracts;

    // Liquidate BORROW LP-SFT
    await reverseRepoContract.exit(PURCHASED_LPNFT_TOKEN_ID);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token amounts after liquidation
  //////////////////////////////////////////////////////////////////////////////

  /*
  it("should check earnings and losses after liquidation", async function (): Promise<void> {
    const { yieldContract, borrowContract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Check balances
    const yieldBalance: bigint =
      await yieldContract.balanceOf(beneficiaryAddress);
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);

    // Calculate token metrics
    const yieldReturned: bigint = yieldBalance;
    const borrowReturned: bigint =
      borrowBalance -
      INITIAL_BORROW_AMOUNT +
      INITIAL_BORROW_DEPOSIT -
      LPBORROW_BORROW_DUST;
    const usdcLost: bigint = -(usdcBalance - PURCHASE_USDC_AMOUNT);

    // Calculate DeFi metrics
    const yieldReturnedValue: string = ethers.formatUnits(
      yieldReturned / BigInt(1 / INITIAL_YIELD_PRICE),
      YIELD_DECIMALS,
    );
    const borrowReturnedValue: string = ethers.formatUnits(
      borrowReturned / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const usdcLostValue: string = ethers.formatUnits(
      usdcLost * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );
    const totalLost: number =
      parseFloat(usdcLostValue) -
      parseFloat(yieldReturnedValue) -
      parseFloat(borrowReturnedValue);
    const totalLostValue: string = totalLost.toLocaleString();
    const totalLostPercent: string = (
      (100 * totalLost) /
      parseFloat(ethers.formatUnits(PURCHASE_USDC_AMOUNT, USDC_DECIMALS))
    ).toLocaleString();

    // Log amounts
    console.log(
      `    Earned YIELD: ${ethers.formatUnits(
        yieldReturned,
        YIELD_DECIMALS,
      )} YIELD ($${yieldReturnedValue})`,
    );
    console.log(
      `    Earned BORROW: ${ethers.formatUnits(
        borrowReturned,
        BORROW_DECIMALS,
      )} BORROW ($${borrowReturnedValue})`,
    );
    console.log(
      `    Lost USDC: ${ethers.formatUnits(
        usdcLost,
        USDC_DECIMALS,
      )} USDC ($${usdcLostValue})`,
    );
    console.log(`    Total loss: ${totalLostPercent}% ($${totalLostValue})`);

    chai.expect(yieldReturned).to.equal(0n); // This will change after adding rewards
    chai.expect(borrowReturned).to.equal(PURCHASE_BORROW_RETURNED);
    chai.expect(usdcLost).to.equal(PURCHASE_USDC_LOST);
  });
  */

  /*
  it("should check balances after liquidation", async function (): Promise<void> {
    const { yieldContract, borrowContract } = beneficiaryContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Check balances
    const yieldBalance: bigint =
      await yieldContract.balanceOf(beneficiaryAddress);
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const yieldValue: string = ethers.formatUnits(
      yieldBalance / BigInt(1 / INITIAL_YIELD_PRICE),
      YIELD_DECIMALS,
    );
    const borrowValue: string = ethers.formatUnits(
      borrowBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log balances
    console.log(
      `    Beneficiary YIELD balance: ${ethers.formatUnits(
        yieldBalance,
        YIELD_DECIMALS,
      )} YIELD ($${yieldValue})`,
    );
    console.log(
      `    Beneficiary BORROW balance: ${ethers.formatUnits(
        borrowBalance,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue})`,
    );
    console.log(
      `    Beneficiary USDC balance: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    chai.expect(yieldBalance).to.equal(0n); // TODO: Simulate rewards
    chai
      .expect(borrowBalance)
      .to.equal(
        INITIAL_BORROW_AMOUNT -
          INITIAL_BORROW_DEPOSIT +
          LPBORROW_BORROW_DUST +
          PURCHASE_BORROW_RETURNED,
      );
    chai.expect(parseInt(usdcBalance.toString())).to.be.greaterThan(0);
    chai
      .expect(parseInt(usdcBalance.toString()))
      .to.be.lessThan(parseInt(PURCHASE_USDC_AMOUNT.toString()));
  });
  */

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check BORROW LP-NFT and LP-SFT owners after liquidation
  //////////////////////////////////////////////////////////////////////////////

  it("should check BORROW LP-NFT owner after liquidation", async function (): Promise<void> {
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

  it("should check BORROW LP-SFT owner after liquidation", async function (): Promise<void> {
    const { lpSftContract } = deployerContracts;

    // Check LP-SFT owner
    const owner: `0x${string}` = await lpSftContract.ownerOf(
      PURCHASED_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(ZERO_ADDRESS);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint BORROW to repay loan
  //////////////////////////////////////////////////////////////////////////////

  it("should check DEBT balance of YIELD LP-SFT", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check DEBT balance
    const debtBalance: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );

    // Calculate DeFi metrics
    const debtValue: string = ethers.formatUnits(
      debtBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );

    // Log DEBT balance
    console.log(
      `    DEBT balance of YIELD LP-SFT: ${ethers.formatUnits(
        debtBalance,
        BORROW_DECIMALS,
      )} DEBT ($${debtValue})`,
    );
  });

  it("should check BORROW deficit", async function (): Promise<void> {
    const { defiManagerContract, borrowContract } = beneficiaryContracts;

    // Check BORROW and DEBT balances
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);
    const debtBalance: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );

    // Calculate deficit
    const deficit: bigint = debtBalance - borrowBalance;

    // Calculate DeFi metrics
    const deficitValue: string = ethers.formatUnits(
      deficit / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );

    // Log amounts
    console.log(
      `    Deficit: ${ethers.formatUnits(
        deficit,
        BORROW_DECIMALS,
      )} BORROW ($${deficitValue})`,
    );
  });

  it("should grant BORROW issuer role to deployer", async function (): Promise<void> {
    const { borrowContract } = deployerContracts;

    // Grant ERC20_ISSUER_ROLE to deployer
    await borrowContract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);
  });

  it("should mint missing BORROW deficit", async function (): Promise<void> {
    const { defiManagerContract, borrowContract } = deployerContracts;

    // Check BORROW and DEBT balances
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);
    const debtBalance: bigint = await defiManagerContract.debtBalance(
      LPYIELD_LPNFT_TOKEN_ID,
    );

    // Calculate deficit
    const deficit: bigint = debtBalance - borrowBalance;

    // Mint missing BORROW deficit
    await borrowContract.mint(beneficiaryAddress, deficit);
  });

  it("should log new BORROW balance after minting BORROW", async function (): Promise<void> {
    const { borrowContract } = beneficiaryContracts;

    // Check BORROW balance
    const borrowBalance: bigint =
      await borrowContract.balanceOf(beneficiaryAddress);

    // Calculate DeFi metrics
    const borrowValue: string = ethers.formatUnits(
      borrowBalance / BigInt(1 / INITIAL_BORROW_PRICE),
      BORROW_DECIMALS,
    );

    // Log BORROW balance
    console.log(
      `    Beneficiary BORROW balance: ${ethers.formatUnits(
        borrowBalance,
        BORROW_DECIMALS,
      )} BORROW ($${borrowValue})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Repay BORROW loan to LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should approve LiquidityForge to spend BORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract, borrowContract } = beneficiaryContracts;

    // Approve LiquidityForge to spend BORROW
    await borrowContract.approve(
      liquidityForgeContract.address,
      INITIAL_BORROW_AMOUNT,
    );
  });

  it("should repay BORROW loan", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;

    // Repay BORROW loan
    liquidityForgeContract.repayBorrow(
      LPYIELD_LPNFT_TOKEN_ID, // tokenId
      INITIAL_BORROW_AMOUNT, // amount
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT after BORROW loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest after BORROW loan is repaid", async function (): Promise<void> {
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

  it("should check LP-SFT balances after repaying BORROW", async function (): Promise<void> {
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
