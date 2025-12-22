/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC20 } from "../../../../types/@openzeppelin/contracts/token/ERC20/IERC20";
import { IERC20__factory } from "../../../../types/factories/@openzeppelin/contracts/token/ERC20/IERC20__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20Mixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc20: IERC20;

    private transferHandlers: Map<
      (from: `0x${string}`, to: `0x${string}`, value: bigint) => void,
      (from: string, to: string, value: ethers.BigNumberish) => void
    > = new Map();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc20 = IERC20__factory.connect(contractAddress, contractRunner);
    }

    async totalSupply(): Promise<bigint> {
      return await this.erc20.totalSupply();
    }

    async balanceOf(account: `0x${string}`): Promise<bigint> {
      return await this.erc20.balanceOf(account);
    }

    async transfer(
      to: `0x${string}`,
      value: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc20.transfer(to, value);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async allowance(
      owner: `0x${string}`,
      spender: `0x${string}`,
    ): Promise<bigint> {
      return await this.erc20.allowance(owner, spender);
    }

    async approve(
      spender: `0x${string}`,
      value: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return (
        await this.approveAsync(spender, value)
      ).wait() as Promise<ethers.ContractTransactionReceipt>;
    }

    async approveAsync(
      spender: `0x${string}`,
      value: bigint,
    ): Promise<ethers.ContractTransactionResponse> {
      return this.withSigner(async () => {
        return await this.erc20.approve(spender, value);
      });
    }

    async transferFrom(
      from: `0x${string}`,
      to: `0x${string}`,
      value: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc20.transferFrom(from, to, value);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    onTransfer(
      callback: (from: `0x${string}`, to: `0x${string}`, value: bigint) => void,
    ): void {
      const handler = (
        from: ethers.AddressLike,
        to: ethers.AddressLike,
        value: ethers.BigNumberish,
      ) => {
        callback(from as `0x${string}`, to as `0x${string}`, BigInt(value));
      };

      this.transferHandlers.set(callback, handler);
      this.erc20.on(this.erc20.filters.Transfer(), handler);
    }

    offTransfer(
      callback: (from: `0x${string}`, to: `0x${string}`, value: bigint) => void,
    ): void {
      const handler = this.transferHandlers.get(callback);

      if (handler) {
        this.erc20.off(this.erc20.filters.Transfer(), handler);
        this.transferHandlers.delete(callback);
      }
    }
  };
}

export { ERC20Mixin };
