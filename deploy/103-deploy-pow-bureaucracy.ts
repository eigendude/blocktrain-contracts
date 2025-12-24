/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";

import { getAddressBook } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
import { AddressBook } from "../src/interfaces/addressBook";
import {
  DUTCH_AUCTION_CONTRACT,
  LIQUIDITY_FORGE_CONTRACT,
  REVERSE_REPO_CONTRACT,
  THE_RESERVE_CONTRACT,
  YIELD_HARVEST_CONTRACT,
} from "../src/names/dapp";

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
  // Deploy bureaucracy contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy TheReserve
  //

  console.log(`Deploying ${THE_RESERVE_CONTRACT}`);
  const theReserveTx = await deployments.deploy(THE_RESERVE_CONTRACT, {
    ...opts,
    args: [
      {
        pow1Token: addressBook.pow1Token!,
        pow5Token: addressBook.pow5Token!,
        lpPow1Token: addressBook.lpPow1Token!,
        lpPow5Token: addressBook.lpPow5Token!,
        debtToken: addressBook.debtToken!,
        marketToken: addressBook.wrappedNativeToken!,
        stableToken: addressBook.usdcToken!,
        lpSft: addressBook.lpSft!,
        noLpSft: addressBook.noLpSft!,
        pow1MarketPool: addressBook.pow1MarketPool!,
        pow5StablePool: addressBook.pow5StablePool!,
        marketStablePool: addressBook.wrappedNativeUsdcPool!,
        pow1MarketSwapper: addressBook.pow1MarketSwapper!,
        pow5StableSwapper: addressBook.pow5StableSwapper!,
        marketStableSwapper: addressBook.wrappedNativeUsdcSwapper!,
        pow1MarketPooler: addressBook.pow1MarketPooler!,
        pow5StablePooler: addressBook.pow5StablePooler!,
        pow1LpNftStakeFarm: addressBook.pow1LpNftStakeFarm!,
        pow5LpNftStakeFarm: addressBook.pow5LpNftStakeFarm!,
        pow1LpSftLendFarm: addressBook.pow1LpSftLendFarm!,
        pow5LpSftLendFarm: addressBook.pow5LpSftLendFarm!,
        uniswapV3Factory: addressBook.uniswapV3Factory!,
        uniswapV3NftManager: addressBook.uniswapV3NftManager!,
      },
    ],
  });
  addressBook.theReserve = theReserveTx.address as `0x${string}`;

  //
  // Deploy DutchAuction
  //

  console.log(`Deploying ${DUTCH_AUCTION_CONTRACT}`);
  const dutchAuctionTx = await deployments.deploy(DUTCH_AUCTION_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.theReserve!, // theReserve
    ],
  });
  addressBook.dutchAuction = dutchAuctionTx.address as `0x${string}`;

  //
  // Deploy YieldHarvest
  //

  console.log(`Deploying ${YIELD_HARVEST_CONTRACT}`);
  const yieldHarvestTx = await deployments.deploy(YIELD_HARVEST_CONTRACT, {
    ...opts,
    args: [
      addressBook.theReserve!, // theReserve
      addressBook.defiManager!, // defiManager
    ],
  });
  addressBook.yieldHarvest = yieldHarvestTx.address as `0x${string}`;

  //
  // Deploy LiquidityForge
  //

  console.log(`Deploying ${LIQUIDITY_FORGE_CONTRACT}`);
  const liquidityForgeTx = await deployments.deploy(LIQUIDITY_FORGE_CONTRACT, {
    ...opts,
    args: [
      addressBook.theReserve!, // theReserve
      addressBook.defiManager!, // defiManager
      addressBook.yieldHarvest!, // yieldHarvest
      addressBook.pow5InterestFarm!, // erc20InterestFarm
    ],
  });
  addressBook.liquidityForge = liquidityForgeTx.address as `0x${string}`;

  //
  // Deploy ReverseRepo
  //

  console.log(`Deploying ${REVERSE_REPO_CONTRACT}`);
  const reverseRepoTx = await deployments.deploy(REVERSE_REPO_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.theReserve!, // theReserve
    ],
  });
  addressBook.reverseRepo = reverseRepoTx.address as `0x${string}`;
};

export default func;
func.tags = ["POWBureaucracy"];
