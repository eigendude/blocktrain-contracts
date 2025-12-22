/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {ReentrancyLibrary} from "./ReentrancyLibrary.sol";

/**
 * @dev Contract module that helps prevent reentrant calls to a function
 *
 * Specifically for ERC1155Enumerable.
 */
abstract contract ERC1155EnumerableNonReentrant {
  using ReentrancyLibrary for ReentrancyLibrary.ReentrancyStatus;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  // Unique identifier for the ERC1155Enumerable inteface
  bytes32 private constant ERC1155_ENUMERABLE_ID =
    bytes32("ERC1155EnumerableNonReentrant");

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  // Reentrancy status
  ReentrancyLibrary.ReentrancyStatus private _reentrancyStatus;

  //////////////////////////////////////////////////////////////////////////////
  // Modifiers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Modifier to prevent reentrant calls to ERC1155Enumerable functions
   */
  modifier nonReentrantERC1155Enumerable() {
    _reentrancyStatus.enter(ERC1155_ENUMERABLE_ID);
    _;
    _reentrancyStatus.exit(ERC1155_ENUMERABLE_ID);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Checks if reentrancy is entered for ERC1155Enumerable
   *
   * @return bool True if reentrancy is entered, false otherwise
   */
  function _reentrancyGuardEnteredERC1155Enumerable()
    internal
    view
    returns (bool)
  {
    return _reentrancyStatus.isEntered(ERC1155_ENUMERABLE_ID);
  }
}
