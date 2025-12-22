/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC721Permit } from "../../types/contracts/interfaces/uniswap-v3-periphery/IERC721Permit";
import { IERC721Permit__factory } from "../../types/factories/contracts/interfaces/uniswap-v3-periphery/IERC721Permit__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC721PermitMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc721Permit: IERC721Permit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.erc721Permit = IERC721Permit__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async PERMIT_TYPEHASH(): Promise<string> {
      return await this.erc721Permit.PERMIT_TYPEHASH();
    }

    async DOMAIN_SEPARATOR(): Promise<string> {
      return await this.erc721Permit.DOMAIN_SEPARATOR();
    }

    async permit(
      spender: `0x${string}`,
      tokenId: bigint,
      deadline: bigint,
      v: number,
      r: bigint,
      s: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc721Permit.permit(
            spender,
            tokenId,
            deadline,
            v,
            "0x" + r.toString(16),
            "0x" + s.toString(16),
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ERC721PermitMixin };
