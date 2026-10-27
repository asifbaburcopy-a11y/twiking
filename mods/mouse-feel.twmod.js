'use strict';
/* Pointer feel, mapping Windhawk's mouse and scroll mods. */

module.exports = {
  meta: {
    id: 'mouse-feel',
    name: 'Mouse Feel',
    description: 'Pointer acceleration, speed and buttons — the classic “why does my mouse feel wrong” fixes.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'mouse',
    license: 'MIT',
    tags: ['mouse', 'pointer', 'acceleration', 'scroll', 'left handed'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.peripherals.mouse', 'accel-profile'],
        ['org.gnome.mutter', 'locate-pointer-key'],
      ],
    },
  },

  settings: [
    {
      key: 'accel',
      name: 'Acceleration',
      description: 'Flat disables acceleration entirely — the usual choice for games and precise work.',
      type: 'select',
      default: 'default',
      options: [
        { value: 'default', label: 'Default (adaptive)' },
        { value: 'flat', label: 'Flat — no acceleration' },
        { value: 'adaptive', label: 'Adaptive' },
      ],
    },
    {
      key: 'speed',
      name: 'Speed',
      description: 'Applies on top of the acceleration profile.',
      type: 'select',
      default: '0',
      options: [
        { value: '-0.5', label: 'Much slower' },
        { value: '-0.25', label: 'Slower' },
        { value: '0', label: 'Normal' },
        { value: '0.25', label: 'Faster' },
        { value: '0.5', label: 'Much faster' },
      ],
    },
    { key: 'naturalScroll', name: 'Natural scrolling', description: 'Wheel follows your fingers, like a touchscreen.', type: 'bool', default: false },
    { key: 'middleEmulation', name: 'Middle-click emulation', description: 'Emulates a middle click when left and right are pressed together.', type: 'bool', default: false },
    { key: 'leftHanded', name: 'Left-handed buttons', description: 'Swaps the primary and secondary mouse buttons.', type: 'bool', default: false },
    {
      key: 'locatePointer',
      name: 'Locate the pointer',
      description: 'Press Control and a circle pulses around the cursor — handy on big or multi-monitor desks. Off leaves the key free.',
      type: 'select',
      default: 'Control_L',
      options: [
        { value: 'Control_L', label: 'Press Control' },
        { value: '', label: 'Off' },
      ],
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.desktop.peripherals.mouse', 'accel-profile', s.accel),
      ctx.gsettings('org.gnome.desktop.peripherals.mouse', 'speed', Number(s.speed)),
      ctx.gsettings('org.gnome.desktop.peripherals.mouse', 'natural-scroll', !!s.naturalScroll),
      ctx.gsettings('org.gnome.desktop.peripherals.mouse', 'middle-click-emulation', !!s.middleEmulation),
      ctx.gsettings('org.gnome.desktop.peripherals.mouse', 'left-handed', !!s.leftHanded),
      ctx.gsettings('org.gnome.mutter', 'locate-pointer-key', String(s.locatePointer)),
    ]);
  },
};
