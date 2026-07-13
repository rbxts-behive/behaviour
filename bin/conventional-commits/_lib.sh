# shellcheck shell=bash
# Shared Conventional Commits definitions. Source this file — do not execute it.

PATTERN='^(feat|fix|docs|chore|refactor|test|ci|build|perf|style|revert)(\([a-zA-Z0-9._-]+\))?!?: .+'
TYPES='feat, fix, docs, chore, refactor, test, ci, build, perf, style, revert'
HASH_RE='[0-9a-f]{5,40}'
PR_RE='#[0-9]+'

print_expected_format() {
	echo ""
	echo "Expected format: <type>(<scope>)?: <description>"
	echo "Allowed types: $TYPES"
	echo "Rules: description starts lowercase (acronyms OK), no trailing period,"
	echo "       no fixup!/squash! or merge commits, reverts must reference the"
	echo "       reverted commit hash (>=5 hex chars) or PR number (#N)"
}

# validate_header <what> <header>
# Validates a commit subject line or PR title. Prints ::error:: annotations and
# returns non-zero on failure. On a successful base-pattern match, sets
# HEADER_TYPE to the conventional type (e.g. "feat", "revert") for the caller.
validate_header() {
	local what=$1 header=$2
	HEADER_TYPE=""

	if [[ "$header" =~ ^(fixup|squash)! ]]; then
		echo "::error::$what is an autosquash artifact that should have been squashed: \"$header\""
		return 1
	fi

	if [[ ! "$header" =~ $PATTERN ]]; then
		echo "::error::$what does not follow Conventional Commits: \"$header\""
		return 1
	fi
	HEADER_TYPE="${BASH_REMATCH[1]}"

	local errors=0
	if [[ "$header" == *. ]]; then
		echo "::error::$what must not end with a period: \"$header\""
		errors=1
	fi

	# Description must start lowercase — unless the second character is also
	# uppercase, so acronyms ("API support") are not falsely flagged.
	local desc="${header#*: }"
	if [[ "$desc" =~ ^[A-Z] && ! "$desc" =~ ^[A-Z][A-Z] ]]; then
		echo "::error::$what description must start lowercase: \"$header\""
		errors=1
	fi

	return "$errors"
}

# validate_revert_reference <what> <text> <verify|no-verify>
# Reverts must reference what they revert: a PR number (#N) or a commit hash
# (>=5 hex chars). With <verify>, at least one referenced hash must resolve to
# a commit in the repository (requires a full clone).
validate_revert_reference() {
	local what=$1 text=$2 verify=$3

	if [[ "$text" =~ $PR_RE ]]; then
		return 0
	fi

	local hashes
	hashes=$(grep -oE "\b${HASH_RE}\b" <<<"$text" || true)

	if [[ -z "$hashes" ]]; then
		echo "::error::$what must reference the reverted commit hash (>=5 hex chars) or PR number (#N)"
		return 1
	fi

	if [[ "$verify" == verify ]]; then
		local hash
		while read -r hash; do
			if git cat-file -e "$hash^{commit}" 2>/dev/null; then
				return 0
			fi
		done <<<"$hashes"
		echo "::error::$what references no commit hash that exists in this repository"
		return 1
	fi

	return 0
}
