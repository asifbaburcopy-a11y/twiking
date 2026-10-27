#!/bin/sh
# Capture the running UI to screenshots/ for docs. Uses the --screenshot flag
# built into main.js, so no external screenshot tool is needed.
set -e
cd "$(dirname "$0")/.."
export DISPLAY="${DISPLAY:-:0}"
ROUTE="${1:-}"
OUT="${2:-screenshots/explore.png}"
if [ -n "$ROUTE" ]; then
  ./node_modules/.bin/electron . --no-sandbox --disable-gpu --route="$ROUTE" --screenshot="$OUT"
else
  ./node_modules/.bin/electron . --no-sandbox --disable-gpu --screenshot="$OUT"
fi
