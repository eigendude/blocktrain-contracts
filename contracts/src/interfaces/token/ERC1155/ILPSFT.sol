/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {IERC1155Enumerable} from "./extensions/IERC1155Enumerable.sol";
import {ILPSFTIssuable} from "./extensions/ILPSFTIssuable.sol";
import {ILPNFTHolder} from "./extensions/ILPNFTHolder.sol";

/**
 * @dev LP-SFT interface
 */
interface ILPSFT is IERC165, IERC1155Enumerable, ILPSFTIssuable, ILPNFTHolder {
  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Error raised if a token doesn't exist
   *
   * @param tokenId The token ID that doesn't exist
   */
  error LPSFTInvalidToken(uint256 tokenId);

  /**
   * @dev Error raised if a token address doesn't belong to a token ID
   */
  error LPSFTInvalidAddress(address tokenAddress);

  /**
   * @dev Indicates an array of length zero was passed for token IDs
   *
   * Used to avoid unnecessary transactions.
   */
  error LPSFTEmptyArray();
}
