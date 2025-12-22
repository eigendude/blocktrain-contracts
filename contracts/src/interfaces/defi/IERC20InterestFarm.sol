/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {IFarm} from "./IFarm.sol";

/**
 * @dev A contract to lend ERC20 tokens and earn rewards based on lending
 * duration and amounts
 *
 * Rewards are calculated based on the amount of time and tokens loaned.
 *
 * Rewards are updated on every interaction.
 */
interface IERC20InterestFarm is IERC165, IFarm {
  //////////////////////////////////////////////////////////////////////////////
  // Public mutators
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Allows a user to deposit tokens into the pool
   *
   * This function increases both the total loaned tokens in the pool and the
   * loaned amount for the user calling the function.
   *
   * @param lpSftAddress The address of the LP-SFT
   * @param amount The amount of tokens the user wishes to stake
   */
  function recordLoan(address lpSftAddress, uint256 amount) external;

  /**
   * @dev Allows a user to withdraw loaned tokens from the pool
   *
   * This function decreases both the total loaned tokens in the pool and the
   * user's loaned amount.
   *
   * @param lpSftAddress The address of the LP-SFT
   * @param amount The amount of tokens the user wishes to withdraw
   */
  function recordRepayment(address lpSftAddress, uint256 amount) external;

  /**
   * @dev Allows a user to claim their accumulated rewards from the pool
   *
   * This function transfers the accumulated rewards to the user's wallet.
   *
   * @param lpSftAddress The address of the LP-SFT
   */
  function claimReward(address lpSftAddress) external;
}
