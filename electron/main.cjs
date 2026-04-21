const { app, BrowserWindow, dialog, shell } = require('electron');
const { fork } = require('child_process');
const http = require('http');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const iconPath = path.join(appRoot, 'build', 'app-icon.ico');
const serverEntry = path.join(appRoot, 'server.js');
const desktopPort = Number.parseInt(String(process.env.ELECTRON_APP_PORT || process.env.PORT || '3000'), 10) || 3000;
const desktopUrl = `http://127.0.0.1:${desktopPort}`;
const APP_USER_MODEL_ID = 'com.fastbridgegroup.desktop';

let mainWindow = null;
let serverProcess = null;
let serverStartedByDesktop = false;

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