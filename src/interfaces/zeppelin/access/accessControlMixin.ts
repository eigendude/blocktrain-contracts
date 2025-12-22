/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IAccessControl } from "../../../types/@openzeppelin/contracts/access/IAccessControl";
import { IAccessControl__factory } from "../../../types/factories/@openzeppelin/contracts/access/IAccessControl__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function AccessControlMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private accessControl: IAccessControl;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.accessControl = IAccessControl__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async hasRole(role: string, account: `0x${string}`): Promise<boolean> {
      return await this.accessControl.hasRole(role, account);
    }

    async getRoleAdmin(role: string): Promise<string> {
      return await this.accessControl.getRoleAdmin(role);
    }

    async grantRole(
      role: string,
      account: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return (
        await this.grantRoleAsync(role, account)
      ).wait() as Promise<ethers.ContractTransactionReceipt>;
    }

    async grantRoleAsync(
      role: string,
      account: `0x${string}`,
    ): Promise<ethers.ContractTransactionResponse> {
      return this.withSigner(async () => {
        return await this.accessControl.grantRole(role, account);
      });
    }

    async revokeRole(
      role: string,
      account: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return (
        await this.revokeRoleAsync(role, account)
      ).wait() as Promise<ethers.ContractTransactionReceipt>;
    }

    async revokeRoleAsync(
      role: string,
      account: `0x${string}`,
    ): Promise<ethers.ContractTransactionResponse> {
      return this.withSigner(async () => {
        return this.accessControl.revokeRole(role, account);
      });
    }

    async renounceRole(
      role: string,
      callerConfirmation: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      return (
        await this.renounceRoleAsync(role, callerConfirmation)
      ).wait() as Promise<ethers.ContractTransactionReceipt>;
    }

    async renounceRoleAsync(
      role: string,
      callerConfirmation: string,
    ): Promise<ethers.ContractTransactionResponse> {
      return this.withSigner(async () => {
        return this.accessControl.renounceRole(role, callerConfirmation);
      });
    }
  };
}

export { AccessControlMixin };
