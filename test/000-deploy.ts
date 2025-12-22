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

import * as hardhat from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeploymentsExtension } from "hardhat-deploy/types";

// Fixture setup
const setupTest = hardhat.deployments.createFixture(
  async (hardhat_re: HardhatRuntimeEnvironment) => {
    const deployments: DeploymentsExtension = hardhat_re.deployments;

    // Ensure we start from a fresh deployment
    await deployments.fixture();
  },
);

describe("Contract deployment", () => {
  it("should deploy contracts", async function () {
    this.timeout(60 * 1000);

    await setupTest();
  });
});
