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

import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

//
// Deployment parameters
//

const DEPLOYER_ETH: string = "10000"; // 10,000 ETH

//
// Deploy test token contracts
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, network } = hardhat_re;

  const { deployer } = await getNamedAccounts();

  //////////////////////////////////////////////////////////////////////////////
  // Fund deployer
  //////////////////////////////////////////////////////////////////////////////

  // Convert ETH to hex
  const balanceInWeiHex: string = ethers.toQuantity(
    ethers.parseEther(DEPLOYER_ETH),
  );

  await network.provider.send("hardhat_setBalance", [
    deployer,
    balanceInWeiHex,
  ]);
};

export default func;
func.tags = ["FundDeployer"];
