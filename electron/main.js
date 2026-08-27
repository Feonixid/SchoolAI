// electron/main.js
// ===================================================================
// EduAI Desktop App — Electron Main Process
// Starts the Express backend, then opens the Chromium window.
// ===================================================================

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path  = require('path');
const { fork } = require('child_process');

let mainWindow    = null;
let serverProcess = null;
let kioskActive   = false;
let forceQuit     = false;

const SERVER_PORT = 3001;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;

// ----------------------------------------------------------------
// Start Express backend
// ----------------------------------------------------------------
function startBackend() {
  const serverPath = path.join(__dirname, '..', 'server.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: SERVER_PORT },
    silent: false
  });

  serverProcess.on('error', err  => console.error('❌ Backend error:', err));
  serverProcess.on('exit',  code => console.log(`Backend exited (${code})`));
  console.log('✅ Backend started (PID:', serverProcess.pid, ')');
}

// ----------------------------------------------------------------
// Create window
// ----------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1366,
    height:    768,
    minWidth:  1024,
    minHeight: 600,
    title: 'EduAI — Albanian School AI Platform',
    backgroundColor: '#f7f5f2',
    show: false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Allow Web Workers (needed for JS execution sandbox)
      webSecurity: true,
      // Allow localhost fetch from renderer
      allowRunningInsecureContent: false
    }
  });

  buildMenu();
  waitForBackend(load);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Intercept close if kiosk locked
  mainWindow.on('close', e => {
    if (kioskActive && !forceQuit) {
      e.preventDefault();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // External links open in real browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(SERVER_URL)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
}

function load() {
  mainWindow.loadURL(SERVER_URL);
}

// ----------------------------------------------------------------
// Poll until backend responds
// ----------------------------------------------------------------
function waitForBackend(callback, retries = 40) {
  const http = require('http');
  const req  = http.get(`${SERVER_URL}/api/has-users`, res => {
    res.resume();
    if (res.statusCode === 200) { callback(); return; }
    retry();
  });
  req.on('error', retry);
  req.setTimeout(800, () => { req.destroy(); retry(); });

  function retry() {
    if (retries <= 0) { console.error('❌ Backend not responding — loading anyway'); callback(); return; }
    setTimeout(() => waitForBackend(callback, retries - 1), 400);
  }
}

// ----------------------------------------------------------------
// Menu
// ----------------------------------------------------------------
function buildMenu() {
  const template = [
    {
      label: 'EduAI',
      submenu: [
        { label: 'About EduAI', click: showAbout },
        { type: 'separator' },
        { role: 'quit', label: 'Quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          // DevTools always available via shortcut — essential for debugging
          label: 'Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Classroom',
      submenu: [
        {
          label: '🔒 Kiosk Mode (teacher-controlled lock)',
          accelerator: 'F11',
          click: toggleKiosk
        },
        { type: 'separator' },
        { label: '🌐 Open in Browser', click: () => shell.openExternal(SERVER_URL) }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Install Ollama',        click: () => shell.openExternal('https://ollama.com') },
        { label: 'Pull gemma3:4b model',  click: () => shell.openExternal('https://ollama.com/library/gemma3') }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ----------------------------------------------------------------
// Kiosk — teacher controlled only, NOT automatic on student login
// ----------------------------------------------------------------
function toggleKiosk() {
  if (!mainWindow) return;
  kioskActive = !kioskActive;
  mainWindow.setKiosk(kioskActive);
  mainWindow.setFullScreen(kioskActive);
  mainWindow.webContents.send('kiosk-mode-changed', kioskActive);
  console.log('Kiosk mode:', kioskActive ? 'ON' : 'OFF');
}

// ----------------------------------------------------------------
// IPC handlers
// ----------------------------------------------------------------
ipcMain.on('toggle-kiosk', (_, lock) => {
  if (!mainWindow) return;
  kioskActive = !!lock;
  mainWindow.setKiosk(kioskActive);
  mainWindow.setFullScreen(kioskActive);
});

// NOTE: login-status-changed no longer auto-locks students —
// kiosk is only ever triggered explicitly by a teacher.
ipcMain.on('login-status-changed', (_, accountType) => {
  console.log(`User logged in as: ${accountType}`);
  // No automatic kiosk lock. Teacher controls it via menu / classroom.js.
});

ipcMain.on('quit-app', () => {
  forceQuit = true;
  app.quit();
});

// ----------------------------------------------------------------
// About
// ----------------------------------------------------------------
function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type:    'info',
    title:   'About EduAI',
    message: 'EduAI — Albanian School AI Platform',
    detail:  'Powered by Gemma 4 · Runs fully offline\nBuilt for Albanian classrooms · v2.0.0'
  });
}

// ----------------------------------------------------------------
// App lifecycle
// ----------------------------------------------------------------
app.whenReady().then(() => {
  startBackend();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
});
