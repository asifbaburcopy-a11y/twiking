'use strict';
/* How the taskbar decides to step out of the way. The Linux answer to
 * Windhawk's "Taskbar auto-hide when maximized" (4.59★, 115k users) and
 * "Taskbar auto-hide instant show" (4.79★).
 *
 * These keys belong to Zorin's taskbar extension and only take effect while
 * Dock & Panel's "Hide when a window overlaps" is on — this mod controls *how*
 * it hides, that mod controls *whether* it hides. The extension's own source
 * reads every one of these keys (intellihide.js). */

const T = 'org.gnome.shell.extensions.zorin-taskbar';

module.exports = {
  meta: {
    id: 'taskbar-autohide',
    name: 'Taskbar Auto-Hide Behaviour',
    description: 'Choose when the taskbar hides — any window, focused window, or only maximised ones — and how it comes back: edge hover, hover to stay, fullscreen and notifications.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'dock',
    license: 'MIT',
    tags: ['taskbar', 'autohide', 'intellihide', 'dock', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        [T, 'intellihide-behaviour'],
        [T, 'intellihide-use-pointer'],
        [T, 'intellihide-revealed-hover'],
        [T, 'intellihide-show-in-fullscreen'],
        [T, 'intellihide-show-on-notification'],
      ],
    },
  },

  settings: [
    {
      key: 'behaviour',
      name: 'Hide when…',
      description: 'How much window overlap makes the taskbar step aside. Needs "Hide when a window overlaps" on in Dock & Panel.',
      type: 'select',
      default: 'FOCUSED_WINDOWS',
      options: [
        { value: 'ALL_WINDOWS', label: 'Any window touches it' },
        { value: 'FOCUSED_WINDOWS', label: 'The focused window touches it' },
        { value: 'MAXIMIZED_WINDOWS', label: 'Only a maximised window (Windows-style)' },
      ],
    },
    {
      key: 'usePointer',
      name: 'Reveal at the screen edge',
      description: 'Touch the edge of the screen with the pointer and the taskbar slides back out.',
      type: 'bool',
      default: true,
    },
    {
      key: 'hoverStay',
      name: 'Stay out while hovered',
      description: 'Once revealed, keep it visible while the pointer is over it instead of hiding the moment you move away.',
      type: 'bool',
      default: true,
    },
    {
      key: 'showFullscreen',
      name: 'Stay visible over fullscreen windows',
      description: 'Off (default) keeps the taskbar hidden during video and games even when it would otherwise show.',
      type: 'bool',
      default: false,
    },
    {
      key: 'showNotification',
      name: 'Show when a notification arrives',
      description: 'The taskbar slides out for the duration of a notification so you can see where it came from.',
      type: 'bool',
      default: false,
    },
  ],

  async apply(ctx) {
    const s = ctx.settings;
    await ctx.gsettings(T, 'intellihide-use-pointer', !!s.usePointer);
    /* Written after the pointer setting: the extension's preferences turn
     * hover-stay off whenever pointer reveal is off, so this order leaves the
     * state you asked for even if the preferences window is open. */
    return Promise.all([
      ctx.gsettings(T, 'intellihide-behaviour', s.behaviour),
      ctx.gsettings(T, 'intellihide-revealed-hover', !!s.hoverStay),
      ctx.gsettings(T, 'intellihide-show-in-fullscreen', !!s.showFullscreen),
      ctx.gsettings(T, 'intellihide-show-on-notification', !!s.showNotification),
    ]);
  },
};
