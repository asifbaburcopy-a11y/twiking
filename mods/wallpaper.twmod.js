'use strict';
/* Light/dark wallpaper pairs, the GNOME way. Windhawk's wallpaper mods switch
 * Windows' desktop background; this does the same job with the extra nicety
 * that GNOME can pick a different image for dark mode. */

function toUri(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^file:\/\//.test(v)) return v;
  return `file://${v}`;
}

module.exports = {
  meta: {
    id: 'wallpaper',
    name: 'Wallpaper',
    description: 'Set the desktop background, with separate images for light and dark mode and a fit mode.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'image',
    license: 'MIT',
    tags: ['wallpaper', 'background', 'dark mode'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.background', 'picture-uri']],
    },
  },

  settings: [
    {
      key: 'light',
      name: 'Image',
      description: 'Used in light mode, and in both modes when no dark image is set.',
      type: 'file',
      default: '',
      placeholder: 'file:///usr/share/backgrounds/…',
    },
    {
      key: 'dark',
      name: 'Dark-mode image',
      description: 'Optional. GNOME swaps to this when the dark style is active.',
      type: 'file',
      default: '',
      placeholder: 'file:///usr/share/backgrounds/…',
    },
    {
      key: 'options',
      name: 'Fit',
      description: 'How the image is scaled to the screen.',
      type: 'select',
      default: 'zoom',
      options: [
        { value: 'zoom', label: 'Zoom — fill, crop overflow' },
        { value: 'scaled', label: 'Scaled — fit with bars' },
        { value: 'stretched', label: 'Stretched' },
        { value: 'centered', label: 'Centered' },
        { value: 'wallpaper', label: 'Tiled' },
        { value: 'spanned', label: 'Span across monitors' },
      ],
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ops = [];
    const light = toUri(s.light);
    const dark = toUri(s.dark);
    if (light) ops.push(ctx.gsettings('org.gnome.desktop.background', 'picture-uri', light));
    if (dark) ops.push(ctx.gsettings('org.gnome.desktop.background', 'picture-uri-dark', dark));
    ops.push(ctx.gsettings('org.gnome.desktop.background', 'picture-options', s.options));
    if (!light && !dark) ctx.log('No image chosen — only the fit mode will change.');
    return Promise.all(ops);
  },
};
