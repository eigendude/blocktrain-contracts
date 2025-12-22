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
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";
import { getUnnamedSigners } from "hardhat-deploy-ethers/dist/src/helpers";

import { wrappedNativeTokenAbi } from "../src/abi/depends";
import { getAddressBook, writeAddress } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
import { AddressBook } from "../src/interfaces/addressBook";
import {
  NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_FACTORY_CONTRACT,
  UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_NFT_MANAGER_CONTRACT,
  UNISWAP_V3_STAKER_CONTRACT,
} from "../src/names/depends";

//
// Deployment parameters
//

const DEPLOYER_ETH: string = "1"; // 1 ETH

//
// Deploy the Uniswap V3 environment
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { deployments, ethers, network } = hardhat_re;

  // Get the deployer signer
  const signers: SignerWithAddress[] = await getUnnamedSigners(hardhat_re);
  const deployer: SignerWithAddress = signers[0];
  const deployerAddress: `0x${string}` =
    (await deployer.getAddress()) as `0x${string}`;

  const opts: DeployOptions = {
    deterministicDeployment: true,
    from: deployerAddress,
    log: true,
  };

  // Get the network name
  const networkName: string = getNetworkName();

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Fund deployer
  //////////////////////////////////////////////////////////////////////////////

  // Convert ETH to hex
  const balanceInWeiHex: string = ethers.toQuantity(
    ethers.parseEther(DEPLOYER_ETH),
  );

  await network.provider.send("hardhat_setBalance", [
    deployerAddress,
    balanceInWeiHex,
  ]);

  //////////////////////////////////////////////////////////////////////////////
  // Read W-ETH token symbol
  //////////////////////////////////////////////////////////////////////////////

  // Read W-ETH token symbol
  const wrappedNativeTokenContract = new ethers.Contract(
    addressBook.wrappedNativeToken!,
    wrappedNativeTokenAbi,
    deployer,
  );
  const wrappedNativeTokenSymbol: string =
    await wrappedNativeTokenContract.symbol();

  //////////////////////////////////////////////////////////////////////////////
  // Deploy contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy UniswapV3Factory
  //

  if (addressBook.uniswapV3Factory && networkName !== "localhost") {
    console.log(
      `Using ${UNISWAP_V3_FACTORY_CONTRACT} at ${addressBook.uniswapV3Factory}`,
    );
  } else {
    console.log(`Deploying ${UNISWAP_V3_FACTORY_CONTRACT}`);
    const tx = await deployments.deploy(UNISWAP_V3_FACTORY_CONTRACT, {
      ...opts,
      args: [deployerAddress],
    });
    addressBook.uniswapV3Factory = tx.address as `0x${string}`;
  }

  //
  // Deploy NonfungibleTokenPositionDescriptor
  //
  // TODO: This contract must be deployed with the ethers contract factory
  // because it requires a library, and as a result deployment files are
  // not generated. This is a known issue with hardhat-deploy.
  //
  // Additionally the contract is always deployed on the hardhat network
  // because it saves its address during deployment, and future deployments
  // use the saved address.
  //

  if (addressBook.uniswapV3NftDescriptor && networkName !== "localhost") {
    console.log(
      `Using ${UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT} at ${addressBook.uniswapV3NftDescriptor}`,
    );
  } else {
    // Deploy NFTDescriptor
    console.log(`Deploying ${NFT_DESCRIPTOR_CONTRACT}`);
    const NFTDescriptor = await ethers.getContractFactory(
      NFT_DESCRIPTOR_CONTRACT,
      opts,
    );
    const nftDescriptor = await NFTDescriptor.deploy();
    const nftDescriptorAddress =
      (await nftDescriptor.getAddress()) as `0x${string}`;

    // Deploy NonfungibleTokenPositionDescriptor
    console.log(`Deploying ${UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT}`);
    const UniswapV3NftDescriptor = await ethers.getContractFactory(
      UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
      {
        ...opts,
        libraries: {
          NFTDescriptor: nftDescriptorAddress,
        },
      },
    );
    const uniswapV3NftDescriptor = await UniswapV3NftDescriptor.deploy(
      addressBook.wrappedNativeToken!, // WETH9
      ethers.encodeBytes32String(wrappedNativeTokenSymbol), // nativeCurrencyLabelBytes
    );
    addressBook.uniswapV3NftDescriptor =
      (await uniswapV3NftDescriptor.getAddress()) as `0x${string}`;
  }

  // Mine the next block to commit contractfactory deployment
  await hardhat_re.network.provider.request({
    method: "evm_mine",
    params: [],
  });

  //
  // Deploy NonfungiblePositionManager
  //

  if (addressBook.uniswapV3NftManager && networkName !== "localhost") {
    console.log(
      `Using ${UNISWAP_V3_NFT_MANAGER_CONTRACT} at ${addressBook.uniswapV3NftManager}`,
    );
  } else {
    console.log(`Deploying ${UNISWAP_V3_NFT_MANAGER_CONTRACT}`);
    const tx = await deployments.deploy(UNISWAP_V3_NFT_MANAGER_CONTRACT, {
      ...opts,
      args: [
        addressBook.uniswapV3Factory,
        addressBook.wrappedNativeToken,
        addressBook.uniswapV3NftDescriptor,
      ],
    });
    addressBook.uniswapV3NftManager = tx.address as `0x${string}`;
  }

  //
  // Deploy UniswapV3Staker
  //

  if (addressBook.uniswapV3Staker && networkName !== "localhost") {
    console.log(
      `Using ${UNISWAP_V3_STAKER_CONTRACT} at ${addressBook.uniswapV3Staker}`,
    );
  } else {
    console.log(`Deploying ${UNISWAP_V3_STAKER_CONTRACT}`);
    const tx = await deployments.deploy(UNISWAP_V3_STAKER_CONTRACT, {
      ...opts,
      args: [
        addressBook.uniswapV3Factory,
        addressBook.uniswapV3NftManager,
        0, // maxIncentiveStartLeadTime
        ethers.MaxUint256, // maxIncentiveDuration
      ],
    });
    addressBook.uniswapV3Staker = tx.address as `0x${string}`;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Record addresses
  //////////////////////////////////////////////////////////////////////////////

  writeAddress(
    networkName,
    UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
    addressBook.uniswapV3NftDescriptor!,
  );
};

export default func;
func.tags = ["UniswapV3"];
