/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function BaseMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    protected contractRunner: ethers.Provider | ethers.Signer;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner] = args as [ethers.Provider | ethers.Signer];

      this.contractRunner = contractRunner;
    }

    /**
     * @description Check if the current provider or signer is a signer
     *
     * @returns {boolean} True if the instance is a signer, false otherwise
     */
    protected isSigner(): boolean {
      return "getAddress" in this.contractRunner;
    }

    /**
     * @description A utility method to perform actions that require a signer
     *
     * @param action The function to execute if a signer is present
     * @returns The result of the action, or an error if no signer is present
     */
    protected async withSigner<T>(action: () => Promise<T>): Promise<T> {
      if (!this.isSigner()) {
        throw new Error("A signer is required to perform this transaction.");
      }

      return await action();
    }

    /**
     * @description Helper function to get arguments from a contract event
     *
     * @param {ethers.ContractTransactionReceipt} receipt - The receipt of the
     * transaction
     * @param {string} eventName - The name of the event to search for
     * @param {(result: ethers.Result) => T} callback - The callback to extract
     * the values from the event
     *
     * @returns {T} The values extracted from the event
     */
    protected getValues<T>(
      receipt: ethers.ContractTransactionReceipt,
      eventName: string,
      callback: (result: ethers.Result) => T,
    ): T {
      const logs: (ethers.EventLog | ethers.Log)[] = receipt.logs;

      for (const log of logs) {
        if (log instanceof ethers.EventLog) {
          const eventLog: ethers.EventLog = log as ethers.EventLog;
          if (eventLog.fragment.name === eventName) {
            return callback(eventLog.args);
          }
        }
      }

      throw new Error(`Event ${eventName} not found in receipt`);
    }
  };
}

export { BaseMixin };
