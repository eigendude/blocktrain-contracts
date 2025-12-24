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

import {ITheReserveRoutes} from "../../interfaces/bureaucracy/theReserve/ITheReserveRoutes.sol";
import {ILPNFTStakeFarm} from "../../interfaces/defi/ILPNFTStakeFarm.sol";
import {ILPSFTLendFarm} from "../../interfaces/defi/ILPSFTLendFarm.sol";
import {IUniV3StakeFarm} from "../../interfaces/defi/IUniV3StakeFarm.sol";
import {ILPSFT} from "../../interfaces/token/ERC1155/ILPSFT.sol";
import {INOLPSFT} from "../../interfaces/token/ERC1155/INOLPSFT.sol";
import {IGameTokenPooler} from "../../interfaces/token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../../interfaces/token/routes/IGameTokenSwapper.sol";
import {IMarketStableSwapper} from "../../interfaces/token/routes/IMarketStableSwapper.sol";

/**
 * @title The Reserve Smart Contract, Routing Interface
 */
contract TheReserveRoutes is ITheReserveRoutes {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  ITheReserveRoutes.Routes internal _routes;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes The Reserve, Routes component
   *
   * @param routes_ The routes of The Reserve
   */
  constructor(ITheReserveRoutes.Routes memory routes_) {
    // Initialize routes
    _routes = routes_;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ITheReserveRoutes}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual returns (bool) {
    return interfaceId == type(ITheReserveRoutes).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ITheReserveRoutes}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ITheReserveRoutes-getRoutes}
   */
  function getRoutes() external view override returns (Routes memory) {
    return _routes;
  }

  /**
   * @dev See {ITheReserveRoutes-pow1Token}
   */
  function pow1Token() external view override returns (IERC20) {
    return _routes.pow1Token;
  }

  /**
   * @dev See {ITheReserveRoutes-pow5Token}
   */
  function pow5Token() external view override returns (IERC20) {
    return _routes.pow5Token;
  }

  /**
   * @dev See {ITheReserveRoutes-lpYieldToken}
   */
  function lpYieldToken() external view override returns (IERC20) {
    return _routes.lpYieldToken;
  }

  /**
   * @dev See {ITheReserveRoutes-lpPow5Token}
   */
  function lpPow5Token() external view override returns (IERC20) {
    return _routes.lpPow5Token;
  }

  /**
   * @dev See {ITheReserveRoutes-debtToken}
   */
  function debtToken() external view override returns (IERC20) {
    return _routes.debtToken;
  }

  /**
   * @dev See {ITheReserveRoutes-marketToken}
   */
  function marketToken() external view override returns (IERC20) {
    return _routes.marketToken;
  }

  /**
   * @dev See {ITheReserveRoutes-stableToken}
   */
  function stableToken() external view override returns (IERC20) {
    return _routes.stableToken;
  }

  /**
   * @dev See {ITheReserveRoutes-lpSft}
   */
  function lpSft() external view override returns (ILPSFT) {
    return _routes.lpSft;
  }

  /**
   * @dev See {ITheReserveRoutes-noLpSft}
   */
  function noLpSft() external view override returns (INOLPSFT) {
    return _routes.noLpSft;
  }

  /**
   * @dev See {ITheReserveRoutes-pow1MarketPool}
   */
  function pow1MarketPool() external view override returns (IUniswapV3Pool) {
    return _routes.pow1MarketPool;
  }

  /**
   * @dev See {ITheReserveRoutes-pow5StablePool}
   */
  function pow5StablePool() external view override returns (IUniswapV3Pool) {
    return _routes.pow5StablePool;
  }

  /**
   * @dev See {ITheReserveRoutes-marketStablePool}
   */
  function marketStablePool() external view override returns (IUniswapV3Pool) {
    return _routes.marketStablePool;
  }

  /**
   * @dev See {ITheReserveRoutes-pow1MarketSwapper}
   */
  function pow1MarketSwapper()
    external
    view
    override
    returns (IGameTokenSwapper)
  {
    return _routes.pow1MarketSwapper;
  }

  /**
   * @dev See {ITheReserveRoutes-pow5StableSwapper}
   */
  function pow5StableSwapper()
    external
    view
    override
    returns (IGameTokenSwapper)
  {
    return _routes.pow5StableSwapper;
  }

  /**
   * @dev See {ITheReserveRoutes-marketStableSwapper}
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
   * @dev See {ITheReserveRoutes-pow1MarketPooler}
   */
  function pow1MarketPooler()
    external
    view
    override
    returns (IGameTokenPooler)
  {
    return _routes.pow1MarketPooler;
  }

  /**
   * @dev See {ITheReserveRoutes-pow5StablePooler}
   */
  function pow5StablePooler()
    external
    view
    override
    returns (IGameTokenPooler)
  {
    return _routes.pow5StablePooler;
  }

  /**
   * @dev See {ITheReserveRoutes-pow1LpNftStakeFarm}
   */
  function pow1LpNftStakeFarm()
    external
    view
    override
    returns (ILPNFTStakeFarm)
  {
    return _routes.pow1LpNftStakeFarm;
  }

  /**
   * @dev See {ITheReserveRoutes-pow5LpNftStakeFarm}
   */
  function pow5LpNftStakeFarm()
    external
    view
    override
    returns (IUniV3StakeFarm)
  {
    return _routes.pow5LpNftStakeFarm;
  }

  /**
   * @dev See {ITheReserveRoutes-pow1LpSftLendFarm}
   */
  function pow1LpSftLendFarm() external view override returns (ILPSFTLendFarm) {
    return _routes.pow1LpSftLendFarm;
  }

  /**
   * @dev See {ITheReserveRoutes-pow5LpSftLendFarm}
   */
  function pow5LpSftLendFarm() external view override returns (ILPSFTLendFarm) {
    return _routes.pow5LpSftLendFarm;
  }

  /**
   * @dev See {ITheReserveRoutes-uniswapV3Factory}
   */
  function uniswapV3Factory()
    external
    view
    override
    returns (IUniswapV3Factory)
  {
    return _routes.uniswapV3Factory;
  }

  /**
   * @dev See {ITheReserveRoutes-uniswapV3NftManager}
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
