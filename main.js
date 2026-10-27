'use strict';
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const engine = require('./engine');

const isLinux = process.platform === 'linux';
let win = null;

/* A single instance owns the journal: two copies writing state.json at once
 * would fight over the same revert information. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

app.setName('Twiking');

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    frame: false,
    show: false,
    backgroundColor: '#0f1115',
    title: 'Twiking',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('maximize', () => send('win:state', { maximized: true }));
  win.on('unmaximize', () => send('win:state', { maximized: false }));
  win.on('closed', () => { win = null; });

  /* Scripted capture, used by scripts/shot.sh for the README screenshots and
   * for verifying flows end to end: --route=#/mod/x --click='selector'. */
  const shotArg = process.argv.find((a) => a.startsWith('--screenshot'));
  if (shotArg) {
    const target = shotArg.includes('=') ? shotArg.split('=')[1] : path.join(__dirname, 'screenshots', 'app.png');
    const route = (process.argv.find((a) => a.startsWith('--route=')) || '').split('=')[1] || '';
    /* Ordered steps, so --wait can pace a capture between actions. */
    const steps = [];
    for (const arg of process.argv) {
      if (arg.startsWith('--click=')) steps.push({ kind: 'click', value: arg.slice(8) });
      else if (arg.startsWith('--js=')) steps.push({ kind: 'js', value: arg.slice(5) });
      else if (arg.startsWith('--wait=')) steps.push({ kind: 'wait', value: Number(arg.slice(7)) || 1000 });
    }
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    win.webContents.once('did-finish-load', async () => {
      await wait(1000);
      if (route) {
        await win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(route)}`);
        await wait(1200);
      }
      for (const step of steps) {
        if (step.kind === 'wait') {
          await wait(step.value);
        } else if (step.kind === 'js') {
          await win.webContents.executeJavaScript(`(() => { ${step.value} })()`);
          await wait(400);
        } else {
          const found = await win.webContents.executeJavaScript(
            `(() => { const el = document.querySelector(${JSON.stringify(step.value)}); if (!el) return false; el.click(); return true; })()`
          );
          if (!found) console.error(`click target not found: ${step.value}`);
          await wait(1400);
        }
      }
      const image = await win.webContents.capturePage();
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, image.toPNG());
      console.log(`screenshot written: ${target}`);
      app.quit();
    });
  }
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

/* Every IPC call is wrapped so the renderer always gets a real message instead
 * of Electron's generic "Error invoking remote method". */
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      const value = await fn(...args);
      return { ok: true, value };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  });
}

handle('twiking:bootstrap', () => engine.bootstrap());
handle('twiking:plan', (id, settings) => engine.planMod(id, settings));
handle('twiking:apply', (id, settings) => engine.applyMod(id, settings));
handle('twiking:disable', (id) => engine.disableMod(id));
handle('twiking:revert-all', () => engine.revertAll());
handle('twiking:save-settings', (id, settings) => engine.saveSettings(id, settings));
handle('twiking:changes', (id) => engine.changesFor(id));
handle('twiking:source', (id) => engine.source(id));
handle('twiking:create-mod', (name) => engine.createMod(name));
handle('twiking:rescan', async () => {
  engine.reload();
  return engine.bootstrap();
});
handle('twiking:diagnostics', () => engine.diagnostics());

/* shell.openPath can block the main process while a file manager starts up,
 * which freezes the whole window. Launch xdg-open detached instead and never
 * wait for it — opening a folder is a courtesy, not a reason to hang. */
function launchDetached(cmd, args) {
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

handle('twiking:open-mods', () => {
  const dir = engine.openModsFolder();
  launchDetached('xdg-open', [dir]);
  return dir;
});

handle('twiking:open-external', (url) => {
  if (!/^https?:\/\//i.test(String(url))) throw new Error('only http(s) links can be opened');
  launchDetached('xdg-open', [String(url)]);
  return true;
});

handle('twiking:import-mod', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Import a Twiking mod',
    filters: [{ name: 'Twiking mod', extensions: ['js'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths.length) return { canceled: true };
  const imported = engine.importMod(res.filePaths[0]);
  engine.reload();
  return { canceled: false, ...imported };
});

handle('twiking:launch-app', (id) => engine.launchApp(id));

handle('twiking:pick-image', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Choose an image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'svg'] }],
  });
  if (res.canceled || !res.filePaths.length) return null;
  return res.filePaths[0];
});

/* One-click install. The command comes from the validated catalogue
 * (pkexec + apt-get, or flatpak), never from renderer input, and its output is
 * streamed so the UI can show what is actually happening. */
let installing = null;
handle('twiking:install-app', async (id) => {
  if (installing) throw new Error(`Already installing ${installing}; wait for it to finish.`);
  const plan = engine.installPlanFor(id);
  installing = plan.entry.name;
  try {
    const result = await new Promise((resolve) => {
      const child = spawn(plan.cmd, plan.args, {
        env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' },
      });
      let buffer = '';
      const push = (line) => {
        const clean = line.replace(/\r/g, '').trim();
        if (clean) send('install:output', { id, line: clean });
      };
      const onData = (chunk) => {
        buffer += chunk.toString();
        const parts = buffer.split('\n');
        buffer = parts.pop();
        parts.forEach(push);
      };
      child.stdout.on('data', onData);
      child.stderr.on('data', onData);
      child.on('error', (e) => resolve({ ok: false, code: -1, error: e.message }));
      child.on('close', (code) => {
        if (buffer.trim()) push(buffer.trim());
        const cancelled = code === 126 || code === 127;
        resolve({
          ok: code === 0,
          code,
          error: code === 0 ? null : cancelled ? 'Authentication was cancelled or not permitted.' : `Installer exited with code ${code}.`,
        });
      });
    });
    engine.reload();
    return { ...result, id, command: plan.display, kind: plan.kind };
  } finally {
    installing = null;
  }
});

ipcMain.on('win:minimize', () => win && win.minimize());
ipcMain.on('win:toggle-maximize', () => {
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});
ipcMain.on('win:close', () => win && win.close());

app.whenReady().then(() => {
  if (!isLinux) {
    dialog.showErrorBox('Twiking', 'Twiking configures the Linux desktop and only runs on Linux.');
    app.quit();
    return;
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());