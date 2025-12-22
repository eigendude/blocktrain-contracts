/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILPNFTHolder } from "../../../../types/contracts/src/interfaces/token/ERC1155/extensions/ILPNFTHolder";
import { ILPNFTHolder__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC1155/extensions/ILPNFTHolder__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LPNFTHolderMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private lpNftTHolder: ILPNFTHolder;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.lpNftTHolder = ILPNFTHolder__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async addressToTokenId(tokenAddress: `0x${string}`): Promise<bigint> {
      return await this.lpNftTHolder.addressToTokenId(tokenAddress);
    }

    async addressesToTokenIds(
      tokenAddresses: `0x${string}`[],
    ): Promise<bigint[]> {
      return await this.lpNftTHolder.addressesToTokenIds(tokenAddresses);
    }

    async tokenIdToAddress(tokenId: bigint): Promise<`0x${string}`> {
      return (await this.lpNftTHolder.tokenIdToAddress(
        tokenId,
      )) as `0x${string}`;
    }

    async tokenIdsToAddresses(tokenIds: bigint[]): Promise<`0x${string}`[]> {
      return (await this.lpNftTHolder.tokenIdsToAddresses(
        tokenIds,
      )) as `0x${string}`[];
    }
  };
}

export { LPNFTHolderMixin };
