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
import {ILPSFT} from "../../token/ERC1155/ILPSFT.sol";
import {IGameTokenPooler} from "../../token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../../token/routes/IGameTokenSwapper.sol";
import {IMarketStableSwapper} from "../../token/routes/IMarketStableSwapper.sol";

/**
 * @title Bureau of the Dutch Auction, Routing Interface
 *
 * @dev These routes provide read-only access to the various contracts that the
 * Dutch Auction interacts with
 */
interface IDutchAuctionRoutes is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // ERC-20 Token Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The YIELD game token
   */
  function yieldToken() external view returns (IERC20);

  /**
   * @dev The BORROW game token
   */
  function borrowToken() external view returns (IERC20);

  /**
   * @dev The market token paired with YIELD
   */
  function marketToken() external view returns (IERC20);

  /**
   * @dev The stable token paired with BORROW
   */
  function stableToken() external view returns (IERC20);

  //////////////////////////////////////////////////////////////////////////////
  // ERC-1155 Token Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT contract
   */
  function lpSft() external view returns (ILPSFT);

  //////////////////////////////////////////////////////////////////////////////
  // Liquidity Pools
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The YIELD-market liquidity pool
   */
  function yieldMarketPool() external view returns (IUniswapV3Pool);

  //////////////////////////////////////////////////////////////////////////////
  // Token Swappers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The swapper for the YIELD-market token pair
   */
  function yieldMarketSwapper() external view returns (IGameTokenSwapper);

  /**
   * @dev The swapper for the BORROW-stable token pair
   */
  function borrowStableSwapper() external view returns (IGameTokenSwapper);

  /**
   * @dev The swapper for the market-stable token pair
   */
  function marketStableSwapper() external view returns (IMarketStableSwapper);

  //////////////////////////////////////////////////////////////////////////////
  // Token Poolers
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The pooler for the YIELD-market token pair
   */
  function yieldMarketPooler() external view returns (IGameTokenPooler);

  //////////////////////////////////////////////////////////////////////////////
  // LP-NFT Stake Farms
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The YIELD LP-NFT stake farm
   */
  function yieldLpNftStakeFarm() external view returns (ILPNFTStakeFarm);

  //////////////////////////////////////////////////////////////////////////////
  // Uniswap V3 Interfaces
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  function uniswapV3NftManager()
    external
    view
    returns (INonfungiblePositionManager);
}
