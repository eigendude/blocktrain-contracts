/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC1155 } from "../../../../types/@openzeppelin/contracts/token/ERC1155/IERC1155";
import { IERC1155__factory } from "../../../../types/factories/@openzeppelin/contracts/token/ERC1155/IERC1155__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC1155Mixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc1155: IERC1155;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc1155 = IERC1155__factory.connect(contractAddress, contractRunner);
    }

    async balanceOf(account: `0x${string}`, id: bigint): Promise<bigint> {
      return await this.erc1155.balanceOf(account, id);
    }

    async balanceOfBatch(
      accounts: `0x${string}`[],
      ids: bigint[],
    ): Promise<bigint[]> {
      return await this.erc1155.balanceOfBatch(accounts, ids);
    }

    async setApprovalForAll(
      operator: `0x${string}`,
      approved: boolean,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc1155.setApprovalForAll(operator, approved);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async isApprovedForAll(
      account: `0x${string}`,
      operator: `0x${string}`,
    ): Promise<boolean> {
      return await this.erc1155.isApprovedForAll(account, operator);
    }

    async safeTransferFrom(
      from: `0x${string}`,
      to: `0x${string}`,
      id: bigint,
      value: bigint,
      data?: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc1155.safeTransferFrom(
            from,
            to,
            id,
            value,
            data ? data : new Uint8Array(),
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async safeBatchTransferFrom(
      from: `0x${string}`,
      to: `0x${string}`,
      ids: bigint[],
      values: bigint[],
      data?: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc1155.safeBatchTransferFrom(
            from,
            to,
            ids,
            values,
            data ? data : new Uint8Array(),
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ERC1155Mixin };
