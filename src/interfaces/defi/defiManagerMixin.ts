/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDeFiManager } from "../../types/contracts/src/interfaces/defi/IDeFiManager";
import { IDeFiManager__factory } from "../../types/factories/contracts/src/interfaces/defi/IDeFiManager__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DeFiManagerMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private defiManager: IDeFiManager;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.defiManager = IDeFiManager__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async pow1Balance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.pow1Balance(tokenId);
    }

    async pow1BalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.pow1BalanceBatch(tokenIds);
    }

    async pow5Balance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.pow5Balance(tokenId);
    }

    async pow5BalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.pow5BalanceBatch(tokenIds);
    }

    async lpPow1Balance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.lpPow1Balance(tokenId);
    }

    async lpPow1BalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.lpPow1BalanceBatch(tokenIds);
    }

    async lpPow5Balance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.lpPow5Balance(tokenId);
    }

    async lpPow5BalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.lpPow5BalanceBatch(tokenIds);
    }

    async noPow5Balance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.noPow5Balance(tokenId);
    }

    async noPow5BalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.noPow5BalanceBatch(tokenIds);
    }

    async issuePow5(
      tokenId: bigint,
      amount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.defiManager.issuePow5(tokenId, amount, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async repayPow5(
      tokenId: bigint,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.defiManager.repayPow5(tokenId, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DeFiManagerMixin };
