/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolOwnerActions } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolOwnerActions";
import { IUniswapV3PoolOwnerActions__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolOwnerActions__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolOwnerActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private uniswapV3PoolOwnerActions: IUniswapV3PoolOwnerActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.uniswapV3PoolOwnerActions =
        IUniswapV3PoolOwnerActions__factory.connect(
          contractAddress,
          contractRunner,
        );
    }

    async setFeeProtocol(
      feeProtocol0: number,
      feeProtocol1: number,
    ): Promise<ethers.ContractTransactionReceipt> {
      if (!this.isSigner()) {
        throw new Error("A signer is required to perform this transaction");
      }

      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolOwnerActions.setFeeProtocol(
          feeProtocol0,
          feeProtocol1,
        );

      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async collectProtocol(
      recipient: `0x${string}`,
      amount0Requested: bigint,
      amount1Requested: bigint,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      if (!this.isSigner()) {
        throw new Error("A signer is required to perform this transaction");
      }

      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolOwnerActions.collectProtocol(
          recipient,
          amount0Requested,
          amount1Requested,
        );

      const receipt: ethers.ContractTransactionReceipt =
        (await tx.wait()) as ethers.ContractTransactionReceipt;

      return this.getValues(
        receipt,
        "CollectProtocol",
        (result: ethers.Result) => {
          return {
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          };
        },
      );
    }
  };
}

export { UniswapV3PoolOwnerActionsMixin };
