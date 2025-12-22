/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

// Constants
const ERC20_TRANSFER_ABI: Array<string> = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

/**
 * @description Class to decode token routes from event logs
 */
class TokenTracker {
  static getErc20Routes(logs: Array<ethers.EventLog | ethers.Log>): Array<{
    token: `0x${string}`;
    from: `0x${string}`;
    to: `0x${string}`;
    value: bigint;
  }> {
    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = [];

    const erc20TransferInterface = new ethers.Interface(ERC20_TRANSFER_ABI);

    for (let log of logs) {
      if (log instanceof ethers.EventLog) {
        // This is already parsed, so we can access its properties directly
        const eventLog: ethers.EventLog = log as ethers.EventLog;

        const eventName: string = eventLog.fragment.name;
        if (
          eventName === "Transfer" &&
          eventLog.args.length == 3 &&
          eventLog.args.from &&
          eventLog.args.to &&
          eventLog.args.value
        ) {
          const token: `0x${string}` = log.address as `0x${string}`;
          const from: `0x${string}` = eventLog.args.from as `0x${string}`;
          const to: `0x${string}` = eventLog.args.to as `0x${string}`;
          const value: bigint = eventLog.args.value;

          tokenRoutes.push({ token, from, to, value });
        }
      } else if (log instanceof ethers.Log) {
        // This is a raw log; we need to decode it using the interface
        try {
          const decodedLog: null | ethers.LogDescription =
            erc20TransferInterface.parseLog(log);
          if (
            decodedLog &&
            decodedLog.name === "Transfer" &&
            decodedLog.args.length === 3 &&
            decodedLog.args.from &&
            decodedLog.args.to &&
            decodedLog.args.value
          ) {
            const token: `0x${string}` = log.address as `0x${string}`;
            const from: `0x${string}` = decodedLog.args.from as `0x${string}`;
            const to: `0x${string}` = decodedLog.args.to as `0x${string}`;
            const value: bigint = decodedLog.args.value;

            tokenRoutes.push({ token, from, to, value });
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: unknown) {
          continue;
        }
      }
    }

    return tokenRoutes;
  }
}

export { TokenTracker };
