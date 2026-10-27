'use strict';
/* The little marks under running apps. Zorin's taskbar calls them dots, but the
 * shapes range from squares to a solid bar, and the focused/unfocused styles
 * are separate keys — the closest Linux equivalent of Windhawk's taskbar
 * indicator mods. */

const STYLES = [
  { value: 'DOTS', label: 'Dots' },
  { value: 'SQUARES', label: 'Squares' },
  { value: 'DASHES', label: 'Dashes' },
  { value: 'SEGMENTED', label: 'Segmented bar' },
  { value: 'SOLID', label: 'Solid line' },
  { value: 'CILIORA', label: 'Ciliora (Zorin default)' },
  { value: 'METRO', label: 'Metro' },
];

module.exports = {
  meta: {
    id: 'taskbar-indicators',
    name: 'Taskbar Indicators',
    description: 'Change the running-app markers under taskbar icons — dots, squares, dashes, a solid line — and their corner shape.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'dock',
    license: 'MIT',
    tags: ['taskbar', 'dock', 'indicators', 'dots', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-taskbar', 'dot-style-focused'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'dot-style-unfocused'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'global-border-radius'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'progress-show-bar'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'progress-show-count'],
      ],
    },
  },

  settings: [
    {
      key: 'focused',
      name: 'Focused app marker',
      description: 'The marker under the app you are currently using.',
      type: 'select',
      default: 'CILIORA',
      options: STYLES,
    },
    {
      key: 'unfocused',
      name: 'Other running apps',
      description: 'The marker for apps that have windows but are not focused.',
      type: 'select',
      default: 'DOTS',
      options: STYLES,
    },
    {
      key: 'radius',
      name: 'Corner radius',
      description: 'Rounds the corners of the indicator and the app icons.',
      type: 'int',
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      suffix: 'px',
    },
    { key: 'progressBar', name: 'Show a progress bar', description: 'A thin bar for downloads and copies running inside the app.', type: 'bool', default: true },
    { key: 'progressCount', name: 'Show the number of progress items', description: 'Adds a badge with how many operations are running.', type: 'bool', default: true },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'dot-style-focused', s.focused),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'dot-style-unfocused', s.unfocused),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'global-border-radius', Number(s.radius)),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'progress-show-bar', !!s.progressBar),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'progress-show-count', !!s.progressCount),
    ]);
  },
};
