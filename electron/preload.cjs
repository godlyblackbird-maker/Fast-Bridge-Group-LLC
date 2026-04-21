const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('fastDesktop', {
  isElectron: true,
  platform: process.platform
});