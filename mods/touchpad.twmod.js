'use strict';
/* Touchpad feel. These are the settings people most often fix by hand in
 * dconf-editor and then forget which key they changed. */

module.exports = {
  meta: {
    id: 'touchpad',
    name: 'Touchpad Feel',
    description: 'Tap to click, natural scrolling, two-finger vs edge scrolling, and ignore the pad while typing.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Input',
    icon: 'touchpad',
    license: 'MIT',
    tags: ['touchpad', 'input', 'scrolling', 'laptop'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.peripherals.touchpad', 'tap-to-click'],
        ['org.gnome.desktop.peripherals.touchpad', 'natural-scroll'],
        ['org.gnome.desktop.peripherals.touchpad', 'disable-while-typing'],
        ['org.gnome.desktop.peripherals.touchpad', 'two-finger-scrolling-enabled'],
        ['org.gnome.desktop.peripherals.touchpad', 'edge-scrolling-enabled'],
      ],
    },
  },

  settings: [
    { key: 'tapToClick', name: 'Tap to click', description: 'Light tap anywhere on the pad acts as a left click.', type: 'bool', default: true },
    { key: 'naturalScroll', name: 'Natural scrolling', description: 'Content follows your fingers, like a phone.', type: 'bool', default: true },
    { key: 'disableWhileTyping', name: 'Disable while typing', description: 'Stops palm brushes from moving the cursor mid-sentence.', type: 'bool', default: true },
    {
      key: 'scrollMethod',
      name: 'Two-finger scroll',
      description: 'Two-finger is the default; edge scrolling uses the right/bottom edge instead.',
      type: 'select',
      default: 'two-finger',
      options: [
        { value: 'two-finger', label: 'Two fingers' },
        { value: 'edge', label: 'Edge scrolling' },
        { value: 'none', label: 'Disabled' },
      ],
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    /* GNOME 46 has no "scroll-method" key: scrolling is two independent
     * booleans on the touchpad schema. The select is mapped onto them so the
     * user-facing choice stays the one people expect. */
    const twoFinger = s.scrollMethod !== 'edge';
    const edge = s.scrollMethod === 'edge';
    const schema = 'org.gnome.desktop.peripherals.touchpad';
    return Promise.all([
      ctx.gsettings(schema, 'tap-to-click', !!s.tapToClick),
      ctx.gsettings(schema, 'natural-scroll', !!s.naturalScroll),
      ctx.gsettings(schema, 'disable-while-typing', !!s.disableWhileTyping),
      ctx.gsettings(schema, 'two-finger-scrolling-enabled', twoFinger),
      ctx.gsettings(schema, 'edge-scrolling-enabled', edge),
    ]);
  },
};
