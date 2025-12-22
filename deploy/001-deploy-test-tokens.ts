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
import { WRAPPED_NATIVE_TOKEN_CONTRACT } from "../src/names/depends";
import { USDC_CONTRACT } from "../src/names/testing";

//
// Deploy test token contracts
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
  // Deploy contracts
  //////////////////////////////////////////////////////////////////////////////

  // Deploy wrapped native token
  if (addressBook.wrappedNativeToken && networkName !== "localhost") {
    console.log(
      `Using ${WRAPPED_NATIVE_TOKEN_CONTRACT} at ${addressBook.wrappedNativeToken}`,
    );
  } else {
    console.log(`Deploying ${WRAPPED_NATIVE_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(WRAPPED_NATIVE_TOKEN_CONTRACT, opts);
    addressBook.wrappedNativeToken = tx.address as `0x${string}`;
  }

  // Deploy USDC token
  if (addressBook.usdcToken && networkName !== "localhost") {
    console.log(`Using ${USDC_CONTRACT} at ${addressBook.usdcToken}`);
  } else {
    console.log(`Deploying ${USDC_CONTRACT}`);
    const tx = await deployments.deploy(USDC_CONTRACT, opts);
    addressBook.usdcToken = tx.address as `0x${string}`;
  }
};

export default func;
func.tags = ["TestTokens"];
