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

//////////////////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  dutchAuction: `0x${string}`;
  marketToken: `0x${string}`;
};

//////////////////////////////////////////////////////////////////////////////
// Permission Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Client to interact with the Dutch Auction
 */
class DutchAuctionClient {
  private client: ethers.Signer | ethers.Provider;
  private addresses: Addresses;
  private dutchAuctionContract: DutchAuctionContract;
  private wrappedNativeContract: WrappedNativeContract;

  constructor(client: ethers.Signer | ethers.Provider, addresses: Addresses) {
    this.client = client;
    this.addresses = addresses;
    this.dutchAuctionContract = new DutchAuctionContract(
      client,
      addresses.dutchAuction,
    );
    this.wrappedNativeContract = new WrappedNativeContract(
      client,
      addresses.marketToken,
    );
  }

  async getAuctionSettings(): Promise<{
    priceDecayRate: bigint;
    mintDustAmount: bigint;
    priceIncrement: bigint;
    initialPriceBips: bigint;
    minPriceBips: bigint;
    maxPriceBips: bigint;
  }> {
    return this.dutchAuctionContract.getAuctionSettings();
  }

  async getBureauState(): Promise<{
    totalAuctions: bigint;
    lastSalePriceBips: bigint;
  }> {
    return this.dutchAuctionContract.getBureauState();
  }

  async getCurrentAuctionCount(): Promise<bigint> {
    return this.dutchAuctionContract.getCurrentAuctionCount();
  }

  async getCurrentAuctions(): Promise<bigint[]> {
    return this.dutchAuctionContract.getCurrentAuctions();
  }

  async getCurrentAuctionStates(): Promise<
    {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    }[]
  > {
    return this.dutchAuctionContract.getCurrentAuctionStates();
  }

  async getAuctionState(lpNftTokenId: bigint): Promise<{
    lpNftTokenId: bigint;
    startPriceBips: bigint;
    endPriceBips: bigint;
    startTime: bigint;
    salePrice: bigint;
  }> {
    return this.dutchAuctionContract.getAuctionState(lpNftTokenId);
  }

  async getCurrentPriceBips(lpNftTokenId: bigint): Promise<bigint> {
    return this.dutchAuctionContract.getCurrentPriceBips(lpNftTokenId);
  }

  async getTokenUri(lpNftTokenId: bigint): Promise<string> {
    return this.dutchAuctionContract.getTokenUri(lpNftTokenId);
  }

  async purchase(
    lpNftTokenId: bigint,
    yieldAmount: bigint,
    marketTokenAmount: bigint,
    beneficiary: `0x${string}`,
    receiver: `0x${string}`,
  ): Promise<ethers.ContractTransactionReceipt | null> {
    if (!("getAddress" in this.client)) {
      return null;
    }

    const pendingTransactions: Array<
      Promise<ethers.ContractTransactionReceipt>
    > = [];

    // Get W-ETH for auction, if needed
    const marketTokenBalance = await this.wrappedNativeContract.balanceOf(
      (await this.client.getAddress()) as `0x${string}`,
    );
    if (marketTokenBalance < marketTokenAmount) {
      pendingTransactions.push(
        this.wrappedNativeContract.deposit(
          marketTokenAmount - marketTokenBalance,
        ),
      );
    }

    // Approve spending dust for LP-NFT creation, if needed
    const marketTokenAllowance = await this.wrappedNativeContract.allowance(
      (await this.client.getAddress()) as `0x${string}`,
      this.addresses.dutchAuction,
    );
    if (marketTokenAllowance < marketTokenAmount) {
      pendingTransactions.push(
        this.wrappedNativeContract.approve(
          this.addresses.dutchAuction,
          marketTokenAmount - marketTokenAllowance,
        ),
      );
    }

    // Wait for all pending transactions to complete
    await Promise.all(pendingTransactions);

    return this.dutchAuctionContract.purchase(
      lpNftTokenId,
      yieldAmount,
      marketTokenAmount,
      beneficiary,
      receiver,
    );
  }
}

export { DutchAuctionClient };
