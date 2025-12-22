/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BORROWInterestFarmContract } from "../../interfaces/defi/borrowInterestFarmContract";
import { BORROWLpSftLendFarmContract } from "../../interfaces/defi/borrowLpSftLendFarmContract";
import { DeFiManagerContract } from "../../interfaces/defi/defiManagerContract";
import { YIELDLpSftLendFarmContract } from "../../interfaces/defi/yieldLpSftLendFarmContract";
import { BORROWContract } from "../../interfaces/token/erc20/borrowContract";
import { DEBTContract } from "../../interfaces/token/erc20/debtContract";
import { LPBORROWContract } from "../../interfaces/token/erc20/lpBorrowContract";
import { LPYIELDContract } from "../../interfaces/token/erc20/lpYieldContract";
import { LPSFTContract } from "../../interfaces/token/erc1155/lpSftContract";
import { NOLPSFTContract } from "../../interfaces/token/erc1155/noLpSftContract";
import { AccessControlContract } from "../../interfaces/zeppelin/access/accessControlContract";

//////////////////////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////////////////////

const ERC20_ISSUER_ROLE: string =
  ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
const ERC20_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
  "ERC20_FARM_OPERATOR_ROLE",
);
const LPSFT_ISSUER_ROLE: string =
  ethers.encodeBytes32String("LPSFT_ISSUER_ROLE");
const DEFI_OPERATOR_ROLE: string =
  ethers.encodeBytes32String("DEFI_OPERATOR_ROLE");
const LPSFT_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
  "LPSFT_FARM_OPERATOR_ROLE",
);

//////////////////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  yieldToken: `0x${string}`;
  borrowToken: `0x${string}`;
  lpYieldToken: `0x${string}`;
  lpBorrowToken: `0x${string}`;
  debtToken: `0x${string}`;
  lpSft: `0x${string}`;
  noLpSft: `0x${string}`;
  dutchAuction: `0x${string}`;
  yieldHarvest: `0x${string}`;
  liquidityForge: `0x${string}`;
  reverseRepo: `0x${string}`;
  yieldLpNftStakeFarm: `0x${string}`;
  borrowLpNftStakeFarm: `0x${string}`;
  yieldLpSftLendFarm: `0x${string}`;
  borrowLpSftLendFarm: `0x${string}`;
  defiManager: `0x${string}`;
  borrowInterestFarm: `0x${string}`;
};

interface RoleAssignment {
  role: string;
  contract: AccessControlContract;
}

type RoleGroup = Record<`0x${string}`, Array<RoleAssignment>>;

//////////////////////////////////////////////////////////////////////////////
// Permission Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Manages the role assignments
 */
class PermissionManager {
  private admin: ethers.Signer;
  private addresses: Addresses;

  constructor(admin: ethers.Signer, addresses: Addresses) {
    this.admin = admin;
    this.addresses = addresses;
  }

  /**
   * @description Initializes all roles
   *
   * @returns {Promise<Array<ethers.ContractTransactionReceipt>>} A promise that
   * resolves to an array of transaction receipts.
   *
   * @throws {Error} If an error occurs
   */
  async initializeRoles(): Promise<Array<ethers.ContractTransactionReceipt>> {
    const transactions: Array<Promise<ethers.ContractTransactionReceipt>> = [];

    // Create contracts
    const borrowContract: BORROWContract = new BORROWContract(
      this.admin,
      this.addresses.borrowToken,
    );
    const lpYieldContract: LPYIELDContract = new LPYIELDContract(
      this.admin,
      this.addresses.lpYieldToken,
    );
    const lpBorrowContract: LPBORROWContract = new LPBORROWContract(
      this.admin,
      this.addresses.lpBorrowToken,
    );
    const debtContract: DEBTContract = new DEBTContract(
      this.admin,
      this.addresses.debtToken,
    );
    const lpSftContract: LPSFTContract = new LPSFTContract(
      this.admin,
      this.addresses.lpSft,
    );
    const noLpSftContract: NOLPSFTContract = new NOLPSFTContract(
      this.admin,
      this.addresses.noLpSft,
    );
    const yieldLpSftLendFarmContract: YIELDLpSftLendFarmContract =
      new YIELDLpSftLendFarmContract(
        this.admin,
        this.addresses.yieldLpSftLendFarm,
      );
    const borrowLpSftLendFarmContract: BORROWLpSftLendFarmContract =
      new BORROWLpSftLendFarmContract(
        this.admin,
        this.addresses.borrowLpSftLendFarm,
      );
    const defiManagerContract: DeFiManagerContract = new DeFiManagerContract(
      this.admin,
      this.addresses.defiManager,
    );
    const borrowInterestFarmContract: BORROWInterestFarmContract =
      new BORROWInterestFarmContract(
        this.admin,
        this.addresses.borrowInterestFarm,
      );

    // Role assignments
    const roleAssignments: RoleGroup[] = [
      // Dutch Auction
      {
        [this.addresses.yieldLpNftStakeFarm]: [
          {
            role: LPSFT_ISSUER_ROLE,
            contract: lpSftContract,
          },
        ],
        [this.addresses.lpSft]: [
          {
            role: ERC20_ISSUER_ROLE,
            contract: lpYieldContract,
          },
        ],
      },
      // Yield Harvest
      {
        [this.addresses.yieldHarvest]: [
          {
            role: LPSFT_ISSUER_ROLE,
            contract: noLpSftContract,
          },
          {
            role: LPSFT_FARM_OPERATOR_ROLE,
            contract: yieldLpSftLendFarmContract,
          },
          {
            role: LPSFT_FARM_OPERATOR_ROLE,
            contract: borrowLpSftLendFarmContract,
          },
        ],
      },
      // Liquidity Forge
      {
        [this.addresses.liquidityForge]: [
          {
            role: ERC20_FARM_OPERATOR_ROLE,
            contract: borrowInterestFarmContract,
          },
          {
            role: DEFI_OPERATOR_ROLE,
            contract: defiManagerContract,
          },
        ],
        [this.addresses.defiManager]: [
          {
            role: ERC20_ISSUER_ROLE,
            contract: borrowContract,
          },
          {
            role: ERC20_ISSUER_ROLE,
            contract: debtContract,
          },
        ],
      },
      // Reverse Repo
      {
        [this.addresses.borrowLpNftStakeFarm]: [
          {
            role: LPSFT_ISSUER_ROLE,
            contract: lpSftContract,
          },
        ],
        [this.addresses.lpSft]: [
          {
            role: ERC20_ISSUER_ROLE,
            contract: lpBorrowContract,
          },
        ],
      },
    ];

    for (const roleGroup of roleAssignments) {
      for (const [address, assignments] of Object.entries(roleGroup)) {
        for (const assignment of assignments) {
          // Skip if the role is already assigned
          if (
            await assignment.contract.hasRole(
              assignment.role,
              address as `0x${string}`,
            )
          ) {
            continue;
          }

          // Assign the role
          const transaction: ethers.ContractTransactionResponse =
            await assignment.contract.grantRoleAsync(
              assignment.role,
              address as `0x${string}`,
            );

          // Record the transaction
          transactions.push(
            transaction.wait() as Promise<ethers.ContractTransactionReceipt>,
          );
        }
      }
    }

    return Promise.all(transactions);
  }
}

export { PermissionManager };
