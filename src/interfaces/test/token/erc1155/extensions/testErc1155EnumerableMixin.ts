/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { TestERC1155Enumerable } from "../../../../../types/contracts/test/token/erc1155/extensions/TestERC1155Enumerable";
import { TestERC1155Enumerable__factory } from "../../../../../types/factories/contracts/test/token/erc1155/extensions/TestERC1155Enumerable__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestERC1155EnumerableMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private testErc1155Enumerable: TestERC1155Enumerable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.testErc1155Enumerable = TestERC1155Enumerable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async mintNft(
      account: `0x${string}`,
      nftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.mintNft(account, nftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async batchMintNFT(
      account: `0x${string}`,
      nftTokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.batchMintNFT(account, nftTokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burnNft(
      account: `0x${string}`,
      nftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.burnNft(account, nftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async batchBurnNFT(
      account: `0x${string}`,
      nftTokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.batchBurnNFT(account, nftTokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { TestERC1155EnumerableMixin };
