'use strict';
/* Key repeat timing. Small setting, disproportionate quality-of-life effect. */

module.exports = {
  meta: {
    id: 'keyboard-repeat',
    name: 'Keyboard Repeat',
    description: 'How fast a held key repeats, and how long it waits before starting.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'keyboard',
    license: 'MIT',
    tags: ['keyboard', 'repeat', 'typing'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.peripherals.keyboard', 'repeat']],
    },
  },

  settings: [
    { key: 'repeat', name: 'Repeat held keys', description: 'Off means holding a key produces exactly one character.', type: 'bool', default: true },
    { key: 'delay', name: 'Delay before repeating', description: 'Milliseconds between pressing and the first repeat.', type: 'int', default: 500, min: 100, max: 1000, step: 50, suffix: 'ms' },
    { key: 'interval', name: 'Repeat speed', description: 'Milliseconds between repeats — lower is faster.', type: 'int', default: 30, min: 15, max: 100, step: 5, suffix: 'ms' },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.peripherals.keyboard', 'repeat', !!s.repeat),
      ctx.gsettings('org.gnome.desktop.peripherals.keyboard', 'delay', Number(s.delay)),
      ctx.gsettings('org.gnome.desktop.peripherals.keyboard', 'repeat-interval', Number(s.interval)),
    ]);
  },
};
