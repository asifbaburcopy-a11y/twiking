'use strict';
/* Font selection + smoothing, mapping Windhawk's font mods. Families come from
 * fontconfig, so the dropdown is exactly what this machine can render. */

module.exports = {
  meta: {
    id: 'system-fonts',
    name: 'System Fonts',
    description: 'Pick the UI, document and monospace fonts, plus the size and anti-aliasing used everywhere.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Appearance',
    icon: 'type',
    license: 'MIT',
    tags: ['fonts', 'typography', 'hinting', 'monospace'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.interface', 'font-name'],
        ['org.gnome.desktop.interface', 'monospace-font-name'],
        ['org.gnome.desktop.interface', 'font-antialiasing'],
        ['org.gnome.desktop.interface', 'font-hinting'],
      ],
    },
  },

  settings: [
    {
      key: 'family',
      name: 'Interface font',
      description: 'Used by titlebars, menus and controls.',
      type: 'select',
      optionsFrom: 'fonts',
      default: 'Inter',
    },
    { key: 'size', name: 'Interface size', description: 'Point size for the UI font.', type: 'int', default: 10, min: 7, max: 18, step: 1, suffix: 'pt' },
    {
      key: 'monoFamily',
      name: 'Monospace font',
      description: 'Terminals, code editors and anything fixed-width.',
      type: 'select',
      optionsFrom: 'fonts',
      default: 'JetBrains Mono',
    },
    {
      key: 'antialiasing',
      name: 'Anti-aliasing',
      description: 'Grayscale is the sane default. Subpixel can fringe on rotated displays.',
      type: 'select',
      default: 'grayscale',
      options: [
        { value: 'none', label: 'None — jagged but crisp' },
        { value: 'grayscale', label: 'Grayscale — smooth (default)' },
        { value: 'rgba', label: 'Subpixel (RGB) — sharpest on LCD' },
      ],
    },
    {
      key: 'hinting',
      name: 'Hinting',
      description: 'How aggressively glyphs snap to the pixel grid.',
      type: 'select',
      default: 'slight',
      options: [
        { value: 'none', label: 'None' },
        { value: 'slight', label: 'Slight — default' },
        { value: 'medium', label: 'Medium' },
        { value: 'full', label: 'Full' },
      ],
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ui = `${s.family} ${Number(s.size)}`;
    const mono = `${s.monoFamily} ${Number(s.size)}`;
    const ops = [
      ctx.gsettings('org.gnome.desktop.interface', 'font-name', ui),
      ctx.gsettings('org.gnome.desktop.interface', 'document-font-name', ui),
      ctx.gsettings('org.gnome.desktop.interface', 'monospace-font-name', mono),
      ctx.gsettings('org.gnome.desktop.interface', 'font-antialiasing', s.antialiasing),
      ctx.gsettings('org.gnome.desktop.interface', 'font-hinting', s.hinting),
    ];
    return Promise.all(ops);
  },
};
