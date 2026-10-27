'use strict';
/* Turning animations off is the single biggest perceived-speed win on a
 * mid-range laptop, and unlike a shell extension it cannot break the session. */

module.exports = {
  meta: {
    id: 'ui-animations',
    name: 'UI Animations',
    description: 'Turn shell animations on or off. Off feels instant on slow GPUs and virtual machines.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Performance',
    icon: 'bolt',
    license: 'MIT',
    tags: ['speed', 'motion', 'accessibility'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.interface', 'enable-animations']],
    },
  },

  settings: [
    {
      key: 'animations',
      name: 'Enable animations',
      description: 'Window open/close, workspace switching and overview zoom.',
      type: 'bool',
      default: false,
    },
  ],

  apply(ctx) {
    return ctx.gsettings('org.gnome.desktop.interface', 'enable-animations', !!ctx.settings.animations);
  },
};
