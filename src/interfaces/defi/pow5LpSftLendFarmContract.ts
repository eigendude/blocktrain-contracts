/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { AccessControlMixin } from "../zeppelin/access/accessControlMixin";
import { FarmMixin } from "./farmMixin";
import { LpSftLendFarmMixin } from "./lpSftLendFarmMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const FarmContract = FarmMixin(AccessControlContract);
const LpSftLendFarmContract = LpSftLendFarmMixin(FarmContract);

class POW5LpSftLendFarmContract extends LpSftLendFarmContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { POW5LpSftLendFarmContract };
