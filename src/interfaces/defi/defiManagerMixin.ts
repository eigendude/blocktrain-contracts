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

    async yieldBalance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.yieldBalance(tokenId);
    }

    async yieldBalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.yieldBalanceBatch(tokenIds);
    }

    async borrowBalance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.borrowBalance(tokenId);
    }

    async borrowBalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.borrowBalanceBatch(tokenIds);
    }

    async lpYieldBalance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.lpYieldBalance(tokenId);
    }

    async lpYieldBalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.lpYieldBalanceBatch(tokenIds);
    }

    async lpBorrowBalance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.lpBorrowBalance(tokenId);
    }

    async lpBorrowBalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.lpBorrowBalanceBatch(tokenIds);
    }

    async debtBalance(tokenId: bigint): Promise<bigint> {
      return this.defiManager.debtBalance(tokenId);
    }

    async debtBalanceBatch(tokenIds: bigint[]): Promise<bigint[]> {
      return this.defiManager.debtBalanceBatch(tokenIds);
    }

    async issueBorrow(
      tokenId: bigint,
      amount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.defiManager.issueBorrow(tokenId, amount, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async repayBorrow(
      tokenId: bigint,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.defiManager.repayBorrow(tokenId, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DeFiManagerMixin };
