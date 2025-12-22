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
 * @title LP-NFT holder for SFT contract
 */
interface ILPNFTHolder is IERC165, IERC1155 {
  /**
   * @dev Get the token ID of a given address
   *
   * @param tokenAddress The address to convert to a token ID
   *
   * @return The token ID on success, or uint256(0) if `tokenAddress` does not
   * belong to a token ID
   */
  function addressToTokenId(
    address tokenAddress
  ) external view returns (uint256);

  /**
   * @dev Get the token IDs of multiple addresses
   *
   * @param tokenAddresses The addresses to convert to token IDs
   *
   * @return The addresses for the token IDs
   */
  function addressesToTokenIds(
    address[] memory tokenAddresses
  ) external view returns (uint256[] memory);

  /**
   * @dev Get the address for a given token ID
   *
   * @param tokenId The token ID to convert to an address
   *
   * @return The address, or address(0) in case `tokenId` does not belong to
   * an LP-NFT
   */
  function tokenIdToAddress(uint256 tokenId) external view returns (address);

  /**
   * @dev Get the addresses for multiple token IDs
   *
   * @param tokenIds The token IDs to convert to addresses
   *
   * @return The addresses for the token IDs
   */
  function tokenIdsToAddresses(
    uint256[] memory tokenIds
  ) external view returns (address[] memory);
}
