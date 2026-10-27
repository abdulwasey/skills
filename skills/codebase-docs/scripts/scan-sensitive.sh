#!/usr/bin/env bash
# Flag likely secrets and personal data in a docs folder. Review every hit by hand.
# Usage: scripts/scan-sensitive.sh <docs-dir> [allowed-email-domain]
dir=${1:?docs dir}; allow=${2:-example.com}
echo "== emails (outside $allow and example.*)"
grep -rnoE "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}" "$dir" | grep -vE "@($allow|example\.(com|org))" | head -50
echo "== credentials in URLs"
grep -rnE "[a-z]+://[^/ :]+:[^@ /]+@" "$dir" | head -20
echo "== key-shaped strings"
grep -rnE "(sk_live_|pk_live_|rk_live_|AKIA[0-9A-Z]{12}|xox[bp]-|ghp_[A-Za-z0-9]{20}|eyJ[A-Za-z0-9_-]{20,}\.|-----BEGIN)" "$dir" | head -20
echo "== phone-number-shaped strings"
grep -rnoE "\+[0-9]{1,3}[ -]?[0-9][0-9 -]{8,}" "$dir" | head -20
echo "== long digit runs (IDs copied from fixtures?)"
grep -rnoE "\b[0-9]{6,}\b" "$dir" | grep -vE ":(20[0-9]{2}|[0-9]{10,})$" | head -30
