/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { PoolManager } from "../../../src/game/admin/poolManager";
import { getAddressBook } from "../../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../../src/interfaces/addressBook";
import { setupFixture } from "../../../src/testing/setupFixture";
import { ZERO_ADDRESS } from "../../../src/utils/constants";

// Setup Chai
chai.use(chaiAsPromised);

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test cases
//

describe("PoolManager", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let addressBook: AddressBook;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use hardhat to get the deployer account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the YIELD and POW5 pools
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to initialize pools with bad addresses", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const poolManager: PoolManager = new PoolManager(deployer, {
      yieldToken: addressBook.yieldToken!,
      marketToken: ZERO_ADDRESS,
      yieldMarketPool: addressBook.yieldMarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: ZERO_ADDRESS,
      pow5StablePool: addressBook.pow5StablePool!,
    });

    await chai
      .expect(poolManager.initializePools())
      .to.be.rejectedWith("Pool tokens are incorrect");
  });

  it("should initialize the YIELD and POW5 pools", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const poolManager: PoolManager = new PoolManager(deployer, {
      yieldToken: addressBook.yieldToken!,
      marketToken: addressBook.wrappedNativeToken!,
      yieldMarketPool: addressBook.yieldMarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });

    const transactions: Array<ethers.ContractTransactionReceipt> =
      await poolManager.initializePools();

    chai.expect(transactions.length).to.equal(2);
  });

  it("should do nothing if pools are already initialized", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const poolManager: PoolManager = new PoolManager(deployer, {
      yieldToken: addressBook.yieldToken!,
      marketToken: addressBook.wrappedNativeToken!,
      yieldMarketPool: addressBook.yieldMarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });

    const transactions: Array<ethers.ContractTransactionReceipt> =
      await poolManager.initializePools();

    chai.expect(transactions.length).to.equal(0);
  });
});
