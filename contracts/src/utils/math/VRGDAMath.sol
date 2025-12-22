/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the VRGDAs project under the MIT license.
 * https://github.com/transmissions11/VRGDAs
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {
  wadLn,
  wadMul,
  wadExp,
  unsafeWadMul,
  toWadUnsafe
} from "solmate/src/utils/SignedWadMath.sol";

/**
 * @title VRGDAMath
 *
 * @dev Stateless library for performing Variable Rate Gradual Dutch Auction
 * (VRGDA) calculations
 */
library VRGDAMath {
  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  int256 internal constant ONE_WAD = 1e18;

  //////////////////////////////////////////////////////////////////////////////
  // Pricing logic
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Calculate the price of a token according to the VRGDA formula
   *
   * @param targetPrice Target price for a token if sold on pace, scaled by 1e18
   * @param priceDecayConstant The precomputed decay constant for price decay,
   *        scaled by 1e18
   * @param timeSinceStart Time passed since the VRGDA began, scaled by 1e18
   * @param sold The total number of tokens that have been sold so far
   *
   * @return The price of a token according to VRGDA, scaled by 1e18
   */
  function getVRGDAPrice(
    int256 targetPrice,
    int256 priceDecayConstant,
    int256 timeSinceStart,
    uint256 sold
  ) internal pure returns (uint256) {
    unchecked {
      return
        uint256(
          wadMul(
            targetPrice,
            wadExp(
              unsafeWadMul(
                priceDecayConstant,
                // Theoretically calling toWadUnsafe with sold can silently
                // overflow but under any reasonable circumstance it will never
                // be large enough. We use sold + 1 as the VRGDA formula's n
                // param represents the nth token and sold is the n-1th token.
                timeSinceStart -
                  getTargetSaleTime(toWadUnsafe(sold + 1), priceDecayConstant)
              )
            )
          )
        );
    }
  }

  /**
   * @dev Given a number of tokens sold, return the target time that number
   * of tokens should be sold by
   *
   * @param sold A number of tokens sold, scaled by 1e18, to get the
   *        corresponding target sale time for
   * @param priceDecayConstant The precomputed decay constant for price decay,
   *        scaled by 1e18
   *
   * @return The target time the tokens should be sold by, scaled by 1e18,
   *         where the time is relative, such that 0 means the tokens should be sold immediately.
   */
  function getTargetSaleTime(
    int256 sold,
    int256 priceDecayConstant
  ) internal pure returns (int256) {
    // Example: In future, implement logic for target sale time based on
    // VRGDA formula using the price decay constant. Return the expected
    // target sale time for optimization. This function can be optimized
    // further by caching intermediate values if required.

    // Placeholder implementation:
    return wadLn(sold + 1) / priceDecayConstant;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Utility functions for initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Precompute the decay constant for a given price decay rate to
   * optimize performance
   *
   * @param priceDecayRate The percentage rate at which the price decays per
   *        unit of time, scaled by 1e18
   *
   * @return The precomputed decay constant for use in VRGDA pricing logic.
   */
  function precomputeDecayConstant(
    int256 priceDecayRate
  ) internal pure returns (int256) {
    // The decay constant is precomputed using the natural log to avoid
    // recalculating during price evaluation
    return wadLn(ONE_WAD - priceDecayRate);
  }
}
