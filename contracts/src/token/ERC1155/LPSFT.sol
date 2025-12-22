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

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFT} from "../../interfaces/token/ERC1155/ILPNFT.sol";
import {ILPSFT} from "../../interfaces/token/ERC1155/ILPSFT.sol";
import {IERC20Issuable} from "../../interfaces/token/ERC20/extensions/IERC20Issuable.sol";

import {ERC1155Enumerable} from "./extensions/ERC1155Enumerable.sol";
import {LPNFTHolder} from "./extensions/LPNFTHolder.sol";
import {LPSFTIssuable} from "./extensions/LPSFTIssuable.sol";
import {ERC1155Helpers} from "./utils/ERC1155Helpers.sol";

/**
 * @title ERC-1155: Multi Token Standard implementation
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-1155
 */
contract LPSFT is ILPSFT, ERC1155Enumerable, LPNFTHolder, LPSFTIssuable {
  using Arrays for uint256[];
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The YIELD token
   */
  IERC20 public yieldToken;

  /**
   * @dev The BORROW token
   */
  IERC20 public borrowToken;

  /**
   * @dev The LP YIELD token
   */
  IERC20Issuable public lpYieldToken;

  /**
   * @dev The LP BORROW token
   */
  IERC20Issuable public lpBorrowToken;

  /**
   * @dev The Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Constructor
   */
  constructor(
    address owner_,
    address lpNftTemplate_,
    address yieldToken_,
    address borrowToken_,
    address lpYieldToken_,
    address lpBorrowToken_,
    address uniswapV3NftManager_
  ) {
    initialize(
      owner_,
      lpNftTemplate_,
      yieldToken_,
      borrowToken_,
      lpYieldToken_,
      lpBorrowToken_,
      uniswapV3NftManager_
    );
  }

  /**
   * @dev Initializes the ERC-1155 contract
   *
   * @param owner_ The owner of the ERC-1155 contract
   * @param lpNftTemplate_ The LP-NFT contract used for clones
   * @param yieldToken_ The YIELD token
   * @param borrowToken_ The BORROW token
   * @param lpYieldToken_ The LPYIELD token
   * @param lpBorrowToken_ The LPBORROW token
   * @param uniswapV3NftManager_ The Uniswap V3 NFT manager
   */
  function initialize(
    address owner_,
    address lpNftTemplate_,
    address yieldToken_,
    address borrowToken_,
    address lpYieldToken_,
    address lpBorrowToken_,
    address uniswapV3NftManager_
  ) public initializer {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(lpNftTemplate_ != address(0), "Invalid LPNFT");
    require(yieldToken_ != address(0), "Invalid YIELD");
    require(borrowToken_ != address(0), "Invalid BORROW");
    require(lpYieldToken_ != address(0), "Invalid LPYIELD");
    require(lpBorrowToken_ != address(0), "Invalid LPBORROW");
    require(
      uniswapV3NftManager_ != address(0),
      "Invalid Uniswap V3 NFT manager"
    );

    // Initialize ancestors
    __AccessControl_init();
    __ERC1155_init("");
    __LPNFTHolder_init(lpNftTemplate_);

    // Initialize {AccessControl} via {LPSFTIssuable}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    yieldToken = IERC20(yieldToken_);
    borrowToken = IERC20(borrowToken_);
    lpYieldToken = IERC20Issuable(lpYieldToken_);
    lpBorrowToken = IERC20Issuable(lpBorrowToken_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ILPSFT}, {ERC1155Enumerable},
  // {LPSFTIssuable} and {LPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(IERC165, ERC1155Enumerable, LPSFTIssuable, LPNFTHolder)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(ILPSFT).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC1155MetadataURI} via {ERC1155Enumerable},
  // {LSFTIssuable} and {LPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155MetadataURI-uri}
   */
  function uri(
    uint256 id
  ) public view virtual override returns (string memory) {
    // Validate parameters
    if (id == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    // Read state
    ILPNFT token = _tokenIdToToken[id];

    // Validate state
    if (address(token) == address(0)) {
      revert LPSFTInvalidToken(id);
    }

    // Read external state
    return token.uri();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC1155Upgradeable} via {ERC1155Enumerable},
  // {LSFTIssuable} and {LPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC1155-_update}
   */
  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  )
    internal
    virtual
    override(ERC1155Upgradeable, ERC1155Enumerable, LPNFTHolder)
    nonReentrantLPSFT
  {
    // Validate parameters
    ERC1155Helpers.checkAmountArray(ids, values);
    ERC1155Helpers.checkBatchSize(ids);

    // Translate parameters
    uint256 tokenCount = ids.length;

    // Check if burning
    if (to == address(0)) {
      // Handle burning
      for (uint256 i = 0; i < tokenCount; i++) {
        // Translate parameter
        uint256 tokenId = ids.unsafeMemoryAccess(i);

        // Read state
        address tokenAddress = tokenIdToAddress(tokenId);

        // Validate state
        if (tokenAddress == address(0)) {
          revert LPSFTInvalidToken(tokenId);
        }

        // Read all pool balances
        uint256 lpYieldBalance_ = lpYieldToken.balanceOf(tokenAddress);
        uint256 lpBorrowBalance_ = lpBorrowToken.balanceOf(tokenAddress);

        // Burn all pool balances
        if (lpYieldBalance_ > 0) {
          // slither-disable-next-line reentrancy-no-eth
          lpYieldToken.burn(tokenAddress, lpYieldBalance_);
        }
        if (lpBorrowBalance_ > 0) {
          // slither-disable-next-line reentrancy-no-eth
          lpBorrowToken.burn(tokenAddress, lpBorrowBalance_);
        }
      }
    }

    // Call ancestors
    // slither-disable-next-line reentrancy-events
    super._update(from, to, ids, values);

    // Check if minting
    if (from == address(0)) {
      // Handle minting
      for (uint256 i = 0; i < tokenCount; i++) {
        // Translate parameter
        uint256 tokenId = ids.unsafeMemoryAccess(i);

        // Read state
        address tokenAddress = tokenIdToAddress(tokenId);

        // Validate state
        if (tokenAddress == address(0)) {
          revert LPSFTInvalidToken(tokenId);
        }

        // Read state
        address token0;
        address token1;
        uint128 liquidityAmount;
        // slither-disable-next-line unused-return
        (
          ,
          ,
          token0,
          token1,
          ,
          ,
          ,
          liquidityAmount,
          ,
          ,
          ,

        ) = uniswapV3NftManager.positions(tokenId);

        // Increase LP token balance
        if (token0 == address(yieldToken) || token1 == address(yieldToken)) {
          lpYieldToken.mint(tokenAddress, uint256(liquidityAmount));
        } else if (
          token0 == address(borrowToken) || token1 == address(borrowToken)
        ) {
          lpBorrowToken.mint(tokenAddress, uint256(liquidityAmount));
        }
      }
    }

    // If any tokens were returned to the contract after burning the LP-SFT,
    // transfer them to the sender
    if (to == address(0)) {
      uint256 yieldBalance = yieldToken.balanceOf(address(this));
      uint256 borrowBalance = borrowToken.balanceOf(address(this));

      if (yieldBalance > 0) {
        yieldToken.safeTransfer(from, yieldBalance);
      }
      if (borrowBalance > 0) {
        borrowToken.safeTransfer(from, borrowBalance);
      }
    }
  }
}
