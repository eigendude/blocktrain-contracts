/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC20Metadata } from "../../../../../types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { IERC20Metadata__factory } from "../../../../../types/factories/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20MetadataMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc20Metadata: IERC20Metadata;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc20Metadata = IERC20Metadata__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async name(): Promise<string> {
      return await this.erc20Metadata.name();
    }

    async symbol(): Promise<string> {
      return await this.erc20Metadata.symbol();
    }

    async decimals(): Promise<number> {
      return Number(await this.erc20Metadata.decimals());
    }
  };
}

export { ERC20MetadataMixin };
