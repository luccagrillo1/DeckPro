'use strict';

const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const { execFile, exec, spawn } = require('child_process');
const path = require('path');
const http = require('http');

app.setName('DeckPro');
app.setAboutPanelOptions({
  applicationName: 'DeckPro',
  applicationVersion: require('./package.json').version, // kept in sync with APP_VERSION in app.js
  copyright: '© 2026 Lucca Grillo',
  iconPath: path.join(__dirname, 'public', 'assets', 'deckpro_icon_dark.png'),
});

let win;
let serverStarted = false;
let serverUrl = null;
let serverInstance = null;

// ─── Server ───────────────────────────────────────────────────────────────────

// Fixed, dedicated port for the packaged app's internal server. The renderer's
// entire local state (config, preferences, Pro7 connection settings, palettes —
// everything in localStorage) is scoped to this origin including the port, so
// binding to a random port each launch (as this used to) silently reset all of
// it back to defaults whenever the OS happened to assign a different ephemeral
// port than last time. A fixed port keeps the origin — and localStorage — stable
// across launches. Falls back to an ephemeral port only if this one is already
// taken (e.g. a second DeckPro instance already running).
const PREFERRED_PORT = 47821;

function startServer() {
  return new Promise((resolve, reject) => {
    if (serverStarted && serverUrl) return resolve(serverUrl);
    // Library storage lives under Electron's userData (Application Support/DeckPro)
    process.env.DECKPRO_DATA_DIR = app.getPath('userData');
    const expressApp = require('./server');

    function tryListen(port) {
      const server = expressApp.listen(port, '127.0.0.1');
      server.once('listening', () => {
        serverStarted = true;
        serverInstance = server;
        const { port: boundPort } = server.address();
        serverUrl = `http://127.0.0.1:${boundPort}`;
        resolve(serverUrl);
      });
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && port !== 0) {
          tryListen(0); // preferred port taken — fall back to a random one
        } else {
          reject(err);
        }
      });
    }

    tryListen(PREFERRED_PORT);
  });
}

function waitForServer(url, retries = 20, delay = 150) {
  return new Promise((resolve, reject) => {
    function attempt() {
      http.get(url, () => resolve()).on('error', () => {
        if (retries-- > 0) setTimeout(attempt, delay);
        else reject(new Error('Server did not start in time'));
      });
    }
    attempt();
  });
}

// ─── Helper: call a function in the renderer ──────────────────────────────────

function renderer(js) {
  win?.webContents.executeJavaScript(js).catch(() => {});
}

// ─── App menu ─────────────────────────────────────────────────────────────────

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const isDev = !app.isPackaged;

  const template = [

    // ── DeckPro (macOS app menu) ─────────────────────────────────────────────
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide DeckPro' },
        { role: 'hideOthers' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit DeckPro' },
      ],
    }] : []),

    // ── File ────────────────────────────────────────────────────────────────
    {
      label: 'File',
      submenu: [
        {
          label: 'New Deck',
          accelerator: 'CmdOrCtrl+N',
          click: () => renderer(`document.getElementById('btn-new-deck')?.click()`),
        },
        {
          label: 'Deck Library…',
          accelerator: 'CmdOrCtrl+O',
          click: () => renderer(`document.getElementById('btn-decks')?.click()`),
        },
        { type: 'separator' },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: () => renderer(`document.getElementById('btn-generate')?.click()`),
        },
        { type: 'separator' },
        {
          label: 'Redeploy',
          accelerator: 'CmdOrCtrl+Shift+R',
          enabled: isDev,
          visible: isDev,
          click: () => {
            if (!isDev) return;
            dialog.showMessageBox(win, {
              type: 'question',
              buttons: ['Redeploy', 'Cancel'],
              defaultId: 0,
              cancelId: 1,
              message: 'Redeploy DeckPro?',
              detail: 'Builds a fresh app, replaces /Applications/DeckPro.app, and relaunches. Takes ~30 seconds.\n\nMake sure you have saved your current deck to the Library first — any unsaved changes will be lost on relaunch.',
            }).then(({ response }) => {
              if (response !== 0) return;

              // Show in-app progress overlay immediately
              renderer(`typeof showRebuildOverlay === 'function' && showRebuildOverlay()`);

              const script = path.join(app.getAppPath(), 'rebuild.sh');
              const proc   = spawn('/bin/bash', [script]);

              proc.stdout.on('data', (data) => {
                for (const line of data.toString().split('\n')) {
                  const t = line.trim();
                  if (t.startsWith('STEP:')) {
                    const n = parseInt(t.split(':')[1]);
                    renderer(`typeof updateRebuildStep === 'function' && updateRebuildStep(${n})`);
                  } else if (t.startsWith('FAIL:')) {
                    const msg = t.slice(5).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    renderer(`typeof showRebuildError === 'function' && showRebuildError('${msg}')`);
                  }
                }
              });

              proc.on('close', (code) => {
                if (code === 0) {
                  app.quit(); // new instance already launched by rebuild.sh
                }
                // On failure, showRebuildError already called via FAIL: line
              });
            });
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Close Window' } : { role: 'quit' },
      ],
    },

    // ── Edit ────────────────────────────────────────────────────────────────
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            // Try app-level undo first; fall back to native
            if (win?.webContents.isFocused()) {
              renderer(`typeof applyUndo === 'function' && applyUndo()`);
            }
          },
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          click: () => renderer(`typeof applyRedo === 'function' && applyRedo()`),
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'pasteAndMatchStyle' },
        ] : []),
      ],
    },

    // ── View ────────────────────────────────────────────────────────────────
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => renderer(`typeof toggleTheme === 'function' && toggleTheme()`),
        },
        {
          label: 'Show Blanks',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => renderer(`
            state.showBlanks = !state.showBlanks;
            saveState();
            renderSidebar();
          `),
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          click: () => renderer(`
            state.activeId = state.activeId === 'settings' ? null : 'settings';
            render();
          `),
        },
        {
          label: 'Schemes',
          click: () => renderer(`
            state.activeId = state.activeId === 'style' ? null : 'style';
            render();
          `),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // ── Deck ─────────────────────────────────────────────────────────────────
    {
      label: 'Deck',
      submenu: [
        {
          label: 'Add Scripture',
          accelerator: 'CmdOrCtrl+1',
          click: () => renderer(`typeof addSlide === 'function' && addSlide('scripture')`),
        },
        {
          label: 'Add Point',
          accelerator: 'CmdOrCtrl+2',
          click: () => renderer(`typeof addSlide === 'function' && addSlide('point')`),
        },
        {
          label: 'Add Blank',
          accelerator: 'CmdOrCtrl+3',
          click: () => renderer(`typeof addSlide === 'function' && addSlide('blank')`),
        },
        {
          label: 'Add Image',
          accelerator: 'CmdOrCtrl+4',
          click: () => renderer(`typeof addSlide === 'function' && addSlide('image')`),
        },
        {
          label: 'Add Custom',
          accelerator: 'CmdOrCtrl+5',
          click: () => renderer(`typeof addSlide === 'function' && addSlide('custom')`),
        },
      ],
    },

    // ── Window ───────────────────────────────────────────────────────────────
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },

    // ── Help ─────────────────────────────────────────────────────────────────
    {
      role: 'help',
      submenu: [
        {
          label: 'DeckPro Guide',
          click: () => renderer(`document.getElementById('help-modal')?.classList.add('open')`),
        },
        {
          label: "What's New",
          click: () => renderer(`document.getElementById('changelog-modal')?.classList.add('open')`),
        },
        { type: 'separator' },
        {
          label: 'Check for Updates…',
          click: () => renderer(`typeof checkForUpdates === 'function' && checkForUpdates(true)`),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1c1c1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
    },
    // macOS: Dock icon comes from the app bundle — don't override here
    ...(process.platform !== 'darwin' && {
      icon: path.join(__dirname, 'public', 'assets', 'DeckPro.icns'),
    }),
  });

  win.loadFile(path.join(__dirname, 'public', 'loading.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Ensure Chromium's spell checker uses en-US so right-click shows suggestions
  win.webContents.session.setSpellCheckerLanguages(['en-US']);

  win.webContents.on('context-menu', (event, params) => {
    if (!params.isEditable && !params.misspelledWord) return;
    const items = [];
    if (params.misspelledWord) {
      const suggestions = params.dictionarySuggestions || [];
      if (suggestions.length) {
        for (const suggestion of suggestions) {
          items.push({
            label: suggestion,
            click: () => win.webContents.replaceMisspelling(suggestion),
          });
        }
        items.push({ type: 'separator' });
      } else {
        items.push({ label: 'No suggestions', enabled: false });
        items.push({ type: 'separator' });
      }
      items.push({
        label: `Add "${params.misspelledWord}" to Dictionary`,
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      });
      items.push({ type: 'separator' });
    }
    items.push({ role: 'cut' }, { role: 'copy' }, { role: 'paste' });
    Menu.buildFromTemplate(items).popup({ window: win });
  });

  win.on('closed', () => { win = null; });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  buildMenu();
  createWindow();
  const url = await startServer();
  await waitForServer(url);
  win.loadURL(url);

  // If launched after a rebuild or update, show a success toast once the page is ready
  if (process.argv.includes('--rebuilt')) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        renderer(`typeof toast === 'function' && toast('success', 'Redeploy complete', 'DeckPro redeployed and relaunched successfully')`);
      }, 800);
    });
  }
  if (process.argv.includes('--updated')) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        const v = require('./package.json').version;
        renderer(`typeof toast === 'function' && toast('success', 'Updated', 'DeckPro is now v${v}')`);
      }, 800);
    });
  }
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    try { serverInstance.close(); } catch (_) {}
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
