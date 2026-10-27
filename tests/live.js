'use strict';
/* Live sweep: exercise every mod against the *real* desktop.
 *
 * The README's guarantee is "enable anything, disable it, get your desktop
 * back". tests/mods.test.js proves that against a fake desktop. This proves it
 * against the machine it actually runs on:
 *
 *   plan(non-default settings) -> apply -> read every key/file back
 *   -> disable -> read every key/file back -> compare with the baseline
 *
 * Nothing is left enabled afterwards: whatever the user had enabled when the
 * run started is re-applied at the end, and a dconf diff of /org/gnome/ proves
 * no stray key survived.
 *
 * Run it with:  node tests/live.js          (add --keep to skip the restore)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const engine = require('../engine');
const journal = require('../engine/journal');
const gsettings = require('../engine/gsettings');
const paths = require('../engine/paths');
const { run } = require('../engine/sh');

const HOME = os.homedir();
const REPORT = path.join(os.tmpdir(), 'twiking-live-report.json');
const TEST_IMG = '/usr/share/backgrounds/Ocean-Horizon-by-Dave-Hoefler.jpg';

const KNOWN_FILES = [
  path.join(HOME, '.config/gtk-3.0/gtk.css'),
  path.join(HOME, '.config/gtk-4.0/gtk.css'),
  path.join(HOME, '.config/environment.d/60-twiking-qt.conf'),
];

function dconfDump(tag) {
  const file = path.join(os.tmpdir(), `twiking-dconf-${tag}.txt`);
  const out = execFileSync('dconf', ['dump', '/org/gnome/'], { encoding: 'utf8' });
  fs.writeFileSync(file, out);
  return file;
}

function parseDump(file) {
  const map = new Map();
  let section = '';
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\[(.+)\]$/);
    if (m) { section = m[1]; continue; }
    const eq = line.indexOf('=');
    if (eq > 0 && section) map.set(`${section}/${line.slice(0, eq)}`, line.slice(eq + 1));
  }
  return map;
}

/* Every gsettings key a mod actually journalled during the sweep. Anything else
 * that changed is the desktop's own daemons reacting (enabling the magnifier
 * makes gsd pin toolkit-accessibility), not the engine leaking. */
const TOUCHED = new Set();

function readFileOrNull(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

async function gsettingsRaw(schema, key) {
  const r = await gsettings.get(schema, key);
  return r.ok ? r.raw : `<<read failed: ${r.error}>>`;
}

/* Candidate values per setting, most "interesting" first: a change from the
 * default is what proves the mod isn't just writing the value that was there. */
function choicesFor(spec) {
  const out = [];
  const push = (v) => { if (v !== undefined && v !== null && !out.some((x) => String(x) === String(v))) out.push(v); };
  if (spec.type === 'bool') {
    push(!spec.default);
    push(!!spec.default);
  } else if (spec.type === 'int') {
    const step = spec.step || 1;
    push(Math.min(spec.max, (spec.default || 0) + step));
    push(Math.max(spec.min, (spec.default || 0) - step));
    push(spec.max);
    push(spec.min);
  } else if (spec.type === 'select') {
    const opts = (spec.options || []).map((o) => o.value);
    opts.filter((v) => String(v) !== String(spec.default)).reverse().forEach(push);
    opts.forEach(push);
  } else if (spec.type === 'text') {
    /* A free-text field is only "interesting" when it is non-empty. */
    push(String(spec.default || '').length ? '' : 'Web, Code, Chat');
    push(spec.default);
  } else if (spec.type === 'file') {
    if (fs.existsSync(TEST_IMG)) push(TEST_IMG);
  } else if (spec.type === 'app') {
    const opts = (spec.options || []).map((o) => o.value).filter(Boolean);
    ['org.gnome.TextEditor', 'org.gnome.Nautilus'].forEach(push);
    opts.forEach(push);
  } else {
    push(spec.default);
  }
  return out.length ? out : [spec.default];
}

function variants(mod) {
  const specs = mod.settings || [];
  if (!specs.length) return [{ label: 'defaults', settings: {} }];
  const per = specs.map(choicesFor);
  const out = [];
  for (let i = 0; i < 4; i++) {
    const settings = {};
    specs.forEach((s, n) => { settings[s.key] = per[n][Math.min(i, per[n].length - 1)]; });
    out.push({ label: `variant-${i}`, settings });
  }
  return out;
}

/* Independent read-back: trust the desktop, not the journal. */
async function verifyApplied(ops) {
  const problems = [];
  for (const op of ops) {
    if (op.kind === 'gsettings') {
      const raw = await gsettingsRaw(op.schema, op.key);
      if (!gsettings.equal(raw, op.after)) problems.push(`${op.schema} ${op.key}: expected ${op.after}, desktop has ${raw}`);
    } else if (op.kind === 'file') {
      const disk = readFileOrNull(op.path);
      if (disk !== op.after) problems.push(`${op.path}: content does not match what was applied`);
    } else if (op.kind === 'exec') {
      problems.push(`exec op cannot be verified: ${op.cmd}`);
    }
  }
  return problems;
}

async function verifyReverted(ops) {
  const problems = [];
  for (const op of ops) {
    if (op.kind === 'gsettings') {
      const raw = await gsettingsRaw(op.schema, op.key);
      if (!gsettings.equal(raw, op.before)) problems.push(`${op.schema} ${op.key}: expected restored ${op.before}, desktop has ${raw}`);
      /* A key that was unset must be unset again, not pinned to its default. */
      if (op.wasUnset && (await gsettings.isSet(op.schema, op.key))) {
        problems.push(`${op.schema} ${op.key}: was unset before, is now explicitly set`);
      }
    } else if (op.kind === 'file') {
      const disk = readFileOrNull(op.path);
      if (op.before === null || op.before === undefined) {
        if (disk !== null) problems.push(`${op.path}: should have been removed, still exists`);
      } else if (disk !== op.before) {
        problems.push(`${op.path}: previous content not restored`);
      }
    }
  }
  return problems;
}

/* Up to two settings variants per mod: the first flips every default, the next
 * uses different choices. That covers branches a single pass would miss, such as
 * "set the blink interval only while blinking" or "also write GTK3 CSS". */
async function testMod(mod) {
  const started = Date.now();
  const row = {
    id: mod.id, name: mod.name, status: 'PASS', changes: 0, cycles: 0,
    kinds: [], settings: [], problems: [], logs: [], evidence: [],
  };

  for (const v of variants(mod)) {
    if (row.cycles >= 2) break;
    const plan = await engine.planMod(mod.id, v.settings);
    if (!plan.ok) {
      row.status = 'FAIL';
      row.problems.push(`plan failed (${v.label}): ${plan.error}`);
      return row;
    }
    if (!plan.intents.length) continue;
    row.cycles += 1;
    row.settings.push(v.settings);
    row.logs.push(...(plan.logs || []));

    try {
      await engine.applyMod(mod.id, v.settings);
    } catch (e) {
      row.status = 'FAIL';
      row.problems.push(`apply failed (${v.label}): ${e.message}`);
      return row;
    }

    const entry = journal.load().mods[mod.id] || { ops: [] };
    const ops = entry.ops || [];
    for (const op of ops) if (op.kind === 'gsettings') TOUCHED.add(`${op.schema}\u0000${op.key}`);
    row.changes += ops.length;
    row.kinds.push(...ops.map((o) => o.kind));
    row.evidence.push(...ops.map((o) => (o.kind === 'gsettings' ? `${o.key}: ${o.from} → ${o.to}` : o.desc)));

    if (ops.length !== plan.intents.length) {
      row.problems.push(`${v.label}: preview showed ${plan.intents.length} change(s) but apply recorded ${ops.length}`);
    }
    row.problems.push(...(await verifyApplied(ops)));

    const reverted = await engine.disableMod(mod.id);
    if (reverted.warnings && reverted.warnings.length) row.problems.push(...reverted.warnings);
    const after = journal.load().mods[mod.id] || {};
    if (after.enabled) row.problems.push('still marked enabled after disable');
    if ((after.ops || []).length) row.problems.push(`${after.ops.length} op(s) left in the journal`);
    row.problems.push(...(await verifyReverted(ops)));
  }

  row.kinds = [...new Set(row.kinds)];
  row.ms = Date.now() - started;
  if (!row.cycles) {
    row.status = 'NO-CHANGE';
    row.problems.push('planned no changes with any settings variant');
  } else if (row.problems.length) {
    row.status = 'FAIL';
  }
  return row;
}

async function main() {
  const keep = process.argv.includes('--keep');
  const before = journal.load();
  const preEnabled = Object.entries(before.mods)
    .filter(([, v]) => v && v.enabled)
    .map(([id, v]) => ({ id, settings: v.settings }));

  const baselineFiles = new Map(KNOWN_FILES.map((p) => [p, readFileOrNull(p)]));

  console.log(`Reading the desktop. ${preEnabled.length} mod(s) already enabled: ${preEnabled.map((m) => m.id).join(', ') || 'none'}`);
  const reset = await engine.revertAll();
  if (reset.warnings.length) console.log('Revert warnings:', reset.warnings);
  const dconfBefore = dconfDump('before');

  const boot = await engine.bootstrap();
  console.log(`Twiking ${boot.version} · ${boot.session.distro.pretty} · ${boot.session.desktop.primary} · ${boot.mods.length} mods\n`);

  const rows = [];
  for (const mod of boot.mods) {
    if (mod.loadError) {
      rows.push({ id: mod.id, name: mod.name, status: 'FAIL', changes: 0, problems: [mod.loadError] });
      continue;
    }
    if (!mod.compat.ok) {
      rows.push({ id: mod.id, name: mod.name, status: 'SKIP', changes: 0, problems: mod.compat.problems });
      console.log(`SKIP  ${mod.id.padEnd(22)} ${mod.compat.problems.join('; ')}`);
      continue;
    }
    const row = await testMod(mod);
    rows.push(row);
    const mark = row.status === 'PASS' ? 'PASS' : row.status === 'NO-CHANGE' ? '----' : 'FAIL';
    console.log(`${mark}  ${row.id.padEnd(22)} ${String(row.changes).padStart(2)} change(s) [${row.kinds.join(',')}]`);
    for (const p of row.problems) console.log(`        ! ${p}`);
  }

  /* Final integrity: the desktop must look exactly like it did at baseline.
   * A key a daemon pinned to its own default is reset and reported separately;
   * a key that changed value, or disappeared, is a real restore failure. */
  const dconfAfter = dconfDump('after');
  let dconfDiff = '';
  try {
    execFileSync('diff', ['-u', dconfBefore, dconfAfter], { encoding: 'utf8' });
  } catch (e) {
    dconfDiff = e.stdout || String(e);
  }

  const dumpedBefore = parseDump(dconfBefore);
  const dumpedAfter = parseDump(dconfAfter);
  const sideEffects = [];
  const unexpected = [];
  for (const [keyPath, value] of dumpedAfter) {
    const previous = dumpedBefore.get(keyPath);
    if (previous === value) continue;
    const cut = keyPath.lastIndexOf('/');
    const schema = `org.gnome.${keyPath.slice(0, cut).replace(/\//g, '.')}`;
    const key = keyPath.slice(cut + 1);
    if (previous !== undefined || TOUCHED.has(`${schema}\u0000${key}`)) {
      unexpected.push(`${keyPath}: ${previous} → ${value}`);
      continue;
    }
    /* Was this key merely pinned to its schema default? Reset it and compare. */
    const current = await gsettings.get(schema, key);
    if (!current.ok) { unexpected.push(keyPath); continue; }
    await gsettings.reset(schema, key);
    const after = await gsettings.get(schema, key);
    if (after.ok && gsettings.equal(after.raw, current.raw)) {
      sideEffects.push(`${schema} ${key} (was unset, daemon pinned the default)`);
    } else {
      if (after.ok) await gsettings.setRaw(schema, key, current.raw);
      unexpected.push(`${keyPath}: daemon changed a non-default value`);
    }
  }
  for (const keyPath of dumpedBefore.keys()) {
    if (!dumpedAfter.has(keyPath)) unexpected.push(`${keyPath}: disappeared`);
  }
  const leftoverFiles = KNOWN_FILES.filter((p) => readFileOrNull(p) !== baselineFiles.get(p));

  if (!keep) {
    for (const m of preEnabled) {
      try {
        await engine.applyMod(m.id, m.settings);
      } catch (e) {
        console.log(`could not restore previously-enabled ${m.id}: ${e.message}`);
      }
    }
  }

  const fail = rows.filter((r) => r.status === 'FAIL').length;
  const skip = rows.filter((r) => r.status === 'SKIP').length;
  const nochange = rows.filter((r) => r.status === 'NO-CHANGE').length;
  const pass = rows.filter((r) => r.status === 'PASS').length;

  console.log(`\n${pass} passed · ${fail} failed · ${skip} skipped · ${nochange} no-change · dconf restore ${unexpected.length ? 'FAILED' : 'clean'}`);
  if (sideEffects.length) console.log('daemon side effects reset (no mod wrote them):', sideEffects.join(', '));
  if (unexpected.length) console.log('unexpected dconf changes:', unexpected);
  if (dconfDiff.trim()) console.log('raw dump diff:\n' + dconfDiff.slice(0, 3000));
  if (leftoverFiles.length) console.log('Leftover config files:', leftoverFiles);

  const report = {
    when: new Date().toISOString(),
    session: `${boot.session.distro.pretty} / ${boot.session.desktop.primary} / ${boot.session.wayland ? 'wayland' : 'x11'}`,
    counts: { pass, fail, skip, nochange },
    dconfDelta: dconfDiff.trim(),
    sideEffects,
    unexpected,
    leftoverFiles,
    rows,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(`report: ${REPORT}`);
  process.exit(fail || unexpected.length || leftoverFiles.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
