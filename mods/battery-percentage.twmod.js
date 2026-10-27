'use strict';
/* Battery percentage in the top bar. Only offered on machines that have a
 * battery, so a desktop never shows a tweak that does nothing. */

module.exports = {
  meta: {
    id: 'battery-percentage',
    name: 'Battery Percentage',
    description: 'Show the exact charge level next to the battery icon in the top bar.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Power',
    icon: 'battery',
    license: 'MIT',
    tags: ['battery', 'laptop', 'top bar'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.interface', 'show-battery-percentage']],
    },
  },

  settings: [
    { key: 'show', name: 'Show percentage', description: 'Displayed only when a battery is present.', type: 'bool', default: true },
  ],

  apply(ctx) {
    return ctx.gsettings('org.gnome.desktop.interface', 'show-battery-percentage', !!ctx.settings.show);
  },
};
