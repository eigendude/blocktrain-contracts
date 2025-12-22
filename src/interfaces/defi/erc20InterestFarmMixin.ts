/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC20InterestFarm } from "../../types/contracts/src/interfaces/defi/IERC20InterestFarm";
import { IERC20InterestFarm__factory } from "../../types/factories/contracts/src/interfaces/defi/IERC20InterestFarm__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20InterestFarmMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private interestFarm: IERC20InterestFarm;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.interestFarm = IERC20InterestFarm__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async recordLoan(
      lpSftAddress: `0x${string}`,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.interestFarm.recordLoan(lpSftAddress, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async recordRepayment(
      lpSftAddress: `0x${string}`,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.interestFarm.recordRepayment(lpSftAddress, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async claimReward(
      lpSftAddress: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.interestFarm.claimReward(lpSftAddress);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ERC20InterestFarmMixin };
