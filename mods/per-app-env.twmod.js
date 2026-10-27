'use strict';
/* Per-application tweaks — the Linux equivalent of Windhawk targeting one
 * process. Instead of injecting a DLL we wrap the app's launcher and set
 * environment variables, which is how most app-specific Linux tweaks work. */

const PRESETS = {
  'electron-wayland': {
    label: 'Electron app on Wayland (crisper text, fractional scaling)',
    vars: { ELECTRON_OZONE_PLATFORM_HINT: 'auto' },
  },
  'gtk-dark': {
    label: 'Force this app dark (GTK_THEME=Adwaita:dark)',
    vars: { GTK_THEME: 'Adwaita:dark' },
  },
  'qt-adwaita': {
    label: 'Make this Qt app follow the GTK theme',
    vars: { QT_QPA_PLATFORMTHEME: 'qt6ct' },
  },
  'no-vsync': {
    label: 'Unlock frame rate (disable vsync) for this app',
    vars: { vblank_mode: '0' },
  },
  custom: { label: 'Custom variables only', vars: {} },
};

module.exports = {
  meta: {
    id: 'per-app-env',
    name: 'Per-App Environment',
    description: 'Wrap one application with environment variables — Wayland flags, forced themes, GPU workarounds. Other apps are untouched.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Applications',
    icon: 'app',
    license: 'MIT',
    tags: ['per-app', 'environment', 'wayland', 'electron'],
    capabilities: ['apps'],
    requires: { desktops: ['GNOME'] },
  },

  settings: [
    {
      key: 'app',
      name: 'Application',
      description: 'Any installed app with a .desktop entry can be wrapped.',
      type: 'app',
      default: '',
    },
    {
      key: 'preset',
      name: 'Preset',
      description: 'A starting point; variables below are always merged on top.',
      type: 'select',
      default: 'electron-wayland',
      options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })),
    },
    {
      key: 'variables',
      name: 'Extra variables',
      description: 'One KEY=value per line. Blank lines and # comments are ignored.',
      type: 'text',
      default: '',
      advanced: true,
    },
  ],

  apply(ctx) {
    const app = String(ctx.settings.app || '').trim();
    if (!app) {
      // A preview should explain, not fail: nothing is wrong, nothing is chosen.
      if (ctx.dryRun) {
        ctx.log('Pick an application to see the wrapper this mod would create.');
        return;
      }
      throw new Error('Choose an application first.');
    }

    const preset = PRESETS[ctx.settings.preset] || { vars: {} };
    const vars = { ...preset.vars };

    for (const line of String(ctx.settings.variables || '').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) {
        ctx.log(`skipped malformed line: ${trimmed}`);
        continue;
      }
      vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }

    const keys = Object.keys(vars);
    if (!keys.length) {
      ctx.log('No variables to set — nothing was wrapped.');
      return;
    }

    ctx.log(`wrapping ${app}: ${keys.map((k) => `${k}=${vars[k]}`).join(' ')}`);
    return ctx.appEnv(app, vars);
  },
};
