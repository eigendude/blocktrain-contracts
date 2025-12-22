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

import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import {INOLPSFT} from "../../interfaces/token/ERC1155/INOLPSFT.sol";

import {ERC1155Enumerable} from "./extensions/ERC1155Enumerable.sol";
import {LPSFTIssuable} from "./extensions/LPSFTIssuable.sol";
import {ERC1155Helpers} from "./utils/ERC1155Helpers.sol";

/**
 * @title ERC-1155: Multi Token Standard implementation
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-1155
 */
contract NOLPSFT is INOLPSFT, ERC1155Enumerable, LPSFTIssuable {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT contract
   */
  IERC1155MetadataURI public lpSft;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Constructor
   */
  constructor(address owner_, address lpSft_) {
    initialize(owner_, lpSft_);
  }

  /**
   * @dev Initializes the ERC-1155 contract
   *
   * @param owner_ The owner of the ERC-1155 contract
   * @param lpSft_ The LP-SFT contract
   */
  function initialize(address owner_, address lpSft_) public initializer {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(lpSft_ != address(0), "Invalid LP-SFT");

    // Initialize {AccessControl} via {LPSFTIssuable}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    lpSft = IERC1155MetadataURI(lpSft_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {INOLPSFT}, {ERC1155Enumerable} and
  // {LPSFTIssuable}
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
    override(IERC165, ERC1155Enumerable, LPSFTIssuable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC1155MetadataURI} via {ERC1155Enumerable} and
  // {LSFTIssuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155MetadataURI-uri}
   */
  function uri(
    uint256 id
  ) public view virtual override returns (string memory) {
    // Read state
    return lpSft.uri(id);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC1155Upgradeable} via {ERC1155Enumerable} and
  // {LPSFTIssuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC1155-_update}
   */
  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal virtual override(ERC1155Upgradeable, ERC1155Enumerable) {
    // Validate parameters
    ERC1155Helpers.checkAmountArray(ids, values);
    ERC1155Helpers.checkBatchSize(ids);

    // Call ancestors
    super._update(from, to, ids, values);
  }
}
