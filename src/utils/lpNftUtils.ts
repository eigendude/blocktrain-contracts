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

//
// LP-NFT utility functions
//

/**
 * @description Extracts and parses JSON metadata from a base64-encoded URI
 *
 * @param {string} uri - The base64-encoded JSON URI
 *
 * @returns { { name: string; description: string; image: string } | null }
 *          Returns an object with metadata properties, or null if decoding fails
 */
function extractJSONFromURI(uri: string): {
  name: string;
  description: string;
  image: string;
} | null {
  // Prefix for base64-encoded JSON data in URIs
  const prefix: string = "data:application/json;base64,";

  // Check if the URI starts with the expected prefix
  if (!uri.startsWith(prefix)) {
    console.error("URI does not start with the expected prefix");

    // Return null to indicate the incorrect format
    return null;
  }

  // Remove the prefix and decode the JSON string
  const encodedJSON: string = uri.substring(prefix.length);
  let decodedJSON: string;

  try {
    decodedJSON = Buffer.from(encodedJSON, "base64").toString("utf8");
  } catch (error) {
    console.error("Failed to decode base64 JSON:", error);

    // Return null on decoding error
    return null;
  }

  // Parse the JSON string to an object
  try {
    return JSON.parse(decodedJSON);
  } catch (error) {
    console.error("Failed to parse JSON:", error);

    // Return null on parsing error
    return null;
  }
}

export { extractJSONFromURI };
