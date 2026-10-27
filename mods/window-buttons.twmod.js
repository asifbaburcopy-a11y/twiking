'use strict';
/* Windhawk's most-installed mods are window-chrome fixes. On GNOME the same
 * thing is one gsettings key, so this is the "hello world" of Twiking. */

module.exports = {
  meta: {
    id: 'window-buttons',
    name: 'Window Buttons',
    description: 'Put the titlebar buttons where you expect them: right (Windows), left (macOS), close-only, or none at all.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'window',
    license: 'MIT',
    tags: ['titlebar', 'layout', 'buttons'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.desktop.wm.preferences', 'button-layout']],
    },
  },

  settings: [
    {
      key: 'layout',
      name: 'Button layout',
      description: 'The colon separates left buttons from right buttons.',
      type: 'select',
      default: 'appmenu:minimize,maximize,close',
      options: [
        { value: 'appmenu:minimize,maximize,close', label: 'Right — minimise, maximise, close' },
        { value: 'close,minimize,maximize:', label: 'Left — close, minimise, maximise' },
        { value: 'appmenu:close', label: 'Right — close only' },
        { value: 'close:', label: 'Left — close only' },
        { value: ':', label: 'No window buttons' },
      ],
    },
    {
      key: 'appMenu',
      name: 'Show the app menu on the left',
      description: 'Adds the application name/menu button to the left side of titlebars.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    /* button-layout is "left:right". Removing the app menu means dropping the
     * "appmenu" entry from the left list — never the colon itself, or the
     * right-side buttons get parsed as left-side ones. */
    const [leftRaw = '', rightRaw = ''] = String(ctx.settings.layout).split(':');
    const left = leftRaw.split(',').filter(Boolean).filter((b) => ctx.settings.appMenu || b !== 'appmenu');
    const right = rightRaw.split(',').filter(Boolean);
    const value = `${left.join(',')}:${right.join(',')}`;
    ctx.log(`window buttons: ${value}`);
    return ctx.gsettings('org.gnome.desktop.wm.preferences', 'button-layout', value);
  },
};
