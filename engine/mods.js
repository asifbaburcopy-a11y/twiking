'use strict';
/* Mod loader.
 *
 * A mod is one JavaScript file with the extension `.twmod.js` that assigns to
 * `module.exports`. Nothing is installed globally and nothing is compiled: the
 * file is read, validated, and its `apply(ctx)` is executed in-process with a
 * narrow context object. Every action it performs through that context is
 * journalled, which is what makes "disable" always work.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { userModsDir, ensureDir, dataDir } = require('./paths');

const BUILTIN_DIR = path.join(__dirname, '..', 'mods');
const MOD_EXT = '.twmod.js';

const CATEGORIES = [
  'Appearance', 'Taskbar', 'Shell', 'Windows', 'Displays', 'Power',
  'Input', 'Accessibility', 'Files', 'Performance', 'Applications', 'Experimental',
];

const CAPABILITIES = ['settings', 'files', 'apps', 'exec'];

const SETTING_TYPES = ['bool', 'int', 'string', 'text', 'select', 'app', 'file'];

const OPTION_SOURCES = ['themes', 'icons', 'cursors', 'fonts'];

const ID_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function loadFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const module_ = { exports: {} };
  const sandbox = {
    module: module_,
    exports: module_.exports,
    console: {
      log: (...a) => console.log('[mod]', path.basename(file), ...a),
      warn: (...a) => console.warn('[mod]', path.basename(file), ...a),
      error: (...a) => console.error('[mod]', path.basename(file), ...a),
    },
    /* No require, no process, no Buffer: mods talk to the system exclusively
     * through the ctx they are handed. (This is a capability limit, not a
     * security sandbox — see README "Trust model".) */
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file, timeout: 5000 });
  const exp = module_.exports;
  if (!exp || typeof exp !== 'object') throw new Error('mod did not export an object');
  return exp;
}

function fail(errors) {
  return errors.map((e) => `• ${e}`).join('\n');
}

function validate(def, file) {
  const errors = [];
  const meta = def.meta || {};
  if (!meta.id || !ID_RE.test(meta.id)) errors.push('meta.id must be kebab-case, 2–64 chars');
  if (!meta.name) errors.push('meta.name is required');
  if (!meta.description) errors.push('meta.description is required');
  if (!meta.version || !SEMVER_RE.test(meta.version)) errors.push('meta.version must look like 1.0.0');
  if (!meta.author) errors.push('meta.author is required');
  if (!meta.category || !CATEGORIES.includes(meta.category)) {
    errors.push(`meta.category must be one of: ${CATEGORIES.join(', ')}`);
  }
  const caps = Array.isArray(meta.capabilities) ? meta.capabilities : [];
  for (const c of caps) if (!CAPABILITIES.includes(c)) errors.push(`unknown capability "${c}"`);

  if (typeof def.apply !== 'function') errors.push('apply(ctx) is required');

  const settings = Array.isArray(def.settings) ? def.settings : [];
  const seen = new Set();
  settings.forEach((s, i) => {
    if (!s || !s.key) errors.push(`settings[${i}] needs a key`);
    else if (seen.has(s.key)) errors.push(`duplicate setting key "${s.key}"`);
    else seen.add(s.key);
    if (s && !SETTING_TYPES.includes(s.type)) errors.push(`setting "${s && s.key}" has invalid type "${s && s.type}"`);
    if (s && s.type === 'select' && (!Array.isArray(s.options) || !s.options.length) && !s.optionsFrom) {
      errors.push(`setting "${s.key}" is a select but has no options`);
    }
    if (s && s.optionsFrom && !OPTION_SOURCES.includes(s.optionsFrom)) {
      errors.push(`setting "${s.key}" has unknown optionsFrom "${s.optionsFrom}"`);
    }
  });

  if (meta.id && path.basename(file, MOD_EXT) !== meta.id) {
    errors.push(`file name must match the mod id (expected ${meta.id}${MOD_EXT})`);
  }

  return { ok: errors.length === 0, errors };
}

function normalizeSettingSpec(s) {
  const spec = {
    key: s.key,
    name: s.name || s.key,
    description: s.description || '',
    type: s.type,
    default: s.default !== undefined ? s.default : defaultFor(s.type),
    advanced: !!s.advanced,
  };
  if (s.type === 'int') {
    spec.min = Number.isFinite(s.min) ? s.min : 0;
    spec.max = Number.isFinite(s.max) ? s.max : 100;
    spec.step = Number.isFinite(s.step) ? s.step : 1;
    spec.suffix = s.suffix || '';
  }
  if (s.type === 'select') {
    spec.optionsFrom = s.optionsFrom || null; // 'themes' | 'icons' | 'cursors' | 'fonts'
    spec.options = Array.isArray(s.options)
      ? s.options.map((o) => (typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label || o.value }))
      : [];
  }
  if (s.type === 'app') {
    spec.scope = s.scope === 'electron' ? 'electron' : 'all';
  }
  return spec;
}

function defaultFor(type) {
  if (type === 'bool') return false;
  if (type === 'int') return 0;
  return '';
}

function settingsSchema(def) {
  return (Array.isArray(def.settings) ? def.settings : []).map(normalizeSettingSpec);
}

function resolveSettings(def, incoming) {
  const out = {};
  for (const spec of settingsSchema(def)) {
    const raw = incoming && Object.prototype.hasOwnProperty.call(incoming, spec.key) ? incoming[spec.key] : spec.default;
    if (spec.type === 'bool') out[spec.key] = !!raw;
    else if (spec.type === 'int') {
      let n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n)) n = spec.default;
      out[spec.key] = Math.min(spec.max, Math.max(spec.min, n));
    } else if (spec.type === 'select') {
      if (spec.optionsFrom) {
        out[spec.key] = String(raw === undefined || raw === null || raw === '' ? spec.default : raw);
      } else {
        const values = spec.options.map((o) => String(o.value));
        out[spec.key] = values.includes(String(raw)) ? String(raw) : String(spec.default);
      }
    } else if (spec.type === 'app') {
      out[spec.key] = String(raw || '').trim();
    } else {
      out[spec.key] = String(raw === undefined || raw === null ? '' : raw);
    }
  }
  return out;
}

function collect(dir, builtin) {
  const found = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return found; }
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(MOD_EXT)) continue;
    const file = path.join(dir, e.name);
    try {
      const def = loadFile(file);
      const v = validate(def, file);
      const meta = def.meta || {};
      found.push({
        def,
        file,
        builtin,
        error: v.ok ? null : fail(v.errors),
        meta: {
          id: meta.id || path.basename(file, MOD_EXT),
          name: meta.name || path.basename(file, MOD_EXT),
          description: meta.description || '',
          version: meta.version || '0.0.0',
          author: meta.author || 'unknown',
          category: meta.category || 'Experimental',
          icon: meta.icon || 'mod',
          homepage: meta.homepage || '',
          tags: Array.isArray(meta.tags) ? meta.tags : [],
          capabilities: Array.isArray(meta.capabilities) ? meta.capabilities : [],
          license: meta.license || '',
          requires: meta.requires || {},
        },
        source: fs.readFileSync(file, 'utf8'),
      });
    } catch (e) {
      found.push({
        def: null,
        file,
        builtin,
        error: `Failed to load: ${e.message}`,
        meta: {
          id: path.basename(file, MOD_EXT), name: path.basename(file, MOD_EXT), description: '',
          version: '0.0.0', author: 'unknown', category: 'Experimental', icon: 'mod',
          capabilities: [], tags: [], requires: {}, homepage: '', license: '',
        },
        source: '',
      });
    }
  }
  return found;
}

function loadAll() {
  ensureDir(userModsDir());
  const builtins = collect(BUILTIN_DIR, true);
  const user = collect(userModsDir(), false);
  const byId = new Map();
  // user mods override a builtin with the same id, so a patched copy wins
  for (const m of builtins) byId.set(m.meta.id, m);
  for (const m of user) byId.set(m.meta.id, m);
  return [...byId.values()].sort((a, b) => {
    if (a.builtin !== b.builtin) return a.builtin ? -1 : 1;
    return a.meta.name.localeCompare(b.meta.name);
  });
}

function find(id) {
  return loadAll().find((m) => m.meta.id === id) || null;
}

const TEMPLATE = `'use strict';
/* {name}
 *
 * A Twiking mod. Save this file in the mods folder, hit "Rescan" and it shows
 * up in Explore. Every call through \`ctx\` is journalled, so disabling the mod
 * automatically restores whatever was there before — you only write "apply".
 */

module.exports = {
  meta: {
    id: '{id}',
    name: '{name}',
    description: '{description}',
    version: '0.1.0',
    author: 'you',
    category: 'Appearance',
    icon: 'mod',
    capabilities: ['settings'],
  },

  settings: [
    {
      key: 'enabled-effect',
      name: 'Do the thing',
      description: 'Turn the tweak on or off.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    if (ctx.settings['enabled-effect']) {
      // ctx.gsettings('org.gnome.desktop.interface', 'clock-show-seconds', true);
      ctx.log('setting enabled');
    }
  },
};
`;

function scaffold(name) {
  const id = String(name || 'my-mod')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'my-mod';
  const file = path.join(userModsDir(), `${id}${MOD_EXT}`);
  if (fs.existsSync(file)) throw new Error(`a mod named ${id} already exists`);
  ensureDir(userModsDir());
  const pretty = id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  fs.writeFileSync(file, TEMPLATE.replace(/\{id\}/g, id).replace(/\{name\}/g, pretty).replace(/\{description\}/g, `${pretty} — written by me.`), { mode: 0o644 });
  return { id, file };
}

function importFrom(filePath) {
  if (!filePath.endsWith(MOD_EXT)) throw new Error(`mod files must end with ${MOD_EXT}`);
  const code = fs.readFileSync(filePath, 'utf8');
  const def = (() => {
    const module_ = { exports: {} };
    const sandbox = { module: module_, exports: module_.exports, console };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: filePath, timeout: 5000 });
    return module_.exports;
  })();
  const v = validate(def, path.basename(filePath));
  if (!v.ok) throw new Error(`invalid mod:\n${fail(v.errors)}`);
  ensureDir(userModsDir());
  const dest = path.join(userModsDir(), path.basename(filePath));
  fs.copyFileSync(filePath, dest);
  return { id: def.meta.id, file: dest };
}

module.exports = {
  BUILTIN_DIR, MOD_EXT, CATEGORIES, CAPABILITIES, SETTING_TYPES,
  loadAll, find, validate, settingsSchema, resolveSettings, scaffold, importFrom,
  userModsDir, dataDir,
};
