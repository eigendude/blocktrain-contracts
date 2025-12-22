/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { INonfungiblePositionManager } from "../../types/contracts/interfaces/uniswap-v3-periphery/INonfungiblePositionManager";
import { INonfungiblePositionManager__factory } from "../../types/factories/contracts/interfaces/uniswap-v3-periphery/INonfungiblePositionManager__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function NonfungiblePositionManagerMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private nonfungiblePositionManager: INonfungiblePositionManager;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.nonfungiblePositionManager =
        INonfungiblePositionManager__factory.connect(
          contractAddress,
          contractRunner,
        );
    }

    async positions(tokenId: bigint): Promise<{
      nonce: bigint;
      operator: `0x${string}`;
      token0: `0x${string}`;
      token1: `0x${string}`;
      fee: number;
      tickLower: number;
      tickUpper: number;
      liquidity: bigint;
      feeGrowthInside0LastX128: bigint;
      feeGrowthInside1LastX128: bigint;
      tokensOwed0: bigint;
      tokensOwed1: bigint;
    }> {
      const position: {
        nonce: bigint;
        operator: string;
        token0: string;
        token1: string;
        fee: bigint;
        tickLower: bigint;
        tickUpper: bigint;
        liquidity: bigint;
        feeGrowthInside0LastX128: bigint;
        feeGrowthInside1LastX128: bigint;
        tokensOwed0: bigint;
        tokensOwed1: bigint;
      } = await this.nonfungiblePositionManager.positions(tokenId);

      return {
        nonce: BigInt(position.nonce),
        operator: position.operator as `0x${string}`,
        token0: position.token0 as `0x${string}`,
        token1: position.token1 as `0x${string}`,
        fee: Number(position.fee),
        tickLower: Number(position.tickLower),
        tickUpper: Number(position.tickUpper),
        liquidity: BigInt(position.liquidity),
        feeGrowthInside0LastX128: BigInt(position.feeGrowthInside0LastX128),
        feeGrowthInside1LastX128: BigInt(position.feeGrowthInside1LastX128),
        tokensOwed0: BigInt(position.tokensOwed0),
        tokensOwed1: BigInt(position.tokensOwed1),
      };
    }

    async mint(
      token0: `0x${string}`,
      token1: `0x${string}`,
      fee: number,
      tickLower: number,
      tickUpper: number,
      amount0Desired: bigint,
      amount1Desired: bigint,
      amount0Min: bigint,
      amount1Min: bigint,
      recipient: `0x${string}`,
      deadline: bigint,
    ): Promise<{
      tokenId: bigint;
      liquidity: bigint;
      amount0: bigint;
      amount1: bigint;
    }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.nonfungiblePositionManager.mint({
            token0,
            token1,
            fee,
            tickLower,
            tickUpper,
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min,
            recipient,
            deadline,
          });

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(
          receipt,
          "IncreaseLiquidity",
          (result: ethers.Result) => ({
            tokenId: result.getValue("tokenId") as bigint,
            liquidity: result.getValue("liquidity") as bigint,
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          }),
        );
      });
    }

    async increaseLiquidity(
      tokenId: bigint,
      amount0Desired: bigint,
      amount1Desired: bigint,
      amount0Min: bigint,
      amount1Min: bigint,
      deadline: bigint,
    ): Promise<{
      liquidity: bigint;
      amount0: bigint;
      amount1: bigint;
    }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.nonfungiblePositionManager.increaseLiquidity({
            tokenId,
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min,
            deadline,
          });

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(
          receipt,
          "IncreaseLiquidity",
          (result: ethers.Result) => ({
            liquidity: result.getValue("liquidity") as bigint,
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          }),
        );
      });
    }

    async decreaseLiquidity(
      tokenId: bigint,
      liquidity: bigint,
      amount0Min: bigint,
      amount1Min: bigint,
      deadline: bigint,
    ): Promise<{
      amount0: bigint;
      amount1: bigint;
    }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.nonfungiblePositionManager.decreaseLiquidity({
            tokenId,
            liquidity,
            amount0Min,
            amount1Min,
            deadline,
          });

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(
          receipt,
          "DecreaseLiquidity",
          (result: ethers.Result) => ({
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          }),
        );
      });
    }

    async collect(
      tokenId: bigint,
      recipient: `0x${string}`,
      amount0Max: bigint,
      amount1Max: bigint,
    ): Promise<{
      amount0: bigint;
      amount1: bigint;
    }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.nonfungiblePositionManager.collect({
            tokenId,
            recipient,
            amount0Max,
            amount1Max,
          });

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(receipt, "Collect", (result: ethers.Result) => ({
          amount0: result.getValue("amount0") as bigint,
          amount1: result.getValue("amount1") as bigint,
        }));
      });
    }
  };
}

export { NonfungiblePositionManagerMixin };
