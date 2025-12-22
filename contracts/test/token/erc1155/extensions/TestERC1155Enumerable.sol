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

import {ERC1155Enumerable} from "../../../../src/token/ERC1155/extensions/ERC1155Enumerable.sol";
import {ERC1155Helpers} from "../../../../src/token/ERC1155/utils/ERC1155Helpers.sol";

/**
 * @title ERC-1155: Multi Token Standard, mintable extension for test purposes
 *
 * @dev Extension of {ERC1155Enumerable} that allows anyone to mint NFTs to
 * arbitrary accounts.
 *
 * FOR TESTING ONLY.
 */
contract TestERC1155Enumerable is ERC1155Enumerable {
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Constructor
   */
  constructor() {
    initialize();
  }

  /**
   * @dev Initializer
   */
  function initialize() public initializer {
    __ERC1155_init("");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Minting interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints a new NFT
   *
   * @param account The account to mint an NFT to
   * @param nftTokenId The token ID of the minted NFT
   */
  function mintNft(address account, uint256 nftTokenId) external {
    // Call ancestor
    _mint(account, nftTokenId, 1, "");
  }

  /**
   * @dev Mints a batch of NFTs
   *
   * @param account The account to mint NFTs to
   * @param nftTokenIds The token IDs of the minted NFTs
   */
  function batchMintNFT(
    address account,
    uint256[] memory nftTokenIds
  ) external {
    // Translate parameters
    uint256[] memory tokenAmounts = ERC1155Helpers.getAmountArray(
      nftTokenIds.length
    );

    // Call ancestor
    _mintBatch(account, nftTokenIds, tokenAmounts, "");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Burning interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Burns an existing NFT
   *
   * @param account The account to burn an NFT from
   * @param nftTokenId The token ID of the NFT to burn
   */
  function burnNft(address account, uint256 nftTokenId) external {
    // Call ancestor
    _burn(account, nftTokenId, 1);
  }

  /**
   * @dev Burns a batch of existing NFTs
   *
   * @param account The account to burn NFTs from
   * @param nftTokenIds The token IDs of the NFTs to burn
   */
  function batchBurnNFT(
    address account,
    uint256[] memory nftTokenIds
  ) external {
    // Translate parameters
    uint256[] memory tokenAmounts = ERC1155Helpers.getAmountArray(
      nftTokenIds.length
    );

    // Call ancestor
    _burnBatch(account, nftTokenIds, tokenAmounts);
  }
}
