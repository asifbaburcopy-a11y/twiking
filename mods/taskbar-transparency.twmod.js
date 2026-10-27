'use strict';
/* Taskbar transparency and its border. The extension stores opacity as a double
 * between 0 and 1, while a percentage is what people actually think in, so the
 * slider is 20–100 % and the mod divides. */

const BORDERS = [
  { value: 'rgba(200,200,200,0.2)', label: 'Light grey, 20 %' },
  { value: 'rgba(255,255,255,0.35)', label: 'White, 35 %' },
  { value: 'rgba(0,0,0,0.45)', label: 'Black, 45 %' },
  { value: 'rgba(255,180,80,0.45)', label: 'Amber, 45 %' },
];

module.exports = {
  meta: {
    id: 'taskbar-transparency',
    name: 'Taskbar Transparency',
    description: 'Make the taskbar see-through, add a subtle border, or let it fade in only when a window is near it.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'layers',
    license: 'MIT',
    tags: ['taskbar', 'dock', 'transparency', 'opacity', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-use-custom-opacity'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-panel-opacity'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-use-dynamic-opacity'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-dynamic-behavior'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-dynamic-anim-target'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-use-border'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-border-width'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-border-use-custom-color'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'trans-border-custom-color'],
      ],
    },
  },

  settings: [
    {
      key: 'opacity',
      name: 'Opacity',
      description: 'Lower is more see-through. 40 % is the extension’s own default.',
      type: 'int',
      default: 40,
      min: 20,
      max: 100,
      step: 5,
      suffix: '%',
    },
    {
      key: 'dynamic',
      name: 'Only go transparent near windows',
      description: 'Keeps the taskbar solid until a window comes close, then fades it.',
      type: 'bool',
      default: false,
    },
    {
      key: 'dynamicBehavior',
      name: 'Windows that trigger the fade',
      description: 'Any overlapping window, only the focused one, or only maximised ones.',
      type: 'select',
      default: 'ALL_WINDOWS',
      options: [
        { value: 'ALL_WINDOWS', label: 'Any window' },
        { value: 'FOCUSED_WINDOWS', label: 'Only the focused window' },
        { value: 'MAXIMIZED_WINDOWS', label: 'Only maximised windows' },
      ],
    },
    {
      key: 'dynamicTarget',
      name: 'Faded opacity',
      description: 'How transparent the taskbar becomes while a window is near. Only used with the fade above.',
      type: 'int',
      default: 80,
      min: 10,
      max: 100,
      step: 5,
      suffix: '%',
    },
    {
      key: 'border',
      name: 'Draw a border',
      description: 'A hairline outline helps a transparent taskbar stay visible on busy wallpapers.',
      type: 'bool',
      default: false,
    },
    {
      key: 'borderWidth',
      name: 'Border width',
      description: 'Thickness of that outline, in pixels.',
      type: 'int',
      default: 1,
      min: 0,
      max: 4,
      step: 1,
      suffix: 'px',
    },
    {
      key: 'borderColor',
      name: 'Border colour',
      description: 'A preset RGBA colour, so the value can never be malformed.',
      type: 'select',
      default: 'rgba(200,200,200,0.2)',
      options: BORDERS,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ops = [
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-use-custom-opacity', true),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-panel-opacity', Number(s.opacity) / 100),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-use-dynamic-opacity', !!s.dynamic),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-dynamic-behavior', s.dynamicBehavior),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-use-border', !!s.border),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-border-width', Number(s.borderWidth)),
    ];
    /* Only write the colour when a border is actually drawn, so toggling the
     * border off does not silently repaint a colour the user never sees. */
    if (s.border) {
      ops.push(
        ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-border-use-custom-color', true),
        ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-border-custom-color', s.borderColor)
      );
    }
    /* Same rule as the border colour: the faded opacity only exists while the
     * fade does, so a dormant setting never gets written. */
    if (s.dynamic) {
      ops.push(
        ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'trans-dynamic-anim-target', Number(s.dynamicTarget) / 100)
      );
    }
    ctx.log(`taskbar opacity ${s.opacity}%${s.border ? ', border on' : ''}`);
    return Promise.all(ops);
  },
};
