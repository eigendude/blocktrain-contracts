/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the OpenZeppelin project under the MIT license.
 * Copyright (c) 2016-2024 Zeppelin Group Ltd and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title ERC-1155: Multi Token Standard, optional enumeration extension
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-1155
 *
 * This contract is analogous to the OpenZeppelin IERC721Enumerable contract.
 *
 * Implementers must enforce the constraint that all SFTs are NFTs (they are
 * unique with a total supply of 1).
 */
interface IERC1155Enumerable is IERC165, IERC1155 {
  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Error raised if the amount of an NFT is not 1
   *
   * @param tokenId The ID of the NFT token with an invalid amount
   * @param amount The amount of the NFT token
   */
  error ERC1155EnumerableInvalidAmount(uint256 tokenId, uint256 amount);

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Returns the total amount of tokens stored by the contract
   */
  function totalSupply() external view returns (uint256);

  /**
   * @dev Returns the owner of the NFT specified by `tokenId`
   *
   * @param tokenId The ID of the NFT token
   *
   * @return owner The owner of the token, or `address(0)` if the token does
   *               not exist
   */
  function ownerOf(uint256 tokenId) external view returns (address owner);

  /**
   * @dev Return all token IDs owned by account
   *
   * @param account The account to query
   *
   * @return tokenIds The token IDs owned by the account
   */
  function getTokenIds(
    address account
  ) external view returns (uint256[] memory tokenIds);
}
