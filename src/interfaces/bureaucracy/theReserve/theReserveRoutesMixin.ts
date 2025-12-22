/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ITheReserveRoutes } from "../../../types/contracts/src/interfaces/bureaucracy/theReserve/ITheReserveRoutes";
import { ITheReserveRoutes__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/theReserve/ITheReserveRoutes__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TheReserveRoutesMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private theReserveRoutes: ITheReserveRoutes;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.theReserveRoutes = ITheReserveRoutes__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async yieldToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.yieldToken()) as `0x${string}`;
    }

    async borrowToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.borrowToken()) as `0x${string}`;
    }

    async lpYieldToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.lpYieldToken()) as `0x${string}`;
    }

    async lpBorrowToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.lpBorrowToken()) as `0x${string}`;
    }

    async debtToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.debtToken()) as `0x${string}`;
    }

    async marketToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.marketToken()) as `0x${string}`;
    }

    async stableToken(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.stableToken()) as `0x${string}`;
    }

    async lpSft(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.lpSft()) as `0x${string}`;
    }

    async noLpSft(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.noLpSft()) as `0x${string}`;
    }

    async yieldMarketPool(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.yieldMarketPool()) as `0x${string}`;
    }

    async borrowStablePool(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.borrowStablePool()) as `0x${string}`;
    }

    async marketStablePool(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.marketStablePool()) as `0x${string}`;
    }

    async yieldMarketSwapper(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.yieldMarketSwapper()) as `0x${string}`;
    }

    async borrowStableSwapper(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.borrowStableSwapper()) as `0x${string}`;
    }

    async marketStableSwapper(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.marketStableSwapper()) as `0x${string}`;
    }

    async yieldMarketPooler(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.yieldMarketPooler()) as `0x${string}`;
    }

    async borrowStablePooler(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.borrowStablePooler()) as `0x${string}`;
    }

    async yieldLpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.yieldLpNftStakeFarm()) as `0x${string}`;
    }

    async borrowLpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.borrowLpNftStakeFarm()) as `0x${string}`;
    }

    async yieldLpSftLendFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.yieldLpSftLendFarm()) as `0x${string}`;
    }

    async borrowLpSftLendFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.borrowLpSftLendFarm()) as `0x${string}`;
    }

    async uniswapV3Factory(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.uniswapV3Factory()) as `0x${string}`;
    }

    async uniswapV3NftManager(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.uniswapV3NftManager()) as `0x${string}`;
    }
  };
}

export { TheReserveRoutesMixin };
