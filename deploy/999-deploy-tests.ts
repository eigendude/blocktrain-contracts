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

import { getAddressBook } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
import { AddressBook } from "../src/interfaces/addressBook";
import {
  TEST_ERC1155_ENUMERABLE_CONTRACT,
  TEST_LIQUIDITY_MATH_CONTRACT,
  TEST_POW1_MARKET_STAKER_CONTRACT,
  TEST_POW5_STABLE_STAKER_CONTRACT,
  TEST_REWARD_MATH_CONTRACT,
  TEST_STRING_UTILS_CONTRACT,
  TEST_TICK_MATH_CONTRACT,
} from "../src/names/testing";

//
// Deploy test contracts
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

  //
  // Deploy TestERC1155Enumerable
  //

  console.log(`Deploying ${TEST_ERC1155_ENUMERABLE_CONTRACT}`);
  await deployments.deploy(TEST_ERC1155_ENUMERABLE_CONTRACT, opts);

  //
  // Deploy TestLiquidityMath
  //

  console.log(`Deploying ${TEST_LIQUIDITY_MATH_CONTRACT}`);
  await deployments.deploy(TEST_LIQUIDITY_MATH_CONTRACT, opts);

  //
  // Deploy TestTickMath
  //

  console.log(`Deploying ${TEST_TICK_MATH_CONTRACT}`);
  await deployments.deploy(TEST_TICK_MATH_CONTRACT, opts);

  //
  // Deploy TestRewardMath
  //

  console.log(`Deploying ${TEST_REWARD_MATH_CONTRACT}`);
  await deployments.deploy(TEST_REWARD_MATH_CONTRACT, opts);

  //
  // Deploy TestStringUtils
  //

  console.log(`Deploying ${TEST_STRING_UTILS_CONTRACT}`);
  await deployments.deploy(TEST_STRING_UTILS_CONTRACT, opts);

  //
  // Deploy TestPOW1MarketStaker
  //

  console.log(`Deploying ${TEST_POW1_MARKET_STAKER_CONTRACT}`);
  await deployments.deploy(TEST_POW1_MARKET_STAKER_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.pow1Token!, // pow1Token
      addressBook.wrappedNativeToken!, // marketToken
      addressBook.pow1Token!, // rewardToken
      addressBook.pow1MarketPool!, // pow1MarketPool
      addressBook.pow1MarketPooler!, // pow1MarketPooler
      addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      addressBook.uniswapV3Staker!, // uniswapV3Staker
      addressBook.lpSft!, // lpSft
    ],
  });

  //
  // Deploy TestPOW5StableStaker
  //

  console.log(`Deploying ${TEST_POW5_STABLE_STAKER_CONTRACT}`);
  await deployments.deploy(TEST_POW5_STABLE_STAKER_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.pow5Token!, // pow5Token
      addressBook.usdcToken!, // stableToken
      addressBook.pow1Token!, // rewardToken
      addressBook.pow5StablePool!, // pow5StablePool
      addressBook.pow5StablePooler!, // pow5StablePooler
      addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      addressBook.uniswapV3Staker!, // uniswapV3Staker
      addressBook.lpSft!, // lpSft
    ],
  });
};

export default func;
func.tags = ["Tests"];
