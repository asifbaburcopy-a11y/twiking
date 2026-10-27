'use strict';
/* GTK theme + light/dark preference. Options are read from the themes actually
 * installed on this machine, so the picker never offers a theme you lack. */

module.exports = {
  meta: {
    id: 'gtk-theme',
    name: 'GTK Theme & Colour Scheme',
    description: 'Switch the GTK theme from what is installed, and force light or dark regardless of the wallpaper.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'palette',
    license: 'MIT',
    tags: ['theme', 'dark mode', 'zorin', 'gtk'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.interface', 'gtk-theme']],
    },
  },

  settings: [
    {
      key: 'theme',
      name: 'GTK theme',
      description: 'Read from ~/.themes, ~/.local/share/themes and /usr/share/themes.',
      type: 'select',
      optionsFrom: 'themes',
      default: 'Adwaita',
    },
    {
      key: 'scheme',
      name: 'Colour scheme',
      description: 'libadwaita follows this for modern GNOME apps; "follow system" keeps the current automatic behaviour.',
      type: 'select',
      default: 'prefer-dark',
      options: [
        { value: 'default', label: 'Follow system' },
        { value: 'prefer-dark', label: 'Always dark' },
        { value: 'prefer-light', label: 'Always light' },
      ],
    },
  ],

  apply(ctx) {
    const t = ctx.settings;
    const ops = [ctx.gsettings('org.gnome.desktop.interface', 'color-scheme', t.scheme)];
    if (t.theme) ops.push(ctx.gsettings('org.gnome.desktop.interface', 'gtk-theme', t.theme));
    return Promise.all(ops);
  },
};
