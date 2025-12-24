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

import { ContractLibraryEthers } from "../../src/hardhat/contractLibraryEthers";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  DEBT_DECIMALS,
  LPPOW5_DECIMALS,
  LPYIELD_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
} from "../../src/utils/constants";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Amounts of tokens to mint for testing
const POW1_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1
const POW5_AMOUNT: bigint = ethers.parseUnits("1000", POW5_DECIMALS); // 1,000 POW5
const LPYIELD_AMOUNT: bigint = ethers.parseUnits("1000", LPYIELD_DECIMALS); // 1,000 LPYIELD
const LPPOW5_AMOUNT: bigint = ethers.parseUnits("1000", LPPOW5_DECIMALS); // 1,000 LPPOW5
const DEBT_AMOUNT: bigint = ethers.parseUnits("1000", DEBT_DECIMALS); // 1,000 DEBT

//
// Test cases
//

describe("ERC20Nontransferable", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiaryAddress: `0x${string}`;
  let contracts: ContractLibraryEthers;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function () {
    this.timeout(60 * 1000);

    // Use ethers to get the deployer, which is the first account and used to
    // deploy the contracts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    beneficiaryAddress = (await signers[1].getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    contracts = await setupTest();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant issuer roles to deployer
  //////////////////////////////////////////////////////////////////////////////

  it("should grant ERC20_ISSUER_ROLE for POW1", async function () {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as ethers.Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should grant ERC20_ISSUER_ROLE for POW5", async function () {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as ethers.Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should grant ERC20_ISSUER_ROLE for LPYIELD", async function () {
    this.timeout(60 * 1000);

    const { lpYieldTokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      lpYieldTokenContract.connect(deployer) as ethers.Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should grant ERC20_ISSUER_ROLE for LPPOW5", async function () {
    this.timeout(60 * 1000);

    const { lpPow5TokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      lpPow5TokenContract.connect(deployer) as ethers.Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should grant ERC20_ISSUER_ROLE for DEBT", async function () {
    this.timeout(60 * 1000);

    const { debtTokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      debtTokenContract.connect(deployer) as ethers.Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint tokens to deployer
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW1", async function () {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Mint POW1
    const tx: ethers.ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), POW1_AMOUNT);
    await tx.wait();
  });

  it("should mint POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Mint POW5
    const tx: ethers.ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), POW5_AMOUNT);
    await tx.wait();
  });

  it("should mint LPYIELD", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpYieldTokenContract } = contracts;

    // Mint LPYIELD
    const tx: ethers.ContractTransactionResponse = await (
      lpYieldTokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), LPYIELD_AMOUNT);
    await tx.wait();
  });

  it("should mint LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow5TokenContract } = contracts;

    // Mint LPPOW5
    const tx: ethers.ContractTransactionResponse = await (
      lpPow5TokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), LPPOW5_AMOUNT);
    await tx.wait();
  });

  it("should mint DEBT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { debtTokenContract } = contracts;

    // Mint DEBT
    const tx: ethers.ContractTransactionResponse = await (
      debtTokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), DEBT_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test token transfers
  //////////////////////////////////////////////////////////////////////////////

  it("should succeed to transfer POW1", async function () {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Transfer POW1
    const tx: ethers.ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as ethers.Contract
    ).transfer(beneficiaryAddress, POW1_AMOUNT);
    await tx.wait();
  });

  it("should succeed to transfer POW5", async function () {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Transfer POW5
    const tx: ethers.ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as ethers.Contract
    ).transfer(beneficiaryAddress, POW5_AMOUNT);
    await tx.wait();
  });

  it("should fail to transfer LPYIELD", async function () {
    this.timeout(60 * 1000);

    const { lpYieldTokenContract } = contracts;

    // Attempt to transfer LPYIELD
    try {
      await (
        lpYieldTokenContract.connect(deployer) as ethers.Contract
      ).transfer(beneficiaryAddress, LPYIELD_AMOUNT);
      chai.assert.fail("Expected to fail");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  it("should fail to transfer LPPOW5", async function () {
    this.timeout(60 * 1000);

    const { lpPow5TokenContract } = contracts;

    // Attempt to transfer LPPOW5
    try {
      await (lpPow5TokenContract.connect(deployer) as ethers.Contract).transfer(
        beneficiaryAddress,
        LPPOW5_AMOUNT,
      );
      chai.assert.fail("Expected to fail");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  it("should fail to transfer DEBT", async function () {
    this.timeout(60 * 1000);

    const { debtTokenContract } = contracts;

    // Attempt to transfer DEBT
    try {
      await (debtTokenContract.connect(deployer) as ethers.Contract).transfer(
        beneficiaryAddress,
        DEBT_AMOUNT,
      );
      chai.assert.fail("Expected to fail");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });
});
