/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IUniswapV3Factory} from "../../../../interfaces/uniswap-v3-core/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "../../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFTStakeFarm} from "../../defi/ILPNFTStakeFarm.sol";
import {ILPSFTLendFarm} from "../../defi/ILPSFTLendFarm.sol";
import {IUniV3StakeFarm} from "../../defi/IUniV3StakeFarm.sol";
import {ILPSFT} from "../../token/ERC1155/ILPSFT.sol";
import {INOLPSFT} from "../../token/ERC1155/INOLPSFT.sol";
import {IGameTokenPooler} from "../../token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../../token/routes/IGameTokenSwapper.sol";
import {IMarketStableSwapper} from "../../token/routes/IMarketStableSwapper.sol";

/**
 * @title The Reserve Smart Contract, Routing Interface
 *
 * @dev These routes provide access to the contracts that The Reserve's various
 * bureaus interact with
 */
interface ITheReserveRoutes is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Types
  //////////////////////////////////////////////////////////////////////////////

  struct Routes {
    IERC20 pow1Token;
    IERC20 pow5Token;
    IERC20 lpPow1Token;
    IERC20 lpPow5Token;
    IERC20 debtToken;
    IERC20 marketToken;
    IERC20 stableToken;
    ILPSFT lpSft;
    INOLPSFT noLpSft;
    IUniswapV3Pool pow1MarketPool;
    IUniswapV3Pool pow5StablePool;
    IUniswapV3Pool marketStablePool;
    IGameTokenSwapper pow1MarketSwapper;
    IGameTokenSwapper pow5StableSwapper;
    IMarketStableSwapper marketStableSwapper;
    IGameTokenPooler pow1MarketPooler;
    IGameTokenPooler pow5StablePooler;
    ILPNFTStakeFarm pow1LpNftStakeFarm;
    IUniV3StakeFarm pow5LpNftStakeFarm;
    ILPSFTLendFarm pow1LpSftLendFarm;
    ILPSFTLendFarm pow5LpSftLendFarm;
    IUniswapV3Factory uniswapV3Factory;
    INonfungiblePositionManager uniswapV3NftManager;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Route Accessors
  //////////////////////////////////////////////////////////////////////////////

  function getRoutes() external view returns (Routes memory);

  //////////////////////////////////////////////////////////////////////////////
  // ERC-20 Token Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 game token
   */
  function pow1Token() external view returns (IERC20);

  /**
   * @dev The POW5 game token
   */
  function pow5Token() external view returns (IERC20);

  /**
   * @dev The LPPOW1 liquidity token
   */
  function lpPow1Token() external view returns (IERC20);

  /**
   * @dev The LPPOW5 liquidity token
   */
  function lpPow5Token() external view returns (IERC20);

  /**
   * @dev The DEBT debt token
   */
  function debtToken() external view returns (IERC20);

  /**
   * @dev The market token paired with POW1
   */
  function marketToken() external view returns (IERC20);

  /**
   * @dev The stable token paired with POW5
   */
  function stableToken() external view returns (IERC20);

  //////////////////////////////////////////////////////////////////////////////
  // ERC-1155 Token Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT contract
   */
  function lpSft() external view returns (ILPSFT);

  /**
   * @dev The LP-SFT debt contract
   */
  function noLpSft() external view returns (INOLPSFT);

  //////////////////////////////////////////////////////////////////////////////
  // Liquidity Pools
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1-market liquidity pool
   */
  function pow1MarketPool() external view returns (IUniswapV3Pool);

  /**
   * @dev The POW5-stable liquidity pool
   */
  function pow5StablePool() external view returns (IUniswapV3Pool);

  /**
   * @dev The market-stable liquidity pool
   */
  function marketStablePool() external view returns (IUniswapV3Pool);

  //////////////////////////////////////////////////////////////////////////////
  // Token Swappers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The swapper for the POW1-market token pair
   */
  function pow1MarketSwapper() external view returns (IGameTokenSwapper);

  /**
   * @dev The swapper for the POW5-stable token pair
   */
  function pow5StableSwapper() external view returns (IGameTokenSwapper);

  /**
   * @dev The swapper for the market-stable token pair
   */
  function marketStableSwapper() external view returns (IMarketStableSwapper);

  //////////////////////////////////////////////////////////////////////////////
  // Token Poolers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The pooler for the POW1-market token pair
   */
  function pow1MarketPooler() external view returns (IGameTokenPooler);

  /**
   * @dev The pooler for the POW5-stable token pair
   */
  function pow5StablePooler() external view returns (IGameTokenPooler);

  //////////////////////////////////////////////////////////////////////////////
  // LP-NFT Stake Farms
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 LP-NFT stake farm
   */
  function pow1LpNftStakeFarm() external view returns (ILPNFTStakeFarm);

  /**
   * @dev The POW5 LP-NFT stake farm
   */
  function pow5LpNftStakeFarm() external view returns (IUniV3StakeFarm);

  //////////////////////////////////////////////////////////////////////////////
  // LP-SFT Lend Farms
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 LP-SFT lend farm
   */
  function pow1LpSftLendFarm() external view returns (ILPSFTLendFarm);

  /**
   * @dev The POW5 LP-SFT lend farm
   */
  function pow5LpSftLendFarm() external view returns (ILPSFTLendFarm);

  //////////////////////////////////////////////////////////////////////////////
  // Uniswap V3 Interfaces
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The upstream Uniswap V3 factory used to create the liquidity pools
   */
  function uniswapV3Factory() external view returns (IUniswapV3Factory);

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  function uniswapV3NftManager()
    external
    view
    returns (INonfungiblePositionManager);
}
