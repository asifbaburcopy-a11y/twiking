'use strict';
/* Two small GTK behaviours that Windhawk mods touch on Windows: hiding overlay
 * scrollbars, and middle-click paste (the X11 primary selection). Both are
 * ordinary GTK settings, so they apply to newly opened apps. */

module.exports = {
  meta: {
    id: 'scrollbars-paste',
    name: 'Scrollbars & Middle-Click Paste',
    description: 'Use thin overlay scrollbars instead of permanent ones, and paste the selected text with a middle click.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'mouse',
    license: 'MIT',
    tags: ['scrollbars', 'overlay', 'middle click', 'paste', 'gtk'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.interface', 'overlay-scrolling'],
        ['org.gnome.desktop.interface', 'gtk-enable-primary-paste'],
      ],
    },
  },

  settings: [
    {
      key: 'overlay',
      name: 'Thin overlay scrollbars',
      description: 'Scrollbars appear while scrolling and fade out afterwards. Off keeps them visible.',
      type: 'bool',
      default: true,
    },
    {
      key: 'middlePaste',
      name: 'Middle-click paste',
      description: 'Clicking the middle button pastes the primary selection, the way X11 terminals do.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.interface', 'overlay-scrolling', !!ctx.settings.overlay),
      ctx.gsettings('org.gnome.desktop.interface', 'gtk-enable-primary-paste', !!ctx.settings.middlePaste),
    ]);
  },
};
