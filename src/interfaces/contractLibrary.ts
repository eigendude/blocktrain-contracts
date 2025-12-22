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
import { BORROWInterestFarmContract } from "./defi/borrowInterestFarmContract";
import { BORROWLpNftStakeFarmContract } from "./defi/borrowLpNftStakeFarmContract";
import { BORROWLpSftLendFarmContract } from "./defi/borrowLpSftLendFarmContract";
import { DeFiManagerContract } from "./defi/defiManagerContract";
import { YIELDLpNftStakeFarmContract } from "./defi/yieldLpNftStakeFarmContract";
import { YIELDLpSftLendFarmContract } from "./defi/yieldLpSftLendFarmContract";
import { BORROWContract } from "./token/erc20/borrowContract";
import { DEBTContract } from "./token/erc20/debtContract";
import { LPBORROWContract } from "./token/erc20/lpBorrowContract";
import { LPYIELDContract } from "./token/erc20/lpYieldContract";
import { WrappedNativeContract } from "./token/erc20/wrappedNativeContract";
import { YIELDContract } from "./token/erc20/yieldContract";
import { LPSFTContract } from "./token/erc1155/lpSftContract";
import { NOLPSFTContract } from "./token/erc1155/noLpSftContract";
import { BORROWStablePoolerContract } from "./token/routes/borrowStablePoolerContract";
import { BORROWStableSwapperContract } from "./token/routes/borrowStableSwapperContract";
import { MarketStableSwapperContract } from "./token/routes/marketStableSwapperContract";
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
  borrowContract: BORROWContract;
  borrowInterestFarmContract: BORROWInterestFarmContract;
  borrowLpNftStakeFarmContract: BORROWLpNftStakeFarmContract;
  borrowLpSftLendFarmContract: BORROWLpSftLendFarmContract;
  borrowStablePoolContract: UniswapV3PoolContract;
  borrowStablePoolerContract: BORROWStablePoolerContract;
  borrowStableSwapperContract: BORROWStableSwapperContract;
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
