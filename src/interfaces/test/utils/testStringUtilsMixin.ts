/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { TestStringUtils } from "../../../types/contracts/test/utils/TestStringUtils";
import { TestStringUtils__factory } from "../../../types/factories/contracts/test/utils/TestStringUtils__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestStringUtilsMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private testStringUtils: TestStringUtils;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.testStringUtils = TestStringUtils__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async testBytes32ToString(bytes32Value: string): Promise<string> {
      return await this.testStringUtils.testBytes32ToString(bytes32Value);
    }
  };
}

export { TestStringUtilsMixin };
