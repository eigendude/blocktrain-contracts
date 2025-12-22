/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

/**
 * @description A base class for all contract wrappers, storing the contract
 * address and signer
 */
class BaseContract {
  /**
   * @description The address of the contract
   */
  public address: `0x${string}`;

  /**
   * @description The signer used to interact with the blockchain
   */
  protected contractRunner: ethers.Provider | ethers.Signer;

  /**
   * @constructor
   *
   * @param {ethers.Provider | ethers.Signer} contractRunner - The provider or
   * signer instance to interact with the contract
   * @param {string} contractAddress - The address of the contract
   */
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    this.contractRunner = contractRunner;
    this.address = contractAddress;
  }
}

export { BaseContract };
