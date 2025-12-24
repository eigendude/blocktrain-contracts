/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionActions } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionActions";
import { IDutchAuctionActions__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionActions__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private dutchAuctionActions: IDutchAuctionActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionActions = IDutchAuctionActions__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async purchase(
      lpNftTokenId: bigint,
      yieldAmount: bigint,
      marketTokenAmount: bigint,
      beneficiary: `0x${string}`,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionActions.purchase(
            lpNftTokenId,
            yieldAmount,
            marketTokenAmount,
            beneficiary,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DutchAuctionActionsMixin };
