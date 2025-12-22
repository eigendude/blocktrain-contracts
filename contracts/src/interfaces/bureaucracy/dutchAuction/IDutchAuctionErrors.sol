/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

/**
 * @title Bureau of the Dutch Auction, Error Interface
 *
 * @dev This includes errors for both public actions and admin actions
 */
interface IDutchAuctionErrors {
  //////////////////////////////////////////////////////////////////////////////
  // Admin Errors
  //////////////////////////////////////////////////////////////////////////////

  error DutchAuctionNotInitialized();

  error DutchAuctionAlreadyInitialized();

  //////////////////////////////////////////////////////////////////////////////
  // Public Errors
  //////////////////////////////////////////////////////////////////////////////

  error AuctionNotEnabled(uint256 slot);
}
