/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IPoolInitializer } from "../../types/contracts/interfaces/uniswap-v3-periphery/IPoolInitializer";
import { IPoolInitializer__factory } from "../../types/factories/contracts/interfaces/uniswap-v3-periphery/IPoolInitializer__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function PoolInitializerMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private poolInitializer: IPoolInitializer;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.poolInitializer = IPoolInitializer__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async createAndInitializePoolIfNecessary(
      token0: `0x${string}`,
      token1: `0x${string}`,
      fee: number,
      sqrtPriceX96: bigint,
    ): Promise<{ pool: `0x${string}` }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.poolInitializer.createAndInitializePoolIfNecessary(
            token0,
            token1,
            fee,
            sqrtPriceX96,
          );

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(
          receipt,
          "PoolCreated",
          (result: ethers.Result) => ({
            pool: result.getValue("pool") as `0x${string}`,
          }),
        );
      });
    }
  };
}

export { PoolInitializerMixin };
