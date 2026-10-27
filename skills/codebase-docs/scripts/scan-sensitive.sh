#!/usr/bin/env bash
# Flag likely secrets and personal data in a docs folder. Prints path:line:rule only, never the
# matched text, so the report is safe to read in a transcript. A heuristic: a clean run does not
# prove the docs are clean, so still review the pages by hand.
# Usage: scripts/scan-sensitive.sh <docs-dir>
# Exit: 0 clean, 1 findings to review, 2 scan error.
set -uo pipefail

dir=${1:-}
[ -n "$dir" ] && [ -d "$dir" ] || { echo "usage: $0 <docs-dir>" >&2; exit 2; }

findings=0
scan() {
  local rule=$1 pattern=$2 filter=${3:-}
  local out status
  out=$(grep -rnoIE --include='*.md' --include='*.txt' --include='*.yml' --include='*.yaml' \
    --exclude-dir=node_modules --exclude-dir=.git "$pattern" "$dir")
  status=$?
  [ "$status" -gt 1 ] && { echo "scan error in rule $rule" >&2; exit 2; }
  [ -n "$filter" ] && out=$(printf '%s\n' "$out" | grep -vE "$filter")
  [ -z "$out" ] && return 0
  printf '%s\n' "$out" | awk -F: -v r="$rule" 'NF >= 3 { print $1 ":" $2 ":" r }' | sort -u
  findings=$((findings + $(printf '%s\n' "$out" | wc -l)))
}

scan email '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' ':[^@]+@example\.(com|org|net)$'
scan credential-url '[a-z][a-z0-9+.-]*://[^/ :@]+:[^@ /]+@'
scan key-format '(sk_live_|pk_live_|rk_live_|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[abprs]-|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|glpat-|eyJ[A-Za-z0-9_-]{10,}\.eyJ|-----BEGIN [A-Z ]*PRIVATE KEY)'
scan secret-assignment '[A-Za-z_]*(SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)[A-Za-z_]*[[:space:]]*[=:][[:space:]]*["'\'']?[A-Za-z0-9/+_.-]{8,}'
scan phone '\+[0-9]{1,3}[ .-]?[0-9][0-9 .-]{7,}[0-9]'
scan long-number '\b[0-9]{6,}\b'

echo "$findings finding(s) in $dir" >&2
[ "$findings" -eq 0 ] && exit 0 || exit 1
