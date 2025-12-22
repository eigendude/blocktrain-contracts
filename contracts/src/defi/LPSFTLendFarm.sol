/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {INonfungiblePositionManager} from "../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {RewardMath} from "../utils/math/RewardMath.sol";

import {ILPSFTLendFarm} from "../interfaces/defi/ILPSFTLendFarm.sol";
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
contract LPSFTLendFarm is
  Context,
  ReentrancyGuard,
  AccessControl,
  ILPSFTLendFarm
{
  using Arrays for uint256[];
  using RewardMath for uint256;
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev LP-SFT operator role
   */
  bytes32 public constant LPSFT_FARM_OPERATOR_ROLE = "LPSFT_FARM_OPERATOR_ROLE";

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
   * @dev Total rewards per token stored
   *
   * Updated upon changes to state that affect reward calculations.
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
   * @param owner_ The owner of the contract
   * @param lpSft_ The address of the SFT token
   * @param rewardToken_ The address of the reward token
   * @param lpToken_ The address of the LP token used to hold staked balances
   * @param rewardRate_ The reward rate per second per staked token
   */
  constructor(
    address owner_,
    address lpSft_,
    address rewardToken_,
    address lpToken_,
    uint256 rewardRate_
  ) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(lpSft_ != address(0), "Invalid LP-SFT");
    require(rewardToken_ != address(0), "Invalid reward");
    require(lpToken_ != address(0), "Invalid LP");
    require(rewardRate_ > 0, "Invalid rate");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    lpSft = ILPSFT(lpSft_);
    rewardToken = IERC20(rewardToken_);
    lpToken = IERC20(lpToken_);

    // Initialize state
    _rewardRate = rewardRate_;
    _lastUpdateTime = block.timestamp;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {ILPSFTLendFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControl, IERC165) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(ILPSFTLendFarm).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IFarm} via {ILPSFTLendFarm}
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
  // Implementation of {ILPSFTLendFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILPSFTLendFarm-lendLpSft}
   */
  function lendLpSft(uint256 tokenId) public override nonReentrant {
    // Validate access
    _checkRole(LPSFT_FARM_OPERATOR_ROLE);

    // Validate parameters
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

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
   * @dev See {ILPSFTLendFarm-lendLpSftBatch}
   */
  function lendLpSftBatch(
    uint256[] memory tokenIds
  ) public override nonReentrant {
    // Validate access
    _checkRole(LPSFT_FARM_OPERATOR_ROLE);

    // Translate parameters
    uint256 tokenCount = tokenIds.length;

    // Handle tokens
    for (uint256 i = 0; i < tokenCount; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Validate parameters
      if (tokenId == 0) {
        revert ILPNFT.LPNFTInvalidTokenID();
      }

      // Get the LP-SFT's address
      // slither-disable-next-line calls-loop
      address lpSftAddress = lpSft.tokenIdToAddress(tokenId);

      // Validate the address
      if (lpSftAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidToken(tokenId);
      }

      // Update the reward for the LP-SFT
      _updateReward(lpSftAddress);
    }
  }

  /**
   * @dev See {ILPSFTLendFarm-withdrawLpSft}
   */
  function withdrawLpSft(uint256 tokenId) public override nonReentrant {
    // Validate access
    _checkRole(LPSFT_FARM_OPERATOR_ROLE);

    // Validate parameters
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    // Get the LP-SFT's address
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

      // Transfer the reward tokens from the contract to the LP-SFT
      // slither-disable-next-line calls-loop
      rewardToken.safeTransfer(lpSftAddress, reward);
    }
  }

  /**
   * @dev See {ILPSFTLendFarm-withdrawLpSftBatch}
   */
  function withdrawLpSftBatch(
    uint256[] memory tokenIds
  ) public override nonReentrant {
    // Validate access
    _checkRole(LPSFT_FARM_OPERATOR_ROLE);

    // Translate parameters
    uint256 tokenCount = tokenIds.length;

    // Handle tokens
    for (uint256 i = 0; i < tokenCount; i++) {
      // Translate parameters
      uint256 tokenId = tokenIds.unsafeMemoryAccess(i);

      // Validate parameters
      if (tokenId == 0) {
        revert ILPNFT.LPNFTInvalidTokenID();
      }

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

        // Transfer the reward tokens from the contract to the LP-SFT
        // slither-disable-next-line calls-loop,reentrancy-no-eth
        rewardToken.safeTransfer(lpSftAddress, reward);
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

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
