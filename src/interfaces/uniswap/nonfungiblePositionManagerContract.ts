/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { ERC721EnumerableMixin } from "../zeppelin/token/erc721/extensions/erc721EnumerableMixin";
import { ERC721MetadataURIMixin } from "../zeppelin/token/erc721/extensions/erc721MetadataUriMixin";
import { ERC721PermitMixin } from "./erc721PermitMixin";
import { NonfungiblePositionManagerMixin } from "./nonfungiblePositionManagerMixin";
import { PeripheryImmutableStateMixin } from "./peripheryImmutableStateMixin";
import { PeripheryPaymentsMixin } from "./peripheryPaymentsMixin";
import { PoolInitializerMixin } from "./poolInitializerMixin";

const PoolInitializerContract = PoolInitializerMixin(BaseContract);
const PeripheryPaymentsContract = PeripheryPaymentsMixin(
  PoolInitializerContract,
);
const PeripheryImmutableStateContract = PeripheryImmutableStateMixin(
  PeripheryPaymentsContract,
);
const ERC721MetadataURIContract = ERC721MetadataURIMixin(
  PeripheryImmutableStateContract,
);
const ERC721EnumerableContract = ERC721EnumerableMixin(
  ERC721MetadataURIContract,
);
const ERC721PermitContract = ERC721PermitMixin(ERC721EnumerableContract);
const NonfungiblePositionManagerBase =
  NonfungiblePositionManagerMixin(ERC721PermitContract);

class NonfungiblePositionManagerContract extends NonfungiblePositionManagerBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { NonfungiblePositionManagerContract };
