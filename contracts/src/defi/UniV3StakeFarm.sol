/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20Minimal} from "../../interfaces/uniswap-v3-core/IERC20Minimal.sol";
import {IUniswapV3Pool} from "../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";
import {IUniswapV3Staker} from "../../interfaces/uniswap-v3-staker/IUniswapV3Staker.sol";

import {IUniV3StakeFarm} from "../interfaces/defi/IUniV3StakeFarm.sol";
import {IERC1155Enumerable} from "../interfaces/token/ERC1155/extensions/IERC1155Enumerable.sol";
import {ILPNFT} from "../interfaces/token/ERC1155/ILPNFT.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";

/**
 * @dev A contract to stake Uniswap V3 LP-NFTs with concentrated liquidity
 */
contract UniV3StakeFarm is
  Context,
  ReentrancyGuard,
  AccessControl,
  ERC721Holder,
  ERC1155Holder,
  IUniV3StakeFarm
{
  using Arrays for uint256[];
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
   * @dev The Uniswap V3 pool
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

  /**
   * @dev The Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  /**
   * @dev The Uniswap V3 cannonical staker
   */
  IUniswapV3Staker public immutable uniswapV3Staker;

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
   * @dev Initializes the lending pool with the lending and reward tokens
   *
   * @param owner_ The owner of the pool
   * @param lpSft_ The address of the SFT token contract
   * @param rewardToken_ The address of the reward token
   * @param uniswapV3Pool_ The address of the upstream Uniswap V3 pool
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT manager
   * @param uniswapV3Staker_ The address of the upstream Uniswap V3 cannonical staker
   */
  constructor(
    address owner_,
    address lpSft_,
    address rewardToken_,
    address uniswapV3Pool_,
    address uniswapV3NftManager_,
    address uniswapV3Staker_
  ) {
    // Validate parameters
    require(lpSft_ != address(0), "Invalid SFT token");
    require(rewardToken_ != address(0), "Invalid reward token");
    require(uniswapV3Pool_ != address(0), "Invalid Uniswap V3 pool");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT manager");
    require(uniswapV3Staker_ != address(0), "Invalid NFT manager");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    lpSft = ILPSFT(lpSft_);
    rewardToken = IERC20(rewardToken_);
    uniswapV3Pool = IUniswapV3Pool(uniswapV3Pool_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
    uniswapV3Staker = IUniswapV3Staker(uniswapV3Staker_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {IUniV3StakeFarm}
  //////////////////////////////////////////////////////////////////////////////

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
      interfaceId == type(IUniV3StakeFarm).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IUniV3StakeFarm}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IUniV3StakeFarm-createIncentive}
   */
  function createIncentive(uint256 rewardAmount) public override nonReentrant {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate state
    require(!_incentiveCreated, "Incentive already created");

    // Update state
    _incentiveCreated = true;
    _incentiveKey = _createIncentiveKey();

    // See IncentiveId.sol in the Uniswap V3 staker dependency
    _incentiveId = keccak256(abi.encode(_incentiveKey));

    // Transfer the reward to this contract
    rewardToken.safeTransferFrom(_msgSender(), address(this), rewardAmount);

    // Approve the Uniswap V3 staker to spend the reward
    rewardToken.safeIncreaseAllowance(address(uniswapV3Staker), rewardAmount);

    // Create the incentive
    uniswapV3Staker.createIncentive(_incentiveKey, rewardAmount);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    /*
    emit IncentiveCreated(
      _msgSender(),
      address(rewardToken),
      rewardAmount,
      _incentiveKey.startTime,
      _incentiveKey.endTime,
      _incentiveKey.refundee
    );
    */
  }

  /**
   * @dev See {IUniV3StakeFarm-isInitialized}
   */
  function isInitialized() external view override returns (bool) {
    return _incentiveCreated;
  }

  /**
   * @dev See {IUniV3StakeFarm-enter}
   */
  function enter(uint256 tokenId) external override nonReentrant {
    // Validate parameters
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    // Transfer the LP-NFT to this contract
    uniswapV3NftManager.safeTransferFrom(
      address(_msgSender()),
      address(this),
      tokenId
    );

    // Send the LP-NFT to the Uniswap V3 staker contract and automatically
    // stake it
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(uniswapV3Staker),
      tokenId,
      abi.encode(_incentiveKey)
    );

    // Mint the LP-SFT token to the sender
    lpSft.mint(_msgSender(), tokenId, "");

    // TODO: Emit event
  }

  /**
   * @dev See {IUniV3StakeFarm-exit}
   */
  function exit(uint256 tokenId) external override nonReentrant {
    // Validate parameters
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    // Transfer the LP-SFT to this contract
    lpSft.safeTransferFrom(
      address(_msgSender()),
      address(this),
      tokenId,
      1,
      ""
    );

    // Burn the LP-SFT token
    lpSft.burn(address(this), tokenId);

    // Read state
    uint256 rewardBefore = uniswapV3Staker.rewards(
      _incentiveKey.rewardToken,
      address(this)
    );

    // Unstake the LP-NFT
    uniswapV3Staker.unstakeToken(_incentiveKey, tokenId);

    // Read state
    uint256 rewardAfter = uniswapV3Staker.rewards(
      _incentiveKey.rewardToken,
      address(this)
    );

    // Claim the reward
    // slither-disable-next-line unused-return
    uniswapV3Staker.claimReward(
      _incentiveKey.rewardToken,
      address(this),
      rewardAfter - rewardBefore
    );

    // Withdraw the LP-NFT from the staker
    uniswapV3Staker.withdrawToken(tokenId, address(this), "");

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 liquidityAmount, , , , ) = uniswapV3NftManager
      .positions(tokenId);

    // Withdraw tokens from the pool
    if (liquidityAmount > 0) {
      // slither-disable-next-line unused-return
      uniswapV3NftManager.decreaseLiquidity(
        INonfungiblePositionManager.DecreaseLiquidityParams({
          tokenId: tokenId,
          liquidity: liquidityAmount,
          amount0Min: 0,
          amount1Min: 0,
          // slither-disable-next-line timestamp
          deadline: block.timestamp
        })
      );
    }

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: tokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Read token addresses
    IERC20 token0 = IERC20(uniswapV3Pool.token0());
    IERC20 token1 = IERC20(uniswapV3Pool.token1());

    // Read balances
    uint256 rewardBalance = rewardToken.balanceOf(address(this));
    uint256 token0Balance = token0.balanceOf(address(this));
    uint256 token1Balance = token1.balanceOf(address(this));

    // Return any tokens to the sender
    if (rewardBalance > 0) {
      rewardToken.safeTransfer(_msgSender(), rewardBalance);
    }
    if (token0Balance > 0) {
      token0.safeTransfer(_msgSender(), token0Balance);
    }
    if (token1Balance > 0) {
      token1.safeTransfer(_msgSender(), token1Balance);
    }

    // Return the empty LP-NFT to the sender as a keepsake
    uniswapV3NftManager.safeTransferFrom(address(this), _msgSender(), tokenId);

    /* TODO
    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit NFTUnstaked(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      tokenId,
      rewardClaimed,
      assetTokenReturned
    );
    */
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

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
        rewardToken: IERC20Minimal(address(rewardToken)),
        pool: uniswapV3Pool,
        // slither-disable-next-line timestamp
        startTime: block.timestamp,
        // slither-disable-next-line timestamp
        endTime: block.timestamp + 1 weeks, // TODO
        refundee: address(this)
      });
  }
}
