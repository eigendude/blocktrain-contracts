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
  LPBORROW_DECIMALS,
  LPYIELD_DECIMALS,
  POW5_DECIMALS,
  YIELD_DECIMALS,
} from "../../src/utils/constants";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Amounts of tokens to mint for testing
const YIELD_AMOUNT: bigint = ethers.parseUnits("1000", YIELD_DECIMALS); // 1,000 YIELD
const POW5_AMOUNT: bigint = ethers.parseUnits("1000", POW5_DECIMALS); // 1,000 POW5
const LPYIELD_AMOUNT: bigint = ethers.parseUnits("1000", LPYIELD_DECIMALS); // 1,000 LPYIELD
const LPBORROW_AMOUNT: bigint = ethers.parseUnits("1000", LPBORROW_DECIMALS); // 1,000 LPBORROW
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

  it("should grant ERC20_ISSUER_ROLE for YIELD", async function () {
    this.timeout(60 * 1000);

    const { yieldTokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      yieldTokenContract.connect(deployer) as ethers.Contract
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

  it("should grant ERC20_ISSUER_ROLE for LPBORROW", async function () {
    this.timeout(60 * 1000);

    const { lpBorrowTokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ethers.ContractTransactionResponse = await (
      lpBorrowTokenContract.connect(deployer) as ethers.Contract
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

  it("should mint YIELD", async function () {
    this.timeout(60 * 1000);

    const { yieldTokenContract } = contracts;

    // Mint YIELD
    const tx: ethers.ContractTransactionResponse = await (
      yieldTokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), YIELD_AMOUNT);
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

  it("should mint LPBORROW", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpBorrowTokenContract } = contracts;

    // Mint LPBORROW
    const tx: ethers.ContractTransactionResponse = await (
      lpBorrowTokenContract.connect(deployer) as ethers.Contract
    ).mint(await deployer.getAddress(), LPBORROW_AMOUNT);
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

  it("should succeed to transfer YIELD", async function () {
    this.timeout(60 * 1000);

    const { yieldTokenContract } = contracts;

    // Transfer YIELD
    const tx: ethers.ContractTransactionResponse = await (
      yieldTokenContract.connect(deployer) as ethers.Contract
    ).transfer(beneficiaryAddress, YIELD_AMOUNT);
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

  it("should fail to transfer LPBORROW", async function () {
    this.timeout(60 * 1000);

    const { lpBorrowTokenContract } = contracts;

    // Attempt to transfer LPBORROW
    try {
      await (
        lpBorrowTokenContract.connect(deployer) as ethers.Contract
      ).transfer(beneficiaryAddress, LPBORROW_AMOUNT);
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
