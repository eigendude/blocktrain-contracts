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

/**
 * @description Address book interface
 */
interface AddressBook {
  defiManager?: `0x${string}`;
  dutchAuction?: `0x${string}`;
  liquidityForge?: `0x${string}`;
  lpNft?: `0x${string}`;
  lpYieldToken?: `0x${string}`;
  lpBorrowToken?: `0x${string}`;
  lpSft?: `0x${string}`;
  noLpSft?: `0x${string}`;
  debtToken?: `0x${string}`;
  yieldLpNftStakeFarm?: `0x${string}`;
  yieldLpSftLendFarm?: `0x${string}`;
  yieldMarketPool?: `0x${string}`;
  yieldMarketPooler?: `0x${string}`;
  yieldMarketPoolFactory?: `0x${string}`;
  yieldMarketSwapper?: `0x${string}`;
  yieldToken?: `0x${string}`;
  borrowInterestFarm?: `0x${string}`;
  borrowLpNftStakeFarm?: `0x${string}`;
  borrowLpSftLendFarm?: `0x${string}`;
  borrowStablePool?: `0x${string}`;
  borrowStablePooler?: `0x${string}`;
  borrowStablePoolFactory?: `0x${string}`;
  borrowStableSwapper?: `0x${string}`;
  borrowToken?: `0x${string}`;
  reverseRepo?: `0x${string}`;
  testErc1155Enumerable?: `0x${string}`;
  testLiquidityMath?: `0x${string}`;
  testYieldMarketStakerContract?: `0x${string}`;
  testBorrowInterestFarm?: `0x${string}`;
  testBorrowStableStakerContract?: `0x${string}`;
  testRewardMath?: `0x${string}`;
  testStringUtils?: `0x${string}`;
  testTickMath?: `0x${string}`;
  theReserve?: `0x${string}`;
  uniswapV3Factory?: `0x${string}`;
  uniswapV3NftDescriptor?: `0x${string}`;
  uniswapV3NftManager?: `0x${string}`;
  uniswapV3Staker?: `0x${string}`;
  usdcToken?: `0x${string}`;
  wrappedNativeToken?: `0x${string}`;
  wrappedNativeUsdcPool?: `0x${string}`;
  wrappedNativeUsdcSwapper?: `0x${string}`;
  yieldHarvest?: `0x${string}`;
}

export { AddressBook };
