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
import dutchAuctionAbi from "./contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuction.sol/IDutchAuction.json";
import liquidityForgeAbi from "./contracts/src/interfaces/bureaucracy/ILiquidityForge.sol/ILiquidityForge.json";
import reverseRepoAbi from "./contracts/src/interfaces/bureaucracy/IReverseRepo.sol/IReverseRepo.json";
import yieldHarvestAbi from "./contracts/src/interfaces/bureaucracy/yieldHarvest/IYieldHarvest.sol/IYieldHarvest.json";
import defiManagerAbi from "./contracts/src/interfaces/defi/IDeFiManager.sol/IDeFiManager.json";
import erc20InterestFarmAbi from "./contracts/src/interfaces/defi/IERC20InterestFarm.sol/IERC20InterestFarm.json";
import lpNftStakeFarmAbi from "./contracts/src/interfaces/defi/ILPNFTStakeFarm.sol/ILPNFTStakeFarm.json";
import lpSftLendFarmAbi from "./contracts/src/interfaces/defi/ILPSFTLendFarm.sol/ILPSFTLendFarm.json";
import uniV3StakeFarmAbi from "./contracts/src/interfaces/defi/IUniV3StakeFarm.sol/IUniV3StakeFarm.json";
import lpNftAbi from "./contracts/src/interfaces/token/ERC1155/ILPNFT.sol/ILPNFT.json";
import lpSftAbi from "./contracts/src/interfaces/token/ERC1155/ILPSFT.sol/ILPSFT.json";
import noLpSftAbi from "./contracts/src/interfaces/token/ERC1155/INOLPSFT.sol/INOLPSFT.json";
import gameTokenPoolerAbi from "./contracts/src/interfaces/token/routes/IGameTokenPooler.sol/IGameTokenPooler.json";
import gameTokenSwapperAbi from "./contracts/src/interfaces/token/routes/IGameTokenSwapper.sol/IGameTokenSwapper.json";
import marketStableSwapperAbi from "./contracts/src/interfaces/token/routes/IMarketStableSwapper.sol/IMarketStableSwapper.json";
import lpPow1TokenAbi from "./contracts/src/token/ERC20/LPPOW1.sol/LPPOW1.json";
import lpPow5TokenAbi from "./contracts/src/token/ERC20/LPPOW5.sol/LPPOW5.json";
import noPow5TokenAbi from "./contracts/src/token/ERC20/NOPOW5.sol/NOPOW5.json";
import pow1TokenAbi from "./contracts/src/token/ERC20/POW1.sol/POW1.json";
import pow5TokenAbi from "./contracts/src/token/ERC20/POW5.sol/POW5.json";
import uniV3PoolFactoryAbi from "./contracts/src/utils/helpers/UniV3PoolFactory.sol/UniV3PoolFactory.json";

export {
  defiManagerAbi,
  dutchAuctionAbi,
  erc20InterestFarmAbi,
  gameTokenPoolerAbi,
  gameTokenSwapperAbi,
  liquidityForgeAbi,
  lpNftAbi,
  lpNftStakeFarmAbi,
  lpPow1TokenAbi,
  lpPow5TokenAbi,
  lpSftAbi,
  lpSftLendFarmAbi,
  marketStableSwapperAbi,
  noLpSftAbi,
  noPow5TokenAbi,
  pow1TokenAbi,
  pow5TokenAbi,
  reverseRepoAbi,
  uniV3PoolFactoryAbi,
  uniV3StakeFarmAbi,
  yieldHarvestAbi,
};
