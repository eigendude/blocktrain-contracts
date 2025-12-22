/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { WETH9 } from "../../../types/contracts/depends/canonical-weth/WETH9";
import { WETH9__factory } from "../../../types/factories/contracts/depends/canonical-weth/WETH9__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function WrappedNativeMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private wrappedNative: WETH9;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.wrappedNative = WETH9__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async deposit(wad: bigint): Promise<ethers.ContractTransactionReceipt> {
      return (
        await this.depositAsync(wad)
      ).wait() as Promise<ethers.ContractTransactionReceipt>;
    }

    async depositAsync(
      wad: bigint,
    ): Promise<ethers.ContractTransactionResponse> {
      return this.withSigner(async () => {
        return await this.wrappedNative.deposit({
          value: wad,
        });
      });
    }

    async withdraw(wad: bigint): Promise<ethers.ContractTransactionReceipt> {
      return (
        await this.withdrawAsync(wad)
      ).wait() as Promise<ethers.ContractTransactionReceipt>;
    }

    async withdrawAsync(
      wad: bigint,
    ): Promise<ethers.ContractTransactionResponse> {
      return this.withSigner(async () => {
        return await this.wrappedNative.withdraw(wad);
      });
    }
  };
}

export { WrappedNativeMixin };
