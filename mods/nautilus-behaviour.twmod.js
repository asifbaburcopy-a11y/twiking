'use strict';
/* Files behaviour: single-click opening, thumbnails and folder item counts.
 * Maps the “Explorer click / thumbnail / icon size” family of Windhawk mods. */

module.exports = {
  meta: {
    id: 'nautilus-behaviour',
    name: 'Files Behaviour',
    description: 'Single-click to open, image thumbnails, and item counts next to folders in Files.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Files',
    icon: 'folder',
    license: 'MIT',
    tags: ['nautilus', 'files', 'click', 'thumbnails'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.nautilus.preferences', 'click-policy'],
        ['org.gnome.nautilus.icon-view', 'default-zoom-level'],
      ],
    },
  },

  settings: [
    {
      key: 'clickPolicy',
      name: 'Open files with',
      description: 'Single-click matches the Windows “web style”; double-click is the GNOME default.',
      type: 'select',
      default: 'double',
      options: [
        { value: 'double', label: 'Double-click' },
        { value: 'single', label: 'Single-click' },
      ],
    },
    {
      key: 'thumbnails',
      name: 'Image thumbnails',
      description: 'Never saves memory in huge photo folders.',
      type: 'select',
      default: 'local-only',
      options: [
        { value: 'always', label: 'Always' },
        { value: 'local-only', label: 'Local files only' },
        { value: 'never', label: 'Never' },
      ],
    },
    { key: 'itemCounts', name: 'Show folder item counts', description: 'Adds “12 items” under each folder icon.', type: 'bool', default: false },
    {
      key: 'zoom',
      name: 'Icon size',
      description: 'Default view size for new Files windows — the same idea as the Windows Explorer icon-size mods.',
      type: 'select',
      default: 'small-plus',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'small-plus', label: 'Small+' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'extra-large', label: 'Extra large' },
      ],
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.nautilus.preferences', 'click-policy', s.clickPolicy),
      ctx.gsettings('org.gnome.nautilus.preferences', 'show-image-thumbnails', s.thumbnails),
      ctx.gsettings('org.gnome.nautilus.preferences', 'show-directory-item-counts', s.itemCounts ? 'always' : 'never'),
      ctx.gsettings('org.gnome.nautilus.icon-view', 'default-zoom-level', s.zoom),
    ]);
  },
};
