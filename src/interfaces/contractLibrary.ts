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

import { DutchAuctionContract } from "./bureaucracy/dutchAuction/dutchAuctionContract";
import { LiquidityForgeContract } from "./bureaucracy/liquidityForgeContract";
import { ReverseRepoContract } from "./bureaucracy/reverseRepoContract";
import { TheReserveContract } from "./bureaucracy/theReserve/theReserveContract";
import { YieldHarvestContract } from "./bureaucracy/yieldHarvest/yieldHarvestContract";
import { DeFiManagerContract } from "./defi/defiManagerContract";
import { POW5InterestFarmContract } from "./defi/pow5InterestFarmContract";
import { POW5LpNftStakeFarmContract } from "./defi/pow5LpNftStakeFarmContract";
import { POW5LpSftLendFarmContract } from "./defi/pow5LpSftLendFarmContract";
import { YIELDLpNftStakeFarmContract } from "./defi/yieldLpNftStakeFarmContract";
import { YIELDLpSftLendFarmContract } from "./defi/yieldLpSftLendFarmContract";
import { DEBTContract } from "./token/erc20/debtContract";
import { LPBORROWContract } from "./token/erc20/lpBorrowContract";
import { LPYIELDContract } from "./token/erc20/lpYieldContract";
import { POW5Contract } from "./token/erc20/pow5Contract";
import { WrappedNativeContract } from "./token/erc20/wrappedNativeContract";
import { YIELDContract } from "./token/erc20/yieldContract";
import { LPSFTContract } from "./token/erc1155/lpSftContract";
import { NOLPSFTContract } from "./token/erc1155/noLpSftContract";
import { MarketStableSwapperContract } from "./token/routes/marketStableSwapperContract";
import { POW5StablePoolerContract } from "./token/routes/pow5StablePoolerContract";
import { POW5StableSwapperContract } from "./token/routes/pow5StableSwapperContract";
import { YIELDMarketPoolerContract } from "./token/routes/yieldMarketPoolerContract";
import { YIELDMarketSwapperContract } from "./token/routes/yieldMarketSwapperContract";
import { NonfungiblePositionManagerContract } from "./uniswap/nonfungiblePositionManagerContract";
import { UniswapV3PoolContract } from "./uniswap/pool/uniswapV3PoolContract";
import { UniswapV3FactoryContract } from "./uniswap/uniswapV3FactoryContract";
import { ERC20Contract } from "./zeppelin/token/erc20/erc20Contract";

/**
 * @description Contract library interface
 */
interface ContractLibrary {
  defiManagerContract: DeFiManagerContract;
  dutchAuctionContract: DutchAuctionContract;
  liquidityForgeContract: LiquidityForgeContract;
  lpYieldContract: LPYIELDContract;
  lpBorrowContract: LPBORROWContract;
  lpSftContract: LPSFTContract;
  noLpSftContract: NOLPSFTContract;
  debtContract: DEBTContract;
  yieldContract: YIELDContract;
  yieldLpNftStakeFarmContract: YIELDLpNftStakeFarmContract;
  yieldLpSftLendFarmContract: YIELDLpSftLendFarmContract;
  yieldMarketPoolContract: UniswapV3PoolContract;
  yieldMarketPoolerContract: YIELDMarketPoolerContract;
  yieldMarketSwapperContract: YIELDMarketSwapperContract;
  pow5Contract: POW5Contract;
  pow5InterestFarmContract: POW5InterestFarmContract;
  pow5LpNftStakeFarmContract: POW5LpNftStakeFarmContract;
  pow5LpSftLendFarmContract: POW5LpSftLendFarmContract;
  pow5StablePoolContract: UniswapV3PoolContract;
  pow5StablePoolerContract: POW5StablePoolerContract;
  pow5StableSwapperContract: POW5StableSwapperContract;
  reverseRepoContract: ReverseRepoContract;
  theReserveContract: TheReserveContract;
  uniswapV3FactoryContract: UniswapV3FactoryContract;
  uniswapV3NftManagerContract: NonfungiblePositionManagerContract;
  usdcContract: ERC20Contract;
  wrappedNativeContract: WrappedNativeContract;
  wrappedNativeUsdcPoolContract: UniswapV3PoolContract;
  wrappedNativeUsdcSwapperContract: MarketStableSwapperContract;
  yieldHarvestContract: YieldHarvestContract;
}

export { ContractLibrary };
