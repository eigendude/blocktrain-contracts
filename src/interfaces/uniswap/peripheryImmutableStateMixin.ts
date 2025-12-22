/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IPeripheryImmutableState } from "../../types/contracts/interfaces/uniswap-v3-periphery/IPeripheryImmutableState";
import { IPeripheryImmutableState__factory } from "../../types/factories/contracts/interfaces/uniswap-v3-periphery/IPeripheryImmutableState__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function PeripheryImmutableStateMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private peripheryImmutableState: IPeripheryImmutableState;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.peripheryImmutableState = IPeripheryImmutableState__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async factory(): Promise<`0x${string}`> {
      return (await this.peripheryImmutableState.factory()) as `0x${string}`;
    }

    async WETH9(): Promise<`0x${string}`> {
      return (await this.peripheryImmutableState.WETH9()) as `0x${string}`;
    }
  };
}

export { PeripheryImmutableStateMixin };
