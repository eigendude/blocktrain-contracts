/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { DutchAuctionContract } from "../../interfaces/bureaucracy/dutchAuction/dutchAuctionContract";
import { WrappedNativeContract } from "../../interfaces/token/erc20/wrappedNativeContract";
import { ERC20Contract } from "../../interfaces/zeppelin/token/erc20/erc20Contract";
import { ETH_PRICE } from "../../testing/defiMetrics";
import {
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
} from "../../utils/constants";

//////////////////////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////////////////////

// Initial number of LP-NFTs to mint for auction
const INITIAL_AUCTION_COUNT: number = 3;

// Amount of WETH dust to use for auction creation
const INITIAL_WETH_DUST: bigint = 1_000n; // 1,000 wei

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPYIELD_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

//////////////////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  dutchAuction: `0x${string}`;
  marketToken: `0x${string}`;
  pow1Token: `0x${string}`;
};

//////////////////////////////////////////////////////////////////////////////
// Permission Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Manages the Dutch Auction
 */
class DutchAuctionManager {
  private admin: ethers.Signer;
  private addresses: Addresses;
  private dutchAuctionContract: DutchAuctionContract;
  private marketTokenContract: WrappedNativeContract;
  private pow1Contract: ERC20Contract;

  constructor(admin: ethers.Signer, addresses: Addresses) {
    this.admin = admin;
    this.addresses = addresses;
    this.dutchAuctionContract = new DutchAuctionContract(
      this.admin,
      this.addresses.dutchAuction,
    );
    this.marketTokenContract = new WrappedNativeContract(
      this.admin,
      this.addresses.marketToken,
    );
    this.pow1Contract = new ERC20Contract(this.admin, this.addresses.pow1Token);
  }

  /**
   * @description Initializes the Dutch Auction
   *
   * Returns approval promises and a lambda to execute spending transactions
   * after approvals.
   *
   * @param lpSftReceiver - The address that receives the first LP-SFT
   *
   * @returns {Promise<ethers.ContractTransactionReceipt | null>} A promise that
   * resolves to the transaction receipt, or null if the Dutch Auction is already
   * initialized.
   */
  async initialize(
    lpSftReceiver: `0x${string}`,
  ): Promise<ethers.ContractTransactionReceipt | null> {
    // Check if the Dutch Auction is initialized
    const isInitialized: boolean =
      await this.dutchAuctionContract.isInitialized();
    if (!isInitialized) {
      const setupPromises: Array<Promise<ethers.ContractTransactionReceipt>> =
        [];

      // Approve Dutch Auction spending POW1, if needed
      await this._approvePow1(INITIAL_POW1_SUPPLY, setupPromises);

      // Obtain market token, if needed
      await this._depositMarketToken(INITIAL_WETH_AMOUNT, setupPromises);

      // Approve Dutch Auction spending market token, if needed
      await this._approveMarketToken(INITIAL_WETH_AMOUNT, setupPromises);

      // Wait for all setup transactions to complete
      await Promise.all(setupPromises);

      return this.dutchAuctionContract.initialize(
        INITIAL_POW1_SUPPLY,
        INITIAL_WETH_AMOUNT,
        lpSftReceiver,
      );
    }

    return null;
  }

  async isInitialized(): Promise<boolean> {
    return this.dutchAuctionContract.isInitialized();
  }

  async createInitialAuctions(): Promise<ethers.ContractTransactionReceipt | null> {
    // Check number of auctions
    const auctionCount: number =
      await this.dutchAuctionContract.getAuctionCount();
    if (auctionCount < INITIAL_AUCTION_COUNT) {
      const setupTransactions: Array<
        Promise<ethers.ContractTransactionReceipt>
      > = [];

      // Get dust for LP-NFT creation, if needed
      await this._getDust(INITIAL_WETH_DUST, setupTransactions);

      // Approve spending dust for LP-NFT creation, if needed
      await this._approveMarketToken(INITIAL_WETH_DUST, setupTransactions);

      // Wait for all pending transactions to complete
      await Promise.all(setupTransactions);

      // Set auction count
      return this.dutchAuctionContract.setAuctionCount(
        INITIAL_AUCTION_COUNT,
        INITIAL_WETH_DUST,
      );
    }

    return null;
  }

  async getCurrentAuctionCount(): Promise<number> {
    return this.dutchAuctionContract.getAuctionCount();
  }

  private async _approvePow1(
    amount: bigint,
    setupPromises: Array<Promise<ethers.ContractTransactionReceipt>>,
  ): Promise<void> {
    // Check current allowance
    const pow1Allowance: bigint = await this.pow1Contract.allowance(
      (await this.admin.getAddress()) as `0x${string}`,
      this.dutchAuctionContract.address,
    );

    // Approve spending POW1, if needed
    if (pow1Allowance < amount) {
      const tx: ethers.ContractTransactionResponse =
        await this.pow1Contract.approveAsync(
          this.dutchAuctionContract.address,
          amount - pow1Allowance,
        );
      setupPromises.push(
        tx.wait() as Promise<ethers.ContractTransactionReceipt>,
      );
    }
  }

  private async _depositMarketToken(
    amount: bigint,
    setupPromises: Array<Promise<ethers.ContractTransactionReceipt>>,
  ): Promise<void> {
    // Check current balance
    const marketTokenBalance: bigint = await this.marketTokenContract.balanceOf(
      (await this.admin.getAddress()) as `0x${string}`,
    );

    // Deposit market token, if needed
    if (marketTokenBalance < amount) {
      const tx: ethers.ContractTransactionResponse =
        await this.marketTokenContract.depositAsync(
          amount - marketTokenBalance,
        );
      setupPromises.push(
        tx.wait() as Promise<ethers.ContractTransactionReceipt>,
      );
    }
  }

  private async _approveMarketToken(
    amount: bigint,
    setupPromises: Array<Promise<ethers.ContractTransactionReceipt>>,
  ): Promise<void> {
    // Check current allowance
    const marketTokenAllowance: bigint =
      await this.marketTokenContract.allowance(
        (await this.admin.getAddress()) as `0x${string}`,
        this.addresses.dutchAuction,
      );

    // Approve spending market token, if needed
    if (marketTokenAllowance < amount) {
      const tx: ethers.ContractTransactionResponse =
        await this.marketTokenContract.approveAsync(
          this.addresses.dutchAuction,
          amount - marketTokenAllowance,
        );
      setupPromises.push(
        tx.wait() as Promise<ethers.ContractTransactionReceipt>,
      );
    }
  }

  private async _getDust(
    amount: bigint,
    setupPromises: Array<Promise<ethers.ContractTransactionReceipt>>,
  ): Promise<void> {
    // Check current balance
    const marketTokenBalance = await this.marketTokenContract.balanceOf(
      (await this.admin.getAddress()) as `0x${string}`,
    );

    // Get dust for LP-NFT creation, if needed
    if (marketTokenBalance < amount) {
      const tx = await this.marketTokenContract.depositAsync(
        amount - marketTokenBalance,
      );
      setupPromises.push(
        tx.wait() as Promise<ethers.ContractTransactionReceipt>,
      );
    }
  }
}

export { DutchAuctionManager };
