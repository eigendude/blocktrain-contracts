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

/**
 * @dev Token router to swap between the market token and the stable token
 */
interface IMarketStableSwapper {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when the market token is purchased for the stable token
   *
   * @param sender The sender of the stable token
   * @param recipient The address of the recipient of the market token
   * @param marketTokenAddress The address of the market token contract
   * @param stableTokenAddress The amount of the stable token being spent
   * @param stableTokenAmount The amount of the stable token being spent
   * @param marketTokenReturned The amount of the market token received
   */
  event MarketTokenBought(
    address indexed sender,
    address indexed recipient,
    address indexed marketTokenAddress,
    address stableTokenAddress,
    uint256 stableTokenAmount,
    uint256 marketTokenReturned
  );

  /**
   * @dev Emitted when the market token is sold for the stable token
   *
   * @param sender The sender of the market token
   * @param recipient The address of the recipient of the stable token
   * @param marketTokenAddress The address of the market token contract
   * @param marketTokenAmount The amount of the market token being spent
   * @param marketTokenAmount The amount of the market token spent
   * @param stableTokenReturned The amount of the stable token received
   */
  event MarketTokenSold(
    address indexed sender,
    address indexed recipient,
    address indexed marketTokenAddress,
    address stableTokenAddress,
    uint256 marketTokenAmount,
    uint256 stableTokenReturned
  );

  //////////////////////////////////////////////////////////////////////////////
  // Public accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IMarketStableSwapper-marketIsToken0}
   */
  function marketIsToken0() external view returns (bool);

  //////////////////////////////////////////////////////////////////////////////
  // Public interface for swapping into the market token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the stable token for the market token
   *
   * @param stableTokenAmount The ammount of the stable token to include in
   *        the swap
   * @param recipient The receiver of the market token
   *
   * @return marketTokenReturned The amount of the market token returned to the
   * recipient
   */
  function buyMarketToken(
    uint256 stableTokenAmount,
    address recipient
  ) external returns (uint256 marketTokenReturned);

  //////////////////////////////////////////////////////////////////////////////
  // Public interface for swapping out of the market token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the market token for the stable token
   *
   * @param marketTokenAmount The amount of the market token to swap
   * @param recipient The recient of the stable token
   *
   * @return stableTokenReturned The amount of stable token returned to the
   * recipient
   */
  function sellMarketToken(
    uint256 marketTokenAmount,
    address recipient
  ) external returns (uint256 stableTokenReturned);

  /**
   * @dev Liquidate everything to the stable token in one function call
   *
   * @return marketTokenAmount The amount of market token spent
   * @return stableTokenReturned The amount of stable token returned to the
   * recipient
   */
  function exit()
    external
    returns (uint256 marketTokenAmount, uint256 stableTokenReturned);
}
