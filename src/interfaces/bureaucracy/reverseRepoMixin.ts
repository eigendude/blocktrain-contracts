/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IReverseRepo } from "../../types/contracts/src/interfaces/bureaucracy/IReverseRepo";
import { IReverseRepo__factory } from "../../types/factories/contracts/src/interfaces/bureaucracy/IReverseRepo__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ReverseRepoMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private reverseRepo: IReverseRepo;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.reverseRepo = IReverseRepo__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async initialize(
      pow5Amount: bigint,
      stableTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.reverseRepo.initialize(
            pow5Amount,
            stableTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async purchase(
      pow5Amount: bigint,
      stableTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.reverseRepo.purchase(
            pow5Amount,
            stableTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(tokenId: bigint): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.reverseRepo.exit(tokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ReverseRepoMixin };
