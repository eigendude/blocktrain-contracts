/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {RewardMath} from "../../../src/utils/math/RewardMath.sol";

/**
 * @dev Helper contract for RewardMath library testing
 */
contract TestRewardMath {
  /**
   * @dev See {RewardMath-calculateRewardPerToken}
   */
  function calculateRewardPerToken(
    uint256 rewardPerTokenStored,
    uint256 lastUpdateTime,
    uint256 rewardRate,
    uint256 totalStaked
  ) external pure returns (uint256) {
    return
      RewardMath.calculateRewardPerToken(
        rewardPerTokenStored,
        lastUpdateTime,
        rewardRate,
        totalStaked
      );
  }

  /**
   * @dev See {RewardMath-calculateEarned}
   */
  function calculateEarned(
    uint256 staked,
    uint256 rewardPerToken,
    uint256 userRewardPerTokenPaid,
    uint256 accruedRewards
  ) external pure returns (uint256) {
    return
      RewardMath.calculateEarned(
        staked,
        rewardPerToken,
        userRewardPerTokenPaid,
        accruedRewards
      );
  }
}
