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
 * @title Bureau of the Liquidity Forge
 *
 * Collateralize the LP-NFT with a collateralization ratio of up to 100x in
 * return for a BORROW loan with negative interest.
 *
 * Like US dollars, BORROW is loaned into existence. Loan interest is set by an
 * inverted yield curve.
 *
 * Loans can be refinanced at any time. While collateralized, the DeFi
 * can be claimed by repaying the BORROW (which is destroyed) or by using a flash
 * loan.
 *
 * If the player defaults on the BORROW loan, the game is over for that LP-
 * and the player walks away with the BORROW principal plus interest and claimed
 * DeFi yield. Staked value and unclaimed yield is sold off by The Reserve for
 * the unpaid BORROW (which is destroyed). The empty LP-NFT returned to the
 * player as a keepsake.
 */
interface ILiquidityForge is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Borrow BORROW against a collateralized LP-SFT
   *
   * @param tokenId The LP-SFT token ID
   * @param amount The amount of BORROW to borrow
   * @param receiver The receiver of the BORROW
   */
  function borrowBorrow(
    uint256 tokenId,
    uint256 amount,
    address receiver
  ) external;

  /**
   * @dev Repay BORROW against a collateralized LP-SFT
   *
   * @param tokenId The LP-SFT ID
   */
  function repayBorrow(uint256 tokenId, uint256 amount) external;
}
