/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { LiquidityForgeMixin } from "./liquidityForgeMixin";

const LiquidityForgeContractBase = LiquidityForgeMixin(BaseContract);

class LiquidityForgeContract extends LiquidityForgeContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { LiquidityForgeContract };
