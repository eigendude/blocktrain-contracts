/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { AddressBook } from "../../src/interfaces/addressBook";
import { TestStringUtilsContract } from "../../src/interfaces/test/utils/testStringUtilsContract";
import { setupFixture } from "../../src/testing/setupFixture";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test cases
//

describe("StringUtils Library", function () {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let beneficiary: SignerWithAddress;
  let testStringUtilsContract: TestStringUtilsContract;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    beneficiary = signers[1];

    // A single fixture is used for the test suite
    await setupTest();

    // Get address book
    const addressBook: AddressBook = await getAddressBook(hardhat.network.name);

    // Create the contract
    testStringUtilsContract = new TestStringUtilsContract(
      beneficiary,
      addressBook.testStringUtils!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test Cases
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Test converting a regular bytes32 string ("HelloWorld") to its string
   * representation
   */
  it("should convert 'HelloWorld' in bytes32 to 'HelloWorld'", async function () {
    const input = ethers.encodeBytes32String("HelloWorld");
    const expected = "HelloWorld";

    const result = await testStringUtilsContract.testBytes32ToString(input);
    expect(result).to.equal(expected);
  });

  /**
   * @dev Test converting an empty bytes32 (all zeros) to an empty string
   */
  it("should convert empty bytes32 to an empty string", async function () {
    const input = ethers.ZeroHash; // Empty bytes32
    const expected = "";

    const result = await testStringUtilsContract.testBytes32ToString(input);
    expect(result).to.equal(expected);
  });

  /**
   * @dev Test converting bytes32 strings containing non-ASCII (Unicode)
   * characters
   *
   * Note: Non-ASCII characters may occupy more than one byte each in UTF-8 encoding.
   * Ensure the string fits within 32 bytes to avoid unexpected truncation.
   */
  it("should handle non-ASCII characters", async function () {
    const unicodeString = "こんにちは"; // "Hello" in Japanese (5 characters, 15 bytes in UTF-8)
    const input = ethers.encodeBytes32String(unicodeString);
    const expected = unicodeString;

    const result = await testStringUtilsContract.testBytes32ToString(input);
    expect(result).to.equal(expected);
  });

  /**
   * @dev Test converting a bytes32 string that is exactly 32 bytes long
   */
  it("should convert a full 32-byte bytes32 value correctly", async function () {
    const longString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456"; // 32 characters
    const truncated = longString.slice(0, 31); // Keep within 31-byte limit
    const input = ethers.encodeBytes32String(truncated); // Encode truncated string
    const expected = truncated;

    const result = await testStringUtilsContract.testBytes32ToString(input);
    expect(result).to.equal(expected);
  });

  /**
   * @dev Test converting a bytes32 string longer than 32 bytes to ensure it is
   * truncated correctly
   */
  it("should truncate strings longer than 32 bytes", async function () {
    const longString =
      "ThisStringIsWayTooLongForABytes32StringAndWillBeTruncated";
    const truncated = longString.slice(0, 31); // 31 bytes due to the null terminator
    const input = ethers.encodeBytes32String(truncated);
    const expected = truncated;

    const result = await testStringUtilsContract.testBytes32ToString(input);
    expect(result).to.equal(expected);
  });

  /**
   * @dev Test converting a bytes32 value with mixed characters, including
   * special symbols
   */
  it("should convert bytes32 with mixed characters correctly", async function () {
    const mixedString = "1234Test!@#$%^&*()_+-=[]{}|;:',.<>/?";
    const trimmed = mixedString.slice(0, 31); // Ensure it fits within 31 bytes
    const input = ethers.encodeBytes32String(trimmed);
    const expected = trimmed;

    const result = await testStringUtilsContract.testBytes32ToString(input);
    expect(result).to.equal(expected);
  });
});
