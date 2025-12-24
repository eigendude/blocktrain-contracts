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

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev DeFi manager interface
 */
interface IDeFiManager is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The POW1 balance
   */
  function pow1Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The POW1 balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The POW1 balances for all LP-SFTs
   */
  function pow1BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The POW5 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The POW5 balance
   */
  function pow5Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The POW5 balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The POW5 balances for all LP-SFTs
   */
  function pow5BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The LPYIELD balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The LPYIELD balance
   */
  function lpYieldBalance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The LPYIELD balances of multiple LP-SFTs
   *
   * @param tokenIds The tokens ID of the LP-SFTs
   *
   * @return The LPYIELD balances for all LP-SFTs
   */
  function lpYieldBalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The LPBORROW balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The LPBORROW balance
   */
  function lpBorrowBalance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The LPBORROW balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The LPBORROW balances for all LP-SFTs
   */
  function lpBorrowBalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The DEBT balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The DEBT balance
   */
  function debtBalance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The DEBT balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The DEBT balances for all LP-SFTs
   */
  function debtBalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  //////////////////////////////////////////////////////////////////////////////
  // Liquidity Forge functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Issue a POW5 loan using the LP-NFT as collateral
   */
  function issuePow5(
    uint256 tokenId,
    uint256 amount,
    address recipient
  ) external;

  /**
   * @dev Repay a POW5 loan
   */
  function repayPow5(uint256 tokenId, uint256 amount) external;
}
