'use strict';
/* Top-bar clock: seconds, date, weekday, 12/24-hour, and week numbers in the
 * calendar popover. All live-updating — no logout needed. */

module.exports = {
  meta: {
    id: 'top-bar-clock',
    name: 'Top Bar Clock',
    description: 'Seconds, date, weekday, 12- or 24-hour time, and ISO week numbers — all applied live.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Shell',
    icon: 'clock',
    license: 'MIT',
    tags: ['clock', 'top bar', 'time', 'calendar'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.interface', 'clock-show-seconds'],
        ['org.gnome.desktop.interface', 'clock-format'],
        ['org.gnome.desktop.calendar', 'show-weekdate'],
      ],
    },
  },

  settings: [
    { key: 'seconds', name: 'Show seconds', description: 'Adds seconds to the clock. Slightly more shell wakeups per minute.', type: 'bool', default: true },
    { key: 'date', name: 'Show date', description: 'Weekday and date next to the time.', type: 'bool', default: true },
    { key: 'weekday', name: 'Show weekday', description: 'Adds the weekday (Mon, Tue …).', type: 'bool', default: true },
    {
      key: 'format',
      name: 'Time format',
      description: '24-hour is the default across most of the world; 12-hour adds AM/PM.',
      type: 'select',
      default: '24h',
      options: [
        { value: '24h', label: '24-hour (17:42)' },
        { value: '12h', label: '12-hour (5:42 PM)' },
      ],
    },
    { key: 'weekNumbers', name: 'Week numbers in the calendar', description: 'Shows ISO week numbers down the left edge of the calendar popover.', type: 'bool', default: true },
  ],

  apply(ctx) {
    const t = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.interface', 'clock-show-seconds', !!t.seconds),
      ctx.gsettings('org.gnome.desktop.interface', 'clock-show-date', !!t.date),
      ctx.gsettings('org.gnome.desktop.interface', 'clock-show-weekday', !!t.weekday),
      ctx.gsettings('org.gnome.desktop.interface', 'clock-format', t.format === '12h' ? '12h' : '24h'),
      ctx.gsettings('org.gnome.desktop.calendar', 'show-weekdate', !!t.weekNumbers),
    ]);
  },
};
