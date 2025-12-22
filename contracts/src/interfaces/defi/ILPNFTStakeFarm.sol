/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {IFarm} from "./IFarm.sol";

/**
 * @dev A contract to lend LP-NFTs and earn rewards based on lending duration
 * and liquidity amount
 *
 * Rewards are calculated based on the amount of time and liquidity staked.
 *
 * Rewards are updated on every interaction.
 */
interface ILPNFTStakeFarm is
  IERC165,
  IERC721Receiver,
  IERC1155Receiver,
  IFarm
{}
