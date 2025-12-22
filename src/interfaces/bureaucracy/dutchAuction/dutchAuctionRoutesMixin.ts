/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionRoutes } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionRoutes";
import { IDutchAuctionRoutes__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionRoutes__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionRoutesMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private dutchAuctionRoutes: IDutchAuctionRoutes;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionRoutes = IDutchAuctionRoutes__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async yieldToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.yieldToken()) as `0x${string}`;
    }

    async borrowToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.borrowToken()) as `0x${string}`;
    }

    async marketToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.marketToken()) as `0x${string}`;
    }

    async stableToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.stableToken()) as `0x${string}`;
    }

    async lpSft(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.lpSft()) as `0x${string}`;
    }

    async yieldMarketPool(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.yieldMarketPool()) as `0x${string}`;
    }

    async yieldMarketSwapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.yieldMarketSwapper()) as `0x${string}`;
    }

    async borrowStableSwapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.borrowStableSwapper()) as `0x${string}`;
    }

    async marketStableSwapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.marketStableSwapper()) as `0x${string}`;
    }

    async yieldMarketPooler(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.yieldMarketPooler()) as `0x${string}`;
    }

    async yieldLpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.yieldLpNftStakeFarm()) as `0x${string}`;
    }

    async uniswapV3NftManager(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.uniswapV3NftManager()) as `0x${string}`;
    }
  };
}

export { DutchAuctionRoutesMixin };
