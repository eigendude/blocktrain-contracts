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
  DEBT_TOKEN_CONTRACT,
  LPBORROW_TOKEN_CONTRACT,
  LPNFT_CONTRACT,
  LPSFT_CONTRACT,
  LPYIELD_TOKEN_CONTRACT,
  NOLPSFT_CONTRACT,
  POW5_TOKEN_CONTRACT,
  YIELD_TOKEN_CONTRACT,
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
  // Deploy contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy YIELD token
  //

  if (addressBook.yieldToken && networkName !== "localhost") {
    console.log(`Using ${YIELD_TOKEN_CONTRACT} at ${addressBook.yieldToken}`);
  } else {
    console.log(`Deploying ${YIELD_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(YIELD_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.yieldToken = tx.address as `0x${string}`;
  }

  //
  // Deploy POW5 token
  //

  if (addressBook.pow5Token && networkName !== "localhost") {
    console.log(`Using ${POW5_TOKEN_CONTRACT} at ${addressBook.pow5Token}`);
  } else {
    console.log(`Deploying ${POW5_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(POW5_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.pow5Token = tx.address as `0x${string}`;
  }

  //
  // Deploy LPYIELD token
  //

  if (addressBook.lpYieldToken && networkName !== "localhost") {
    console.log(
      `Using ${LPYIELD_TOKEN_CONTRACT} at ${addressBook.lpYieldToken}`,
    );
  } else {
    console.log(`Deploying ${LPYIELD_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(LPYIELD_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.lpYieldToken = tx.address as `0x${string}`;
  }

  //
  // Deploy LPBORROW token
  //

  if (addressBook.lpBorrowToken && networkName !== "localhost") {
    console.log(
      `Using ${LPBORROW_TOKEN_CONTRACT} at ${addressBook.lpBorrowToken}`,
    );
  } else {
    console.log(`Deploying ${LPBORROW_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(LPBORROW_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.lpBorrowToken = tx.address as `0x${string}`;
  }

  //
  // Deploy DEBT token
  //

  if (addressBook.debtToken && networkName !== "localhost") {
    console.log(`Using ${DEBT_TOKEN_CONTRACT} at ${addressBook.debtToken}`);
  } else {
    console.log(`Deploying ${DEBT_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(DEBT_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.debtToken = tx.address as `0x${string}`;
  }

  //
  // Deploy LP-NFT template contract
  //

  if (addressBook.lpNft && networkName !== "localhost") {
    console.log(`Using ${LPNFT_CONTRACT} at ${addressBook.lpNft}`);
  } else {
    console.log(`Deploying ${LPNFT_CONTRACT}`);
    const tx = await deployments.deploy(LPNFT_CONTRACT, {
      ...opts,
      args: [
        addressBook.yieldToken!, // yieldToken
        addressBook.pow5Token!, // pow5Token
        addressBook.lpYieldToken!, // lpYieldToken
        addressBook.lpBorrowToken!, // lpBorrowToken
        addressBook.debtToken!, // debtToken
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    });
    addressBook.lpNft = tx.address as `0x${string}`;
  }

  //
  // Deploy LP-SFT token
  //

  if (addressBook.lpSft && networkName !== "localhost") {
    console.log(`Using ${LPSFT_CONTRACT} at ${addressBook.lpSft}`);
  } else {
    console.log(`Deploying ${LPSFT_CONTRACT}`);
    const tx = await deployments.deploy(LPSFT_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
        addressBook.lpNft!, // lpNftTemplate
        addressBook.yieldToken!, // yieldToken
        addressBook.pow5Token!, // pow5Token
        addressBook.lpYieldToken!, // lpYieldToken
        addressBook.lpBorrowToken!, // lpBorrowToken
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    });
    addressBook.lpSft = tx.address as `0x${string}`;
  }

  //
  // Deploy NOLPSFT token
  //

  if (addressBook.noLpSft && networkName !== "localhost") {
    console.log(`Using ${NOLPSFT_CONTRACT} at ${addressBook.noLpSft}`);
  } else {
    console.log(`Deploying ${NOLPSFT_CONTRACT}`);
    const tx = await deployments.deploy(NOLPSFT_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
        addressBook.lpSft!, // lpSft
      ],
    });
    addressBook.noLpSft = tx.address as `0x${string}`;
  }
};

export default func;
func.tags = ["POWTokens"];
