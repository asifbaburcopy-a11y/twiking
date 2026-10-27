'use strict';
/* Power, sleep and the lid. Windhawk has Lid Close Sleep Delay, Monitor Sleep
 * Button and power-action mods; on GNOME the same choices are plain keys read
 * by gsd-power, so they apply live. */

const ACTIONS = [
  { value: 'nothing', label: 'Do nothing' },
  { value: 'blank', label: 'Blank the screen' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'hibernate', label: 'Hibernate' },
  { value: 'shutdown', label: 'Shut down' },
  { value: 'logout', label: 'Log out' },
  { value: 'interactive', label: 'Ask what to do' },
];

const MINUTES = [
  { value: '0', label: 'Never' },
  { value: '300', label: 'After 5 minutes' },
  { value: '600', label: 'After 10 minutes' },
  { value: '900', label: 'After 15 minutes' },
  { value: '1800', label: 'After 30 minutes' },
  { value: '3600', label: 'After 1 hour' },
  { value: '7200', label: 'After 2 hours' },
];

module.exports = {
  meta: {
    id: 'power-lid',
    name: 'Power & Lid',
    description: 'Choose what happens when you close the lid, press the power button, or leave the machine idle — and whether it dims first.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Power',
    icon: 'battery',
    license: 'MIT',
    tags: ['power', 'sleep', 'suspend', 'lid', 'battery', 'idle'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.settings-daemon.plugins.power', 'sleep-inactive-ac-timeout'],
        ['org.gnome.settings-daemon.plugins.power', 'sleep-inactive-ac-type'],
        ['org.gnome.settings-daemon.plugins.power', 'sleep-inactive-battery-timeout'],
        ['org.gnome.settings-daemon.plugins.power', 'sleep-inactive-battery-type'],
        ['org.gnome.settings-daemon.plugins.power', 'lid-close-ac-action'],
        ['org.gnome.settings-daemon.plugins.power', 'lid-close-battery-action'],
        ['org.gnome.settings-daemon.plugins.power', 'power-button-action'],
        ['org.gnome.settings-daemon.plugins.power', 'idle-dim'],
      ],
    },
  },

  settings: [
    {
      key: 'acTimeout',
      name: 'On power, go idle after',
      description: 'What counts as idle before the action below runs.',
      type: 'select',
      default: '3600',
      options: MINUTES,
    },
    {
      key: 'acAction',
      name: 'On power, when idle',
      description: 'The action itself. “Do nothing” keeps the session awake.',
      type: 'select',
      default: 'nothing',
      options: ACTIONS,
    },
    {
      key: 'batteryTimeout',
      name: 'On battery, go idle after',
      description: 'Usually shorter than the mains timeout.',
      type: 'select',
      default: '900',
      options: MINUTES,
    },
    {
      key: 'batteryAction',
      name: 'On battery, when idle',
      description: 'What to do once the battery timeout is reached.',
      type: 'select',
      default: 'suspend',
      options: ACTIONS,
    },
    {
      key: 'lidAc',
      name: 'Closing the lid on power',
      description: 'Laptop only. “Do nothing” keeps working with an external monitor.',
      type: 'select',
      default: 'suspend',
      options: ACTIONS,
    },
    {
      key: 'lidBattery',
      name: 'Closing the lid on battery',
      description: 'Usually suspend, so the battery is not drained in a bag.',
      type: 'select',
      default: 'suspend',
      options: ACTIONS,
    },
    {
      key: 'powerButton',
      name: 'Power button',
      description: 'A short press of the physical power button.',
      type: 'select',
      default: 'suspend',
      options: [
        { value: 'nothing', label: 'Do nothing' },
        { value: 'suspend', label: 'Suspend' },
        { value: 'hibernate', label: 'Hibernate' },
        { value: 'interactive', label: 'Ask what to do' },
      ],
    },
    { key: 'idleDim', name: 'Dim the screen before idling', description: 'A visual warning that the machine is about to sleep.', type: 'bool', default: true },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'sleep-inactive-ac-timeout', Number(s.acTimeout)),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'sleep-inactive-ac-type', s.acAction),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'sleep-inactive-battery-timeout', Number(s.batteryTimeout)),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'sleep-inactive-battery-type', s.batteryAction),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'lid-close-ac-action', s.lidAc),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'lid-close-battery-action', s.lidBattery),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'power-button-action', s.powerButton),
      ctx.gsettings('org.gnome.settings-daemon.plugins.power', 'idle-dim', !!s.idleDim),
    ]);
  },
};
