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
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionActions} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionActions.sol";
import {VRGDA} from "../../utils/auction/VRGDA.sol";
import {LiquidityMath} from "../../utils/math/LiquidityMath.sol";

import {DutchAuctionBase} from "./DutchAuctionBase.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionActions is
  IDutchAuctionActions,
  DutchAuctionBase
{
  using EnumerableSet for EnumerableSet.UintSet;
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuctionActions},
  // {DutchAuctionRoutes} and {DutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, DutchAuctionBase) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuctionActions).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionActions-purchase}
   */
  function purchase(
    uint256 lpNftTokenId,
    uint256 pow1Amount,
    uint256 marketTokenAmount,
    address beneficiary,
    address receiver
  ) external override nonReentrant {
    // Validate parameters
    require(lpNftTokenId != 0, "Invalid LP-NFT ID");
    require(pow1Amount > 0 || marketTokenAmount > 0, "Invalid payment");
    require(beneficiary != address(0), "Invalid beneficiary");
    require(receiver != address(0), "Invalid receiver");

    // Read state
    AuctionState storage auction = _auctionStates[lpNftTokenId];

    // Validate state
    // slither-disable-next-line timestamp
    require(auction.lpNftTokenId != 0, "LP-NFT not for sale");
    // slither-disable-next-line incorrect-equality,timestamp
    require(auction.salePrice == 0, "Auction already sold");

    // Get the current price in bips of the LP-NFT
    uint256 currentPriceBips = getCurrentPriceBips(lpNftTokenId);

    // Update state
    _bureauState.lastSalePriceBips = currentPriceBips;
    auction.salePrice = currentPriceBips;

    // Call external contracts
    if (pow1Amount > 0) {
      _routes.pow1Token.safeTransferFrom(
        _msgSender(),
        address(this),
        pow1Amount
      );
    }
    if (marketTokenAmount > 0) {
      _routes.marketToken.safeTransferFrom(
        _msgSender(),
        address(this),
        marketTokenAmount
      );
    }

    // Amounts to deposit
    uint256 pow1DepositAmount = pow1Amount;
    uint256 marketDepositAmount = marketTokenAmount;

    // Handle the tip
    {
      // Calculate the auction tip amounts
      uint256 pow1TipAmount = (pow1Amount * currentPriceBips) / 1e18;
      uint256 marketTipAmount = (marketTokenAmount * currentPriceBips) / 1e18;

      require(pow1TipAmount > 0 || marketTipAmount > 0, "Invalid tips");

      // Send the tip to the beneficiary (TODO)
      if (pow1TipAmount > 0) {
        _routes.pow1Token.safeTransfer(beneficiary, pow1TipAmount);
        pow1DepositAmount -= pow1TipAmount;
      }
      if (marketTipAmount > 0) {
        _routes.marketToken.safeTransfer(beneficiary, marketTipAmount);
        marketDepositAmount -= marketTipAmount;
      }
    }

    // Get the pool fee
    uint24 poolFee = _routes.pow1MarketPool.fee();

    // Perform single-sided supply swap
    // slither-disable-next-line incorrect-equality
    if (pow1DepositAmount == 0) {
      // Get market token reserve
      uint256 marketTokenReserve = _routes.marketToken.balanceOf(
        address(_routes.pow1MarketPool)
      );

      // Calculate market swap amount
      uint256 marketSwapAmount = LiquidityMath.computeSwapAmountV2(
        marketTokenReserve,
        marketDepositAmount,
        poolFee
      );
      require(marketSwapAmount <= marketDepositAmount, "Bad liquidity math");

      // Approve swap
      _routes.marketToken.safeIncreaseAllowance(
        address(_routes.pow1MarketSwapper),
        marketSwapAmount
      );

      // Perform swap
      // slither-disable-next-line reentrancy-no-eth
      pow1DepositAmount = _routes.pow1MarketSwapper.buyGameToken(
        marketSwapAmount,
        address(this)
      );

      // Update amount
      marketDepositAmount -= marketSwapAmount;
      // slither-disable-next-line incorrect-equality
    } else if (marketDepositAmount == 0) {
      // Get POW1 reserve
      uint256 pow1Reserve = _routes.pow1Token.balanceOf(
        address(_routes.pow1MarketPool)
      );

      // Calculate POW1 swap amount
      uint256 pow1SwapAmount = LiquidityMath.computeSwapAmountV2(
        pow1Reserve,
        pow1DepositAmount,
        poolFee
      );
      require(pow1SwapAmount <= pow1DepositAmount, "Bad liquidity math");

      // Approve swap
      _routes.pow1Token.safeIncreaseAllowance(
        address(_routes.pow1MarketSwapper),
        pow1SwapAmount
      );

      // Perform swap
      marketDepositAmount = _routes.pow1MarketSwapper.sellGameToken(
        pow1SwapAmount,
        address(this)
      );

      // Update amount
      pow1DepositAmount -= pow1SwapAmount;
    }

    // Read state
    uint256 mintDustAmount = _auctionSettings.mintDustAmount;

    // Validate amounts
    require(
      pow1DepositAmount > mintDustAmount &&
        marketDepositAmount > mintDustAmount,
      "Not enough for dust"
    );

    // Remove the LP-NFT token ID from current auctions
    require(_currentAuctions.remove(lpNftTokenId), "Auction not found");

    // Mint a new LP-NFT and establish its auction state
    // slither-disable-next-line reentrancy-no-eth
    uint256 newLpNftTokenId = _mintLpNft(mintDustAmount, mintDustAmount);
    _establishAuctionState(newLpNftTokenId);

    // Call external contracts
    if (pow1DepositAmount > 0) {
      _routes.pow1Token.safeIncreaseAllowance(
        address(_routes.uniswapV3NftManager),
        pow1DepositAmount
      );
    }
    if (marketDepositAmount > 0) {
      _routes.marketToken.safeIncreaseAllowance(
        address(_routes.uniswapV3NftManager),
        marketDepositAmount
      );
    }

    // Deposit liquidity
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.increaseLiquidity(
      INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: lpNftTokenId,
        amount0Desired: address(_routes.pow1Token) <
          address(_routes.marketToken)
          ? pow1DepositAmount
          : marketDepositAmount,
        amount1Desired: address(_routes.pow1Token) <
          address(_routes.marketToken)
          ? marketDepositAmount
          : pow1DepositAmount,
        amount0Min: 0,
        amount1Min: 0,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Stake LP-NFT in the stake farm
    _routes.uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_routes.pow1LpNftStakeFarm),
      lpNftTokenId,
      ""
    );

    // Return the LP-SFT to the receiver
    _routes.lpSft.safeTransferFrom(
      address(this),
      receiver,
      lpNftTokenId,
      1,
      ""
    );

    // Refund any excess tokens to the buyer
    uint256 remainingMarketTokens = _routes.marketToken.balanceOf(
      address(this)
    );
    if (remainingMarketTokens > 0) {
      _routes.marketToken.safeTransfer(msg.sender, remainingMarketTokens);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal helper functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Computes the tip amount based on the purchase price
   *
   * @param price The purchase price of the LP-NFT
   * @return tip The calculated tip amount
   */
  function _computeTip(uint256 price) private pure returns (uint256 tip) {
    // Example: Tip is 1% of the purchase price
    tip = (price * 1e16) / 1e18; // 1% of price scaled by 1e18
  }
}
