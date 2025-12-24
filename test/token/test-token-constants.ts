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
import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  DEBT_DECIMALS,
  INITIAL_POW1_SUPPLY,
  LPPOW1_DECIMALS,
  LPPOW5_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
} from "../../src/utils/constants";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test cases
//

describe("Token Constants", () => {
  let contracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function () {
    this.timeout(60 * 1000);

    // Use ethers to get the accounts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    const deployer: ethers.Signer = signers[0];

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the contract addresses
    const addressBook: AddressBook = await getAddressBook(networkName);

    // Get the contracts
    contracts = getContractLibrary(deployer, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test token decimals
  //////////////////////////////////////////////////////////////////////////////

  it("should test POW1 decimals", async function () {
    const { pow1Contract } = contracts;

    const pow1Decimals: number = await pow1Contract.decimals();
    chai.expect(pow1Decimals).to.equal(POW1_DECIMALS);
  });

  it("should test POW5 decimals", async function () {
    const { pow5Contract } = contracts;

    const pow5Decimals: number = await pow5Contract.decimals();
    chai.expect(pow5Decimals).to.equal(POW5_DECIMALS);
  });

  it("should test LPPOW1 decimals", async function () {
    const { lpPow1Contract } = contracts;

    const lpPow1Decimals: number = await lpPow1Contract.decimals();
    chai.expect(lpPow1Decimals).to.equal(LPPOW1_DECIMALS);
  });

  it("should test LPPOW5 decimals", async function () {
    const { lpPow5Contract } = contracts;

    const lpPow5Decimals: number = await lpPow5Contract.decimals();
    chai.expect(lpPow5Decimals).to.equal(LPPOW5_DECIMALS);
  });

  it("should test DEBT decimals", async function () {
    const { debtContract } = contracts;

    const debtDecimals: number = await debtContract.decimals();
    chai.expect(debtDecimals).to.equal(DEBT_DECIMALS);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test initial supply
  //////////////////////////////////////////////////////////////////////////////

  it("should test POW1 initial supply", async function () {
    const { pow1Contract } = contracts;

    const pow1Supply: bigint = await pow1Contract.totalSupply();
    chai.expect(pow1Supply).to.equal(INITIAL_POW1_SUPPLY);
  });

  it("should test POW5 initial supply", async function () {
    const { pow5Contract } = contracts;

    const pow5Supply: bigint = await pow5Contract.totalSupply();
    chai.expect(pow5Supply).to.equal(0n);
  });

  it("should test LPPOW1 initial supply", async function () {
    const { lpPow1Contract } = contracts;

    const lpPow1Supply: bigint = await lpPow1Contract.totalSupply();
    chai.expect(lpPow1Supply).to.equal(0n);
  });

  it("should test LPPOW5 initial supply", async function () {
    const { lpPow5Contract } = contracts;

    const lpPow5Supply: bigint = await lpPow5Contract.totalSupply();
    chai.expect(lpPow5Supply).to.equal(0n);
  });

  it("should test DEBT initial supply", async function () {
    const { debtContract } = contracts;

    const debtSupply: bigint = await debtContract.totalSupply();
    chai.expect(debtSupply).to.equal(0n);
  });
});
