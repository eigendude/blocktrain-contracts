/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolImmutables } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolImmutables";
import { IUniswapV3PoolImmutables__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolImmutables__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolImmutablesMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private uniswapV3PoolImmutables: IUniswapV3PoolImmutables;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.uniswapV3PoolImmutables = IUniswapV3PoolImmutables__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async factory(): Promise<`0x${string}`> {
      return (await this.uniswapV3PoolImmutables.factory()) as `0x${string}`;
    }

    async token0(): Promise<`0x${string}`> {
      return (await this.uniswapV3PoolImmutables.token0()) as `0x${string}`;
    }

    async token1(): Promise<`0x${string}`> {
      return (await this.uniswapV3PoolImmutables.token1()) as `0x${string}`;
    }

    async fee(): Promise<number> {
      return Number(await this.uniswapV3PoolImmutables.fee());
    }

    async tickSpacing(): Promise<number> {
      return Number(await this.uniswapV3PoolImmutables.tickSpacing());
    }

    async maxLiquidityPerTick(): Promise<bigint> {
      return await this.uniswapV3PoolImmutables.maxLiquidityPerTick();
    }
  };
}

export { UniswapV3PoolImmutablesMixin };
