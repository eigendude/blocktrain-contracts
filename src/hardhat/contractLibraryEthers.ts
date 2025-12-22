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

import { ethers } from "ethers";

/**
 * @description Contract library interface using ethers.js version 6
 */
interface ContractLibraryEthers {
  defiManagerContract: ethers.Contract;
  dutchAuctionContract: ethers.Contract;
  liquidityForgeContract: ethers.Contract;
  lpYieldTokenContract: ethers.Contract;
  lpBorrowTokenContract: ethers.Contract;
  lpSftContract: ethers.Contract;
  noLpSftContract: ethers.Contract;
  debtTokenContract: ethers.Contract;
  yieldLpNftStakeFarmContract: ethers.Contract;
  yieldLpSftLendFarmContract: ethers.Contract;
  yieldMarketPoolContract: ethers.Contract;
  yieldMarketPoolerContract: ethers.Contract;
  yieldMarketPoolFactoryContract: ethers.Contract;
  yieldMarketSwapperContract: ethers.Contract;
  yieldTokenContract: ethers.Contract;
  borrowInterestFarmContract: ethers.Contract;
  borrowLpNftStakeFarmContract: ethers.Contract;
  borrowLpSftLendFarmContract: ethers.Contract;
  borrowStablePoolContract: ethers.Contract;
  borrowStablePoolerContract: ethers.Contract;
  borrowStablePoolFactoryContract: ethers.Contract;
  borrowStableSwapperContract: ethers.Contract;
  borrowTokenContract: ethers.Contract;
  reverseRepoContract: ethers.Contract;
  testErc1155EnumerableContract: ethers.Contract;
  testLiquidityMathContract: ethers.Contract;
  testRewardMathContract: ethers.Contract;
  testTickMathContract: ethers.Contract;
  uniswapV3FactoryContract: ethers.Contract;
  uniswapV3NftDescriptorContract: ethers.Contract;
  uniswapV3NftManagerContract: ethers.Contract;
  uniswapV3StakerContract: ethers.Contract;
  usdcTokenContract: ethers.Contract;
  wrappedNativeTokenContract: ethers.Contract;
  wrappedNativeUsdcPoolContract: ethers.Contract;
  wrappedNativeUsdcSwapperContract: ethers.Contract;
  yieldHarvestContract: ethers.Contract;
}

export { ContractLibraryEthers };
