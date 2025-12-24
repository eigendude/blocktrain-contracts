/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";

import { getAddressBook } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
import { AddressBook } from "../src/interfaces/addressBook";
import {
  DEFI_MANAGER_CONTRACT,
  ERC20_INTEREST_FARM_CONTRACT,
  LPNFT_STAKE_FARM_CONTRACT,
  LPSFT_LEND_FARM_CONTRACT,
  POW5_INTEREST_FARM_CONTRACT,
  POW5_LPNFT_STAKE_FARM_CONTRACT,
  POW5_LPSFT_LEND_FARM_CONTRACT,
  UNIV3_STAKE_FARM_CONTRACT,
  YIELD_LPNFT_STAKE_FARM_CONTRACT,
  YIELD_LPSFT_LEND_FARM_CONTRACT,
} from "../src/names/dapp";
import { YIELD_DECIMALS } from "../src/utils/constants";

//
// Deployment parameters
//

const YIELD_LPNFT_STAKE_FARM_REWARD_RATE: bigint = ethers.parseUnits(
  "1",
  YIELD_DECIMALS,
); // 1 YIELD per lent LPYIELD per second
const YIELD_LPSFT_LEND_FARM_REWARD_RATE: bigint = ethers.parseUnits(
  "1",
  YIELD_DECIMALS,
); // 1 YIELD per lent LPYIELD per second
const POW5_LPSFT_LEND_FARM_REWARD_RATE: bigint = ethers.parseUnits(
  "1",
  YIELD_DECIMALS,
); // 1 YIELD per lent LPBORROW per second

const POW5_INTEREST_RATE: bigint = ethers.parseUnits("1", YIELD_DECIMALS); // 1 YIELD per lent POW5 per second

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
  // Deploy DeFi managers
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy DeFiManager
  //

  console.log(`Deploying ${DEFI_MANAGER_CONTRACT}`);
  const defiManagerTx = await deployments.deploy(DEFI_MANAGER_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.yieldToken!, // yieldToken
      addressBook.pow5Token!, // pow5Token
      addressBook.lpYieldToken!, // lpYieldToken
      addressBook.lpBorrowToken!, // lpBorrowToken
      addressBook.debtToken!, // debtToken
      addressBook.lpSft!, // lpSft
    ],
  });
  addressBook.defiManager = defiManagerTx.address as `0x${string}`;

  //////////////////////////////////////////////////////////////////////////////
  // Deploy YIELD DeFi farms
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy YIELDLpNftStakeFarm
  //

  console.log(`Deploying ${YIELD_LPNFT_STAKE_FARM_CONTRACT}`);
  const yieldLpNftStakeFarmTx = await deployments.deploy(
    YIELD_LPNFT_STAKE_FARM_CONTRACT,
    {
      ...opts,
      contract: LPNFT_STAKE_FARM_CONTRACT,
      args: [
        addressBook.lpSft!, // sftToken
        addressBook.yieldToken!, // rewardToken
        addressBook.lpYieldToken!, // lpToken
        addressBook.yieldToken!, // yieldToken
        addressBook.pow5Token!, // pow5Token
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
        YIELD_LPNFT_STAKE_FARM_REWARD_RATE, // rewardRate
      ],
    },
  );
  addressBook.yieldLpNftStakeFarm =
    yieldLpNftStakeFarmTx.address as `0x${string}`;

  //
  // Deploy YIELDLpSftLendFarm
  //

  console.log(`Deploying ${YIELD_LPSFT_LEND_FARM_CONTRACT}`);
  const yieldLpSftLendFarmTx = await deployments.deploy(
    YIELD_LPSFT_LEND_FARM_CONTRACT,
    {
      ...opts,
      contract: LPSFT_LEND_FARM_CONTRACT,
      args: [
        deployer, // owner
        addressBook.lpSft!, // sftToken
        addressBook.yieldToken!, // rewardToken
        addressBook.lpYieldToken!, // lpToken
        YIELD_LPSFT_LEND_FARM_REWARD_RATE, // rewardRate
      ],
    },
  );
  addressBook.yieldLpSftLendFarm =
    yieldLpSftLendFarmTx.address as `0x${string}`;

  //////////////////////////////////////////////////////////////////////////////
  // Deploy POW5 DeFi farms
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy POW5LpNftStakeFarm
  //

  console.log(`Deploying ${POW5_LPNFT_STAKE_FARM_CONTRACT}`);
  const pow5LpNftStakeFarmTx = await deployments.deploy(
    POW5_LPNFT_STAKE_FARM_CONTRACT,
    {
      ...opts,
      contract: UNIV3_STAKE_FARM_CONTRACT,
      args: [
        deployer, // owner
        addressBook.lpSft!, // sftToken
        addressBook.yieldToken!, // rewardToken
        addressBook.pow5StablePool!, // uniswapV3Pool
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
        addressBook.uniswapV3Staker!, // uniswapV3Staker
      ],
    },
  );
  addressBook.pow5LpNftStakeFarm =
    pow5LpNftStakeFarmTx.address as `0x${string}`;

  //
  // Deploy POW5LpSftLendFarm
  //

  console.log(`Deploying ${POW5_LPSFT_LEND_FARM_CONTRACT}`);
  const pow5LpSftLendFarmTx = await deployments.deploy(
    POW5_LPSFT_LEND_FARM_CONTRACT,
    {
      ...opts,
      contract: LPSFT_LEND_FARM_CONTRACT,
      args: [
        deployer, // owner
        addressBook.lpSft!, // sftToken
        addressBook.yieldToken!, // rewardToken
        addressBook.lpBorrowToken!, // lpToken
        POW5_LPSFT_LEND_FARM_REWARD_RATE, // rewardRate
      ],
    },
  );
  addressBook.pow5LpSftLendFarm = pow5LpSftLendFarmTx.address as `0x${string}`;

  //
  // Deploy POW5InterestFarm
  //

  console.log(`Deploying ${POW5_INTEREST_FARM_CONTRACT}`);
  const pow5InterestFarmTx = await deployments.deploy(
    POW5_INTEREST_FARM_CONTRACT,
    {
      ...opts,
      contract: ERC20_INTEREST_FARM_CONTRACT,
      args: [
        deployer, // owner
        addressBook.yieldToken!, // rewardToken
        POW5_INTEREST_RATE, // rewardRate
      ],
    },
  );
  addressBook.pow5InterestFarm = pow5InterestFarmTx.address as `0x${string}`;
};

export default func;
func.tags = ["POWDeFi"];
