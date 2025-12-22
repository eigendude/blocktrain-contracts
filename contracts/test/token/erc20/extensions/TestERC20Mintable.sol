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

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC-20: Token standard, mintable extension for test purposes
 *
 * @dev Extension of OpenZeppelin's {ERC20} that allows anyone to mint tokens
 * to arbitrary accounts.
 *
 * FOR TESTING ONLY.
 */
abstract contract TestERC20Mintable is ERC20 {
  //////////////////////////////////////////////////////////////////////////////
  // Minting interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Creates `amount` tokens and assigns them to `account`, increasing
   * the total supply.
   */
  function mint(address account, uint256 amount) external {
    // Call ancestor
    _mint(account, amount);
  }
}
