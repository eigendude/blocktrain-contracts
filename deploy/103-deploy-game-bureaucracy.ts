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
        yieldToken: addressBook.yieldToken!,
        borrowToken: addressBook.borrowToken!,
        lpYieldToken: addressBook.lpYieldToken!,
        lpBorrowToken: addressBook.lpBorrowToken!,
        debtToken: addressBook.debtToken!,
        marketToken: addressBook.wrappedNativeToken!,
        stableToken: addressBook.usdcToken!,
        lpSft: addressBook.lpSft!,
        noLpSft: addressBook.noLpSft!,
        yieldMarketPool: addressBook.yieldMarketPool!,
        borrowStablePool: addressBook.borrowStablePool!,
        marketStablePool: addressBook.wrappedNativeUsdcPool!,
        yieldMarketSwapper: addressBook.yieldMarketSwapper!,
        borrowStableSwapper: addressBook.borrowStableSwapper!,
        marketStableSwapper: addressBook.wrappedNativeUsdcSwapper!,
        yieldMarketPooler: addressBook.yieldMarketPooler!,
        borrowStablePooler: addressBook.borrowStablePooler!,
        yieldLpNftStakeFarm: addressBook.yieldLpNftStakeFarm!,
        borrowLpNftStakeFarm: addressBook.borrowLpNftStakeFarm!,
        yieldLpSftLendFarm: addressBook.yieldLpSftLendFarm!,
        borrowLpSftLendFarm: addressBook.borrowLpSftLendFarm!,
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
      addressBook.borrowInterestFarm!, // erc20InterestFarm
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
func.tags = ["GameBureaucracy"];
