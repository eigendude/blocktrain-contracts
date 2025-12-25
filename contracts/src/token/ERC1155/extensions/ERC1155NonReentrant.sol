/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the OpenZeppelin project under the MIT license.
 * Copyright (c) 2016-2024 Zeppelin Group Ltd and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import {ERC1155EnumerableNonReentrant} from "../../../utils/guards/ERC1155EnumerableNonReentrant.sol";
import {LPNFTHolderNonReentrant} from "../../../utils/guards/LPNFTHolderNonReentrant.sol";
import {LPSFTIssuableNonReentrant} from "../../../utils/guards/LPSFTIssuableNonReentrant.sol";
import {LPSFTNonReentrant} from "../../../utils/guards/LPSFTNonReentrant.sol";

/**
 * @title ERC-1155: Multi Token Standard, non-reentrant extension
 *
 * This abstract contract extends the OpenZeppelin ERC-1155 implementation by
 * incorporating multiple reentrancy guards to enhance security for contracts
 * that are derived using diamond inheritance.
 */
abstract contract ERC1155NonReentrant is
  ERC1155EnumerableNonReentrant,
  LPNFTHolderNonReentrant,
  LPSFTIssuableNonReentrant,
  LPSFTNonReentrant,
  ERC1155Upgradeable
{
  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Hard cap on batch size to bound gas and Base calldata/L1 data fees.
   */
  uint256 internal constant MAX_BATCH = 32;

  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Thrown when an ERC-1155 batch operation exceeds {MAX_BATCH}.
   */
  error BatchTooLarge(uint256 length, uint256 max);
}
