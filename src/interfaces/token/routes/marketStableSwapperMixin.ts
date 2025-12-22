/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IMarketStableSwapper } from "../../../types/contracts/src/interfaces/token/routes/IMarketStableSwapper";
import { IMarketStableSwapper__factory } from "../../../types/factories/contracts/src/interfaces/token/routes/IMarketStableSwapper__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function MarketStableSwapperMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private marketStableSwapper: IMarketStableSwapper;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.marketStableSwapper = IMarketStableSwapper__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async buyMarketToken(
      stableTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.marketStableSwapper.buyMarketToken(
            stableTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async sellMarketToken(
      marketTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.marketStableSwapper.sellMarketToken(
            marketTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.marketStableSwapper.exit();

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { MarketStableSwapperMixin };
