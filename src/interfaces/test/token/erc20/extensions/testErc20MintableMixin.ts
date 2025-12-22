/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { TestERC20Mintable } from "../../../../../types/contracts/test/token/erc20/extensions/TestERC20Mintable";
import { TestERC20Mintable__factory } from "../../../../../types/factories/contracts/test/token/erc20/extensions/TestERC20Mintable__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestERC20MintableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private testErc1155Enumerable: TestERC20Mintable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.testErc1155Enumerable = TestERC20Mintable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async mint(
      account: `0x${string}`,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.mint(account, amount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { TestERC20MintableMixin };
