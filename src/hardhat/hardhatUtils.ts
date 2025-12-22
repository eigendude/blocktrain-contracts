/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import * as hardhat from "hardhat";

//
// Utility functions
//

/**
 * @description Returns the current network name, normalizing "hardhat" to
 * "localhost" for consistency
 *
 * This ensures deployment files are organized under the same directory when
 * running both tests (which use the "hardhat" network) and local Hardhat
 * nodes (which deploy to the "deployments/localhost" directory).
 */
function getNetworkName(): string {
  let networkName: string = hardhat.network.name;

  // Use "localhost" for network name if running on hardhat
  if (networkName === "hardhat") {
    networkName = "localhost";
  }

  return networkName;
}

export { getNetworkName };
