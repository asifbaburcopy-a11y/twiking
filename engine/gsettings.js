'use strict';
/* GSettings layer.
 *
 * We deliberately shell out to the `gsettings` CLI instead of using native
 * bindings: it is present on every GNOME box, it needs no build step, and its
 * output is a GVariant literal that `gsettings set` accepts verbatim. That is
 * the property the journal relies on — the "before" string can be written back
 * byte-for-byte, so a revert restores the exact previous value (including
 * custom values this app knows nothing about).
 */
const { run } = require('./sh');

const SCHEMA = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const KEY = /^[a-z0-9][a-z0-9-]*$/;

/* gsettings accepts a relocatable schema as schema:path, e.g.
 * org.gnome.Terminal.Legacy.Profile:/org/gnome/terminal/legacy/profiles:/:u-u-i-d/
 * We support that form too, but only with a sane path alphabet. */
const SCHEMA_PATH = /^[A-Za-z0-9][A-Za-z0-9._-]*(:[/A-Za-z0-9._:-]+)?$/;

function validTarget(schema, key) {
  return typeof schema === 'string' && SCHEMA_PATH.test(schema) && typeof key === 'string' && KEY.test(key);
}

/* GVariant literal for a plain JS value. */
function toLiteral(value) {
  if (value === null || value === undefined) return null; // null == reset
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('non-finite number');
    return String(value);
  }
  if (Array.isArray(value)) {
    if (!value.every((v) => typeof v === 'string')) throw new Error('only string arrays are supported');
    return `[${value.map((v) => quote(v)).join(', ')}]`;
  }
  if (typeof value === 'string') return quote(value);
  throw new Error(`unsupported value type: ${typeof value}`);
}

function quote(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/* Turn a raw GVariant literal into something a human can read in the UI. */
function display(raw) {
  if (raw === null || raw === undefined) return '(unset)';
  const s = String(raw).trim();
  if (/^'.*'$/s.test(s)) return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  return s;
}

async function get(schema, key) {
  if (!validTarget(schema, key)) throw new Error(`invalid gsettings target: ${schema} ${key}`);
  const r = await run('gsettings', ['get', schema, key]);
  if (!r.ok) {
    const msg = (r.stderr || r.error || '').trim();
    return { ok: false, raw: null, error: msg || `gsettings get failed (${schema} ${key})` };
  }
  return { ok: true, raw: r.stdout.replace(/\n$/, '') };
}

async function setRaw(schema, key, raw) {
  if (!validTarget(schema, key)) throw new Error(`invalid gsettings target: ${schema} ${key}`);
  const r = await run('gsettings', ['set', schema, key, String(raw)]);
  if (!r.ok) throw new Error((r.stderr || r.error || 'gsettings set failed').trim());
  return true;
}

async function reset(schema, key) {
  if (!validTarget(schema, key)) throw new Error(`invalid gsettings target: ${schema} ${key}`);
  const r = await run('gsettings', ['reset', schema, key]);
  if (!r.ok) throw new Error((r.stderr || r.error || 'gsettings reset failed').trim());
  return true;
}

/* Restore a journalled "before" value. `null` means the key had no value. */
async function restore(schema, key, raw) {
  if (raw === null || raw === undefined) return reset(schema, key);
  return setRaw(schema, key, raw);
}

/* gsettings prints typed literals: "uint32 550", "2.0", "'Adwaita'". A mod
 * writes "550" or "2", so a string comparison would call every integer or
 * double setting changed and rewrite it. Compare the *values* instead. */
function canonical(raw) {
  const s = String(raw === null || raw === undefined ? '' : raw).trim();
  const untyped = s
    .replace(/^@[A-Za-z0-9{}$-]+\s+/, '') // "@as []" == "[]"
    .replace(/^(?:u?int(?:16|32|64)|byte|double|handle)\s+/, '');
  if (/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(untyped)) return `n:${Number(untyped)}`;
  if (/^'.*'$/s.test(s)) return `s:${s.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\')}`;
  if (untyped.startsWith('[')) return `a:${JSON.stringify(parseStringArray(untyped))}`;
  return `r:${untyped}`;
}

function equal(a, b) {
  return canonical(a) === canonical(b);
}

/* Was this key explicitly written to dconf, or is the value we read just the
 * schema default? Reverting a mod that created a key should remove it again,
 * otherwise "disable" leaves the key pinned to a default it never had. */
async function isSet(schema, key) {
  if (!validTarget(schema, key)) throw new Error(`invalid gsettings target: ${schema} ${key}`);
  if (schema.includes(':')) return true; // relocatable schema: cannot map to a dconf path reliably
  const r = await run('dconf', ['read', `/${schema.replace(/\./g, '/')}/${key}`]);
  if (!r.ok) return true; // no dconf here: restore by value, which is still correct
  return r.stdout.trim() !== '';
}

/* Parse a GVariant string array literal: ['a', 'b'] -> ['a','b'] */
function parseStringArray(raw) {
  if (!raw) return [];
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(String(raw)))) out.push(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
  return out;
}

async function schemaExists(schema) {
  const r = await run('gsettings', ['list-keys', schema]);
  return r.ok && r.stdout.trim().length > 0;
}

async function toolsAvailable() {
  const r = await run('sh', ['-c', 'command -v gsettings && command -v dconf']);
  return r.ok;
}

module.exports = {
  get, setRaw, reset, restore, schemaExists, toolsAvailable,
  toLiteral, display, validTarget, parseStringArray, canonical, equal, isSet,
};
