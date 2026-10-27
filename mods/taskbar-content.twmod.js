'use strict';
/* What the taskbar shows: pinned apps, running apps, grouping, tooltips and
 * window previews. These are the everyday "why is this in my taskbar" knobs. */

module.exports = {
  meta: {
    id: 'taskbar-content',
    name: 'Taskbar Content',
    description: 'Choose whether the taskbar shows pinned apps, running windows, grouped icons and previews — and how wide the labels get.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Taskbar',
    icon: 'grid',
    license: 'MIT',
    tags: ['taskbar', 'dock', 'favorites', 'grouping', 'previews', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-taskbar', 'show-favorites'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'show-running-apps'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'group-apps'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'group-apps-label-max-width'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'show-tooltip'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'show-window-previews'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'window-preview-size'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'preview-middle-click-close'],
        ['org.gnome.shell.extensions.zorin-taskbar', 'isolate-monitors'],
      ],
    },
  },

  settings: [
    { key: 'favorites', name: 'Show pinned apps', description: 'The apps you keep on the taskbar even when they are not running.', type: 'bool', default: true },
    { key: 'running', name: 'Show running windows', description: 'Off turns the taskbar into a plain launcher of pinned apps.', type: 'bool', default: true },
    { key: 'group', name: 'Group windows by app', description: 'One icon per app instead of one per window.', type: 'bool', default: true },
    {
      key: 'labelWidth',
      name: 'Group label width',
      description: 'How much room the app name gets when windows are grouped.',
      type: 'int',
      default: 160,
      min: 80,
      max: 320,
      step: 10,
      suffix: 'px',
    },
    { key: 'tooltips', name: 'Show tooltips', description: 'The app name that appears when you hover an icon.', type: 'bool', default: true },
    { key: 'previews', name: 'Show window previews', description: 'Hover previews of each window; off keeps clicks instant with no popup.', type: 'bool', default: true },
    {
      key: 'previewSize',
      name: 'Preview size',
      description: 'Width of each window preview thumbnail.',
      type: 'int',
      default: 200,
      min: 120,
      max: 400,
      step: 20,
      suffix: 'px',
    },
    { key: 'isolateMonitors', name: 'Only show windows from this monitor', description: 'On a multi-monitor setup, each taskbar keeps to its own screen.', type: 'bool', default: false },
    {
      key: 'previewMiddleClose',
      name: 'Middle-click a preview to close',
      description: 'Middle-clicking a window thumbnail in the hover preview closes that window.',
      type: 'bool',
      default: true,
    },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'show-favorites', !!s.favorites),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'show-running-apps', !!s.running),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'group-apps', !!s.group),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'group-apps-label-max-width', Number(s.labelWidth)),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'show-tooltip', !!s.tooltips),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'show-window-previews', !!s.previews),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'window-preview-size', Number(s.previewSize)),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'preview-middle-click-close', !!s.previewMiddleClose),
      ctx.gsettings('org.gnome.shell.extensions.zorin-taskbar', 'isolate-monitors', !!s.isolateMonitors),
    ]);
  },
};
