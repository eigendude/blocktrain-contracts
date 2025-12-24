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

import {TestGameTokenStaker} from "./TestGameTokenStaker.sol";

/**
 * @dev Token router send to liquidity to the YIELD pool in exchange for an
 *      LP-SFT
 */
contract TestYIELDMarketStaker is TestGameTokenStaker {
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param owner_ The initial owner of the contract
   * @param yieldToken_ The address of the YIELD token
   * @param marketToken_ The address of the market token
   * @param rewardToken_ The address of the reward token
   * @param yieldMarketPool_ The address of the pool for the token pair
   * @param yieldMarketPooler_ The address of the pooler for the token pair
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT
   *        manager
   * @param uniswapV3Staker_ The address of the upstream Uniswap V3 staker
   * @param lpSft_ The address of the LP-SFT contract
   */
  constructor(
    address owner_,
    address yieldToken_,
    address marketToken_,
    address rewardToken_,
    address yieldMarketPool_,
    address yieldMarketPooler_,
    address uniswapV3NftManager_,
    address uniswapV3Staker_,
    address lpSft_
  )
    TestGameTokenStaker(
      owner_,
      yieldToken_,
      marketToken_,
      rewardToken_,
      yieldMarketPool_,
      yieldMarketPooler_,
      uniswapV3NftManager_,
      uniswapV3Staker_,
      lpSft_
    )
  {}
}
