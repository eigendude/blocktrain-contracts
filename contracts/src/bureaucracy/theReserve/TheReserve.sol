/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {ITheReserve} from "../../interfaces/bureaucracy/theReserve/ITheReserve.sol";

import {TheReserveRoutes} from "./TheReserveRoutes.sol";

/**
 * @title The Reserve Smart Contract
 */
contract TheReserve is ITheReserve, TheReserveRoutes {
  /**
   * @dev Initializes The Reserve
   *
   * @param routes_ The routes of The Reserve
   */
  constructor(ITheReserve.Routes memory routes_) TheReserveRoutes(routes_) {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {TheReserveRoutes} and {ITheReserve}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, TheReserveRoutes) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(ITheReserve).interfaceId;
  }
}
