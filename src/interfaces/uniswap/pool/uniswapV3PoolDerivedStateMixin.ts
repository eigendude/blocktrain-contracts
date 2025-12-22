/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolDerivedState } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolDerivedState";
import { IUniswapV3PoolDerivedState__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolDerivedState__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolDerivedStateMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private uniswapV3PoolDerivedState: IUniswapV3PoolDerivedState;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.uniswapV3PoolDerivedState =
        IUniswapV3PoolDerivedState__factory.connect(
          contractAddress,
          contractRunner,
        );
    }

    async observe(secondsAgos: Array<number>): Promise<{
      tickCumulatives: Array<bigint>;
      secondsPerLiquidityCumulativeX128s: Array<bigint>;
    }> {
      const result = await this.uniswapV3PoolDerivedState.observe(secondsAgos);
      return {
        tickCumulatives: result.tickCumulatives,
        secondsPerLiquidityCumulativeX128s:
          result.secondsPerLiquidityCumulativeX128s,
      };
    }

    async snapshotCumulativesInside(
      tickLower: number,
      tickUpper: number,
    ): Promise<{
      tickCumulativeInside: bigint;
      secondsPerLiquidityInsideX128: bigint;
      secondsInside: number;
    }> {
      const result =
        await this.uniswapV3PoolDerivedState.snapshotCumulativesInside(
          tickLower,
          tickUpper,
        );
      return {
        tickCumulativeInside: result.tickCumulativeInside,
        secondsPerLiquidityInsideX128: result.secondsPerLiquidityInsideX128,
        secondsInside: Number(result.secondsInside),
      };
    }
  };
}

export { UniswapV3PoolDerivedStateMixin };
