/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFT} from "../../interfaces/token/ERC1155/ILPNFT.sol";

/**
 * @title LP-NFT: Liquidity Pool Non-Fungible Token
 */
contract LPNFT is ILPNFT, Initializable, AccessControl {
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The YIELD token contract
   */
  IERC20 public immutable yieldToken;

  /**
   * @dev The BORROW token contract
   */
  IERC20 public immutable borrowToken;

  /**
   * @dev The LPYIELD token contract
   */
  IERC20 public immutable lpYieldToken;

  /**
   * @dev The LPBORROW token contract
   */
  IERC20 public immutable lpBorrowToken;

  /**
   * @dev The DEBT token contract
   */
  IERC20 public immutable debtToken;

  /**
   * @dev The Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-NFT's token ID
   */
  uint256 private _tokenId = 0;

  /**
   * @dev Enum for which pool the LP-NFT belongs to, either LPYIELD or LPBORROW
   */
  Pool private _pool = Pool.INVALID;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the LP-NFT template
   *
   * @param yieldToken_ The YIELD token
   * @param borrowToken_ The BORROW token
   * @param lpYieldToken_ The LPYIELD token
   * @param lpBorrowToken_ The LPBORROW token
   * @param debtToken_ The DEBT token
   * @param uniswapV3NftManager_ The Uniswap V3 NFT manager
   */
  constructor(
    address yieldToken_,
    address borrowToken_,
    address lpYieldToken_,
    address lpBorrowToken_,
    address debtToken_,
    address uniswapV3NftManager_
  ) {
    // Validate parameters
    require(yieldToken_ != address(0), "Invalid YIELD");
    require(borrowToken_ != address(0), "Invalid BORROW");
    require(lpYieldToken_ != address(0), "Invalid LPYIELD");
    require(lpBorrowToken_ != address(0), "Invalid LPBORROW");
    require(debtToken_ != address(0), "Invalid DEBT");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT mgr");

    // Initialize {Initializable}
    _disableInitializers();

    // Initialize routes
    yieldToken = IERC20(yieldToken_);
    borrowToken = IERC20(borrowToken_);
    lpYieldToken = IERC20(lpYieldToken_);
    lpBorrowToken = IERC20(lpBorrowToken_);
    debtToken = IERC20(debtToken_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {ILPNFT}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(AccessControl, IERC165) returns (bool) {
    return
      AccessControl.supportsInterface(interfaceId) ||
      interfaceId == type(ILPNFT).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ILPNFT}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILPNFT-initialize}
   */
  function initialize(uint256 lpNftTokenId) public override initializer {
    // Validate parameters
    if (lpNftTokenId == 0) {
      revert LPNFTInvalidTokenID();
    }

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());

    // Update state
    _tokenId = lpNftTokenId;

    // Determine the pool
    address token0;
    address token1;
    // slither-disable-next-line unused-return
    (, , token0, token1, , , , , , , , ) = uniswapV3NftManager.positions(
      lpNftTokenId
    );

    // Update state
    if (token0 == address(yieldToken) || token1 == address(yieldToken)) {
      _pool = Pool.LPYIELD;
    } else if (
      token0 == address(borrowToken) || token1 == address(borrowToken)
    ) {
      _pool = Pool.LPBORROW;
    } else {
      revert LPNFTInvalidPool(lpNftTokenId);
    }
  }

  /**
   * @dev See {ILPNFT-deinitialize}
   */
  function deinitialize(address beneficiary) public override {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(beneficiary != address(0), "Invalid beneficiary");

    // Validate state
    if (_tokenId == 0) {
      revert LPNFTInvalidTokenID();
    }
    if (_pool == Pool.INVALID) {
      revert LPNFTInvalidPool(_tokenId);
    }

    // Update state
    _tokenId = 0;
    _pool = Pool.INVALID;

    // Recover ETH
    uint256 ethBalance = address(this).balance;
    if (ethBalance > 0) {
      // slither-disable-next-line arbitrary-send-eth
      payable(beneficiary).transfer(ethBalance);
    }

    // Recover YIELD
    uint256 recoveredYieldBalance = yieldToken.balanceOf(address(this));
    if (recoveredYieldBalance > 0) {
      yieldToken.safeTransfer(beneficiary, recoveredYieldBalance);
    }

    // Recover BORROW
    uint256 recoveredBorrowBalance = borrowToken.balanceOf(address(this));
    if (recoveredBorrowBalance > 0) {
      borrowToken.safeTransfer(beneficiary, recoveredBorrowBalance);
    }

    // Deinitialize {AccessControl}
    _revokeRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  /**
   * @dev See {ILPNFT-tokenId}
   */
  function tokenId() public view override returns (uint256) {
    // Read state
    return _tokenId;
  }

  /**
   * @dev See {ILPNFT-uri}
   */
  function uri() public view override returns (string memory) {
    // Validate state
    if (_tokenId == 0) {
      revert LPNFTInvalidTokenID();
    }

    // Read external state
    return uniswapV3NftManager.tokenURI(_tokenId);
  }

  /**
   * @dev See {ILPNFT-pool}
   */
  function pool() public view override returns (Pool) {
    // Read state
    return _pool;
  }

  /**
   * @dev See {ILPNFT-yieldBalance}
   */
  function yieldBalance() public view override returns (uint256) {
    // Read external state
    return yieldToken.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-borrowBalance}
   */
  function borrowBalance() public view override returns (uint256) {
    // Read external state
    return borrowToken.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-lpYieldBalance}
   */
  function lpYieldBalance() public view override returns (uint256) {
    // Read external state
    return lpYieldToken.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-lpBorrowBalance}
   */
  function lpBorrowBalance() public view override returns (uint256) {
    // Read external state
    return lpBorrowToken.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-debtBalance}
   */
  function debtBalance() public view override returns (uint256) {
    // Read external state
    return debtToken.balanceOf(address(this));
  }
}
