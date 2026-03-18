const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.SHARE_PORT || '3000';
const NGROK_API_URL = 'http://127.0.0.1:4040/api/tunnels';

function getNgrokCommand() {
  const fromEnv = String(process.env.NGROK_PATH || '').trim();
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const wingetPath = `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\\ngrok.exe`;
  if (fs.existsSync(wingetPath)) {
    return wingetPath;
  }

  return 'ngrok';
}

function fetchTunnels() {
  return new Promise((resolve, reject) => {
    const req = http.get(NGROK_API_URL, (res) => {
      let data = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve(Array.isArray(parsed.tunnels) ? parsed.tunnels : []);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function pickPublicUrl(tunnels) {
  const secure = tunnels.find((tunnel) => String(tunnel.public_url || '').startsWith('https://'));
  if (secure) {
    return secure.public_url;
  }

  const any = tunnels.find((tunnel) => String(tunnel.public_url || '').trim());
  return any ? any.public_url : '';
}

async function waitForPublicUrl(timeoutMs) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const tunnels = await fetchTunnels();
      const url = pickPublicUrl(tunnels);
      if (url) {
        return url;
      }
    } catch (error) {
      // ngrok API may not be ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  return '';
}

async function main() {
  const existingUrl = await waitForPublicUrl(1200);
  if (existingUrl) {
    console.log(`Share link already active: ${existingUrl}`);
    return;
  }

  const ngrokCommand = getNgrokCommand();
  const ngrok = spawn(ngrokCommand, ['http', PORT], {
    stdio: 'ignore',
    windowsHide: true
  });

  ngrok.on('error', (error) => {
    console.error('Failed to start ngrok.', error.message);
    process.exit(1);
  });

  const url = await waitForPublicUrl(15000);
  if (!url) {
    console.error('ngrok started but no public URL was detected.');
    console.error('Check your ngrok auth token: https://dashboard.ngrok.com/get-started/your-authtoken');
    process.exit(1);
  }

  console.log(`Share this URL: ${url}`);
  console.log('Keep your server running. To stop sharing, close ngrok from Task Manager or run taskkill /IM ngrok.exe /F');
}

main().catch((error) => {
  console.error('Failed to create share link.', error.message);
  process.exit(1);
});
