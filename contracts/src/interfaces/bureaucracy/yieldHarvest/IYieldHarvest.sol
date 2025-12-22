/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Bureau of the Yield Harvest
 *
 * Lend your LP-NFT to The Reserve. Earn interest while accruing DeFi yield.
 *
 * Lending happens by sending the LPSFT tokens to the Bureau of the Yield
 * Harvest. In return, LPSFT debt tokens (NOLPSFT) are minted to the sender.
 *
 * To redeem the LPSFT tokens, NOLPSFT tokens are sent back to the contract,
 * where they are burned.
 */
interface IYieldHarvest is IERC165, IERC1155Receiver {}
