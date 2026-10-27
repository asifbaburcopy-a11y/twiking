'use strict';
/* GNOME Shell theme (top bar, overview, dash) via the official user-theme
 * extension. Requires the extension to be enabled — the mod says so instead of
 * silently doing nothing. */

module.exports = {
  meta: {
    id: 'shell-theme',
    name: 'Shell Theme',
    description: 'Theme the top bar, overview and dash through the GNOME user-theme extension.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'layers',
    license: 'MIT',
    tags: ['shell', 'theme', 'top bar', 'overview'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      extensions: ['user-theme@gnome-shell-extensions.gcampax.github.com'],
      keys: [['org.gnome.shell.extensions.user-theme', 'name']],
    },
  },

  settings: [
    {
      key: 'theme',
      name: 'Shell theme',
      description: 'Themes that include a gnome-shell/ directory will show up here. "Default" follows the GTK theme.',
      type: 'select',
      optionsFrom: 'themes',
      default: 'ZorinBlue-Dark',
    },
  ],

  apply(ctx) {
    const theme = String(ctx.settings.theme || '').trim();
    return ctx.gsettings('org.gnome.shell.extensions.user-theme', 'name', theme || '');
  },
};
