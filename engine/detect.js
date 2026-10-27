'use strict';
/* Environment + capability detection.
 *
 * Everything the UI shows about "will this mod work here?" comes from here, so
 * a mod can be marked incompatible instead of failing halfway through applying.
 * The theme / icon / cursor / font lists feed the dynamic pickers, so a mod
 * never offers something that isn't installed.
 */
const fs = require('fs');
const path = require('path');
const { run, which } = require('./sh');
const { parseStringArray } = require('./gsettings');

const ELECTRON_HINTS = [
  'code', 'code-insiders', 'vscodium', 'discord', 'discord-canary', 'slack', 'spotify',
  'obsidian', 'notion', 'figma', 'element', 'signal', 'whatsapp', 'telegram-desktop',
  'brave', 'chrome', 'chromium', 'postman', 'insomnia', 'bitwarden', 'ledger-live',
  'zulip', 'rocketchat', 'teams', 'zoom', 'typora', 'marktext', 'joplin', 'balena-etcher',
];

/* Fonts people actually mean when they pick a UI font, listed first. */
const PREFERRED_FONTS = [
  'Inter', 'Cantarell', 'Ubuntu', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans',
  'Adwaita Sans', 'Fira Sans', 'Roboto', 'Open Sans', 'Lato', 'Source Sans 3',
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Ubuntu Mono', 'DejaVu Sans Mono',
  'Noto Sans Mono', 'Liberation Mono', 'Noto Color Emoji',
];

const caches = new Map();
function cached(key, fn) {
  if (!caches.has(key)) caches.set(key, fn());
  return caches.get(key);
}

function resetCache() {
  caches.clear();
}

async function distro() {
  try {
    const text = fs.readFileSync('/etc/os-release', 'utf8');
    const get = (k) => {
      const m = new RegExp(`^${k}="?(.*?)"?$`, 'm').exec(text);
      return m ? m[1] : '';
    };
    return { name: get('NAME'), pretty: get('PRETTY_NAME'), id: get('ID'), version: get('VERSION_ID') };
  } catch {
    return { name: 'Linux', pretty: 'Linux', id: 'linux', version: '' };
  }
}

function desktopName() {
  const raw = (process.env.XDG_CURRENT_DESKTOP || '').split(':').filter(Boolean);
  const known = ['GNOME', 'KDE', 'XFCE', 'MATE', 'Cinnamon', 'Budgie', 'LXQt', 'Deepin', 'Pantheon'];
  const hit = raw.find((d) => known.includes(d));
  return { raw: process.env.XDG_CURRENT_DESKTOP || '', primary: hit || raw[raw.length - 1] || 'Unknown' };
}

function themeRoots() {
  return [
    path.join(require('./paths').home(), '.themes'),
    path.join(require('./paths').home(), '.local', 'share', 'themes'),
    '/usr/share/themes',
  ];
}

function readDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function themes() {
  const out = new Set();
  for (const root of themeRoots()) {
    for (const e of readDir(root)) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      const dir = path.join(root, e.name);
      if (fs.existsSync(path.join(dir, 'gtk-3.0')) || fs.existsSync(path.join(dir, 'gtk-4.0'))) out.add(e.name);
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

/* Icon and cursor themes share directories; a theme can be both (Adwaita is). */
function iconThemes() {
  const out = new Set();
  for (const root of iconRoots()) {
    for (const e of readDir(root)) {
      if (!e.isDirectory()) continue;
      if (fs.existsSync(path.join(root, e.name, 'index.theme'))) out.add(e.name);
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

function cursorThemes() {
  const out = new Set();
  for (const root of iconRoots()) {
    for (const e of readDir(root)) {
      if (!e.isDirectory()) continue;
      if (fs.existsSync(path.join(root, e.name, 'cursors'))) out.add(e.name);
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

function iconRoots() {
  const home = require('./paths').home();
  return [path.join(home, '.icons'), path.join(home, '.local', 'share', 'icons'), '/usr/share/icons'];
}

/* Distinct UI font families from fontconfig, preferred ones first. */
async function fontFamilies() {
  const r = await run('fc-list', [':', 'family']);
  if (!r.ok) return PREFERRED_FONTS.slice();
  const seen = new Set();
  for (const line of r.stdout.split('\n')) {
    for (const raw of line.split(',')) {
      const name = raw.trim();
      if (!name || name.length > 42) continue;
      if (!/^[\x20-\x7e]+$/.test(name)) continue; // skip localised duplicates
      seen.add(name);
    }
  }
  const all = [...seen].sort((a, b) => a.localeCompare(b));
  const preferred = PREFERRED_FONTS.filter((f) => all.includes(f));
  const rest = all.filter((f) => !preferred.includes(f));
  return [...preferred, ...rest];
}

function installedExtensionDirs() {
  const home = require('./paths').home();
  const out = new Set();
  for (const dir of [path.join(home, '.local', 'share', 'gnome-shell', 'extensions'), '/usr/share/gnome-shell/extensions']) {
    for (const e of readDir(dir)) if (e.isDirectory() && !e.name.startsWith('.')) out.add(e.name);
  }
  return [...out];
}

async function enabledExtensions() {
  const r = await run('gsettings', ['get', 'org.gnome.shell', 'enabled-extensions']);
  if (!r.ok) return [];
  return parseStringArray(r.stdout);
}

async function session() {
  const [gsettings, dconf, os, fonts, enabled] = await Promise.all([
    which('gsettings'),
    which('dconf'),
    distro(),
    cached('fonts', fontFamilies),
    enabledExtensions(),
  ]);
  return {
    platform: process.platform,
    distro: os,
    desktop: desktopName(),
    sessionType: process.env.XDG_SESSION_TYPE || (process.env.WAYLAND_DISPLAY ? 'wayland' : 'x11'),
    wayland: !!process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === 'wayland',
    gsettings: !!gsettings,
    dconf: !!dconf,
    desktopFileValidate: !!(await which('desktop-file-validate')),
    themes: themes(),
    icons: iconThemes(),
    cursors: cursorThemes(),
    fonts,
    shellExtensions: installedExtensionDirs(),
    enabledExtensions: enabled,
    gtkCss: {
      '3': fs.existsSync(path.join(require('./paths').home(), '.config', 'gtk-3.0', 'gtk.css')),
      '4': fs.existsSync(path.join(require('./paths').home(), '.config', 'gtk-4.0', 'gtk.css')),
    },
  };
}

/* GNOME 47 renamed the accent setting; expose what is actually available. */
async function supports(key) {
  const r = await run('gsettings', ['list-keys', 'org.gnome.desktop.interface']);
  return r.ok && r.stdout.split('\n').map((s) => s.trim()).includes(key);
}

function electronApps(apps) {
  return apps.filter((a) => {
    const id = a.id.toLowerCase();
    const exec = (a.exec || '').toLowerCase();
    const name = (a.name || '').toLowerCase();
    return ELECTRON_HINTS.some((h) => id.includes(h) || exec.includes(h) || name.includes(h));
  });
}

module.exports = {
  session, distro, themes, iconThemes, cursorThemes, fontFamilies, desktopName,
  supports, electronApps, enabledExtensions, ELECTRON_HINTS, PREFERRED_FONTS, resetCache,
};