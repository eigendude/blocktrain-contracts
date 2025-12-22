/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

import {IDutchAuction} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuction.sol";
import {ITheReserveRoutes} from "../../interfaces/bureaucracy/theReserve/ITheReserveRoutes.sol";

import {DutchAuctionActions} from "./DutchAuctionActions.sol";
import {DutchAuctionAdminActions} from "./DutchAuctionAdminActions.sol";
import {DutchAuctionRoutes} from "./DutchAuctionRoutes.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuction is DutchAuctionAdminActions, DutchAuctionActions {
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param owner_ The owner of the Dutch Auction
   * @param theReserve_ The Reserve smart contract
   */
  constructor(
    address owner_,
    address theReserve_
  )
    DutchAuctionAdminActions(owner_)
    DutchAuctionRoutes(ITheReserveRoutes(theReserve_).getRoutes())
  {
    // Initialize auction settings
    _auctionSettings = AuctionSettings({
      priceDecayRate: DECAY_CONSTANT,
      mintDustAmount: 1_000, // TODO
      priceIncrement: GROWTH_RATE,
      initialPriceBips: INITIAL_PRICE_BIPS,
      minPriceBips: MIN_PRICE_BIPS,
      maxPriceBips: MAX_PRICE_BIPS
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuction}, {DutchAuctionAdminActions}
  // and {DutchAuctionActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(DutchAuctionAdminActions, DutchAuctionActions)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
