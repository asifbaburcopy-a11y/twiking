'use strict';
/* System sounds: event alerts, input feedback, and whether volume can exceed
 * 100 % (which lets you amplify quiet output at the cost of distortion). */

module.exports = {
  meta: {
    id: 'sound-effects',
    name: 'Sound Effects',
    description: 'Turn interface sounds on or off, and allow volume above 100% if you need the extra headroom.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'volume',
    license: 'MIT',
    tags: ['sound', 'audio', 'volume'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.sound', 'event-sounds'],
        ['org.gnome.settings-daemon.plugins.media-keys', 'volume-step'],
      ],
    },
  },

  settings: [
    { key: 'events', name: 'Event sounds', description: 'Alert and error sounds for applications.', type: 'bool', default: true },
    { key: 'feedback', name: 'Input feedback sounds', description: 'Clicks and beeps while typing or toggling controls.', type: 'bool', default: false },
    { key: 'loudVolume', name: 'Allow volume above 100%', description: 'Adds amplification beyond the normal maximum; can distort.', type: 'bool', default: false },
    {
      key: 'volumeStep',
      name: 'Volume key step',
      description: 'How much each press of a volume key changes the level. The GNOME default is 6%.',
      type: 'int',
      default: 6,
      min: 1,
      max: 20,
      step: 1,
      suffix: '%',
    },
  ],

  apply(ctx) {
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.sound', 'event-sounds', !!ctx.settings.events),
      ctx.gsettings('org.gnome.desktop.sound', 'input-feedback-sounds', !!ctx.settings.feedback),
      ctx.gsettings('org.gnome.desktop.sound', 'allow-volume-above-100-percent', !!ctx.settings.loudVolume),
      ctx.gsettings('org.gnome.settings-daemon.plugins.media-keys', 'volume-step', Number(ctx.settings.volumeStep)),
    ]);
  },
};
