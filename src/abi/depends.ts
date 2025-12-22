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

// Contract ABIs
import erc20Abi from "./@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import wrappedNativeTokenAbi from "./contracts/depends/canonical-weth/WETH9.sol/WETH9.json";
import uniswapV3FactoryAbi from "./contracts/depends/uniswap-v3-core/UniswapV3Factory.sol/UniswapV3Factory.json";
import uniswapV3PoolAbi from "./contracts/depends/uniswap-v3-core/UniswapV3Pool.sol/UniswapV3Pool.json";
import uniswapV3NftManagerAbi from "./contracts/depends/uniswap-v3-periphery/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import uniswapV3NftDescriptorAbi from "./contracts/depends/uniswap-v3-periphery/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json";
import uniswapV3StakerAbi from "./contracts/depends/uniswap-v3-staker/UniswapV3Staker.sol/UniswapV3Staker.json";

export {
  erc20Abi,
  uniswapV3FactoryAbi,
  uniswapV3NftDescriptorAbi,
  uniswapV3NftManagerAbi,
  uniswapV3PoolAbi,
  uniswapV3StakerAbi,
  wrappedNativeTokenAbi,
};
