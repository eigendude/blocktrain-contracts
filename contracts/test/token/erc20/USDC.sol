/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import "./extensions/TestERC20Mintable.sol";

/**
 * @title USD Coin
 *
 * @dev Used for USDC functionality in test suite
 *
 * FOR TESTING ONLY.
 */
contract USDC is TestERC20Mintable {
  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The ERC 20 token name used by wallets to identify the token
   */
  string private constant TOKEN_NAME = "Funny USD Coin";

  /**
   * @dev The ERC 20 token symbol used as an abbreviation of the token, such
   * as BTC, ETH, AUG or SJCX.
   */
  string private constant TOKEN_SYMBOL = "USDC";

  /**
   * @dev The number of decimals, typically 18 for most ERC-20 tokens
   */
  uint8 private constant DECIMALS = 6;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the token with a name and symbol
   */
  // solhint-disable-next-line no-empty-blocks
  constructor() ERC20(TOKEN_NAME, TOKEN_SYMBOL) {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC20Metadata} via {TestERC20Mintable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC20Metadata-decimals}
   */
  // slither-disable-next-line external-function
  function decimals() public pure override returns (uint8) {
    return DECIMALS;
  }
}
