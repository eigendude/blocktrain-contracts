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

import { DutchAuctionManager } from "../../../src/game/admin/dutchAuctionManager";
import { PermissionManager } from "../../../src/game/admin/permissionManager";
import { PoolManager } from "../../../src/game/admin/poolManager";
import { getAddressBook } from "../../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../../src/interfaces/addressBook";
import { LPSFTContract } from "../../../src/interfaces/token/erc1155/lpSftContract";
import { setupFixture } from "../../../src/testing/setupFixture";
import { extractJSONFromURI } from "../../../src/utils/lpNftUtils";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Constants
//

// Token ID of initial minted LP-NFT/L-SFT
const YIELD_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("DutchAuctionManager", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let beneficiaryAddress: `0x${string}`;
  let addressBook: AddressBook;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use hardhat to get the deployer account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    beneficiary = signers[1];
    beneficiaryAddress = (await beneficiary.getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Initialize pools
    const poolManager: PoolManager = new PoolManager(deployer, {
      yieldToken: addressBook.yieldToken!,
      marketToken: addressBook.wrappedNativeToken!,
      yieldMarketPool: addressBook.yieldMarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });
    await poolManager.initializePools();

    // Initialize roles
    const permissionManager: PermissionManager = new PermissionManager(
      deployer,
      {
        yieldToken: addressBook.yieldToken!,
        pow5Token: addressBook.pow5Token!,
        lpYieldToken: addressBook.lpYieldToken!,
        lpBorrowToken: addressBook.lpBorrowToken!,
        debtToken: addressBook.debtToken!,
        lpSft: addressBook.lpSft!,
        noLpSft: addressBook.noLpSft!,
        dutchAuction: addressBook.dutchAuction!,
        yieldHarvest: addressBook.yieldHarvest!,
        liquidityForge: addressBook.liquidityForge!,
        reverseRepo: addressBook.reverseRepo!,
        yieldLpNftStakeFarm: addressBook.yieldLpNftStakeFarm!,
        pow5LpNftStakeFarm: addressBook.pow5LpNftStakeFarm!,
        yieldLpSftLendFarm: addressBook.yieldLpSftLendFarm!,
        pow5LpSftLendFarm: addressBook.pow5LpSftLendFarm!,
        defiManager: addressBook.defiManager!,
        pow5InterestFarm: addressBook.pow5InterestFarm!,
      },
    );
    await permissionManager.initializeRoles();

    // Initialize Dutch Auction
    const dutchAuctionManager: DutchAuctionManager = new DutchAuctionManager(
      deployer,
      {
        yieldToken: addressBook.yieldToken!,
        marketToken: addressBook.wrappedNativeToken!,
        dutchAuction: addressBook.dutchAuction!,
      },
    );
    await dutchAuctionManager.initialize(beneficiaryAddress);

    // Create first LP-NFTs for sale
    await dutchAuctionManager.createInitialAuctions();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify beneficiary owns first LP-SFT", async function (): Promise<void> {
    // Create contract
    const lpSftContract: LPSFTContract = new LPSFTContract(
      deployer,
      addressBook.lpSft!,
    );

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Get owner
    const owner: `0x${string}` =
      await lpSftContract.ownerOf(YIELD_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(beneficiaryAddress);

    // Get token IDs
    const tokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(tokenIds.length).to.equal(1);
    chai.expect(tokenIds[0]).to.equal(YIELD_LPNFT_TOKEN_ID);
  });

  it("should check YIELD LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    // Create contract
    const lpSftContract: LPSFTContract = new LPSFTContract(
      deployer,
      addressBook.lpSft!,
    );

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(YIELD_LPNFT_TOKEN_ID);

    // Check that data URI has correct mime type
    chai.expect(nftTokenUri).to.match(/data:application\/json;base64,.+/);

    // Content should be valid JSON and structure
    const nftContent = extractJSONFromURI(nftTokenUri);
    if (!nftContent) {
      throw new Error("Failed to extract JSON from URI");
    }
    chai.expect(nftContent).to.haveOwnProperty("name").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("description").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("image").is.a("string");
  });
});
