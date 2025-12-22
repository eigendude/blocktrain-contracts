/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

/**
 * @dev Library providing string manipulation utilities
 */
library StringUtils {
  /**
   * @dev Converts a bytes32 value to its ASCII string representation
   *
   * @param _bytes32 The bytes32 value to convert
   *
   * @return The string representation of the bytes32 value
   */
  function bytes32ToString(
    bytes32 _bytes32
  ) internal pure returns (string memory) {
    uint8 i = 0;

    // Find the first null byte (0x00)
    while (i < 32 && _bytes32[i] != 0) {
      i++;
    }

    // Create a bytes array with the determined length
    bytes memory bytesArray = new bytes(i);

    // Copy each byte to the array
    for (uint8 j = 0; j < i; j++) {
      bytesArray[j] = _bytes32[j];
    }

    return string(bytesArray);
  }
}
