/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

const { Wallet } = require("ethers");

function generateMnemonic() {
  const wallet = Wallet.createRandom();
  const mnemonic = wallet.mnemonic.phrase;
  console.log(`Mnemonic: ${mnemonic}`);
}

generateMnemonic();
