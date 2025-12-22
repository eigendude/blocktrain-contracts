/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ILiquidityForge} from "../interfaces/bureaucracy/ILiquidityForge.sol";
import {IYieldHarvest} from "../interfaces/bureaucracy/yieldHarvest/IYieldHarvest.sol";
import {ITheReserve} from "../interfaces/bureaucracy/theReserve/ITheReserve.sol";
import {IDeFiManager} from "../interfaces/defi/IDeFiManager.sol";
import {IERC20InterestFarm} from "../interfaces/defi/IERC20InterestFarm.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IERC1155Enumerable} from "../interfaces/token/ERC1155/extensions/IERC1155Enumerable.sol";

/**
 * @title Bureau of the Liquidity Forge
 */
contract LiquidityForge is Context, ReentrancyGuard, ILiquidityForge {
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Reserve smart contract
   */
  ITheReserve public immutable theReserve;

  /**
   * @dev The LP-SFT token contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The LP-SFT debt contract
   */
  IERC1155Enumerable public immutable noLpSft;

  /**
   * @dev The LP-SFT manager contract
   */
  IDeFiManager public defiManager;

  /**
   * @dev The POW5 token contract
   */
  IERC20 public immutable pow5Token;

  /**
   * @dev The Liquidity Forge contract
   */
  IYieldHarvest public immutable yieldHarvest;

  /**
   * @dev The ERC20 interest farm
   */
  IERC20InterestFarm public immutable erc20InterestFarm;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Liquidity Forge contract
   *
   * @param theReserve_ The Reserve smart contract address
   * @param defiManager_ The LP-SFT manager contract
   * @param yieldHarvest_ The Yield Harvest contract
   * @param erc20InterestFarm_ The ERC20 interest farm
   */
  constructor(
    address theReserve_,
    address defiManager_,
    address yieldHarvest_,
    address erc20InterestFarm_
  ) {
    // Validate parameters
    require(defiManager_ != address(0), "Invalid LP-SFT mgr");
    require(yieldHarvest_ != address(0), "Invalid yield harvest");
    require(erc20InterestFarm_ != address(0), "Invalid interest farm");

    // Initialize routes
    theReserve = ITheReserve(theReserve_);
    lpSft = ILPSFT(ITheReserve(theReserve_).lpSft());
    noLpSft = IERC1155Enumerable(ITheReserve(theReserve_).noLpSft());
    defiManager = IDeFiManager(defiManager_);
    pow5Token = IERC20(ITheReserve(theReserve_).pow5Token());
    yieldHarvest = IYieldHarvest(yieldHarvest_);
    erc20InterestFarm = IERC20InterestFarm(erc20InterestFarm_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ILiquidityForge}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public pure override returns (bool) {
    return interfaceId == type(ILiquidityForge).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ILiquidityForge}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILiquidityForge-borrowPow5}
   */
  function borrowPow5(
    uint256 tokenId,
    uint256 amount,
    address receiver
  ) external override nonReentrant {
    // Validate ownership
    require(noLpSft.ownerOf(tokenId) == _msgSender(), "Not NOLPSFT owner");

    // Get LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate address
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Call external contracts
    erc20InterestFarm.recordLoan(lpSftAddress, amount);
    defiManager.issuePow5(tokenId, amount, receiver);
  }

  /**
   * @dev See {ILiquidityForge-repayPow5}
   */
  function repayPow5(
    uint256 tokenId,
    uint256 amount
  ) external override nonReentrant {
    // Validate ownership
    require(noLpSft.ownerOf(tokenId) == _msgSender(), "Not NOLPSFT owner");

    // Get LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate address
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Call external contracts
    pow5Token.safeTransferFrom(_msgSender(), address(this), amount);
    erc20InterestFarm.recordRepayment(lpSftAddress, amount);
    defiManager.repayPow5(tokenId, amount);
  }
}
