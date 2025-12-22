/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev LP-SFT issuable extension for LP-SFT minting and burning
 */
interface ILPSFTIssuable is IERC165, IERC1155 {
  //////////////////////////////////////////////////////////////////////////////
  // Issuable interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints a new LP-SFT
   *
   * @param to The account receiving the minted LP-SFT
   * @param sftTokenId The token ID of the minted LP-SFT
   * @param data Extra data passed to the receiver contract
   */
  function mint(address to, uint256 sftTokenId, bytes memory data) external;

  /**
   * @dev Mints a batch of LP-SFTs
   *
   * @param to The account receiving the minted LP-SFT
   * @param sftTokenIds The token IDs of the minted SFTs
   * @param data Extra data passed to the receiver contract
   *
   * Note: This function does not place a limit on the number of LP-SFTs that
   * can be minted in a single transaction. The number of LP-SFTs to mint can
   * exceed the block gas limit, denying the transaction from completing.
   */
  function mintBatch(
    address to,
    uint256[] memory sftTokenIds,
    bytes memory data
  ) external;

  /**
   * @dev Burns an existing LP-SFT
   *
   * @param from The account to burn an LP-SFT from
   * @param sftTokenId The token ID of the LP-SFT to burn
   */
  function burn(address from, uint256 sftTokenId) external;

  /**
   * @dev Burns a batch of existing LP-SFTs
   *
   * @param from The account to burn LP-SFTs from
   * @param sftTokenIds The token IDs of the LP-SFTs to burn
   *
   * Note: This function does not place a limit on the number of LP-SFTs that
   * can be burned in a single transaction. The number of LP-SFTs to burn can
   * exceed the block gas limit, denying the transaction from completing.
   */
  function burnBatch(address from, uint256[] memory sftTokenIds) external;
}
