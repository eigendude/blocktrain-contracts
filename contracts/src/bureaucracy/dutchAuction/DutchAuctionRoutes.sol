/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IUniswapV3Factory} from "../../../interfaces/uniswap-v3-core/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionRoutes} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionRoutes.sol";
import {ITheReserveRoutes} from "../../interfaces/bureaucracy/theReserve/ITheReserveRoutes.sol";
import {ILPNFTStakeFarm} from "../../interfaces/defi/ILPNFTStakeFarm.sol";
import {ILPSFT} from "../../interfaces/token/ERC1155/ILPSFT.sol";
import {IGameTokenPooler} from "../../interfaces/token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../../interfaces/token/routes/IGameTokenSwapper.sol";
import {IMarketStableSwapper} from "../../interfaces/token/routes/IMarketStableSwapper.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuctionRoutes is IDutchAuctionRoutes {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  ITheReserveRoutes.Routes internal _routes;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param theReserveRoutes_ The Reserve smart contract routes
   */
  constructor(ITheReserveRoutes.Routes memory theReserveRoutes_) {
    // Initialize routes
    _routes = theReserveRoutes_;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuctionRoutes}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override returns (bool) {
    return interfaceId == type(IDutchAuctionRoutes).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionRoutes}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionRoutes-yieldToken}
   */
  function yieldToken() external view override returns (IERC20) {
    return _routes.yieldToken;
  }

  /**
   * @dev See {IDutchAuctionRoutes-borrowToken}
   */
  function borrowToken() external view override returns (IERC20) {
    return _routes.borrowToken;
  }

  /**
   * @dev See {IDutchAuctionRoutes-marketToken}
   */
  function marketToken() external view override returns (IERC20) {
    return _routes.marketToken;
  }

  /**
   * @dev See {IDutchAuctionRoutes-stableToken}
   */
  function stableToken() external view override returns (IERC20) {
    return _routes.stableToken;
  }

  /**
   * @dev See {IDutchAuctionRoutes-lpSft}
   */
  function lpSft() external view override returns (ILPSFT) {
    return _routes.lpSft;
  }

  /**
   * @dev See {IDutchAuctionRoutes-yieldMarketPool}
   */
  function yieldMarketPool() external view override returns (IUniswapV3Pool) {
    return _routes.yieldMarketPool;
  }

  /**
   * @dev See {IDutchAuctionRoutes-yieldMarketSwapper}
   */
  function yieldMarketSwapper()
    external
    view
    override
    returns (IGameTokenSwapper)
  {
    return _routes.yieldMarketSwapper;
  }

  /**
   * @dev See {IDutchAuctionRoutes-borrowStableSwapper}
   */
  function borrowStableSwapper()
    external
    view
    override
    returns (IGameTokenSwapper)
  {
    return _routes.borrowStableSwapper;
  }

  /**
   * @dev See {IDutchAuctionRoutes-marketStableSwapper}
   */
  function marketStableSwapper()
    external
    view
    override
    returns (IMarketStableSwapper)
  {
    return _routes.marketStableSwapper;
  }

  /**
   * @dev See {IDutchAuctionRoutes-yieldMarketPooler}
   */
  function yieldMarketPooler()
    external
    view
    override
    returns (IGameTokenPooler)
  {
    return _routes.yieldMarketPooler;
  }

  /**
   * @dev See {IDutchAuctionRoutes-yieldLpNftStakeFarm}
   */
  function yieldLpNftStakeFarm()
    external
    view
    override
    returns (ILPNFTStakeFarm)
  {
    return _routes.yieldLpNftStakeFarm;
  }

  /**
   * @dev See {IDutchAuctionRoutes-uniswapV3NftManager}
   */
  function uniswapV3NftManager()
    external
    view
    override
    returns (INonfungiblePositionManager)
  {
    return _routes.uniswapV3NftManager;
  }
}
