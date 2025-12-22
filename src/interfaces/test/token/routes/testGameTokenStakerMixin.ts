/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { TestGameTokenStaker } from "../../../../types/contracts/test/token/routes/TestGameTokenStaker";
import { TestGameTokenStaker__factory } from "../../../../types/factories/contracts/test/token/routes/TestGameTokenStaker__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestGameTokenStakerMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private gameTokenStaker: TestGameTokenStaker;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.gameTokenStaker = TestGameTokenStaker__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async createIncentive(
      rewardAmount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenStaker.createIncentive(rewardAmount);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async stakeLpNftWithGameToken(
      gameTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenStaker.stakeLpNftWithGameToken(
            gameTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async stakeLpNftWithAssetToken(
      assetTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenStaker.stakeLpNftWithAssetToken(
            assetTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async stakeLpNftImbalance(
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenStaker.stakeLpNftImbalance(
            gameTokenAmount,
            assetTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async unstakeLpNft(
      lpNftTokenId: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenStaker.unstakeLpNft(lpNftTokenId, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(
      lpNftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.gameTokenStaker.exit(lpNftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async getIncentive(): Promise<{
      totalRewardUnclaimed: bigint;
      totalSecondsClaimedX128: bigint;
      numberOfStakes: bigint;
    }> {
      return this.gameTokenStaker.getIncentive();
    }

    async getDeposit(tokenId: bigint): Promise<{
      owner: `0x${string}`;
      numberOfStakes: bigint;
      tickLower: number;
      tickUpper: number;
    }> {
      // TODO
      //return this.gameTokenStaker.getDeposit(tokenId);
      tokenId;
      return { owner: "0x", numberOfStakes: 0n, tickLower: 0, tickUpper: 0 };
    }

    async getStake(tokenId: bigint): Promise<{
      secondsPerLiquidityInsideInitialX128: bigint;
      liquidity: bigint;
    }> {
      return this.gameTokenStaker.getStake(tokenId);
    }

    async getRewardsOwed(owner: `0x${string}`): Promise<bigint> {
      return this.gameTokenStaker.getRewardsOwed(owner);
    }

    /* TODO
    async getRewardInfo(tokenId: bigint): Promise<{
      reward: bigint;
      secondsInsideX128: bigint;
    }> {
      return this.withSigner(async () => {
        return this.gameTokenStaker.getRewardInfo(tokenId);
      });
    }
    */
  };
}

export { TestGameTokenStakerMixin };
