/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../../baseContract";
import { ERC721Mixin } from "./erc721Mixin";
import { ERC721MetadataURIMixin } from "./extensions/erc721MetadataUriMixin";

const ERC721Base = ERC721Mixin(BaseContract);
const ERC721MetadataBase = ERC721MetadataURIMixin(ERC721Base);

class ERC721Contract extends ERC721MetadataBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { ERC721Contract };
