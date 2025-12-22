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

import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";

import dotenv from "dotenv";
import { ethers } from "ethers";
import { HardhatUserConfig } from "hardhat/config";

// Load environment variables from .env
dotenv.config();

// Wallets
const MNEMONIC_DEPLOYER: string =
  process.env.MNEMONIC_DEPLOYER ||
  ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
const MNEMONIC_DEGEN: string =
  process.env.MNEMONIC_DEGEN ||
  ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
const MNEMONIC_PLAYER1: string =
  process.env.MNEMONIC_PLAYER1 ||
  ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));

// Function to get private keys
function getPrivateKeyFromMnemonic(
  mnemonic: string,
  path: string = "m/44'/60'/0'/0/0",
): string {
  const walletMnemonic: ethers.Mnemonic = ethers.Mnemonic.fromPhrase(mnemonic);
  const wallet: ethers.HDNodeWallet = ethers.HDNodeWallet.fromMnemonic(
    walletMnemonic,
    path,
  );
  return wallet.privateKey;
}

// Accounts
const ACCOUNTS: string[] = [
  getPrivateKeyFromMnemonic(MNEMONIC_DEPLOYER),
  getPrivateKeyFromMnemonic(MNEMONIC_DEGEN),
  getPrivateKeyFromMnemonic(MNEMONIC_PLAYER1),
];

// Gas reporter
const REPORT_GAS: boolean = process.env.REPORT_GAS ? true : false;

// The JSON-RPC URL for the Ethereum node
const JSON_RPC_URL: string =
  process.env.JSON_RPC_URL || "http://localhost:8545";

const config: HardhatUserConfig = {
  // Networks (may need to specify gas for public chains)
  networks: {
    hardhat: {
      accounts: ACCOUNTS.map((privateKey: string) => ({
        privateKey,
        balance: "0",
      })),
      allowUnlimitedContractSize: true,
      tags: [
        "FundDeployer",
        "TestTokens",
        "UniswapV3",
        "LiquidityPools",
        "POWTokens",
        "POWPools",
        "POWDeFi",
        "POWBureaucracy",
        "Tests",
      ],
    },
    localhost: {
      url: "http://localhost:8545",
      accounts: ACCOUNTS,
      allowUnlimitedContractSize: true,
      tags: [
        "FundDeployer",
        "TestTokens",
        "UniswapV3",
        "LiquidityPools",
        "POWTokens",
        "POWPools",
        "POWDeFi",
        "POWBureaucracy",
        "Tests",
      ],
    },
    testnet: {
      url: JSON_RPC_URL,
      accounts: ACCOUNTS,
      allowUnlimitedContractSize: true,
      tags: [
        "TestTokens",
        "UniswapV3",
        "LiquidityPools",
        "POWTokens",
        "POWPools",
        "POWDeFi",
        "POWBureaucracy",
        "Tests",
      ],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.PROJECT_ID}`,
      chainId: 1,
      accounts: ACCOUNTS,
      tags: [],
    },
    base: {
      url: `https://base-sepolia.infura.io/v3/${process.env.PROJECT_ID}`,
      chainId: 8453,
      accounts: ACCOUNTS,
      tags: [],
    },
  },

  // Compilers
  solidity: {
    compilers: [
      {
        // Project version
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        // Required by OpenZeppelin V3
        // Required by Uniswap V3
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },

  // Paths
  paths: {
    artifacts: "artifacts",
    deploy: "deploy",
    deployments: "deployments",
  },

  // ABI exporter extension (hardhat-abi-exporter)
  abiExporter: {
    // Path to ABI export directory (relative to Hardhat root)
    path: "./src/abi",
    // Whether to automatically export ABIs during compilation
    runOnCompile: true,
    // Whether to delete old files in path
    clear: true,
    // Whether to use interface-style formatting of output for better readability
    pretty: true,
  },

  // Typechain extension (@typechain/hardhat)
  typechain: {
    outDir: "src/types",
    target: "ethers-v6",
  },

  // Deployment extension (hardhat-deploy)
  namedAccounts: {
    deployer: {
      default: 0,
    },
    beneficiary: {
      default: 1,
    },
  },

  // Gas reporter extension (hardhat-gas-reporter)
  gasReporter: {
    enabled: REPORT_GAS ? true : false,
  },
};

export default config;
