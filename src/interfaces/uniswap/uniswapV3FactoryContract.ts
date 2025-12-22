/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { UniswapV3FactoryMixin } from "./uniswapV3FactoryMixin";

const UniswapV3FactoryContractBase = UniswapV3FactoryMixin(BaseContract);

class UniswapV3FactoryContract extends UniswapV3FactoryContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { UniswapV3FactoryContract };
