'use strict';
/* Transaction journal + persistent state.
 *
 * Every mutation a mod makes is recorded as an operation with the value that
 * was there *before*. Reverting a mod replays those operations backwards, so a
 * mod does not need to implement (or get right) its own undo — the safety net
 * is structural rather than a convention mod authors must follow.
 */
const fs = require('fs');
const path = require('path');
const { statePath, backupsDir, ensureDir, writeFileAtomic, readIfExists, now } = require('./paths');

const VERSION = 1;

function emptyState() {
  return { version: VERSION, mods: {}, history: [] };
}

function load() {
  const raw = readIfExists(statePath());
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyState();
    if (!parsed.mods || typeof parsed.mods !== 'object') parsed.mods = {};
    if (!Array.isArray(parsed.history)) parsed.history = [];
    parsed.version = VERSION;
    return parsed;
  } catch {
    /* Corrupt state is not fatal — the configs on disk are still whatever the
     * last successful apply wrote, and the user can revert from Settings. */
    return emptyState();
  }
}

function save(state) {
  ensureDir(path.dirname(statePath()));
  writeFileAtomic(statePath(), JSON.stringify(state, null, 2), 0o600);
  return state;
}

function record(state, modId, action, extra = {}) {
  state.history.unshift({ ts: now(), modId, action, ...extra });
  if (state.history.length > 200) state.history.length = 200;
}

/* Keep one copy of a file before the first time a mod touches it. */
function backupFile(modId, file, content) {
  if (content === null || content === undefined) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = ensureDir(path.join(backupsDir(), modId, stamp));
  const dest = path.join(dir, path.basename(file));
  fs.writeFileSync(dest, content, { mode: 0o600 });
  return dest;
}

/* Operations are grouped per mod; enabling an already-enabled mod replaces its
 * op list, which is why callers revert first. */
function opsFor(state, modId) {
  const entry = state.mods[modId];
  return entry && Array.isArray(entry.ops) ? entry.ops : [];
}

function setOps(state, modId, ops) {
  if (!state.mods[modId]) state.mods[modId] = { enabled: false, settings: {}, ops: [] };
  state.mods[modId].ops = ops;
  return state;
}

function markEnabled(state, modId, settings) {
  if (!state.mods[modId]) state.mods[modId] = { enabled: false, settings: {}, ops: [] };
  state.mods[modId].enabled = true;
  state.mods[modId].settings = { ...settings };
  state.mods[modId].appliedAt = now();
  return state;
}

function markDisabled(state, modId) {
  if (!state.mods[modId]) state.mods[modId] = { enabled: false, settings: {}, ops: [] };
  state.mods[modId].enabled = false;
  state.mods[modId].ops = [];
  state.mods[modId].disabledAt = now();
  return state;
}

function setSettings(state, modId, settings) {
  if (!state.mods[modId]) state.mods[modId] = { enabled: false, settings: {}, ops: [] };
  state.mods[modId].settings = { ...settings };
  return state;
}

function settingsFor(state, modId) {
  const entry = state.mods[modId];
  return entry && entry.settings ? entry.settings : null;
}

function isEnabled(state, modId) {
  return !!(state.mods[modId] && state.mods[modId].enabled);
}

/* Operations that cannot be undone (arbitrary commands) are surfaced loudly in
 * the UI and in `revert` results instead of being silently dropped. */
async function unwind(ops, handlers) {
  const { applyGsettings, writeFile, removeFile } = handlers;
  const results = [];
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    try {
      if (op.kind === 'gsettings') {
        /* wasUnset: the key was never written to dconf, so put it back to
         * "unset" rather than writing the default in as an explicit value. */
        await applyGsettings(op.schema, op.key, op.before, op.wasUnset);
        results.push({ ok: true, desc: `restored ${op.schema} ${op.key}` });
      } else if (op.kind === 'file') {
        if (op.before === null || op.before === undefined) {
          removeFile(op.path);
          results.push({ ok: true, desc: `removed ${op.path}` });
        } else {
          writeFile(op.path, op.before, op.mode);
          results.push({ ok: true, desc: `restored ${op.path}` });
        }
      } else if (op.kind === 'exec') {
        results.push({ ok: false, desc: `command was not undone: ${op.cmd} ${(op.args || []).join(' ')}` });
      }
    } catch (e) {
      results.push({ ok: false, desc: `${op.kind} revert failed: ${e.message}` });
    }
  }
  return results;
}

module.exports = {
  VERSION, emptyState, load, save, record, backupFile,
  opsFor, setOps, markEnabled, markDisabled, setSettings, settingsFor, isEnabled, unwind,
};
