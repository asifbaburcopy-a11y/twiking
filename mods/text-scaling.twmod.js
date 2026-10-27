'use strict';
/* Fractional text scaling: bigger UI without lowering the display resolution.
 * This is the knob people usually hunt for in accessibility settings and then
 * give up on because the slider is hidden behind an experiment flag. */

module.exports = {
  meta: {
    id: 'text-scaling',
    name: 'Text & UI Scaling',
    description: 'Scale every GTK app up or down in small steps — better for 4K screens than changing the resolution.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Accessibility',
    icon: 'type',
    license: 'MIT',
    tags: ['font', 'hidpi', 'accessibility', 'scale'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.interface', 'text-scaling-factor']],
    },
  },

  settings: [
    {
      key: 'scale',
      name: 'Text scaling factor',
      description: '1.00 is the default. Values above 1.25 can clip text in older GTK3 apps.',
      type: 'select',
      default: '1',
      options: [
        { value: '0.85', label: '85% — more content on screen' },
        { value: '1', label: '100% — default' },
        { value: '1.1', label: '110%' },
        { value: '1.25', label: '125%' },
        { value: '1.5', label: '150% — comfortable' },
        { value: '1.75', label: '175%' },
        { value: '2', label: '200% — large print' },
      ],
    },
  ],

  apply(ctx) {
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.interface', 'text-scaling-factor', Number(ctx.settings.scale)),
    ]);
  },
};
