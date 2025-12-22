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

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IMarketStableSwapper} from "../../interfaces/token/routes/IMarketStableSwapper.sol";

import {UniV3Swapper} from "./UniV3Swapper.sol";

/**
 * @dev Token router to swap between the market token and the stable token
 */
contract MarketStableSwapper is
  Context,
  ReentrancyGuard,
  UniV3Swapper,
  IMarketStableSwapper
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param marketToken_ The address of the POW1 token
   * @param stableToken_ The address of the stable token
   * @param marketStablePool_ The address of the pool contract for the token
   *        pair
   */
  constructor(
    address marketToken_,
    address stableToken_,
    address marketStablePool_
  ) UniV3Swapper(marketToken_, stableToken_, marketStablePool_) {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IMarketStableSwapper}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IMarketStableSwapper-marketIsToken0}
   */
  function marketIsToken0() public view override returns (bool) {
    return _numeratorIsToken0;
  }

  /**
   * @dev See {IMarketStableSwapper-buyMarketToken}
   */
  function buyMarketToken(
    uint256 stableTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 marketTokenReturned) {
    // Call ancestor
    marketTokenReturned = _buyNumeratorToken(stableTokenAmount, recipient);

    // Emit event
    emit MarketTokenBought(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      stableTokenAmount,
      marketTokenReturned
    );

    return marketTokenReturned;
  }

  /**
   * @dev See {IMarketStableSwapper-sellMarketToken}
   */
  function sellMarketToken(
    uint256 marketTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 stableTokenReturned) {
    // Call ancestor
    stableTokenReturned = _sellNumeratorToken(marketTokenAmount, recipient);

    // Emit event
    emit MarketTokenSold(
      _msgSender(),
      address(_numeratorToken),
      address(_denominatorToken),
      recipient,
      marketTokenAmount,
      stableTokenReturned
    );

    return stableTokenReturned;
  }

  /**
   * @dev See {IMarketStableSwapper-exit}
   */
  function exit()
    public
    override
    nonReentrant
    returns (uint256 marketTokenAmount, uint256 stableTokenReturned)
  {
    // Call ancestor
    (marketTokenAmount, stableTokenReturned) = _exitSwapper();

    // Emit event
    emit MarketTokenSold(
      _msgSender(),
      _msgSender(),
      address(_numeratorToken),
      address(_denominatorToken),
      marketTokenAmount,
      stableTokenReturned
    );

    return (stableTokenReturned, marketTokenAmount);
  }
}
