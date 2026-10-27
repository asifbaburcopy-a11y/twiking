'use strict';
/* Windhawk has dozens of mods that restyle Explorer's icons. On Linux the
 * equivalent is one system setting, and the picker lists the icon sets that are
 * actually installed instead of inventing names. */

module.exports = {
  meta: {
    id: 'icon-theme',
    name: 'Icon Theme',
    description: 'Switch the system icon theme from the sets installed on this machine.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'grid',
    license: 'MIT',
    tags: ['icons', 'theme', 'papirus', 'numix'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.interface', 'icon-theme']],
    },
  },

  settings: [
    {
      key: 'theme',
      name: 'Icon theme',
      description: 'Read from ~/.icons, ~/.local/share/icons and /usr/share/icons. Newly opened apps pick it up immediately.',
      type: 'select',
      optionsFrom: 'icons',
      default: 'Adwaita',
    },
  ],

  apply(ctx) {
    if (!ctx.settings.theme) {
      ctx.log('No icon theme selected.');
      return;
    }
    return ctx.gsettings('org.gnome.desktop.interface', 'icon-theme', ctx.settings.theme);
  },
};
