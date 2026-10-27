'use strict';
/* The screen magnifier. Windhawk's magnifier mods float a lens over one window;
 * GNOME has a compositor-level magnifier, so the same idea needs no injection
 * and scales the whole desktop. */

module.exports = {
  meta: {
    id: 'screen-magnifier',
    name: 'Screen Magnifier',
    description: 'Zoom the whole desktop and follow the mouse or keyboard focus — a reading aid, a presentation tool, or just a closer look.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Accessibility',
    icon: 'search',
    license: 'MIT',
    tags: ['magnifier', 'zoom', 'accessibility', 'a11y', 'screen'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.a11y.applications', 'screen-magnifier-enabled'],
        ['org.gnome.desktop.a11y.magnifier', 'mag-factor'],
        ['org.gnome.desktop.a11y.magnifier', 'mouse-tracking'],
        ['org.gnome.desktop.a11y.magnifier', 'screen-position'],
        ['org.gnome.desktop.a11y.magnifier', 'show-cross-hairs'],
        ['org.gnome.desktop.a11y.magnifier', 'invert-lightness'],
      ],
    },
  },

  settings: [
    { key: 'enabled', name: 'Magnifier on', description: 'Zooms the whole screen rather than a single window.', type: 'bool', default: true },
    {
      key: 'factor',
      name: 'Zoom level',
      description: 'How far in the magnifier sits.',
      type: 'select',
      default: '2',
      options: [
        { value: '1.5', label: '1.5×' },
        { value: '2', label: '2×' },
        { value: '3', label: '3×' },
        { value: '4', label: '4×' },
        { value: '6', label: '6×' },
        { value: '8', label: '8×' },
      ],
    },
    {
      key: 'mouseTracking',
      name: 'Follow the pointer',
      description: 'How the view moves when the mouse approaches an edge.',
      type: 'select',
      default: 'proportional',
      options: [
        { value: 'none', label: 'Stay still' },
        { value: 'centered', label: 'Keep the pointer centred' },
        { value: 'proportional', label: 'Follow proportionally' },
        { value: 'push', label: 'Push at the edges' },
      ],
    },
    {
      key: 'position',
      name: 'Where the zoom goes',
      description: 'Full screen, or a fixed half of the screen with the rest left alone.',
      type: 'select',
      default: 'full-screen',
      options: [
        { value: 'full-screen', label: 'Full screen' },
        { value: 'top-half', label: 'Top half' },
        { value: 'bottom-half', label: 'Bottom half' },
        { value: 'left-half', label: 'Left half' },
        { value: 'right-half', label: 'Right half' },
      ],
    },
    { key: 'crossHairs', name: 'Show crosshairs', description: 'A pair of lines marking the exact pointer position.', type: 'bool', default: false },
    { key: 'invert', name: 'Invert colours', description: 'Turns the magnified area into a negative — sometimes easier to read.', type: 'bool', default: false },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.a11y.applications', 'screen-magnifier-enabled', !!s.enabled),
      ctx.gsettings('org.gnome.desktop.a11y.magnifier', 'mag-factor', Number(s.factor)),
      ctx.gsettings('org.gnome.desktop.a11y.magnifier', 'mouse-tracking', s.mouseTracking),
      ctx.gsettings('org.gnome.desktop.a11y.magnifier', 'screen-position', s.position),
      ctx.gsettings('org.gnome.desktop.a11y.magnifier', 'show-cross-hairs', !!s.crossHairs),
      ctx.gsettings('org.gnome.desktop.a11y.magnifier', 'invert-lightness', !!s.invert),
    ]);
  },
};
