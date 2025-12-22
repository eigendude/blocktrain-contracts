/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

// Contract ABIs
import usdcTokenAbi from "./contracts/test/token/erc20/USDC.sol/USDC.json";
import testErc1155EnumerableAbi from "./contracts/test/token/erc1155/extensions/TestERC1155Enumerable.sol/TestERC1155Enumerable.json";
import testLiquidityMathAbi from "./contracts/test/utils/math/TestLiquidityMath.sol/TestLiquidityMath.json";
import testRewardMathAbi from "./contracts/test/utils/math/TestRewardMath.sol/TestRewardMath.json";
import testTickMathAbi from "./contracts/test/utils/math/TestTickMath.sol/TestTickMath.json";

export {
  testErc1155EnumerableAbi,
  testLiquidityMathAbi,
  testRewardMathAbi,
  testTickMathAbi,
  usdcTokenAbi,
};
