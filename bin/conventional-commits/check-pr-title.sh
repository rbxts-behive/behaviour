#!/usr/bin/env bash
# Validate that a PR title follows Conventional Commits.
#
# Usage: bin/conventional-commits/check-pr-title.sh <title>
set -euo pipefail

source "$(dirname "$0")/_lib.sh"

TITLE="${1:?usage: $0 <title>}"

failed=0
if ! validate_header "PR title" "$TITLE"; then
	failed=1
elif [[ "$HEADER_TYPE" == revert ]]; then
	# Format-only: the PR job runs on a shallow clone, so hash existence
	# is only verified once the revert lands on master.
	validate_revert_reference "PR title" "$TITLE" no-verify || failed=1
fi

if [[ "$failed" -ne 0 ]]; then
	print_expected_format
	exit 1
fi
