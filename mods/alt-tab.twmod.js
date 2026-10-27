'use strict';
/* Alt-Tab scope: switch within the current workspace or across all of them.
 * Windhawk has a whole family of Alt+Tab mods; on GNOME this is the part of
 * that behaviour that is actually configurable without replacing the switcher. */

module.exports = {
  meta: {
    id: 'alt-tab',
    name: 'Alt-Tab Scope',
    description: 'Keep Alt-Tab inside the current workspace, or let it jump across every workspace.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'switch',
    license: 'MIT',
    tags: ['alt tab', 'switcher', 'workspaces', 'windows'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.shell.app-switcher', 'current-workspace-only']],
    },
  },

  settings: [
    {
      key: 'appsCurrent',
      name: 'App switcher: current workspace only',
      description: 'Alt-Tab lists apps from this workspace instead of every workspace.',
      type: 'bool',
      default: false,
    },
    {
      key: 'windowsCurrent',
      name: 'Window switcher: current workspace only',
      description: 'Applies to Alt-` (switch windows of the same app).',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.app-switcher', 'current-workspace-only', !!s.appsCurrent),
      ctx.gsettings('org.gnome.shell.window-switcher', 'current-workspace-only', !!s.windowsCurrent),
    ]);
  },
};
