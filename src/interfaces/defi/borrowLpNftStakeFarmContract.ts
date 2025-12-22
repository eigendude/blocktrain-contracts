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
import { UniV3StakeFarmMixin } from "./uniV3StakeFarmMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const UniV3StakeFarmContract = UniV3StakeFarmMixin(AccessControlContract);

class BORROWLpNftStakeFarmContract extends UniV3StakeFarmContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { BORROWLpNftStakeFarmContract };
