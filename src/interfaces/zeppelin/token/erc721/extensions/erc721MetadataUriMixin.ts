/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC721Metadata } from "../../../../../types/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata";
import { IERC721Metadata__factory } from "../../../../../types/factories/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC721MetadataURIMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc721Metadata: IERC721Metadata;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc721Metadata = IERC721Metadata__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async name(): Promise<string> {
      return await this.erc721Metadata.name();
    }

    async symbol(): Promise<string> {
      return await this.erc721Metadata.symbol();
    }

    async tokenURI(tokenId: bigint): Promise<string> {
      return await this.erc721Metadata.tokenURI(tokenId);
    }
  };
}

export { ERC721MetadataURIMixin };
