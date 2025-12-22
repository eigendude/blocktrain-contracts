/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Bureau of the Reverse Repo
 *
 * Lend your BORROW liquidity to The Reserve. Earn interest while accruing DeFi yield.
 */
interface IReverseRepo is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Admin interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialize the Reverse Repo
   *
   * The Dutch Auction is initialized my minting the first BORROW LP-SFT.
   *
   * It is assumed that this will be the first liquidity deposited in the pool,
   * so both borrowAmount and stableTokenAmount are required to be non-zero.
   *
   * @param borrowAmount The amount of the game token to deposit
   * @param stableTokenAmount The amount of the stable token to deposit
   * @param receiver The receiver of the BORROW LP-SFT
   *
   * @return tokenId The LP-NFT/LP-SFT token ID
   */
  function initialize(
    uint256 borrowAmount,
    uint256 stableTokenAmount,
    address receiver
  ) external returns (uint256 tokenId);

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Buy a BORROW LP-SFT
   *
   * If either `borrowAmount` or `stableTokenAmount` are zero, the purchase
   * will be done via single-sided supply; about half of one token is swapped
   * for the other before pooling. If neither are zero, the tokens will be
   * supplied to the pool with no swap, and any unconsumed tokens (due to an
   * imbalance with the current pool price) will be returned to the receiver.
   *
   * @param borrowAmount The amount of the game token to deposit
   * @param stableTokenAmount The amount of the stable token to deposit
   * @param receiver The receiver of the BORROW LP-SFT
   *
   * @return tokenId The LP-NFT/LP-SFT token ID
   */
  function purchase(
    uint256 borrowAmount,
    uint256 stableTokenAmount,
    address receiver
  ) external returns (uint256 tokenId);

  /**
   * @dev Exit a BORROW LP-SFT position
   *
   * This function allows the LP-SFT owner to exit the pool, receiving their
   * share of the pool's assets in the form of the stable token. The LP-SFT is
   * burned in the process. The empty LP-NFT is returned to the sender.
   *
   * @param tokenId The LP-NFT/LP-SFT token ID
   */
  function exit(uint256 tokenId) external;
}
