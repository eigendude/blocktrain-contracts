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
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

const DEPOSIT_AMOUNT: bigint = ethers.parseEther("1");

//
// Test cases
//

describe("W-ETH", () => {
  let deployer: SignerWithAddress;
  let deployerAddress: `0x${string}`;
  let addressBook: AddressBook;
  let contracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    deployerAddress = (await deployer.getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);

    // Get contract library
    contracts = getContractLibrary(deployer, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test deposit
  //////////////////////////////////////////////////////////////////////////////

  it("should deposit ETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = contracts;

    // Perform deposit
    const receipt: ethers.ContractTransactionReceipt =
      await wrappedNativeContract.deposit(DEPOSIT_AMOUNT);
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (ethers.EventLog | ethers.Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(addressBook.wrappedNativeToken!);
    chai.expect(log.fragment.name).to.equal("Deposit");
    chai.expect(log.args.length).to.equal(2);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(DEPOSIT_AMOUNT);
  });

  it("should check balance", async function (): Promise<void> {
    const { wrappedNativeContract } = contracts;

    // Check balance
    const balance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);
    chai.expect(balance).to.equal(DEPOSIT_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test withdraw
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw ETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = contracts;

    // Perform withdraw
    const receipt: ethers.ContractTransactionReceipt =
      await wrappedNativeContract.withdraw(DEPOSIT_AMOUNT);
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (ethers.EventLog | ethers.Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: ethers.EventLog = logs[0] as ethers.EventLog;
    chai.expect(log.address).to.equal(addressBook.wrappedNativeToken!);
    chai.expect(log.fragment.name).to.equal("Withdrawal");
    chai.expect(log.args.length).to.equal(2);
    chai.expect(log.args[0]).to.equal(deployerAddress);
    chai.expect(log.args[1]).to.equal(DEPOSIT_AMOUNT);
  });

  it("should check zero balance", async function (): Promise<void> {
    const { wrappedNativeContract } = contracts;

    // Check balance
    const balance: bigint =
      await wrappedNativeContract.balanceOf(deployerAddress);
    chai.expect(balance).to.equal(0n);
  });
});
