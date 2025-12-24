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

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IDeFiManager} from "../interfaces/defi/IDeFiManager.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IERC20Issuable} from "../interfaces/token/ERC20/extensions/IERC20Issuable.sol";

/**
 * @title LP-SFT Manager
 *
 * @dev This class is responsible for managing LP-SFT DeFi operations
 */
contract DeFiManager is ReentrancyGuard, AccessControl, IDeFiManager {
  using Arrays for uint256[];

  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  // Only DEFI_OPERATOR_ROLE can perform DeFi operations
  bytes32 public constant DEFI_OPERATOR_ROLE = "DEFI_OPERATOR_ROLE";

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 token
   */
  IERC20 public immutable pow1Token;

  /**
   * @dev The POW5 token
   */
  IERC20Issuable public immutable pow5Token;

  /**
   * @dev The LP POW1 token
   */
  IERC20Issuable public immutable lpYieldToken;

  /**
   * @dev The LP POW5 token
   */
  IERC20Issuable public immutable lpBorrowToken;

  /**
   * @dev The POW5 debt token
   */
  IERC20Issuable public immutable debtToken;

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The borrowers of LP-SFTs
   */
  mapping(uint256 tokenId => address borrower) private _tokenIdToBorrower;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the ERC-1155 contract
   *
   * @param owner_ The owner of the contract
   * @param pow1Token_ The POW1 token
   * @param pow5Token_ The POW5 token
   * @param lpYieldToken_ The LPYIELD token
   * @param lpBorrowToken_ The LPBORROW token
   * @param debtToken_ The POW5 debt token
   * @param lpSft_ The LP-SFT contract
   */
  constructor(
    address owner_,
    address pow1Token_,
    address pow5Token_,
    address lpYieldToken_,
    address lpBorrowToken_,
    address debtToken_,
    address lpSft_
  ) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(pow1Token_ != address(0), "Invalid POW1");
    require(pow5Token_ != address(0), "Invalid POW5");
    require(lpYieldToken_ != address(0), "Invalid LPYIELD");
    require(lpBorrowToken_ != address(0), "Invalid LPBORROW");
    require(debtToken_ != address(0), "Invalid POW5 debt");
    require(lpSft_ != address(0), "Invalid LP-SFT");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    pow1Token = IERC20(pow1Token_);
    pow5Token = IERC20Issuable(pow5Token_);
    lpYieldToken = IERC20Issuable(lpYieldToken_);
    lpBorrowToken = IERC20Issuable(lpBorrowToken_);
    debtToken = IERC20Issuable(debtToken_);
    lpSft = ILPSFT(lpSft_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {IDeFiManager}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(AccessControl, IERC165) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      type(IDeFiManager).interfaceId == interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDeFiManager}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDeFiManager-pow1Balance}
   */
  function pow1Balance(
    uint256 tokenId
  ) external view override returns (uint256) {
    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Read external state
    return pow1Token.balanceOf(lpNftAddress);
  }

  /**
   * @dev See {IDeFiManager-pow1BalanceBatch}
   */
  function pow1BalanceBatch(
    uint256[] memory tokenIds
  ) external view override returns (uint256[] memory) {
    // Return value
    uint256[] memory balances = new uint256[](tokenIds.length);

    // Handle tokens
    for (uint i = 0; i < tokenIds.length; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Read state
      // slither-disable-next-line calls-loop
      address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

      // Validate state
      if (lpNftAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidAddress(lpNftAddress);
      }

      // Update return value
      // slither-disable-next-line calls-loop
      balances[i] = pow1Token.balanceOf(lpNftAddress);
    }

    return balances;
  }

  /**
   * @dev See {IDeFiManager-pow5Balance}
   */
  function pow5Balance(
    uint256 tokenId
  ) external view override returns (uint256) {
    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Read external state
    return pow5Token.balanceOf(lpNftAddress);
  }

  /**
   * @dev See {IDeFiManager-pow5BalanceBatch}
   */
  function pow5BalanceBatch(
    uint256[] memory tokenIds
  ) external view override returns (uint256[] memory) {
    // Return value
    uint256[] memory balances = new uint256[](tokenIds.length);

    // Handle tokens
    for (uint i = 0; i < tokenIds.length; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Read state
      // slither-disable-next-line calls-loop
      address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

      // Validate state
      if (lpNftAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidAddress(lpNftAddress);
      }

      // Update return value
      // slither-disable-next-line calls-loop
      balances[i] = pow5Token.balanceOf(lpNftAddress);
    }

    return balances;
  }

  /**
   * @dev See {IDeFiManager-lpYieldBalance}
   */
  function lpYieldBalance(
    uint256 tokenId
  ) external view override returns (uint256) {
    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Read external state
    return lpYieldToken.balanceOf(lpNftAddress);
  }

  /**
   * @dev See {IDeFiManager-lpYieldBalanceBatch}
   */
  function lpYieldBalanceBatch(
    uint256[] memory tokenIds
  ) external view override returns (uint256[] memory) {
    // Return value
    uint256[] memory balances = new uint256[](tokenIds.length);

    // Handle tokens
    for (uint i = 0; i < tokenIds.length; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Read state
      // slither-disable-next-line calls-loop
      address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

      // Validate state
      if (lpNftAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidAddress(lpNftAddress);
      }

      // Update return value
      // slither-disable-next-line calls-loop
      balances[i] = lpYieldToken.balanceOf(lpNftAddress);
    }

    return balances;
  }

  /**
   * @dev See {IDeFiManager-lpBorrowBalance}
   */
  function lpBorrowBalance(
    uint256 tokenId
  ) external view override returns (uint256) {
    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Read external state
    return lpBorrowToken.balanceOf(lpNftAddress);
  }

  /**
   * @dev See {IDeFiManager-lpBorrowBalanceBatch}
   */
  function lpBorrowBalanceBatch(
    uint256[] memory tokenIds
  ) external view override returns (uint256[] memory) {
    // Return value
    uint256[] memory balances = new uint256[](tokenIds.length);

    // Handle tokens
    for (uint i = 0; i < tokenIds.length; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Read state
      // slither-disable-next-line calls-loop
      address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

      // Validate state
      if (lpNftAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidAddress(lpNftAddress);
      }

      // Update return value
      // slither-disable-next-line calls-loop
      balances[i] = lpBorrowToken.balanceOf(lpNftAddress);
    }

    return balances;
  }

  /**
   * @dev See {IDeFiManager-debtBalance}
   */
  function debtBalance(
    uint256 tokenId
  ) external view override returns (uint256) {
    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Read external state
    return debtToken.balanceOf(lpNftAddress);
  }

  /**
   * @dev See {IDeFiManager-debtBalanceBatch}
   */
  function debtBalanceBatch(
    uint256[] memory tokenIds
  ) external view override returns (uint256[] memory) {
    // Return value
    uint256[] memory balances = new uint256[](tokenIds.length);

    // Handle tokens
    for (uint i = 0; i < tokenIds.length; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Read state
      // slither-disable-next-line calls-loop
      address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

      // Validate state
      if (lpNftAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidAddress(lpNftAddress);
      }

      // Update return value
      // slither-disable-next-line calls-loop
      balances[i] = debtToken.balanceOf(lpNftAddress);
    }

    return balances;
  }

  /**
   * @dev See {IDeFiManager-issuePow5}
   */
  function issuePow5(
    uint256 tokenId,
    uint256 amount,
    address recipient
  ) external override nonReentrant {
    // Validate access
    _checkRole(DEFI_OPERATOR_ROLE);

    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Read DeFi state
    uint256 lpYieldBalance_ = lpYieldToken.balanceOf(lpNftAddress);
    uint256 debtBalance_ = debtToken.balanceOf(lpNftAddress);

    // Calculate new DeFi state
    uint256 newNoPow5Balance = debtBalance_ + amount;

    // Verify new collateralization ratio is below the threshold
    require(newNoPow5Balance <= lpYieldBalance_, "Insufficent collateral");

    // Call external contracts
    pow5Token.mint(recipient, amount);
    debtToken.mint(lpNftAddress, amount);
  }

  /**
   * @dev See {IDeFiManager-repayPow5}
   */
  function repayPow5(
    uint256 tokenId,
    uint256 amount
  ) external override nonReentrant {
    // Validate access
    _checkRole(DEFI_OPERATOR_ROLE);

    // Read state
    address lpNftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate state
    if (lpNftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Update state
    pow5Token.burn(_msgSender(), amount);
    debtToken.burn(lpNftAddress, amount);
  }
}
