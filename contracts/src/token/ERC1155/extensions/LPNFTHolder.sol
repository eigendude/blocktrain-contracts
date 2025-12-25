/*
 * Copyright (C) 2025-2026 brick.credit
 * https://github.com/brick-dot-credit/brick-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import {IERC1155Enumerable} from "../../../interfaces/token/ERC1155/extensions/IERC1155Enumerable.sol";
import {ILPNFT} from "../../../interfaces/token/ERC1155/ILPNFT.sol";
import {ILPNFTHolder} from "../../../interfaces/token/ERC1155/extensions/ILPNFTHolder.sol";
import {ILPSFT} from "../../../interfaces/token/ERC1155/ILPSFT.sol";

import {ERC1155Helpers} from "../utils/ERC1155Helpers.sol";

import {ERC1155NonReentrant} from "./ERC1155NonReentrant.sol";

/**
 * @title LP-NFT holder for SFT contract
 */
abstract contract LPNFTHolder is ILPNFTHolder, ERC1155NonReentrant {
  using Arrays for uint256[];

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-NFT used for clones
   */
  ILPNFT public lpNftTemplate;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mapping tokenId -> LP-NFT
   */
  mapping(uint256 tokenId => ILPNFT token) internal _tokenIdToToken;

  /**
   * @dev Mapping LP-NFT -> tokenId
   */
  mapping(ILPNFT token => uint256 tokenId) internal _tokenToTokenId;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param lpNftTemplate_ The LP-NFT contract used for clones
   */
  function __LPNFTHolder_init(
    address lpNftTemplate_
  ) internal onlyInitializing {
    // Validate parameters
    require(lpNftTemplate_ != address(0), "Invalid LPNFT");

    // Initialize routes
    lpNftTemplate = ILPNFT(lpNftTemplate_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ERC1155NonReentrant} and {ILPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC1155Upgradeable) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(ILPNFTHolder).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC1155Upgradeable} via {ERC1155NonReentrant}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC1155Upgradeable-_update}
   */
  // slither-disable-next-line reentrancy-events
  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal virtual override nonReentrantLPNFTHolder {
    // Cap user-controlled batch sizes to bound gas and Base calldata/L1 fees.
    if (ids.length > MAX_BATCH) {
      revert BatchTooLarge(ids.length, MAX_BATCH);
    }

    // Validate parameters
    ERC1155Helpers.checkAmountArray(ids, values);

    // Translate parameters
    uint256 tokenCount = ids.length;

    for (uint256 i = 0; i < tokenCount; i++) {
      // Translate parameters
      uint256 tokenId = ids.unsafeMemoryAccess(i);

      // Handle minting
      if (from == address(0)) {
        // Read state
        ILPNFT existingToken = _tokenIdToToken[tokenId];

        // Validate state
        if (address(existingToken) != address(0)) {
          revert ILPSFT.LPSFTInvalidToken(tokenId);
        }

        // Deploy clone
        ILPNFT token = ILPNFT(Clones.clone(address(lpNftTemplate)));

        // Update state
        _tokenIdToToken[tokenId] = token;
        _tokenToTokenId[token] = tokenId;

        // Initialize clone
        // slither-disable-next-line reentrancy-benign,reentrancy-no-eth
        token.initialize(tokenId);
      }

      // Handle burning
      if (to == address(0)) {
        // Read state
        ILPNFT token = _tokenIdToToken[tokenId];

        // Validate state
        if (address(token) == address(0)) {
          revert ILPSFT.LPSFTInvalidToken(tokenId);
        }

        // Update state
        delete _tokenIdToToken[tokenId];
        delete _tokenToTokenId[token];

        // Deinitialize clone
        token.deinitialize(from);
      }
    }

    // Call ancestor
    super._update(from, to, ids, values);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ILPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILPNFTHolder-addressToTokenId}
   */
  function addressToTokenId(
    address tokenAddress
  ) public view override returns (uint256) {
    // Validate parameters
    if (tokenAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidAddress(tokenAddress);
    }

    return _tokenToTokenId[ILPNFT(tokenAddress)];
  }

  /**
   * @dev See {ILPNFTHolder-addressesToTokenIds}
   */
  function addressesToTokenIds(
    address[] memory tokenAddresses
  ) public view override returns (uint256[] memory) {
    // Translate parameters
    uint256 tokenCount = tokenAddresses.length;

    // Return value
    uint256[] memory tokenIds = new uint256[](tokenCount);

    // Validate parameters
    for (uint256 i = 0; i < tokenCount; i++) {
      address tokenAddress = tokenAddresses[i];

      // Validate parameters
      if (tokenAddress == address(0)) {
        revert ILPSFT.LPSFTInvalidAddress(tokenAddress);
      }

      tokenIds[i] = _tokenToTokenId[ILPNFT(tokenAddress)];
    }

    return tokenIds;
  }

  /**
   * @dev See {ILPNFTHolder-tokenIdToAddress}
   */
  function tokenIdToAddress(
    uint256 tokenId
  ) public view override returns (address) {
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    return address(_tokenIdToToken[tokenId]);
  }

  /**
   * @dev See {ILPNFTHolder-tokenIdsToAddresses}
   */
  function tokenIdsToAddresses(
    uint256[] memory tokenIds
  ) public view override returns (address[] memory) {
    // Translate parameters
    uint256 tokenCount = tokenIds.length;

    // Return value
    address[] memory tokenAddresses = new address[](tokenCount);

    // Validate parameters
    for (uint256 i = 0; i < tokenCount; i++) {
      uint256 tokenId = tokenIds[i];

      // Validate parameters
      if (tokenId == 0) {
        revert ILPNFT.LPNFTInvalidTokenID();
      }

      tokenAddresses[i] = address(_tokenIdToToken[tokenId]);
    }

    return tokenAddresses;
  }
}
