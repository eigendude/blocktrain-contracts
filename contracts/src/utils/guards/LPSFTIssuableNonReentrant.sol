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
 * Specifically for LPSFTIssuable.
 */
abstract contract LPSFTIssuableNonReentrant {
  using ReentrancyLibrary for ReentrancyLibrary.ReentrancyStatus;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  // Unique identifier for the LPSFTIssuable interface
  bytes32 private constant LP_SFT_ISSUABLE_ID =
    bytes32("LPSFTIssuableNonReentrant");

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  // Reentrancy status
  ReentrancyLibrary.ReentrancyStatus private _reentrancyStatus;

  //////////////////////////////////////////////////////////////////////////////
  // Modifiers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Modifier to prevent reentrant calls to LPSFTIssuable functions
   */
  modifier nonReentrantLPSFTIssuable() {
    _reentrancyStatus.enter(LP_SFT_ISSUABLE_ID);
    _;
    _reentrancyStatus.exit(LP_SFT_ISSUABLE_ID);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Checks if reentrancy is entered for LPSFTIssuable
   *
   * @return bool True if reentrancy is entered, false otherwise
   */
  function _reentrancyGuardEnteredLPSFTIssuable() internal view returns (bool) {
    return _reentrancyStatus.isEntered(LP_SFT_ISSUABLE_ID);
  }
}
