/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IUniswapV3Pool} from "../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IReverseRepo} from "../interfaces/bureaucracy/IReverseRepo.sol";
import {ITheReserve} from "../interfaces/bureaucracy/theReserve/ITheReserve.sol";
import {IUniV3StakeFarm} from "../interfaces/defi/IUniV3StakeFarm.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IGameTokenPooler} from "../interfaces/token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../interfaces/token/routes/IGameTokenSwapper.sol";
import {LiquidityMath} from "../utils/math/LiquidityMath.sol";

/**
 * @title Bureau of the Reverse Repo
 */
contract ReverseRepo is
  ReentrancyGuard,
  AccessControl,
  ERC721Holder,
  ERC1155Holder,
  IReverseRepo
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Reserve smart contract
   */
  ITheReserve public immutable theReserve;

  /**
   * @dev The BORROW token
   */
  IERC20 public immutable borrowToken;

  /**
   * @dev The stable token
   */
  IERC20 public immutable stableToken;

  /**
   * @dev The upstream Uniswap V3 pool for the BORROW/stable token pair
   */
  IUniswapV3Pool public immutable borrowStablePool;

  /**
   * @dev The token swapper
   */
  IGameTokenSwapper public immutable borrowStableSwapper;

  /**
   * @dev The token pooler
   */
  IGameTokenPooler public immutable borrowStablePooler;

  /**
   * @dev The BORROW LP-NFT stake farm
   */
  IUniV3StakeFarm public immutable borrowLpNftStakeFarm;

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Yield Harvest contract
   *
   * @param owner_ The owner of the Dutch Auction
   * @param theReserve_ The Reserve smart contract address
   */
  constructor(address owner_, address theReserve_) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(theReserve_ != address(0), "Invalid The Reserve");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    theReserve = ITheReserve(theReserve_);
    borrowToken = IERC20(ITheReserve(theReserve_).borrowToken());
    stableToken = IERC20(ITheReserve(theReserve_).stableToken());
    borrowStablePool = IUniswapV3Pool(
      ITheReserve(theReserve_).borrowStablePool()
    );
    borrowStableSwapper = IGameTokenSwapper(
      ITheReserve(theReserve_).borrowStableSwapper()
    );
    borrowStablePooler = IGameTokenPooler(
      ITheReserve(theReserve_).borrowStablePooler()
    );
    borrowLpNftStakeFarm = IUniV3StakeFarm(
      ITheReserve(theReserve_).borrowLpNftStakeFarm()
    );
    lpSft = ILPSFT(ITheReserve(theReserve_).lpSft());
    uniswapV3NftManager = INonfungiblePositionManager(
      ITheReserve(theReserve_).uniswapV3NftManager()
    );

    // Approve the stake farm to transfer our LP-NFTs
    uniswapV3NftManager.setApprovalForAll(
      address(ITheReserve(theReserve_).borrowLpNftStakeFarm()),
      true
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {IReverseRepo}
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
    override(AccessControl, ERC1155Holder, IERC165)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC721Receiver).interfaceId ||
      interfaceId == type(IReverseRepo).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IReverseRepo}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IReverseRepo-initialize}
   */
  function initialize(
    uint256 borrowAmount,
    uint256 stableTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 tokenId) {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(borrowAmount > 0, "Invalid BORROW amount");
    require(stableTokenAmount > 0, "Invalid stable amount");
    require(receiver != address(0), "Invalid receiver");

    // Call external contracts
    borrowToken.safeTransferFrom(_msgSender(), address(this), borrowAmount);
    stableToken.safeTransferFrom(
      _msgSender(),
      address(this),
      stableTokenAmount
    );

    borrowToken.safeIncreaseAllowance(
      address(borrowStablePooler),
      borrowAmount
    );
    stableToken.safeIncreaseAllowance(
      address(borrowStablePooler),
      stableTokenAmount
    );

    // Approve the stake farm to transfer our LP-NFTs
    lpSft.setApprovalForAll(address(borrowLpNftStakeFarm), true);

    // Mint an LP-NFT
    tokenId = borrowStablePooler.mintLpNftImbalance(
      borrowAmount,
      stableTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    borrowLpNftStakeFarm.enter(tokenId);

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send BORROW dust to the receiver
    uint256 borrowDust = borrowToken.balanceOf(address(this));
    if (borrowDust > 0) {
      borrowToken.safeTransfer(receiver, borrowDust);
    }

    // Send stable token dust to the receiver
    uint256 stableDust = stableToken.balanceOf(address(this));
    if (stableDust > 0) {
      stableToken.safeTransfer(receiver, stableDust);
    }

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, tokenId, 1, "");

    return tokenId;
  }

  /**
   * @dev See {IReverseRepo-purchase}
   */
  function purchase(
    uint256 borrowAmount,
    uint256 stableTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 tokenId) {
    // Validate parameters
    require(borrowAmount > 0 || stableTokenAmount > 0, "Invalid amounts");
    require(receiver != address(0), "Invalid receiver");

    // Get the pool fee
    uint24 poolFee = borrowStablePool.fee();

    // Call external contracts
    if (borrowAmount > 0) {
      borrowToken.safeTransferFrom(_msgSender(), address(this), borrowAmount);
    }
    if (stableTokenAmount > 0) {
      stableToken.safeTransferFrom(
        _msgSender(),
        address(this),
        stableTokenAmount
      );
    }

    // Perform single-sided supply swap
    if (borrowAmount == 0) {
      // Get stable token reserve
      uint256 stableReserve = stableToken.balanceOf(address(borrowStablePool));

      // Calculate stable swap amount
      uint256 stableSwapAmount = LiquidityMath.computeSwapAmountV2(
        stableReserve,
        stableTokenAmount,
        poolFee
      );
      require(stableSwapAmount <= stableTokenAmount, "Bad liquidity math");

      // Approve swap
      stableToken.safeIncreaseAllowance(
        address(borrowStableSwapper),
        stableSwapAmount
      );

      // Perform swap
      borrowAmount = borrowStableSwapper.buyGameToken(
        stableSwapAmount,
        address(this)
      );

      // Update amount
      stableTokenAmount -= stableSwapAmount;
    } else if (stableTokenAmount == 0) {
      // Get BORROW reserve
      uint256 borrowReserve = borrowToken.balanceOf(address(borrowStablePool));

      // Calculate BORROW swap amount
      uint256 borrowSwapAmount = LiquidityMath.computeSwapAmountV2(
        borrowReserve,
        borrowAmount,
        poolFee
      );
      require(borrowSwapAmount <= borrowAmount, "Bad liquidity math");

      // Approve swap
      borrowToken.safeIncreaseAllowance(
        address(borrowStableSwapper),
        borrowSwapAmount
      );

      // Perform swap
      stableTokenAmount = borrowStableSwapper.sellGameToken(
        borrowSwapAmount,
        address(this)
      );

      // Update amount
      borrowAmount -= borrowSwapAmount;
    }

    // Validate state
    require(borrowAmount > 0 || stableTokenAmount > 0, "Invalid liquidity");

    // Approve tokens
    if (borrowAmount > 0) {
      borrowToken.safeIncreaseAllowance(
        address(borrowStablePooler),
        borrowAmount
      );
    }
    if (stableTokenAmount > 0) {
      stableToken.safeIncreaseAllowance(
        address(borrowStablePooler),
        stableTokenAmount
      );
    }

    // Mint an LP-NFT
    tokenId = borrowStablePooler.mintLpNftImbalance(
      borrowAmount,
      stableTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    borrowLpNftStakeFarm.enter(tokenId);

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send BORROW dust to the receiver
    uint256 borrowDust = borrowToken.balanceOf(address(this));
    if (borrowDust > 0) {
      borrowToken.safeTransfer(receiver, borrowDust);
    }

    // Send stable token dust to the receiver
    uint256 stableDust = stableToken.balanceOf(address(this));
    if (stableDust > 0) {
      stableToken.safeTransfer(receiver, stableDust);
    }

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, tokenId, 1, "");

    return tokenId;
  }

  /**
   * @dev See {IReverseRepo-exit}
   */
  function exit(uint256 tokenId) external override nonReentrant {
    // Call external contracts
    lpSft.safeTransferFrom(_msgSender(), address(this), tokenId, 1, "");

    // Withdraw the LP-NFT from the stake farm
    borrowLpNftStakeFarm.exit(tokenId);

    // Read state
    uint256 borrowBalance = borrowToken.balanceOf(address(this));

    // Swap any BORROW to the stable token
    if (borrowBalance > 0) {
      borrowToken.safeIncreaseAllowance(
        address(borrowStableSwapper),
        borrowBalance
      );
      // slither-disable-next-line unused-return
      borrowStableSwapper.sellGameToken(borrowBalance, address(this));
    }

    // Read state
    uint256 stableTokenBalance = stableToken.balanceOf(address(this));

    // Return any tokens to the sender
    if (stableTokenBalance > 0) {
      stableToken.safeTransfer(_msgSender(), stableTokenBalance);
    }

    // Return the empty LP-NFT to the sender
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      _msgSender(),
      tokenId,
      ""
    );
  }
}
