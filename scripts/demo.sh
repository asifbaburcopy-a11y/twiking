#!/bin/sh
# Run Twiking against a disposable fake desktop instead of yours.
#
#   ./scripts/demo.sh                          # normal window
#   ./scripts/demo.sh --route='#/mod/gtk-theme' --click='[data-action="enable"]'
#
# The fake HOME contains a fake `gsettings` binary, so enabling a mod in the
# demo changes nothing on the real system. Great for reviewing or for trying a
# mod before letting it near your desktop.
set -e
cd "$(dirname "$0")/.."

J="$(node tests/sandbox.js)"
FIELD() { node -e 'process.stdout.write(JSON.parse(process.argv[1])[process.argv[2]])' "$J" "$1"; }

TWIKING_HOME="$(FIELD HOME)"
TWIKING_DATA_DIR="$(FIELD DATA)"
GS_DB="$(FIELD GSDB)"
export TWIKING_HOME TWIKING_DATA_DIR GS_DB
export PATH="$(FIELD BIN):$PATH"
export DISPLAY="${DISPLAY:-:0}"

exec ./node_modules/.bin/electron . --no-sandbox --disable-gpu "$@"
