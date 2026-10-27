'use strict';
/* Engine tests.
 *
 * The whole point of Twiking is that enabling and disabling cannot damage a
 * desktop, so these tests drive the real engine against a fake HOME with a fake
 * `gsettings` binary (see sandbox.js): nothing here can touch the machine
 * running them.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { HOME, DATA, gsValue, setGs } = require('./sandbox');

const engine = require('../engine');
const mods = require('../engine/mods');
const apps = require('../engine/apps');
const journal = require('../engine/journal');

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

test('all bundled mods load and validate', () => {
  const list = mods.loadAll();
  assert.ok(list.length >= 12, `expected the bundled catalog, got ${list.length}`);
  for (const m of list) assert.equal(m.error, null, `${m.meta.id}: ${m.error}`);
  const ids = list.map((m) => m.meta.id);
  assert.ok(ids.includes('window-buttons'));
  assert.ok(ids.includes('per-app-env'));
  assert.equal(new Set(ids).size, ids.length, 'mod ids must be unique');
});

test('bootstrap reports the real shapes the UI needs', async () => {
  const data = await engine.bootstrap();
  assert.equal(data.session.gsettings, true);
  assert.ok(data.mods.length >= 12);
  assert.ok(data.apps.length >= 10);
  assert.equal(data.apps.filter((a) => !a.installed).every((a) => a.installCommand.length > 0), true);
  const clock = data.mods.find((m) => m.id === 'top-bar-clock');
  assert.equal(clock.settings.length, 5);
  assert.equal(clock.compat.ok, true, JSON.stringify(clock.compat.problems));
});

test('enable changes gsettings and disable restores the exact prior value', async () => {
  const before = gsValue('org.gnome.desktop.wm.preferences', 'button-layout');
  assert.equal(before, "'appmenu:minimize,maximize,close'");

  const res = await engine.applyMod('window-buttons', { layout: 'close,minimize,maximize:', appMenu: true });
  assert.equal(res.ok, true);
  assert.equal(gsValue('org.gnome.desktop.wm.preferences', 'button-layout'), "'close,minimize,maximize:'");
  assert.ok(res.changes.length >= 1);

  const state = journal.load();
  assert.equal(state.mods['window-buttons'].enabled, true);
  const op = state.mods['window-buttons'].ops.find((o) => o.key === 'button-layout');
  assert.equal(op.before, "'appmenu:minimize,maximize,close'", 'journal must store the raw prior value');

  const off = await engine.disableMod('window-buttons');
  assert.equal(off.ok, true);
  assert.equal(off.reverted, 1);
  assert.equal(gsValue('org.gnome.desktop.wm.preferences', 'button-layout'), before, 'must be byte-identical');
  assert.equal(journal.load().mods['window-buttons'].enabled, false);
});

test('re-applying with new settings does not stack operations', async () => {
  const first = await engine.applyMod('top-bar-clock', { seconds: true, date: true, weekday: true, format: '24h', weekNumbers: true });
  assert.equal(first.ok, true);
  assert.equal(gsValue('org.gnome.desktop.interface', 'clock-show-seconds'), 'true');
  assert.equal(gsValue('org.gnome.desktop.calendar', 'show-weekdate'), 'true');

  const second = await engine.applyMod('top-bar-clock', { seconds: false, date: false, weekday: false, format: '12h', weekNumbers: false });
  assert.equal(second.ok, true);
  assert.equal(gsValue('org.gnome.desktop.interface', 'clock-show-seconds'), 'false');
  assert.equal(gsValue('org.gnome.desktop.interface', 'clock-format'), "'12h'");
  assert.equal(gsValue('org.gnome.desktop.calendar', 'show-weekdate'), 'false');

  /* The second apply only rewrites what actually differs from the restored
   * original (date and format), so the journal must hold exactly those two. */
  const ops = journal.load().mods['top-bar-clock'].ops;
  assert.deepEqual(
    ops.map((o) => o.key).sort(),
    ['clock-format', 'clock-show-date'],
    'no stale or duplicated operations may survive a re-apply'
  );

  await engine.disableMod('top-bar-clock');
  assert.equal(gsValue('org.gnome.desktop.interface', 'clock-format'), "'24h'");
  assert.equal(gsValue('org.gnome.desktop.interface', 'clock-show-date'), 'true', 'original true must come back');
});

test('values the app never changed are restored, not defaulted', async () => {
  setGs('org.gnome.desktop.interface', 'text-scaling-factor', '1.15');
  await engine.applyMod('text-scaling', { scale: '1.5' });
  assert.equal(gsValue('org.gnome.desktop.interface', 'text-scaling-factor'), '1.5');
  await engine.disableMod('text-scaling');
  assert.equal(gsValue('org.gnome.desktop.interface', 'text-scaling-factor'), '1.15', 'custom 1.15 must return');
});

test('plan is read-only and reports precise intents', async () => {
  const before = gsValue('org.gnome.desktop.interface', 'gtk-theme');
  const plan = await engine.planMod('gtk-theme', { theme: 'Adwaita-dark', scheme: 'prefer-light' });
  assert.equal(plan.ok, true);
  assert.ok(plan.intents.length >= 2);
  const themeIntent = plan.intents.find((i) => i.key === 'gtk-theme');
  assert.equal(themeIntent.from, 'ZorinBlue-Dark');
  assert.equal(themeIntent.to, 'Adwaita-dark');
  assert.equal(gsValue('org.gnome.desktop.interface', 'gtk-theme'), before, 'planning must not write');

  /* Cursor size has exactly one owner: Cursor Theme, not GTK Theme. */
  const cursorPlan = await engine.planMod('cursor-theme', { theme: 'Adwaita', size: 32 });
  assert.ok(cursorPlan.intents.some((i) => i.key === 'cursor-size'), 'cursor-theme owns cursor-size');
  const gtkKeys = plan.intents.map((i) => i.key);
  assert.ok(!gtkKeys.includes('cursor-size'), 'gtk-theme must not write cursor-size anymore');
});

test('GTK CSS blocks are scoped, preserve user CSS, and revert cleanly', async () => {
  const cssPath = path.join(HOME, '.config', 'gtk-4.0', 'gtk.css');
  const userCss = '/* my own tweak */\nwindow { opacity: 0.99; }\n';
  fs.writeFileSync(cssPath, userCss);

  await engine.applyMod('compact-gtk', { density: 'dense', squareCorners: true, gtk3: true });
  const written = read(cssPath);
  assert.ok(written.includes('/* >>> Twiking compact-gtk >>> */'));
  assert.ok(written.includes('/* <<< Twiking compact-gtk <<< */'));
  assert.ok(written.includes('my own tweak'), 'user CSS must survive');
  assert.ok(written.includes('min-height: 30px'), 'dense headerbars');
  assert.ok(written.includes('border-radius: 0'));
  assert.ok(read(path.join(HOME, '.config', 'gtk-3.0', 'gtk.css')).includes('border-radius: 0'));

  await engine.disableMod('compact-gtk');
  assert.equal(read(cssPath), userCss, 'file must be restored byte-for-byte');
  assert.equal(exists(cssPath), true, 'a pre-existing file must not be deleted');
});

test('a mod-created CSS file is removed when it was not there before', async () => {
  const cssPath = path.join(HOME, '.config', 'gtk-3.0', 'gtk.css');
  if (exists(cssPath)) fs.unlinkSync(cssPath);
  await engine.applyMod('compact-gtk', { density: 'compact', squareCorners: false, gtk3: true });
  assert.equal(exists(cssPath), true);
  await engine.disableMod('compact-gtk');
  assert.equal(exists(cssPath), false, 'a file Twiking created must be removed');
});

test('per-app mod wraps only the chosen application and unwraps on disable', async () => {
  const override = path.join(HOME, '.local', 'share', 'applications', 'fake-electron.desktop');
  const wrapper = path.join(DATA, 'wrappers', 'fake-electron.sh');
  const original = read(override);

  const res = await engine.applyMod('per-app-env', {
    app: 'fake-electron',
    preset: 'electron-wayland',
    variables: '# extra\nGTK_THEME=Adwaita-dark',
  });
  assert.equal(res.ok, true);

  assert.ok(exists(wrapper));
  const script = read(wrapper);
  assert.match(script, /ELECTRON_OZONE_PLATFORM_HINT='auto'/);
  assert.match(script, /GTK_THEME='Adwaita-dark'/);
  assert.match(script, /exec '\/usr\/bin\/fake-electron' "\$@"/);

  const entry = read(override);
  assert.match(entry, /Exec=.*fake-electron\.sh %U/);
  assert.match(entry, /Name=Fake Electron App/);

  await engine.disableMod('per-app-env');
  assert.equal(exists(wrapper), false);
  assert.equal(read(override), original, 'the original desktop entry must come back');
});

test('re-applying a per-app mod never leaves a wrapper pointing at a deleted script', async () => {
  const override = path.join(HOME, '.local', 'share', 'applications', 'fake-electron.desktop');
  const original = read(override);

  await engine.applyMod('per-app-env', { app: 'fake-electron', preset: 'gtk-dark', variables: '' });
  await engine.applyMod('per-app-env', { app: 'fake-electron', preset: 'electron-wayland', variables: '' });
  const entry = read(override);
  const execLine = entry.split('\n').find((l) => l.startsWith('Exec='));
  const target = execLine.slice(5).split(' ')[0];
  assert.ok(exists(target), `launcher target ${target} must exist while the mod is enabled`);
  assert.match(read(target), /ELECTRON_OZONE_PLATFORM_HINT='auto'/, 'latest settings must win');

  await engine.disableMod('per-app-env');
  assert.equal(read(override), original);
});

test('an app with no desktop entry fails cleanly instead of half-applying', async () => {
  await assert.rejects(
    () => engine.applyMod('per-app-env', { app: 'does-not-exist', preset: 'gtk-dark', variables: '' }),
    /no desktop entry/i
  );
  assert.equal(journal.load().mods['per-app-env'].enabled, false);
});

test('environment.d file is written and removed', async () => {
  await engine.applyMod('qt-styling', { engine: 'kvantum', autoScale: true });
  const file = path.join(HOME, '.config', 'environment.d', '60-twiking-qt.conf');
  const content = read(file);
  assert.match(content, /QT_STYLE_OVERRIDE=kvantum/);
  assert.match(content, /QT_AUTO_SCREEN_SCALE_FACTOR=1/);
  await engine.disableMod('qt-styling');
  assert.equal(exists(file), false);
});

test('capability enforcement rejects a mod that oversteps its declaration', async () => {
  fs.mkdirSync(path.join(DATA, 'mods'), { recursive: true });
  fs.writeFileSync(
    path.join(DATA, 'mods', 'sneaky.twmod.js'),
    `module.exports = {
      meta: { id: 'sneaky', name: 'Sneaky', description: 'declares settings but writes files', version: '1.0.0', author: 'test', category: 'Experimental', capabilities: ['settings'] },
      settings: [],
      apply(ctx) { return ctx.file('~/.config/gtk-4.0/gtk.css', 'body {}'); },
    };`
  );
  await assert.rejects(() => engine.applyMod('sneaky', {}), /capability/);
  const state = journal.load();
  assert.equal(state.mods.sneaky.enabled, false);
  assert.equal(state.mods.sneaky.ops.length, 0);
});

test('revert-all unwinds several mods at once', async () => {
  await engine.applyMod('ui-animations', { animations: false });
  await engine.applyMod('hot-corner', { enabled: true });
  assert.equal(gsValue('org.gnome.desktop.interface', 'enable-animations'), 'false');
  assert.equal(gsValue('org.gnome.desktop.interface', 'enable-hot-corners'), 'true');

  const res = await engine.revertAll();
  assert.equal(res.ok, true);
  assert.ok(res.mods.length >= 2);
  assert.equal(gsValue('org.gnome.desktop.interface', 'enable-animations'), 'true');
  assert.equal(gsValue('org.gnome.desktop.interface', 'enable-hot-corners'), 'false');
  const state = journal.load();
  assert.equal(Object.values(state.mods).filter((m) => m.enabled).length, 0);
});

test('apps catalog only accepts customization-only entries', async () => {
  const catalog = apps.readCatalog();
  const allowed = catalog.allowedCategories;
  const good = catalog.apps.find((a) => a.id === 'gnome-tweaks');
  assert.deepEqual(apps.validate(good, allowed), []);

  assert.ok(apps.validate({ ...good, purpose: 'utility' }, allowed).length > 0);
  assert.ok(apps.validate({ ...good, categories: ['Gaming'] }, allowed).length > 0);
  assert.ok(apps.validate({ id: 'x', name: 'X', purpose: 'customization', categories: ['Themes'] }, allowed).length > 0, 'no install source');

  const loaded = await apps.loadApps();
  assert.equal(loaded.errors.length, 0);
  for (const a of loaded.apps) {
    assert.equal(a.purpose, 'customization');
    for (const c of a.categories) assert.ok(allowed.includes(c));
  }
});

test('preview lists file and CSS changes without writing them', async () => {
  const conf = path.join(HOME, '.config', 'environment.d', '60-twiking-qt.conf');
  const before = fs.existsSync(conf) ? fs.readFileSync(conf, 'utf8') : null;

  const plan = await engine.planMod('qt-styling', { engine: 'kvantum', autoScale: true });
  assert.equal(plan.ok, true);
  const files = plan.intents.filter((i) => i.kind === 'file');
  assert.equal(files.length, 1, 'file change must appear in the preview');
  assert.match(files[0].desc, /60-twiking-qt\.conf/);

  const cssPlan = await engine.planMod('compact-gtk', { density: 'dense', squareCorners: true, gtk3: false });
  assert.equal(cssPlan.ok, true);
  assert.ok(cssPlan.intents.some((i) => i.kind === 'file' && /gtk\.css/.test(i.desc)), 'CSS must appear in the preview');

  assert.equal(fs.existsSync(conf) ? fs.readFileSync(conf, 'utf8') : null, before, 'preview wrote a file');
});

test('a broken mod file is reported, not fatal', async () => {
  const dir = path.join(DATA, 'mods');
  fs.mkdirSync(dir, { recursive: true });
  const bad = path.join(dir, 'broken-mod.twmod.js');
  fs.writeFileSync(bad, "module.exports = { meta: { id: 'broken-mod' settings: [; ");
  try {
    const st = await engine.bootstrap();
    const entry = st.mods.find((m) => m.id === 'broken-mod');
    assert.ok(entry, 'the broken mod is still listed');
    assert.ok(entry.loadError, 'its load error is surfaced');
    assert.ok(st.mods.length >= 29, 'the rest of the catalogue survives');
    assert.ok(st.mods.some((m) => m.id === 'window-buttons' && !m.loadError));
  } finally {
    fs.unlinkSync(bad);
  }
});

test('scaffolding creates a valid, loadable mod', () => {
  const created = mods.scaffold('My Test Mod');
  assert.equal(created.id, 'my-test-mod');
  const loaded = mods.loadAll().find((m) => m.meta.id === 'my-test-mod');
  assert.equal(loaded.error, null);
  assert.ok(loaded.source.includes('module.exports'));
});

test('window-buttons keeps buttons on the right when the app menu is off', async () => {
  await engine.applyMod('window-buttons', { layout: 'appmenu:minimize,maximize,close', appMenu: false });
  assert.equal(
    gsValue('org.gnome.desktop.wm.preferences', 'button-layout'),
    "':minimize,maximize,close'",
    'dropping appmenu must keep the left:right separator'
  );
  await engine.disableMod('window-buttons');
  assert.equal(gsValue('org.gnome.desktop.wm.preferences', 'button-layout'), "'appmenu:minimize,maximize,close'");
});

test('hot-corner can free the Super key, and repair it when kept', async () => {
  await engine.applyMod('hot-corner', { enabled: false, hotkeys: false });
  assert.equal(gsValue('org.gnome.mutter', 'overlay-key'), "''", 'hotkeys off must clear the overlay key');
  await engine.disableMod('hot-corner');
  assert.equal(gsValue('org.gnome.mutter', 'overlay-key'), "'Super_L'");

  setGs('org.gnome.mutter', 'overlay-key', "''");
  await engine.applyMod('hot-corner', { enabled: true, hotkeys: true });
  assert.equal(gsValue('org.gnome.mutter', 'overlay-key'), "'Super_L'", 'hotkeys on must repair a blank overlay key');
  await engine.disableMod('hot-corner');
  assert.equal(gsValue('org.gnome.mutter', 'overlay-key'), "''");
});

test('typed literals compare by value, so the same value is not a change', async () => {
  setGs('org.gnome.desktop.peripherals.keyboard', 'delay', 'uint32 550');
  setGs('org.gnome.desktop.peripherals.keyboard', 'repeat-interval', 'uint32 35');
  const kb = await engine.planMod('keyboard-repeat', { repeat: true, delay: 550, interval: 35 });
  assert.equal(kb.ok, true);
  assert.equal(kb.intents.length, 0, 'uint32 550 must be the same value as 550');

  setGs('org.gnome.desktop.interface', 'text-scaling-factor', '2.0');
  const ts = await engine.planMod('text-scaling', { scale: '2', hint: 'slight' });
  assert.equal(ts.ok, true);
  assert.equal(ts.intents.length, 0, '2.0 must be the same value as 2');
});
