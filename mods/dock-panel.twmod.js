'use strict';
/* Taskbar placement and hiding. This is the Linux answer to the huge family of
 * Windhawk taskbar mods — on Zorin the taskbar is a Shell extension whose
 * preferences are ordinary gsettings keys. */

module.exports = {
  meta: {
    id: 'dock-panel',
    name: 'Dock & Panel',
    description: 'Move the Zorin taskbar to any edge, resize it, make it hide itself, and keep workspaces separate.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'dock',
    license: 'MIT',
    tags: ['taskbar', 'dock', 'panel', 'zorin', 'autohide'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-taskbar', 'panel-position'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'intellihide'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'panel-size'],
      ],
    },
  },

  settings: [
    {
      key: 'position',
      name: 'Taskbar position',
      description: 'Which screen edge the taskbar sits on.',
      type: 'select',
      default: 'BOTTOM',
      options: [
        { value: 'BOTTOM', label: 'Bottom' },
        { value: 'TOP', label: 'Top' },
        { value: 'LEFT', label: 'Left' },
        { value: 'RIGHT', label: 'Right' },
      ],
    },
    {
      key: 'panelSize',
      name: 'Panel thickness',
      description: 'Height for a top/bottom taskbar, width for a side one.',
      type: 'int',
      default: 48,
      min: 32,
      max: 72,
      step: 2,
      suffix: 'px',
    },
    { key: 'autoHide', name: 'Hide when a window overlaps', description: 'The “intellihide” behaviour: the panel steps out of the way only when it would cover a window.', type: 'bool', default: false },
    { key: 'isolateWorkspaces', name: 'Taskbar shows only current workspace', description: 'Otherwise windows from every workspace are listed together.', type: 'bool', default: false },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'panel-position', s.position),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'intellihide', !!s.autoHide),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'isolate-workspaces', !!s.isolateWorkspaces),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'panel-size', Number(s.panelSize)),
    ]);
  },
};
