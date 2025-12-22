/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../../../baseContract";
import { ERC20Mixin } from "../erc20Mixin";
import { ERC20MetadataMixin } from "./erc20MetadataMixin";

const ERC20Contract = ERC20Mixin(BaseContract);
const ERC20MetadataContractBase = ERC20MetadataMixin(ERC20Contract);

class ERC20MetadataContract extends ERC20MetadataContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { ERC20MetadataContract };
