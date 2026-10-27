'use strict';
/* Make Qt apps stop looking like strangers on a GTK desktop. Writes one file in
 * ~/.config/environment.d, which systemd reads when the next session starts. */

module.exports = {
  meta: {
    id: 'qt-styling',
    name: 'Qt App Styling',
    description: 'Point Qt apps at the GTK theme engine, Kvantum or qt6ct so they match the rest of the desktop.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'qt',
    license: 'MIT',
    tags: ['qt', 'theme', 'environment'],
    capabilities: ['files'],
    requires: { desktops: ['GNOME'] },
  },

  settings: [
    {
      key: 'engine',
      name: 'Qt platform theme',
      description: 'Needs the matching tool installed. Takes effect after you log out and back in.',
      type: 'select',
      default: 'qt6ct',
      options: [
        { value: 'gtk3', label: 'GTK3 theme bridge (needs adwaita-qt or qgnomeplatform)' },
        { value: 'qt6ct', label: 'qt6ct — Qt6 configuration tool' },
        { value: 'kvantum', label: 'Kvantum — SVG Qt style engine' },
      ],
    },
    {
      key: 'autoScale',
      name: 'Respect desktop scaling',
      description: 'Lets Qt apps scale with the GNOME display scale instead of rendering tiny on HiDPI.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    const lines = [
      '# Written by Twiking (Qt App Styling mod).',
      '# Disable the mod in Twiking to remove this file.',
    ];
    if (ctx.settings.engine === 'kvantum') {
      lines.push('QT_STYLE_OVERRIDE=kvantum');
    } else {
      lines.push(`QT_QPA_PLATFORMTHEME=${ctx.settings.engine}`);
    }
    if (ctx.settings.autoScale) {
      lines.push('QT_AUTO_SCREEN_SCALE_FACTOR=1');
    }
    return ctx.file('~/.config/environment.d/60-twiking-qt.conf', `${lines.join('\n')}\n`);
  },
};
