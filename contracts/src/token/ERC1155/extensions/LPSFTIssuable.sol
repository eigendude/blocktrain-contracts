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

import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import {ILPSFTIssuable} from "../../../interfaces/token/ERC1155/extensions/ILPSFTIssuable.sol";
import {ILPSFT} from "../../../interfaces/token/ERC1155/ILPSFT.sol";

import {ERC1155Helpers} from "../utils/ERC1155Helpers.sol";

import {ERC1155NonReentrant} from "./ERC1155NonReentrant.sol";

/**
 * @title LP-SFT issuable extension for LP-SFT minting and burning
 */
abstract contract LPSFTIssuable is
  ILPSFTIssuable,
  AccessControlUpgradeable,
  ERC1155NonReentrant
{
  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  // Only LPSFT_ISSUER_ROLE can mint and destroy tokens
  bytes32 public constant LPSFT_ISSUER_ROLE = "LPSFT_ISSUER_ROLE";

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl}, {ERC1155NonReentrant} and
  // {ILPSFTIssuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(IERC165, AccessControlUpgradeable, ERC1155Upgradeable)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(ILPSFTIssuable).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ILPSFTIssuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILPSFTIssuable-mint}
   */
  function mint(
    address to,
    uint256 sftTokenId,
    bytes memory data
  ) external nonReentrantLPSFTIssuable {
    // Validate access
    _checkRole(LPSFT_ISSUER_ROLE);

    // Validate parameters
    if (to == address(0)) {
      revert IERC1155Errors.ERC1155InvalidReceiver(to);
    }

    // Call ancestor
    _mint(to, sftTokenId, 1, data);
  }

  /**
   * @dev See {ILPSFTIssuable-mintBatch}
   */
  function mintBatch(
    address to,
    uint256[] memory sftTokenIds,
    bytes memory data
  ) external nonReentrantLPSFTIssuable {
    // Validate access
    _checkRole(LPSFT_ISSUER_ROLE);

    // Validate parameters
    if (to == address(0)) {
      revert IERC1155Errors.ERC1155InvalidReceiver(to);
    }
    if (sftTokenIds.length == 0) {
      revert ILPSFT.LPSFTEmptyArray();
    }

    // Translate parameters
    uint256[] memory tokenAmounts = ERC1155Helpers.getAmountArray(
      sftTokenIds.length
    );

    // Call ancestor
    _mintBatch(to, sftTokenIds, tokenAmounts, data);
  }

  /**
   * @dev See {ILPSFTIssuable-burn}
   */
  function burn(
    address from,
    uint256 sftTokenId
  ) external nonReentrantLPSFTIssuable {
    // Validate access
    _checkRole(LPSFT_ISSUER_ROLE);

    // Validate parameters
    if (from == address(0)) {
      revert IERC1155Errors.ERC1155InvalidSender(address(0));
    }

    // Call ancestor
    _burn(from, sftTokenId, 1);
  }

  /**
   * @dev See {ILPSFTIssuable-burnBatch}
   */
  function burnBatch(
    address from,
    uint256[] memory sftTokenIds
  ) external nonReentrantLPSFTIssuable {
    // Validate access
    _checkRole(LPSFT_ISSUER_ROLE);

    // Validate parameters
    if (from == address(0)) {
      revert IERC1155Errors.ERC1155InvalidSender(address(0));
    }
    if (sftTokenIds.length == 0) {
      revert ILPSFT.LPSFTEmptyArray();
    }

    // Translate parameters
    uint256[] memory tokenAmounts = ERC1155Helpers.getAmountArray(
      sftTokenIds.length
    );

    // Call ancestor
    _burnBatch(from, sftTokenIds, tokenAmounts);
  }
}
