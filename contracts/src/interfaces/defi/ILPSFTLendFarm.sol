/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {IFarm} from "./IFarm.sol";

/**
 * @dev A contract to lend LP-NFTs and earn rewards based on lending duration
 * and liquidity amount
 *
 * Rewards are calculated based on the amount of time and liquidity staked.
 *
 * Rewards are updated on every interaction.
 */
interface ILPSFTLendFarm is IERC165, IFarm {
  //////////////////////////////////////////////////////////////////////////////
  // Public mutators
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Lend an LP-SFT to the pool
   *
   * @param tokenId The LP-SFT token ID
   */
  function lendLpSft(uint256 tokenId) external;

  /**
   * @dev Lend a batch of LP-SFTs to the pool
   *
   * @param tokenIds The LP-SFT token IDs
   */
  function lendLpSftBatch(uint256[] memory tokenIds) external;

  /**
   * @dev Withdraw an LP-SFT from the pool
   *
   * @param tokenId The LP-SFT token ID
   */
  function withdrawLpSft(uint256 tokenId) external;

  /**
   * @dev Withdraw a batch of LP-SFTs from the pool
   *
   * @param tokenIds The LP-SFT token IDs
   */
  function withdrawLpSftBatch(uint256[] memory tokenIds) external;
}
