'use strict';
/* Public engine API used by the Electron main process (and by the tests).
 * Everything here returns plain JSON-safe objects so it can cross IPC as-is. */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const mods = require('./mods');
const journal = require('./journal');
const runner = require('./runner');
const detect = require('./detect');
const appsCatalog = require('./apps');
const desktop = require('./desktop');
const paths = require('./paths');
const { which, run } = require('./sh');

let state = null;
let schemaCache = new Map();
let whichCache = new Map();

function stateNow() {
  if (!state) state = journal.load();
  return state;
}

function reload() {
  state = journal.load();
  schemaCache = new Map();
  whichCache = new Map();
  detect.resetCache();
  return state;
}

async function exists(bin) {
  if (whichCache.has(bin)) return whichCache.get(bin);
  const p = await which(bin);
  whichCache.set(bin, p);
  return p;
}

async function schemaKeys(schema) {
  if (schemaCache.has(schema)) return schemaCache.get(schema);
  const r = await run('gsettings', ['list-keys', schema]);
  const keys = r.ok ? r.stdout.split('\n').map((s) => s.trim()).filter(Boolean) : null;
  schemaCache.set(schema, keys);
  return keys;
}

function tilde(p) {
  const h = paths.home();
  return p && p.startsWith(h) ? `~${p.slice(h.length)}` : p;
}

/* Compatibility check: refuse to promise something this machine cannot do.
 * Better a greyed-out Enable button than a mod that half-applies. */
async function compatibility(mod, session) {
  const problems = [];
  const req = mod.meta.requires || {};
  if (!session.gsettings) problems.push('gsettings is missing — desktop settings cannot be changed.');

  if (Array.isArray(req.desktops) && req.desktops.length) {
    const here = `${session.desktop.raw} ${session.desktop.primary}`.toLowerCase();
    if (!req.desktops.some((d) => here.includes(String(d).toLowerCase()))) {
      problems.push(`Works on ${req.desktops.join(' / ')}; this session reports "${session.desktop.primary}".`);
    }
  }

  if (Array.isArray(req.binaries)) {
    for (const bin of req.binaries) {
      if (!(await exists(bin))) problems.push(`Needs the \`${bin}\` command, which is not installed.`);
    }
  }

  if (Array.isArray(req.keys)) {
    for (const pair of req.keys) {
      const [schema, key] = Array.isArray(pair) ? pair : String(pair).split(' ');
      const keys = await schemaKeys(schema);
      if (!keys) problems.push(`Needs the ${schema} schema, which this system does not have.`);
      else if (!keys.includes(key)) problems.push(`Needs ${schema} ${key}, which this version of GNOME does not expose.`);
    }
  }

  if (Array.isArray(req.extensions)) {
    for (const ext of req.extensions) {
      if (!session.enabledExtensions.includes(ext)) {
        problems.push(`Needs the “${ext.split('@')[0]}” GNOME Shell extension enabled.`);
      }
    }
  }

  if (req.wayland && !session.wayland) problems.push('Only useful on a Wayland session.');

  return { ok: problems.length === 0, problems };
}

function schemaFor(mod, appList, session) {
  const lists = {
    themes: session.themes,
    icons: session.icons,
    cursors: session.cursors,
    fonts: session.fonts,
  };
  return mods.settingsSchema(mod.def).map((spec) => {
    if (spec.type === 'select' && spec.optionsFrom && lists[spec.optionsFrom]) {
      return { ...spec, options: lists[spec.optionsFrom].map((t) => ({ value: t, label: t })) };
    }
    if (spec.type !== 'app') return spec;
    const pool = spec.scope === 'electron' ? detect.electronApps(appList) : appList;
    return {
      ...spec,
      options: pool.map((a) => ({
        value: a.id,
        label: a.name,
        hint: a.userOverride ? 'customised entry' : a.id,
      })),
      emptyHint: spec.scope === 'electron'
        ? 'No Electron apps detected. Pick any app under Settings → "Which app" only if you know its id.'
        : 'No applications detected.',
    };
  });
}

async function summary(mod, ctx) {
  const st = ctx.state;
  const entry = st.mods[mod.meta.id] || {};
  /* A mod that failed to parse has no def: report it, don't take the whole
   * catalogue down with it. */
  const settingsValues = mod.def
    ? mods.resolveSettings(mod.def, entry.settings || {})
    : {};
  return {
    id: mod.meta.id,
    name: mod.meta.name,
    description: mod.meta.description,
    version: mod.meta.version,
    author: mod.meta.author,
    category: mod.meta.category,
    icon: mod.meta.icon,
    homepage: mod.meta.homepage,
    license: mod.meta.license,
    tags: mod.meta.tags,
    capabilities: mod.meta.capabilities,
    builtin: mod.builtin,
    file: tilde(mod.file),
    loadError: mod.error,
    source: mod.source,
    settings: mod.def ? schemaFor(mod, ctx.appList, ctx.session) : [],
    settingsValues,
    enabled: !!entry.enabled,
    appliedAt: entry.appliedAt || null,
    changeCount: Array.isArray(entry.ops) ? entry.ops.length : 0,
    lastError: entry.lastError || null,
    compat: mod.error
      ? { ok: false, problems: [mod.error.split('\n')[0]] }
      : await compatibility(mod, ctx.session),
  };
}

async function bootstrap() {
  const session = await detect.session();
  const catalog = await appsCatalog.loadApps();
  const appList = desktop.listApps();
  const st = stateNow();
  const list = mods.loadAll();
  const ctx = { session, appList, state: st };
  const out = await Promise.all(list.map((m) => summary(m, ctx)));

  const enabled = out.filter((m) => m.enabled).length;
  return {
    version: require('../package.json').version,
    session: {
      ...session,
      desktop: session.desktop,
      osPretty: session.distro.pretty,
    },
    mods: out,
    apps: catalog.apps,
    projects: catalog.projects,
    appErrors: catalog.errors,
    categories: mods.CATEGORIES,
    installed: { enabled, total: out.length },
    paths: {
      mods: tilde(mods.userModsDir()),
      modsAbsolute: mods.userModsDir(),
      data: tilde(paths.dataDir()),
      dataAbsolute: paths.dataDir(),
      state: tilde(paths.statePath()),
      backups: tilde(paths.backupsDir()),
      gtkCss: { 3: tilde(require('./files').gtkCssPath(3)), 4: tilde(require('./files').gtkCssPath(4)) },
    },
    history: st.history.slice(0, 50),
    journal: Object.fromEntries(
      Object.entries(st.mods).map(([id, v]) => [id, { enabled: !!v.enabled, ops: (v.ops || []).length, appliedAt: v.appliedAt || null }])
    ),
  };
}

function mustFind(id) {
  const mod = mods.find(id);
  if (!mod) throw new Error(`no mod with id "${id}"`);
  if (!mod.def || mod.error) throw new Error(mod.error || `mod ${id} could not be loaded`);
  return mod;
}

async function planMod(id, settings) {
  const mod = mustFind(id);
  return runner.plan({ state: stateNow(), mod, settings });
}

async function applyMod(id, settings) {
  const mod = mustFind(id);
  return runner.apply({ state: stateNow(), mod, settings });
}

async function disableMod(id) {
  const mod = mods.find(id);
  if (!mod) {
    // Still allow reverting an orphaned entry from the journal.
    return runner.revert({ state: stateNow(), id });
  }
  return runner.revert({ state: stateNow(), id });
}

async function revertAll() {
  return runner.revertAll({ state: stateNow() });
}

async function saveSettings(id, settings) {
  const mod = mustFind(id);
  const resolved = mods.resolveSettings(mod.def, settings);
  const st = stateNow();
  journal.setSettings(st, id, resolved);
  journal.save(st);
  return { ok: true, settings: resolved };
}

async function changesFor(id) {
  const st = stateNow();
  const entry = st.mods[id];
  if (!entry || !Array.isArray(entry.ops)) return { ok: true, changes: [] };
  return {
    ok: true,
    changes: entry.ops.map((op) => ({
      kind: op.kind,
      desc: op.desc,
      path: op.path ? tilde(op.path) : undefined,
      from: op.from,
      to: op.to,
      undoable: op.undoable !== false,
    })),
  };
}

function createMod(name) {
  return mods.scaffold(name);
}

function importMod(filePath) {
  return mods.importFrom(filePath);
}

function openModsFolder() {
  paths.ensureDir(mods.userModsDir());
  return mods.userModsDir();
}

function source(id) {
  const mod = mods.find(id);
  if (!mod) throw new Error(`no mod with id "${id}"`);
  return { source: mod.source, file: tilde(mod.file), builtin: mod.builtin, loadError: mod.error };
}

/* Launch a catalog app or project if it is actually installed. Detached so it
 * survives the window closing; never through a shell. */
function launchApp(id) {
  const catalog = appsCatalog.readCatalog();
  const entry = [...(catalog.apps || []), ...(catalog.projects || [])].find((a) => a.id === id);
  if (!entry) throw new Error(`unknown app ${id}`);
  let plan;
  try {
    plan = appsCatalog.launchPlan(entry);
  } catch (e) {
    throw new Error(`${e.message}${entry.package ? ` — install it with: sudo apt install ${entry.package}` : entry.repo ? ` — source: ${entry.repo}` : ''}`);
  }
  return new Promise((resolve, reject) => {
    const child = spawn(plan.cmd, plan.args, { detached: true, stdio: 'ignore' });
    child.once('error', () => reject(new Error(`could not launch ${entry.name} (${plan.cmd})`)));
    child.once('spawn', () => {
      child.unref();
      resolve({ ok: true, command: plan.cmd, via: plan.via });
    });
  });
}

/* Build the privileged install command for a catalog app. Running it is the
 * main process's job (it streams progress); this only validates the plan. */
function installPlanFor(id) {
  const catalog = appsCatalog.readCatalog();
  const entry = (catalog.apps || []).find((a) => a.id === id);
  if (!entry) throw new Error(`unknown app ${id}`);
  return { entry: { id: entry.id, name: entry.name }, ...appsCatalog.installPlan(entry) };
}

function diagnostics() {
  const st = stateNow();
  return {
    paths: {
      data: paths.dataDir(),
      mods: mods.userModsDir(),
      state: paths.statePath(),
      backups: paths.backupsDir(),
    },
    mods: Object.entries(st.mods).map(([id, v]) => ({
      id, enabled: !!v.enabled, ops: (v.ops || []).length, appliedAt: v.appliedAt || null, lastError: v.lastError || null,
    })),
    history: st.history.slice(0, 100),
  };
}

module.exports = {
  bootstrap, planMod, applyMod, disableMod, revertAll, saveSettings, changesFor,
  createMod, importMod, openModsFolder, source, launchApp, installPlanFor,
  diagnostics, reload, tilde,
};