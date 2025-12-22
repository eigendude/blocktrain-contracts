/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev A contract to stake Uniswap V3 LP-NFTs with concentrated liquidity
 */
interface IUniV3StakeFarm is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Uniswap V3 staker incentive
   *
   * @param rewardAmount The reward to distribute in the incentive
   *
   * TODO: Allow creating multiple incentives?
   */
  function createIncentive(uint256 rewardAmount) external;

  /**
   * @dev Checks if the Uniswap V3 staker incentive has been initialized
   *
   * @return True if the incentive has been initialized, false otherwise
   */
  function isInitialized() external view returns (bool);

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Enter a staked position
   *
   * The LP-NFT is transferred to the staker. An LP-SFT is minted and returned
   * to the recipient.
   *
   * @param tokenId The token ID of the LP-NFT
   */
  function enter(uint256 tokenId) external;

  /**
   * @dev Exit a staked position
   *
   * All tokens and rewards will be returned to the sender. The empty LP-NFT
   * is also returned to the sender as a keepsake.
   *
   * @param tokenId The token ID of the LP-NFT/LP-SFT
   */
  function exit(uint256 tokenId) external;
}
