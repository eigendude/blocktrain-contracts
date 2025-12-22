/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import "../../src/utils/StringUtils.sol";

/**
 * @dev Contract to test StringUtils library
 */
contract TestStringUtils {
  /**
   * @dev See {StringUtils-stringToBytes32}
   */
  function testBytes32ToString(
    bytes32 input
  ) external pure returns (string memory) {
    return StringUtils.bytes32ToString(input);
  }
}
