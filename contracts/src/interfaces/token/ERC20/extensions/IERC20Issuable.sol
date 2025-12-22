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

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title ERC-20: Token Standard, optional issuable extension
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-20
 */
interface IERC20Issuable is IERC165, IERC20 {
  /**
   * @dev Mints new coins
   *
   * @param to The account to mint coins to
   * @param amount The amount of coins to mint
   */
  function mint(address to, uint256 amount) external;

  /**
   * @dev Burns existing coins
   *
   * @param from The account to burn coins from
   * @param amount The amount of coins to burn
   */
  function burn(address from, uint256 amount) external;
}
