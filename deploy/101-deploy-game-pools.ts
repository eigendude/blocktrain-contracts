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
  BORROW_STABLE_POOL_CONTRACT,
  BORROW_STABLE_POOL_FACTORY_CONTRACT,
  BORROW_STABLE_POOLER_CONTRACT,
  BORROW_STABLE_SWAPPER_CONTRACT,
  MARKET_STABLE_SWAPPER_CONTRACT,
  UNI_V3_POOL_FACTORY_CONTRACT,
  YIELD_MARKET_POOL_CONTRACT,
  YIELD_MARKET_POOL_FACTORY_CONTRACT,
  YIELD_MARKET_POOLER_CONTRACT,
  YIELD_MARKET_SWAPPER_CONTRACT,
} from "../src/names/dapp";
import { LPBORROW_POOL_FEE, LPYIELD_POOL_FEE } from "../src/utils/constants";

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
  // Deploy YIELD contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy Uniswap V3 pool factory for YIELD
  //

  console.log(`Deploying ${YIELD_MARKET_POOL_FACTORY_CONTRACT}`);
  const yieldMarketPoolFactoryTx = await deployments.deploy(
    YIELD_MARKET_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!, // factory
        addressBook.yieldToken!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        LPYIELD_POOL_FEE, // swapFee
      ],
    },
  );
  addressBook.yieldMarketPoolFactory =
    yieldMarketPoolFactoryTx.address as `0x${string}`;

  //
  // Read Uniswap V3 pool address for YIELD
  //

  addressBook.yieldMarketPool = await deployments.read(
    YIELD_MARKET_POOL_FACTORY_CONTRACT,
    "uniswapV3Pool",
  );

  //
  // Deploy YIELDMarketSwapper
  //

  console.log(`Deploying ${YIELD_MARKET_SWAPPER_CONTRACT}`);
  const yieldMarketSwapperTx = await deployments.deploy(
    YIELD_MARKET_SWAPPER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.yieldToken!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        addressBook.yieldMarketPool!, // uniswapV3Pool
      ],
    },
  );
  addressBook.yieldMarketSwapper =
    yieldMarketSwapperTx.address as `0x${string}`;

  //
  // Deploy YIELDMarketPooler
  //

  console.log(`Deploying ${YIELD_MARKET_POOLER_CONTRACT}`);
  const yieldMarketPoolerTx = await deployments.deploy(
    YIELD_MARKET_POOLER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.yieldToken!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        addressBook.yieldMarketPool!, // uniswapV3Pool
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    },
  );
  addressBook.yieldMarketPooler = yieldMarketPoolerTx.address as `0x${string}`;

  //////////////////////////////////////////////////////////////////////////////
  // Deploy BORROW contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy Uniswap V3 pool factory for BORROW
  //

  console.log(`Deploying ${BORROW_STABLE_POOL_FACTORY_CONTRACT}`);
  const borrowStablePoolFactoryTx = await deployments.deploy(
    BORROW_STABLE_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!, // factory
        addressBook.borrowToken!, // gameToken
        addressBook.usdcToken!, // assetToken
        LPBORROW_POOL_FEE, // swapFee
      ],
    },
  );
  addressBook.borrowStablePoolFactory =
    borrowStablePoolFactoryTx.address as `0x${string}`;

  //
  // Read Uniswap V3 pool address for BORROW
  //

  addressBook.borrowStablePool = await deployments.read(
    BORROW_STABLE_POOL_FACTORY_CONTRACT,
    "uniswapV3Pool",
  );

  //
  // Deploy BORROWStableSwapper
  //

  console.log(`Deploying ${BORROW_STABLE_SWAPPER_CONTRACT}`);
  const borrowStableSwapperTx = await deployments.deploy(
    BORROW_STABLE_SWAPPER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.borrowToken!, // gameToken
        addressBook.usdcToken!, // assetToken
        addressBook.borrowStablePool!, // uniswapV3Pool
      ],
    },
  );
  addressBook.borrowStableSwapper =
    borrowStableSwapperTx.address as `0x${string}`;

  //
  // Deploy BORROWStablePooler
  //

  console.log(`Deploying ${BORROW_STABLE_POOLER_CONTRACT}`);
  const borrowStablePoolerTx = await deployments.deploy(
    BORROW_STABLE_POOLER_CONTRACT,
    {
      ...opts,
      args: [
        addressBook.borrowToken!, // gameToken
        addressBook.usdcToken!, // assetToken
        addressBook.borrowStablePool!, // uniswapV3Pool
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    },
  );
  addressBook.borrowStablePooler =
    borrowStablePoolerTx.address as `0x${string}`;

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
    YIELD_MARKET_POOL_CONTRACT,
    addressBook.yieldMarketPool!,
  );
  writeAddress(
    networkName,
    BORROW_STABLE_POOL_CONTRACT,
    addressBook.borrowStablePool!,
  );
};

export default func;
func.tags = ["GamePools"];
