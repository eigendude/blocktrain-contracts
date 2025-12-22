/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionAdminActions} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionAdminActions.sol";
import {VRGDA} from "../../utils/auction/VRGDA.sol";
import {LiquidityMath} from "../../utils/math/LiquidityMath.sol";

import {DutchAuctionBase} from "./DutchAuctionBase.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionAdminActions is
  IDutchAuctionAdminActions,
  DutchAuctionBase
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param owner_ The owner of the Dutch Auction
   */
  constructor(address owner_) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl},
  // {IDutchAuctionAdminActions}, {DutchAuctionRoutes} and {DutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, DutchAuctionBase) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuctionAdminActions).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionAdminActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuction-initialize}
   */
  function initialize(
    uint256 yieldAmount,
    uint256 marketTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 nftTokenId) {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(yieldAmount > 0, "Invalid YIELD amount");
    require(marketTokenAmount > 0, "Invalid market amount");
    require(receiver != address(0), "Invalid receiver");

    // Validate state
    require(!_initialized, "Already initialized");

    // Update state
    _initialized = true;

    // Call external contracts
    _routes.yieldToken.safeTransferFrom(
      _msgSender(),
      address(this),
      yieldAmount
    );
    _routes.marketToken.safeTransferFrom(
      _msgSender(),
      address(this),
      marketTokenAmount
    );

    _routes.yieldToken.safeIncreaseAllowance(
      address(_routes.yieldMarketPooler),
      yieldAmount
    );
    _routes.marketToken.safeIncreaseAllowance(
      address(_routes.yieldMarketPooler),
      marketTokenAmount
    );

    // Mint an LP-NFT
    nftTokenId = _routes.yieldMarketPooler.mintLpNftImbalance(
      yieldAmount,
      marketTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    _routes.uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_routes.yieldLpNftStakeFarm),
      nftTokenId,
      ""
    );

    // Get newly-minted LP-SFT address
    address lpSftAddress = _routes.lpSft.tokenIdToAddress(nftTokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send YIELD dust to the LP-SFT
    uint256 yieldDust = _routes.yieldToken.balanceOf(address(this));
    if (yieldDust > 0) {
      _routes.yieldToken.safeTransfer(lpSftAddress, yieldDust);
    }

    // Send asset token dust to the receiver
    uint256 marketTokenDust = _routes.marketToken.balanceOf(address(this));
    if (marketTokenDust > 0) {
      _routes.marketToken.safeTransfer(receiver, marketTokenDust);
    }

    // Return the LP-SFT to the receiver
    _routes.lpSft.safeTransferFrom(address(this), receiver, nftTokenId, 1, "");

    return nftTokenId;
  }

  /**
   * @dev See {IDutchAuctionAdminActions-isInitialized}
   */
  function isInitialized() external view override returns (bool) {
    // Read state
    return _initialized;
  }

  /**
   * @dev See {IDutchAuctionAdminActions-setAuctionCount}
   */
  function setAuctionCount(
    uint32 auctionCount,
    uint256 marketTokenDust
  ) external override {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate state
    require(_initialized, "Not initialized");

    // Read state
    uint32 currentAuctionCount = _targetLpNftCount;

    // Update state
    _targetLpNftCount = auctionCount;

    // Mint additional LP-NFTs if necessary
    if (auctionCount > currentAuctionCount) {
      uint32 lpNftsToMint = auctionCount - currentAuctionCount;

      // Procure dust
      _routes.marketToken.safeTransferFrom(
        _msgSender(),
        address(this),
        marketTokenDust
      );

      // Perform swaps and mint LP-NFTs
      _mintAndInitializeAuctions(lpNftsToMint, marketTokenDust);

      // Handle remaining tokens and dust
      _handleRemainingTokens();
    }
  }

  /**
   * @dev See {IDutchAuctionAdminActions-getAuctionCount}
   */
  function getAuctionCount() external view override returns (uint32) {
    // Read state
    return _targetLpNftCount;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal helper functions
  //////////////////////////////////////////////////////////////////////////////

  function _mintAndInitializeAuctions(
    uint256 lpNftsToMint,
    uint256 marketTokenDust
  ) private {
    // Get market token reserve
    uint256 marketTokenReserve = _routes.marketToken.balanceOf(
      address(_routes.yieldMarketPool)
    );

    // Get the pool fee
    uint24 poolFee = _routes.yieldMarketPool.fee();

    // Calculate swap amount
    uint256 swapAmount = LiquidityMath.computeSwapAmountV2(
      marketTokenReserve,
      marketTokenDust,
      poolFee
    );
    require(swapAmount <= marketTokenDust, "Bad liquidity math");

    // Approve swap
    _routes.marketToken.safeIncreaseAllowance(
      address(_routes.yieldMarketSwapper),
      swapAmount
    );

    // Perform swap
    // slither-disable-next-line unused-return,reentrancy-benign
    _routes.yieldMarketSwapper.buyGameToken(swapAmount, address(this));

    // Mint LP-NFTs
    for (uint256 i = 0; i < lpNftsToMint; i++) {
      // Read external state
      // slither-disable-next-line calls-loop
      uint256 currentYieldAmount = _routes.yieldToken.balanceOf(address(this));
      // slither-disable-next-line calls-loop
      uint256 currentMarketTokenAmount = _routes.marketToken.balanceOf(
        address(this)
      );

      // Mint an LP-NFT
      uint256 lpNftTokenId = _mintLpNft(
        currentYieldAmount,
        currentMarketTokenAmount
      );

      // Establish auction state for the new LP-NFT
      _establishAuctionState(lpNftTokenId);
    }
  }

  function _handleRemainingTokens() private {
    // Read external state
    uint256 remainingYield = _routes.yieldToken.balanceOf(address(this));

    // Swap the YIELD dust back into the market token
    if (remainingYield > 0) {
      // Approve swap
      _routes.yieldToken.safeIncreaseAllowance(
        address(_routes.yieldMarketSwapper),
        remainingYield
      );

      // Perform swap
      // slither-disable-next-line unused-return
      _routes.yieldMarketSwapper.sellGameToken(remainingYield, address(this));
    }

    // Read external state
    uint256 remainingMarketToken = _routes.marketToken.balanceOf(address(this));

    // Return the market token dust to the sender
    if (remainingMarketToken > 0) {
      _routes.marketToken.safeTransfer(_msgSender(), remainingMarketToken);
    }
  }
}
