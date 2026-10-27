'use strict';
/* Cursor themes are the Linux equivalent of Windhawk's cursor mods: one theme
 * name, applied system-wide, instantly. */

module.exports = {
  meta: {
    id: 'cursor-theme',
    name: 'Cursor Theme',
    description: 'Change the mouse pointer shape from the cursor sets installed here, with a size that matches.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'focus',
    license: 'MIT',
    tags: ['cursor', 'pointer', 'accessibility'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.interface', 'cursor-theme'],
        ['org.gnome.desktop.interface', 'cursor-size'],
      ],
    },
  },

  settings: [
    {
      key: 'theme',
      name: 'Cursor theme',
      description: 'Only themes that ship a cursors/ directory are listed.',
      type: 'select',
      optionsFrom: 'cursors',
      default: 'Adwaita',
    },
    {
      key: 'size',
      name: 'Cursor size',
      description: '24 px is the default; 32–48 px is easier to track on large screens.',
      type: 'int',
      default: 24,
      min: 16,
      max: 64,
      step: 2,
      suffix: 'px',
    },
  ],

  apply(ctx) {
    const ops = [ctx.gsettings('org.gnome.desktop.interface', 'cursor-size', Number(ctx.settings.size))];
    if (ctx.settings.theme) {
      ops.push(ctx.gsettings('org.gnome.desktop.interface', 'cursor-theme', ctx.settings.theme));
    }
    return Promise.all(ops);
  },
};
