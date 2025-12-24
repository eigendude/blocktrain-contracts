/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {
  IERC1155Errors,
  IERC721Errors
} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {INonfungiblePositionManager} from "../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ERC1155Helpers} from "../token/ERC1155/utils/ERC1155Helpers.sol";
import {RewardMath} from "../utils/math/RewardMath.sol";

import {ILPNFTStakeFarm} from "../interfaces/defi/ILPNFTStakeFarm.sol";
import {IERC1155Enumerable} from "../interfaces/token/ERC1155/extensions/IERC1155Enumerable.sol";
import {ILPNFT} from "../interfaces/token/ERC1155/ILPNFT.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";

/**
 * @dev A contract to lend LP-NFTs and earn rewards based on lending duration
 * and liquidity amount
 *
 * Rewards are calculated based on the amount of time and liquidity staked.
 *
 * Rewards are updated on every interaction.
 */
contract LPNFTStakeFarm is Context, ReentrancyGuard, ILPNFTStakeFarm {
  using Arrays for uint256[];
  using RewardMath for uint256;
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT token contract used by the pool
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The reward token distributed to stakers
   */
  IERC20 public immutable rewardToken;

  /**
   * @dev The LP token used for lending balances
   */
  IERC20 public immutable lpToken;

  /**
   * @dev The YIELD token used to return tokens
   */
  IERC20 public immutable yieldToken;

  /**
   * @dev The POW5 token used to return tokens
   */
  IERC20 public immutable pow5Token;

  /**
   * @dev The Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Reward rate per second per lent liquidity, scaled by 1e18 for precision
   */
  uint256 private _rewardRate;

  /**
   * @dev Total amount of liquidity currently lent to the pool
   */
  uint256 private _totalLiquidity;

  /**
   * @dev Timestamp of the last reward update, used to calculate reward accruals
   */
  uint256 private _lastUpdateTime;

  /**
   * @dev Total rewards per token stored, updated upon changes to state
   * affecting reward calculations
   */
  uint256 private _rewardPerTokenStored;

  /**
   * @dev Mapping of user addresses to the last recorded reward per token paid
   *
   * Used to calculate earned rewards.
   */
  mapping(address user => uint256 rewardPerTokenPaid)
    private _userRewardPerTokenPaid;

  /**
   * @dev Mapping of user addresses to their accrued but not yet claimed rewards
   */
  mapping(address user => uint256 accruedReward) private _rewards;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the lending pool with the lending and reward tokens
   *
   * @param lpSft_ The address of the SFT token
   * @param rewardToken_ The address of the reward token
   * @param lpToken_ The address of the LP token used to hold staked balances
   * @param yieldToken_ The address of the YIELD token, used to return tokens
   * @param pow5Token_ The address of the POW5 token, used to return tokens
   * @param uniswapV3NftManager_ The address of the Uniswap V3 NFT manager
   * @param rewardRate_ The reward rate per second per staked token
   */
  constructor(
    address lpSft_,
    address rewardToken_,
    address lpToken_,
    address yieldToken_,
    address pow5Token_,
    address uniswapV3NftManager_,
    uint256 rewardRate_
  ) {
    // Validate parameters
    require(lpSft_ != address(0), "Invalid SFT token");
    require(rewardToken_ != address(0), "Invalid reward token");
    require(lpToken_ != address(0), "Invalid LP token");
    require(yieldToken_ != address(0), "Invalid YIELD token");
    require(pow5Token_ != address(0), "Invalid POW5 token");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT manager");
    require(rewardRate_ > 0, "Invalid reward rate");

    // Initialize routes
    lpSft = ILPSFT(lpSft_);
    rewardToken = IERC20(rewardToken_);
    lpToken = IERC20(lpToken_);
    yieldToken = IERC20(yieldToken_);
    pow5Token = IERC20(pow5Token_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);

    // Initialize state
    _rewardRate = rewardRate_;
    _lastUpdateTime = block.timestamp;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ILPNFTStakeFarm}
  //////////////////////////////////////////////////////////////////////////////

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override returns (bool) {
    return interfaceId == type(ILPNFTStakeFarm).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC721Receiver} via {ILPNFTStakeFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC721Receiver-onERC721Received}
   */
  function onERC721Received(
    address,
    address from,
    uint256 tokenId,
    bytes calldata
  ) public virtual override nonReentrant returns (bytes4) {
    // Validate parameters
    if (from == address(0)) {
      revert IERC721Errors.ERC721InvalidSender(from);
    }
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    // Call external contract to create LP-SFT
    // slither-disable-next-line reentrancy-benign
    lpSft.mint(from, tokenId, "");

    // Handle the LP-NFT
    _onLpNftReceived(tokenId);

    // Satisfy IERC721Receiver requirement
    return IERC721Receiver.onERC721Received.selector;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC1155Receiver} via {ILPNFTStakeFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155Receiver-onERC1155Received}
   */
  function onERC1155Received(
    address,
    address from,
    uint256 id,
    uint256 value,
    bytes calldata
  ) public virtual override nonReentrant returns (bytes4) {
    // Validate sender
    require(_msgSender() == address(lpSft), "Only LP-SFT");

    // Validate parameters
    if (from == address(0)) {
      revert IERC1155Errors.ERC1155InvalidSender(from);
    }
    if (id == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }
    if (value != 1) {
      revert IERC1155Enumerable.ERC1155EnumerableInvalidAmount(id, value);
    }

    // Handle the LP-SFT
    _onLpSftReceived(from, id);

    // Call external contract
    lpSft.burn(address(this), id);

    // Return any tokens to the sender
    _returnTokens(from);

    // Satisfy IERC1155Receiver requirement
    return IERC1155Receiver.onERC1155Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155BatchReceived}
   */
  function onERC1155BatchReceived(
    address,
    address from,
    uint256[] calldata ids,
    uint256[] calldata values,
    bytes calldata
  ) public virtual override nonReentrant returns (bytes4) {
    // Validate sender
    require(_msgSender() == address(lpSft), "Only LP-SFT");

    // Validate parameters
    if (from == address(0)) {
      revert IERC1155Errors.ERC1155InvalidSender(from);
    }
    ERC1155Helpers.checkAmountArray(ids, values);

    // Translate parameters
    uint256 tokenCount = ids.length;

    // Handle the token
    for (uint256 i = 0; i < tokenCount; i++) {
      // Translate parameters
      uint256 tokenId = ids.unsafeMemoryAccess(i);

      // Validate parameters
      if (tokenId == 0) {
        revert ILPNFT.LPNFTInvalidTokenID();
      }

      // Handle the LP-SFT
      _onLpSftReceived(from, tokenId);
    }

    // Call external contract
    lpSft.burnBatch(address(this), ids);

    // Return any tokens to the sender
    _returnTokens(from);

    // Satisfy IERC1155Receiver requirement
    return IERC1155Receiver.onERC1155BatchReceived.selector;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IFarm} via {ILPNFTStakeFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IFarm-rewardPerToken}
   */
  function rewardPerToken() public view override returns (uint256) {
    // Calculate the amount of time that has passed since the last update
    uint256 timeElapsed = block.timestamp - _lastUpdateTime;

    // slither-disable-next-line calls-loop
    return
      _rewardPerTokenStored.calculateRewardPerToken(
        timeElapsed,
        _rewardRate,
        lpToken.totalSupply()
      );
  }

  /**
   * @dev See {IFarm-earned}
   */
  function earned(address account) public view override returns (uint256) {
    // slither-disable-next-line calls-loop
    return
      lpToken.balanceOf(account).calculateEarned(
        rewardPerToken(),
        _userRewardPerTokenPaid[account],
        _rewards[account]
      );
  }

  /**
   * @dev See {IFarm-balanceOf}
   */
  function balanceOf(address account) public view override returns (uint256) {
    // slither-disable-next-line calls-loop
    return lpToken.balanceOf(account);
  }

  /**
   * @dev See {IFarm-totalLiquidity}
   */
  function totalLiquidity() public view override returns (uint256) {
    // slither-disable-next-line calls-loop
    return lpToken.totalSupply();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Internal function to handle LP-NFT received events
   *
   * @param tokenId The token ID of the LP-NFT. Must not be zero.
   */
  function _onLpNftReceived(uint256 tokenId) private {
    // Get the LP-SFT's address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate the address
    if (lpSftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Update the reward for the LP-SFT
    _updateReward(lpSftAddress);
  }

  /**
   * @dev Internal function to handle ERC1155 received events
   *
   * @param from The address of the sender. Must not be zero.
   * @param tokenId The token ID of the LP-NFT. Must not be zero.
   */
  function _onLpSftReceived(address from, uint256 tokenId) private {
    // Get the LP-SFT's address
    // slither-disable-next-line calls-loop
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);

    // Validate the address
    if (lpSftAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(tokenId);
    }

    // Update the reward for the LP-SFT
    _updateReward(lpSftAddress);

    // Calculate the total reward tokens the LP-SFT has earned so far
    uint256 reward = _rewards[lpSftAddress];

    // Check if there is any reward to claim to avoid unnecessary transactions
    // slither-disable-next-line timestamp
    if (reward > 0) {
      // Reset the LP-SFT's reward balance to zero after claiming
      _rewards[lpSftAddress] = 0;

      // Transfer the reward tokens from the contract to the user's wallet
      // slither-disable-next-line calls-loop
      rewardToken.safeTransfer(from, reward);
    }

    // Return the LP-NFT to the sender
    // slither-disable-next-line calls-loop
    uniswapV3NftManager.safeTransferFrom(address(this), from, tokenId, "");
  }

  /**
   * @dev Return any game tokens to the user after burning a LP-SFT
   *
   * @param recipient The address of the recipient receiving the tokens
   */
  function _returnTokens(address recipient) private {
    uint256 yieldBalance = yieldToken.balanceOf(address(this));
    uint256 pow5Balance = pow5Token.balanceOf(address(this));

    if (yieldBalance > 0) {
      yieldToken.safeTransfer(recipient, yieldBalance);
    }
    if (pow5Balance > 0) {
      pow5Token.safeTransfer(recipient, pow5Balance);
    }
  }

  /**
   * @dev Modifier to update the reward calculations for a user
   *
   * This modifier updates the global reward state and the specific state for a
   * given account.
   *
   * @param account The address of the user whose reward data needs updating
   */
  function _updateReward(address account) private {
    // Update the global state for rewards per token stored, reflecting any
    // changes since the last interaction
    // slither-disable-next-line calls-loop
    _rewardPerTokenStored = rewardPerToken();

    // Record the timestamp of this update to track the period over which
    // rewards are calculated
    _lastUpdateTime = block.timestamp;

    // If the account is not the zero address, update the user-specific reward
    // data
    if (account != address(0)) {
      // Calculate the total rewards earned by the account up to this point,
      // using the latest reward per token rate
      // slither-disable-next-line calls-loop
      _rewards[account] = earned(account);

      // Update the rate of reward per token paid to this user to the latest
      // calculated value
      _userRewardPerTokenPaid[account] = _rewardPerTokenStored;
    }
  }
}
