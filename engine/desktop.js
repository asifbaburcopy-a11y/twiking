'use strict';
/* Per-application tweaks — the Linux answer to Windhawk injecting a DLL into
 * one specific .exe.
 *
 * On Linux a program's environment is decided by whoever launches it, and the
 * launcher is the .desktop entry. So a per-app mod writes a wrapper script that
 * exports variables and execs the real binary, then points an overriding
 * .desktop entry at that wrapper. Only the chosen app is affected, no root or
 * LD_PRELOAD is needed, and dropping the override restores the original entry.
 */
const fs = require('fs');
const path = require('path');
const { run } = require('./sh');
const { home, dataDir, ensureDir, writeFileAtomic, readIfExists, expand } = require('./paths');

const FIELD_CODES = /%[fFuUdDnNickvm]/g;

function desktopDirs() {
  return [
    path.join(home(), '.local', 'share', 'applications'),
    '/usr/local/share/applications',
    '/usr/share/applications',
  ];
}

function wrapperPath(appId) {
  return path.join(dataDir(), 'wrappers', `${appId}.sh`);
}

function overridePath(appId) {
  return path.join(home(), '.local', 'share', 'applications', `${appId}.desktop`);
}

function findDesktopFile(appId) {
  for (const dir of desktopDirs()) {
    const p = path.join(dir, `${appId}.desktop`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseDesktop(content) {
  const out = { entries: {}, groups: [] };
  let group = 'Desktop Entry';
  out.groups.push(group);
  for (const line of String(content).split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = /^\[(.+)\]$/.exec(line.trim());
    if (m) {
      group = m[1];
      out.groups.push(group);
      out.entries[group] = out.entries[group] || {};
      continue;
    }
    const kv = /^([^=]+)=(.*)$/.exec(line);
    if (!kv) continue;
    out.entries[group] = out.entries[group] || {};
    out.entries[group][kv[1].trim()] = kv[2];
  }
  return out;
}

function serializeDesktop(parsed) {
  const lines = [];
  for (const group of parsed.groups) {
    const entries = parsed.entries[group] || {};
    lines.push(`[${group}]`);
    for (const [k, v] of Object.entries(entries)) lines.push(`${k}=${v}`);
    lines.push('');
  }
  return lines.join('\n');
}

/* `Exec=env FOO=1 /usr/bin/app --flag %U` -> { program, args } */
function splitExec(execLine) {
  const tokens = tokenize(execLine);
  let i = 0;
  while (i < tokens.length && (tokens[i] === 'env' || /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]))) i++;
  const program = tokens[i] || '';
  const args = tokens.slice(i + 1).filter((t) => !/^%[fFuUdDnNickvm]$/.test(t));
  return { program, args };
}

/* .desktop quoting: double quotes group, backslash escapes inside them. */
function tokenize(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\' && i + 1 < line.length) {
      cur += line[++i];
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (/\s/.test(ch) && !quoted) {
      if (cur) out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

/* Build the wrapper + override, returning file writes the runner can journal. */
function planAppEnv(appId, vars) {
  if (!/^[A-Za-z0-9@._+-]+$/.test(appId)) throw new Error(`invalid app id: ${appId}`);
  const src = findDesktopFile(appId);
  if (!src) throw new Error(`no desktop entry found for ${appId}`);
  const original = fs.readFileSync(src, 'utf8');
  const parsed = parseDesktop(original);
  const desktop = parsed.entries['Desktop Entry'];
  if (!desktop || !desktop.Exec) throw new Error(`${appId} has no Exec line`);

  const { program, args } = splitExec(desktop.Exec);
  if (!program) throw new Error(`could not parse Exec of ${appId}`);

  const exports = Object.entries(vars)
    .filter(([k, v]) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) && v !== undefined && v !== null)
    .map(([k, v]) => `export ${k}=${shellQuote(v)}`);

  const wrapper = [
    '#!/bin/sh',
    `# Twiking environment wrapper for ${appId}`,
    '# Generated file — disable the mod in Twiking to remove it.',
    ...exports,
    `exec ${shellQuote(program)}${args.length ? ' ' + args.map(shellQuote).join(' ') : ''} "$@"`,
    '',
  ].join('\n');

  desktop.Exec = `${wrapperPath(appId)}${/%[fFuU]/.test(original) ? ' %U' : ''}`;
  if (desktop.TryExec) desktop.TryExec = program;
  /* With DBusActivatable the launcher ignores Exec entirely, which would
   * silently defeat the wrapper. */
  if (String(desktop.DBusActivatable).toLowerCase() === 'true') desktop.DBusActivatable = 'false';

  return {
    appId,
    program,
    wrapper: { path: wrapperPath(appId), content: wrapper, mode: 0o755, before: readIfExists(wrapperPath(appId)) },
    desktop: { path: overridePath(appId), content: serializeDesktop(parsed), mode: 0o644, before: readIfExists(overridePath(appId)) },
  };
}

async function refreshDesktopDatabase() {
  await run('sh', ['-c', 'command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" || true']);
}

/* Installed applications, for the "which app?" picker and for compatibility
 * checks. User overrides win over system entries with the same id. */
function listApps() {
  const seen = new Map();
  for (const dir of desktopDirs()) {
    if (!fs.existsSync(dir)) continue;
    let names = [];
    try { names = fs.readdirSync(dir); } catch { continue; }
    for (const name of names) {
      if (!name.endsWith('.desktop')) continue;
      const id = name.slice(0, -'.desktop'.length);
      if (seen.has(id)) continue;
      const full = path.join(dir, name);
      let content;
      try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }
      const entry = parseDesktop(content).entries['Desktop Entry'] || {};
      if (!entry.Name) continue;
      const isUserOverride = dir.startsWith(home());
      seen.set(id, {
        id,
        name: entry.Name,
        genericName: entry.GenericName || '',
        exec: entry.Exec || '',
        icon: entry.Icon || '',
        comment: entry.Comment || '',
        terminal: entry.Terminal === 'true',
        noDisplay: entry.NoDisplay === 'true',
        dbusActivatable: String(entry.DBusActivatable).toLowerCase() === 'true',
        path: full,
        userOverride: isUserOverride,
        overriddenByTwiking: fs.existsSync(wrapperPath(id)),
      });
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  wrapperPath, overridePath, findDesktopFile, parseDesktop, serializeDesktop,
  splitExec, tokenize, planAppEnv, refreshDesktopDatabase, listApps, FIELD_CODES, expand,
};
