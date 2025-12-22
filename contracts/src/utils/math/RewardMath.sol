/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

/**
 * @dev Library for calculating rewards for staking contracts
 */
library RewardMath {
  uint256 private constant PRECISION = 1e18;

  /**
   * @dev Calculates the new reward per token based on the time elapsed,
   * reward rate, and total staked
   *
   * Formula is:
   *
   *   New Reward Per Token = Reward Per Token Stored +
   *       ((Time Elapsed * Reward Rate * Precision) / Total Staked)
   *
   * @param rewardPerTokenStored The accumulated reward per token up to the last update
   * @param timeElapsed The amount of time that has elapsed since the last update
   * @param rewardRate The rate at which rewards are generated per token per second
   * @param totalStaked The total amount of the staked token
   *
   * @return The updated reward per token
   */
  function calculateRewardPerToken(
    uint256 rewardPerTokenStored,
    uint256 timeElapsed,
    uint256 rewardRate,
    uint256 totalStaked
  ) internal pure returns (uint256) {
    // Return the previously stored value if no tokens are currently staked
    if (totalStaked == 0) {
      return rewardPerTokenStored;
    }

    // Calculate the additional rewards accumulated per token over the
    // elapsed time
    uint256 additionalReward = (timeElapsed * rewardRate * PRECISION) /
      totalStaked;

    // Sum the previously stored rewards with the newly calculated additional
    // rewards
    return rewardPerTokenStored + additionalReward;
  }

  /**
   * @dev Calculates the new earned rewards for a user
   *
   * Formula is:
   *
   *   Earned Rewards = Accrued Rewards +
   *       ((Staked * (Reward Per Token - User Reward Per Token Paid)) / Precision)
   *
   * @param staked The amount of tokens the user has staked
   * @param rewardPerToken The current calculated reward per token
   * @param userRewardPerTokenPaid The reward per token value that was last
   *                               recorded for the user
   * @param accruedRewards The amount of rewards that have been accrued for
   *                       the user so far
   *
   * @return The total earned rewards
   */
  function calculateEarned(
    uint256 staked,
    uint256 rewardPerToken,
    uint256 userRewardPerTokenPaid,
    uint256 accruedRewards
  ) internal pure returns (uint256) {
    // Calculate the reward difference per token since the last user update
    uint256 rewardDifference = rewardPerToken - userRewardPerTokenPaid;

    // Calculate the new rewards earned based on the user's staked amount and
    // the reward difference
    uint256 newRewards = (staked * rewardDifference) / PRECISION;

    // Add the newly calculated rewards to the previously accrued rewards to
    // get the total
    return newRewards + accruedRewards;
  }
}
