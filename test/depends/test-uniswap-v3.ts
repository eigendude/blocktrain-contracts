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

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import BigNumber from "bignumber.js";
import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { ContractLibraryEthers } from "../../src/hardhat/contractLibraryEthers";
import {
  ETH_PRICE,
  USDC_ETH_LP_ETH_AMOUNT_BASE,
  USDC_ETH_LP_USDC_AMOUNT_BASE,
  USDC_PRICE,
} from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  UNI_V3_FEE_AMOUNT,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";
import { getMaxTick, getMinTick } from "../../src/utils/tickMath";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial balance in hardhat wallets
const HARDHAT_INITIAL_BALANCE = ethers.parseEther("10000"); // 10,000 ETH

// Fee of the WETH/USDC pool
const WETH_USDC_POOL_FEE: UNI_V3_FEE_AMOUNT = UNI_V3_FEE_AMOUNT.LOW;

// This value depends on the initial sqrtPriceX96 of the pool
// TODO: Derive constant
const WETH_USDC_POOL_LP_AMOUNT: bigint = 119_888_219_625_032_383n;

// Remaining dust after depositing into the pool
const WETH_DUST: bigint = 24_474n; // 24,474 wei
const USDC_DUST: bigint = 0n; // 0 USDC

// Initial Uniswap V3 LP-NFT token ID
const NFT_TOKEN_ID: bigint = 1n;

//
// Debug parameters
//

// Debug option to print the NFT's image data URI
const DEBUG_PRINT_NFT_IMAGE: boolean = false;

//
// Test cases
//

describe("Uniswap V3", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let beneficiaryAddress: `0x${string}`;
  let contracts: ContractLibraryEthers;
  let wethIsToken0: boolean;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function () {
    this.timeout(60 * 1000);

    // Use hardhat to get the deployer account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    const beneficiary: SignerWithAddress = signers[1];
    beneficiaryAddress = (await beneficiary.getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    contracts = await setupTest();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Log DeFi metrics
  //////////////////////////////////////////////////////////////////////////////

  it("should log DeFi metrics", async function (): Promise<void> {
    console.log(`    Using price of ETH: $${ETH_PRICE}`);
    console.log(`    Using price of USDC: $${USDC_PRICE}`);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test token order
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for WETH/USDC", async function (): Promise<void> {
    const {
      wrappedNativeTokenContract,
      wrappedNativeUsdcPoolContract,
      usdcTokenContract,
    } = contracts;

    const token0: `0x${string}` = await wrappedNativeUsdcPoolContract.token0();
    const token1: `0x${string}` = await wrappedNativeUsdcPoolContract.token1();
    chai.expect(token0).to.not.equal(token1);

    // Get pool token order
    wethIsToken0 = token0 === (await wrappedNativeTokenContract.getAddress());
    chai.expect(wethIsToken0).to.be.a("boolean");

    if (wethIsToken0) {
      chai
        .expect(token0)
        .to.equal(await wrappedNativeTokenContract.getAddress());
      chai.expect(token1).to.equal(await usdcTokenContract.getAddress());
    } else {
      chai.expect(token0).to.equal(await usdcTokenContract.getAddress());
      chai
        .expect(token1)
        .to.equal(await wrappedNativeTokenContract.getAddress());
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should wrap ETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract } = contracts;

    // Give the user enough ETH to deposit into the pool
    const newBalance = new BigNumber(
      (USDC_ETH_LP_ETH_AMOUNT_BASE + HARDHAT_INITIAL_BALANCE).toString(),
    );
    const newBalanceHex = "0x" + newBalance.toString(16);
    await hardhat.network.provider.request({
      method: "hardhat_setBalance",
      params: [beneficiaryAddress, newBalanceHex],
    });

    // Deposit ETH into W-ETH contract
    const tx: ethers.ContractTransactionResponse =
      await wrappedNativeTokenContract.deposit({
        value: USDC_ETH_LP_ETH_AMOUNT_BASE,
      });
    await tx.wait();
  });

  it("should mint USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract } = contracts;

    // Perform mint
    const tx: ethers.ContractTransactionResponse = await usdcTokenContract.mint(
      beneficiaryAddress,
      USDC_ETH_LP_USDC_AMOUNT_BASE,
    );
    await tx.wait();
  });

  it("should approve WETH/USDC pool to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract, uniswapV3NftManagerContract } =
      contracts;

    // Approve WETH/USDC pool to spend WETH
    const approveTx: ethers.ContractTransactionResponse =
      await wrappedNativeTokenContract.approve(
        await uniswapV3NftManagerContract.getAddress(),
        USDC_ETH_LP_ETH_AMOUNT_BASE,
      );
    await approveTx.wait();
  });

  it("should approve WETH/USDC pool to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract, uniswapV3NftManagerContract } = contracts;

    // Approve WETH/USDC pool to spend USDC
    const approveTx: ethers.ContractTransactionResponse =
      await usdcTokenContract.approve(
        await uniswapV3NftManagerContract.getAddress(),
        USDC_ETH_LP_USDC_AMOUNT_BASE,
      );
    await approveTx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint WETH/USDC pool NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      uniswapV3NftManagerContract,
      wrappedNativeTokenContract,
      usdcTokenContract,
    } = contracts;

    // Calculate DeFi metrics
    const wethDepositAmount: number = parseInt(
      ethers.formatEther(USDC_ETH_LP_ETH_AMOUNT_BASE),
    );
    const usdcDepositAmount: number = parseInt(
      ethers.formatUnits(USDC_ETH_LP_USDC_AMOUNT_BASE, 6),
    );
    const wethDepositValue: number = wethDepositAmount * ETH_PRICE;
    const usdcDepositValue: number = usdcDepositAmount * USDC_PRICE;

    // Log DeFi metrics
    console.log(
      `    Depositing: ${wethDepositAmount.toLocaleString()} WETH ($${wethDepositValue.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${usdcDepositAmount.toLocaleString()} USDC ($${usdcDepositValue.toLocaleString()})`,
    );

    // Deposit WETH and USDC into WETH/USDC pool and mint LP-NFT
    const mintParams = [
      await (wethIsToken0
        ? wrappedNativeTokenContract.getAddress()
        : usdcTokenContract.getAddress()), // token0
      await (wethIsToken0
        ? usdcTokenContract.getAddress()
        : wrappedNativeTokenContract.getAddress()), // token1
      WETH_USDC_POOL_FEE, // fee
      getMinTick(WETH_USDC_POOL_FEE), // tickLower
      getMaxTick(WETH_USDC_POOL_FEE), // tickUpper
      wethIsToken0 ? USDC_ETH_LP_ETH_AMOUNT_BASE : USDC_ETH_LP_USDC_AMOUNT_BASE, // amount0Desired
      wethIsToken0 ? USDC_ETH_LP_USDC_AMOUNT_BASE : USDC_ETH_LP_ETH_AMOUNT_BASE, // amount1Desired
      0n, // amount0Min
      0n, // amount1Min
      beneficiaryAddress, // recipient
      ethers.MaxUint256, // deadline
    ];
    const mintTx: ethers.ContractTransactionResponse =
      await uniswapV3NftManagerContract.mint(mintParams);

    const receipt: ethers.ContractTransactionReceipt | null =
      await mintTx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (ethers.EventLog | ethers.Log)[] = receipt!.logs;
    chai.expect(logs.length).to.equal(5);

    // EventLogs 0-1 give UndecodedEventLog by ethers, 2 is just a Log
    const log3: ethers.EventLog = logs[3] as ethers.EventLog;
    chai
      .expect(log3.address)
      .to.equal(await uniswapV3NftManagerContract.getAddress());
    chai.expect(log3.fragment.name).to.equal("Transfer");
    chai.expect(log3.args.length).to.equal(3);
    chai.expect(log3.args[0]).to.equal(ZERO_ADDRESS);
    chai.expect(log3.args[1]).to.equal(beneficiaryAddress);
    chai.expect(log3.args[2]).to.equal(NFT_TOKEN_ID);

    const log4: ethers.EventLog = logs[4] as ethers.EventLog;
    chai
      .expect(log4.address)
      .to.equal(await uniswapV3NftManagerContract.getAddress());
    chai.expect(log4.fragment.name).to.equal("IncreaseLiquidity");
    chai.expect(log4.args.length).to.equal(4);
    chai.expect(log4.args[0]).to.equal(NFT_TOKEN_ID); // tokenId
    chai.expect(log4.args[1]).to.equal(WETH_USDC_POOL_LP_AMOUNT); // liquidity
    if (wethIsToken0) {
      chai
        .expect(log4.args[2])
        .to.equal(USDC_ETH_LP_ETH_AMOUNT_BASE - WETH_DUST); // amount0
      chai
        .expect(log4.args[3])
        .to.equal(USDC_ETH_LP_USDC_AMOUNT_BASE - USDC_DUST); // amount1
    } else {
      chai
        .expect(log4.args[2])
        .to.equal(USDC_ETH_LP_USDC_AMOUNT_BASE - USDC_DUST); // amount0
      chai
        .expect(log4.args[3])
        .to.equal(USDC_ETH_LP_ETH_AMOUNT_BASE - WETH_DUST); // amount1
    }
  });

  it("should check LP-NFT position", async function (): Promise<void> {
    const {
      wrappedNativeTokenContract,
      uniswapV3NftManagerContract,
      usdcTokenContract,
    } = contracts;

    const positions: ethers.Result[] =
      await uniswapV3NftManagerContract.positions(NFT_TOKEN_ID);
    chai.expect(positions.length).to.equal(12);
    chai.expect(positions[0]).to.equal(0n); // nonce for permits
    chai.expect(positions[1]).to.equal(ZERO_ADDRESS); // operator
    if (wethIsToken0) {
      chai
        .expect(positions[2])
        .to.equal(await wrappedNativeTokenContract.getAddress()); // token0
      chai.expect(positions[3]).to.equal(await usdcTokenContract.getAddress()); // token1
    } else {
      chai.expect(positions[2]).to.equal(await usdcTokenContract.getAddress()); // token0
      chai
        .expect(positions[3])
        .to.equal(await wrappedNativeTokenContract.getAddress()); // token1
    }
    chai.expect(positions[4]).to.equal(BigInt(WETH_USDC_POOL_FEE)); // fee
    chai.expect(positions[5]).to.equal(BigInt(getMinTick(WETH_USDC_POOL_FEE))); // tickLower
    chai.expect(positions[6]).to.equal(BigInt(getMaxTick(WETH_USDC_POOL_FEE))); // tickUpper
    chai.expect(positions[7]).to.equal(WETH_USDC_POOL_LP_AMOUNT); // liquidity
    chai.expect(positions[8]).to.equal(0n); // feeGrowthInside0LastX128
    chai.expect(positions[9]).to.equal(0n); // feeGrowthInside1LastX128
    chai.expect(positions[10]).to.equal(0n); // tokensOwed0
    chai.expect(positions[11]).to.equal(0n); // tokensOwed1
  });

  it("should check WETH balances", async function (): Promise<void> {
    const { wrappedNativeTokenContract, wrappedNativeUsdcPoolContract } =
      contracts;

    const balanceBeneficiary: bigint =
      await wrappedNativeTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(balanceBeneficiary).to.equal(WETH_DUST);

    const balancePool: bigint = await wrappedNativeTokenContract.balanceOf(
      wrappedNativeUsdcPoolContract,
    );
    chai.expect(balancePool).to.equal(USDC_ETH_LP_ETH_AMOUNT_BASE - WETH_DUST);
  });

  it("should check USDC balance", async function (): Promise<void> {
    const { usdcTokenContract, wrappedNativeUsdcPoolContract } = contracts;

    const balanceBeneficiary: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(balanceBeneficiary).to.equal(USDC_DUST);

    const balancePool: bigint = await usdcTokenContract.balanceOf(
      await wrappedNativeUsdcPoolContract.getAddress(),
    );
    chai.expect(balancePool).to.equal(USDC_ETH_LP_USDC_AMOUNT_BASE - USDC_DUST);
  });

  it("should check NFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { uniswapV3NftManagerContract } = contracts;

    // Check total supply
    const totalSupply: bigint = await uniswapV3NftManagerContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Check token by index
    const tokenId: bigint = await uniswapV3NftManagerContract.tokenByIndex(0n);
    chai.expect(tokenId).to.equal(NFT_TOKEN_ID);

    // Check token of owner by index
    const tokenIdOwner: bigint =
      await uniswapV3NftManagerContract.tokenOfOwnerByIndex(
        beneficiaryAddress,
        0,
      );
    chai.expect(tokenIdOwner).to.equal(NFT_TOKEN_ID);

    // Check token contract name
    const name: string = await uniswapV3NftManagerContract.name();
    chai.expect(name).to.equal("Uniswap V3 Positions NFT-V1");

    // Check token symbol
    const symbol: string = await uniswapV3NftManagerContract.symbol();
    chai.expect(symbol).to.equal("UNI-V3-POS");

    // Check token URI
    const nftTokenUri: string =
      await uniswapV3NftManagerContract.tokenURI(NFT_TOKEN_ID);

    // Check that data URI has correct mime type
    chai.expect(nftTokenUri).to.match(/data:application\/json;base64,.+/);

    // Content should be valid JSON and structure
    const nftContent = extractJSONFromURI(nftTokenUri);
    if (!nftContent) {
      throw new Error("Failed to extract JSON from URI");
    }
    chai.expect(nftContent).to.haveOwnProperty("name").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("description").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("image").is.a("string");

    if (DEBUG_PRINT_NFT_IMAGE) {
      console.log(`    NFT image: ${nftContent.image}`);
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Log DeFi metrics
  //////////////////////////////////////////////////////////////////////////////

  it("should log DeFi metrics", async function (): Promise<void> {
    const {
      wrappedNativeTokenContract,
      wrappedNativeUsdcPoolContract,
      usdcTokenContract,
    } = contracts;

    // Get the amount of reserves for the pool
    const wethReserves: bigint = await wrappedNativeTokenContract.balanceOf(
      await wrappedNativeUsdcPoolContract.getAddress(),
    );
    const usdcReserves: bigint = await usdcTokenContract.balanceOf(
      await wrappedNativeUsdcPoolContract.getAddress(),
    );

    // Calculate reserve amounts and values
    const wethAmount: number = parseInt(ethers.formatEther(wethReserves));
    const usdcAmount: number = parseInt(
      ethers.formatUnits(usdcReserves, USDC_DECIMALS),
    );
    const wethValue: number = wethAmount * ETH_PRICE;
    const usdcValue: number = usdcAmount * USDC_PRICE;

    // Calculate TVL
    const tvl: number = wethValue + usdcValue;

    // Log results
    console.log(
      `    WETH reserves: ${wethAmount.toLocaleString()} ($${wethValue.toLocaleString()})`,
    );
    console.log(
      `    USDC reserves: ${usdcAmount.toLocaleString()} ($${usdcValue.toLocaleString()})`,
    );
    console.log(`    WETH/USDC pool TVL: $${tvl.toLocaleString()}`);
  });
});
