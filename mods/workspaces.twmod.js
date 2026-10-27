'use strict';
/* Dynamic workspaces (add/remove as you go) versus a fixed count. */

module.exports = {
  meta: {
    id: 'workspaces',
    name: 'Workspaces',
    description: 'Dynamic workspaces that appear as you need them, or a fixed number like 4 — your call.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Shell',
    icon: 'grid',
    license: 'MIT',
    tags: ['workspaces', 'overview', 'mutter'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.mutter', 'dynamic-workspaces'],
        ['org.gnome.desktop.wm.preferences', 'num-workspaces'],
        ['org.gnome.desktop.wm.preferences', 'workspace-names'],
      ],
    },
  },

  settings: [
    { key: 'dynamic', name: 'Dynamic workspaces', description: 'A new empty workspace is added when the last one fills up.', type: 'bool', default: true },
    { key: 'count', name: 'Fixed workspace count', description: 'Only used when dynamic workspaces are off.', type: 'int', default: 4, min: 1, max: 12, step: 1 },
    {
      key: 'names',
      name: 'Workspace names',
      description: 'Comma-separated labels shown in the overview, e.g. "Web, Code, Chat". Naming switches to that many fixed workspaces — GNOME only labels static ones — and clearing the box restores the settings above.',
      type: 'text',
      default: '',
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const names = String(s.names || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (names.length) {
      return Promise.all([
        ctx.gsettings('org.gnome.mutter', 'dynamic-workspaces', false),
        ctx.gsettings('org.gnome.desktop.wm.preferences', 'num-workspaces', names.length),
        ctx.gsettings('org.gnome.desktop.wm.preferences', 'workspace-names', names),
      ]);
    }

    const ops = [ctx.gsettings('org.gnome.mutter', 'dynamic-workspaces', !!s.dynamic)];
    if (!s.dynamic) {
      ops.push(ctx.gsettings('org.gnome.desktop.wm.preferences', 'num-workspaces', Number(s.count)));
    }
    /* Drop names that a previous configuration left behind. */
    ops.push(ctx.gsettings('org.gnome.desktop.wm.preferences', 'workspace-names', []));
    return Promise.all(ops);
  },
};
