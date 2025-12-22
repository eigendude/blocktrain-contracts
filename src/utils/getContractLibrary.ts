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

import { AddressBook } from "../interfaces/addressBook";
import { DutchAuctionContract } from "../interfaces/bureaucracy/dutchAuction/dutchAuctionContract";
import { LiquidityForgeContract } from "../interfaces/bureaucracy/liquidityForgeContract";
import { ReverseRepoContract } from "../interfaces/bureaucracy/reverseRepoContract";
import { TheReserveContract } from "../interfaces/bureaucracy/theReserve/theReserveContract";
import { YieldHarvestContract } from "../interfaces/bureaucracy/yieldHarvest/yieldHarvestContract";
import { ContractLibrary } from "../interfaces/contractLibrary";
import { BORROWInterestFarmContract } from "../interfaces/defi/borrowInterestFarmContract";
import { BORROWLpNftStakeFarmContract } from "../interfaces/defi/borrowLpNftStakeFarmContract";
import { BORROWLpSftLendFarmContract } from "../interfaces/defi/borrowLpSftLendFarmContract";
import { DeFiManagerContract } from "../interfaces/defi/defiManagerContract";
import { YIELDLpNftStakeFarmContract } from "../interfaces/defi/yieldLpNftStakeFarmContract";
import { YIELDLpSftLendFarmContract } from "../interfaces/defi/yieldLpSftLendFarmContract";
import { BORROWContract } from "../interfaces/token/erc20/borrowContract";
import { DEBTContract } from "../interfaces/token/erc20/debtContract";
import { LPBORROWContract } from "../interfaces/token/erc20/lpBorrowContract";
import { LPYIELDContract } from "../interfaces/token/erc20/lpYieldContract";
import { WrappedNativeContract } from "../interfaces/token/erc20/wrappedNativeContract";
import { YIELDContract } from "../interfaces/token/erc20/yieldContract";
import { LPSFTContract } from "../interfaces/token/erc1155/lpSftContract";
import { NOLPSFTContract } from "../interfaces/token/erc1155/noLpSftContract";
import { BORROWStablePoolerContract } from "../interfaces/token/routes/borrowStablePoolerContract";
import { BORROWStableSwapperContract } from "../interfaces/token/routes/borrowStableSwapperContract";
import { MarketStableSwapperContract } from "../interfaces/token/routes/marketStableSwapperContract";
import { YIELDMarketPoolerContract } from "../interfaces/token/routes/yieldMarketPoolerContract";
import { YIELDMarketSwapperContract } from "../interfaces/token/routes/yieldMarketSwapperContract";
import { NonfungiblePositionManagerContract } from "../interfaces/uniswap/nonfungiblePositionManagerContract";
import { UniswapV3PoolContract } from "../interfaces/uniswap/pool/uniswapV3PoolContract";
import { UniswapV3FactoryContract } from "../interfaces/uniswap/uniswapV3FactoryContract";
import { ERC20Contract } from "../interfaces/zeppelin/token/erc20/erc20Contract";

//
// Utility functions
//

function getContractLibrary(
  signer: ethers.Signer,
  addressBook: AddressBook,
): ContractLibrary {
  return {
    defiManagerContract: new DeFiManagerContract(
      signer,
      addressBook.defiManager!,
    ),
    dutchAuctionContract: new DutchAuctionContract(
      signer,
      addressBook.dutchAuction!,
    ),
    liquidityForgeContract: new LiquidityForgeContract(
      signer,
      addressBook.liquidityForge!,
    ),
    lpYieldContract: new LPYIELDContract(signer, addressBook.lpYieldToken!),
    lpBorrowContract: new LPBORROWContract(signer, addressBook.lpBorrowToken!),
    lpSftContract: new LPSFTContract(signer, addressBook.lpSft!),
    noLpSftContract: new NOLPSFTContract(signer, addressBook.noLpSft!),
    debtContract: new DEBTContract(signer, addressBook.debtToken!),
    yieldContract: new YIELDContract(signer, addressBook.yieldToken!),
    yieldLpNftStakeFarmContract: new YIELDLpNftStakeFarmContract(
      signer,
      addressBook.yieldLpNftStakeFarm!,
    ),
    yieldLpSftLendFarmContract: new YIELDLpSftLendFarmContract(
      signer,
      addressBook.yieldLpSftLendFarm!,
    ),
    yieldMarketPoolContract: new UniswapV3PoolContract(
      signer,
      addressBook.yieldMarketPool!,
    ),
    yieldMarketPoolerContract: new YIELDMarketPoolerContract(
      signer,
      addressBook.yieldMarketPooler!,
    ),
    yieldMarketSwapperContract: new YIELDMarketSwapperContract(
      signer,
      addressBook.yieldMarketSwapper!,
    ),
    borrowContract: new BORROWContract(signer, addressBook.borrowToken!),
    borrowInterestFarmContract: new BORROWInterestFarmContract(
      signer,
      addressBook.borrowInterestFarm!,
    ),
    borrowLpNftStakeFarmContract: new BORROWLpNftStakeFarmContract(
      signer,
      addressBook.borrowLpNftStakeFarm!,
    ),
    borrowLpSftLendFarmContract: new BORROWLpSftLendFarmContract(
      signer,
      addressBook.borrowLpSftLendFarm!,
    ),
    borrowStablePoolContract: new UniswapV3PoolContract(
      signer,
      addressBook.borrowStablePool!,
    ),
    borrowStablePoolerContract: new BORROWStablePoolerContract(
      signer,
      addressBook.borrowStablePooler!,
    ),
    borrowStableSwapperContract: new BORROWStableSwapperContract(
      signer,
      addressBook.borrowStableSwapper!,
    ),
    reverseRepoContract: new ReverseRepoContract(
      signer,
      addressBook.reverseRepo!,
    ),
    theReserveContract: new TheReserveContract(signer, addressBook.theReserve!),
    uniswapV3FactoryContract: new UniswapV3FactoryContract(
      signer,
      addressBook.uniswapV3Factory!,
    ),
    uniswapV3NftManagerContract: new NonfungiblePositionManagerContract(
      signer,
      addressBook.uniswapV3NftManager!,
    ),
    usdcContract: new ERC20Contract(signer, addressBook.usdcToken!),
    wrappedNativeContract: new WrappedNativeContract(
      signer,
      addressBook.wrappedNativeToken!,
    ),
    wrappedNativeUsdcPoolContract: new UniswapV3PoolContract(
      signer,
      addressBook.wrappedNativeUsdcPool!,
    ),
    wrappedNativeUsdcSwapperContract: new MarketStableSwapperContract(
      signer,
      addressBook.wrappedNativeUsdcSwapper!,
    ),
    yieldHarvestContract: new YieldHarvestContract(
      signer,
      addressBook.yieldHarvest!,
    ),
  };
}

export { getContractLibrary };
