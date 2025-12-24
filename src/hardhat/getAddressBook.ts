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

/* eslint @typescript-eslint/no-explicit-any: "off" */
/* eslint no-empty: "off" */

import fs from "fs";
import * as hardhat from "hardhat";

import baseAddresses from "../addresses/base.json";
import mainnetAddresses from "../addresses/mainnet.json";
import { AddressBook } from "../interfaces/addressBook";
import {
  DEBT_TOKEN_CONTRACT,
  DEFI_MANAGER_CONTRACT,
  DUTCH_AUCTION_CONTRACT,
  LIQUIDITY_FORGE_CONTRACT,
  LPBORROW_TOKEN_CONTRACT,
  LPSFT_CONTRACT,
  LPYIELD_TOKEN_CONTRACT,
  MARKET_STABLE_SWAPPER_CONTRACT,
  NOLPSFT_CONTRACT,
  POW5_INTEREST_FARM_CONTRACT,
  POW5_LPNFT_STAKE_FARM_CONTRACT,
  POW5_LPSFT_LEND_FARM_CONTRACT,
  POW5_STABLE_POOL_CONTRACT,
  POW5_STABLE_POOL_FACTORY_CONTRACT,
  POW5_STABLE_POOLER_CONTRACT,
  POW5_STABLE_SWAPPER_CONTRACT,
  POW5_TOKEN_CONTRACT,
  REVERSE_REPO_CONTRACT,
  THE_RESERVE_CONTRACT,
  YIELD_HARVEST_CONTRACT,
  YIELD_LPNFT_STAKE_FARM_CONTRACT,
  YIELD_LPSFT_LEND_FARM_CONTRACT,
  YIELD_MARKET_POOL_CONTRACT,
  YIELD_MARKET_POOL_FACTORY_CONTRACT,
  YIELD_MARKET_POOLER_CONTRACT,
  YIELD_MARKET_SWAPPER_CONTRACT,
  YIELD_TOKEN_CONTRACT,
} from "../names/dapp";
import {
  UNISWAP_V3_FACTORY_CONTRACT,
  UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_NFT_MANAGER_CONTRACT,
  UNISWAP_V3_STAKER_CONTRACT,
  WRAPPED_NATIVE_TOKEN_CONTRACT,
  WRAPPED_NATIVE_USDC_POOL_CONTRACT,
} from "../names/depends";
import {
  TEST_ERC1155_ENUMERABLE_CONTRACT,
  TEST_LIQUIDITY_MATH_CONTRACT,
  TEST_POW5_STABLE_STAKER_CONTRACT,
  TEST_REWARD_MATH_CONTRACT,
  TEST_STRING_UTILS_CONTRACT,
  TEST_TICK_MATH_CONTRACT,
  TEST_YIELD_MARKET_STAKER_CONTRACT,
  USDC_CONTRACT,
} from "../names/testing";

//
// Address book instance
//

const addressBook: { [networkName: string]: AddressBook } = {
  base: baseAddresses as AddressBook,
  mainnet: mainnetAddresses as AddressBook,
};

//
// Utility functions
//

async function getAddressBook(networkName: string): Promise<AddressBook> {
  return {
    defiManager: await getContractAddress(
      "defiManager",
      DEFI_MANAGER_CONTRACT,
      networkName,
    ),
    dutchAuction: await getContractAddress(
      "dutchAuction",
      DUTCH_AUCTION_CONTRACT,
      networkName,
    ),
    liquidityForge: await getContractAddress(
      "liquidityForge",
      LIQUIDITY_FORGE_CONTRACT,
      networkName,
    ),
    lpYieldToken: await getContractAddress(
      "lpYieldToken",
      LPYIELD_TOKEN_CONTRACT,
      networkName,
    ),
    lpBorrowToken: await getContractAddress(
      "lpBorrowToken",
      LPBORROW_TOKEN_CONTRACT,
      networkName,
    ),
    lpSft: await getContractAddress("lpSft", LPSFT_CONTRACT, networkName),
    noLpSft: await getContractAddress("noLpSft", NOLPSFT_CONTRACT, networkName),
    debtToken: await getContractAddress(
      "debtToken",
      DEBT_TOKEN_CONTRACT,
      networkName,
    ),
    yieldLpNftStakeFarm: await getContractAddress(
      "yieldLpNftStakeFarm",
      YIELD_LPNFT_STAKE_FARM_CONTRACT,
      networkName,
    ),
    yieldLpSftLendFarm: await getContractAddress(
      "yieldLpSftLendFarm",
      YIELD_LPSFT_LEND_FARM_CONTRACT,
      networkName,
    ),
    yieldMarketPool: await getContractAddress(
      "yieldMarketPool",
      YIELD_MARKET_POOL_CONTRACT,
      networkName,
    ),
    yieldMarketPooler: await getContractAddress(
      "yieldMarketPooler",
      YIELD_MARKET_POOLER_CONTRACT,
      networkName,
    ),
    yieldMarketPoolFactory: await getContractAddress(
      "yieldMarketPoolFactory",
      YIELD_MARKET_POOL_FACTORY_CONTRACT,
      networkName,
    ),
    yieldMarketSwapper: await getContractAddress(
      "yieldMarketSwapper",
      YIELD_MARKET_SWAPPER_CONTRACT,
      networkName,
    ),
    yieldToken: await getContractAddress(
      "yieldToken",
      YIELD_TOKEN_CONTRACT,
      networkName,
    ),
    pow5InterestFarm: await getContractAddress(
      "pow5InterestFarm",
      POW5_INTEREST_FARM_CONTRACT,
      networkName,
    ),
    pow5LpNftStakeFarm: await getContractAddress(
      "pow5LpNftStakeFarm",
      POW5_LPNFT_STAKE_FARM_CONTRACT,
      networkName,
    ),
    pow5LpSftLendFarm: await getContractAddress(
      "pow5LpSftLendFarm",
      POW5_LPSFT_LEND_FARM_CONTRACT,
      networkName,
    ),
    pow5StablePool: await getContractAddress(
      "pow5StablePool",
      POW5_STABLE_POOL_CONTRACT,
      networkName,
    ),
    pow5StablePooler: await getContractAddress(
      "pow5StablePooler",
      POW5_STABLE_POOLER_CONTRACT,
      networkName,
    ),
    pow5StablePoolFactory: await getContractAddress(
      "pow5StablePoolFactory",
      POW5_STABLE_POOL_FACTORY_CONTRACT,
      networkName,
    ),
    pow5StableSwapper: await getContractAddress(
      "pow5StableSwapper",
      POW5_STABLE_SWAPPER_CONTRACT,
      networkName,
    ),
    pow5Token: await getContractAddress(
      "pow5Token",
      POW5_TOKEN_CONTRACT,
      networkName,
    ),
    reverseRepo: await getContractAddress(
      "reverseRepo",
      REVERSE_REPO_CONTRACT,
      networkName,
    ),
    testErc1155Enumerable: await getContractAddress(
      "testErc1155Enumerable",
      TEST_ERC1155_ENUMERABLE_CONTRACT,
      networkName,
    ),
    testLiquidityMath: await getContractAddress(
      "testLiquidityMath",
      TEST_LIQUIDITY_MATH_CONTRACT,
      networkName,
    ),
    testYieldMarketStakerContract: await getContractAddress(
      "testYieldMarketStakerContract",
      TEST_YIELD_MARKET_STAKER_CONTRACT,
      networkName,
    ),
    testPow5StableStakerContract: await getContractAddress(
      "testPow5StableStakerContract",
      TEST_POW5_STABLE_STAKER_CONTRACT,
      networkName,
    ),
    testRewardMath: await getContractAddress(
      "testRewardMath",
      TEST_REWARD_MATH_CONTRACT,
      networkName,
    ),
    testStringUtils: await getContractAddress(
      "testStringUtils",
      TEST_STRING_UTILS_CONTRACT,
      networkName,
    ),
    testTickMath: await getContractAddress(
      "testTickMath",
      TEST_TICK_MATH_CONTRACT,
      networkName,
    ),
    theReserve: await getContractAddress(
      "theReserve",
      THE_RESERVE_CONTRACT,
      networkName,
    ),
    uniswapV3Factory: await getContractAddress(
      "uniswapV3Factory",
      UNISWAP_V3_FACTORY_CONTRACT,
      networkName,
    ),
    uniswapV3NftDescriptor: await getContractAddress(
      "uniswapV3NftDescriptor",
      UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
      networkName,
    ),
    uniswapV3NftManager: await getContractAddress(
      "uniswapV3NftManager",
      UNISWAP_V3_NFT_MANAGER_CONTRACT,
      networkName,
    ),
    uniswapV3Staker: await getContractAddress(
      "uniswapV3Staker",
      UNISWAP_V3_STAKER_CONTRACT,
      networkName,
    ),
    usdcToken: await getContractAddress(
      "usdcToken",
      USDC_CONTRACT,
      networkName,
    ),
    wrappedNativeToken: await getContractAddress(
      "wrappedNativeToken",
      WRAPPED_NATIVE_TOKEN_CONTRACT,
      networkName,
    ),
    wrappedNativeUsdcPool: await getContractAddress(
      "wrappedNativeUsdcPool",
      WRAPPED_NATIVE_USDC_POOL_CONTRACT,
      networkName,
    ),
    wrappedNativeUsdcSwapper: await getContractAddress(
      "wrappedNativeUsdcSwapper",
      MARKET_STABLE_SWAPPER_CONTRACT,
      networkName,
    ),
    yieldHarvest: await getContractAddress(
      "yieldHarvest",
      YIELD_HARVEST_CONTRACT,
      networkName,
    ),
  };
}

function loadDeployment(
  networkName: string,
  contractName: string,
): `0x${string}` | undefined {
  try {
    const deployment = JSON.parse(
      fs
        .readFileSync(
          `${__dirname}/../../deployments/${networkName}/${contractName}.json`,
        )
        .toString(),
    );
    if (deployment.address) {
      return deployment.address as `0x${string}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {}

  // Not found
  return;
}

const getContractAddress = async (
  contractSymbol: string,
  contractName: string,
  networkName: string,
): Promise<`0x${string}` | undefined> => {
  // Look up address in address book
  if (
    addressBook[networkName] &&
    addressBook[networkName][contractSymbol as keyof AddressBook]
  ) {
    return addressBook[networkName][contractSymbol as keyof AddressBook];
  }

  if (addressBook[networkName] === undefined) {
    addressBook[networkName] = {};
  }

  // Look up address in deployments system, if available
  try {
    const contractDeployment = await hardhat.deployments.get(contractName);
    if (contractDeployment && contractDeployment.address) {
      addressBook[networkName][contractName as keyof AddressBook] =
        contractDeployment.address as `0x${string}`;
      return contractDeployment.address as `0x${string}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {}

  // Look up address if the contract has a known deployment
  const deploymentAddress = loadDeployment(networkName, contractName);
  if (deploymentAddress) {
    addressBook[networkName][contractName as keyof AddressBook] =
      deploymentAddress;
    return deploymentAddress;
  }

  // Not found
  return;
};

function writeAddress(
  networkName: string,
  contractName: string,
  address: `0x${string}`,
): void {
  console.log(`Deployed ${contractName} to ${address}`);

  // Create the directories if they don't exist
  if (!fs.existsSync(`${__dirname}/../../deployments`)) {
    fs.mkdirSync(`${__dirname}/../../deployments`);
  }
  if (!fs.existsSync(`${__dirname}/../../deployments/${networkName}`)) {
    fs.mkdirSync(`${__dirname}/../../deployments/${networkName}`);
  }

  // Write the file
  const addressFile = `${__dirname}/../../deployments/${networkName}/${contractName}.json`;
  fs.writeFileSync(addressFile, JSON.stringify({ address }, undefined, 2));

  // Save the address
  addressBook[networkName][contractName as keyof AddressBook] = address;
}

export { getAddressBook, writeAddress };
