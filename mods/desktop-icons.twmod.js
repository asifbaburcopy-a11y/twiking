'use strict';
/* Desktop icons on Zorin: size plus which special folders are shown. */

module.exports = {
  meta: {
    id: 'desktop-icons',
    name: 'Desktop Icons',
    description: 'Control the icons drawn on the desktop: size, Home folder and the trash can.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Files',
    icon: 'grid',
    license: 'MIT',
    tags: ['desktop', 'icons', 'trash', 'home'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'icon-size'],
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'show-trash'],
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'show-home'],
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'keep-arranged'],
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'dark-text-in-labels'],
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'show-volumes'],
        ['org.gnome.shell.extensions.zorin-desktop-icons', 'show-network-volumes'],
      ],
    },
  },

  settings: [
    {
      key: 'size',
      name: 'Icon size',
      description: 'Small, standard or large desktop icons.',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'standard', label: 'Standard' },
        { value: 'large', label: 'Large' },
      ],
    },
    { key: 'trash', name: 'Show trash', description: 'The trash can in the corner of the desktop.', type: 'bool', default: true },
    { key: 'home', name: 'Show Home folder', description: 'A shortcut to your home directory on the desktop.', type: 'bool', default: true },
    {
      key: 'arrange',
      name: 'Keep icons arranged',
      description: 'Snap icons into the grid instead of letting them sit anywhere you drop them.',
      type: 'bool',
      default: false,
    },
    {
      key: 'darkLabels',
      name: 'Dark label text',
      description: 'Draw icon names in dark text — for light wallpapers where white labels disappear.',
      type: 'bool',
      default: false,
    },
    { key: 'volumes', name: 'Show mounted volumes', description: 'Disks and USB sticks appear on the desktop while they are plugged in.', type: 'bool', default: false },
    { key: 'network', name: 'Show network volumes', description: 'Network shares and servers appear on the desktop.', type: 'bool', default: false },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return Promise.all([
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'icon-size', s.size),
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'show-trash', !!s.trash),
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'show-home', !!s.home),
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'keep-arranged', !!s.arrange),
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'dark-text-in-labels', !!s.darkLabels),
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'show-volumes', !!s.volumes),
      ctx.gsettings('org.gnome.shell.extensions.zorin-desktop-icons', 'show-network-volumes', !!s.network),
    ]);
  },
};
