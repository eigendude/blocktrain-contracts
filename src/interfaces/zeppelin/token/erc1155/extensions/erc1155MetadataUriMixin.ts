/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC1155MetadataURI } from "../../../../../types/@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI";
import { IERC1155MetadataURI__factory } from "../../../../../types/factories/@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC1155MetadataURIMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private erc1155MetadataUri: IERC1155MetadataURI;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc1155MetadataUri = IERC1155MetadataURI__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async uri(id: bigint): Promise<string> {
      return await this.erc1155MetadataUri.uri(id);
    }
  };
}

export { ERC1155MetadataURIMixin };
