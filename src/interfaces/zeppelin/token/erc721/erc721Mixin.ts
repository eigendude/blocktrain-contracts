/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC721 } from "../../../../types/@openzeppelin/contracts/token/ERC721/IERC721";
import { IERC721__factory } from "../../../../types/factories/@openzeppelin/contracts/token/ERC721/IERC721__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC721Mixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc721: IERC721;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc721 = IERC721__factory.connect(contractAddress, contractRunner);
    }

    async balanceOf(owner: `0x${string}`): Promise<bigint> {
      return await this.erc721.balanceOf(owner);
    }

    async ownerOf(tokenId: bigint): Promise<`0x${string}`> {
      return (await this.erc721.ownerOf(tokenId)) as `0x${string}`;
    }

    async approve(
      to: `0x${string}`,
      tokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc721.approve(to, tokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async getApproved(tokenId: bigint): Promise<`0x${string}`> {
      return (await this.erc721.getApproved(tokenId)) as `0x${string}`;
    }

    async setApprovalForAll(
      operator: `0x${string}`,
      approved: boolean,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc721.setApprovalForAll(operator, approved);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async isApprovedForAll(
      owner: `0x${string}`,
      operator: `0x${string}`,
    ): Promise<boolean> {
      return await this.erc721.isApprovedForAll(owner, operator);
    }

    async transferFrom(
      from: `0x${string}`,
      to: `0x${string}`,
      tokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc721.transferFrom(from, to, tokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async safeTransferFrom(
      from: `0x${string}`,
      to: `0x${string}`,
      tokenId: bigint,
      data?: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse = data
          ? await this.erc721[
              "safeTransferFrom(address,address,uint256,bytes)"
            ](from, to, tokenId, data)
          : await this.erc721["safeTransferFrom(address,address,uint256)"](
              from,
              to,
              tokenId,
            );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ERC721Mixin };
