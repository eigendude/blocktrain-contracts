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
 * Specifically for LPSFT.
 */
abstract contract LPSFTNonReentrant {
  using ReentrancyLibrary for ReentrancyLibrary.ReentrancyStatus;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  // Unique identifier for the LPSFT inteface
  bytes32 private constant LP_SFT_ID = bytes32("LPSFTNonReentrant");

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  // Reentrancy status
  ReentrancyLibrary.ReentrancyStatus private _reentrancyStatus;

  //////////////////////////////////////////////////////////////////////////////
  // Modifiers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Modifier to prevent reentrant calls to LPSFT functions
   */
  modifier nonReentrantLPSFT() {
    _reentrancyStatus.enter(LP_SFT_ID);
    _;
    _reentrancyStatus.exit(LP_SFT_ID);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Checks if reentrancy is entered for LPSFT
   *
   * @return bool True if reentrancy is entered, false otherwise
   */
  function _reentrancyGuardEnteredLPSFT() internal view returns (bool) {
    return _reentrancyStatus.isEntered(LP_SFT_ID);
  }
}
