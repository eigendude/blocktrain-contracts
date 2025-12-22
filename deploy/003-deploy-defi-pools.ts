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
import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getUnnamedSigners } from "hardhat-deploy-ethers/dist/src/helpers";

import { getAddressBook, writeAddress } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
import { AddressBook } from "../src/interfaces/addressBook";
import { UniswapV3PoolContract } from "../src/interfaces/uniswap/pool/uniswapV3PoolContract";
import { UniswapV3FactoryContract } from "../src/interfaces/uniswap/uniswapV3FactoryContract";
import { WRAPPED_NATIVE_USDC_POOL_CONTRACT } from "../src/names/depends";
import {
  USDC_ETH_LP_ETH_AMOUNT_BASE,
  USDC_ETH_LP_USDC_AMOUNT_BASE,
} from "../src/testing/defiMetrics";
import { UNI_V3_FEE_AMOUNT, ZERO_ADDRESS } from "../src/utils/constants";
import { encodePriceSqrt } from "../src/utils/fixedMath";

//
// Deploy test token contracts
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  // Get the deployer signer
  const signers: SignerWithAddress[] = await getUnnamedSigners(hardhat_re);
  const deployer: ethers.Signer = signers[0] as unknown as ethers.Signer;

  // Get the network name
  const networkName: string = getNetworkName();

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Create WETH/USDC pool
  //////////////////////////////////////////////////////////////////////////////

  // Create contract
  const uniswapV3FactoryContract: UniswapV3FactoryContract =
    new UniswapV3FactoryContract(deployer, addressBook.uniswapV3Factory!);

  // Check if pool has been created
  let wrappedNativeUsdcPoolAddress: `0x${string}` =
    await uniswapV3FactoryContract.getPool(
      addressBook.wrappedNativeToken!,
      addressBook.usdcToken!,
      UNI_V3_FEE_AMOUNT.LOW,
    );

  // Create pool if it doesn't exist
  if (wrappedNativeUsdcPoolAddress == ZERO_ADDRESS) {
    wrappedNativeUsdcPoolAddress = await uniswapV3FactoryContract.createPool(
      addressBook.wrappedNativeToken!,
      addressBook.usdcToken!,
      UNI_V3_FEE_AMOUNT.LOW,
    );

    // Store pool address
    addressBook.wrappedNativeUsdcPool = wrappedNativeUsdcPoolAddress;
  }

  // Read token order
  const wrappedNativeUsdcPoolContract: UniswapV3PoolContract =
    new UniswapV3PoolContract(deployer, addressBook.wrappedNativeUsdcPool!);

  const token0: `0x${string}` = await wrappedNativeUsdcPoolContract.token0();
  const token1: `0x${string}` = await wrappedNativeUsdcPoolContract.token1();

  if (addressBook.wrappedNativeToken === token0) {
    console.log(`WETH is token0 (${addressBook.wrappedNativeToken})`);
    console.log(`USDC is token1 (${addressBook.usdcToken})`);
  } else if (addressBook.wrappedNativeToken === token1) {
    console.log(`WETH is token1 (${addressBook.wrappedNativeToken})`);
    console.log(`USDC is token0 (${addressBook.usdcToken})`);
  } else {
    // This should never happen, raise an exception
    throw new Error("ERROR: Neither token0 nor token1 is WETH!");
  }

  const wethIsToken0: boolean = addressBook.wrappedNativeToken === token0;

  //////////////////////////////////////////////////////////////////////////////
  // Initialize WETH/USDC pool
  //////////////////////////////////////////////////////////////////////////////

  // Check if pool is initialized
  let sqrtPriceX96: bigint = (await wrappedNativeUsdcPoolContract.slot0())
    .sqrtPriceX96;

  // Initialize POW1 pool if not initialized
  if (sqrtPriceX96 === 0n) {
    // Calculate price
    sqrtPriceX96 = encodePriceSqrt(
      wethIsToken0 ? USDC_ETH_LP_USDC_AMOUNT_BASE : USDC_ETH_LP_ETH_AMOUNT_BASE,
      wethIsToken0 ? USDC_ETH_LP_ETH_AMOUNT_BASE : USDC_ETH_LP_USDC_AMOUNT_BASE,
    );

    // Initialize pool
    console.log(`Initializing ${WRAPPED_NATIVE_USDC_POOL_CONTRACT}`);
    await wrappedNativeUsdcPoolContract.initialize(sqrtPriceX96);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Record addresses
  //////////////////////////////////////////////////////////////////////////////

  writeAddress(
    networkName,
    WRAPPED_NATIVE_USDC_POOL_CONTRACT,
    addressBook.wrappedNativeUsdcPool!,
  );
};

export default func;
func.tags = ["LiquidityPools"];
