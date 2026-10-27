'use strict';
/* Text cursor blinking. The Linux answer to Windhawk's caret/cursor mods:
 * GTK exposes the blink flag and the blink interval as ordinary settings, so
 * there is nothing to hook. */

module.exports = {
  meta: {
    id: 'text-cursor',
    name: 'Text Cursor',
    description: 'Stop the text caret from blinking, or make it blink at a calmer rate.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'keyboard',
    license: 'MIT',
    tags: ['cursor', 'caret', 'blink', 'text', 'accessibility'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.interface', 'cursor-blink'],
        ['org.gnome.desktop.interface', 'cursor-blink-time'],
      ],
    },
  },

  settings: [
    {
      key: 'blink',
      name: 'Blink the text cursor',
      description: 'Turn this off for a caret that stays solid — easier on the eyes when typing a lot.',
      type: 'bool',
      default: true,
    },
    {
      key: 'blinkTime',
      name: 'Blink interval',
      description: 'How long the caret stays visible before it hides. The GNOME default is 1200 ms.',
      type: 'int',
      default: 1200,
      min: 100,
      max: 2500,
      step: 100,
      suffix: 'ms',
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ops = [ctx.gsettings('org.gnome.desktop.interface', 'cursor-blink', !!s.blink)];
    /* The interval only matters when blinking is on; setting it while the
     * caret is solid would add a change the user cannot see. */
    if (s.blink) {
      ops.push(ctx.gsettings('org.gnome.desktop.interface', 'cursor-blink-time', Number(s.blinkTime)));
    }
    return Promise.all(ops);
  },
};
