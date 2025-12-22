/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20InterestFarm} from "../interfaces/defi/IERC20InterestFarm.sol";
import {RewardMath} from "../utils/math/RewardMath.sol";

/**
 * @dev A contract to lend ERC20 tokens and earn rewards based on lending
 * duration and amounts
 *
 * Rewards are calculated based on the amount of time and tokens loaned.
 *
 * Rewards are updated on every interaction.
 */
contract ERC20InterestFarm is
  Context,
  ReentrancyGuard,
  AccessControl,
  IERC20InterestFarm
{
  using SafeERC20 for IERC20;
  using RewardMath for uint256;

  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Role allowing an address to deposit tokens into the pool
   */
  bytes32 public constant ERC20_FARM_OPERATOR_ROLE = "ERC20_FARM_OPERATOR_ROLE";

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The reward token distributed to stakers
   */
  IERC20 public immutable rewardToken;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Reward rate per second per loaned token, scaled by 1e18 for precision
   */
  uint256 private _rewardRate;

  /**
   * @dev Total amount of tokens currently loaned in the pool
   */
  uint256 private _totalLoaned;

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
   * @dev Mapping of user addresses to their loaned token amounts
   */
  mapping(address => uint256) private _userStaked;

  /**
   * @dev Mapping of user addresses to the last recorded reward per token paid
   *
   * Used to calculate earned rewards.
   */
  mapping(address => uint256) private _userRewardPerTokenPaid;

  /**
   * @dev Mapping of user addresses to their accrued but not yet claimed rewards
   */
  mapping(address => uint256) private _rewards;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the staking pool with the staking and reward tokens
   *
   * @param owner_ The owner of the contract
   * @param rewardToken_ The address of the reward token
   * @param rewardRate_ The reward rate per second per loaned token
   */
  constructor(address owner_, address rewardToken_, uint256 rewardRate_) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(rewardToken_ != address(0), "Invalid reward token");
    require(rewardRate_ > 0, "Invalid reward rate");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    rewardToken = IERC20(rewardToken_);

    // Initialize state
    _rewardRate = rewardRate_;
    _lastUpdateTime = block.timestamp;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {IERC20InterestFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControl, IERC165) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC20InterestFarm).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IFarm} via {ERC20InterestFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IFarm-rewardPerToken}
   */
  function rewardPerToken() public view override returns (uint256) {
    // Calculate the amount of time that has passed since the last update
    uint256 timeElapsed = block.timestamp - _lastUpdateTime;

    return
      _rewardPerTokenStored.calculateRewardPerToken(
        timeElapsed,
        _rewardRate,
        _totalLoaned
      );
  }

  /**
   * @dev See {IFarm-earned}
   */
  function earned(address account) public view override returns (uint256) {
    return
      _userStaked[account].calculateEarned(
        rewardPerToken(),
        _userRewardPerTokenPaid[account],
        _rewards[account]
      );
  }

  /**
   * @dev See {IFarm-balanceOf}
   */
  function balanceOf(address account) public view override returns (uint256) {
    return _userStaked[account];
  }

  /**
   * @dev See {IFarm-totalLoaned}
   */
  function totalLiquidity() public view override returns (uint256) {
    return _totalLoaned;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC20InterestFarm} via {IFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC20InterestFarm-recordLoan}
   */
  function recordLoan(
    address lpSftAddress,
    uint256 amount
  ) public override nonReentrant {
    // Validate access
    _checkRole(ERC20_FARM_OPERATOR_ROLE);

    // Validate parameters
    require(lpSftAddress != address(0), "Invalid LP-SFT address");

    // Ensure the user is staking a non-zero amount to avoid unnecessary
    // transactions
    require(amount > 0, "Cannot stake 0");

    // Update state
    _updateReward(lpSftAddress);

    // Increase the total amount of tokens loaned in the pool by the amount
    // loaned
    _totalLoaned += amount;

    // Increase the loaned amount for this specific user
    _userStaked[lpSftAddress] += amount;
  }

  /**
   * @dev See {IERC20InterestFarm-recordRepayment}
   */
  function recordRepayment(
    address lpSftAddress,
    uint256 amount
  ) public override nonReentrant {
    // Validate access
    _checkRole(ERC20_FARM_OPERATOR_ROLE);

    // Validate parameters
    require(lpSftAddress != address(0), "Invalid LP-SFT address");

    // Ensure the withdrawal amount is greater than zero to avoid useless
    // transactions
    require(amount > 0, "Cannot withdraw 0");

    // Ensure the user has enough tokens loaned for the withdrawal
    require(
      amount <= _userStaked[lpSftAddress],
      "Withdrawal amount exceeds balance"
    );

    // Update state
    _updateReward(lpSftAddress);

    // Reduce the total loaned tokens in the pool by the withdrawal amount
    _totalLoaned -= amount;

    // Reduce the user's loaned tokens by the withdrawal amount
    _userStaked[lpSftAddress] -= amount;
  }

  /**
   * @dev See {IERC20InterestFarm-claimReward}
   */
  function claimReward(address lpSftAddress) public override nonReentrant {
    // Validate access
    _checkRole(ERC20_FARM_OPERATOR_ROLE);

    // Validate parameters
    require(lpSftAddress != address(0), "Invalid LP-SFT address");

    // Update state
    _updateReward(lpSftAddress);

    // Calculate the total reward tokens the user has earned so far
    uint256 reward = _rewards[lpSftAddress];

    // Check if there is any reward to claim to avoid unnecessary transactions
    // slither-disable-next-line timestamp
    if (reward > 0) {
      // Reset the user's reward balance to zero after claiming
      _rewards[_msgSender()] = 0;

      // Transfer the reward tokens from the contract to the LP-SFT
      rewardToken.safeTransfer(lpSftAddress, reward);
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
    _rewardPerTokenStored = rewardPerToken();

    // Record the timestamp of this update to track the period over which
    // rewards are calculated
    _lastUpdateTime = block.timestamp;

    // If the account is not the zero address, update the user-specific reward
    // data
    if (account != address(0)) {
      // Calculate the total rewards earned by the account up to this point,
      // using the latest reward per token rate
      _rewards[account] = earned(account);

      // Update the rate of reward per token paid to this user to the latest
      // calculated value
      _userRewardPerTokenPaid[account] = _rewardPerTokenStored;
    }
  }
}
