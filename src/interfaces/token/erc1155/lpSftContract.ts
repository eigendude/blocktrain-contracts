/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../baseContract";
import { AccessControlMixin } from "../../zeppelin/access/accessControlMixin";
import { ERC1155Mixin } from "../../zeppelin/token/erc1155/erc1155Mixin";
import { ERC1155MetadataURIMixin } from "../../zeppelin/token/erc1155/extensions/erc1155MetadataUriMixin";
import { ERC1155EnumerableMixin } from "./extensions/erc1155EnumerableMixin";
import { LPNFTHolderMixin } from "./extensions/lpNftHolderMixin";
import { LPSFTIssuableMixin } from "./extensions/lpSftIssuableMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const ERC1155Contract = ERC1155Mixin(AccessControlContract);
const ERC1155MetadataURIContract = ERC1155MetadataURIMixin(ERC1155Contract);
const ERC1155EnumerableContract = ERC1155EnumerableMixin(
  ERC1155MetadataURIContract,
);
const LPSFTIssuableContract = LPSFTIssuableMixin(ERC1155EnumerableContract);
const LPNFTHolderContract = LPNFTHolderMixin(LPSFTIssuableContract);

class LPSFTContract extends LPNFTHolderContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { LPSFTContract };
