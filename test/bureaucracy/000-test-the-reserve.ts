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
      lpYieldContract,
      lpBorrowContract,
      lpSftContract,
      noLpSftContract,
      debtContract,
      yieldContract,
      yieldLpNftStakeFarmContract,
      yieldLpSftLendFarmContract,
      yieldMarketPoolContract,
      yieldMarketPoolerContract,
      yieldMarketSwapperContract,
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
      .expect(await theReserveContract.yieldToken())
      .to.equal(yieldContract.address);
    chai
      .expect(await theReserveContract.pow5Token())
      .to.equal(pow5Contract.address);
    chai
      .expect(await theReserveContract.lpYieldToken())
      .to.equal(lpYieldContract.address);
    chai
      .expect(await theReserveContract.lpBorrowToken())
      .to.equal(lpBorrowContract.address);
    chai
      .expect(await theReserveContract.debtToken())
      .to.equal(debtContract.address);
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
      .expect(await theReserveContract.yieldMarketPool())
      .to.equal(yieldMarketPoolContract.address);
    chai
      .expect(await theReserveContract.pow5StablePool())
      .to.equal(pow5StablePoolContract.address);
    chai
      .expect(await theReserveContract.marketStablePool())
      .to.equal(wrappedNativeUsdcPoolContract.address);
    chai
      .expect(await theReserveContract.yieldMarketSwapper())
      .to.equal(yieldMarketSwapperContract.address);
    chai
      .expect(await theReserveContract.pow5StableSwapper())
      .to.equal(pow5StableSwapperContract.address);
    chai
      .expect(await theReserveContract.marketStableSwapper())
      .to.equal(wrappedNativeUsdcSwapperContract.address);
    chai
      .expect(await theReserveContract.yieldMarketPooler())
      .to.equal(yieldMarketPoolerContract.address);
    chai
      .expect(await theReserveContract.pow5StablePooler())
      .to.equal(pow5StablePoolerContract.address);
    chai
      .expect(await theReserveContract.yieldLpNftStakeFarm())
      .to.equal(yieldLpNftStakeFarmContract.address);
    chai
      .expect(await theReserveContract.pow5LpNftStakeFarm())
      .to.equal(pow5LpNftStakeFarmContract.address);
    chai
      .expect(await theReserveContract.yieldLpSftLendFarm())
      .to.equal(yieldLpSftLendFarmContract.address);
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
