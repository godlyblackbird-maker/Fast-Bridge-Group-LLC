// ...existing code...
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const twilio = require('twilio');
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
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || 'gpt-5-nano').trim() || 'gpt-5-nano';

let cachedOpenAiApiKey = null;
let cachedTwilioClient = null;
let cachedTwilioClientKey = '';

const CANONICAL_ISAAC_EMAIL = 'isaac.haro@fastbridgegroupllc.com';
const CANONICAL_STEVE_EMAIL = 'steve.medina@fastbridgegroupllc.com';
const CANONICAL_STEVE_PASSWORD = 'stevemedina';
const ADMIN_CANONICAL_EMAILS = new Set([
  CANONICAL_ISAAC_EMAIL,
  CANONICAL_STEVE_EMAIL
]);

const LEGACY_EMAIL_ALIASES = new Map([
  ['isaacs.hesed@gmail.com', CANONICAL_ISAAC_EMAIL],
  ['isaacs.hesed@fastbridgegroup.com', CANONICAL_ISAAC_EMAIL],
  ['medinafbg@gmail.com', CANONICAL_STEVE_EMAIL],
  ['medinastj@gmail.com', CANONICAL_STEVE_EMAIL]
]);

function getFirstConfiguredEnvValue(...names) {
  for (const name of names) {
    const value = String(process.env[name] || '').trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function normalizeKnownEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return LEGACY_EMAIL_ALIASES.get(normalizedEmail) || normalizedEmail;
}

function isKnownAdminEmail(email) {
  return ADMIN_CANONICAL_EMAILS.has(normalizeKnownEmail(email));
}

function getPerUserSmtpEnvConfig(email) {
  const normalizedEmail = normalizeKnownEmail(email);

  if (normalizedEmail === CANONICAL_STEVE_EMAIL) {
    return {
      smtpUser: getFirstConfiguredEnvValue('STEVE_SMTP_USER') || CANONICAL_STEVE_EMAIL,
      smtpPass: getFirstConfiguredEnvValue('STEVE_SMTP_PASS'),
      smtpSignature: getFirstConfiguredEnvValue('STEVE_SMTP_SIGNATURE')
    };
  }

  if (normalizedEmail === CANONICAL_ISAAC_EMAIL) {
    return {
      smtpUser: getFirstConfiguredEnvValue('ISAAC_SMTP_USER') || CANONICAL_ISAAC_EMAIL,
      smtpPass: getFirstConfiguredEnvValue('ISAAC_SMTP_PASS'),
      smtpSignature: getFirstConfiguredEnvValue('ISAAC_SMTP_SIGNATURE')
    };
  }

  return {
    smtpUser: '',
    smtpPass: '',
    smtpSignature: ''
  };
}

function resolveEffectiveSmtpConfig({ email, smtpUser, smtpPass, smtpSignature }) {
  const normalizedEmail = normalizeKnownEmail(email);
  const normalizedDbUser = normalizeKnownEmail(smtpUser || normalizedEmail);
  const perUserEnvConfig = getPerUserSmtpEnvConfig(normalizedDbUser || normalizedEmail);
  const fallbackGlobalUser = getFirstConfiguredEnvValue('SMTP_USER');
  const fallbackGlobalPass = getFirstConfiguredEnvValue('SMTP_PASS');
  const dbUser = String(smtpUser || '').trim().toLowerCase();
  const dbPass = String(smtpPass || '').trim();
  const perUserEnvUser = String(perUserEnvConfig.smtpUser || '').trim().toLowerCase();
  const perUserEnvPass = String(perUserEnvConfig.smtpPass || '').trim();
  const globalUser = String(fallbackGlobalUser || '').trim().toLowerCase();
  const globalPass = String(fallbackGlobalPass || '').trim();

  let resolvedUser = '';
  let resolvedPass = '';

  if (dbUser && dbPass) {
    resolvedUser = dbUser;
    resolvedPass = dbPass;
  } else if (perUserEnvUser && perUserEnvPass) {
    resolvedUser = perUserEnvUser;
    resolvedPass = perUserEnvPass;
  } else if (dbUser && globalUser && dbUser === globalUser && globalPass) {
    resolvedUser = dbUser;
    resolvedPass = globalPass;
  } else if (perUserEnvUser && globalUser && perUserEnvUser === globalUser && globalPass) {
    resolvedUser = perUserEnvUser;
    resolvedPass = globalPass;
  } else if (globalUser && globalPass) {
    resolvedUser = globalUser;
    resolvedPass = globalPass;
  } else {
    resolvedUser = dbUser || perUserEnvUser || globalUser;
    resolvedPass = dbPass || perUserEnvPass || globalPass;
  }

  const resolvedSignature = String(smtpSignature || perUserEnvConfig.smtpSignature || '').trim();

  return {
    smtpUser: resolvedUser,
    smtpPass: resolvedPass,
    smtpSignature: resolvedSignature,
    hasPassword: Boolean(resolvedPass)
  };
}

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
      const hostChanged = Boolean(requestHost && configuredHost && configuredHost !== requestHost);

      if (requestIsRemote && (configuredIsLocal || hostChanged)) {
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
  const fromEnv = String(process.env.OPENAI_API_KEY || '').trim();
  if (/^sk-[A-Za-z0-9._-]{20,}$/.test(fromEnv)) {
    return [fromEnv];
  }

  const keys = [];

  if (cachedOpenAiApiKey) {
    keys.push(cachedOpenAiApiKey);
  }

  keys.push(...readOpenAiKeysFromDisk());
  return Array.from(new Set(keys));
}

function extractOpenAiResponseText(payload) {
  const directText = String(payload?.output_text || '').trim();
  if (directText) {
    return directText;
  }

  const segments = [];
  const outputs = Array.isArray(payload?.output) ? payload.output : [];

  outputs.forEach(item => {
    const contentParts = Array.isArray(item?.content) ? item.content : [];
    contentParts.forEach(part => {
      const text = String(part?.text || '').trim();
      if (text) {
        segments.push(text);
      }
    });
  });

  return segments.join('\n\n').trim();
}

function normalizeSmsPhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith('+')) {
    const digits = `+${raw.slice(1).replace(/\D/g, '')}`;
    return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : '';
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return '';
}

function maskPhoneNumber(phone) {
  const normalized = normalizeSmsPhone(phone);
  if (!normalized) {
    return '';
  }
  return `${normalized.slice(0, 2)}******${normalized.slice(-4)}`;
}

function getTwilioMessagingConfig() {
  return {
    accountSid: String(process.env.TWILIO_ACCOUNT_SID || '').trim(),
    authToken: String(process.env.TWILIO_AUTH_TOKEN || '').trim(),
    fromNumber: String(process.env.TWILIO_PHONE_NUMBER || '').trim(),
    messagingServiceSid: String(process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim()
  };
}

function isTwilioConfigured(config = getTwilioMessagingConfig()) {
  return Boolean(config.accountSid && config.authToken && (config.messagingServiceSid || config.fromNumber));
}

function getTwilioClient() {
  const config = getTwilioMessagingConfig();
  if (!isTwilioConfigured(config)) {
    return null;
  }

  const cacheKey = `${config.accountSid}:${config.authToken}`;
  if (!cachedTwilioClient || cachedTwilioClientKey !== cacheKey) {
    cachedTwilioClient = twilio(config.accountSid, config.authToken);
    cachedTwilioClientKey = cacheKey;
  }

  return cachedTwilioClient;
}

function personalizeSmsBody(body, recipient = {}, senderName = '') {
  const name = String(recipient.name || '').trim();
  const firstName = name ? name.split(/\s+/)[0] : 'there';
  const area = String(recipient.area || recipient.market || '').trim() || 'your market';
  const sender = String(senderName || '').trim() || 'FAST BRIDGE GROUP';

  return String(body || '')
    .replace(/\[(agent\s+first\s+name|first\s+name|name)\]/gi, firstName)
    .replace(/\[(your\s+name)\]/gi, sender)
    .replace(/\[(area|market)\]/gi, area)
    .trim();
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
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          store: false,
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: systemPrompt
                }
              ]
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: String(question || '').slice(0, 4000)
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        lastError = `OpenAI request failed (${response.status}): ${detail.slice(0, 300)}`;
        continue;
      }

      const payload = await response.json();
      const answer = extractOpenAiResponseText(payload);
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
      syncSteveAdminAccount();
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

  db.run(`
    CREATE TABLE IF NOT EXISTS smtp_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      requester_name TEXT,
      requester_email TEXT,
      smtp_user TEXT NOT NULL,
      smtp_pass TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by_user_id INTEGER,
      reviewed_by_name TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating smtp_requests table:', err);
    } else {
      console.log('SMTP requests table ready');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS property_assignments (
      property_key TEXT PRIMARY KEY,
      property_address TEXT,
      assigned_to_key TEXT NOT NULL,
      assigned_to_email TEXT,
      assigned_to_name TEXT,
      assigned_by_key TEXT,
      assigned_by_email TEXT,
      assigned_by_name TEXT,
      assigned_at DATETIME NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating property_assignments table:', err);
    } else {
      console.log('Property assignments table ready');
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

function normalizeUserKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function normalizeAssignmentUser(userLike) {
  const email = normalizeKnownEmail(userLike?.email || '');
  const name = String(userLike?.name || '').trim() || email || 'User';
  const role = String(userLike?.role || '').trim().toLowerCase();
  const key = normalizeUserKey(userLike?.key || email || name) || 'default-user';

  return {
    key,
    name,
    email,
    role: isKnownAdminEmail(email) ? 'admin' : role
  };
}

function normalizePropertyAssignmentKey(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePropertyAssignmentRecord(propertyKey, assignmentLike, fallbackAssignedBy) {
  const normalizedPropertyKey = normalizePropertyAssignmentKey(propertyKey || assignmentLike?.propertyKey);
  if (!normalizedPropertyKey || !assignmentLike || typeof assignmentLike !== 'object') {
    return null;
  }

  const assignedTo = normalizeAssignmentUser(assignmentLike.assignedTo || {});
  if (!assignedTo.key) {
    return null;
  }

  const assignedBy = normalizeAssignmentUser(assignmentLike.assignedBy || fallbackAssignedBy || {});
  const assignedAtValue = String(assignmentLike.assignedAt || '').trim();
  const assignedAtDate = assignedAtValue ? new Date(assignedAtValue) : new Date();
  const assignedAt = Number.isNaN(assignedAtDate.getTime())
    ? new Date().toISOString()
    : assignedAtDate.toISOString();
  const propertyAddress = String(assignmentLike.propertyAddress || assignmentLike.propertySnapshot?.address || 'Property').trim() || 'Property';
  const propertySnapshot = assignmentLike.propertySnapshot && typeof assignmentLike.propertySnapshot === 'object'
    ? assignmentLike.propertySnapshot
    : {};

  return {
    propertyKey: normalizedPropertyKey,
    propertyAddress,
    assignedTo,
    assignedBy,
    assignedAt,
    propertySnapshot
  };
}

function parsePropertyAssignmentRow(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(String(row.payload_json || '{}'));
    const normalized = normalizePropertyAssignmentRecord(row.property_key, parsedPayload);
    if (normalized) {
      return normalized;
    }
  } catch (error) {
    // Fall through to the row-based fallback.
  }

  return normalizePropertyAssignmentRecord(row.property_key, {
    propertyKey: row.property_key,
    propertyAddress: row.property_address,
    assignedTo: {
      key: row.assigned_to_key,
      email: row.assigned_to_email,
      name: row.assigned_to_name
    },
    assignedBy: {
      key: row.assigned_by_key,
      email: row.assigned_by_email,
      name: row.assigned_by_name
    },
    assignedAt: row.assigned_at,
    propertySnapshot: {}
  });
}

async function syncIsaacAdminAccount() {
  const canonicalEmail = CANONICAL_ISAAC_EMAIL;
  const legacyEmails = ['isaacs.hesed@gmail.com', 'isaacs.hesed@fastbridgegroup.com'];
  const canonicalName = 'ISAAC HARO';
  const canonicalPassword = '315598';

  try {
    const account = await dbGet(
      `SELECT * FROM users
       WHERE LOWER(email) IN (?, ?, ?)
          OR LOWER(name) = LOWER(?)
       ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END, id ASC`,
      [canonicalEmail, legacyEmails[0], legacyEmails[1], canonicalName, canonicalEmail]
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

async function syncSteveAdminAccount() {
  const canonicalEmail = CANONICAL_STEVE_EMAIL;
  const legacyEmails = ['medinafbg@gmail.com', 'medinastj@gmail.com'];
  const canonicalName = 'Steve Medina';
  const canonicalPassword = CANONICAL_STEVE_PASSWORD;

  try {
    const account = await dbGet(
      `SELECT * FROM users
       WHERE LOWER(email) IN (?, ?, ?)
          OR LOWER(name) = LOWER(?)
       ORDER BY CASE WHEN LOWER(email) = ? THEN 0 WHEN LOWER(email) = ? THEN 1 WHEN LOWER(email) = ? THEN 2 ELSE 3 END, id ASC`,
      [canonicalEmail, legacyEmails[0], legacyEmails[1], canonicalName, canonicalEmail, legacyEmails[0], legacyEmails[1]]
    );

    const hash = await bcrypt.hash(canonicalPassword, 10);

    if (!account) {
      await dbRun(
        'INSERT INTO users (name, email, password_hash, role, smtp_user) VALUES (?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, 'admin', canonicalEmail]
      );
      console.log('Steve admin account created/synced');
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

    console.log('Steve admin account synced');
  } catch (error) {
    console.error('Failed to sync Steve admin account:', error);
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

function normalizeAdminECardMatchValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\(admin\)/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getAdminECardOwnerName(folderName) {
  return String(folderName || '')
    .replace(/\(admin\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatAdminECardLabel(ownerName) {
  const normalizedOwnerName = String(ownerName || '').trim();
  return normalizedOwnerName ? `${normalizedOwnerName}'s E-Card` : 'E-Card';
}

const ADMIN_ECARD_ROOT = path.resolve(__dirname, 'USERS');

function listAdminECardImageCandidates(folderPath, relativeSegments = []) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  return fs.readdirSync(folderPath, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(folderPath, entry.name);
      const nextRelativeSegments = [...relativeSegments, entry.name];

      if (entry.isDirectory()) {
        return listAdminECardImageCandidates(entryPath, nextRelativeSegments);
      }

      if (!entry.isFile()) {
        return [];
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
        return [];
      }

      const relativePath = nextRelativeSegments.join('/');
      if (!/e\s*-?\s*card/i.test(relativePath)) {
        return [];
      }

      return [{
        fileName: entry.name,
        relativePath,
        depth: nextRelativeSegments.length,
        nestedECardFolder: relativeSegments.some((segment) => /e\s*-?\s*card/i.test(segment))
      }];
    });
}

function listAdminECardFiles() {
  if (!fs.existsSync(ADMIN_ECARD_ROOT)) {
    return [];
  }

  return fs.readdirSync(ADMIN_ECARD_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /\(admin\)$/i.test(entry.name))
    .map((entry) => {
      const folderName = entry.name;
      const folderPath = path.join(ADMIN_ECARD_ROOT, folderName);
      const files = listAdminECardImageCandidates(folderPath)
        .sort((left, right) => {
          const leftUpdatedPriority = /updated/i.test(left.relativePath) ? 0 : 1;
          const rightUpdatedPriority = /updated/i.test(right.relativePath) ? 0 : 1;
          if (leftUpdatedPriority !== rightUpdatedPriority) {
            return leftUpdatedPriority - rightUpdatedPriority;
          }

          const leftNestedPriority = left.nestedECardFolder ? 0 : 1;
          const rightNestedPriority = right.nestedECardFolder ? 0 : 1;
          if (leftNestedPriority !== rightNestedPriority) {
            return leftNestedPriority - rightNestedPriority;
          }

          if (left.depth !== right.depth) {
            return right.depth - left.depth;
          }

          const leftPriority = /updated/i.test(left.fileName) ? 0 : 1;
          const rightPriority = /updated/i.test(right.fileName) ? 0 : 1;
          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

          return left.relativePath.localeCompare(right.relativePath);
        });

      if (files.length === 0) {
        return null;
      }

      const selectedFile = files[0];
      const relativePath = `USERS/${folderName}/${selectedFile.relativePath}`.replace(/\\/g, '/');
      const ownerName = getAdminECardOwnerName(folderName);
      return {
        folderName,
        ownerName,
        label: formatAdminECardLabel(ownerName),
        fileName: selectedFile.fileName,
        relativePath,
        normalizedFolderName: normalizeAdminECardMatchValue(folderName),
        normalizedFileName: normalizeAdminECardMatchValue(selectedFile.fileName)
      };
    })
    .filter(Boolean);
}

function resolveUserAdminECardRelativePath({ name, email }) {
  const candidates = listAdminECardFiles();
  if (candidates.length === 0) {
    return '';
  }

  const normalizedName = normalizeAdminECardMatchValue(name);
  const normalizedEmailLocalPart = normalizeAdminECardMatchValue(String(email || '').split('@')[0]);
  const matchTokens = [normalizedName, normalizedEmailLocalPart].filter(Boolean);

  for (const token of matchTokens) {
    const exactFolderMatch = candidates.find((entry) => entry.normalizedFolderName === token);
    if (exactFolderMatch) {
      return exactFolderMatch.relativePath;
    }
  }

  for (const token of matchTokens) {
    const partialFolderMatch = candidates.find((entry) => entry.normalizedFolderName.includes(token) || token.includes(entry.normalizedFolderName));
    if (partialFolderMatch) {
      return partialFolderMatch.relativePath;
    }
  }

  for (const token of matchTokens) {
    const fileMatch = candidates.find((entry) => entry.normalizedFileName.includes(token) || token.includes(entry.normalizedFileName));
    if (fileMatch) {
      return fileMatch.relativePath;
    }
  }

  return '';
}

const INVESTOR_ATTACHMENTS_ROOT = path.resolve(__dirname, 'Investors Attatchments');
const AGENT_WORKSPACE_UPLOADS_ROOT = path.resolve(__dirname, 'AGENT_WORKSPACE_UPLOADS');
const AGENT_WORKSPACE_DOCUMENT_CATEGORIES = Object.freeze({
  'executed-contracts': 'Executed Contracts',
  'wire-instructions': 'Wire Instructions',
  disclosures: 'Disclosures',
  'assignment-agreements': 'Assignment Agreement',
  invoices: 'Invoices'
});

function isAllowedInvestorAttachmentExtension(extension) {
  return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.png', '.jpg', '.jpeg', '.txt'].includes(String(extension || '').toLowerCase());
}

function isAllowedAgentWorkspaceDocumentExtension(extension) {
  return isAllowedInvestorAttachmentExtension(extension);
}

function sanitizeAgentWorkspaceSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[. ]+$/g, '')
    .slice(0, 120) || 'item';
}

function getAgentWorkspaceCategoryLabel(category) {
  return AGENT_WORKSPACE_DOCUMENT_CATEGORIES[String(category || '').trim().toLowerCase()] || '';
}

function getAgentWorkspaceUserFolder(decoded) {
  const userId = Number(decoded?.id) || 0;
  const displaySeed = String(decoded?.name || decoded?.email || `user-${userId}`).trim();
  const displaySlug = sanitizeAgentWorkspaceSegment(displaySeed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `user-${userId}`;

  return `user-${userId}-${displaySlug}`;
}

function getAgentWorkspaceUserRoot(decoded) {
  return path.join(AGENT_WORKSPACE_UPLOADS_ROOT, getAgentWorkspaceUserFolder(decoded));
}

function buildAgentWorkspaceStoredFileName(documentId, originalName) {
  const extension = path.extname(String(originalName || '')).toLowerCase();
  const baseName = path.basename(String(originalName || 'document'), extension);
  const safeBaseName = sanitizeAgentWorkspaceSegment(baseName)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase() || 'document';
  const safeExtension = isAllowedAgentWorkspaceDocumentExtension(extension) ? extension : '';
  return `${documentId}__${safeBaseName}${safeExtension}`;
}

function parseAgentWorkspaceStoredFileName(fileName) {
  const normalized = String(fileName || '').trim();
  const separatorIndex = normalized.indexOf('__');
  if (separatorIndex <= 0) {
    return null;
  }

  const id = normalized.slice(0, separatorIndex);
  const originalName = normalized.slice(separatorIndex + 2);
  if (!id || !originalName) {
    return null;
  }

  return {
    id,
    fileName: originalName
  };
}

function listAgentWorkspaceDocumentsForUser(decoded) {
  const userRoot = getAgentWorkspaceUserRoot(decoded);
  if (!fs.existsSync(userRoot)) {
    return [];
  }

  return Object.entries(AGENT_WORKSPACE_DOCUMENT_CATEGORIES)
    .flatMap(([category, label]) => {
      const categoryRoot = path.join(userRoot, category);
      if (!fs.existsSync(categoryRoot)) {
        return [];
      }

      return fs.readdirSync(categoryRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => {
          const parsed = parseAgentWorkspaceStoredFileName(entry.name);
          if (!parsed) {
            return null;
          }

          const absolutePath = path.join(categoryRoot, entry.name);
          const extension = path.extname(parsed.fileName).toLowerCase();
          if (!isAllowedAgentWorkspaceDocumentExtension(extension)) {
            return null;
          }

          const stats = fs.statSync(absolutePath);
          return {
            id: parsed.id,
            category,
            categoryLabel: label,
            fileName: parsed.fileName,
            fileSize: stats.size,
            fileType: extension || 'file',
            createdAt: stats.birthtimeMs || stats.mtimeMs || Date.now(),
            updatedAt: stats.mtimeMs || stats.birthtimeMs || Date.now()
          };
        })
        .filter(Boolean);
    })
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
}

function findAgentWorkspaceDocumentForUser(decoded, documentId) {
  const normalizedId = String(documentId || '').trim();
  if (!normalizedId) {
    return null;
  }

  const userRoot = getAgentWorkspaceUserRoot(decoded);
  if (!fs.existsSync(userRoot)) {
    return null;
  }

  for (const [category, label] of Object.entries(AGENT_WORKSPACE_DOCUMENT_CATEGORIES)) {
    const categoryRoot = path.join(userRoot, category);
    if (!fs.existsSync(categoryRoot)) {
      continue;
    }

    const matchedEntry = fs.readdirSync(categoryRoot, { withFileTypes: true })
      .find((entry) => entry.isFile() && entry.name.startsWith(`${normalizedId}__`));

    if (!matchedEntry) {
      continue;
    }

    const parsed = parseAgentWorkspaceStoredFileName(matchedEntry.name);
    if (!parsed) {
      continue;
    }

    const absolutePath = path.join(categoryRoot, matchedEntry.name);
    const stats = fs.statSync(absolutePath);
    return {
      id: parsed.id,
      category,
      categoryLabel: label,
      fileName: parsed.fileName,
      absolutePath,
      fileSize: stats.size,
      createdAt: stats.birthtimeMs || stats.mtimeMs || Date.now(),
      updatedAt: stats.mtimeMs || stats.birthtimeMs || Date.now()
    };
  }

  return null;
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

const INVESTOR_ATTACHMENT_PACKAGE_METADATA = {
  Brad: {
    label: 'Brad - Revive SO Cal LLC',
    offerProfile: {
      entityValue: 'revive-socal-llc',
      entityLabel: 'Revive SoCal LLC',
      signerName: 'Nick Battisto',
      recipientName: 'Brad',
      recipientEmail: 'brad@prophethomes.com',
      depositMode: 'flat-fee',
      depositAmount: '10000',
      closeEscrowDays: '21',
      closeEscrowNote: '21 days or sooner',
      offerType: 'cash',
      appraisal: 'no-appraisal-contingencies',
      inspectionPeriod: '7',
      termiteInspection: 'no-termite',
      escrowFees: 'buyer',
      titleFees: 'buyer',
      escrowCompany: 'Prominent Escrow',
      titleCompany: 'First Integrity Title',
      otherTermsSummary: 'Property to be delivered vacant. Buyer confirms vacancy before wiring funds and may fund with a non-contingent line of credit.',
      contingencySummary: '7 day physical inspection only. No loan, no appraisal, and no home warranty contingencies.',
      closingCostSummary: 'Buyer to pay seller\'s escrow and title traditional closing costs when buyer chooses providers; otherwise escrow/title to be split 50/50.',
      additionalTerms: [
        'Buyers are licensed real estate brokers/agents in multiple states, including CA.',
        'Buyers are investors who intend to purchase real estate and utilize all investment strategies for the subject property.',
        'Property to be delivered vacant.',
        'Buyer to confirm vacancy before wiring closing funds.',
        'Buyer may fund with a non-contingent line of credit.',
        'Buyer may pay invoices through escrow at buyers sole expense and approval.'
      ],
      customSections: [
        {
          heading: 'Escrow / Title Options',
          lines: [
            'Prominent Escrow: buyer to pay for seller\'s escrow and title traditional closing costs if buyer chooses providers; otherwise 50/50 split.',
            'First Integrity Title: buyer to pay for seller\'s escrow and title traditional closing costs if buyer chooses providers; otherwise 50/50 split.'
          ]
        }
      ],
      assignmentVerbiage: 'Buyers are licensed real estate brokers/agents in multiple states, including CA. Buyers are investors who intend to purchase real estate and utilize all investment strategies for the subject property. Property to be delivered vacant. Buyer to confirm vacancy before wiring closing funds. Buyer may fund with a non-contingent line of credit. Buyer may pay invoices through escrow at buyers sole expense and approval.'
    }
  }
};

function getInvestorAttachmentPackageMetadata(folderName) {
  const metadata = INVESTOR_ATTACHMENT_PACKAGE_METADATA[folderName];
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  return JSON.parse(JSON.stringify(metadata));
}

function listInvestorAttachmentPackages() {
  if (!fs.existsSync(INVESTOR_ATTACHMENTS_ROOT)) {
    return [];
  }

  return fs.readdirSync(INVESTOR_ATTACHMENTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folderName = entry.name;
      const metadata = getInvestorAttachmentPackageMetadata(folderName);
      const folderPath = path.join(INVESTOR_ATTACHMENTS_ROOT, folderName);
      const files = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter((fileEntry) => fileEntry.isFile() && isAllowedInvestorAttachmentExtension(path.extname(fileEntry.name)))
        .map((fileEntry) => ({
          name: fileEntry.name,
          relativePath: `Investors Attatchments/${folderName}/${fileEntry.name}`.replace(/\\/g, '/')
        }));

      return {
        folderName,
        label: metadata && metadata.label ? metadata.label : folderName,
        fileCount: files.length,
        files,
        offerProfile: metadata && metadata.offerProfile ? metadata.offerProfile : null
      };
    })
    .filter((entry) => entry.files.length > 0)
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function completeOAuthLogin({ email, name }) {
  const normalizedEmail = normalizeKnownEmail(email);
  if (!normalizedEmail) {
    throw new Error('OAuth provider did not return an email');
  }

  const normalizedName = String(name || '').trim() || normalizedEmail.split('@')[0] || 'User';
  const existingUser = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
  let userId = existingUser ? existingUser.id : null;
  let userRole = isKnownAdminEmail(normalizedEmail) ? 'admin' : (existingUser ? existingUser.role : 'user');

  if (!existingUser) {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const hash = await bcrypt.hash(randomPassword, 10);
    const insertResult = await dbRun(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [normalizedName, normalizedEmail, hash, userRole]
    );
    userId = insertResult.lastID;
  } else {
    await dbRun('UPDATE users SET name = ?, role = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?', [normalizedName, userRole, existingUser.id]);
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

  const normalizedEmail = normalizeKnownEmail(email);
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

  if (!['admin', 'user', 'broker'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Role must be admin, user, or broker' });
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
    model: OPENAI_MODEL,
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

  db.get('SELECT email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const effectiveSmtpConfig = resolveEffectiveSmtpConfig({
      email: row?.email || decoded.email,
      smtpUser: row?.smtp_user,
      smtpPass: row?.smtp_pass,
      smtpSignature: row?.smtp_signature
    });

    db.get(
      `SELECT id, smtp_user, status, created_at
       FROM smtp_requests
       WHERE user_id = ? AND status = 'pending'
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`,
      [decoded.id],
      (requestError, pendingRow) => {
        if (requestError) return res.status(500).json({ error: 'Database error' });

        return res.json({
          smtpUser: pendingRow?.smtp_user || effectiveSmtpConfig.smtpUser,
          hasPassword: effectiveSmtpConfig.hasPassword,
          smtpSignature: effectiveSmtpConfig.smtpSignature,
          pendingRequest: pendingRow ? {
            id: pendingRow.id,
            smtpUser: pendingRow.smtp_user,
            status: pendingRow.status,
            createdAt: pendingRow.created_at
          } : null
        });
      }
    );
  });
});

// POST /api/smtp-settings — submit Gmail SMTP settings for admin approval
app.post('/api/smtp-settings', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  const smtpUser = String(req.body?.smtpUser || '').trim().toLowerCase();
  const smtpPass = String(req.body?.smtpPass || '').trim();

  if (!smtpUser) return res.status(400).json({ error: 'Gmail address is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpUser)) return res.status(400).json({ error: 'Invalid Gmail address' });
  if (!smtpPass) return res.status(400).json({ error: 'App Password is required' });

  db.get(
    `SELECT id
     FROM smtp_requests
     WHERE user_id = ? AND status = 'pending'
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT 1`,
    [decoded.id],
    (selectError, row) => {
      if (selectError) return res.status(500).json({ error: 'Database error' });

      const requestName = String(decoded.name || '').trim();
      const requestEmail = String(decoded.email || '').trim().toLowerCase();

      if (row?.id) {
        db.run(
          `UPDATE smtp_requests
           SET requester_name = ?, requester_email = ?, smtp_user = ?, smtp_pass = ?, created_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [requestName, requestEmail, smtpUser, smtpPass, row.id],
          (updateError) => {
            if (updateError) return res.status(500).json({ error: 'Failed to submit Gmail approval request' });
            return res.json({ success: true, message: 'Gmail request updated and sent for admin approval.' });
          }
        );
        return;
      }

      db.run(
        'INSERT INTO smtp_requests (user_id, requester_name, requester_email, smtp_user, smtp_pass) VALUES (?, ?, ?, ?, ?)',
        [decoded.id, requestName, requestEmail, smtpUser, smtpPass],
        (insertError) => {
          if (insertError) return res.status(500).json({ error: 'Failed to submit Gmail approval request' });
          return res.json({ success: true, message: 'Gmail request submitted for admin approval.' });
        }
      );
    }
  );
});

app.get('/api/admin/smtp-requests', (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  db.all(
    `SELECT id, user_id, requester_name, requester_email, smtp_user, smtp_pass, status, created_at, reviewed_at, reviewed_by_name
     FROM smtp_requests
     ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, datetime(created_at) DESC, id DESC`,
    (err, rows) => {
      if (err) {
        console.error('Failed to load smtp requests:', err);
        return res.status(500).json({ error: 'Unable to load Gmail outbox requests.' });
      }

      return res.json({ requests: rows || [] });
    }
  );
});

app.post('/api/admin/smtp-requests/:id/approve', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const requestId = Number.parseInt(String(req.params?.id || ''), 10);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'Valid request id is required' });
  }

  try {
    const requestRow = await dbGet('SELECT * FROM smtp_requests WHERE id = ?', [requestId]);
    if (!requestRow) {
      return res.status(404).json({ error: 'Gmail request not found' });
    }

    if (String(requestRow.status || '').toLowerCase() !== 'pending') {
      return res.status(400).json({ error: 'Only pending Gmail requests can be approved' });
    }

    await dbRun(
      'UPDATE users SET smtp_user = ?, smtp_pass = ?, smtp_signature = COALESCE(smtp_signature, \'\') WHERE id = ?',
      [String(requestRow.smtp_user || '').trim().toLowerCase(), String(requestRow.smtp_pass || '').trim(), requestRow.user_id]
    );

    await dbRun(
      `UPDATE smtp_requests
       SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_user_id = ?, reviewed_by_name = ?
       WHERE id = ?`,
      [decoded.id, String(decoded.name || '').trim(), requestId]
    );

    return res.json({ success: true, message: 'Gmail outbox request approved.' });
  } catch (error) {
    console.error('Failed to approve smtp request:', error);
    return res.status(500).json({ error: 'Unable to approve Gmail outbox request.' });
  }
});

app.post('/api/admin/smtp-requests/:id/reject', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const requestId = Number.parseInt(String(req.params?.id || ''), 10);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'Valid request id is required' });
  }

  try {
    const requestRow = await dbGet('SELECT * FROM smtp_requests WHERE id = ?', [requestId]);
    if (!requestRow) {
      return res.status(404).json({ error: 'Gmail request not found' });
    }

    if (String(requestRow.status || '').toLowerCase() !== 'pending') {
      return res.status(400).json({ error: 'Only pending Gmail requests can be rejected' });
    }

    await dbRun(
      `UPDATE smtp_requests
       SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_user_id = ?, reviewed_by_name = ?
       WHERE id = ?`,
      [decoded.id, String(decoded.name || '').trim(), requestId]
    );

    return res.json({ success: true, message: 'Gmail outbox request rejected.' });
  } catch (error) {
    console.error('Failed to reject smtp request:', error);
    return res.status(500).json({ error: 'Unable to reject Gmail outbox request.' });
  }
});

// POST /api/test-smtp — sends a test email to verify the user's Gmail SMTP settings
app.post('/api/test-smtp', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  db.get('SELECT email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const effectiveSmtpConfig = resolveEffectiveSmtpConfig({
      email: row?.email || decoded.email,
      smtpUser: row?.smtp_user,
      smtpPass: row?.smtp_pass,
      smtpSignature: row?.smtp_signature
    });
    const smtpUser = effectiveSmtpConfig.smtpUser;
    const smtpPass = effectiveSmtpConfig.smtpPass;
    const smtpSignature = effectiveSmtpConfig.smtpSignature;

    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'No Gmail SMTP credentials are configured for your account. Save them in Profile or add the matching Render environment variables.' });
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

app.get('/api/admin-ecards', (req, res) => {
  try {
    const ecards = listAdminECardFiles().map((entry) => ({
      folderName: entry.folderName,
      ownerName: entry.ownerName,
      label: entry.label,
      fileName: entry.fileName,
      relativePath: entry.relativePath
    }));
    return res.json({ ecards });
  } catch (error) {
    console.error('Failed to list admin E-cards:', error);
    return res.status(500).json({ error: 'Failed to load E-card folders.' });
  }
});

app.get('/api/agent-workspace-documents', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    return res.json({ documents: listAgentWorkspaceDocumentsForUser(decoded) });
  } catch (error) {
    console.error('Failed to list Agent Workspace documents:', error);
    return res.status(500).json({ error: 'Failed to load Agent Workspace documents.' });
  }
});

app.post('/api/agent-workspace-documents', express.json({ limit: '20mb' }), (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const category = String(req.body?.category || '').trim().toLowerCase();
    const categoryLabel = getAgentWorkspaceCategoryLabel(category);
    const fileName = sanitizeAgentWorkspaceSegment(path.basename(String(req.body?.fileName || '').trim()));
    const contentBase64 = String(req.body?.contentBase64 || '').trim();

    if (!categoryLabel) {
      return res.status(400).json({ error: 'Select a valid Agent Workspace document type.' });
    }

    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'A file name and file content are required.' });
    }

    const extension = path.extname(fileName).toLowerCase();
    if (!isAllowedAgentWorkspaceDocumentExtension(extension)) {
      return res.status(400).json({ error: 'This file type is not allowed.' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ error: 'The uploaded file was empty.' });
    }

    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'Files must be 15 MB or smaller.' });
    }

    const documentId = crypto.randomUUID();
    const userRoot = getAgentWorkspaceUserRoot(decoded);
    const categoryRoot = path.join(userRoot, category);
    fs.mkdirSync(categoryRoot, { recursive: true });

    const storedFileName = buildAgentWorkspaceStoredFileName(documentId, fileName);
    const absolutePath = path.join(categoryRoot, storedFileName);
    fs.writeFileSync(absolutePath, buffer);
    const stats = fs.statSync(absolutePath);

    return res.status(201).json({
      document: {
        id: documentId,
        category,
        categoryLabel,
        fileName,
        fileSize: stats.size,
        fileType: extension || 'file',
        createdAt: stats.birthtimeMs || stats.mtimeMs || Date.now(),
        updatedAt: stats.mtimeMs || stats.birthtimeMs || Date.now()
      }
    });
  } catch (error) {
    console.error('Failed to save Agent Workspace document:', error);
    return res.status(500).json({ error: 'Failed to save the uploaded file.' });
  }
});

app.get('/api/agent-workspace-documents/:documentId/content', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const documentItem = findAgentWorkspaceDocumentForUser(decoded, req.params.documentId);
    if (!documentItem) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const download = String(req.query?.download || '').trim() === '1';
    const extension = path.extname(documentItem.fileName).toLowerCase();
    const contentType = extension === '.pdf'
      ? 'application/pdf'
      : extension === '.doc'
        ? 'application/msword'
        : extension === '.docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : extension === '.xls'
            ? 'application/vnd.ms-excel'
            : extension === '.xlsx'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : extension === '.csv'
                ? 'text/csv'
                : extension === '.png'
                  ? 'image/png'
                  : ['.jpg', '.jpeg'].includes(extension)
                    ? 'image/jpeg'
                    : extension === '.txt'
                      ? 'text/plain; charset=utf-8'
                      : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${documentItem.fileName.replace(/"/g, '')}"`
    );
    return fs.createReadStream(documentItem.absolutePath).pipe(res);
  } catch (error) {
    console.error('Failed to stream Agent Workspace document:', error);
    return res.status(500).json({ error: 'Failed to open the requested file.' });
  }
});

app.delete('/api/agent-workspace-documents/:documentId', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const documentItem = findAgentWorkspaceDocumentForUser(decoded, req.params.documentId);
    if (!documentItem) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    fs.unlinkSync(documentItem.absolutePath);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Agent Workspace document:', error);
    return res.status(500).json({ error: 'Failed to delete the selected file.' });
  }
});

app.get('/api/twilio/status', (req, res) => {
  const config = getTwilioMessagingConfig();

  return res.json({
    configured: isTwilioConfigured(config),
    fromNumberMasked: maskPhoneNumber(config.fromNumber),
    messagingServiceSidConfigured: Boolean(config.messagingServiceSid),
    mode: config.messagingServiceSid ? 'messaging-service' : (config.fromNumber ? 'phone-number' : 'unconfigured')
  });
});

app.post('/api/twilio/send-sms', async (req, res) => {
  const config = getTwilioMessagingConfig();
  if (!isTwilioConfigured(config)) {
    return res.status(400).json({ error: 'Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID.' });
  }

  const body = String(req.body?.body || '').trim();
  const campaignName = String(req.body?.campaignName || 'Untitled SMS Campaign').trim();
  const providedRecipients = Array.isArray(req.body?.recipients) ? req.body.recipients : [];

  if (!body) {
    return res.status(400).json({ error: 'SMS body is required.' });
  }

  if (providedRecipients.length === 0) {
    return res.status(400).json({ error: 'At least one recipient is required.' });
  }

  let senderName = String(req.body?.senderName || '').trim();
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!senderName && token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      senderName = String(decoded?.name || '').trim();
    } catch (error) {
      // Ignore invalid token and continue without a sender name.
    }
  }

  const client = getTwilioClient();
  if (!client) {
    return res.status(500).json({ error: 'Twilio client could not be initialized.' });
  }

  const sent = [];
  const failed = [];

  for (const entry of providedRecipients) {
    const recipient = typeof entry === 'string'
      ? { phone: entry }
      : {
          name: String(entry?.name || '').trim(),
          phone: String(entry?.phone || '').trim(),
          area: String(entry?.area || entry?.market || '').trim()
        };

    const normalizedPhone = normalizeSmsPhone(recipient.phone);
    if (!normalizedPhone) {
      failed.push({
        name: recipient.name || '',
        phone: recipient.phone || '',
        error: 'Invalid phone number'
      });
      continue;
    }

    const personalizedBody = personalizeSmsBody(body, recipient, senderName).slice(0, 1600);

    try {
      const payload = {
        body: personalizedBody,
        to: normalizedPhone
      };

      if (config.messagingServiceSid) {
        payload.messagingServiceSid = config.messagingServiceSid;
      } else {
        payload.from = config.fromNumber;
      }

      const message = await client.messages.create(payload);
      sent.push({
        name: recipient.name || '',
        phone: normalizedPhone,
        sid: message.sid,
        status: message.status || 'queued'
      });
    } catch (error) {
      failed.push({
        name: recipient.name || '',
        phone: normalizedPhone,
        error: error.message || 'Twilio send failed'
      });
    }
  }

  if (sent.length === 0) {
    return res.status(500).json({ error: 'No messages were sent.', failed, campaignName });
  }

  return res.json({
    success: true,
    campaignName,
    message: `Queued ${sent.length} message(s).`,
    sent,
    failed
  });
});

app.post('/api/send-agent-email', async (req, res) => {
  const fromName = String(req.body?.fromName || '').trim();
  const fromEmail = String(req.body?.fromEmail || '').trim();
  const toName = String(req.body?.toName || '').trim();
  const toEmail = String(req.body?.toEmail || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  const htmlBody = String(req.body?.htmlBody || '').trim();
  const includeECard = Boolean(req.body?.includeECard);
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
  let authenticatedUser = null;
  let smtpUser;
  let smtpPass;
  let smtpSignature = '';
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const row = await new Promise((resolve, reject) => {
        db.get('SELECT name, email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id], (err, r) => {
          if (err) reject(err); else resolve(r);
        });
      });
      authenticatedUser = row || null;
      const effectiveSmtpConfig = resolveEffectiveSmtpConfig({
        email: row?.email || decoded.email,
        smtpUser: row?.smtp_user,
        smtpPass: row?.smtp_pass,
        smtpSignature: row?.smtp_signature
      });
      smtpUser = effectiveSmtpConfig.smtpUser;
      smtpPass = effectiveSmtpConfig.smtpPass;
      smtpSignature = effectiveSmtpConfig.smtpSignature;
    } catch (e) {
      // Invalid token or DB failure — proceed with env fallback
    }
  }

  const fallbackECardRelativePath = includeECard
    ? resolveUserAdminECardRelativePath({
        name: authenticatedUser?.name || fromName,
        email: authenticatedUser?.email || fromEmail
      })
    : '';
  const resolvedECardPath = ecardPath
    ? resolveWorkspaceAssetPath(ecardPath)
    : (fallbackECardRelativePath ? resolveWorkspaceAssetPath(fallbackECardRelativePath) : '');

  if (includeECard && !resolvedECardPath) {
    return res.status(400).json({ error: 'Your admin folder E-card image was not found.' });
  }
  if (ecardPath && !resolvedECardPath) {
    return res.status(400).json({ error: 'Selected E-card image was not found.' });
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

app.get('/api/property-assignments', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  db.all(
    `SELECT property_key, property_address, assigned_to_key, assigned_to_email, assigned_to_name,
            assigned_by_key, assigned_by_email, assigned_by_name, assigned_at, payload_json
     FROM property_assignments`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const assignments = {};
      (rows || []).forEach((row) => {
        const record = parsePropertyAssignmentRow(row);
        if (record && record.propertyKey) {
          assignments[record.propertyKey] = record;
        }
      });

      return res.json({ assignments });
    }
  );
});

app.post('/api/property-assignments', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const propertyKey = normalizePropertyAssignmentKey(req.body?.propertyKey || req.body?.assignment?.propertyKey);
  if (!propertyKey) {
    return res.status(400).json({ error: 'Property key is required' });
  }

  const assignment = req.body?.assignment;

  if (assignment == null) {
    try {
      await dbRun('DELETE FROM property_assignments WHERE property_key = ?', [propertyKey]);
      return res.json({ success: true, propertyKey, assignment: null });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to remove property assignment' });
    }
  }

  const normalizedRecord = normalizePropertyAssignmentRecord(propertyKey, assignment, decoded);
  if (!normalizedRecord) {
    return res.status(400).json({ error: 'Valid assignment details are required' });
  }

  try {
    await dbRun(
      `INSERT INTO property_assignments (
          property_key,
          property_address,
          assigned_to_key,
          assigned_to_email,
          assigned_to_name,
          assigned_by_key,
          assigned_by_email,
          assigned_by_name,
          assigned_at,
          payload_json,
          updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(property_key) DO UPDATE SET
          property_address = excluded.property_address,
          assigned_to_key = excluded.assigned_to_key,
          assigned_to_email = excluded.assigned_to_email,
          assigned_to_name = excluded.assigned_to_name,
          assigned_by_key = excluded.assigned_by_key,
          assigned_by_email = excluded.assigned_by_email,
          assigned_by_name = excluded.assigned_by_name,
          assigned_at = excluded.assigned_at,
          payload_json = excluded.payload_json,
          updated_at = CURRENT_TIMESTAMP`,
      [
        normalizedRecord.propertyKey,
        normalizedRecord.propertyAddress,
        normalizedRecord.assignedTo.key,
        normalizedRecord.assignedTo.email,
        normalizedRecord.assignedTo.name,
        normalizedRecord.assignedBy.key,
        normalizedRecord.assignedBy.email,
        normalizedRecord.assignedBy.name,
        normalizedRecord.assignedAt,
        JSON.stringify(normalizedRecord)
      ]
    );

    return res.json({
      success: true,
      propertyKey: normalizedRecord.propertyKey,
      assignment: normalizedRecord
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save property assignment' });
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
