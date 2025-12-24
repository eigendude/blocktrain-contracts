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
   * @dev The POW1 token contract
   */
  IERC20 public immutable pow1Token;

  /**
   * @dev The POW5 token contract
   */
  IERC20 public immutable pow5Token;

  /**
   * @dev The LPYIELD token contract
   */
  IERC20 public immutable lpYieldToken;

  /**
   * @dev The LPPOW5 token contract
   */
  IERC20 public immutable lpPow5Token;

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
   * @dev Enum for which pool the LP-NFT belongs to, either LPYIELD or LPPOW5
   */
  Pool private _pool = Pool.INVALID;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the LP-NFT template
   *
   * @param pow1Token_ The POW1 token
   * @param pow5Token_ The POW5 token
   * @param lpYieldToken_ The LPYIELD token
   * @param lpPow5Token_ The LPPOW5 token
   * @param debtToken_ The DEBT token
   * @param uniswapV3NftManager_ The Uniswap V3 NFT manager
   */
  constructor(
    address pow1Token_,
    address pow5Token_,
    address lpYieldToken_,
    address lpPow5Token_,
    address debtToken_,
    address uniswapV3NftManager_
  ) {
    // Validate parameters
    require(pow1Token_ != address(0), "Invalid POW1");
    require(pow5Token_ != address(0), "Invalid POW5");
    require(lpYieldToken_ != address(0), "Invalid LPYIELD");
    require(lpPow5Token_ != address(0), "Invalid LPPOW5");
    require(debtToken_ != address(0), "Invalid DEBT");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT mgr");

    // Initialize {Initializable}
    _disableInitializers();

    // Initialize routes
    pow1Token = IERC20(pow1Token_);
    pow5Token = IERC20(pow5Token_);
    lpYieldToken = IERC20(lpYieldToken_);
    lpPow5Token = IERC20(lpPow5Token_);
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
    if (token0 == address(pow1Token) || token1 == address(pow1Token)) {
      _pool = Pool.LPYIELD;
    } else if (token0 == address(pow5Token) || token1 == address(pow5Token)) {
      _pool = Pool.LPPOW5;
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

    // Recover POW1
    uint256 recoveredPow1Balance = pow1Token.balanceOf(address(this));
    if (recoveredPow1Balance > 0) {
      pow1Token.safeTransfer(beneficiary, recoveredPow1Balance);
    }

    // Recover POW5
    uint256 recoveredPow5Balance = pow5Token.balanceOf(address(this));
    if (recoveredPow5Balance > 0) {
      pow5Token.safeTransfer(beneficiary, recoveredPow5Balance);
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
   * @dev See {ILPNFT-pow1Balance}
   */
  function pow1Balance() public view override returns (uint256) {
    // Read external state
    return pow1Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-pow5Balance}
   */
  function pow5Balance() public view override returns (uint256) {
    // Read external state
    return pow5Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-lpYieldBalance}
   */
  function lpYieldBalance() public view override returns (uint256) {
    // Read external state
    return lpYieldToken.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-lpPow5Balance}
   */
  function lpPow5Balance() public view override returns (uint256) {
    // Read external state
    return lpPow5Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-debtBalance}
   */
  function debtBalance() public view override returns (uint256) {
    // Read external state
    return debtToken.balanceOf(address(this));
  }
}
