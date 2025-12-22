/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IYieldHarvest } from "../../../types/contracts/src/interfaces/bureaucracy/yieldHarvest/IYieldHarvest";
import { IYieldHarvest__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/yieldHarvest/IYieldHarvest__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function YieldHarvestMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private yieldHarvest: IYieldHarvest;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.yieldHarvest = IYieldHarvest__factory.connect(
        contractAddress,
        contractRunner,
      );

      // TODO: Use yieldHarvest
      this.yieldHarvest;
    }
  };
}

export { YieldHarvestMixin };
