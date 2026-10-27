'use strict';
/* Num Lock state — the Linux equivalent of Windhawk's "Num Lock Lockdown".
 * GNOME remembers the numeric keypad state per user, so this is one key. */

module.exports = {
  meta: {
    id: 'num-lock',
    name: 'Num Lock at Login',
    description: 'Keep the numeric keypad in number mode instead of letting Num Lock switch itself off between sessions.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'keyboard',
    license: 'MIT',
    tags: ['num lock', 'numlock', 'keyboard', 'keypad', 'login'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.peripherals.keyboard', 'numlock-state']],
    },
  },

  settings: [
    {
      key: 'enabled',
      name: 'Num Lock on',
      description: 'Applies to this user’s session and is restored when you log back in.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    return ctx.gsettings('org.gnome.desktop.peripherals.keyboard', 'numlock-state', !!ctx.settings.enabled);
  },
};
