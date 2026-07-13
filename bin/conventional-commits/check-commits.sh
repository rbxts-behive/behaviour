#!/usr/bin/env bash
# Validate that every commit in a push range follows Conventional Commits.
# Merge commits are NOT exempt (this repo rebases/squashes — merges should
# never land on master). On an initial push (all-zero before SHA), only the
# head commit is checked so historical commits never retro-fail.
#
# Usage: bin/conventional-commits/check-commits.sh <before-sha> <after-sha>
set -euo pipefail

source "$(dirname "$0")/_lib.sh"

BEFORE="${1:?usage: $0 <before-sha> <after-sha>}"
AFTER="${2:?usage: $0 <before-sha> <after-sha>}"

if [[ "$BEFORE" =~ ^0+$ ]]; then
	range=(-1 "$AFTER")
else
	range=("$BEFORE..$AFTER")
fi

failed=0
while IFS=$'\t' read -r sha subject; do
	if ! validate_header "Commit ${sha:0:7}" "$subject"; then
		failed=1
	elif [[ "$HEADER_TYPE" == revert ]]; then
		# Reverts may carry the reference in the subject or the body
		# (e.g. git revert's default "This reverts commit <sha>.").
		body=$(git show -s --format=%B "$sha")
		validate_revert_reference "Commit ${sha:0:7}" "$body" verify || failed=1
	fi
done < <(git log --format='%H%x09%s' "${range[@]}")

if [[ "$failed" -ne 0 ]]; then
	print_expected_format
	exit 1
fi
