/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILPSFTIssuable } from "../../../../types/contracts/src/interfaces/token/ERC1155/extensions/ILPSFTIssuable";
import { ILPSFTIssuable__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC1155/extensions/ILPSFTIssuable__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LPSFTIssuableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private lpSftIssuable: ILPSFTIssuable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.lpSftIssuable = ILPSFTIssuable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async mint(
      to: `0x${string}`,
      sftTokenId: bigint,
      data: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.mint(to, sftTokenId, data);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async mintBatch(
      to: `0x${string}`,
      sftTokenIds: bigint[],
      data: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.mintBatch(to, sftTokenIds, data);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burn(
      from: `0x${string}`,
      sftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.burn(from, sftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burnBatch(
      from: `0x${string}`,
      sftTokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.burnBatch(from, sftTokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { LPSFTIssuableMixin };
