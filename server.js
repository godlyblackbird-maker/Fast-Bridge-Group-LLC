// ...existing code...
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

require('dotenv').config();

const { sendNewLeadEmail, sendAgentEmail } = require('./sendEmail.js/sendEmail');

const app = express();
// Build last updated endpoint
app.get('/api/build-last-updated', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const pkgPath = path.join(__dirname, 'package.json');
    const stats = fs.statSync(pkgPath);
    // Convert to PST (America/Los_Angeles)
    const date = new Date(stats.mtime);
    const options = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const pstString = date.toLocaleString('en-US', options).replace(',', '').replace(/\//g, '-').replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$1-$2') + ' PST';
    res.json({ lastUpdated: pstString });
  } catch (e) {
    res.json({ lastUpdated: null });
  }
});
// Build version endpoint
app.get('/api/build-version', (req, res) => {
  try {
    const pkg = require('./package.json');
    res.json({ version: pkg.version });
  } catch (e) {
    res.json({ version: null });
  }
});
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

let cachedOpenAiApiKey = null;

function getRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim();

  if (!host) {
    return `http://localhost:${PORT}`;
  }

  return `${protocol}://${host}`;
}

function getGoogleRedirectUri(req) {
  const configured = String(process.env.GOOGLE_REDIRECT_URI || '').trim();
  const fallback = `${getRequestOrigin(req)}/auth/google/callback`;

  if (configured) {
    try {
      const configuredUrl = new URL(configured);
      const requestUrl = new URL(getRequestOrigin(req));
      const configuredHost = String(configuredUrl.hostname || '').trim().toLowerCase();
      const requestHost = String(requestUrl.hostname || '').trim().toLowerCase();
      const requestIsRemote = requestHost && !['localhost', '127.0.0.1'].includes(requestHost);
      const configuredIsLocal = ['localhost', '127.0.0.1'].includes(configuredHost);

      if (requestIsRemote && configuredIsLocal) {
        return fallback;
      }
    } catch (error) {
      // Ignore parse failures and use the configured value.
    }

    return configured;
  }

  return fallback;
}

function readOpenAiKeysFromDisk() {
  const candidates = [
    path.join(__dirname, 'Open AI Key', 'Open AI keys.txt'),
    path.join(__dirname, 'Open AI keys', 'Open AI keys.txt'),
    path.join(__dirname, 'Open AI Key', 'open ai keys.txt'),
    path.join(__dirname, 'Open AI keys', 'open ai keys.txt')
  ];

  const collected = [];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/).map(line => String(line || '').trim()).filter(Boolean);
      lines.forEach(line => {
        if (/^sk-[A-Za-z0-9._-]{20,}$/.test(line)) {
          collected.push(line);
        }
      });
    } catch (error) {
      console.error('Unable to read OpenAI key file:', error.message);
    }
  }

  return Array.from(new Set(collected));
}

function getOpenAiApiKeyCandidates() {
  const keys = [];

  if (cachedOpenAiApiKey) {
    keys.push(cachedOpenAiApiKey);
  }

  const fromEnv = String(process.env.OPENAI_API_KEY || '').trim();
  if (/^sk-[A-Za-z0-9._-]{20,}$/.test(fromEnv)) {
    keys.push(fromEnv);
  }

  keys.push(...readOpenAiKeysFromDisk());
  return Array.from(new Set(keys));
}

async function queryOpenAiAssistant(question) {
  const apiKeys = getOpenAiApiKeyCandidates();
  if (apiKeys.length === 0) {
    return { ok: false, error: 'OpenAI API key is not configured.' };
  }

  if (typeof fetch !== 'function') {
    return { ok: false, error: 'This Node runtime does not support fetch.' };
  }

  const systemPrompt = [
    'You are FAST BRIDGE GROUP\'s real-estate acquisitions assistant.',
    'Focus on practical investor guidance for offers, comps, negotiation, underwriting, repair strategy, and disposition.',
    'Be concise, tactical, and specific to residential investment workflows.',
    'When uncertain, clearly state assumptions and suggest next best validation steps.'
  ].join(' ');

  let lastError = 'OpenAI request failed.';

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: String(question || '').slice(0, 4000) }
          ]
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        lastError = `OpenAI request failed (${response.status}): ${detail.slice(0, 300)}`;
        continue;
      }

      const payload = await response.json();
      const answer = String(payload?.choices?.[0]?.message?.content || '').trim();
      if (!answer) {
        lastError = 'OpenAI response was empty.';
        continue;
      }

      cachedOpenAiApiKey = apiKey;
      return { ok: true, answer };
    } catch (error) {
      lastError = error.message || 'OpenAI request failed.';
    }
  }

  return { ok: false, error: lastError };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

// Database connection
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with tables
function initializeDatabase() {
  // Create users table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready');
      // Migrate: add per-user SMTP columns (ignore error if columns already exist)
      db.run(`ALTER TABLE users ADD COLUMN smtp_user TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN smtp_pass TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN smtp_signature TEXT`, () => {});
      syncIsaacAdminAccount();
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS access_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating access_requests table:', err);
    } else {
      console.log('Access requests table ready');
    }
  });
}

function createOAuthState(provider) {
  return jwt.sign({ provider }, JWT_SECRET, { expiresIn: '10m' });
}

function verifyOAuthState(state, provider) {
  try {
    const decoded = jwt.verify(String(state || ''), JWT_SECRET);
    return decoded && decoded.provider === provider;
  } catch (error) {
    return false;
  }
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
}

function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this);
    });
  });
}

async function syncIsaacAdminAccount() {
  const canonicalEmail = 'isaacs.hesed@fastbridgegroup.com';
  const legacyEmails = ['isaacs.hesed@gmail.com'];
  const canonicalName = 'ISAAC HARO';
  const canonicalPassword = '315598';

  try {
    const account = await dbGet(
      `SELECT * FROM users
       WHERE LOWER(email) IN (?, ?)
          OR LOWER(name) = LOWER(?)
       ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END, id ASC`,
      [canonicalEmail, legacyEmails[0], canonicalName, canonicalEmail]
    );

    const hash = await bcrypt.hash(canonicalPassword, 10);

    if (!account) {
      await dbRun(
        'INSERT INTO users (name, email, password_hash, role, smtp_user) VALUES (?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, 'admin', canonicalEmail]
      );
      console.log('Isaac admin account created/synced');
      return;
    }

    const currentEmail = String(account.email || '').trim().toLowerCase();
    const currentSmtpUser = String(account.smtp_user || '').trim().toLowerCase();
    const shouldUpdateSmtpUser = !currentSmtpUser || currentSmtpUser === currentEmail || legacyEmails.includes(currentSmtpUser);

    await dbRun(
      'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, smtp_user = ? WHERE id = ?',
      [
        canonicalName,
        canonicalEmail,
        hash,
        'admin',
        shouldUpdateSmtpUser ? canonicalEmail : account.smtp_user,
        account.id
      ]
    );

    console.log('Isaac admin account synced');
  } catch (error) {
    console.error('Failed to sync Isaac admin account:', error);
  }
}

function resolveWorkspaceAssetPath(relativePath) {
  const normalized = decodeURIComponent(String(relativePath || '').trim())
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (!normalized) {
    return '';
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    return '';
  }

  const absolutePath = path.resolve(__dirname, normalized);
  if (!absolutePath.startsWith(path.resolve(__dirname))) {
    return '';
  }

  if (!fs.existsSync(absolutePath)) {
    return '';
  }

  return absolutePath;
}

const INVESTOR_ATTACHMENTS_ROOT = path.resolve(__dirname, 'Investors Attatchments');

function isAllowedInvestorAttachmentExtension(extension) {
  return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.png', '.jpg', '.jpeg', '.txt'].includes(String(extension || '').toLowerCase());
}

function resolveInvestorAttachmentPath(relativePath) {
  const normalized = decodeURIComponent(String(relativePath || '').trim())
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (!normalized || !normalized.toLowerCase().startsWith('investors attatchments/')) {
    return '';
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!isAllowedInvestorAttachmentExtension(extension)) {
    return '';
  }

  const absolutePath = path.resolve(__dirname, normalized);
  if (!absolutePath.startsWith(INVESTOR_ATTACHMENTS_ROOT)) {
    return '';
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return '';
  }

  return absolutePath;
}

function listInvestorAttachmentPackages() {
  if (!fs.existsSync(INVESTOR_ATTACHMENTS_ROOT)) {
    return [];
  }

  return fs.readdirSync(INVESTOR_ATTACHMENTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folderName = entry.name;
      const folderPath = path.join(INVESTOR_ATTACHMENTS_ROOT, folderName);
      const files = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter((fileEntry) => fileEntry.isFile() && isAllowedInvestorAttachmentExtension(path.extname(fileEntry.name)))
        .map((fileEntry) => ({
          name: fileEntry.name,
          relativePath: `Investors Attatchments/${folderName}/${fileEntry.name}`.replace(/\\/g, '/')
        }));

      return {
        folderName,
        label: folderName,
        fileCount: files.length,
        files
      };
    })
    .filter((entry) => entry.files.length > 0)
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function completeOAuthLogin({ email, name }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('OAuth provider did not return an email');
  }

  const normalizedName = String(name || '').trim() || normalizedEmail.split('@')[0] || 'User';
  const existingUser = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
  let userId = existingUser ? existingUser.id : null;
  let userRole = existingUser ? existingUser.role : 'user';

  if (!existingUser) {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const hash = await bcrypt.hash(randomPassword, 10);
    const insertResult = await dbRun(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [normalizedName, normalizedEmail, hash, 'user']
    );
    userId = insertResult.lastID;
  } else {
    await dbRun('UPDATE users SET name = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?', [normalizedName, existingUser.id]);
  }

  const userPayload = {
    id: userId,
    email: normalizedEmail,
    role: userRole,
    name: normalizedName
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
  return { token, user: userPayload };
}

function redirectOAuthError(res, message) {
  const params = new URLSearchParams({ oauth_error: String(message || 'OAuth sign in failed') });
  res.redirect(`/login.html?${params.toString()}`);
}

// Routes

app.get('/api/auth/google', (req, res) => {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const redirectUri = getGoogleRedirectUri(req);

  if (!clientId) {
    return res.status(503).json({
      configured: false,
      error: 'Google sign-in is not configured yet'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: createOAuthState('google')
  });

  return res.json({
    configured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  });
});

// OAuth - Google start
app.get('/auth/google', (req, res) => {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const redirectUri = getGoogleRedirectUri(req);

  if (!clientId) {
    return redirectOAuthError(res, 'Google sign-in is not configured yet');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: createOAuthState('google')
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// OAuth - Google callback
app.get('/auth/google/callback', async (req, res) => {
  const code = String(req.query?.code || '').trim();
  const state = String(req.query?.state || '').trim();
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = getGoogleRedirectUri(req);

  if (!verifyOAuthState(state, 'google')) {
    return redirectOAuthError(res, 'Google sign-in state validation failed');
  }

  if (!clientId || !clientSecret) {
    return redirectOAuthError(res, 'Google sign-in is not fully configured');
  }

  if (!code) {
    return redirectOAuthError(res, 'Google sign-in did not return an auth code');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${detail.slice(0, 200)}`);
    }

    const tokenPayload = await tokenResponse.json();
    const accessToken = String(tokenPayload.access_token || '').trim();
    if (!accessToken) {
      throw new Error('Google did not return an access token');
    }

    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      const detail = await userInfoResponse.text();
      throw new Error(`Google user info failed: ${detail.slice(0, 200)}`);
    }

    const userInfo = await userInfoResponse.json();
    const login = await completeOAuthLogin({
      email: userInfo.email,
      name: userInfo.name
    });

    const params = new URLSearchParams({ token: login.token, oauth: 'google' });
    return res.redirect(`/login.html?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirectOAuthError(res, 'Google sign-in failed');
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
      // Compare password with hash
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Public registration is disabled. Use admin-only endpoint below.
app.post('/api/register', (req, res) => {
  return res.status(403).json({ error: 'Public registration is disabled. Contact an admin.' });
});

// Admin-only account creation endpoint.
app.post('/api/admin/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, email, password, role } = req.body;
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || 'user').trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (!['admin', 'user'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Role must be either admin or user' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  bcrypt.hash(password, 10, (hashError, hash) => {
    if (hashError) {
      return res.status(500).json({ error: 'Error processing password' });
    }

    db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [normalizedName, normalizedEmail, hash, normalizedRole],
      function onInsert(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        return res.json({
          success: true,
          message: 'User created successfully',
          user: {
            id: this.lastID,
            name: normalizedName,
            email: normalizedEmail,
            role: normalizedRole
          }
        });
      }
    );
  });
});

app.put('/api/admin/users/:id/email', (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const userId = Number.parseInt(String(req.params?.id || ''), 10);
  const nextEmail = String(req.body?.email || '').trim().toLowerCase();
  const syncSmtpUser = req.body?.syncSmtpUser !== false;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Valid user id is required' });
  }

  if (!nextEmail) {
    return res.status(400).json({ error: 'New email is required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  db.get('SELECT id, name, email, role, smtp_user FROM users WHERE id = ?', [userId], (selectError, userRow) => {
    if (selectError) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (String(userRow.email || '').trim().toLowerCase() === nextEmail) {
      return res.json({
        success: true,
        message: 'Email already matches this account',
        user: {
          id: userRow.id,
          name: userRow.name,
          email: nextEmail,
          role: userRow.role
        }
      });
    }

    db.get('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [nextEmail, userId], (existingError, existingUser) => {
      if (existingError) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'That email is already assigned to another account' });
      }

      const currentEmail = String(userRow.email || '').trim().toLowerCase();
      const currentSmtpUser = String(userRow.smtp_user || '').trim().toLowerCase();
      const nextSmtpUser = syncSmtpUser && currentSmtpUser && currentSmtpUser === currentEmail
        ? nextEmail
        : userRow.smtp_user;

      db.run(
        'UPDATE users SET email = ?, smtp_user = ? WHERE id = ?',
        [nextEmail, nextSmtpUser, userId],
        (updateError) => {
          if (updateError) {
            if (String(updateError.message || '').includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'That email is already assigned to another account' });
            }
            return res.status(500).json({ error: 'Unable to update user email' });
          }

          return res.json({
            success: true,
            message: 'User email updated successfully',
            user: {
              id: userRow.id,
              name: userRow.name,
              email: nextEmail,
              role: userRow.role
            },
            smtpUserUpdated: nextSmtpUser !== userRow.smtp_user
          });
        }
      );
    });
  });
});

// Verify token endpoint
app.post('/api/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// OpenAI assistant endpoint for dashboard AI helper.
app.post('/api/ai/chat', async (req, res) => {
  const question = String(req.body?.question || '').trim();

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const result = await queryOpenAiAssistant(question);
  if (!result.ok) {
    return res.status(503).json({ error: result.error || 'OpenAI is unavailable' });
  }

  return res.json({
    success: true,
    provider: 'openai',
    answer: result.answer
  });
});

// Helper: extract and verify JWT from Authorization header
function requireAuth(req, res) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

function requireAdmin(req, res) {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return null;
  }

  if (decoded.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }

  return decoded;
}

// GET /api/smtp-settings — returns the authenticated user's Gmail SMTP settings
app.get('/api/smtp-settings', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  db.get('SELECT smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    return res.json({
      smtpUser: row?.smtp_user || '',
      hasPassword: !!(row?.smtp_pass),
      smtpSignature: row?.smtp_signature || ''
    });
  });
});

// POST /api/smtp-settings — save the authenticated user's Gmail SMTP settings
app.post('/api/smtp-settings', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  const smtpUser = String(req.body?.smtpUser || '').trim().toLowerCase();
  const smtpPass = String(req.body?.smtpPass || '').trim();
  const smtpSignature = String(req.body?.smtpSignature || '').trim();

  if (!smtpUser) return res.status(400).json({ error: 'Gmail address is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpUser)) return res.status(400).json({ error: 'Invalid Gmail address' });

  db.get('SELECT smtp_pass FROM users WHERE id = ?', [decoded.id], (selectError, row) => {
    if (selectError) return res.status(500).json({ error: 'Database error' });

    const resolvedSmtpPass = smtpPass || String(row?.smtp_pass || '').trim();
    if (!resolvedSmtpPass) return res.status(400).json({ error: 'App Password is required' });

    db.run(
      'UPDATE users SET smtp_user = ?, smtp_pass = ?, smtp_signature = ? WHERE id = ?',
      [smtpUser, resolvedSmtpPass, smtpSignature, decoded.id],
      (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save SMTP settings' });
        return res.json({ success: true, message: 'Gmail settings saved' });
      }
    );
  });
});

// POST /api/test-smtp — sends a test email to verify the user's Gmail SMTP settings
app.post('/api/test-smtp', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  db.get('SELECT smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const smtpUser = row?.smtp_user || '';
    const smtpPass = row?.smtp_pass || '';
    const smtpSignature = row?.smtp_signature || '';

    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'Save your Gmail settings first before testing' });
    }

    try {
      await sendAgentEmail({
        fromName: decoded.name || 'Fast Bridge Group',
        fromEmail: smtpUser,
        toName: decoded.name || '',
        toEmail: smtpUser,
        subject: 'Test Email — Gmail SMTP Verified ✓',
        body: `Hi ${decoded.name || 'there'},\n\nThis is a test email confirming that your Gmail account (${smtpUser}) is properly configured for the Fast Bridge Group dashboard.\n\nYou can now send emails directly from your own Gmail account.\n\nSent: ${new Date().toLocaleString()}`,
        smtpSignature,
        smtpUser,
        smtpPass
      });
      return res.json({ success: true, message: `Test email sent to ${smtpUser}` });
    } catch (error) {
      console.error('Test SMTP error:', error);
      return res.status(500).json({ error: error.message || 'Failed to send test email' });
    }
  });
});

// Lead capture endpoint that triggers a notification email.
app.post('/api/leads', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!name && !email && !phone && !message) {
    return res.status(400).json({ error: 'Lead details are required' });
  }

  try {
    await sendNewLeadEmail({ name, email, phone, message });
    return res.json({ success: true, message: 'Lead email sent' });
  } catch (error) {
    console.error('Failed to send lead email:', error);
    return res.status(500).json({ error: 'Failed to send lead email' });
  }
});

app.post('/api/access-requests', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const phone = String(req.body?.phone || '').trim();
  const company = String(req.body?.company || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  db.run(
    'INSERT INTO access_requests (name, email, phone, company, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone, company, message],
    function onInsert(err) {
      if (err) {
        console.error('Failed to save access request:', err);
        return res.status(500).json({ error: 'Unable to save access request.' });
      }

      return res.json({
        success: true,
        message: 'Access request submitted successfully.',
        request: {
          id: this.lastID,
          name,
          email,
          phone,
          company,
          message,
          status: 'pending'
        }
      });
    }
  );
});

app.get('/api/access-requests', (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  db.all(
    `SELECT id, name, email, phone, company, message, status, created_at
     FROM access_requests
     ORDER BY datetime(created_at) DESC, id DESC`,
    (err, rows) => {
      if (err) {
        console.error('Failed to load access requests:', err);
        return res.status(500).json({ error: 'Unable to load access requests.' });
      }

      return res.json({ requests: rows || [] });
    }
  );
});

app.get('/api/investor-attachments', (req, res) => {
  try {
    return res.json({ packages: listInvestorAttachmentPackages() });
  } catch (error) {
    console.error('Failed to list investor attachments:', error);
    return res.status(500).json({ error: 'Failed to load investor attachment packages.' });
  }
});

app.post('/api/send-agent-email', async (req, res) => {
  const fromName = String(req.body?.fromName || '').trim();
  const fromEmail = String(req.body?.fromEmail || '').trim();
  const toName = String(req.body?.toName || '').trim();
  const toEmail = String(req.body?.toEmail || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  const htmlBody = String(req.body?.htmlBody || '').trim();
  const ecardPath = String(req.body?.ecardPath || '').trim();
  const ecardAttachmentName = String(req.body?.ecardAttachmentName || '').trim();
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
  const investorAttachmentPaths = Array.isArray(req.body?.investorAttachmentPaths) ? req.body.investorAttachmentPaths : [];

  if (!toEmail) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }
  if (!subject && !body) {
    return res.status(400).json({ error: 'Subject or body is required' });
  }

  const resolvedECardPath = ecardPath ? resolveWorkspaceAssetPath(ecardPath) : '';
  if (ecardPath && !resolvedECardPath) {
    return res.status(400).json({ error: 'Selected E-card image was not found.' });
  }

  const normalizedAttachments = [];
  for (const item of attachments) {
    const filename = String(item?.filename || '').trim();
    const contentType = String(item?.contentType || 'application/octet-stream').trim() || 'application/octet-stream';
    const contentBase64 = String(item?.contentBase64 || '').trim();

    if (!filename || !contentBase64) {
      continue;
    }

    normalizedAttachments.push({
      filename,
      content: Buffer.from(contentBase64, 'base64'),
      contentType
    });
  }

  for (const item of investorAttachmentPaths) {
    const relativePath = String(item || '').trim();
    const resolvedAttachmentPath = resolveInvestorAttachmentPath(relativePath);
    if (!resolvedAttachmentPath) {
      continue;
    }

    normalizedAttachments.push({
      filename: path.basename(resolvedAttachmentPath),
      path: resolvedAttachmentPath
    });
  }

  // Look up the authenticated user's personal SMTP settings; fall back to env vars if not set
  let smtpUser;
  let smtpPass;
  let smtpSignature = '';
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const row = await new Promise((resolve, reject) => {
        db.get('SELECT smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id], (err, r) => {
          if (err) reject(err); else resolve(r);
        });
      });
      if (row?.smtp_user && row?.smtp_pass) {
        smtpUser = row.smtp_user;
        smtpPass = row.smtp_pass;
      }
      smtpSignature = String(row?.smtp_signature || '').trim();
    } catch (e) {
      // Invalid token or DB failure — proceed with env fallback
    }
  }

  // Split emails and send individually
  const emails = toEmail.split(',').map(e => String(e).trim()).filter(Boolean);
  if (emails.length === 0) {
    return res.status(400).json({ error: 'No valid recipient emails' });
  }

  let sentCount = 0;
  let failed = [];
  for (const email of emails) {
    try {
      let resolvedHtmlBody = htmlBody;
      if (resolvedHtmlBody && resolvedECardPath) {
        resolvedHtmlBody = `${resolvedHtmlBody}<div style="margin-top:18px;"><img src="cid:offer-ecard-inline" alt="E-card signature" style="display:block;max-width:420px;width:100%;height:auto;border-radius:12px;"></div>`;
      }

      await sendAgentEmail({
        fromName,
        fromEmail,
        toName,
        toEmail: email,
        subject,
        body,
        htmlBody: resolvedHtmlBody,
        ecardAttachmentPath: resolvedECardPath,
        ecardAttachmentName,
        attachments: normalizedAttachments,
        smtpSignature,
        smtpUser,
        smtpPass
      });
      sentCount++;
    } catch (err) {
      failed.push(email);
    }
  }

  if (failed.length === 0) {
    return res.json({ success: true, message: `Email sent to ${sentCount} recipient(s)` });
  } else if (sentCount > 0) {
    return res.json({ success: true, message: `Email sent to ${sentCount} recipient(s), but failed for: ${failed.join(', ')}` });
  } else {
    return res.status(500).json({ error: `Failed to send email to: ${failed.join(', ')}` });
  }
});

// Get all users for authenticated UI selectors
app.get('/api/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    db.all('SELECT id, name, email, role, created_at, last_login FROM users', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json({ users: rows });
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.redirect('/login.html');
});

// 404 handler
app.use((req, res) => {
  if (!req.path.startsWith('/api/')) {
    // Try to serve as HTML file if it exists
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     FAST BRIDGE GROUP Dashboard - Secure Server              ║
║                  Running on port ${PORT}                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('\nDatabase connection closed');
    process.exit(0);
  });
});
