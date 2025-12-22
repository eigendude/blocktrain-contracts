/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionState } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionState";
import { IDutchAuctionState__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionState__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionStateMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private dutchAuctionState: IDutchAuctionState;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionState = IDutchAuctionState__factory.connect(
        contractAddress,
        contractRunner,
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
      const auctionSettings: IDutchAuctionState.AuctionSettingsStruct =
        await this.dutchAuctionState.getAuctionSettings();

      return {
        priceDecayRate: BigInt(auctionSettings.priceDecayRate),
        mintDustAmount: BigInt(auctionSettings.mintDustAmount),
        priceIncrement: BigInt(auctionSettings.priceIncrement),
        initialPriceBips: BigInt(auctionSettings.initialPriceBips),
        minPriceBips: BigInt(auctionSettings.minPriceBips),
        maxPriceBips: BigInt(auctionSettings.maxPriceBips),
      };
    }

    async getBureauState(): Promise<{
      totalAuctions: bigint;
      lastSalePriceBips: bigint;
    }> {
      const bureauState: IDutchAuctionState.BureauStateStruct =
        await this.dutchAuctionState.getBureauState();

      return {
        totalAuctions: BigInt(bureauState.totalAuctions),
        lastSalePriceBips: BigInt(bureauState.lastSalePriceBips),
      };
    }

    async getCurrentAuctionCount(): Promise<bigint> {
      return await this.dutchAuctionState.getCurrentAuctionCount();
    }

    async getCurrentAuctions(): Promise<bigint[]> {
      return await this.dutchAuctionState.getCurrentAuctions();
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
      const currentAuctionStates: IDutchAuctionState.AuctionStateStruct[] =
        await this.dutchAuctionState.getCurrentAuctionStates();

      return currentAuctionStates.map(
        (auctionState: IDutchAuctionState.AuctionStateStruct) => ({
          lpNftTokenId: BigInt(auctionState.lpNftTokenId),
          startPriceBips: BigInt(auctionState.startPriceBips),
          endPriceBips: BigInt(auctionState.endPriceBips),
          startTime: BigInt(auctionState.startTime),
          salePrice: BigInt(auctionState.salePrice),
        }),
      );
    }

    async getAuctionState(lpNftTokenId: bigint): Promise<{
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    }> {
      const auctionState: IDutchAuctionState.AuctionStateStruct =
        await this.dutchAuctionState.getAuctionState(lpNftTokenId);

      return {
        lpNftTokenId: BigInt(auctionState.lpNftTokenId),
        startPriceBips: BigInt(auctionState.startPriceBips),
        endPriceBips: BigInt(auctionState.endPriceBips),
        startTime: BigInt(auctionState.startTime),
        salePrice: BigInt(auctionState.salePrice),
      };
    }

    async getCurrentPriceBips(lpNftTokenId: bigint): Promise<bigint> {
      return await this.dutchAuctionState.getCurrentPriceBips(lpNftTokenId);
    }

    async getTokenUri(lpNftTokenId: bigint): Promise<string> {
      return await this.dutchAuctionState.getTokenUri(lpNftTokenId);
    }
  };
}

export { DutchAuctionStateMixin };
