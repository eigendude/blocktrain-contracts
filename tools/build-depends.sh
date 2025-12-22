#!/bin/bash
################################################################################
#
#  Copyright (C) 2025-2026 brick.credit
#  https://github.com/brick-dot-credit/brick-contracts
#
#  This file is derived from the Ultrachess project under the Apache 2.0 license.
#  Copyright (C) 2022-2023 Ultrachess team
#
#  SPDX-License-Identifier: GPL-3.0-or-later
#  See the file LICENSE.txt for more information.
#
################################################################################

#
# Build script for dependencies
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

#
# Environment paths
#

# Get the absolute path to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Directory of the dependency build definitions
DEPENDS_DIR="${SCRIPT_DIR}/depends"

# Directory of the downloaded repos
REPO_DIR="${SCRIPT_DIR}/repos"

# Root project directory
ROOT_DIR="${SCRIPT_DIR}/.."

# Contract directory
CONTRACT_DIR="${ROOT_DIR}/contracts"

# Depends install directory
INSTALL_DIR="${CONTRACT_DIR}/depends"

# Contract interface directory
INTERFACE_DIR="${CONTRACT_DIR}/interfaces"

# Ensure directories exist
mkdir -p "${REPO_DIR}"
mkdir -p "${INSTALL_DIR}"
mkdir -p "${INTERFACE_DIR}"

#
# Import dependencies
#

source "${DEPENDS_DIR}/canonical-weth/package.sh"
source "${DEPENDS_DIR}/openzeppelin-v3/package.sh"
source "${DEPENDS_DIR}/uniswap-lib/package.sh"
source "${DEPENDS_DIR}/uniswap-v3-core/package.sh"
source "${DEPENDS_DIR}/uniswap-v3-periphery/package.sh"
source "${DEPENDS_DIR}/uniswap-v3-staker/package.sh"

#
# Checkout dependencies
#

checkout_canonical_weth
checkout_openzeppelin_v3
checkout_uniswap_lib
checkout_uniswap_v3_core
checkout_uniswap_v3_periphery
checkout_uniswap_v3_staker

#
# Patch dependencies
#

patch_canonical_weth
patch_openzeppelin_v3
patch_uniswap_lib
patch_uniswap_v3_core
patch_uniswap_v3_periphery
patch_uniswap_v3_staker

#
# Build dependencies
#

build_canonical_weth
build_openzeppelin_v3
build_uniswap_lib
build_uniswap_v3_core
build_uniswap_v3_periphery
build_uniswap_v3_staker

#
# Install dependencies
#

install_canonical_weth
install_openzeppelin_v3
install_uniswap_lib
install_uniswap_v3_core
install_uniswap_v3_periphery
install_uniswap_v3_staker
