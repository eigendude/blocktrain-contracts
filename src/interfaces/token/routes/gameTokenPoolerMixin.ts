/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IGameTokenPooler } from "../../../types/contracts/src/interfaces/token/routes/IGameTokenPooler";
import { IGameTokenPooler__factory } from "../../../types/factories/contracts/src/interfaces/token/routes/IGameTokenPooler__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function GameTokenPoolerMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private gameTokenPooler: IGameTokenPooler;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.gameTokenPooler = IGameTokenPooler__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async gameIsToken0(): Promise<boolean> {
      return this.gameTokenPooler.gameIsToken0();
    }

    async mintLpNftWithGameToken(
      gameTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenPooler.mintLpNftWithGameToken(
            gameTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async mintLpNftWithAssetToken(
      assetTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenPooler.mintLpNftWithAssetToken(
            assetTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async mintLpNftImbalance(
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenPooler.mintLpNftImbalance(
            gameTokenAmount,
            assetTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async collectFromLpNft(
      lpNftTokenId: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenPooler.collectFromLpNft(lpNftTokenId, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(
      lpNftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenPooler.exit(lpNftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { GameTokenPoolerMixin };
