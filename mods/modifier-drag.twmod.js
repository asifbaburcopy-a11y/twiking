'use strict';
/* How the mouse drives windows. The Linux answer to Windhawk's "AltDrag"
 * (4.87★) and the resize half of "Invisible Window Borders" (4.77★): hold a
 * modifier to grab any window, right-drag to resize, set how wide the resize
 * edge is, and choose what the middle and right buttons do on a titlebar.
 *
 * All five are plain metacity/mutter state read by libmutter itself, so there
 * is nothing to hook and no logout needed. */

const WM = 'org.gnome.desktop.wm.preferences';

const TITLEBAR_ACTIONS = [
  { value: 'none', label: 'Do nothing' },
  { value: 'minimize', label: 'Minimise' },
  { value: 'toggle-maximize', label: 'Maximise / restore' },
  { value: 'toggle-maximize-horizontally', label: 'Maximise horizontally' },
  { value: 'toggle-maximize-vertically', label: 'Maximise vertically' },
  { value: 'toggle-shade', label: 'Shade (roll up)' },
  { value: 'lower', label: 'Send to bottom' },
  { value: 'menu', label: 'Window menu' },
];

module.exports = {
  meta: {
    id: 'modifier-drag',
    name: 'Mouse Window Control',
    description: 'Hold a modifier to drag any window, right-drag to resize, widen the resize edge, and pick what middle/right clicks do on the titlebar.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'mouse',
    license: 'MIT',
    tags: ['drag', 'resize', 'alt-drag', 'titlebar', 'mouse', 'mutter'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        [WM, 'mouse-button-modifier'],
        [WM, 'resize-with-right-button'],
        [WM, 'action-middle-click-titlebar'],
        [WM, 'action-right-click-titlebar'],
        ['org.gnome.mutter', 'draggable-border-width'],
      ],
    },
  },

  settings: [
    {
      key: 'modifier',
      name: 'Drag modifier',
      description: 'Hold this key and drag anywhere in a window to move it; hold it and right-drag to resize. Super is the GNOME default.',
      type: 'select',
      default: '<Super>',
      options: [
        { value: '<Super>', label: 'Super' },
        { value: '<Alt>', label: 'Alt' },
        { value: '<Control>', label: 'Ctrl' },
        { value: '', label: 'Disabled' },
      ],
    },
    {
      key: 'rightDragResize',
      name: 'Right-drag resizes',
      description: 'Pull a window from anywhere with the right button to resize it — the classic X11 gesture.',
      type: 'bool',
      default: false,
    },
    {
      key: 'resizeEdge',
      name: 'Resize edge width',
      description: 'How far from a window edge the resize grab starts. Higher is easier to catch, 0 means you must hit the exact pixel.',
      type: 'int',
      default: 10,
      min: 0,
      max: 64,
      step: 1,
      suffix: 'px',
    },
    {
      key: 'middleTitlebar',
      name: 'Middle-click on titlebar',
      description: 'What the middle button does when you click a titlebar.',
      type: 'select',
      default: 'none',
      options: TITLEBAR_ACTIONS,
    },
    {
      key: 'rightTitlebar',
      name: 'Right-click on titlebar',
      description: 'What the right button does when you click a titlebar.',
      type: 'select',
      default: 'menu',
      options: TITLEBAR_ACTIONS,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings(WM, 'mouse-button-modifier', String(s.modifier)),
      ctx.gsettings(WM, 'resize-with-right-button', !!s.rightDragResize),
      ctx.gsettings('org.gnome.mutter', 'draggable-border-width', Number(s.resizeEdge)),
      ctx.gsettings(WM, 'action-middle-click-titlebar', s.middleTitlebar),
      ctx.gsettings(WM, 'action-right-click-titlebar', s.rightTitlebar),
    ]);
  },
};
