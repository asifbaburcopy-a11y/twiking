'use strict';
const { contextBridge, ipcRenderer } = require('electron');

/* The renderer has no Node access; this is the entire API surface it can reach. */
const call = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('twiking', {
  bootstrap: () => call('twiking:bootstrap'),
  plan: (id, settings) => call('twiking:plan', id, settings),
  apply: (id, settings) => call('twiking:apply', id, settings),
  disable: (id) => call('twiking:disable', id),
  revertAll: () => call('twiking:revert-all'),
  saveSettings: (id, settings) => call('twiking:save-settings', id, settings),
  changes: (id) => call('twiking:changes', id),
  source: (id) => call('twiking:source', id),
  createMod: (name) => call('twiking:create-mod', name),
  importMod: () => call('twiking:import-mod'),
  rescan: () => call('twiking:rescan'),
  diagnostics: () => call('twiking:diagnostics'),
  openModsFolder: () => call('twiking:open-mods'),
  openExternal: (url) => call('twiking:open-external', url),
  launchApp: (id) => call('twiking:launch-app', id),
  installApp: (id) => call('twiking:install-app', id),
  pickImage: () => call('twiking:pick-image'),
  onInstallOutput: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('install:output', listener);
    return () => ipcRenderer.removeListener('install:output', listener);
  },
  window: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
    close: () => ipcRenderer.send('win:close'),
    onState: (cb) => ipcRenderer.on('win:state', (_e, s) => cb(s)),
  },
});
