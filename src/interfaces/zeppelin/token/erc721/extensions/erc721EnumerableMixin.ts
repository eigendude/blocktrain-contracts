/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC721Enumerable } from "../../../../../types/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable";
import { IERC721Enumerable__factory } from "../../../../../types/factories/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC721EnumerableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc721Enumerable: IERC721Enumerable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc721Enumerable = IERC721Enumerable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async totalSupply(): Promise<bigint> {
      return await this.erc721Enumerable.totalSupply();
    }

    async tokenOfOwnerByIndex(
      owner: `0x${string}`,
      index: number,
    ): Promise<bigint> {
      return await this.erc721Enumerable.tokenOfOwnerByIndex(owner, index);
    }

    async tokenByIndex(index: number): Promise<bigint> {
      return await this.erc721Enumerable.tokenByIndex(index);
    }
  };
}

export { ERC721EnumerableMixin };
