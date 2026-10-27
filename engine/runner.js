'use strict';
/* Mod runner: builds the ctx a mod acts through, and owns the apply / plan /
 * revert lifecycle.
 *
 * Design rule: a mod never gets raw filesystem or process access from us — it
 * gets intentions (set this key, add this CSS block, wrap this app). That keeps
 * every change visible in the "Changes" preview and undoable from the journal.
 *
 * Mutations are serialised through one queue even when a mod calls them with
 * Promise.all, so the journal records operations in a predictable order and two
 * writes to the same key can never interleave.
 */
const fs = require('fs');
const path = require('path');
const gsettings = require('./gsettings');
const files = require('./files');
const desktop = require('./desktop');
const journal = require('./journal');
const mods = require('./mods');
const { writeFileAtomic, readIfExists, ensureDir, expand, home } = require('./paths');
const { run } = require('./sh');

const META = {
  gsettings: 'settings',
  css: 'files',
  block: 'files',
  file: 'files',
  appEnv: 'apps',
  exec: 'exec',
};

function capabilityCheck(mod, capability, method) {
  const caps = mod.meta.capabilities || [];
  if (!caps.includes(capability)) {
    throw new Error(
      `mod "${mod.meta.id}" calls ctx.${method}() but does not declare the "${capability}" capability in meta.capabilities`
    );
  }
}

function makeCtx({ mod, settings, dryRun, ops, intents, log }) {
  let chain = Promise.resolve();
  function serial(task) {
    const next = chain.then(task, task);
    chain = next.then(() => {}, () => {});
    return next;
  }

  const ctx = {
    settings,
    dryRun,
    log(message) {
      log(String(message));
    },

    /* ---- desktop settings (gsettings) ---- */
    gsettings(schema, key, value) {
      return serial(async () => {
        capabilityCheck(mod, META.gsettings, 'gsettings');
        if (!gsettings.validTarget(schema, key)) throw new Error(`invalid gsettings key: ${schema} ${key}`);
        const current = await gsettings.get(schema, key);
        if (!current.ok) throw new Error(`cannot read ${schema} ${key}: ${current.error}`);
        const literal = value === null || value === undefined ? null : gsettings.toLiteral(value);
        if (literal !== null && gsettings.equal(literal, current.raw)) {
          return { changed: false, before: current.raw, after: current.raw };
        }

        /* Remember whether the key existed in dconf at all, so undo can reset
         * it instead of pinning the schema default as an explicit value. */
        const wasUnset = dryRun ? false : !(await gsettings.isSet(schema, key));

        const entry = {
          kind: 'gsettings',
          schema,
          key,
          before: current.raw,
          after: literal,
          wasUnset,
          desc: `${key} on ${schema}`,
          from: gsettings.display(current.raw),
          to: literal === null ? 'default' : gsettings.display(literal),
        };
        if (dryRun) {
          ops.push(entry);
          intents.push(entry);
          return entry;
        }
        if (literal === null) await gsettings.reset(schema, key);
        else await gsettings.setRaw(schema, key, literal);
        ops.push(entry);
        return entry;
      });
    },

    /* ---- user CSS: contributions to ~/.config/gtk-N.0/gtk.css ---- */
    css(version, body) {
      if (version !== 3 && version !== 4) return Promise.reject(new Error('css(version) must be 3 or 4'));
      return ctx.block(files.gtkCssPath(version), body);
    },

    /* ---- managed block inside any text file ---- */
    block(target, body) {
      return serial(async () => {
        capabilityCheck(mod, META.block, 'block');
        const file = expand(target);
        const before = readIfExists(file);
        const after = files.upsertBlock(before, mod.meta.id, body);
        const entry = {
          kind: 'file',
          path: file,
          before,
          after,
          mode: 0o644,
          desc: `block in ${tilde(file)}`,
          from: before === null ? '(no file)' : summarize(before),
          to: summarize(after),
        };
        /* Identical content is not a change: keep it out of the preview and
         * out of the journal so a repeated plan does not look like an edit. */
        if (after === before) return { ...entry, changed: false };
        ops.push(entry);
        if (dryRun) intents.push(entry);
        else {
          ensureDir(path.dirname(file));
          writeFileAtomic(file, after, 0o644);
        }
        return entry;
      });
    },

    /* ---- whole file (small, generated files only) ---- */
    file(target, content) {
      return serial(async () => {
        capabilityCheck(mod, META.file, 'file');
        const file = expand(target);
        const before = readIfExists(file);
        const entry = {
          kind: 'file',
          path: file,
          before,
          after: content,
          mode: 0o600,
          desc: `write ${tilde(file)}`,
          from: before === null ? '(no file)' : summarize(before),
          to: summarize(content),
        };
        if (content === before) return { ...entry, changed: false };
        ops.push(entry);
        if (dryRun) intents.push(entry);
        else {
          ensureDir(path.dirname(file));
          writeFileAtomic(file, content, 0o600);
        }
        return entry;
      });
    },

    /* ---- per-application environment wrapper ---- */
    appEnv(appId, vars) {
      return serial(async () => {
        capabilityCheck(mod, META.appEnv, 'appEnv');
        const plan = desktop.planAppEnv(appId, vars);
        const list = Object.entries(vars)
          .map(([k, v]) => `${k}=${v}`)
          .join(' ');
        const wrapperEntry = {
          kind: 'file',
          path: plan.wrapper.path,
          before: plan.wrapper.before,
          after: plan.wrapper.content,
          mode: 0o755,
          desc: `launcher wrapper for ${appId}`,
          from: plan.wrapper.before === null ? '(none)' : 'previous wrapper',
          to: `export ${list}`,
        };
        const desktopEntry = {
          kind: 'file',
          path: plan.desktop.path,
          before: plan.desktop.before,
          after: plan.desktop.content,
          mode: 0o644,
          desc: `desktop entry override for ${appId}`,
          from: plan.desktop.before === null ? '(system entry)' : 'previous entry',
          to: `Exec=${tilde(plan.wrapper.path)}`,
        };
        ops.push(wrapperEntry, desktopEntry);
        if (dryRun) intents.push(wrapperEntry, desktopEntry);
        else {
          ensureDir(path.dirname(plan.wrapper.path));
          writeFileAtomic(plan.wrapper.path, plan.wrapper.content, 0o755);
          ensureDir(path.dirname(plan.desktop.path));
          writeFileAtomic(plan.desktop.path, plan.desktop.content, 0o644);
          await desktop.refreshDesktopDatabase();
        }
        return [wrapperEntry, desktopEntry];
      });
    },

    /* ---- arbitrary command (declared capability, never auto-undone) ---- */
    exec(cmd, args = []) {
      return serial(async () => {
        capabilityCheck(mod, META.exec, 'exec');
        const entry = {
          kind: 'exec',
          cmd,
          args,
          desc: `run ${cmd} ${args.join(' ')}`.trim(),
          from: '',
          to: 'executed',
          undoable: false,
        };
        ops.push(entry);
        if (dryRun) {
          intents.push(entry);
          return entry;
        }
        const r = await run(cmd, args);
        if (!r.ok) throw new Error(`command failed: ${cmd} ${args.join(' ')} — ${(r.stderr || r.error || '').trim()}`);
        return entry;
      });
    },

    /* read-only helpers for mods that need to branch */
    get(schema, key) {
      capabilityCheck(mod, META.gsettings, 'get');
      return gsettings.get(schema, key);
    },
    read(target) {
      capabilityCheck(mod, META.file, 'read');
      return readIfExists(expand(target));
    },
  };

  return ctx;
}

function tilde(p) {
  const h = home();
  return p && p.startsWith(h) ? `~${p.slice(h.length)}` : p;
}

function summarize(text, limit = 90) {
  const oneLine = String(text).replace(/\s+/g, ' ').trim();
  return oneLine.length > limit ? `${oneLine.slice(0, limit)}…` : oneLine || '(empty)';
}

const handlers = {
  applyGsettings: (schema, key, raw, wasUnset) =>
    wasUnset || raw === null || raw === undefined
      ? gsettings.reset(schema, key)
      : gsettings.setRaw(schema, key, raw),
  writeFile: (p, content, mode) => {
    ensureDir(path.dirname(p));
    return writeFileAtomic(p, content, mode || 0o644);
  },
  removeFile: (p) => {
    try {
      fs.unlinkSync(p);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  },
};

/* Dry run: read the current world, report what would change, write nothing. */
async function plan({ state, mod, settings }) {
  const resolved = mods.resolveSettings(mod.def, settings);
  const intents = [];
  const logs = [];
  const ctx = makeCtx({ mod, settings: resolved, dryRun: true, ops: [], intents, log: (m) => logs.push(m) });
  try {
    await mod.def.apply(ctx);
  } catch (e) {
    return { ok: false, error: e.message, intents: [], logs };
  }
  return {
    ok: true,
    intents: intents.map((i) => ({ ...i, path: i.path ? tilde(i.path) : undefined })),
    logs,
    needsReapply: journal.isEnabled(state, mod.meta.id),
    settings: resolved,
  };
}

/* Apply, transactionally. If the mod throws halfway through, everything it had
 * already written is rolled back so the desktop is never left half-modded. */
async function apply({ state, mod, settings }) {
  const id = mod.meta.id;
  if (!mod.def || typeof mod.def.apply !== 'function') {
    throw new Error(mod.error || `mod ${id} failed to load`);
  }
  const resolved = mods.resolveSettings(mod.def, settings);
  const logs = [];

  const wasEnabled = journal.isEnabled(state, id);
  if (journal.opsFor(state, id).length) {
    const previous = await revert({ state, id, silent: true });
    if (previous.warnings.length) logs.push(...previous.warnings);
  }

  const ops = [];
  const ctx = makeCtx({ mod, settings: resolved, dryRun: false, ops, intents: [], log: (m) => logs.push(m) });
  let applyError = null;
  try {
    await mod.def.apply(ctx);
  } catch (e) {
    applyError = e;
  }

  if (applyError) {
    const undo = await journal.unwind(ops, handlers);
    const failed = undo.filter((r) => !r.ok);
    state.mods[id] = {
      ...(state.mods[id] || {}),
      enabled: false,
      settings: resolved,
      ops: [],
      lastError: applyError.message,
      failedAt: Date.now(),
    };
    journal.record(state, id, 'apply-failed', { error: applyError.message });
    journal.save(state);
    throw new Error(
      `"${mod.meta.name}" failed and was rolled back: ${applyError.message}` +
        (failed.length ? `\n${failed.map((f) => `• ${f.desc}`).join('\n')}` : '')
    );
  }

  state.mods[id] = {
    ...(state.mods[id] || {}),
    enabled: true,
    settings: resolved,
    ops,
    appliedAt: Date.now(),
    lastError: null,
  };
  journal.record(state, id, wasEnabled ? 'reapply' : 'enable', { changes: ops.length });
  journal.save(state);

  if (!ops.length) logs.push('This mod produced no changes for the current settings.');

  const warnings = [];
  if (ops.some((o) => o.kind === 'exec')) {
    warnings.push('This mod runs commands, which cannot be undone automatically.');
  }
  return {
    ok: true,
    id,
    changes: ops.map((o) => ({ ...o, path: o.path ? tilde(o.path) : undefined })),
    logs,
    warnings,
  };
}

/* Revert by id — works even if the mod file was deleted, because the journal
 * holds everything needed to put the old values back. */
async function revert({ state, id, silent }) {
  const ops = journal.opsFor(state, id);
  const results = await journal.unwind(ops, handlers);
  const warnings = results.filter((r) => !r.ok).map((r) => r.desc);
  state.mods[id] = { ...(state.mods[id] || {}), enabled: false, ops: [] };
  journal.record(state, id, silent ? 'reapply-previous' : 'revert', { ops: ops.length });
  journal.save(state);
  await desktop.refreshDesktopDatabase();
  return { ok: true, id, reverted: ops.length, warnings, results };
}

async function revertAll({ state }) {
  const ids = Object.keys(state.mods).filter((id) => journal.isEnabled(state, id) || journal.opsFor(state, id).length);
  const out = [];
  for (const id of ids) out.push(await revert({ state, id, silent: true }));
  return {
    ok: true,
    reverted: out.reduce((n, r) => n + r.reverted, 0),
    mods: ids,
    warnings: out.flatMap((r) => r.warnings),
  };
}

module.exports = { plan, apply, revert, revertAll, makeCtx };
