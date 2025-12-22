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

# Root project directory
ROOT_DIR="${SCRIPT_DIR}/.."

# Networks directory
NETWORK_DIR="${ROOT_DIR}/src/networks"

#
# Sort the network by contract name
#

for f in "${NETWORK_DIR}"/*.json; do
  jq '.contracts |= (to_entries | sort_by(.key) | from_entries)' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
