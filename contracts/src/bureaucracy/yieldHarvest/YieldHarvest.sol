/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ITheReserve} from "../../interfaces/bureaucracy/theReserve/ITheReserve.sol";
import {IYieldHarvest} from "../../interfaces/bureaucracy/yieldHarvest/IYieldHarvest.sol";
import {IDeFiManager} from "../../interfaces/defi/IDeFiManager.sol";
import {ILPSFTLendFarm} from "../../interfaces/defi/ILPSFTLendFarm.sol";
import {ILPSFTIssuable} from "../../interfaces/token/ERC1155/extensions/ILPSFTIssuable.sol";
import {ILPSFT} from "../../interfaces/token/ERC1155/ILPSFT.sol";
import {ERC1155Helpers} from "../../token/ERC1155/utils/ERC1155Helpers.sol";

/**
 * @title Bureau of the Yield Harvest
 */
contract YieldHarvest is Context, ReentrancyGuard, IYieldHarvest {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Reserve smart contract
   */
  ITheReserve public immutable theReserve;

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The LP-SFT debt contract
   */
  ILPSFTIssuable public immutable noLpSft;

  /**
   * @dev The POW1 LP-SFT lend farm
   */
  ILPSFTLendFarm public immutable pow1LpSftLendFarm;

  /**
   * @dev The DeFi interface for LP-SFTs
   */
  IDeFiManager public immutable defiManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Yield Harvest contract
   *
   * @param theReserve_ The address of The Reserve smart contract
   * @param defiManager_ The address of the LP-SFT DeFi manager
   */
  constructor(address theReserve_, address defiManager_) {
    // Validate parameters
    require(theReserve_ != address(0), "Invalid The Reserve");
    require(defiManager_ != address(0), "Invalid DeFi mgr");

    // Initialize routes
    theReserve = ITheReserve(theReserve_);
    lpSft = ITheReserve(theReserve_).lpSft();
    noLpSft = ITheReserve(theReserve_).noLpSft();
    pow1LpSftLendFarm = ITheReserve(theReserve_).pow1LpSftLendFarm();
    defiManager = IDeFiManager(defiManager_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IYieldHarvest}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) external pure override returns (bool) {
    return interfaceId == type(IYieldHarvest).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC1155Receiver} via {IYieldHarvest}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155Receiver-onERC1155Received}
   */
  function onERC1155Received(
    address,
    address from,
    uint256 id,
    uint256 value,
    bytes memory data
  ) external override returns (bytes4) {
    // Validate sender
    require(
      _msgSender() == address(lpSft) || _msgSender() == address(noLpSft),
      "Only (NO)LPSFT accepted"
    );

    // Validate parameters
    require(value == 1, "Only NFTs");
    require(from != address(0), "Invalid sender");

    if (_msgSender() == address(lpSft)) {
      // Call external contracts
      pow1LpSftLendFarm.lendLpSft(id);
      noLpSft.mint(from, id, data);
    } else {
      // Verify no POW5 debt
      require(defiManager.debtBalance(id) == 0, "DEBT must be 0");

      // Call external contracts
      noLpSft.burn(address(this), id);
      pow1LpSftLendFarm.withdrawLpSft(id);
      lpSft.safeTransferFrom(address(this), from, id, 1, data);
    }

    // Satisfy IERC1155Receiver requirement
    return this.onERC1155Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155BatchReceived}
   */
  function onERC1155BatchReceived(
    address,
    address from,
    uint256[] memory ids,
    uint256[] memory values,
    bytes memory data
  ) external override returns (bytes4) {
    // Validate sender
    require(
      _msgSender() == address(lpSft) || _msgSender() == address(noLpSft),
      "Only (NO)LPSFT accepted"
    );

    // Validate parameters
    require(from != address(0), "Invalid sender");
    ERC1155Helpers.checkAmountArray(ids, values);

    if (_msgSender() == address(lpSft)) {
      // Call external contracts
      pow1LpSftLendFarm.lendLpSftBatch(ids);
      noLpSft.mintBatch(from, ids, data);
    } else {
      pow1LpSftLendFarm.withdrawLpSftBatch(ids);
      noLpSft.burnBatch(address(this), ids);
      lpSft.safeBatchTransferFrom(address(this), from, ids, values, data);
    }

    // Satisfy IERC1155Receiver requirement
    return this.onERC1155BatchReceived.selector;
  }
}
