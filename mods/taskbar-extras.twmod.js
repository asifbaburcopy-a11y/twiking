'use strict';
/* Taskbar keyboard switching and the Show Desktop button — the Windhawk
 * "Taskbar Virtual Desktop Switcher" / "Aero Peek on Show desktop" family. */

module.exports = {
  meta: {
    id: 'taskbar-extras',
    name: 'Taskbar Extras',
    description: 'Use Super+1…0 to jump to taskbar apps, choose the number row or keypad, and show or hide the Show Desktop button.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'dock',
    license: 'MIT',
    tags: ['taskbar', 'hotkeys', 'super', 'show desktop', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-taskbar', 'hot-keys'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'shortcut-num-keys'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'show-showdesktop-icon'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'showdesktop-button-width'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'show-showdesktop-hover'],
      ],
    },
  },

  settings: [
    { key: 'hotkeys', name: 'Super+number app shortcuts', description: 'Super+1 focuses or launches the first taskbar app, Super+2 the second, and so on.', type: 'bool', default: true },
    {
      key: 'numKeys',
      name: 'Which number keys',
      description: 'The row above the letters, the numeric keypad, or both.',
      type: 'select',
      default: 'NUM_ROW',
      options: [
        { value: 'NUM_ROW', label: 'Number row' },
        { value: 'NUM_KEYPAD', label: 'Numeric keypad' },
        { value: 'BOTH', label: 'Both' },
      ],
    },
    { key: 'showDesktop', name: 'Show Desktop button', description: 'The button at the end of the taskbar that clears the screen.', type: 'bool', default: true },
    {
      key: 'desktopWidth',
      name: 'Show Desktop width',
      description: 'How wide the button is, in pixels.',
      type: 'int',
      default: 8,
      min: 0,
      max: 32,
      step: 2,
      suffix: 'px',
    },
    { key: 'desktopHover', name: 'Peek on hover', description: 'Hovering the button fades windows out so you can see the desktop.', type: 'bool', default: true },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'hot-keys', !!s.hotkeys),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'shortcut-num-keys', s.numKeys),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'show-showdesktop-icon', !!s.showDesktop),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'showdesktop-button-width', Number(s.desktopWidth)),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'show-showdesktop-hover', !!s.desktopHover),
    ]);
  },
};
