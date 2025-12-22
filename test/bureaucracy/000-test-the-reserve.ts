/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { setupFixture } from "../../src/testing/setupFixture";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test cases
//

describe("The Reserve Smart Contract", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let addressBook: AddressBook;
  let deployerContracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the accounts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);

    // Get the contract library
    deployerContracts = getContractLibrary(deployer, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test routes
  //////////////////////////////////////////////////////////////////////////////

  it("should test routes", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      lpPow1Contract,
      lpPow5Contract,
      lpSftContract,
      noLpSftContract,
      noPow5Contract,
      pow1Contract,
      pow1LpNftStakeFarmContract,
      pow1LpSftLendFarmContract,
      pow1MarketPoolContract,
      pow1MarketPoolerContract,
      pow1MarketSwapperContract,
      pow5Contract,
      pow5LpNftStakeFarmContract,
      pow5LpSftLendFarmContract,
      pow5StablePoolContract,
      pow5StablePoolerContract,
      pow5StableSwapperContract,
      theReserveContract,
      uniswapV3FactoryContract,
      usdcContract,
      wrappedNativeContract,
      wrappedNativeUsdcPoolContract,
      wrappedNativeUsdcSwapperContract,
    } = deployerContracts;

    // Test routes
    chai
      .expect(await theReserveContract.pow1Token())
      .to.equal(pow1Contract.address);
    chai
      .expect(await theReserveContract.pow5Token())
      .to.equal(pow5Contract.address);
    chai
      .expect(await theReserveContract.lpPow1Token())
      .to.equal(lpPow1Contract.address);
    chai
      .expect(await theReserveContract.lpPow5Token())
      .to.equal(lpPow5Contract.address);
    chai
      .expect(await theReserveContract.noPow5Token())
      .to.equal(noPow5Contract.address);
    chai
      .expect(await theReserveContract.marketToken())
      .to.equal(wrappedNativeContract.address);
    chai
      .expect(await theReserveContract.stableToken())
      .to.equal(usdcContract.address);
    chai
      .expect(await theReserveContract.lpSft())
      .to.equal(lpSftContract.address);
    chai
      .expect(await theReserveContract.noLpSft())
      .to.equal(noLpSftContract.address);
    chai
      .expect(await theReserveContract.pow1MarketPool())
      .to.equal(pow1MarketPoolContract.address);
    chai
      .expect(await theReserveContract.pow5StablePool())
      .to.equal(pow5StablePoolContract.address);
    chai
      .expect(await theReserveContract.marketStablePool())
      .to.equal(wrappedNativeUsdcPoolContract.address);
    chai
      .expect(await theReserveContract.pow1MarketSwapper())
      .to.equal(pow1MarketSwapperContract.address);
    chai
      .expect(await theReserveContract.pow5StableSwapper())
      .to.equal(pow5StableSwapperContract.address);
    chai
      .expect(await theReserveContract.marketStableSwapper())
      .to.equal(wrappedNativeUsdcSwapperContract.address);
    chai
      .expect(await theReserveContract.pow1MarketPooler())
      .to.equal(pow1MarketPoolerContract.address);
    chai
      .expect(await theReserveContract.pow5StablePooler())
      .to.equal(pow5StablePoolerContract.address);
    chai
      .expect(await theReserveContract.pow1LpNftStakeFarm())
      .to.equal(pow1LpNftStakeFarmContract.address);
    chai
      .expect(await theReserveContract.pow5LpNftStakeFarm())
      .to.equal(pow5LpNftStakeFarmContract.address);
    chai
      .expect(await theReserveContract.pow1LpSftLendFarm())
      .to.equal(pow1LpSftLendFarmContract.address);
    chai
      .expect(await theReserveContract.pow5LpSftLendFarm())
      .to.equal(pow5LpSftLendFarmContract.address);
    chai
      .expect(await theReserveContract.uniswapV3Factory())
      .to.equal(uniswapV3FactoryContract.address);
    chai
      .expect(await theReserveContract.uniswapV3NftManager())
      .to.equal(addressBook.uniswapV3NftManager!);
  });
});
