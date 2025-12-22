/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IPeripheryPayments } from "../../types/contracts/interfaces/uniswap-v3-periphery/IPeripheryPayments";
import { IPeripheryPayments__factory } from "../../types/factories/contracts/interfaces/uniswap-v3-periphery/IPeripheryPayments__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function PeripheryPaymentsMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private peripheryPayments: IPeripheryPayments;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.peripheryPayments = IPeripheryPayments__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async unwrapWETH9(
      amountMinimum: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.peripheryPayments.unwrapWETH9(amountMinimum, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async refundETH(): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.peripheryPayments.refundETH();

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async sweepToken(
      token: `0x${string}`,
      amountMinimum: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.peripheryPayments.sweepToken(
            token,
            amountMinimum,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { PeripheryPaymentsMixin };
