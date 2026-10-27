'use strict';
/* Show hidden files in the file manager and file dialogs. One of the most
 * requested "where is that setting" tweaks on GNOME. */

module.exports = {
  meta: {
    id: 'files-hidden',
    name: 'Show Hidden Files',
    description: 'Reveal dotfiles in Files and in GTK file choosers — useful for .config and .local templates.',
    version: '1.0.0',
    author: 'Twiking',
    category: 'Files',
    icon: 'folder',
    license: 'MIT',
    tags: ['nautilus', 'files', 'dotfiles'],
    capabilities: ['settings'],
    requires: {
      desktops: ['GNOME'],
      binaries: ['gsettings'],
      keys: [['org.gnome.nautilus.preferences', 'show-hidden-files']],
    },
  },

  settings: [
    { key: 'files', name: 'In Files (Nautilus)', description: 'Applies to new windows; already-open windows keep their view.', type: 'bool', default: true },
    { key: 'choosers', name: 'In open/save dialogs', description: 'Also toggles the GTK file chooser if that schema exists on this system.', type: 'bool', default: true },
  ],

  apply(ctx) {
    const s = ctx.settings;
    return (async () => {
      const ops = [];
      if (s.files) {
        ops.push(await ctx.gsettings('org.gnome.nautilus.preferences', 'show-hidden-files', true));
      }
      if (s.choosers) {
        const probe = await ctx.get('org.gtk.Settings.FileChooser', 'show-hidden');
        if (probe.ok) {
          ops.push(await ctx.gsettings('org.gtk.Settings.FileChooser', 'show-hidden', true));
        } else {
          ctx.log('No GTK file-chooser schema on this system — skipped.');
        }
      }
      return ops;
    })();
  },
};
