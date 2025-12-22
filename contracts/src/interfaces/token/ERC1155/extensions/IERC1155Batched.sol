/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the OpenZeppelin project under the MIT license.
 * Copyright (c) 2016-2024 Zeppelin Group Ltd and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @dev ERC-1155: Multi Token Standard, optional extension for batched operations
 */
interface IERC1155Batched is IERC1155 {
  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Thrown when an ERC-1155 batch operation exceeds {ERC1155Definitions.MAX_BATCH}
   */
  error BatchTooLarge(uint256 length, uint256 max);
}
