'use strict';
/* Where new windows appear. The Linux answer to Windhawk's "Center New
 * Windows" (4.78★): centring, opening maximised, and keeping modal dialogs
 * attached to their parent. All three are mutter keys read by the compositor
 * itself — verified present in libmutter, so they take effect immediately. */

const MUTTER = 'org.gnome.mutter';

module.exports = {
  meta: {
    id: 'window-placement',
    name: 'Window Placement',
    description: 'Centre new windows instead of letting them wander, open them maximised, and keep dialogs attached to the window that spawned them.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'layers',
    license: 'MIT',
    tags: ['placement', 'centre', 'center', 'maximize', 'dialogs', 'mutter'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        [MUTTER, 'center-new-windows'],
        [MUTTER, 'auto-maximize'],
        [MUTTER, 'attach-modal-dialogs'],
      ],
    },
  },

  settings: [
    {
      key: 'centre',
      name: 'Centre new windows',
      description: 'Open every new window in the middle of the screen instead of scattered across it.',
      type: 'bool',
      default: true,
    },
    {
      key: 'autoMaximize',
      name: 'Open new windows maximised',
      description: 'New windows fill the screen. Handy on small displays, annoying when you want several side by side.',
      type: 'bool',
      default: true,
    },
    {
      key: 'attachModals',
      name: 'Keep dialogs with their window',
      description: 'Save/Open dialogs stay attached to the window that opened them instead of floating free.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings(MUTTER, 'center-new-windows', !!s.centre),
      ctx.gsettings(MUTTER, 'auto-maximize', !!s.autoMaximize),
      ctx.gsettings(MUTTER, 'attach-modal-dialogs', !!s.attachModals),
    ]);
  },
};
