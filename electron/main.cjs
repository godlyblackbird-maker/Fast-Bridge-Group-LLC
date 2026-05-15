const { app, BrowserWindow, dialog, ipcMain, shell, desktopCapturer, session } = require('electron');
const { fork } = require('child_process');
const fs = require('fs/promises');
const http = require('http');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const iconPath = path.join(appRoot, 'build', 'app-icon.ico');
const serverEntry = path.join(appRoot, 'server.js');
const desktopDataDir = app.getPath('userData');
const desktopPort = Number.parseInt(String(process.env.ELECTRON_APP_PORT || process.env.PORT || '3000'), 10) || 3000;
const desktopUrl = `http://127.0.0.1:${desktopPort}`;
const APP_USER_MODEL_ID = 'com.fastbridgegroup.desktop';

let mainWindow = null;
let serverProcess = null;
let serverStartedByDesktop = false;

const isTrustedDesktopUrl = (value) => typeof value === 'string' && value.startsWith(desktopUrl);

const setupDesktopMediaPermissions = () => {
  const desktopSession = session.defaultSession;
  if (!desktopSession) {
    return;
  }

  desktopSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin, details) => {
    const candidateUrl = [
      requestingOrigin,
      details && details.requestingUrl,
      details && details.embeddingOrigin,
      details && details.securityOrigin
    ].find((value) => typeof value === 'string' && value.trim()) || '';

    if (!isTrustedDesktopUrl(candidateUrl)) {
      return false;
    }

    return permission === 'media' || permission === 'display-capture' || permission === 'fullscreen';
  });

  desktopSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const candidateUrl = [
      details && details.requestingUrl,
      details && details.embeddingOrigin,
      details && details.securityOrigin,
      webContents && typeof webContents.getURL === 'function' ? webContents.getURL() : ''
    ].find((value) => typeof value === 'string' && value.trim()) || '';

    const allowed = isTrustedDesktopUrl(candidateUrl)
      && (permission === 'media' || permission === 'display-capture' || permission === 'fullscreen');

    callback(Boolean(allowed));
  });

  if (typeof desktopSession.setDisplayMediaRequestHandler === 'function') {
    desktopSession.setDisplayMediaRequestHandler(async (request, callback) => {
      const candidateUrl = [
        request && request.securityOrigin,
        request && request.frame && typeof request.frame.url === 'string' ? request.frame.url : ''
      ].find((value) => typeof value === 'string' && value.trim()) || desktopUrl;

      if (!isTrustedDesktopUrl(candidateUrl)) {
        callback({ video: null, audio: null });
        return;
      }

      try {
        const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
        const preferredSource = sources.find((source) => String(source.id || '').startsWith('screen:')) || sources[0] || null;

        if (!preferredSource) {
          callback({ video: null, audio: null });
          return;
        }

        callback({
          video: preferredSource,
          audio: process.platform === 'win32' ? 'loopback' : null
        });
      } catch (_error) {
        callback({ video: null, audio: null });
      }
    }, {
      useSystemPicker: true
    });
  }
};

ipcMain.handle('fast-desktop:save-file', async (_event, options = {}) => {
  const defaultPath = typeof options.defaultPath === 'string' && options.defaultPath.trim()
    ? options.defaultPath.trim()
    : 'document.pdf';

  const saveResult = await dialog.showSaveDialog(mainWindow || undefined, {
    defaultPath,
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (saveResult.canceled || !saveResult.filePath) {
    return { canceled: true };
  }

  const base64 = options && options.base64;
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('No file data was provided to save.');
  }
  const buffer = Buffer.from(base64, 'base64');
  await fs.writeFile(saveResult.filePath, buffer);
  return { canceled: false, filePath: saveResult.filePath };
});

const canReachUrl = (url) => new Promise((resolve) => {
  const request = http.get(url, (response) => {
    response.resume();
    resolve(response.statusCode >= 200 && response.statusCode < 500);
  });

  request.on('error', () => resolve(false));
  request.setTimeout(2000, () => {
    request.destroy();
    resolve(false);
  });
});

const waitForServer = async (url, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await canReachUrl(url)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
};

const stopLocalServer = () => {
  if (!serverProcess) {
    return;
  }

  try {
    serverProcess.kill();
  } catch (_error) {
    // Ignore shutdown races.
  }

  serverProcess = null;
  serverStartedByDesktop = false;
};

const startLocalServer = async () => {
  if (await canReachUrl(desktopUrl)) {
    return;
  }

  serverProcess = fork(serverEntry, [], {
    cwd: appRoot,
    env: {
      ...process.env,
      PORT: String(desktopPort),
      DATA_DIR: desktopDataDir,
      ELECTRON_DESKTOP: '1'
    },
    stdio: 'inherit'
  });
  serverStartedByDesktop = true;

  serverProcess.on('exit', () => {
    serverProcess = null;
    serverStartedByDesktop = false;
  });

  const serverReady = await waitForServer(desktopUrl);
  if (!serverReady) {
    throw new Error(`The FAST local server did not become available at ${desktopUrl}.`);
  }
};

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    title: 'FAST BRIDGE GROUP',
    backgroundColor: '#08131f',
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(desktopUrl)) {
      return { action: 'allow' };
    }

    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(desktopUrl)) {
      return;
    }

    event.preventDefault();
    shell.openExternal(url).catch(() => {});
  });

  await mainWindow.loadURL(desktopUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(async () => {
  try {
    app.setAppUserModelId(APP_USER_MODEL_ID);
    setupDesktopMediaPermissions();
    await startLocalServer();
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox('FAST BRIDGE GROUP Desktop', error && error.message ? error.message : 'The desktop app could not start.');
    stopLocalServer();
    app.quit();
    return;
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverStartedByDesktop) {
    stopLocalServer();
  }
});