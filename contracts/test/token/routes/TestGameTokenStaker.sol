/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20Minimal} from "../../../interfaces/uniswap-v3-core/IERC20Minimal.sol";
import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";
import {IUniswapV3Staker} from "../../../interfaces/uniswap-v3-staker/IUniswapV3Staker.sol";

import {LPSFT} from "../../../src/token/ERC1155/LPSFT.sol";

import {IGameTokenPooler} from "../../../src/interfaces/token/routes/IGameTokenPooler.sol";

/**
 * @dev Token router to stake a Uniswap V3 LP-NFT in exchange for liquidity
 * rewards and market-making fees
 */
abstract contract TestGameTokenStaker is
  Context,
  Ownable,
  ReentrancyGuard,
  ERC721Holder
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when a new incentive is created for the POW1 staker
   *
   * @param creator The address of the creator
   * @param rewardToken The reward token
   * @param rewardAmount The reward amount
   * @param startTime The start time of the incentive
   * @param endTime The end time of the incentive
   * @param refundee The incentive's refundee address
   */
  event POW1IncentiveCreated(
    address indexed creator,
    address rewardToken,
    uint256 rewardAmount,
    uint256 startTime,
    uint256 endTime,
    address indexed refundee
  );

  /**
   * @dev Emitted when a Uniswap V3 LP-NFT is staked
   *
   * @param sender The sender of the tokens being paid
   * @param recipient The address of the recipient of the LP-NFT
   * @param nftAddress The address of the NFT manager contract
   * @param lpNftTokenId The ID of the NFT
   */
  event POW1LpNftStaked(
    address indexed sender,
    address indexed recipient,
    address nftAddress,
    uint256 lpNftTokenId
  );

  /**
   * @dev Emitted when a Uniswap V3 LP-NFT is unstaked
   *
   * @param sender The sender of the LP-NFT
   * @param nftAddress The address of the NFT manager contract
   * @param lpNftTokenId The ID of the NFT
   * @param rewardClaimed The amount of the game token claimed as a reward for
   *                      staking the LP-NFT
   * @param assetTokenReturned The amount of the asset token returned to the
   *                           recipient
   */
  event POW1LpNftUnstaked(
    address indexed sender,
    address indexed recipient,
    address nftAddress,
    uint256 lpNftTokenId,
    uint256 rewardClaimed,
    uint256 assetTokenReturned
  );

  /**
   * @dev Emitted when a new incentive is created for the POW5 staker
   *
   * @param creator The address of the creator
   * @param rewardToken The reward token
   * @param rewardAmount The reward amount
   * @param startTime The start time of the incentive
   * @param endTime The end time of the incentive
   * @param refundee The incentive's refundee address
   */
  event POW1LpNftIncentiveCreated(
    address indexed creator,
    address rewardToken,
    uint256 rewardAmount,
    uint256 startTime,
    uint256 endTime,
    address indexed refundee
  );

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The game token
   */
  IERC20 private immutable _gameToken;

  /**
   * @dev The asset token
   */
  IERC20 private immutable _assetToken;

  /**
   * @dev The reward token
   */
  IERC20 private immutable _rewardToken;

  /**
   * @dev The upstream Uniswap V3 pool for the token pair
   */
  IUniswapV3Pool private immutable _gameTokenPool;

  /**
   * @dev The pooler for the token pair
   */
  IGameTokenPooler private immutable _gameTokenPooler;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager private immutable _uniswapV3NftManager;

  /**
   * @dev The upstream Uniswap V3 staker
   */
  IUniswapV3Staker private immutable _uniswapV3Staker;

  /**
   * @dev The Powell Nickels LP-SFT contract
   */
  LPSFT private immutable _lpSft;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev True if the incentive has been created, false otherwise
   */
  bool private _incentiveCreated = false;

  /**
   * @dev The Uniswap V3 staker incentive key, calculated when the incentive is
   * created
   */
  IUniswapV3Staker.IncentiveKey private _incentiveKey;

  /**
   * @dev The Uniswap V3 staker incentive ID, calculated when the incentive is
   * created
   */
  bytes32 private _incentiveId;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param owner_ The initial owner of the contract
   * @param gameToken_ The address of the game token
   * @param assetToken_ The address of the asset token
   * @param rewardToken_ The address of the reward token
   * @param gameTokenPool_ The address of the pool for the token pair
   * @param gameTokenPooler_ The address of the pooler for the token pair
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT
   *        manager
   * @param uniswapV3Staker_ The address of the upstream Uniswap V3 staker
   * @param lpSft_ The address of the LP-SFT contract
   */
  constructor(
    address owner_,
    address gameToken_,
    address assetToken_,
    address rewardToken_,
    address gameTokenPool_,
    address gameTokenPooler_,
    address uniswapV3NftManager_,
    address uniswapV3Staker_,
    address lpSft_
  ) Ownable(owner_) {
    // Validate parameters
    require(gameToken_ != address(0), "Invalid game token");
    require(assetToken_ != address(0), "Invalid asset token");
    require(rewardToken_ != address(0), "Invalid reward token");
    require(gameTokenPool_ != address(0), "Invalid game token pool");
    require(gameTokenPooler_ != address(0), "Invalid game token pooler");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT manager");
    require(uniswapV3Staker_ != address(0), "Invalid staker");
    require(lpSft_ != address(0), "Invalid LPSFT");

    // Initialize routes
    _gameToken = IERC20(gameToken_);
    _assetToken = IERC20(assetToken_);
    _rewardToken = IERC20(rewardToken_);
    _gameTokenPool = IUniswapV3Pool(gameTokenPool_);
    _gameTokenPooler = IGameTokenPooler(gameTokenPooler_);
    _uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
    _uniswapV3Staker = IUniswapV3Staker(uniswapV3Staker_);
    _lpSft = LPSFT(lpSft_);
  }

  /**
   * @dev Initializes the staker incentive
   *
   * @param rewardAmount The reward to distribute in the incentive
   *
   * TODO: Allow creating multiple incentives?
   */
  function createIncentive(uint256 rewardAmount) public onlyOwner {
    // Validate state
    require(!_incentiveCreated, "Incentive already created");

    // Calculate the incentive key
    IUniswapV3Staker.IncentiveKey memory incentiveKey = _createIncentiveKey();

    // Update state
    _incentiveCreated = true;
    _incentiveKey = incentiveKey;

    // See IncentiveId.sol in the Uniswap V3 staker dependency
    _incentiveId = keccak256(abi.encode(incentiveKey));

    // Transfer the reward to this contract
    _rewardToken.safeTransferFrom(_msgSender(), address(this), rewardAmount);

    // Approve the Uniswap V3 staker to spend the reward
    _rewardToken.safeIncreaseAllowance(address(_uniswapV3Staker), rewardAmount);

    // Create the incentive
    _uniswapV3Staker.createIncentive(incentiveKey, rewardAmount);
  }

  //////////////////////////////////////////////////////////////////////////////
  // External interface for staking LP-NFTs
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints and stakes a Uniswap V3 LP-NFT, depositing the game token
   *
   * @param gameTokenAmount The amount of the game token to deposit
   * @param recipient The recient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted LP-NFT
   */
  function stakeLpNftWithGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) public nonReentrant returns (uint256 lpNftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the game token from the caller
    _receiveTokens(gameTokenAmount, 0);

    // Mint the LP-NFT
    lpNftTokenId = _gameTokenPooler.mintLpNftWithGameToken(
      gameTokenAmount,
      address(this)
    );

    // Return the LP-SFT and the game token dust
    _returnSftAndDust(lpNftTokenId, recipient);

    return lpNftTokenId;
  }

  /**
   * @dev Mints and stakes a Uniswap V3 LP-NFT, depositing the asset token
   *
   * @param assetTokenAmount The amounts of the asset token to deposit
   * @param recipient The recient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted LP-NFT
   */
  function stakeLpNftWithAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) public nonReentrant returns (uint256 lpNftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the asset token from the caller
    _receiveTokens(0, assetTokenAmount);

    // Mint the LP-NFT
    lpNftTokenId = _gameTokenPooler.mintLpNftWithAssetToken(
      assetTokenAmount,
      address(this)
    );

    // Return the LP-SFT and the game token dust
    _returnSftAndDust(lpNftTokenId, recipient);

    return lpNftTokenId;
  }

  /**
   * @dev Mints and stakes a Uniswap V3 LP-NFT without performing a token swap
   *
   * @param gameTokenAmount The amount of the game token to deposit
   * @param assetTokenAmount The amounts of the asset token to deposit
   * @param recipient The recient of the LP-NFT
   *
   * @return lpNftTokenId The ID of the minted LP-NFT
   */
  function stakeLpNftImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) public nonReentrant returns (uint256 lpNftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive tokens from the caller
    _receiveTokens(gameTokenAmount, assetTokenAmount);

    // Mint the LP-NFT
    lpNftTokenId = _gameTokenPooler.mintLpNftImbalance(
      gameTokenAmount,
      assetTokenAmount,
      address(this)
    );

    // Return the LP-SFT and the game token dust
    _returnSftAndDust(lpNftTokenId, recipient);

    return lpNftTokenId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // External interface for unstaking LP-NFTs
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Unstakes an LP-NFT and returns the underlying liquidity as the asset
   * token
   *
   * Instead of burning the empty NFT, it is transfered to the recipient as a
   * keepsake.
   *
   * @param lpNftTokenId The ID of the LP-NFT
   * @param recipient The recipient of the asset token and empty LP-NFT
   *
   * @return assetTokenReturned The total amount of the asset token
   *                            to the recipient
   */
  function unstakeLpNft(
    uint256 lpNftTokenId,
    address recipient
  ) public nonReentrant returns (uint256 assetTokenReturned) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Validate ownership
    require(
      _lpSft.balanceOf(_msgSender(), lpNftTokenId) == 1,
      "Must own voucher"
    );

    // Burn the voucher for the LP-NFT
    _lpSft.burn(_msgSender(), lpNftTokenId);

    // Read state
    uint256 rewardBefore = _uniswapV3Staker.rewards(
      _incentiveKey.rewardToken,
      address(this)
    );

    // Unstake the LP-NFT
    _uniswapV3Staker.unstakeToken(_incentiveKey, lpNftTokenId);

    // Read state
    uint256 rewardAfter = _uniswapV3Staker.rewards(
      _incentiveKey.rewardToken,
      address(this)
    );

    // Claim the reward
    // slither-disable-next-line unused-return
    _uniswapV3Staker.claimReward(
      _incentiveKey.rewardToken,
      address(this),
      rewardAfter - rewardBefore
    );

    // Withdraw the LP-NFT to the pooler so that it can collect the liquidity
    _uniswapV3Staker.withdrawToken(lpNftTokenId, address(_gameTokenPooler), "");

    // Withdraw the liquidity. This returns the LP-NFT to the staker.
    assetTokenReturned = _gameTokenPooler.collectFromLpNft(
      lpNftTokenId,
      address(this)
    );

    // Transfer the empty LP-NFT to the recipient as a keepsake
    _uniswapV3NftManager.safeTransferFrom(
      address(this),
      recipient,
      lpNftTokenId
    );

    // Return the asset token to the recipient
    _returnAssetToken(recipient, assetTokenReturned);

    return assetTokenReturned;
  }

  /**
   * @dev Collects everything and returns the empty LP-NFT in one transaction
   *
   * @param lpNftTokenId The ID of the LP-NFT
   *
   * @return assetTokenReturned The total amount of the asset token returned
   *                            to the recipient
   */
  function exit(
    uint256 lpNftTokenId
  ) public returns (uint256 assetTokenReturned) {
    // Unstake and transfer the LP-NFT
    assetTokenReturned = unstakeLpNft(lpNftTokenId, _msgSender());

    return assetTokenReturned;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Public accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get the staking incentive
   *
   * @return totalRewardUnclaimed The amount of reward token not yet claimed by
   *                              users
   * @return totalSecondsClaimedX128 Total liquidity-seconds claimed,
   *                                 represented as a UQ32.128
   * @return numberOfStakes The count of deposits that are currently staked for
   *                        the incentive
   */
  function getIncentive()
    public
    view
    returns (
      uint256 totalRewardUnclaimed,
      uint160 totalSecondsClaimedX128,
      uint96 numberOfStakes
    )
  {
    // Validate state
    require(_incentiveCreated, "Incentive not created");

    // Call external contract
    // slither-disable-next-line unused-return
    return _uniswapV3Staker.incentives(_incentiveId);
  }

  /**
   * @dev Get information about a deposited LP-NFT
   *
   * @return owner_ The owner of the deposited LP-NFT
   * @return numberOfStakes Counter of how many incentives for which the
   *                        liquidity is staked
   * @return tickLower The lower tick of the range
   * @return tickUpper The upper tick of the range
   */
  function getDeposit(
    uint256 tokenId
  )
    public
    view
    returns (
      address owner_,
      uint48 numberOfStakes,
      int24 tickLower,
      int24 tickUpper
    )
  {
    // Call external contract
    (owner_, numberOfStakes, tickLower, tickUpper) = _uniswapV3Staker.deposits(
      tokenId
    );

    // Validate result
    require(owner_ == address(this), "Invalid owner");

    // Translate result
    owner_ = _lpSft.ownerOf(tokenId);

    return (owner_, numberOfStakes, tickLower, tickUpper);
  }

  /**
   * @dev Get information about a staked liquidity NFT
   *
   * @param tokenId The ID of the staked token
   *
   * @return secondsPerLiquidityInsideInitialX128 secondsPerLiquidity
   *                                              represented as a UQ32.128
   * @return liquidity The amount of liquidity in the NFT as of the last time
   *                   the rewards were computed
   */
  function getStake(
    uint256 tokenId
  )
    public
    view
    returns (uint160 secondsPerLiquidityInsideInitialX128, uint128 liquidity)
  {
    // Validate state
    require(_incentiveCreated, "Incentive not created");

    // Call external contract
    // slither-disable-next-line unused-return
    return _uniswapV3Staker.stakes(tokenId, _incentiveId);
  }

  /**
   * @dev Returns amounts of reward tokens owed to a given address according
   * to the last time all stakes were updated
   *
   * @param owner_ The owner for which the rewards owed are checked
   *
   * @return rewardsOwed The amount of the reward token claimable by the owner
   */
  function getRewardsOwed(
    address owner_
  ) public view returns (uint256 rewardsOwed) {
    // Validate state
    require(_incentiveCreated, "Incentive not created");

    // Call external contract
    return _uniswapV3Staker.rewards(_incentiveKey.rewardToken, owner_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Public mutators
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Calculates the reward amount that will be received for the given stake
   *
   * @param tokenId The ID of the token
   *
   * @return reward The reward accrued to the NFT for the given incentive thus
   *                far
   */
  function getRewardInfo(
    uint256 tokenId
  ) public returns (uint256 reward, uint160 secondsInsideX128) {
    // Validate state
    require(_incentiveCreated, "Incentive not created");

    // Call external contract
    // slither-disable-next-line unused-return
    return _uniswapV3Staker.getRewardInfo(_incentiveKey, tokenId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Transfer tokens to this contract and approve the UniV3 Pooler to
   * spend tokens
   *
   * @param gameTokenAmount The amount of the game token to transfer
   * @param assetTokenAmount The amount of the asset token to transfer
   */
  function _receiveTokens(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount
  ) private {
    // Call external contracts
    if (gameTokenAmount > 0) {
      _gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
      _gameToken.safeIncreaseAllowance(
        address(_gameTokenPooler),
        gameTokenAmount
      );
    }
    if (assetTokenAmount > 0) {
      _assetToken.safeTransferFrom(
        _msgSender(),
        address(this),
        assetTokenAmount
      );
      _assetToken.safeIncreaseAllowance(
        address(_gameTokenPooler),
        assetTokenAmount
      );
    }
  }

  /**
   * @dev Return the LP-SFT, along with the dust, to the recipient
   *
   * @param lpNftTokenId The ID of the LP-NFT
   * @param recipient The recipient of the LP-SFT and dust
   */
  function _returnSftAndDust(uint256 lpNftTokenId, address recipient) private {
    // Mint the recipient a voucher for the LP-NFT. This must be held by the
    // sender when unstaking the NFT.
    _lpSft.mint(recipient, lpNftTokenId, "");

    // Send the LP-NFT to the Uniswap V3 staker contract and automatically
    // stake it
    _uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_uniswapV3Staker),
      lpNftTokenId,
      abi.encode(_incentiveKey)
    );

    // Return dust to the recipient
    uint256 gameTokenDust = _gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) {
      _gameToken.safeTransfer(recipient, gameTokenDust);
    }
  }

  /**
   * @dev Return the asset token to the recipient
   *
   * @param recipient The recipient of the asset token
   * @param assetTokenAmount The amount of the asset token to return
   */
  function _returnAssetToken(
    address recipient,
    uint256 assetTokenAmount
  ) private {
    // Call external contracts
    if (assetTokenAmount > 0)
      _assetToken.safeTransfer(recipient, assetTokenAmount);
  }

  /**
   * @dev Returns the incentive key for the Uniswap V3 staker
   */
  function _createIncentiveKey()
    private
    view
    returns (IUniswapV3Staker.IncentiveKey memory)
  {
    return
      IUniswapV3Staker.IncentiveKey({
        rewardToken: IERC20Minimal(address(_rewardToken)),
        pool: _gameTokenPool,
        startTime: block.timestamp,
        endTime: block.timestamp + 1 weeks, // TODO
        refundee: address(this)
      });
  }
}
