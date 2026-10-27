#!/bin/sh
# Install a per-user launcher for Twiking (no root, no system files).
#
#   ./scripts/install.sh              install
#   ./scripts/install.sh --uninstall  remove the launcher
set -e
cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
DESKTOP_DIR="$HOME/.local/share/applications"
ENTRY="$DESKTOP_DIR/twiking.desktop"

if [ "$1" = "--uninstall" ]; then
  rm -f "$ENTRY"
  update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
  echo "Removed $ENTRY"
  exit 0
fi

if [ ! -x "$APP_DIR/node_modules/.bin/electron" ]; then
  echo "Dependencies are missing. Run 'npm install' in $APP_DIR first." >&2
  exit 1
fi

mkdir -p "$DESKTOP_DIR"
cat > "$ENTRY" <<EOF
[Desktop Entry]
Type=Application
Name=Twiking
GenericName=Desktop mod platform
Comment=Windhawk-style, reversible mods for the Linux desktop
Exec=$APP_DIR/node_modules/.bin/electron $APP_DIR
Icon=$APP_DIR/assets/icon.png
Terminal=false
Categories=Settings;DesktopSettings;
Keywords=theme;tweak;customize;mods;gnome;
StartupWMClass=Twiking
EOF

update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
echo "Installed launcher: $ENTRY"
echo "Twiking should now appear in your application menu."
