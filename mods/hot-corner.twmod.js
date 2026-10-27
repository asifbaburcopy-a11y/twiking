'use strict';
/* The Activities hot corner: loved by some, triggered accidentally by others. */

module.exports = {
  meta: {
    id: 'hot-corner',
    name: 'Activities Hot Corner',
    description: 'Enable or disable the top-left corner that opens the Activities overview.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Shell',
    icon: 'corner',
    license: 'MIT',
    tags: ['activities', 'corner', 'gestures'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.interface', 'enable-hot-corners'],
        ['org.gnome.mutter', 'overlay-key'],
      ],
    },
  },

  settings: [
    { key: 'enabled', name: 'Hot corner enabled', description: 'On by default in stock GNOME; Zorin ships with layouts that may differ.', type: 'bool', default: false },
    { key: 'hotkeys', name: 'Keep Super-key overview shortcut', description: 'On keeps Super able to open the overview. Off frees the key for apps by clearing mutter’s overlay key.', type: 'bool', default: true },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ops = [ctx.gsettings('org.gnome.desktop.interface', 'enable-hot-corners', !!s.enabled)];

    /* The Super key opens the overview through mutter's overlay-key, which is
     * independent of the hot corner. When the user wants that key back we clear
     * it; when they want it kept we only repair it if it is blank, so a custom
     * binding is never overwritten. */
    if (!s.hotkeys) {
      ops.push(ctx.gsettings('org.gnome.mutter', 'overlay-key', ''));
      return Promise.all(ops);
    }
    return ctx.get('org.gnome.mutter', 'overlay-key').then((current) => {
      if (current.ok && current.raw === "''") {
        ops.push(ctx.gsettings('org.gnome.mutter', 'overlay-key', 'Super_L'));
      }
      return Promise.all(ops);
    });
  },
};
