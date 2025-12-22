/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IGameTokenSwapper } from "../../../types/contracts/src/interfaces/token/routes/IGameTokenSwapper";
import { IGameTokenSwapper__factory } from "../../../types/factories/contracts/src/interfaces/token/routes/IGameTokenSwapper__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function GameTokenSwapperMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private gameTokenSwapper: IGameTokenSwapper;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.gameTokenSwapper = IGameTokenSwapper__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async gameIsToken0(): Promise<boolean> {
      return this.gameTokenSwapper.gameIsToken0();
    }

    async buyGameToken(
      assetTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenSwapper.buyGameToken(assetTokenAmount, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async sellGameToken(
      gameTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenSwapper.sellGameToken(gameTokenAmount, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenSwapper.exit();

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { GameTokenSwapperMixin };
