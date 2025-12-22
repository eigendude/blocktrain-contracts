/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {StringUtils} from "../StringUtils.sol";

/**
 * @dev Library to manage multiple reentrancy locks using unique identifiers
 *
 * This library provides functions to handle reentrancy guards for different
 * interfaces identified by unique bytes32 identifiers. It allows contracts
 * with diamond inheritance hierarchies to implement secure and isolated
 * reentrancy protection.
 */
library ReentrancyLibrary {
  //////////////////////////////////////////////////////////////////////////////
  // Types
  //////////////////////////////////////////////////////////////////////////////

  // Mapping from unique interface identifier to reentrancy status
  struct ReentrancyStatus {
    mapping(bytes32 => uint256) status;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  // Constants representing reentrancy states
  uint256 private constant NOT_ENTERED = 1;
  uint256 private constant ENTERED = 2;

  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Error for reentrant calls
   *
   * @param interfaceId The unique identifier for the interface being reentered
   */
  error ReentrantCall(string interfaceId);

  //////////////////////////////////////////////////////////////////////////////
  // Functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Checks and sets the reentrancy guard for the provided key preventing
   * reentry
   *
   * @param status The ReentrancyStatus struct
   * @param interfaceId The unique identifier for the interface
   */
  function enter(
    ReentrancyStatus storage status,
    bytes32 interfaceId
  ) internal {
    if (status.status[interfaceId] == ENTERED) {
      // Convert interfaceId to human-readable string
      string memory interfaceIdStr = StringUtils.bytes32ToString(interfaceId);

      revert ReentrantCall(interfaceIdStr);
    }
    status.status[interfaceId] = ENTERED;
  }

  /**
   * @dev Resets the reentrancy guard for the provided key, allowing future
   * entry
   *
   * @param status The ReentrancyStatus struct
   * @param interfaceId The unique identifier for the interface
   */
  function exit(ReentrancyStatus storage status, bytes32 interfaceId) internal {
    status.status[interfaceId] = NOT_ENTERED;
  }

  /**
   * @dev Returns true if the reentrancy guard is currently set to "entered",
   * which indicates there is a non-reentrant function in the call stack
   *
   * @param status The ReentrancyStatus struct
   * @param interfaceId The unique identifier for the inteface
   */
  function isEntered(
    ReentrancyStatus storage status,
    bytes32 interfaceId
  ) internal view returns (bool) {
    return status.status[interfaceId] == ENTERED;
  }
}
