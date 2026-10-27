'use strict';
/* Whole-catalogue tests: every bundled mod is applied with non-default settings,
 * then disabled, and the fake desktop must end up byte-identical to how it
 * started. This is the test that catches a mod which forgets a key, writes two
 * files but restores one, or leaves a launcher behind. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { HOME, DATA, GSDB } = require('./sandbox');

const engine = require('../engine');
const mods = require('../engine/mods');
const apps = require('../engine/apps');

function walk(dir, base = dir, out = {}) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else if (e.isFile()) out[path.relative(base, full)] = fs.readFileSync(full);
  }
  return out;
}

/* Anything a mod is allowed to touch. The journal itself is excluded: it is
 * expected to grow, and reverting it is not part of the contract. */
function snapshot() {
  return {
    gsettings: walk(GSDB),
    config: walk(path.join(HOME, '.config')),
    applications: walk(path.join(HOME, '.local', 'share', 'applications')),
    wrappers: walk(path.join(DATA, 'wrappers')),
  };
}

/* Settings that deliberately differ from the defaults, so "nothing changed"
 * cannot pass by accident. */
function alternateSettings(summary) {
  const out = { ...summary.settingsValues };
  for (const spec of summary.settings) {
    if (spec.type === 'bool') out[spec.key] = !out[spec.key];
    else if (spec.type === 'int') {
      out[spec.key] = Number(out[spec.key]) === spec.min ? Math.min(spec.max, spec.min + spec.step) : spec.min;
    } else if (spec.type === 'select') {
      const values = (spec.options || []).map((o) => String(o.value));
      out[spec.key] = values.find((v) => v !== String(out[spec.key])) || String(spec.default);
    } else if (spec.type === 'app') {
      out[spec.key] = 'fake-electron';
    } else if (spec.type === 'file') {
      out[spec.key] = 'file:///usr/share/backgrounds/twiking-test.png';
    } else if (spec.type === 'text') {
      out[spec.key] = 'TWIKING_TEST=1';
    }
  }
  return out;
}

test('every bundled mod applies, journals, and reverts to the identical system', async () => {
  const data = await engine.bootstrap();
  const bundled = data.mods.filter((m) => m.builtin && !m.loadError);
  assert.ok(bundled.length >= 25, `expected a large catalogue, got ${bundled.length}`);

  const results = [];
  for (const summary of bundled) {
    const before = snapshot();
    const alt = alternateSettings(summary);

    let res = await engine.applyMod(summary.id, alt);
    if (res.changes.length === 0) {
      // Some defaults already match the fake desktop (all-bool mods); retry flipped.
      const flipped = { ...alt };
      for (const spec of summary.settings) if (spec.type === 'bool') flipped[spec.key] = !alt[spec.key];
      res = await engine.applyMod(summary.id, flipped);
    }
    assert.ok(res.changes.length >= 1, `${summary.id}: produced no changes for alternate settings`);
    assert.equal(res.ok, true);

    const mid = snapshot();
    assert.notDeepEqual(mid, before, `${summary.id}: apply did not change anything on disk`);

    const off = await engine.disableMod(summary.id);
    assert.equal(off.reverted, res.changes.length, `${summary.id}: reverted op count mismatch`);
    assert.deepEqual(snapshot(), before, `${summary.id}: revert did not restore the system exactly`);
    results.push(`${summary.id} (${res.changes.length})`);
  }
  console.log(`round-trip verified: ${results.join(', ')}`);
});

test('every bundled mod declares its requirements and capabilities', async () => {
  const data = await engine.bootstrap();
  for (const m of data.mods.filter((x) => x.builtin)) {
    assert.equal(m.loadError, null, `${m.id} failed to load`);
    assert.ok(Array.isArray(m.capabilities) && m.capabilities.length > 0, `${m.id} declares no capability`);
    assert.ok(m.category && m.version && m.author, `${m.id} has incomplete metadata`);
    assert.ok(m.settings.length > 0, `${m.id} exposes no settings`);
  }
});

test('GNOME Shell extension requirements are enforced', async () => {
  const data = await engine.bootstrap();
  const shellTheme = data.mods.find((m) => m.id === 'shell-theme');
  assert.equal(shellTheme.compat.ok, true, JSON.stringify(shellTheme.compat.problems));

  const { seed } = require('./sandbox');
  const fsx = require('node:fs');
  const p = require('node:path').join(GSDB, 'org.gnome.shell');
  fsx.writeFileSync(p, "enabled-extensions=@as []\ndisabled-extensions=@as []\n");
  engine.reload();
  const after = await engine.bootstrap();
  const stale = after.mods.find((m) => m.id === 'shell-theme');
  assert.equal(stale.compat.ok, false);
  assert.match(stale.compat.problems.join(' '), /user-theme/);

  // restore for any later test
  fsx.writeFileSync(p, "enabled-extensions=['user-theme@gnome-shell-extensions.gcampax.github.com']\ndisabled-extensions=@as []\n");
  engine.reload();
});

test('install plans are validated and never shell-interpolated', () => {
  const deb = { id: 'x', name: 'X', package: 'gnome-tweaks' };
  const plan = apps.installPlan(deb);
  assert.equal(plan.kind, 'apt');
  assert.equal(plan.cmd, 'pkexec');
  assert.deepEqual(plan.args, ['env', 'DEBIAN_FRONTEND=noninteractive', 'apt-get', 'install', '-y', 'gnome-tweaks']);
  assert.equal(plan.display, 'sudo apt install gnome-tweaks');

  const fp = apps.installPlan({ id: 'y', name: 'Y', flatpak: 'com.github.GradienceTeam.Gradience' });
  assert.equal(fp.kind, 'flatpak');
  assert.deepEqual(fp.args, ['install', '-y', '--noninteractive', 'flathub', 'com.github.GradienceTeam.Gradience']);

  assert.throws(() => apps.installPlan({ id: 'z', name: 'Z', package: 'foo; rm -rf /' }), /unsafe package/);
  assert.throws(() => apps.installPlan({ id: 'z', name: 'Z', flatpak: '../../etc' }), /unsafe flatpak/);
  assert.throws(() => apps.installPlan({ id: 'z', name: 'Z' }), /no install source/);
});

test('the catalogue is installable, and projects stay out of it', async () => {
  const catalog = apps.readCatalog();
  assert.equal(catalog.errors, undefined);
  const loaded = await apps.loadApps();
  assert.equal(loaded.errors.length, 0, JSON.stringify(loaded.errors));
  assert.ok(loaded.apps.length >= 30, `expected an expanded catalogue, got ${loaded.apps.length}`);

  for (const app of loaded.apps) {
    assert.equal(app.purpose, 'customization');
    assert.ok(app.installCommand.startsWith('sudo apt install ') || app.installCommand.startsWith('flatpak install '), app.id);
    assert.equal(app.installable, true);
    assert.ok(['apt', 'flatpak'].includes(app.installKind));
  }

  assert.equal(loaded.projects.length, 2);
  const names = loaded.projects.map((p) => p.name).sort();
  assert.deepEqual(names, ['Windows 11 File Explorer for Linux', 'Windows 11 Task Manager for Linux']);
  for (const p of loaded.projects) {
    assert.equal(p.kind, 'project');
    assert.match(p.repo, /^https:\/\/github\.com\/asifbaburcopy-a11y\//);
  }
  assert.equal(loaded.apps.some((a) => a.id.startsWith('project-')), false, 'projects must not leak into the catalogue');

  assert.ok(apps.validateProject({ id: 'a', name: 'A', kind: 'app', repo: 'https://github.com/x/y' }).length > 0);
  assert.ok(apps.validateProject({ id: 'a', name: 'A', kind: 'project', repo: 'https://example.com/x' }).length > 0);
});

test('the app picker only offers installed applications', async () => {
  const data = await engine.bootstrap();
  const perApp = data.mods.find((m) => m.id === 'per-app-env');
  const appSpec = perApp.settings.find((s) => s.type === 'app');
  assert.ok(appSpec.options.length > 0);
  assert.ok(appSpec.options.some((o) => o.value === 'fake-electron'));
});

/* Two mods writing the same key contradict each other: one applies, the other
 * applies on top, and whichever reverts first restores a value the other never
 * chose. This static audit resolves const-aliases and fails on any key claimed
 * by more than one mod. (User CSS is exempt by design: each mod owns its own
 * marked block inside gtk.css, so those cannot collide.) */
test('no two mods write the same settings key', () => {
  const dir = path.join(__dirname, '..', 'mods');
  const writes = new Map();

  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.twmod.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const id = (src.match(/id:\s*'([^']+)'/) || [])[1] || f;
    const consts = {};
    for (const m of src.matchAll(/const\s+([A-Z_][A-Z0-9_]*)\s*=\s*'([^']+)';/g)) consts[m[1]] = m[2];

    const add = (schema, key) => {
      const k = `${schema} ${key}`;
      if (!writes.has(k)) writes.set(k, new Set());
      writes.get(k).add(id);
    };
    for (const m of src.matchAll(/ctx\.gsettings\(\s*(['"])([^'"]+)\1\s*,\s*(['"])([^'"]+)\3/g)) add(m[2], m[4]);
    for (const m of src.matchAll(/ctx\.gsettings\(\s*([A-Z_][A-Z0-9_]*)\s*,\s*(['"])([^'"]+)\2/g)) {
      if (consts[m[1]]) add(consts[m[1]], m[3]);
    }
  }

  const collisions = [...writes]
    .filter(([, owners]) => owners.size > 1)
    .map(([k, owners]) => `${k} is written by ${[...owners].join(' and ')}`);

  assert.deepEqual(collisions, [], `contradictory mods:\n${collisions.join('\n')}`);
  assert.ok(writes.size > 150, `expected a wide key surface, got ${writes.size}`);
  console.log(`key ownership clean: ${writes.size} keys, ${writes.size} distinct owners-checked entries, 0 collisions`);
});
