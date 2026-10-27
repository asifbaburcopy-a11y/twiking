'use strict';
/* Notification banners and lock-screen notifications — the portable part of
 * Windhawk's notification mods. */

module.exports = {
  meta: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Show or hide pop-up banners, and decide whether notifications appear on the lock screen.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Shell',
    icon: 'bell',
    license: 'MIT',
    tags: ['notifications', 'banners', 'lock screen', 'focus'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.notifications', 'show-banners']],
    },
  },

  settings: [
    { key: 'banners', name: 'Pop-up banners', description: 'Off means notifications only appear in the message list, not over your work.', type: 'bool', default: true },
    { key: 'lockScreen', name: 'Show on lock screen', description: 'Reveals notification contents before you sign in — a privacy choice as much as a convenience one.', type: 'bool', default: false },
  ],

  apply(ctx) {
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.notifications', 'show-banners', !!ctx.settings.banners),
      ctx.gsettings('org.gnome.desktop.notifications', 'show-in-lock-screen', !!ctx.settings.lockScreen),
    ]);
  },
};
