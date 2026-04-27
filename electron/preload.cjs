const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fastDesktop', {
  isElectron: true,
  platform: process.platform,
  saveFile: (options) => ipcRenderer.invoke('fast-desktop:save-file', options)
});