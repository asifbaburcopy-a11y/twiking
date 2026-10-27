'use strict';
/* What the taskbar does when you click it. Zorin's taskbar ships the full
 * Dash-to-Dock click-action matrix; GNOME only exposes it as gsettings, so this
 * is a pure settings mod with nothing to hook. */

const ACTIONS = [
  { value: 'RAISE', label: 'Raise the window' },
  { value: 'MINIMIZE', label: 'Minimise the app' },
  { value: 'LAUNCH', label: 'Open a new window' },
  { value: 'CYCLE', label: 'Cycle through windows' },
  { value: 'CYCLE-MIN', label: 'Cycle, minimise when there is one' },
  { value: 'QUIT', label: 'Close the app' },
  { value: 'TOGGLE-SHOWPREVIEW', label: 'Toggle window previews' },
  { value: 'TOGGLE-CYCLE', label: 'Toggle between windows' },
  { value: 'TOGGLE-SPREAD', label: 'Show every window at once' },
];

module.exports = {
  meta: {
    id: 'taskbar-clicks',
    name: 'Taskbar Clicks',
    description: 'Decide what a click, Shift-click, middle-click and scroll wheel do on the taskbar — minimise, cycle, preview, or close.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'mouse',
    license: 'MIT',
    tags: ['taskbar', 'dock', 'click', 'mouse', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-taskbar', 'click-action'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'shift-click-action'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'middle-click-action'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'shift-middle-click-action'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'scroll-icon-action'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'activate-single-window'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'customize-click'],
      ],
    },
  },

  settings: [
    {
      key: 'primary',
      name: 'Click on an app',
      description: 'The normal left click on an icon with windows.',
      type: 'select',
      default: 'CYCLE-MIN',
      options: ACTIONS,
    },
    {
      key: 'shift',
      name: 'Shift + click',
      description: 'Holding Shift gives one icon a second job.',
      type: 'select',
      default: 'MINIMIZE',
      options: ACTIONS,
    },
    {
      key: 'middle',
      name: 'Middle click',
      description: 'A quick way to launch another window without touching the app first.',
      type: 'select',
      default: 'LAUNCH',
      options: ACTIONS,
    },
    {
      key: 'shiftMiddle',
      name: 'Shift + middle click',
      description: 'Another free combination if you want a second shortcut.',
      type: 'select',
      default: 'LAUNCH',
      options: ACTIONS,
    },
    {
      key: 'scroll',
      name: 'Scroll over an icon',
      description: 'Scroll to switch between that app’s windows, or make the wheel do nothing.',
      type: 'select',
      default: 'CYCLE_WINDOWS',
      options: [
        { value: 'CYCLE_WINDOWS', label: 'Cycle through windows' },
        { value: 'NOTHING', label: 'Do nothing' },
      ],
    },
    {
      key: 'activateSingle',
      name: 'Clicking an app with one window just focuses it',
      description: 'Off means the click action above applies even when only one window is open.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    /* The extension ignores the actions below unless its custom-click switch
     * is on; that switch is exactly what this mod is for. */
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'customize-click', true),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'click-action', s.primary),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'shift-click-action', s.shift),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'middle-click-action', s.middle),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'shift-middle-click-action', s.shiftMiddle),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'scroll-icon-action', s.scroll),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'activate-single-window', !!s.activateSingle),
    ]);
  },
};
