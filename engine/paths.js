'use strict';
/* Filesystem layout + small shared helpers.
 *
 * Every path is derived from HOME so the whole engine can be pointed at a
 * throwaway directory in tests (TWIKING_HOME), which is how the engine test
 * suite exercises real apply/revert cycles without touching a live desktop.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

function home() {
  return process.env.TWIKING_HOME || os.homedir();
}

function dataDir() {
  return process.env.TWIKING_DATA_DIR || path.join(home(), '.local', 'share', 'twiking');
}

function userModsDir() {
  return path.join(dataDir(), 'mods');
}

function statePath() {
  return path.join(dataDir(), 'state.json');
}

function backupsDir() {
  return path.join(dataDir(), 'backups');
}

function configDir(sub) {
  return path.join(home(), '.config', sub);
}

function expand(p) {
  if (!p) return p;
  if (p === '~') return home();
  if (p.startsWith('~/')) return path.join(home(), p.slice(2));
  return p;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

/* Atomic write: temp file in the same directory, then rename. A crash either
 * leaves the old file or the new one, never a half-written config. */
function writeFileAtomic(file, content, mode) {
  const dir = ensureDir(path.dirname(file));
  const tmp = path.join(dir, `.${path.basename(file)}.tmp-${process.pid}-${Date.now()}`);
  fs.writeFileSync(tmp, content, { mode: mode || 0o600 });
  if (mode) fs.chmodSync(tmp, mode);
  fs.renameSync(tmp, file);
  return file;
}

function readIfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

function now() {
  return Date.now();
}

module.exports = {
  home, dataDir, userModsDir, statePath, backupsDir, configDir,
  expand, ensureDir, writeFileAtomic, readIfExists, now,
};