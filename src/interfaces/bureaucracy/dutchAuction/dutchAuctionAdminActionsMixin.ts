/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionAdminActions } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionAdminActions";
import { IDutchAuctionAdminActions__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionAdminActions__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionAdminActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private dutchAuctionAdminActions: IDutchAuctionAdminActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionAdminActions =
        IDutchAuctionAdminActions__factory.connect(
          contractAddress,
          contractRunner,
        );
    }

    async initialize(
      yieldAmount: bigint,
      marketTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionAdminActions.initialize(
            yieldAmount,
            marketTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async isInitialized(): Promise<boolean> {
      return await this.dutchAuctionAdminActions.isInitialized();
    }

    async setAuctionCount(
      auctionCount: number,
      marketTokenDust: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionAdminActions.setAuctionCount(
            auctionCount,
            marketTokenDust,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async getAuctionCount(): Promise<number> {
      return Number(await this.dutchAuctionAdminActions.getAuctionCount());
    }
  };
}

export { DutchAuctionAdminActionsMixin };
