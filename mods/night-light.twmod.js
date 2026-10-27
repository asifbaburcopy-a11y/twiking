'use strict';
/* Night Light: GNOME's built-in colour-temperature filter. This is the mod that
 * replaces the f.lux / "maintain colour temperature" family from Windhawk —
 * except the compositor already does it, so there is nothing to hook. */

module.exports = {
  meta: {
    id: 'night-light',
    name: 'Night Light',
    description: 'Warm the screen in the evening: set the colour temperature and, if you like, the hours it switches on and off.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Displays',
    icon: 'palette',
    license: 'MIT',
    tags: ['night light', 'blue light', 'colour temperature', 'f.lux', 'eyes'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.settings-daemon.plugins.color', 'night-light-enabled'],
        ['org.gnome.settings-daemon.plugins.color', 'night-light-temperature'],
        ['org.gnome.settings-daemon.plugins.color', 'night-light-schedule-automatic'],
        ['org.gnome.settings-daemon.plugins.color', 'night-light-schedule-from'],
        ['org.gnome.settings-daemon.plugins.color', 'night-light-schedule-to'],
      ],
    },
  },

  settings: [
    { key: 'enabled', name: 'Night Light on', description: 'Warm the screen from now on.', type: 'bool', default: true },
    {
      key: 'temperature',
      name: 'Colour temperature',
      description: 'Lower is warmer. 2700 K is GNOME’s default; 4000 K is a gentle tint.',
      type: 'int',
      default: 2700,
      min: 1700,
      max: 6500,
      step: 100,
      suffix: 'K',
    },
    {
      key: 'automatic',
      name: 'Follow the sun',
      description: 'On: sunrise and sunset are computed from your location. Off: use the hours below.',
      type: 'bool',
      default: true,
    },
    {
      key: 'from',
      name: 'Starts at',
      description: 'Hour of the day the warmth begins, when “Follow the sun” is off.',
      type: 'int',
      default: 20,
      min: 0,
      max: 23,
      step: 1,
      suffix: ':00',
    },
    {
      key: 'to',
      name: 'Ends at',
      description: 'Hour of the day the screen returns to normal.',
      type: 'int',
      default: 6,
      min: 0,
      max: 23,
      step: 1,
      suffix: ':00',
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ops = [
      ctx.gsettings('org.gnome.settings-daemon.plugins.color', 'night-light-enabled', !!s.enabled),
      ctx.gsettings('org.gnome.settings-daemon.plugins.color', 'night-light-temperature', Number(s.temperature)),
      ctx.gsettings('org.gnome.settings-daemon.plugins.color', 'night-light-schedule-automatic', !!s.automatic),
    ];
    /* Hours only matter for a manual schedule; writing them while the sun
     * schedule is active would add invisible changes. */
    if (!s.automatic) {
      ops.push(
        ctx.gsettings('org.gnome.settings-daemon.plugins.color', 'night-light-schedule-from', Number(s.from)),
        ctx.gsettings('org.gnome.settings-daemon.plugins.color', 'night-light-schedule-to', Number(s.to))
      );
    }
    ctx.log(`night light ${s.enabled ? 'on' : 'off'} at ${s.temperature} K`);
    return Promise.all(ops);
  },
};
