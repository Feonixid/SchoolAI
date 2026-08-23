// electron/preload.js
// ===================================================================
// Secure bridge between Electron main process and the web app
// ===================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Kiosk / classroom lock
  toggleKiosk: (lock) => ipcRenderer.send('toggle-kiosk', lock),
  onKioskChanged: (callback) => ipcRenderer.on('kiosk-mode-changed', (_, isLocked) => callback(isLocked)),

  // Account specific hooks
  loginStatusChanged: (accountType) => ipcRenderer.send('login-status-changed', accountType),
  quitApp: () => ipcRenderer.send('quit-app'),


  // Platform info
  platform: process.platform,
  isDesktop: true
});
