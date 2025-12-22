/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC20Issuable } from "../../../../types/contracts/src/interfaces/token/ERC20/extensions/IERC20Issuable";
import { IERC20Issuable__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC20/extensions/IERC20Issuable__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20IssuableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc20Issuable: IERC20Issuable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc20Issuable = IERC20Issuable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async mint(
      to: `0x${string}`,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc20Issuable.mint(to, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burn(
      from: `0x${string}`,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc20Issuable.burn(from, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ERC20IssuableMixin };
