/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILiquidityForge } from "../../types/contracts/src/interfaces/bureaucracy/ILiquidityForge";
import { ILiquidityForge__factory } from "../../types/factories/contracts/src/interfaces/bureaucracy/ILiquidityForge__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LiquidityForgeMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private liquidityForge: ILiquidityForge;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.liquidityForge = ILiquidityForge__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async borrowBorrow(
      tokenId: bigint,
      amount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.liquidityForge.borrowBorrow(tokenId, amount, receiver);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async repayBorrow(
      tokenId: bigint,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.liquidityForge.repayBorrow(tokenId, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { LiquidityForgeMixin };
