'use strict';
/* Shared throwaway environment for engine tests: a fake HOME, a fake
 * `gsettings` binary backed by a directory of key=value files, and a fake
 * .desktop entry. Nothing here can reach the real desktop. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'twiking-test-'));
const HOME = path.join(ROOT, 'home');
const DATA = path.join(HOME, '.local', 'share', 'twiking');
const BIN = path.join(ROOT, 'bin');
const GSDB = path.join(ROOT, 'gsdb');

for (const dir of [
  HOME, BIN, GSDB,
  path.join(HOME, '.local', 'share', 'applications'),
  path.join(HOME, '.config', 'gtk-3.0'),
  path.join(HOME, '.config', 'gtk-4.0'),
]) fs.mkdirSync(dir, { recursive: true });

process.env.TWIKING_HOME = HOME;
process.env.TWIKING_DATA_DIR = DATA;
process.env.GS_DB = GSDB;
process.env.PATH = `${BIN}:${process.env.PATH}`;

fs.writeFileSync(
  path.join(BIN, 'gsettings'),
  `#!/bin/sh
DB="$GS_DB"
cmd="$1"
case "$cmd" in
  get)
    s="$2"; k="$3"; f="$DB/$s"
    [ -f "$f" ] || { echo "No such schema '$s'" >&2; exit 1; }
    line=$(grep "^$k=" "$f" | head -1)
    [ -n "$line" ] || { echo "No such key '$k'" >&2; exit 1; }
    printf '%s\\n' "\${line#*=}"
    ;;
  set)
    s="$2"; k="$3"; shift 3; v="$*"; f="$DB/$s"
    [ -f "$f" ] || { echo "No such schema '$s'" >&2; exit 1; }
    grep -q "^$k=" "$f" || { echo "No such key '$k'" >&2; exit 1; }
    tmp="$f.tmp.$$"
    K="$k" V="$v" awk 'BEGIN{k=ENVIRON["K"]; v=ENVIRON["V"]; done=0}
      { if (!done && index($0, k "=") == 1) { print k "=" v; done=1 } else print }
      END { if (!done) print k "=" v }' "$f" > "$tmp"
    mv "$tmp" "$f"
    ;;
  reset)
    s="$2"; k="$3"; f="$DB/$s"
    [ -f "$f" ] || exit 0
    tmp="$f.tmp.$$"
    K="$k" awk 'BEGIN{k=ENVIRON["K"]} index($0, k "=") != 1' "$f" > "$tmp"
    mv "$tmp" "$f"
    ;;
  list-keys)
    s="$2"; f="$DB/$s"
    [ -f "$f" ] || { echo "No such schema '$s'" >&2; exit 1; }
    cut -d= -f1 "$f"
    ;;
  *)
    echo "unsupported" >&2; exit 1
    ;;
esac
`,
  { mode: 0o755 }
);

/* dconf stub: the engine asks dconf whether a key was explicitly set, so that
 * reverting a mod resets a key that only ever held a schema default instead of
 * pinning the default as an explicit value. Map that onto the same fake store. */
fs.writeFileSync(
  path.join(BIN, 'dconf'),
  `#!/bin/sh
DB="$GS_DB"
cmd="$1"; p="$2"
case "$cmd" in
  read)
    rel="\${p#/}"
    key="\${rel##*/}"
    schema="$(printf '%s' "\${rel%/*}" | tr '/' '.')"
    f="$DB/$schema"
    [ -f "$f" ] || exit 0
    line=$(grep "^$key=" "$f" | head -1)
    [ -n "$line" ] || exit 0
    printf '%s\\n' "\${line#*=}"
    ;;
  *)
    exit 0
    ;;
esac
`,
  { mode: 0o755 }
);

/* Stubs for the privileged installers: tests and the demo must never be able to
 * install real packages, and clicking Install in the demo should still exercise
 * the streaming UI. */
for (const [name, body] of [
  ['pkexec', ['echo "pkexec (stub): $*"', 'sleep 0.3', 'echo "Reading package lists... Done"', 'echo "Building dependency tree... Done"', 'echo "The following NEW packages will be installed:"', 'echo "  ${6:-package}"', 'echo "0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded."', 'sleep 0.3', 'echo "Setting up ${6:-package} ..."', 'exit 0']],
  ['flatpak', ['echo "flatpak (stub): $*"', 'sleep 0.3', 'echo "Installing…"', 'exit 0']],
]) {
  const file = path.join(BIN, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body.join('\n')}\n`, { mode: 0o755 });
}

function seed(schema, values) {
  const body = Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n');
  fs.writeFileSync(path.join(GSDB, schema), `${body}\n`);
}

seed('org.gnome.desktop.interface', {
  'clock-show-seconds': 'false',
  'clock-show-date': 'true',
  'clock-show-weekday': 'false',
  'clock-format': "'24h'",
  'gtk-theme': "'ZorinBlue-Dark'",
  'color-scheme': "'prefer-dark'",
  'cursor-size': '24',
  'cursor-theme': "'Adwaita'",
  'cursor-blink': 'true',
  'cursor-blink-time': '1200',
  'overlay-scrolling': 'true',
  'gtk-enable-primary-paste': 'true',
  'icon-theme': "'ZorinBlue-Dark'",
  'enable-animations': 'true',
  'text-scaling-factor': '1.0',
  'font-antialiasing': "'grayscale'",
  'font-rgba-order': "'rgb'",
  'font-hinting': "'slight'",
  'enable-hot-corners': 'false',
  'show-battery-percentage': 'true',
  'font-name': "'Inter 10'",
  'document-font-name': "'Sans 10'",
  'monospace-font-name': "'JetBrains Mono 10'",
});
seed('org.gnome.desktop.wm.preferences', {
  'button-layout': "'appmenu:minimize,maximize,close'",
  'focus-mode': "'click'",
  'raise-on-click': 'true',
  'action-double-click-titlebar': "'toggle-maximize'",
  'num-workspaces': '4',
  'mouse-button-modifier': "'<Super>'",
  'resize-with-right-button': 'false',
  'action-middle-click-titlebar': "'none'",
  'action-right-click-titlebar': "'menu'",
  'focus-new-windows': "'smart'",
  'auto-raise': 'false',
  'auto-raise-delay': '500',
  'workspace-names': '@as []',
});
seed('org.gnome.desktop.calendar', { 'show-weekdate': 'false' });
seed('org.gnome.mutter', { 'dynamic-workspaces': 'true' });
seed('org.gnome.desktop.peripherals.touchpad', {
  'tap-to-click': 'true',
  'natural-scroll': 'true',
  'disable-while-typing': 'true',
  'two-finger-scrolling-enabled': 'true',
  'edge-scrolling-enabled': 'false',
});
seed('org.gnome.nautilus.icon-view', { 'default-zoom-level': "'small-plus'" });
seed('org.gnome.settings-daemon.plugins.media-keys', { 'volume-step': '6' });
seed('org.gnome.nautilus.preferences', {
  'show-hidden-files': 'false',
  'click-policy': "'double'",
  'show-image-thumbnails': "'local-only'",
  'show-directory-item-counts': "'never'",
});
seed('org.gtk.Settings.FileChooser', { 'show-hidden': 'false' });
seed('org.gnome.desktop.background', {
  'picture-uri': "'file:///usr/share/backgrounds/a.jpg'",
  'picture-uri-dark': "'file:///usr/share/backgrounds/b.jpg'",
  'picture-options': "'zoom'",
  'primary-color': "'#000000'",
  'color-shading-type': "'solid'",
  'picture-opacity': '100',
});
seed('org.gnome.desktop.notifications', {
  'show-banners': 'true',
  'show-in-lock-screen': 'true',
});
seed('org.gnome.desktop.sound', {
  'event-sounds': 'true',
  'input-feedback-sounds': 'false',
  'allow-volume-above-100-percent': 'false',
});
seed('org.gnome.desktop.peripherals.mouse', {
  'accel-profile': "'default'",
  'speed': '0.0',
  'natural-scroll': 'false',
  'middle-click-emulation': 'false',
  'left-handed': 'false',
});
seed('org.gnome.desktop.peripherals.keyboard', {
  'repeat': 'true',
  'delay': 'uint32 500',
  'repeat-interval': 'uint32 30',
  'numlock-state': 'false',
});
seed('org.gnome.mutter', {
  'dynamic-workspaces': 'true',
  'experimental-features': '@as []',
  'overlay-key': "'Super_L'",
  'draggable-border-width': '10',
  'center-new-windows': 'true',
  'auto-maximize': 'true',
  'attach-modal-dialogs': 'true',
  'focus-change-on-pointer-rest': 'true',
  'locate-pointer-key': "'Control_L'",
});
seed('org.gnome.shell', {
  'enabled-extensions': "['user-theme@gnome-shell-extensions.gcampax.github.com']",
  'disabled-extensions': '@as []',
});
seed('org.gnome.shell.app-switcher', { 'current-workspace-only': 'false' });
seed('org.gnome.shell.window-switcher', { 'current-workspace-only': 'false' });
seed('org.gnome.shell.extensions.user-theme', { 'name': "'ZorinBlue-Dark'" });
seed('org.gnome.shell.extensions.zorin-taskbar', {
  'panel-position': "'BOTTOM'",
  'intellihide': 'false',
  'isolate-workspaces': 'false',
  'panel-size': '48',
  'click-action': "'CYCLE-MIN'",
  'shift-click-action': "'MINIMIZE'",
  'middle-click-action': "'LAUNCH'",
  'shift-middle-click-action': "'LAUNCH'",
  'scroll-icon-action': "'CYCLE_WINDOWS'",
  'activate-single-window': 'true',
  'customize-click': 'true',
  'dot-style-focused': "'CILIORA'",
  'dot-style-unfocused': "'DOTS'",
  'global-border-radius': '3',
  'progress-show-bar': 'true',
  'progress-show-count': 'true',
  'show-favorites': 'true',
  'show-running-apps': 'true',
  'group-apps': 'true',
  'group-apps-label-max-width': '160',
  'show-tooltip': 'true',
  'show-window-previews': 'true',
  'window-preview-size': '200',
  'isolate-monitors': 'false',
  'trans-use-custom-opacity': 'false',
  'trans-panel-opacity': '0.40000000000000002',
  'trans-use-dynamic-opacity': 'false',
  'trans-dynamic-behavior': "'ALL_WINDOWS'",
  'trans-use-border': 'false',
  'trans-border-width': '1',
  'trans-border-use-custom-color': 'false',
  'trans-border-custom-color': "'rgba(200,200,200,0.2)'",
  'show-showdesktop-icon': 'true',
  'showdesktop-button-width': '8',
  'show-showdesktop-hover': 'true',
  'hot-keys': 'true',
  'shortcut-num-keys': "'NUM_ROW'",
  'intellihide-behaviour': "'FOCUSED_WINDOWS'",
  'intellihide-use-pointer': 'true',
  'intellihide-revealed-hover': 'true',
  'intellihide-show-in-fullscreen': 'false',
  'intellihide-show-on-notification': 'false',
  'preview-middle-click-close': 'true',
  'multi-monitors': 'false',
  'show-favorites-all-monitors': 'true',
  'panel-element-positions-monitors-sync': 'true',
  'intellihide-only-secondary': 'false',
  'trans-dynamic-anim-target': '0.80000000000000004',
});

seed('org.gnome.settings-daemon.plugins.color', {
  'night-light-enabled': 'false',
  'night-light-temperature': 'uint32 2700',
  'night-light-schedule-automatic': 'true',
  'night-light-schedule-from': '20.0',
  'night-light-schedule-to': '6.0',
});

seed('org.gnome.settings-daemon.plugins.power', {
  'sleep-inactive-ac-timeout': '3600',
  'sleep-inactive-ac-type': "'nothing'",
  'sleep-inactive-battery-timeout': '900',
  'sleep-inactive-battery-type': "'suspend'",
  'lid-close-ac-action': "'suspend'",
  'lid-close-battery-action': "'suspend'",
  'power-button-action': "'suspend'",
  'idle-dim': 'true',
});

seed('org.gnome.desktop.a11y.applications', { 'screen-magnifier-enabled': 'false' });
seed('org.gnome.desktop.a11y.magnifier', {
  'mag-factor': '2.0',
  'mouse-tracking': "'proportional'",
  'screen-position': "'full-screen'",
  'show-cross-hairs': 'false',
  'invert-lightness': 'false',
});

seed('org.gnome.shell.extensions.zorin-tiling-shell', {
  'enable-tiling-system': 'true',
  'enable-autotiling': 'false',
  'enable-snap-assist': 'true',
  'active-screen-edges': 'true',
  'inner-gaps': 'uint32 4',
  'edge-tiling-offset': 'uint32 16',
  'enable-window-border': 'false',
});
seed('org.gnome.shell.extensions.zorin-desktop-icons', {
  'icon-size': "'standard'",
  'show-trash': 'true',
  'show-home': 'true',
  'keep-arranged': 'false',
  'dark-text-in-labels': 'false',
  'show-volumes': 'false',
  'show-network-volumes': 'false',
});

seed('org.gnome.shell.extensions.zorin-magic-lamp-effect', {
  'duration': '275.0',
  'effect': "'default'",
  'x-tiles': '10.0',
  'y-tiles': '10.0',
});
seed('org.gnome.shell.extensions.zorin-window-move-effect', {
  'friction': '5.0',
  'mass': '55.0',
  'maximize-effect': 'true',
  'resize-effect': 'false',
  'speedup-factor-divider': '10.0',
  'spring-k': '8.5',
  'x-tiles': '6.0',
  'y-tiles': '6.0',
});

fs.writeFileSync(
  path.join(HOME, '.local', 'share', 'applications', 'fake-electron.desktop'),
  `[Desktop Entry]
Type=Application
Name=Fake Electron App
Comment=Only used by the tests
Exec=/usr/bin/fake-electron %U
Icon=fake
Terminal=false
Categories=Utility;
`
);

/* Read a value straight out of the fake database (never through the engine). */
function gsValue(schema, key) {
  const file = path.join(GSDB, schema);
  const line = fs.readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${key}=`));
  return line === undefined ? undefined : line.slice(key.length + 1);
}

function setGs(schema, key, raw) {
  const file = path.join(GSDB, schema);
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l && !l.startsWith(`${key}=`));
  lines.push(`${key}=${raw}`);
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
}

module.exports = { ROOT, HOME, DATA, GSDB, BIN, seed, gsValue, setGs };

/* `node tests/sandbox.js` prints the paths, so scripts/demo.sh can launch the
 * real app against this fake desktop and change things safely. */
if (require.main === module) {
  console.log(JSON.stringify({ ROOT, HOME, DATA, GSDB, BIN }));
}
