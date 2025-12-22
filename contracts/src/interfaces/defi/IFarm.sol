/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev A contract to earn rewards based on duration and amount
 *
 * Rewards are updated on every interaction.
 */
interface IFarm is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Calculates the accumulated balance of reward per token staked
   *
   * This function computes how much reward each token staked has accumulated
   * over time, up to the latest block timestamp. It is scaled up by 1e18 to
   * avoid precision loss during division.
   *
   * @return The updated reward per token value
   */
  function rewardPerToken() external view returns (uint256);

  /**
   * @dev Calculates the total reward tokens that an account has earned but
   * not yet claimed
   *
   * This function determines the amount of reward tokens an account is entitled
   * to, based on their staked tokens and the difference between the latest
   * reward rate per token and the rate already paid to them, plus any rewards
   * already accrued but not yet transferred.
   *
   * @param account The address of the user to calculate the earned rewards
   *
   * @return The total amount of reward tokens earned by the user
   */
  function earned(address account) external view returns (uint256);

  /**
   * @dev Calculates the total amount of staked tokens for a given account
   *
   * @param account The address of the account to check
   *
   * @return The total amount of liquidity lent by the account
   */
  function balanceOf(address account) external view returns (uint256);

  /**
   * @dev Get the total amount of tokens staked in the pool
   *
   * @return The total amount staked
   */
  function totalLiquidity() external view returns (uint256);
}
