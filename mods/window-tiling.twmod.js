'use strict';
/* Tiling and snap. Windhawk's Tiling Helper / Edge Snap family; on Zorin the
 * taskbar's tiling extension owns these keys, and they take effect immediately
 * (unlike GNOME's own mutter edge-tiling, which Zorin leaves off). */

module.exports = {
  meta: {
    id: 'window-tiling',
    name: 'Window Tiling & Snap',
    description: 'Turn the tiling system on or off, add gaps and edge offsets, and choose whether windows snap while you drag them.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Windows',
    icon: 'grid',
    license: 'MIT',
    tags: ['tiling', 'snap', 'windows', 'gaps', 'zorin'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'enable-tiling-system'],
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'enable-autotiling'],
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'enable-snap-assist'],
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'active-screen-edges'],
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'inner-gaps'],
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'edge-tiling-offset'],
        ['org.gnome.shell.extensions.zorin-tiling-shell', 'enable-window-border'],
      ],
    },
  },

  settings: [
    { key: 'enabled', name: 'Tiling system', description: 'The drag-to-edge and keyboard tiling engine itself.', type: 'bool', default: true },
    { key: 'autoTile', name: 'Auto-tile new windows', description: 'New windows are tiled automatically instead of floating.', type: 'bool', default: false },
    { key: 'snapAssist', name: 'Snap assist', description: 'After snapping one window, suggest windows for the free space.', type: 'bool', default: true },
    { key: 'screenEdges', name: 'Snap at screen edges', description: 'Dragging a window to an edge snaps it there.', type: 'bool', default: true },
    {
      key: 'gaps',
      name: 'Gap between tiles',
      description: 'Space between tiled windows and the screen edge.',
      type: 'int',
      default: 4,
      min: 0,
      max: 32,
      step: 1,
      suffix: 'px',
    },
    {
      key: 'edgeOffset',
      name: 'Edge trigger distance',
      description: 'How close the pointer must get to an edge before snapping starts.',
      type: 'int',
      default: 16,
      min: 0,
      max: 64,
      step: 4,
      suffix: 'px',
    },
    { key: 'border', name: 'Draw a border around tiled windows', description: 'A subtle outline that makes adjacent tiles easier to tell apart.', type: 'bool', default: false },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'enable-tiling-system', !!s.enabled),
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'enable-autotiling', !!s.autoTile),
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'enable-snap-assist', !!s.snapAssist),
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'active-screen-edges', !!s.screenEdges),
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'inner-gaps', Number(s.gaps)),
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'edge-tiling-offset', Number(s.edgeOffset)),
      ctx.gsettings('org.gnome.shell.extensions.zorin-tiling-shell', 'enable-window-border', !!s.border),
    ]);
  },
};
