'use strict';
/* Focus follows mouse or click. A single setting that changes how the whole
 * desktop feels, and famously annoying to find in stock GNOME. */

module.exports = {
  meta: {
    id: 'window-focus',
    name: 'Window Focus Behaviour',
    description: 'Click to focus (default), focus follows mouse, or sloppy focus — plus raise-on-click.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'focus',
    license: 'MIT',
    tags: ['focus', 'mouse', 'productivity'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.desktop.wm.preferences', 'focus-mode'],
        ['org.gnome.desktop.wm.preferences', 'focus-new-windows'],
        ['org.gnome.desktop.wm.preferences', 'auto-raise'],
        ['org.gnome.desktop.wm.preferences', 'auto-raise-delay'],
        ['org.gnome.mutter', 'focus-change-on-pointer-rest'],
      ],
    },
  },

  settings: [
    {
      key: 'mode',
      name: 'Focus mode',
      description: 'Sloppy focus keeps the last window focused when the pointer leaves it; "mouse" focuses whatever is under the pointer.',
      type: 'select',
      default: 'click',
      options: [
        { value: 'click', label: 'Click to focus' },
        { value: 'sloppy', label: 'Focus follows mouse (sloppy)' },
        { value: 'mouse', label: 'Focus follows mouse (strict)' },
      ],
    },
    { key: 'raiseOnClick', name: 'Raise windows on click', description: 'Clicking any part of a window brings it to the front.', type: 'bool', default: true },
    {
      key: 'doubleClick',
      name: 'Double-click on titlebar',
      description: 'What a double-click on the titlebar should do.',
      type: 'select',
      default: 'toggle-maximize',
      options: [
        { value: 'toggle-maximize', label: 'Maximise / restore' },
        { value: 'toggle-maximize-horizontally', label: 'Maximise horizontally' },
        { value: 'toggle-maximize-vertically', label: 'Maximise vertically' },
        { value: 'toggle-shade', label: 'Shade (roll up)' },
        { value: 'none', label: 'Nothing' },
      ],
    },
    {
      key: 'newWindows',
      name: 'Focus new windows',
      description: 'How hard a newly opened window fights for attention.',
      type: 'select',
      default: 'smart',
      options: [
        { value: 'smart', label: 'Only when it makes sense (smart)' },
        { value: 'strict', label: 'Always (strict)' },
      ],
    },
    {
      key: 'pointerRest',
      name: 'Pointer rest focuses',
      description: 'When the pointer stops moving over a window, that window takes focus — the second half of focus-follows-mouse.',
      type: 'bool',
      default: true,
    },
    {
      key: 'autoRaise',
      name: 'Auto-raise windows',
      description: 'Raise the focused window without clicking — classic X11 focus-follows-mouse. Most noticeable with sloppy focus.',
      type: 'bool',
      default: false,
    },
    {
      key: 'autoRaiseDelay',
      name: 'Auto-raise delay',
      description: 'How long the window waits before popping to the front. Only used when auto-raise is on.',
      type: 'int',
      default: 500,
      min: 100,
      max: 2000,
      step: 50,
      suffix: 'ms',
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    const ops = [
      ctx.gsettings('org.gnome.desktop.wm.preferences', 'focus-mode', s.mode),
      ctx.gsettings('org.gnome.desktop.wm.preferences', 'raise-on-click', !!s.raiseOnClick),
      ctx.gsettings('org.gnome.desktop.wm.preferences', 'action-double-click-titlebar', s.doubleClick),
      ctx.gsettings('org.gnome.desktop.wm.preferences', 'focus-new-windows', s.newWindows),
      ctx.gsettings('org.gnome.mutter', 'focus-change-on-pointer-rest', !!s.pointerRest),
      ctx.gsettings('org.gnome.desktop.wm.preferences', 'auto-raise', !!s.autoRaise),
    ];
    /* The delay only matters when auto-raise is on — same rule the caret
     * interval follows in Text Cursor. */
    if (s.autoRaise) {
      ops.push(ctx.gsettings('org.gnome.desktop.wm.preferences', 'auto-raise-delay', Number(s.autoRaiseDelay)));
    }
    return Promise.all(ops);
  },
};
