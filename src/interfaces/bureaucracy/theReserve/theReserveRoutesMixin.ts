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

    async pow1Token(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow1Token()) as `0x${string}`;
    }

    async pow5Token(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow5Token()) as `0x${string}`;
    }

    async lpPow1Token(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.lpPow1Token()) as `0x${string}`;
    }

    async lpPow5Token(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.lpPow5Token()) as `0x${string}`;
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

    async pow1MarketPool(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow1MarketPool()) as `0x${string}`;
    }

    async pow5StablePool(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow5StablePool()) as `0x${string}`;
    }

    async marketStablePool(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.marketStablePool()) as `0x${string}`;
    }

    async pow1MarketSwapper(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow1MarketSwapper()) as `0x${string}`;
    }

    async pow5StableSwapper(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow5StableSwapper()) as `0x${string}`;
    }

    async marketStableSwapper(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.marketStableSwapper()) as `0x${string}`;
    }

    async pow1MarketPooler(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow1MarketPooler()) as `0x${string}`;
    }

    async pow5StablePooler(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow5StablePooler()) as `0x${string}`;
    }

    async pow1LpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow1LpNftStakeFarm()) as `0x${string}`;
    }

    async pow5LpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow5LpNftStakeFarm()) as `0x${string}`;
    }

    async pow1LpSftLendFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow1LpSftLendFarm()) as `0x${string}`;
    }

    async pow5LpSftLendFarm(): Promise<`0x${string}`> {
      return (await this.theReserveRoutes.pow5LpSftLendFarm()) as `0x${string}`;
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
