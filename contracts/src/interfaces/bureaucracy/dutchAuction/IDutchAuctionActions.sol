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
 * @title Bureau of the Dutch Auction, Public Action Interface
 */
interface IDutchAuctionActions is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Purchase and stake an LP-NFT at the current auction price
   *
   * If either `yieldAmount` or `marketTokenAmount` are zero, the purchase will
   * be done via single-sided supply; about half of one token is swapped for the
   * other before pooling. If neither are zero, the tokens will be supplied to
   * the pool with no swap, and any unconsumed tokens (due to an imbalance with
   * the current pool price) will be returned to the sender.
   *
   * Upon purchase, the LP-NFT is staked in a stake farm, and an LP-SFT is
   * minted to the receiver.
   *
   * @param lpNftTokenId The LP-NFT token ID to purchase
   * @param yieldAmount The amount of the game token to deposit
   * @param marketTokenAmount The amount of the market token to deposit
   * @param beneficiary The beneficiary of the tip paid as part of the auction
   * @param receiver The receiver of the LP-SFT
   */
  function purchase(
    uint256 lpNftTokenId,
    uint256 yieldAmount,
    uint256 marketTokenAmount,
    address beneficiary,
    address receiver
  ) external;
}
