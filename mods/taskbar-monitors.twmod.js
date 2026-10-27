'use strict';
/* A taskbar on every screen. The Linux answer to Windhawk's
 * "Taskbar independent per monitor" (5★), "Taskbar multi-tray" (4.87★) and
 * "Primary taskbar on secondary monitor" (4.79★).
 *
 * Four booleans from Zorin's taskbar schema; each one is read by the
 * installed extension (appIcons.js, intellihide.js, prefs.js), so none of
 * them is a dead switch. */

const T = 'org.gnome.shell.extensions.zorin-taskbar';

module.exports = {
  meta: {
    id: 'taskbar-monitors',
    name: 'Taskbar on Multiple Monitors',
    description: 'Show a taskbar on every monitor, carry pinned apps and position across, and choose which taskbars auto-hide.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'dock',
    license: 'MIT',
    tags: ['taskbar', 'monitors', 'multihead', 'dock', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        [T, 'multi-monitors'],
        [T, 'show-favorites-all-monitors'],
        [T, 'panel-element-positions-monitors-sync'],
        [T, 'intellihide-only-secondary'],
      ],
    },
  },

  settings: [
    {
      key: 'allMonitors',
      name: 'Taskbar on every monitor',
      description: 'Off keeps one taskbar on the primary screen; on, each screen gets its own.',
      type: 'bool',
      default: false,
    },
    {
      key: 'favoritesEverywhere',
      name: 'Pinned apps on every taskbar',
      description: 'When off, pinned apps appear only on the primary monitor and the rest show running windows.',
      type: 'bool',
      default: true,
    },
    {
      key: 'syncPositions',
      name: 'Same position on all monitors',
      description: 'Keep the taskbar edge identical everywhere instead of letting monitors differ.',
      type: 'bool',
      default: true,
    },
    {
      key: 'hideSecondaryOnly',
      name: 'Only auto-hide the secondary taskbars',
      description: 'The main taskbar stays put while the ones on other screens step aside for windows.',
      type: 'bool',
      default: false,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings(T, 'multi-monitors', !!s.allMonitors),
      ctx.gsettings(T, 'show-favorites-all-monitors', !!s.favoritesEverywhere),
      ctx.gsettings(T, 'panel-element-positions-monitors-sync', !!s.syncPositions),
      ctx.gsettings(T, 'intellihide-only-secondary', !!s.hideSecondaryOnly),
    ]);
  },
};
