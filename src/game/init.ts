/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import dotenv from "dotenv";
import { ethers } from "ethers";

import testnet from "../../src/networks/testnet.json";
import { getAddressBook } from "../hardhat/getAddressBook";
import { AddressBook } from "../interfaces/addressBook";
import { LiquidityForgeContract } from "../interfaces/bureaucracy/liquidityForgeContract";
import { LPSFTContract } from "../interfaces/token/erc1155/lpSftContract";
import { UniswapV3FactoryContract } from "../interfaces/uniswap/uniswapV3FactoryContract";
import { ERC20Contract } from "../interfaces/zeppelin/token/erc20/erc20Contract";
import {
  DEBT_TOKEN_CONTRACT,
  DEFI_MANAGER_CONTRACT,
  DUTCH_AUCTION_CONTRACT,
  LIQUIDITY_FORGE_CONTRACT,
  LPNFT_CONTRACT,
  LPPOW1_TOKEN_CONTRACT,
  LPPOW5_TOKEN_CONTRACT,
  LPSFT_CONTRACT,
  MARKET_STABLE_SWAPPER_CONTRACT,
  NOLPSFT_CONTRACT,
  POW1_LPNFT_STAKE_FARM_CONTRACT,
  POW1_LPSFT_LEND_FARM_CONTRACT,
  POW1_MARKET_POOL_FACTORY_CONTRACT,
  POW1_MARKET_POOLER_CONTRACT,
  POW1_TOKEN_CONTRACT,
  POW5_INTEREST_FARM_CONTRACT,
  POW5_LPNFT_STAKE_FARM_CONTRACT,
  POW5_LPSFT_LEND_FARM_CONTRACT,
  POW5_STABLE_POOL_FACTORY_CONTRACT,
  POW5_STABLE_POOLER_CONTRACT,
  POW5_STABLE_SWAPPER_CONTRACT,
  POW5_TOKEN_CONTRACT,
  REVERSE_REPO_CONTRACT,
  THE_RESERVE_CONTRACT,
  YIELD_HARVEST_CONTRACT,
} from "../names/dapp";
import {
  UNISWAP_V3_FACTORY_CONTRACT,
  UNISWAP_V3_NFT_MANAGER_CONTRACT,
  UNISWAP_V3_STAKER_CONTRACT,
  WRAPPED_NATIVE_TOKEN_CONTRACT,
} from "../names/depends";
import { USDC_CONTRACT } from "../names/testing";
import { ETH_PRICE } from "../testing/defiMetrics";
import {
  INITIAL_POW5_AMOUNT,
  LPPOW1_POOL_FEE,
  LPPOW5_POOL_FEE,
  UNI_V3_FEE_AMOUNT,
} from "../utils/constants";
import { DutchAuctionManager } from "./admin/dutchAuctionManager";
import { PermissionManager } from "./admin/permissionManager";
import { PoolManager } from "./admin/poolManager";
import { DutchAuctionClient } from "./client/dutchAuctionClient";

// Load environment variables from .env
dotenv.config();

////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

// Chain ID of testnet
const TESTNET_CHAIN_ID: bigint = 13371337n;

/**
 * @description The JSON-RPC URL for the Ethereum node
 */
const JSON_RPC_URL: string =
  process.env.JSON_RPC_URL || "http://localhost:8545";

// Token IDs of initial LP-NFT
const INITIAL_POW1_LPNFT_TOKEN_ID: bigint = 1n;

// Get some ETH for beneficiary's gas fees
const BENEFICIARY_ETH: bigint = ethers.parseEther("10") / BigInt(ETH_PRICE); // $10 in ETH

////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

interface ContractExport {
  contracts: {
    [contractName: string]: {
      address: `0x${string}`;
    };
  };
}

const EXPORTS: Record<string, ContractExport> = {
  testnet: testnet as ContractExport,
};

////////////////////////////////////////////////////////////////////////////////
// Entry point
////////////////////////////////////////////////////////////////////////////////

/**
 * @description Entry point for game initialization
 */
async function main(): Promise<void> {
  console.log("Starting game initialization...");

  //////////////////////////////////////////////////////////////////////////////
  // Setup Ethers.js provider and wallets
  //////////////////////////////////////////////////////////////////////////////

  // Connect to the local node
  const provider: ethers.JsonRpcProvider = new ethers.JsonRpcProvider(
    JSON_RPC_URL,
  );

  // Get the wallets
  let deployer: ethers.Signer;
  let beneficiary: ethers.Signer;

  // Load mnemonic or private key from environment variables or configuration
  const deployerMnemonic: string | undefined = process.env.MNEMONIC_DEPLOYER;
  const beneficiaryMnemonic: string | undefined = process.env.MNEMONIC_DEGEN;

  if (deployerMnemonic) {
    // Create the deployer wallet using mnemonic
    deployer = ethers.Wallet.fromPhrase(deployerMnemonic).connect(provider);
  } else {
    // Use the first account as the deployer
    deployer = await provider.getSigner(0);
  }
  if (beneficiaryMnemonic) {
    // Create the beneficiary wallet using mnemonic
    beneficiary =
      ethers.Wallet.fromPhrase(beneficiaryMnemonic).connect(provider);
  } else {
    // Use the second account as the deployer
    beneficiary = await provider.getSigner(1);
  }

  // Proceed with the rest of your script using the deployer wallet
  await initializeGame(deployer, beneficiary, provider);
}

/**
 * @description Helper function to initialize the game
 *
 * @param {ethers.Signer} deployer - The deployer wallet
 * @param {ethers.JsonRpcProvider} provider - The Ethers.js provider
 */
async function initializeGame(
  deployer: ethers.Signer,
  beneficiary: ethers.Signer,
  provider: ethers.JsonRpcProvider,
): Promise<void> {
  //////////////////////////////////////////////////////////////////////////////
  // Get Signers
  //////////////////////////////////////////////////////////////////////////////

  const deployerAddress: `0x${string}` =
    (await deployer.getAddress()) as `0x${string}`;
  console.log(`Deployer address: ${deployerAddress}`);

  // Use deployer for the beneficiary
  const beneficiaryAddress: `0x${string}` =
    (await beneficiary.getAddress()) as `0x${string}`;
  console.log(`Beneficiary address: ${beneficiaryAddress}`);

  //////////////////////////////////////////////////////////////////////////////
  // Get some gas money for the beneficiary
  //////////////////////////////////////////////////////////////////////////////

  // Get beneficiary ETH balance
  const beneficiaryBalance: bigint =
    await provider.getBalance(beneficiaryAddress);

  // Set beneficiary ETH balance, if needed
  if (beneficiaryBalance < BENEFICIARY_ETH) {
    await provider.send("hardhat_setBalance", [
      beneficiaryAddress,
      `0x${BENEFICIARY_ETH.toString(16)}`,
    ]);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Load ABIs and Addresses
  //////////////////////////////////////////////////////////////////////////////

  // Get the current network from the provider
  const network: ethers.Network = await provider.getNetwork();

  // Get the network name
  let networkName: string = "";

  if (network.chainId === 1337n || network.chainId === 31337n) {
    networkName = "localhost";
  } else if (network.chainId === TESTNET_CHAIN_ID) {
    networkName = "testnet";
  }

  // Log the chain properties
  console.log("Chain ID:", network.chainId.toString());
  console.log("Chain Name:", networkName);

  // Get the address book for the network
  let addressBook: AddressBook = {};

  if (networkName == "localhost") {
    addressBook = await getAddressBook(networkName);
  } else if (networkName in EXPORTS) {
    const contracts: {
      [contractName: string]: {
        address: `0x${string}`;
      };
    } = EXPORTS[networkName]["contracts"];

    addressBook = {
      defiManager: contracts[DEFI_MANAGER_CONTRACT]["address"],
      dutchAuction: contracts[DUTCH_AUCTION_CONTRACT]["address"],
      liquidityForge: contracts[LIQUIDITY_FORGE_CONTRACT]["address"],
      lpNft: contracts[LPNFT_CONTRACT]["address"],
      lpPow1Token: contracts[LPPOW1_TOKEN_CONTRACT]["address"],
      lpPow5Token: contracts[LPPOW5_TOKEN_CONTRACT]["address"],
      lpSft: contracts[LPSFT_CONTRACT]["address"],
      noLpSft: contracts[NOLPSFT_CONTRACT]["address"],
      debtToken: contracts[DEBT_TOKEN_CONTRACT]["address"],
      pow1LpNftStakeFarm: contracts[POW1_LPNFT_STAKE_FARM_CONTRACT]["address"],
      pow1LpSftLendFarm: contracts[POW1_LPSFT_LEND_FARM_CONTRACT]["address"],
      pow1MarketPooler: contracts[POW1_MARKET_POOLER_CONTRACT]["address"],
      pow1MarketPoolFactory:
        contracts[POW1_MARKET_POOL_FACTORY_CONTRACT]["address"],
      pow1MarketSwapper: contracts[POW1_MARKET_POOLER_CONTRACT]["address"],
      pow1Token: contracts[POW1_TOKEN_CONTRACT]["address"],
      pow5InterestFarm: contracts[POW5_INTEREST_FARM_CONTRACT]["address"],
      pow5LpNftStakeFarm: contracts[POW5_LPNFT_STAKE_FARM_CONTRACT]["address"],
      pow5LpSftLendFarm: contracts[POW5_LPSFT_LEND_FARM_CONTRACT]["address"],
      pow5StablePooler: contracts[POW5_STABLE_POOLER_CONTRACT]["address"],
      pow5StablePoolFactory:
        contracts[POW5_STABLE_POOL_FACTORY_CONTRACT]["address"],
      pow5StableSwapper: contracts[POW5_STABLE_SWAPPER_CONTRACT]["address"],
      pow5Token: contracts[POW5_TOKEN_CONTRACT]["address"],
      reverseRepo: contracts[REVERSE_REPO_CONTRACT]["address"],
      theReserve: contracts[THE_RESERVE_CONTRACT]["address"],
      wrappedNativeUsdcSwapper:
        contracts[MARKET_STABLE_SWAPPER_CONTRACT]["address"],
      yieldHarvest: contracts[YIELD_HARVEST_CONTRACT]["address"],
    };

    // Get dependencies, if available
    if (UNISWAP_V3_FACTORY_CONTRACT in contracts) {
      addressBook.uniswapV3Factory =
        contracts[UNISWAP_V3_FACTORY_CONTRACT]["address"];
    }
    if (UNISWAP_V3_NFT_MANAGER_CONTRACT in contracts) {
      addressBook.uniswapV3NftManager =
        contracts[UNISWAP_V3_NFT_MANAGER_CONTRACT]["address"];
    }
    if (UNISWAP_V3_STAKER_CONTRACT in contracts) {
      addressBook.uniswapV3Staker =
        contracts[UNISWAP_V3_STAKER_CONTRACT]["address"];
    }
    if (USDC_CONTRACT in contracts) {
      addressBook.usdcToken = contracts[USDC_CONTRACT]["address"];
    }
    if (WRAPPED_NATIVE_TOKEN_CONTRACT in contracts) {
      addressBook.wrappedNativeToken =
        contracts[WRAPPED_NATIVE_TOKEN_CONTRACT]["address"];
    }

    // Get pool addresses
    const uniswapV3FactoryContract: UniswapV3FactoryContract =
      new UniswapV3FactoryContract(deployer, addressBook.uniswapV3Factory!);
    addressBook.pow1MarketPool = await uniswapV3FactoryContract.getPool(
      addressBook.pow1Token!,
      addressBook.wrappedNativeToken!,
      LPPOW1_POOL_FEE,
    );
    addressBook.pow5StablePool = await uniswapV3FactoryContract.getPool(
      addressBook.pow5Token!,
      addressBook.usdcToken!,
      LPPOW5_POOL_FEE,
    );
    addressBook.wrappedNativeUsdcPool = await uniswapV3FactoryContract.getPool(
      addressBook.wrappedNativeToken!,
      addressBook.usdcToken!,
      UNI_V3_FEE_AMOUNT.LOW,
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Uniswap V3 Pools
  //////////////////////////////////////////////////////////////////////////////

  console.log("Initializing Uniswap V3 pools...");

  const poolManager: PoolManager = new PoolManager(deployer, {
    pow1Token: addressBook.pow1Token!,
    marketToken: addressBook.wrappedNativeToken!,
    pow1MarketPool: addressBook.pow1MarketPool!,
    pow5Token: addressBook.pow5Token!,
    stableToken: addressBook.usdcToken!,
    pow5StablePool: addressBook.pow5StablePool!,
  });

  await poolManager.initializePools();

  //////////////////////////////////////////////////////////////////////////////
  // Grant Roles
  //////////////////////////////////////////////////////////////////////////////

  console.log("Granting roles...");

  const permissionManager: PermissionManager = new PermissionManager(deployer, {
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
  });

  await permissionManager.initializeRoles();

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  const dutchAuctionManager: DutchAuctionManager = new DutchAuctionManager(
    deployer,
    {
      pow1Token: addressBook.pow1Token!,
      marketToken: addressBook.wrappedNativeToken!,
      dutchAuction: addressBook.dutchAuction!,
    },
  );

  // Initialize DutchAuction
  console.log("Initializing Dutch Auction...");
  if ((await dutchAuctionManager.initialize(beneficiaryAddress)) !== null) {
    console.log("Dutch Auction initialized");
  } else {
    console.log("Dutch Auction already initialized");
  }

  // Create initial LP-NFTs
  console.log("Creating initial LP-NFTs...");
  if ((await dutchAuctionManager.createInitialAuctions()) !== null) {
    console.log("Initial LP-NFTs minted");
  } else {
    console.log("Initial LP-NFTs already minted");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Yield Harvest
  //////////////////////////////////////////////////////////////////////////////

  const lpSftContract: LPSFTContract = new LPSFTContract(
    beneficiary,
    addressBook.lpSft!,
  );

  // Check if we own the LP-SFT
  const lpSftBalance: bigint = await lpSftContract.balanceOf(
    beneficiaryAddress,
    INITIAL_POW1_LPNFT_TOKEN_ID,
  );

  // Transfer the LP-SFT to Yield Harvest, if needed
  if (lpSftBalance === 1n) {
    console.log("Initializing Yield Harvest...");

    // Lend LP-SFT to YieldHarvest
    await lpSftContract.safeTransferFrom(
      beneficiaryAddress,
      addressBook.yieldHarvest!,
      INITIAL_POW1_LPNFT_TOKEN_ID,
      1n,
    );
  } else {
    console.log("Yield Harvest already initialized");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Liquidity Forge
  //////////////////////////////////////////////////////////////////////////////

  // Create contracts
  const liquidityForgeContract: LiquidityForgeContract =
    new LiquidityForgeContract(beneficiary, addressBook.liquidityForge!);
  const debtContract: ERC20Contract = new ERC20Contract(
    beneficiary,
    addressBook.debtToken!,
  );

  // Get LP-SFT address
  const lpSftAddress: `0x${string}` = await lpSftContract.tokenIdToAddress(
    INITIAL_POW1_LPNFT_TOKEN_ID,
  );

  // Get DEBT balance of LP-SFT
  const debtBalance: bigint = await debtContract.balanceOf(lpSftAddress);

  // Borrow more POW5, if needed
  if (debtBalance < INITIAL_POW5_AMOUNT) {
    console.log("Initializing Liquidity Forge...");

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      INITIAL_POW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT - debtBalance, // amount
      beneficiaryAddress, // receiver
    );
  } else {
    console.log("Liquidity Forge already initialized");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Inspect Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  const dutchAuctionClient: DutchAuctionClient = new DutchAuctionClient(
    deployer,
    {
      dutchAuction: addressBook.dutchAuction!,
      marketToken: addressBook.wrappedNativeToken!,
    },
  );

  console.log("Inspecting Dutch Auction...");

  const currentAuctionStates: {
    lpNftTokenId: bigint;
    startPriceBips: bigint;
    endPriceBips: bigint;
    startTime: bigint;
    salePrice: bigint;
  }[] = await dutchAuctionClient.getCurrentAuctionStates();

  console.log("Current auction states:");
  console.table(currentAuctionStates);

  console.log("Game initialization complete.");
}

// Use async/await everywhere and properly handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
