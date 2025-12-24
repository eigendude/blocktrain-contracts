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

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";

import { getAddressBook, writeAddress } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
import { AddressBook } from "../src/interfaces/addressBook";
import {
  MARKET_STABLE_SWAPPER_CONTRACT,
  POW1_MARKET_POOL_CONTRACT,
  POW1_MARKET_POOL_FACTORY_CONTRACT,
  POW1_MARKET_POOLER_CONTRACT,
  POW1_MARKET_SWAPPER_CONTRACT,
  POW5_STABLE_POOL_CONTRACT,
  POW5_STABLE_POOL_FACTORY_CONTRACT,
  POW5_STABLE_POOLER_CONTRACT,
  POW5_STABLE_SWAPPER_CONTRACT,
  UNI_V3_POOL_FACTORY_CONTRACT,
} from "../src/names/dapp";
import { LPPOW5_POOL_FEE, LPYIELD_POOL_FEE } from "../src/utils/constants";

//
// Deploy the Uniswap V3 pool factory and token routes
//
const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hardhat_re;
  const { deployer } = await getNamedAccounts();

  const opts: DeployOptions = {
    deterministicDeployment: true,
    from: deployer,
    log: true,
  };

  // Get the network name
  const networkName: string = getNetworkName();

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Deploy POW1 contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy Uniswap V3 pool factory for POW1
  //

  console.log(`Deploying ${POW1_MARKET_POOL_FACTORY_CONTRACT}`);
  const pow1MarketPoolFactoryTx = await deployments.deploy(
    POW1_MARKET_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!, // factory
        addressBook.pow1Token!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        LPYIELD_POOL_FEE, // swapFee
      ],
    },
  );
  addressBook.pow1MarketPoolFactory =
    pow1MarketPoolFactoryTx.address as `0x${string}`;

  //
  // Read Uniswap V3 pool address for POW1
  //

  addressBook.pow1MarketPool = await deployments.read(
    POW1_MARKET_POOL_FACTORY_CONTRACT,
    "uniswapV3Pool",
  );

  //
  // Deploy POW1MarketSwapper
  //

  console.log(`Deploying ${POW1_MARKET_SWAPPER_CONTRACT}`);
  const pow1MarketSwapperTx = await deployments.deploy(
    POW1_MARKET_SWAPPER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.pow1Token!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        addressBook.pow1MarketPool!, // uniswapV3Pool
      ],
    },
  );
  addressBook.pow1MarketSwapper = pow1MarketSwapperTx.address as `0x${string}`;

  //
  // Deploy POW1MarketPooler
  //

  console.log(`Deploying ${POW1_MARKET_POOLER_CONTRACT}`);
  const pow1MarketPoolerTx = await deployments.deploy(
    POW1_MARKET_POOLER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.pow1Token!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        addressBook.pow1MarketPool!, // uniswapV3Pool
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    },
  );
  addressBook.pow1MarketPooler = pow1MarketPoolerTx.address as `0x${string}`;

  //////////////////////////////////////////////////////////////////////////////
  // Deploy POW5 contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy Uniswap V3 pool factory for POW5
  //

  console.log(`Deploying ${POW5_STABLE_POOL_FACTORY_CONTRACT}`);
  const pow5StablePoolFactoryTx = await deployments.deploy(
    POW5_STABLE_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!, // factory
        addressBook.pow5Token!, // gameToken
        addressBook.usdcToken!, // assetToken
        LPPOW5_POOL_FEE, // swapFee
      ],
    },
  );
  addressBook.pow5StablePoolFactory =
    pow5StablePoolFactoryTx.address as `0x${string}`;

  //
  // Read Uniswap V3 pool address for POW5
  //

  addressBook.pow5StablePool = await deployments.read(
    POW5_STABLE_POOL_FACTORY_CONTRACT,
    "uniswapV3Pool",
  );

  //
  // Deploy POW5StableSwapper
  //

  console.log(`Deploying ${POW5_STABLE_SWAPPER_CONTRACT}`);
  const pow5StableSwapperTx = await deployments.deploy(
    POW5_STABLE_SWAPPER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.pow5Token!, // gameToken
        addressBook.usdcToken!, // assetToken
        addressBook.pow5StablePool!, // uniswapV3Pool
      ],
    },
  );
  addressBook.pow5StableSwapper = pow5StableSwapperTx.address as `0x${string}`;

  //
  // Deploy POW5StablePooler
  //

  console.log(`Deploying ${POW5_STABLE_POOLER_CONTRACT}`);
  const pow5StablePoolerTx = await deployments.deploy(
    POW5_STABLE_POOLER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.pow5Token!, // gameToken
        addressBook.usdcToken!, // assetToken
        addressBook.pow5StablePool!, // uniswapV3Pool
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    },
  );
  addressBook.pow5StablePooler = pow5StablePoolerTx.address as `0x${string}`;

  //////////////////////////////////////////////////////////////////////////////
  // Deploy DEX contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy MarketStableSwapper
  //

  console.log(`Deploying ${MARKET_STABLE_SWAPPER_CONTRACT}`);
  const marketStableSwapperTx = await deployments.deploy(
    MARKET_STABLE_SWAPPER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.wrappedNativeToken!, // marketToken
        addressBook.usdcToken!, // stableToken
        addressBook.wrappedNativeUsdcPool!, // marketStablePool
      ],
    },
  );
  addressBook.wrappedNativeUsdcSwapper =
    marketStableSwapperTx.address as `0x${string}`;

  //////////////////////////////////////////////////////////////////////////////
  // Record addresses
  //////////////////////////////////////////////////////////////////////////////

  writeAddress(
    networkName,
    POW1_MARKET_POOL_CONTRACT,
    addressBook.pow1MarketPool!,
  );
  writeAddress(
    networkName,
    POW5_STABLE_POOL_CONTRACT,
    addressBook.pow5StablePool!,
  );
};

export default func;
func.tags = ["POWPools"];
