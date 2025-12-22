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
  BORROW_DECIMALS,
  DEBT_DECIMALS,
  INITIAL_YIELD_SUPPLY,
  LPBORROW_DECIMALS,
  LPYIELD_DECIMALS,
  YIELD_DECIMALS,
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

  it("should test YIELD decimals", async function () {
    const { yieldContract } = contracts;

    const yieldDecimals: number = await yieldContract.decimals();
    chai.expect(yieldDecimals).to.equal(YIELD_DECIMALS);
  });

  it("should test BORROW decimals", async function () {
    const { borrowContract } = contracts;

    const borrowDecimals: number = await borrowContract.decimals();
    chai.expect(borrowDecimals).to.equal(BORROW_DECIMALS);
  });

  it("should test LPYIELD decimals", async function () {
    const { lpYieldContract } = contracts;

    const lpYieldDecimals: number = await lpYieldContract.decimals();
    chai.expect(lpYieldDecimals).to.equal(LPYIELD_DECIMALS);
  });

  it("should test LPBORROW decimals", async function () {
    const { lpBorrowContract } = contracts;

    const lpBorrowDecimals: number = await lpBorrowContract.decimals();
    chai.expect(lpBorrowDecimals).to.equal(LPBORROW_DECIMALS);
  });

  it("should test DEBT decimals", async function () {
    const { debtContract } = contracts;

    const debtDecimals: number = await debtContract.decimals();
    chai.expect(debtDecimals).to.equal(DEBT_DECIMALS);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test initial supply
  //////////////////////////////////////////////////////////////////////////////

  it("should test YIELD initial supply", async function () {
    const { yieldContract } = contracts;

    const yieldSupply: bigint = await yieldContract.totalSupply();
    chai.expect(yieldSupply).to.equal(INITIAL_YIELD_SUPPLY);
  });

  it("should test BORROW initial supply", async function () {
    const { borrowContract } = contracts;

    const borrowSupply: bigint = await borrowContract.totalSupply();
    chai.expect(borrowSupply).to.equal(0n);
  });

  it("should test LPYIELD initial supply", async function () {
    const { lpYieldContract } = contracts;

    const lpYieldSupply: bigint = await lpYieldContract.totalSupply();
    chai.expect(lpYieldSupply).to.equal(0n);
  });

  it("should test LPBORROW initial supply", async function () {
    const { lpBorrowContract } = contracts;

    const lpBorrowSupply: bigint = await lpBorrowContract.totalSupply();
    chai.expect(lpBorrowSupply).to.equal(0n);
  });

  it("should test DEBT initial supply", async function () {
    const { debtContract } = contracts;

    const debtSupply: bigint = await debtContract.totalSupply();
    chai.expect(debtSupply).to.equal(0n);
  });
});
