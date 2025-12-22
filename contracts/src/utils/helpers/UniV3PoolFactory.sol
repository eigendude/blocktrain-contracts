/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IUniswapV3Factory} from "../../../interfaces/uniswap-v3-core/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";

/**
 * @dev Helper contract to create a Uniswap V3 pool using a provided
 * IUniswapV3Factory
 *
 * This is a helper contract for the deployment of dependencies on test
 * networks. The pool is created in the constructor and stored in a member
 * variable so that it can be read back without the deployment system having
 * to store or parse transaction receipts.
 *
 * Note: Because upstream Uniswap sources are mixed with our own, a convention
 * is adopted to distinguish between the two. Uniswap sources are prefixed with
 * "uniswapV3" and our own are prefixed with "uniV3".
 */
contract UniV3PoolFactory {
  /**
   * @dev The address of the pool for this token pair
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Construct the test pool instance
   *
   * @param factory The contract address of the Uniswap V3 factory
   * @param tokenA One of the two tokens in the desired pool
   * @param tokenB The other of the two tokens in the desired pool
   * @param swapFee The fee collected upon every swap in the pool, denominated
   *                in hundredths of a bip
   *
   * The constructor creates a pool for the given two tokens and fee.
   *
   * tokenA and tokenB may be passed in either order: token0/token1 or
   * token1/token0.
   *
   * token0 is taken to be the lower address (see UniswapV3Factory.sol).
   */
  constructor(address factory, address tokenA, address tokenB, uint24 swapFee) {
    // Validate parameters
    require(factory != address(0), "Invalid factory");
    require(tokenA != address(0), "Invalid tokenA");
    require(tokenB != address(0), "Invalid tokenB");

    // Call external contracts
    uniswapV3Pool = IUniswapV3Pool(
      IUniswapV3Factory(factory).createPool(tokenA, tokenB, swapFee)
    );
  }
}
