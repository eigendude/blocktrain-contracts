/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolState } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolState";
import { IUniswapV3PoolState__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolState__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolStateMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private uniswapV3PoolState: IUniswapV3PoolState;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.uniswapV3PoolState = IUniswapV3PoolState__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async slot0(): Promise<{
      sqrtPriceX96: bigint;
      tick: number;
      observationIndex: number;
      observationCardinality: number;
      observationCardinalityNext: number;
      feeProtocol: number;
      unlocked: boolean;
    }> {
      const result: {
        sqrtPriceX96: bigint;
        tick: bigint;
        observationIndex: bigint;
        observationCardinality: bigint;
        observationCardinalityNext: bigint;
        feeProtocol: bigint;
        unlocked: boolean;
      } = await this.uniswapV3PoolState.slot0();

      return {
        sqrtPriceX96: result.sqrtPriceX96,
        tick: Number(result.tick),
        observationIndex: Number(result.observationIndex),
        observationCardinality: Number(result.observationCardinality),
        observationCardinalityNext: Number(result.observationCardinalityNext),
        feeProtocol: Number(result.feeProtocol),
        unlocked: result.unlocked,
      };
    }

    async feeGrowthGlobal0X128(): Promise<bigint> {
      return await this.uniswapV3PoolState.feeGrowthGlobal0X128();
    }

    async feeGrowthGlobal1X128(): Promise<bigint> {
      return await this.uniswapV3PoolState.feeGrowthGlobal1X128();
    }

    async protocolFees(): Promise<{
      token0: bigint;
      token1: bigint;
    }> {
      return await this.uniswapV3PoolState.protocolFees();
    }

    async liquidity(): Promise<bigint> {
      return await this.uniswapV3PoolState.liquidity();
    }

    async ticks(tick: bigint): Promise<{
      liquidityGross: bigint;
      liquidityNet: bigint;
      feeGrowthOutside0X128: bigint;
      feeGrowthOutside1X128: bigint;
      tickCumulativeOutside: bigint;
      secondsPerLiquidityOutsideX128: bigint;
      secondsOutside: number;
      initialized: boolean;
    }> {
      const result: {
        liquidityGross: bigint;
        liquidityNet: bigint;
        feeGrowthOutside0X128: bigint;
        feeGrowthOutside1X128: bigint;
        tickCumulativeOutside: bigint;
        secondsPerLiquidityOutsideX128: bigint;
        secondsOutside: bigint;
        initialized: boolean;
      } = await this.uniswapV3PoolState.ticks(tick);

      return {
        liquidityGross: result.liquidityGross,
        liquidityNet: result.liquidityNet,
        feeGrowthOutside0X128: result.feeGrowthOutside0X128,
        feeGrowthOutside1X128: result.feeGrowthOutside1X128,
        tickCumulativeOutside: result.tickCumulativeOutside,
        secondsPerLiquidityOutsideX128: result.secondsPerLiquidityOutsideX128,
        secondsOutside: Number(result.secondsOutside),
        initialized: result.initialized,
      };
    }

    async tickBitmap(wordPosition: bigint): Promise<bigint> {
      return await this.uniswapV3PoolState.tickBitmap(wordPosition);
    }

    async positions(key: string): Promise<{
      _liquidity: bigint;
      feeGrowthInside0LastX128: bigint;
      feeGrowthInside1LastX128: bigint;
      tokensOwed0: bigint;
      tokensOwed1: bigint;
    }> {
      return await this.uniswapV3PoolState.positions(key);
    }

    async observations(index: bigint): Promise<{
      blockTimestamp: number;
      tickCumulative: bigint;
      secondsPerLiquidityCumulativeX128: bigint;
      initialized: boolean;
    }> {
      const result: {
        blockTimestamp: bigint;
        tickCumulative: bigint;
        secondsPerLiquidityCumulativeX128: bigint;
        initialized: boolean;
      } = await this.uniswapV3PoolState.observations(index);

      return {
        blockTimestamp: Number(result.blockTimestamp),
        tickCumulative: result.tickCumulative,
        secondsPerLiquidityCumulativeX128:
          result.secondsPerLiquidityCumulativeX128,
        initialized: result.initialized,
      };
    }
  };
}

export { UniswapV3PoolStateMixin };
