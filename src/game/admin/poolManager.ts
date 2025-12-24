/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { UniswapV3PoolContract } from "../../interfaces/uniswap/pool/uniswapV3PoolContract";
import { ETH_PRICE, USDC_PRICE } from "../../testing/defiMetrics";
import {
  INITIAL_LPBORROW_USDC_VALUE,
  INITIAL_LPYIELD_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  USDC_DECIMALS,
} from "../../utils/constants";
import { encodePriceSqrt } from "../../utils/fixedMath";

//////////////////////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Initial amount of WETH to deposit into the POW1 pool
 */
const INITIAL_MARKET_SUPPLY: bigint =
  ethers.parseEther(INITIAL_LPYIELD_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

/**
 * @description Initial amount of USDC to deposit into the POW5 pool
 */
const INITIAL_STABLE_SUPPLY: bigint =
  ethers.parseUnits(INITIAL_LPBORROW_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

//////////////////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  pow1Token: `0x${string}`;
  marketToken: `0x${string}`;
  pow1MarketPool: `0x${string}`;
  pow5Token: `0x${string}`;
  stableToken: `0x${string}`;
  pow5StablePool: `0x${string}`;
};

//////////////////////////////////////////////////////////////////////////////
// Pool Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Manages the initialization of Uniswap V3 pools for POW1 and
 * POW5 tokens
 */
class PoolManager {
  private admin: ethers.Signer;
  private addresses: Addresses;

  constructor(admin: ethers.Signer, addresses: Addresses) {
    this.admin = admin;
    this.addresses = addresses;
  }

  /**
   * @description Initializes the Uniswap V3 pools for POW1 and POW5
   *
   * This function checks if the POW1 and POW5 pools are already initialized by
   * querying the Uniswap V3 pool's current slot price. If the pools are not
   * initialized, it calculates the correct initial price and pushes
   * transactions to initialize the pools.
   *
   * The function returns a single promise that resolves when all the pool
   * initialization transactions are processed.
   *
   * @returns {Promise<Array<ethers.ContractTransactionReceipt>>} A promise that
   * resolves to an array of transaction receipts.
   *
   * @throws {Error} If the tokens in either POW1 or POW5 pools are incorrect
   */
  async initializePools(): Promise<Array<ethers.ContractTransactionReceipt>> {
    const transactions: Array<Promise<ethers.ContractTransactionReceipt>> = [];

    // Create contracts
    const pow1MarketPoolContract: UniswapV3PoolContract =
      new UniswapV3PoolContract(this.admin, this.addresses.pow1MarketPool);
    const pow5StablePoolContract: UniswapV3PoolContract =
      new UniswapV3PoolContract(this.admin, this.addresses.pow5StablePool);

    // Check if pools are initialized
    const pow1SqrtPriceX96: bigint = (await pow1MarketPoolContract.slot0())
      .sqrtPriceX96;
    const pow5SqrtPriceX96: bigint = (await pow5StablePoolContract.slot0())
      .sqrtPriceX96;

    // Initialize POW1 pool if not initialized
    if (pow1SqrtPriceX96 === 0n) {
      const tx: ethers.ContractTransactionResponse = await this.initializePool(
        pow1MarketPoolContract,
        this.addresses.pow1Token,
        this.addresses.marketToken,
        INITIAL_POW1_SUPPLY,
        INITIAL_MARKET_SUPPLY,
      );
      transactions.push(
        tx.wait() as Promise<ethers.ContractTransactionReceipt>,
      );
    }

    // Initialize POW5 pool if not initialized
    if (pow5SqrtPriceX96 === 0n) {
      const tx: ethers.ContractTransactionResponse = await this.initializePool(
        pow5StablePoolContract,
        this.addresses.pow5Token,
        this.addresses.stableToken,
        INITIAL_POW5_AMOUNT,
        INITIAL_STABLE_SUPPLY,
      );
      transactions.push(
        tx.wait() as Promise<ethers.ContractTransactionReceipt>,
      );
    }

    return Promise.all(transactions);
  }

  /**
   * @description Initializes a Uniswap V3 pool with the correct token order and
   * initial price
   *
   * @param {UniswapV3PoolContract} poolContract - The Uniswap V3 pool contract
   * @param {`0x${string}`} gameTokenAddress - The address of the game's token
   * @param {`0x${string}`} assetTokenAddress - The address of the asset token
   * @param {bigint} gameTokenSupply - The initial supply of the game's token
   * @param {bigint} assetTokenSupply - The initial supply of the asset token
   *
   * @returns {Promise<ethers.ContractTransactionReceipt>} A promise that
   * resolves to the transaction receipt once the pool has been successfully
   * initialized
   *
   * @throws {Error} If the token order in the pool does not match the provided
   * token addresses
   */
  private async initializePool(
    poolContract: UniswapV3PoolContract,
    gameTokenAddress: `0x${string}`,
    assetTokenAddress: `0x${string}`,
    gameTokenSupply: bigint,
    assetTokenSupply: bigint,
  ): Promise<ethers.ContractTransactionResponse> {
    // Get pool token order
    let gameIsToken0: boolean;

    const token0Address: string = (await poolContract.token0()).toLowerCase();
    const token1Address: string = (await poolContract.token1()).toLowerCase();

    if (
      token0Address === gameTokenAddress.toLowerCase() &&
      token1Address === assetTokenAddress.toLowerCase()
    ) {
      gameIsToken0 = true;
    } else if (
      token0Address === assetTokenAddress.toLowerCase() &&
      token1Address === gameTokenAddress.toLowerCase()
    ) {
      gameIsToken0 = false;
    } else {
      throw new Error(
        `Pool tokens are incorrect (token0: ${
          token0Address
        }, token1: ${token1Address})`,
      );
    }

    // Initialize the Uniswap V3 pool
    return poolContract.initializeAsync(
      encodePriceSqrt(
        gameIsToken0 ? assetTokenSupply : gameTokenSupply,
        gameIsToken0 ? gameTokenSupply : assetTokenSupply,
      ),
    );
  }
}

export { PoolManager };
