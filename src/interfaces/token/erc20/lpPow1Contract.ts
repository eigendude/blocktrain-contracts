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
import { ERC20Mixin } from "../../zeppelin/token/erc20/erc20Mixin";
import { ERC20MetadataMixin } from "../../zeppelin/token/erc20/extensions/erc20MetadataMixin";
import { ERC20IssuableMixin } from "./extensions/erc20IssuableMixin";

const ERC20Contract = ERC20Mixin(BaseContract);
const ERC20MetadataContract = ERC20MetadataMixin(ERC20Contract);
const AccessControlContract = AccessControlMixin(ERC20MetadataContract);
const ERC20IssuableContract = ERC20IssuableMixin(AccessControlContract);

class LPPOW1Contract extends ERC20IssuableContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { LPPOW1Contract };
