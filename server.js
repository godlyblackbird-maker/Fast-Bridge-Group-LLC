// ...existing code...
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const twilio = require('twilio');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

let PostgresPool = null;
try {
  ({ Pool: PostgresPool } = require('pg'));
} catch (error) {
  PostgresPool = null;
}

require('dotenv').config();

const { sendNewLeadEmail, sendAgentEmail } = require('./sendEmail.js/sendEmail');

const app = express();
app.set('trust proxy', true);
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
const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_test_51TDU29Q3MV5dyF2TauLp1mMkQukSL6PbAlgHN9zzm5fH9lzZsQIHN4iOTjh1Vu1eAsyOKGZ6bXSIANej5zS9XA2p00cn6NJsZL';
const STRIPE_PUBLISHABLE_KEY = String(process.env.STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE_PUBLISHABLE_KEY).trim();
const GOOGLE_MAPS_API_KEY = getFirstConfiguredEnvValue('GOOGLE_MAPS_API_KEY', 'GOOGLE_BROWSER_MAPS_API_KEY');
const GOOGLE_MAPS_MAP_ID = getFirstConfiguredEnvValue('GOOGLE_MAPS_MAP_ID', 'GOOGLE_MAP_ID');
const GOOGLE_EARTH_FALLBACK_MAP_ID = 'DEMO_MAP_ID';
const PREMIUM_USER_ROLE = 'premium user';
const TEST_USER_ROLE = 'test user';
const PREMIUM_PLAN_KEY = 'premium';
const PREMIUM_PRICE_CENTS = 9900;
const PREMIUM_CURRENCY = 'USD';
const FEATURE_ACCESS_SETTING_KEY = 'nav-feature-access';
const ANNOUNCEMENT_SETTING_KEY = 'dashboard-announcement';
const FEATURE_ACCESS_ROLE_KEYS = ['admin', 'user', PREMIUM_USER_ROLE, 'broker', TEST_USER_ROLE];
const FEATURE_ACCESS_DEFAULTS = Object.freeze({
  activeBuyers: Object.freeze({
    key: 'activeBuyers',
    label: 'Active Buyers',
    path: '/active-buyers.html',
    roles: Object.freeze({
      admin: true,
      user: false,
      [PREMIUM_USER_ROLE]: false,
      broker: false,
      [TEST_USER_ROLE]: false
    })
  }),
  analytics: Object.freeze({
    key: 'analytics',
    label: 'Analytics',
    path: '/analytics.html',
    roles: Object.freeze({
      admin: true,
      user: false,
      [PREMIUM_USER_ROLE]: true,
      broker: true,
      [TEST_USER_ROLE]: true
    })
  }),
  campaigns: Object.freeze({
    key: 'campaigns',
    label: 'Campaigns',
    path: '/campaigns.html',
    roles: Object.freeze({
      admin: true,
      user: false,
      [PREMIUM_USER_ROLE]: true,
      broker: true,
      [TEST_USER_ROLE]: true
    })
  }),
  mlsSpreadsheet: Object.freeze({
    key: 'mlsSpreadsheet',
    label: 'MLS Spreadsheet',
    path: '/mls-imports-spreadsheet.html',
    roles: Object.freeze({
      admin: true,
      user: false,
      [PREMIUM_USER_ROLE]: true,
      broker: true,
      [TEST_USER_ROLE]: false
    })
  })
});
const AUTH_SESSION_TTL = '24h';
const TWO_FACTOR_CHALLENGE_TTL = '10m';
const ONLINE_USER_ACTIVITY_WINDOW_MINUTES = 5;
const TOTP_WINDOW = 1;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DATABASE_FILENAME = 'database.db';
const MESSAGE_POSTGRES_DEFAULT_POOL_SIZE = 10;
const SQLITE_BACKUP_TEMP_DIR = path.join(__dirname, 'temp', 'sqlite-backups');
const SQLITE_BACKUP_DEFAULT_INTERVAL_HOURS = 12;
const SQLITE_BACKUP_INTERVAL_HOURS = Math.max(1, Number.parseInt(String(process.env.SQLITE_BACKUP_INTERVAL_HOURS || SQLITE_BACKUP_DEFAULT_INTERVAL_HOURS), 10) || SQLITE_BACKUP_DEFAULT_INTERVAL_HOURS);
const SQLITE_BACKUP_INTERVAL_MS = SQLITE_BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;
const SQLITE_BACKUP_STARTUP_DELAY_MS = Math.max(15 * 1000, Number.parseInt(String(process.env.SQLITE_BACKUP_STARTUP_DELAY_MS || 2 * 60 * 1000), 10) || (2 * 60 * 1000));
const SQLITE_BACKUP_S3_PREFIX = String(process.env.SQLITE_BACKUP_S3_PREFIX || 'database-backups/sqlite').trim().replace(/\/+$/g, '');
const MLS_IMPORT_PDF_BODY_LIMIT = '260mb';
const MLS_IMPORT_PDF_MAX_BYTES = 180 * 1024 * 1024;
const MLS_IMPORT_PDF_PAGE_BATCH_SIZE = 40;
const MLS_IMPORT_PDF_JOB_TTL_MS = 2 * 60 * 60 * 1000;
const MLS_IMPORT_PDF_WORKER_TIMEOUT_MS = 90 * 60 * 1000;
const MLS_IMPORT_TEMP_DIR = path.join(__dirname, 'temp', 'mls-imports');
const USER_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
const USER_UPLOADS_LOCAL_ROOT = path.join(__dirname, 'USER_UPLOADS');

let cachedOpenAiApiKey = null;
let cachedTwilioClient = null;
let cachedTwilioClientKey = '';
let cachedS3Client = null;
let cachedS3ClientKey = '';
let userMessageStorePool = null;
let latestUserMessageStoreHealth = {
  configured: false,
  available: false,
  dialect: 'sqlite',
  checkedAt: null,
  reason: 'PostgreSQL message store is not configured.'
};
let latestS3ArchiveHealth = null;
let latestSqliteBackupHealth = null;
let sqliteBackupTimer = null;
let sqliteBackupInFlight = null;
const USER_MESSAGE_EDIT_WINDOW_MS = 60 * 1000;
const revokedSessionIds = new Set();
const mlsImportPdfJobs = new Map();
const mlsImportSpreadsheetClearedAtByUser = new Map();
const twilioVoicePresence = new Map();
const communityVoiceRooms = new Map();
const TWILIO_VOICE_TOKEN_TTL_SECONDS = 60 * 60;
const TWILIO_VOICE_PRESENCE_WINDOW_MS = 75 * 1000;
const COMMUNITY_VOICE_PARTICIPANT_TTL_MS = 70 * 1000;
const COMMUNITY_VOICE_SIGNAL_TTL_MS = 2 * 60 * 1000;

fs.mkdirSync(MLS_IMPORT_TEMP_DIR, { recursive: true });
fs.mkdirSync(SQLITE_BACKUP_TEMP_DIR, { recursive: true });

const mlsImportPdfUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, MLS_IMPORT_TEMP_DIR);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(String(file && file.originalname || '')).toLowerCase() || '.pdf';
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: {
    fileSize: MLS_IMPORT_PDF_MAX_BYTES
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(String(file && file.originalname || '')).toLowerCase();
    if (extension !== '.pdf') {
      callback(new Error('Only PDF files are supported in this import tool.'));
      return;
    }
    callback(null, true);
  }
});

const userUploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: USER_UPLOAD_MAX_BYTES
  }
});

const CANONICAL_ISAAC_EMAIL = 'isaac.haro@fastbridgegroupllc.com';
const CANONICAL_STEVE_EMAIL = 'steve.medina@fastbridgegroupllc.com';
const CANONICAL_STEVE_PASSWORD = 'stevemedina';
const LEGACY_EMAIL_ALIASES = new Map([
  ['isaacs.hesed@gmail.com', CANONICAL_ISAAC_EMAIL],
  ['isaacs.hesed@fastbridgegroup.com', CANONICAL_ISAAC_EMAIL],
  ['medinafbg@gmail.com', CANONICAL_STEVE_EMAIL],
  ['medinastj@gmail.com', CANONICAL_STEVE_EMAIL]
]);
const CANONICAL_LORIA_EMAIL = normalizeKnownEmail(getFirstConfiguredEnvValue('LORIA_BROKER_EMAIL') || 'loria.rigby@fastbridgegroupllc.com');
const CANONICAL_LORIA_PASSWORD = String(process.env.LORIA_BROKER_PASSWORD || 'Password123').trim() || 'Password123';
const CANONICAL_LORIA_NAME = String(process.env.LORIA_BROKER_NAME || 'Loria Rigby').trim() || 'Loria Rigby';
const CANONICAL_STEVEN_CASTILLO_EMAIL = normalizeKnownEmail(getFirstConfiguredEnvValue('STEVEN_CASTILLO_EMAIL') || 'steve.castillo@fastbridgegroupllc.com');
const CANONICAL_STEVEN_CASTILLO_PASSWORD = String(process.env.STEVEN_CASTILLO_PASSWORD || 'Password123').trim() || 'Password123';
const CANONICAL_STEVEN_CASTILLO_NAME = String(process.env.STEVEN_CASTILLO_NAME || 'Steven Castillo').trim() || 'Steven Castillo';
const CANONICAL_TEST_EMAIL = 'test@fastbridgegroupllc.com';
const CANONICAL_TEST_PASSWORD = 'subzero';
const CANONICAL_TEST_NAME = 'Test';
const SUPPRESSED_ACCOUNT_MATCHERS = Object.freeze([
  'dontifyouthink',
  'black bird',
  'blackbird'
]);
const ADMIN_CANONICAL_EMAILS = new Set([
  CANONICAL_ISAAC_EMAIL,
  CANONICAL_STEVE_EMAIL
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

function sanitizeCommunityVoiceRoomName(value) {
  const normalized = String(value || 'community-voice-lounge')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.slice(0, 64) || 'community-voice-lounge';
}

function getCommunityVoiceRoom(roomName, createIfMissing = false) {
  const normalizedRoom = sanitizeCommunityVoiceRoomName(roomName);
  let roomState = communityVoiceRooms.get(normalizedRoom) || null;
  if (!roomState && createIfMissing) {
    roomState = {
      room: normalizedRoom,
      participants: [],
      signals: [],
      nextSignalId: 1
    };
    communityVoiceRooms.set(normalizedRoom, roomState);
  }
  return roomState;
}

function serializeCommunityVoiceParticipant(participant) {
  return {
    id: participant.id,
    clientId: participant.clientId,
    name: participant.name,
    role: participant.role,
    joinedAt: participant.joinedAt,
    lastSeenAt: participant.lastSeenAt
  };
}

function pruneCommunityVoiceRoom(roomName, roomState = null) {
  const normalizedRoom = sanitizeCommunityVoiceRoomName(roomName);
  const state = roomState || communityVoiceRooms.get(normalizedRoom);
  if (!state) {
    return null;
  }

  const now = Date.now();
  state.participants = state.participants.filter((participant) => now - Number(participant.lastSeenAt || 0) <= COMMUNITY_VOICE_PARTICIPANT_TTL_MS);

  const activeParticipantIds = new Set(state.participants.map((participant) => participant.id));
  state.signals = state.signals.filter((signal) => {
    if (now - Number(signal.createdAt || 0) > COMMUNITY_VOICE_SIGNAL_TTL_MS) {
      return false;
    }
    return activeParticipantIds.has(signal.fromParticipantId) && activeParticipantIds.has(signal.toParticipantId);
  });

  if (state.participants.length === 0 && state.signals.length === 0) {
    communityVoiceRooms.delete(normalizedRoom);
    return null;
  }

  return state;
}

function normalizeDocuSignPrivateKey(value) {
  return String(value || '')
    .trim()
    .replace(/\r/g, '')
    .replace(/\\n/g, '\n');
}

function getDocuSignConfig() {
  return {
    authServer: getFirstConfiguredEnvValue('DOCUSIGN_AUTH_SERVER', 'DOCUSIGN_OAUTH_HOST') || 'account-d.docusign.com',
    clientId: getFirstConfiguredEnvValue('DOCUSIGN_CLIENT_ID', 'DOCUSIGN_INTEGRATION_KEY'),
    userId: getFirstConfiguredEnvValue('DOCUSIGN_USER_ID'),
    accountId: getFirstConfiguredEnvValue('DOCUSIGN_ACCOUNT_ID'),
    templateId: getFirstConfiguredEnvValue('DOCUSIGN_TEMPLATE_ID', 'DOCUSIGN_PURCHASE_TEMPLATE_ID'),
    redirectUri: getFirstConfiguredEnvValue('DOCUSIGN_REDIRECT_URI'),
    privateKey: normalizeDocuSignPrivateKey(
      getFirstConfiguredEnvValue('DOCUSIGN_PRIVATE_KEY', 'DOCUSIGN_RSA_PRIVATE_KEY', 'DOCUSIGN_PRIVATE_KEY_PEM')
    ),
    buyerRoleName: getFirstConfiguredEnvValue('DOCUSIGN_BUYER_ROLE_NAME', 'DOCUSIGN_ASSIGNEE_ROLE_NAME') || 'Buyer',
    sellerRoleName: getFirstConfiguredEnvValue('DOCUSIGN_SELLER_ROLE_NAME', 'DOCUSIGN_ASSIGNOR_ROLE_NAME') || 'Seller',
    brandId: getFirstConfiguredEnvValue('DOCUSIGN_BRAND_ID')
  };
}

function getDocuSignMissingConfig(config = getDocuSignConfig()) {
  const missing = [];
  if (!config.clientId) missing.push('DOCUSIGN_CLIENT_ID');
  if (!config.userId) missing.push('DOCUSIGN_USER_ID');
  if (!config.privateKey) missing.push('DOCUSIGN_PRIVATE_KEY');
  if (!config.templateId) missing.push('DOCUSIGN_TEMPLATE_ID');
  return missing;
}

function getDocuSignStatusPayload() {
  const config = getDocuSignConfig();
  const missing = getDocuSignMissingConfig(config);
  return {
    configured: missing.length === 0,
    missing,
    buyerRoleName: config.buyerRoleName,
    sellerRoleName: config.sellerRoleName,
    hasAccountId: Boolean(config.accountId),
    hasConsentRedirectUri: Boolean(String(config.redirectUri || '').trim()),
    consentUrl: buildDocuSignConsentUrl(config),
    authServer: config.authServer
  };
}

function buildDocuSignErrorMessage(payload, fallbackMessage) {
  if (payload && typeof payload === 'object') {
    return String(
      payload.error_description
      || payload.error
      || payload.message
      || payload.details
      || fallbackMessage
    ).trim() || fallbackMessage;
  }

  return fallbackMessage;
}

function buildDocuSignConsentUrl(config = getDocuSignConfig()) {
  const redirectUri = String(config && config.redirectUri || '').trim();
  const clientId = String(config && config.clientId || '').trim();
  const authServer = String(config && config.authServer || '').trim();

  if (!redirectUri || !clientId || !authServer) {
    return '';
  }

  return `https://${authServer}/oauth/auth?${new URLSearchParams({
    response_type: 'code',
    scope: 'signature impersonation',
    client_id: clientId,
    redirect_uri: redirectUri
  }).toString()}`;
}

function createDocuSignApiError(payload, fallbackMessage, statusCode = 500) {
  const error = new Error(buildDocuSignErrorMessage(payload, fallbackMessage));
  error.statusCode = Number(statusCode) || 500;
  error.code = String(payload && (payload.error || payload.code) || '').trim().toLowerCase();
  error.details = payload;
  return error;
}

function buildDocuSignRouteErrorResponse(error) {
  const code = String(error && error.code || '').trim().toLowerCase();
  const consentUrl = buildDocuSignConsentUrl();

  if (code === 'consent_required') {
    return {
      status: 403,
      body: {
        error: consentUrl
          ? 'DocuSign needs one-time consent before this workspace can send envelopes. Use the consent link, approve access for the configured DocuSign user, and then try again.'
          : 'DocuSign needs one-time consent before this workspace can send envelopes. Add DOCUSIGN_REDIRECT_URI for a registered DocuSign callback URL, grant consent for the configured DocuSign user, and then try again.',
        code,
        consentUrl: consentUrl || null
      }
    };
  }

  const fallbackMessage = error && error.message ? error.message : 'DocuSign request failed.';
  const status = Number(error && error.statusCode);
  return {
    status: status >= 400 && status < 600 ? status : 500,
    body: {
      error: fallbackMessage,
      code: code || null
    }
  };
}

function isValidEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function cleanDocuSignText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

async function getDocuSignAccessToken(config) {
  if (typeof fetch !== 'function') {
    throw new Error('This server runtime does not support the DocuSign fetch flow.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: config.clientId,
      sub: config.userId,
      aud: config.authServer,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
      scope: 'signature impersonation'
    },
    config.privateKey,
    { algorithm: 'RS256' }
  );

  const response = await fetch(`https://${config.authServer}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw createDocuSignApiError(payload, 'DocuSign authentication failed.', response.status);
  }

  const accessToken = String(payload.access_token || '').trim();
  if (!accessToken) {
    throw new Error('DocuSign authentication did not return an access token.');
  }

  return accessToken;
}

function selectDocuSignAccount(accounts, requestedAccountId) {
  const normalizedAccounts = Array.isArray(accounts) ? accounts : [];
  const requestedId = String(requestedAccountId || '').trim();

  if (requestedId) {
    const exactMatch = normalizedAccounts.find((account) => String(account && account.account_id || '').trim() === requestedId);
    if (exactMatch) {
      return exactMatch;
    }
    return null;
  }

  return normalizedAccounts.find((account) => account && account.is_default)
    || normalizedAccounts[0]
    || null;
}

async function resolveDocuSignAccountContext(config, accessToken) {
  const response = await fetch(`https://${config.authServer}/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(buildDocuSignErrorMessage(payload, 'Unable to read DocuSign account information.'));
  }

  const account = selectDocuSignAccount(payload.accounts, config.accountId);
  if (!account) {
    throw new Error(config.accountId
      ? `DocuSign account ${config.accountId} is not available for the configured user.`
      : 'No DocuSign account was returned for the configured user.');
  }

  const baseUri = String(account.base_uri || '').trim().replace(/\/+$/g, '');
  const accountId = String(account.account_id || '').trim();
  if (!baseUri || !accountId) {
    throw new Error('DocuSign account information is incomplete.');
  }

  return {
    baseUri,
    accountId
  };
}

function collectDocuSignTemplateRoleNames(recipientsPayload) {
  const recipientGroups = [
    recipientsPayload && recipientsPayload.signers,
    recipientsPayload && recipientsPayload.inPersonSigners,
    recipientsPayload && recipientsPayload.agentSigners,
    recipientsPayload && recipientsPayload.editors,
    recipientsPayload && recipientsPayload.intermediaries,
    recipientsPayload && recipientsPayload.carbonCopies,
    recipientsPayload && recipientsPayload.certifiedDeliveries
  ];

  return Array.from(new Set(
    recipientGroups
      .flatMap((group) => Array.isArray(group) ? group : [])
      .map((recipient) => cleanDocuSignText(recipient && recipient.roleName, 120))
      .filter(Boolean)
  ));
}

function resolveDocuSignTemplateRoleName(configuredRoleName, templateRoleNames, fallbackCandidates = []) {
  const candidates = [configuredRoleName, ...fallbackCandidates]
    .map((value) => cleanDocuSignText(value, 120))
    .filter(Boolean);

  return candidates.find((candidate) => templateRoleNames.includes(candidate)) || '';
}

function normalizeDocuSignTabKey(value) {
  return cleanDocuSignText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function collectDocuSignTemplateRecipientsByRole(recipientsPayload) {
  const recipientGroups = [
    recipientsPayload && recipientsPayload.signers,
    recipientsPayload && recipientsPayload.inPersonSigners,
    recipientsPayload && recipientsPayload.agentSigners
  ];

  return recipientGroups
    .flatMap((group) => Array.isArray(group) ? group : [])
    .map((recipient) => ({
      roleName: cleanDocuSignText(recipient && recipient.roleName, 120),
      recipientId: cleanDocuSignText(recipient && (recipient.recipientId || recipient.recipient_id), 120)
    }))
    .filter((recipient) => recipient.roleName && recipient.recipientId);
}

function collectDocuSignTemplateTabLabels(tabsPayload) {
  const tabGroups = [
    tabsPayload && tabsPayload.textTabs,
    tabsPayload && tabsPayload.numberTabs,
    tabsPayload && tabsPayload.dateTabs,
    tabsPayload && tabsPayload.noteTabs,
    tabsPayload && tabsPayload.emailTabs,
    tabsPayload && tabsPayload.formulaTabs,
    tabsPayload && tabsPayload.listTabs
  ];

  return Array.from(new Set(
    tabGroups
      .flatMap((group) => Array.isArray(group) ? group : [])
      .map((tab) => cleanDocuSignText(tab && (tab.tabLabel || tab.name), 120))
      .filter(Boolean)
  ));
}

function buildDocuSignTemplateRoleTabs(entries, availableLabels) {
  const labels = Array.isArray(availableLabels) ? availableLabels : [];
  if (!labels.length) {
    return null;
  }

  const normalizedLabelMap = new Map();
  labels.forEach((label) => {
    const normalized = normalizeDocuSignTabKey(label);
    if (normalized && !normalizedLabelMap.has(normalized)) {
      normalizedLabelMap.set(normalized, label);
    }
  });

  const usedLabels = new Set();
  const textTabs = [];

  entries.forEach(([aliases, value]) => {
    const cleanValue = cleanDocuSignText(value, 4000);
    if (!cleanValue) {
      return;
    }

    aliases.forEach((alias) => {
      const normalizedAlias = normalizeDocuSignTabKey(alias);
      const matchedLabel = normalizedLabelMap.get(normalizedAlias);
      if (!matchedLabel || usedLabels.has(matchedLabel)) {
        return;
      }

      usedLabels.add(matchedLabel);
      textTabs.push({
        tabLabel: matchedLabel,
        value: cleanValue,
        locked: 'false'
      });
    });
  });

  return textTabs.length ? { textTabs } : null;
}

async function getDocuSignTemplateMetadata(config, accountContext, accessToken) {
  const templateBaseUrl = `${accountContext.baseUri}/restapi/v2.1/accounts/${encodeURIComponent(accountContext.accountId)}/templates/${encodeURIComponent(config.templateId)}`;

  const [templateResponse, recipientsResponse] = await Promise.all([
    fetch(templateBaseUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }),
    fetch(`${templateBaseUrl}/recipients`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  ]);

  const templatePayload = await templateResponse.json().catch(() => ({}));
  if (!templateResponse.ok) {
    throw new Error(buildDocuSignErrorMessage(templatePayload, 'DocuSign could not load the configured template.'));
  }

  const recipientsPayload = await recipientsResponse.json().catch(() => ({}));
  if (!recipientsResponse.ok) {
    throw new Error(buildDocuSignErrorMessage(recipientsPayload, 'DocuSign could not load the configured template recipients.'));
  }

  const roleNames = collectDocuSignTemplateRoleNames(recipientsPayload);
  const resolvedBuyerRoleName = resolveDocuSignTemplateRoleName(config.buyerRoleName, roleNames, [
    'Buyer',
    'Assignee',
    'Buyer / Assignee',
    'Buyer/Assignee'
  ]);
  const resolvedSellerRoleName = resolveDocuSignTemplateRoleName(config.sellerRoleName, roleNames, [
    'Seller',
    'Assignor',
    'Seller / Assignor',
    'Seller/Assignor'
  ]);
  const missingRoles = [];
  if (!resolvedBuyerRoleName) missingRoles.push(`buyer role (${config.buyerRoleName})`);
  if (!resolvedSellerRoleName) missingRoles.push(`seller role (${config.sellerRoleName})`);
  if (missingRoles.length) {
    throw new Error(`The DocuSign template is missing the expected recipient roles: ${missingRoles.join(', ')}. Available roles: ${roleNames.join(', ') || 'none found'}.`);
  }

  const templateRecipients = collectDocuSignTemplateRecipientsByRole(recipientsPayload);
  const roleTabLabels = {};

  await Promise.all(templateRecipients.map(async (recipient) => {
    try {
      const tabsResponse = await fetch(`${templateBaseUrl}/recipients/${encodeURIComponent(recipient.recipientId)}/tabs`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const tabsPayload = await tabsResponse.json().catch(() => ({}));
      if (!tabsResponse.ok) {
        return;
      }

      const labels = collectDocuSignTemplateTabLabels(tabsPayload);
      if (!labels.length) {
        return;
      }

      const currentLabels = Array.isArray(roleTabLabels[recipient.roleName]) ? roleTabLabels[recipient.roleName] : [];
      roleTabLabels[recipient.roleName] = Array.from(new Set(currentLabels.concat(labels)));
    } catch (error) {
      // Keep the envelope flow alive even if template tab inspection is unavailable.
    }
  }));

  return {
    id: cleanDocuSignText(templatePayload && (templatePayload.templateId || templatePayload.template_id || config.templateId), 120),
    name: cleanDocuSignText(templatePayload && (templatePayload.name || templatePayload.templateName), 240) || 'DocuSign template',
    roleNames,
    buyerRoleName: resolvedBuyerRoleName,
    sellerRoleName: resolvedSellerRoleName,
    roleTabLabels
  };
}

function buildDocuSignTextCustomFields(entries) {
  const fields = new Map();

  entries.forEach(([names, value]) => {
    if (!value) {
      return;
    }

    names.forEach((name) => {
      const cleanName = cleanDocuSignText(name, 120);
      const fieldKey = cleanName.toLowerCase();
      if (!cleanName || fields.has(fieldKey)) {
        return;
      }

      fields.set(fieldKey, {
        name: cleanName,
        value,
        show: 'false'
      });
    });
  });

  return Array.from(fields.values());
}

function getDocuSignRecipientClientUserId(recipientType) {
  return recipientType === 'seller'
    ? 'agent-workspace-seller'
    : 'agent-workspace-buyer';
}

async function createDocuSignRecipientSigningLink(accountContext, accessToken, envelopeId, recipient, requestOrigin) {
  const cleanedEnvelopeId = cleanDocuSignText(envelopeId, 120);
  const recipientName = cleanDocuSignText(recipient && recipient.name, 120);
  const recipientEmail = cleanDocuSignText(recipient && recipient.email, 180).toLowerCase();
  const recipientType = recipient && recipient.type === 'seller' ? 'seller' : 'buyer';
  const clientUserId = getDocuSignRecipientClientUserId(recipientType);
  const origin = String(requestOrigin || '').trim().replace(/\/+$/g, '') || `http://localhost:${PORT}`;

  if (!cleanedEnvelopeId || !recipientName || !recipientEmail) {
    throw new Error('A DocuSign signing link requires an envelope ID, recipient name, and recipient email.');
  }

  const response = await fetch(`${accountContext.baseUri}/restapi/v2.1/accounts/${encodeURIComponent(accountContext.accountId)}/envelopes/${encodeURIComponent(cleanedEnvelopeId)}/views/recipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      returnUrl: `${origin}/users.html?docusign=complete&recipient=${encodeURIComponent(recipientType)}`,
      authenticationMethod: 'none',
      email: recipientEmail,
      userName: recipientName,
      clientUserId
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(buildDocuSignErrorMessage(payload, `DocuSign could not create the ${recipientType} signing link.`));
  }

  const signingUrl = String(payload && payload.url || '').trim();
  if (!signingUrl) {
    throw new Error(`DocuSign did not return a ${recipientType} signing URL.`);
  }

  return signingUrl;
}

function buildDocuSignEnvelopePayload(config, payload, templateMetadata = null) {
  const propertyAddress = cleanDocuSignText(payload.propertyAddress, 300);
  const contractDate = cleanDocuSignText(payload.contractDate, 40);
  const apn = cleanDocuSignText(payload.apn, 120);
  const purchasePrice = cleanDocuSignText(payload.purchasePrice, 120);
  const buyerName = cleanDocuSignText(payload.buyerName, 120);
  const buyerEmail = cleanDocuSignText(payload.buyerEmail, 180).toLowerCase();
  const sellerName = cleanDocuSignText(payload.sellerName, 120);
  const sellerEmail = cleanDocuSignText(payload.sellerEmail, 180).toLowerCase();
  const emailSubject = cleanDocuSignText(
    payload.emailSubject || (propertyAddress ? `Purchase agreement for ${propertyAddress}` : 'FAST purchase agreement for signature'),
    180
  );
  const emailMessage = cleanDocuSignText(
    payload.emailMessage || 'Please review and sign the purchase agreement through DocuSign.',
    1000
  );
  const offerTerms = payload && payload.offerTerms && typeof payload.offerTerms === 'object'
    ? payload.offerTerms
    : {};
  const entityName = cleanDocuSignText(offerTerms.entity, 160);
  const closeEscrowDays = cleanDocuSignText(offerTerms.closeEscrowDays, 80);
  const depositAmount = cleanDocuSignText(offerTerms.depositAmount, 120);
  const depositType = cleanDocuSignText(offerTerms.depositType, 120);
  const offerType = cleanDocuSignText(offerTerms.offerType, 120);
  const inspectionPeriod = cleanDocuSignText(offerTerms.inspectionPeriod, 120);
  const escrowFees = cleanDocuSignText(offerTerms.escrowFees, 120);
  const titleFees = cleanDocuSignText(offerTerms.titleFees, 120);
  const escrowCompany = cleanDocuSignText(offerTerms.escrowCompany, 160);
  const titleCompany = cleanDocuSignText(offerTerms.titleCompany, 160);
  const otherTerms = cleanDocuSignText(offerTerms.otherTerms, 500);
  const sellerCompensation = cleanDocuSignText(offerTerms.sellerCompensation, 160);

  const textCustomFields = buildDocuSignTextCustomFields([
    [['propertyAddress', 'property_address', 'address'], propertyAddress],
    [['contractDate', 'contract_date', 'agreementDate', 'purchaseAgreementDate'], contractDate],
    [['apn', 'parcelNumber', 'propertyApn'], apn],
    [['purchasePrice', 'purchase_price', 'salePrice', 'salesPrice'], purchasePrice],
    [['buyerName', 'buyer', 'assigneeName', 'assignee'], buyerName],
    [['buyerEmail', 'buyer_email', 'assigneeEmail', 'assignee_email'], buyerEmail],
    [['sellerName', 'seller', 'assignorName', 'assignor'], sellerName],
    [['sellerEmail', 'seller_email', 'assignorEmail', 'assignor_email'], sellerEmail],
    [['entity', 'buyerEntity', 'purchasingEntity', 'vesting'], entityName],
    [['closeEscrowDays', 'closeOfEscrowDays', 'closeOfEscrow'], closeEscrowDays],
    [['depositAmount', 'emdAmount', 'earnestMoneyDeposit'], depositAmount],
    [['depositType'], depositType],
    [['offerType'], offerType],
    [['inspectionPeriod'], inspectionPeriod],
    [['escrowFees'], escrowFees],
    [['titleFees'], titleFees],
    [['escrowCompany', 'escrow'], escrowCompany],
    [['titleCompany'], titleCompany],
    [['otherTerms'], otherTerms],
    [['sellerCompensation'], sellerCompensation]
  ]);

  const templateTabEntries = [
    [['propertyAddress', 'property_address', 'property address', 'address', 'subjectProperty', 'subject property'], propertyAddress],
    [['contractDate', 'contract_date', 'contract date', 'agreementDate', 'agreement date', 'purchaseAgreementDate', 'purchase agreement date'], contractDate],
    [['apn', 'parcelNumber', 'parcel number', 'propertyApn', 'property apn'], apn],
    [['purchasePrice', 'purchase price', 'purchase_price', 'salePrice', 'sale price', 'salesPrice', 'sales price', 'offerPrice', 'offer price'], purchasePrice],
    [['buyerName', 'buyer name', 'buyer', 'assigneeName', 'assignee name', 'assignee', 'purchaserName', 'purchaser name', 'purchaser'], buyerName],
    [['buyerEmail', 'buyer email', 'buyer_email', 'assigneeEmail', 'assignee email', 'purchaserEmail', 'purchaser email'], buyerEmail],
    [['sellerName', 'seller name', 'seller', 'assignorName', 'assignor name', 'assignor'], sellerName],
    [['sellerEmail', 'seller email', 'seller_email', 'assignorEmail', 'assignor email'], sellerEmail],
    [['entity', 'buyerEntity', 'buyer entity', 'purchasingEntity', 'purchasing entity', 'vesting', 'vestingName', 'vesting name'], entityName],
    [['closeEscrowDays', 'close escrow days', 'closeOfEscrow', 'close of escrow', 'closeOfEscrowDays', 'close of escrow days', 'coe'], closeEscrowDays],
    [['depositAmount', 'deposit amount', 'emdAmount', 'emd amount', 'earnestMoneyDeposit', 'earnest money deposit'], depositAmount],
    [['depositType', 'deposit type'], depositType],
    [['offerType', 'offer type'], offerType],
    [['inspectionPeriod', 'inspection period'], inspectionPeriod],
    [['escrowFees', 'escrow fees'], escrowFees],
    [['titleFees', 'title fees'], titleFees],
    [['escrowCompany', 'escrow company', 'escrow'], escrowCompany],
    [['titleCompany', 'title company'], titleCompany],
    [['otherTerms', 'other terms'], otherTerms],
    [['sellerCompensation', 'seller compensation'], sellerCompensation]
  ];

  const buyerRoleName = cleanDocuSignText(templateMetadata && templateMetadata.buyerRoleName, 120) || config.buyerRoleName;
  const sellerRoleName = cleanDocuSignText(templateMetadata && templateMetadata.sellerRoleName, 120) || config.sellerRoleName;
  const roleTabLabels = templateMetadata && templateMetadata.roleTabLabels && typeof templateMetadata.roleTabLabels === 'object'
    ? templateMetadata.roleTabLabels
    : {};

  const buyerTabs = buildDocuSignTemplateRoleTabs(templateTabEntries, roleTabLabels[buyerRoleName]);
  const sellerTabs = buildDocuSignTemplateRoleTabs(templateTabEntries, roleTabLabels[sellerRoleName]);

  const envelope = {
    status: 'sent',
    templateId: config.templateId,
    emailSubject,
    emailBlurb: emailMessage,
    templateRoles: [
      {
        roleName: buyerRoleName,
        name: buyerName,
        email: buyerEmail,
        clientUserId: getDocuSignRecipientClientUserId('buyer'),
        embeddedRecipientStartURL: 'SIGN_AT_DOCUSIGN',
        ...(buyerTabs ? { tabs: buyerTabs } : {})
      },
      {
        roleName: sellerRoleName,
        name: sellerName,
        email: sellerEmail,
        clientUserId: getDocuSignRecipientClientUserId('seller'),
        embeddedRecipientStartURL: 'SIGN_AT_DOCUSIGN',
        ...(sellerTabs ? { tabs: sellerTabs } : {})
      }
    ]
  };

  if (textCustomFields.length) {
    envelope.customFields = {
      textCustomFields
    };
  }

  if (config.brandId) {
    envelope.brandId = config.brandId;
  }

  return envelope;
}

async function sendDocuSignTemplateEnvelope(payload) {
  const config = getDocuSignConfig();
  const missingConfig = getDocuSignMissingConfig(config);
  if (missingConfig.length) {
    throw new Error(`DocuSign is not configured. Missing ${missingConfig.join(', ')}.`);
  }

  const accessToken = await getDocuSignAccessToken(config);
  const accountContext = await resolveDocuSignAccountContext(config, accessToken);
  const templateMetadata = await getDocuSignTemplateMetadata(config, accountContext, accessToken);
  const envelopePayload = buildDocuSignEnvelopePayload(config, payload, templateMetadata);

  const response = await fetch(`${accountContext.baseUri}/restapi/v2.1/accounts/${encodeURIComponent(accountContext.accountId)}/envelopes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(envelopePayload)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(buildDocuSignErrorMessage(result, 'DocuSign could not create the envelope.'));
  }

  return {
    envelopeId: String(result.envelopeId || result.envelope_id || '').trim(),
    status: String(result.status || 'sent').trim() || 'sent',
    uri: String(result.uri || '').trim(),
    template: templateMetadata
  };
}

function resolveDatabaseFilePath() {
  const explicitPath = getFirstConfiguredEnvValue('DATABASE_PATH', 'SQLITE_DATABASE_PATH', 'SQLITE_DB_PATH');
  if (explicitPath) {
    return path.resolve(explicitPath);
  }

  const persistentRoot = getFirstConfiguredEnvValue('RENDER_DISK_MOUNT_PATH', 'PERSISTENT_STORAGE_PATH', 'DATA_DIR');
  if (persistentRoot) {
    return path.join(path.resolve(persistentRoot), DATABASE_FILENAME);
  }

  return path.join(__dirname, DATABASE_FILENAME);
}

function ensureDatabaseStorageReady(databaseFilePath) {
  const resolvedPath = path.resolve(databaseFilePath);
  const resolvedDir = path.dirname(resolvedPath);
  const legacyPath = path.join(__dirname, DATABASE_FILENAME);

  fs.mkdirSync(resolvedDir, { recursive: true });

  if (resolvedPath !== legacyPath && !fs.existsSync(resolvedPath) && fs.existsSync(legacyPath)) {
    fs.copyFileSync(legacyPath, resolvedPath);
  }

  return resolvedPath;
}

function isUsingFallbackDatabasePath(databaseFilePath) {
  const explicitPath = getFirstConfiguredEnvValue('DATABASE_PATH', 'SQLITE_DATABASE_PATH', 'SQLITE_DB_PATH');
  if (explicitPath) {
    return false;
  }

  const persistentRoot = getFirstConfiguredEnvValue('RENDER_DISK_MOUNT_PATH', 'PERSISTENT_STORAGE_PATH', 'DATA_DIR');
  if (persistentRoot) {
    return false;
  }

  return path.resolve(databaseFilePath) === path.resolve(path.join(__dirname, DATABASE_FILENAME));
}

function isProductionEnvironment() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function normalizeKnownEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return LEGACY_EMAIL_ALIASES.get(normalizedEmail) || normalizedEmail;
}

function normalizeSuppressedIdentityText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSuppressedIdentityCompact(value) {
  return normalizeSuppressedIdentityText(value).replace(/\s+/g, '');
}

function isSuppressedAccountIdentity(userLike) {
  if (!userLike || typeof userLike !== 'object') {
    return false;
  }

  const values = [userLike.name, userLike.email, userLike.key]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (!values.length) {
    return false;
  }

  const normalizedJoined = normalizeSuppressedIdentityText(values.join(' '));
  const compactJoined = normalizeSuppressedIdentityCompact(values.join(' '));

  return SUPPRESSED_ACCOUNT_MATCHERS.some((matcher) => {
    const normalizedMatcher = normalizeSuppressedIdentityText(matcher);
    const compactMatcher = normalizeSuppressedIdentityCompact(matcher);
    return (normalizedMatcher && normalizedJoined.includes(normalizedMatcher))
      || (compactMatcher && compactJoined.includes(compactMatcher));
  });
}

async function purgeSuppressedAccounts() {
  const likePatterns = Array.from(new Set(
    SUPPRESSED_ACCOUNT_MATCHERS
      .map((matcher) => normalizeSuppressedIdentityText(matcher))
      .filter(Boolean)
      .map((matcher) => `%${matcher.replace(/\s+/g, '%')}%`)
  ));

  if (!likePatterns.length) {
    return { deletedUsers: 0, deletedAssignments: 0 };
  }

  const userRows = await dbAll(
    `SELECT id
       FROM users
      WHERE ${likePatterns.map(() => '(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)').join(' OR ')}`,
    likePatterns.flatMap((pattern) => [pattern, pattern])
  );

  let deletedUsers = 0;
  for (const row of userRows) {
    try {
      await deleteUserAccountById(row.id);
      deletedUsers += 1;
    } catch (error) {
      console.error('Failed to purge suppressed user account:', row && row.id, error);
    }
  }

  let deletedAssignments = 0;
  for (const pattern of likePatterns) {
    try {
      const result = await dbRun(
        `DELETE FROM property_assignments
          WHERE LOWER(COALESCE(assigned_to_name, '')) LIKE ?
             OR LOWER(COALESCE(assigned_to_email, '')) LIKE ?
             OR LOWER(COALESCE(assigned_to_key, '')) LIKE ?
             OR LOWER(COALESCE(assigned_by_name, '')) LIKE ?
             OR LOWER(COALESCE(assigned_by_email, '')) LIKE ?
             OR LOWER(COALESCE(assigned_by_key, '')) LIKE ?
             OR LOWER(COALESCE(payload_json, '')) LIKE ?`,
        [pattern, pattern, pattern, pattern, pattern, pattern, pattern]
      );
      deletedAssignments += Number(result && result.changes) || 0;
    } catch (error) {
      console.error('Failed to purge suppressed property assignment records:', error);
    }
  }

  return { deletedUsers, deletedAssignments };
}

function isFastBridgeWorkspaceEmail(email) {
  const normalizedEmail = normalizeKnownEmail(email);
  return normalizedEmail.endsWith('@fastbridgegroupllc.com');
}

function userHasWebsiteAccess(userLike) {
  return Number(userLike && userLike.access_granted) === 1;
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

function smtpIdentityMatchesAccount(candidateEmail, accountEmail) {
  const normalizedCandidate = normalizeKnownEmail(candidateEmail);
  const normalizedAccount = normalizeKnownEmail(accountEmail);

  return Boolean(normalizedCandidate && normalizedAccount && normalizedCandidate === normalizedAccount);
}

function resolveEffectiveSmtpConfig({ email, smtpUser, smtpPass, smtpSignature }) {
  const normalizedEmail = normalizeKnownEmail(email);
  const perUserEnvConfig = getPerUserSmtpEnvConfig(normalizedEmail);
  const dbUser = String(smtpUser || '').trim().toLowerCase();
  const dbPass = String(smtpPass || '').trim();
  const perUserEnvUser = String(perUserEnvConfig.smtpUser || '').trim().toLowerCase();
  const perUserEnvPass = String(perUserEnvConfig.smtpPass || '').trim();
  const dbUserMatchesAccount = smtpIdentityMatchesAccount(dbUser, normalizedEmail);
  const envUserMatchesAccount = smtpIdentityMatchesAccount(perUserEnvUser, normalizedEmail);

  let resolvedUser = '';
  let resolvedPass = '';

  if (perUserEnvUser && perUserEnvPass && envUserMatchesAccount) {
    resolvedUser = perUserEnvUser;
    resolvedPass = perUserEnvPass;
  } else if (dbUser && dbPass && dbUserMatchesAccount) {
    resolvedUser = dbUser;
    resolvedPass = dbPass;
  } else if (dbUser && perUserEnvPass && dbUserMatchesAccount && envUserMatchesAccount && normalizeKnownEmail(dbUser) === normalizeKnownEmail(perUserEnvUser)) {
    resolvedUser = dbUser;
    resolvedPass = perUserEnvPass;
  } else {
    resolvedUser = dbUserMatchesAccount ? dbUser : (envUserMatchesAccount ? perUserEnvUser : '');
    resolvedPass = dbUserMatchesAccount ? dbPass : (envUserMatchesAccount ? perUserEnvPass : '');
  }

  const resolvedSignature = String(perUserEnvConfig.smtpSignature || smtpSignature || '').trim();

  return {
    smtpUser: resolvedUser,
    smtpPass: resolvedPass,
    smtpSignature: resolvedSignature,
    hasPassword: Boolean(resolvedPass)
  };
}

async function getLatestApprovedSmtpRequest(userId, email) {
  const normalizedEmail = normalizeKnownEmail(email);
  const normalizedUserId = Number.isInteger(Number(userId)) ? Number(userId) : 0;

  try {
    if (normalizedUserId > 0) {
      const row = await dbGet(
        `SELECT id, user_id, requester_email, smtp_user, smtp_pass, reviewed_at
         FROM smtp_requests
         WHERE user_id = ? AND status = 'approved'
         ORDER BY datetime(reviewed_at) DESC, datetime(created_at) DESC, id DESC
         LIMIT 1`,
        [normalizedUserId]
      );

      if (row) {
        return row;
      }
    }

    if (!normalizedEmail) {
      return null;
    }

    return await dbGet(
      `SELECT id, user_id, requester_email, smtp_user, smtp_pass, reviewed_at
       FROM smtp_requests
       WHERE status = 'approved'
         AND (LOWER(requester_email) = ? OR LOWER(smtp_user) = ?)
       ORDER BY datetime(reviewed_at) DESC, datetime(created_at) DESC, id DESC
       LIMIT 1`,
      [normalizedEmail, normalizedEmail]
    );
  } catch (error) {
    if (/no such table/i.test(String(error && error.message || ''))) {
      return null;
    }
    throw error;
  }
}

async function resolveEffectiveSmtpConfigForUser({ userId, email, smtpUser, smtpPass, smtpSignature }) {
  const resolvedConfig = resolveEffectiveSmtpConfig({ email, smtpUser, smtpPass, smtpSignature });
  if (resolvedConfig.smtpUser && resolvedConfig.smtpPass) {
    return resolvedConfig;
  }

  const normalizedEmail = normalizeKnownEmail(email);
  if (!normalizedEmail) {
    return resolvedConfig;
  }

  const approvedRequest = await getLatestApprovedSmtpRequest(userId, normalizedEmail);
  const approvedSmtpUser = String(approvedRequest && approvedRequest.smtp_user || '').trim().toLowerCase();
  const approvedSmtpPass = String(approvedRequest && approvedRequest.smtp_pass || '').trim();

  if (!approvedSmtpUser || !approvedSmtpPass || !smtpIdentityMatchesAccount(approvedSmtpUser, normalizedEmail)) {
    return resolvedConfig;
  }

  const repairedConfig = {
    smtpUser: resolvedConfig.smtpUser || approvedSmtpUser,
    smtpPass: resolvedConfig.smtpPass || approvedSmtpPass,
    smtpSignature: resolvedConfig.smtpSignature,
    hasPassword: Boolean(resolvedConfig.smtpPass || approvedSmtpPass)
  };

  if (Number.isInteger(Number(userId)) && Number(userId) > 0 && (!String(smtpUser || '').trim() || !String(smtpPass || '').trim())) {
    try {
      await dbRun(
        'UPDATE users SET smtp_user = ?, smtp_pass = ?, smtp_signature = COALESCE(NULLIF(smtp_signature, \'\'), ?) WHERE id = ?',
        [repairedConfig.smtpUser, repairedConfig.smtpPass, repairedConfig.smtpSignature, Number(userId)]
      );
    } catch (error) {
      console.error('Failed to repair approved Gmail outbox for user:', error);
    }
  }

  return repairedConfig;
}

function getEmailFailureReason(error) {
  const rawMessage = String(error?.message || error || '').trim();
  const normalizedMessage = rawMessage.toLowerCase();
  const errorCode = String(error?.code || '').trim().toUpperCase();
  const responseCode = Number(error?.responseCode || 0);

  if (!rawMessage) {
    return 'The email could not be sent because the mail server did not return a reason.';
  }

  if (responseCode === 535 || normalizedMessage.includes('username and password not accepted') || normalizedMessage.includes('invalid login') || normalizedMessage.includes('missing credentials for "plain"')) {
    return 'Gmail rejected the sign-in. Check that the SMTP email matches the mailbox that owns the App Password, confirm 2-Step Verification is enabled, and replace the App Password if it may have expired.';
  }

  if (normalizedMessage.includes('application-specific password required')) {
    return 'Google requires an App Password for this mailbox. Create a Google App Password for the sending mailbox and save that value in the account SMTP settings or Render environment variables.';
  }

  if (normalizedMessage.includes('less secure') || normalizedMessage.includes('badcredentials')) {
    return 'Google blocked the sign-in attempt. Use a Google App Password instead of the normal mailbox password.';
  }

  if (responseCode === 550 || normalizedMessage.includes('mailbox unavailable') || normalizedMessage.includes('user unknown') || normalizedMessage.includes('recipient address rejected')) {
    return 'The recipient mailbox was rejected by the mail server. Verify the recipient email address is spelled correctly and still exists.';
  }

  if (errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET' || errorCode === 'ECONNECTION' || normalizedMessage.includes('timeout') || normalizedMessage.includes('connection closed')) {
    return 'The app could not reach Gmail. Check the server connection and try again.';
  }

  if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
    return 'The server could not resolve Gmail while sending the email. Check DNS/network connectivity and try again.';
  }

  if (normalizedMessage.includes('email can only be sent from the approved gmail outbox') || normalizedMessage.includes('approved gmail outbox does not match') || normalizedMessage.includes('sign in again before sending email through the website') || normalizedMessage.includes('no gmail smtp credentials are configured') || normalizedMessage.includes('no gmail app password configured') || normalizedMessage.includes('no gmail account configured')) {
    return rawMessage;
  }

  return rawMessage;
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

function inferListingSourceFromUrl(rawUrl) {
  try {
    const parsedUrl = new URL(String(rawUrl || '').trim());
    const hostname = String(parsedUrl.hostname || '').trim().toLowerCase();
    if (hostname.includes('zillow.com')) {
      return 'zillow';
    }
    if (hostname.includes('redfin.com')) {
      return 'redfin';
    }
  } catch (error) {
    return '';
  }

  return '';
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ');
}

function normalizeListingText(value) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractMetaTagContent(html, key) {
  const escapedKey = String(key || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapedKey}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapedKey}["'][^>]*>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return normalizeListingText(match[1]);
    }
  }

  return '';
}

function extractJsonLdObjects(html) {
  const matches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const collected = [];

  matches.forEach((match) => {
    const rawBlock = String(match[1] || '').trim();
    if (!rawBlock) {
      return;
    }

    try {
      collected.push(JSON.parse(rawBlock));
    } catch (error) {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return collected;
}

function collectStructuredObjects(value, results = []) {
  if (!value || typeof value !== 'object') {
    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectStructuredObjects(entry, results));
    return results;
  }

  results.push(value);
  Object.values(value).forEach((entry) => collectStructuredObjects(entry, results));
  return results;
}

function findStructuredListingObject(objects) {
  const flattened = collectStructuredObjects(objects, []);
  const scored = flattened
    .map((entry) => {
      const typeValue = Array.isArray(entry['@type']) ? entry['@type'].join(' ') : String(entry['@type'] || '');
      const normalizedType = typeValue.toLowerCase();
      let score = 0;

      if (/(house|residence|apartment|singlefamilyresidence|single family|product|place|offer)/i.test(normalizedType)) {
        score += 2;
      }
      if (entry.address) score += 3;
      if (entry.offers) score += 2;
      if (entry.numberOfBedrooms || entry.numberOfBathroomsTotal || entry.numberOfBathrooms || entry.floorSize) score += 2;
      if (entry.image) score += 1;

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return scored.length ? scored[0].entry : null;
}

function formatStructuredAddress(address) {
  if (!address) {
    return '';
  }

  if (typeof address === 'string') {
    return normalizeListingText(address);
  }

  const street = normalizeListingText(address.streetAddress || '');
  const city = normalizeListingText(address.addressLocality || '');
  const region = normalizeListingText(address.addressRegion || '');
  const postalCode = normalizeListingText(address.postalCode || '');
  return [street, [city, region].filter(Boolean).join(', '), postalCode].filter(Boolean).join(' ').trim();
}

function getListingLocationLabel(addressLike) {
  if (!addressLike || typeof addressLike !== 'object') {
    return '';
  }

  const city = normalizeListingText(addressLike.addressLocality || '');
  const region = normalizeListingText(addressLike.addressRegion || '');
  const postalCode = normalizeListingText(addressLike.postalCode || '');
  return [city, region, postalCode].filter(Boolean).join(', ').replace(/,\s*,/g, ', ').trim();
}

function findFirstPatternMatch(text, patterns) {
  const source = String(text || '');
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) {
      const value = match.slice(1).find(Boolean);
      if (value) {
        return normalizeListingText(value);
      }
    }
  }
  return '';
}

function normalizeListingCurrency(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const digits = raw.replace(/[^0-9.]/g, '');
  if (!digits) {
    return '';
  }

  const amount = Number(digits);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  return `$${Math.round(amount).toLocaleString()}`;
}

function extractListingFactsFromText(text) {
  const source = normalizeListingText(text);
  return {
    price: normalizeListingCurrency(findFirstPatternMatch(source, [/\$\s*([\d,]+(?:\.\d+)?)/])),
    beds: findFirstPatternMatch(source, [/(\d+(?:\.\d+)?)\s*(?:bed|beds|bd)\b/i]),
    baths: findFirstPatternMatch(source, [/(\d+(?:\.\d+)?)\s*(?:bath|baths|ba)\b/i]),
    area: findFirstPatternMatch(source, [/(\d[\d,]*)\s*(?:square feet|sq\.?\s*ft|sqft)\b/i]),
    lotSize: findFirstPatternMatch(source, [/lot[^\d]*(\d[\d,]*\s*(?:sq\.?\s*ft|sqft|acres?))/i]),
    yearBuilt: findFirstPatternMatch(source, [/(?:built in|year built|built)\D*(\d{4})/i]),
    mlsId: findFirstPatternMatch(source, [/(?:mls|mls#|mls number|mls no\.)\D*([a-z0-9-]+)/i]),
    status: findFirstPatternMatch(source, [/(active|pending|contingent|sold|off market|coming soon)/i])
  };
}

function mapListingStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'active';
  }
  if (normalized.includes('pending') || normalized.includes('contingent')) {
    return 'pending';
  }
  if (normalized.includes('sold') || normalized.includes('closed')) {
    return 'closed';
  }
  if (normalized.includes('hold')) {
    return 'on-hold';
  }
  return 'active';
}

function decodeImportedScriptValue(value) {
  return String(value || '')
    .replace(/\\u002f/gi, '/')
    .replace(/\\u003a/gi, ':')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u003d/gi, '=')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"')
    .trim();
}

function extractImportedImageCandidate(html, requestUrl, source, structuredImage, ogImage) {
  const preferredCandidates = [structuredImage];

  if (source === 'redfin') {
    const redfinPatterns = [
      /"photoUrls"\s*:\s*\[\s*"([^"]+)"/i,
      /"(?:resizedPhotoUrl|mainPhotoUrl|photoUrl|imageUrl|heroImageUrl|src)"\s*:\s*"((?:https?:)?(?:\\\/|\/){2}[^"]*cdn-redfin\.com[^"]+)"/i,
      /"(https?:\\\/\\\/[^"]*cdn-redfin\.com\\\/photo\\\/[^"]+)"/i,
      /"(https?:\/\/[^"]*cdn-redfin\.com\/photo\/[^"\\]+)"/i
    ];

    for (const pattern of redfinPatterns) {
      const match = html.match(pattern);
      if (!match || !match[1]) {
        continue;
      }

      const normalizedUrl = normalizeImportedImageUrl(decodeImportedScriptValue(match[1]), requestUrl);
      if (normalizedUrl) {
        return normalizedUrl;
      }
    }
  }

  preferredCandidates.push(ogImage);

  for (const candidate of preferredCandidates) {
    const normalizedUrl = normalizeImportedImageUrl(candidate, requestUrl);
    if (normalizedUrl) {
      return normalizedUrl;
    }
  }

  return '';
}

function extractListingImportData(html, requestUrl, source) {
  const ogTitle = extractMetaTagContent(html, 'og:title') || extractMetaTagContent(html, 'twitter:title');
  const ogDescription = extractMetaTagContent(html, 'og:description') || extractMetaTagContent(html, 'description') || extractMetaTagContent(html, 'twitter:description');
  const ogImage = extractMetaTagContent(html, 'og:image') || extractMetaTagContent(html, 'twitter:image');
  const structuredListing = findStructuredListingObject(extractJsonLdObjects(html));
  const textFacts = extractListingFactsFromText(`${ogTitle} ${ogDescription} ${html}`);
  const structuredAddress = formatStructuredAddress(structuredListing && structuredListing.address);
  const locationLabel = getListingLocationLabel(structuredListing && structuredListing.address);
  const structuredOffers = structuredListing && structuredListing.offers && typeof structuredListing.offers === 'object'
    ? structuredListing.offers
    : {};
  const structuredImage = Array.isArray(structuredListing && structuredListing.image)
    ? structuredListing.image.find(Boolean)
    : (structuredListing && structuredListing.image) || '';
  const structuredPrice = normalizeListingCurrency(structuredOffers.price || structuredOffers.lowPrice || structuredOffers.highPrice || '');
  const structuredBeds = normalizeListingText(structuredListing && (structuredListing.numberOfBedrooms || structuredListing.numberOfRooms || ''));
  const structuredBaths = normalizeListingText(structuredListing && (structuredListing.numberOfBathroomsTotal || structuredListing.numberOfBathrooms || ''));
  const structuredArea = normalizeListingText(structuredListing && structuredListing.floorSize && (structuredListing.floorSize.value || structuredListing.floorSize.name || structuredListing.floorSize))
    .replace(/[^\d,.]/g, '');
  const structuredYearBuilt = normalizeListingText(structuredListing && structuredListing.yearBuilt);
  const rawAddress = structuredAddress || normalizeListingText(ogTitle.split('|')[0].split(' - ')[0]);
  const rawLocation = locationLabel || findFirstPatternMatch(rawAddress, [/^[^,]+,\s*(.+)$/]);
  const description = ogDescription || normalizeListingText(structuredListing && structuredListing.description);
  const normalizedImageUrl = extractImportedImageCandidate(html, requestUrl, source, structuredImage, ogImage);

  return {
    source,
    url: requestUrl,
    address: rawAddress,
    location: rawLocation,
    mlsId: textFacts.mlsId,
    price: structuredPrice || textFacts.price,
    beds: structuredBeds || textFacts.beds,
    baths: structuredBaths || textFacts.baths,
    area: structuredArea || textFacts.area,
    lotSize: textFacts.lotSize,
    yearBuilt: structuredYearBuilt || textFacts.yearBuilt,
    imageUrl: normalizedImageUrl,
    notes: description,
    status: mapListingStatus(textFacts.status)
  };
}

function normalizeImportedImageUrl(value, requestUrl = '') {
  const rawValue = normalizeListingText(value);
  if (!rawValue) {
    return '';
  }

  try {
    const normalizedUrl = new URL(rawValue, requestUrl || undefined).href;
    return isImportedImageUrl(normalizedUrl) ? normalizedUrl : '';
  } catch (error) {
    return isImportedImageUrl(rawValue) ? rawValue : '';
  }
}

function isImportedImageUrl(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(rawValue, 'https://example.com');
    const pathname = String(parsedUrl.pathname || '').trim().toLowerCase();
    const hostname = String(parsedUrl.hostname || '').trim().toLowerCase();

    if (!pathname) {
      return false;
    }

    if (/\.(?:js|mjs|css|map|json|xml|txt|pdf|html?)$/i.test(pathname)) {
      return false;
    }

    if (/\.(?:avif|gif|ico|jpe?g|jfif|png|svg|webp)(?:$|[?#])/i.test(pathname)) {
      return true;
    }

    if (hostname.includes('cdn-redfin.com') && /\/photo\//i.test(pathname)) {
      return true;
    }

    if (/[?&](?:format|fm)=(?:avif|gif|jpeg|jpg|png|webp)\b/i.test(rawValue)) {
      return true;
    }

    return /\b(?:image|images|photo|photos|thumbnail|thumbnails|listing-photo)\b/i.test(pathname);
  } catch (error) {
    return false;
  }
}

function normalizeAddressMatchText(value) {
  return decodeHtmlEntities(String(value || ''))
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bapt\b/g, 'apartment')
    .replace(/\bunit\b/g, 'unit')
    .replace(/\bste\b/g, 'suite')
    .replace(/\bst\b/g, 'street')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\bdr\b/g, 'drive')
    .replace(/\brd\b/g, 'road')
    .replace(/\bln\b/g, 'lane')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\bct\b/g, 'court')
    .replace(/\bcir\b/g, 'circle')
    .replace(/\bpkwy\b/g, 'parkway')
    .replace(/\bter\b/g, 'terrace')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeAddressMatchText(value) {
  return normalizeAddressMatchText(value).split(' ').filter(Boolean);
}

function extractDuckDuckGoResultUrl(rawHref) {
  const href = decodeHtmlEntities(String(rawHref || '').trim());
  if (!href) {
    return '';
  }

  try {
    const parsedUrl = new URL(href, 'https://duckduckgo.com');
    if (parsedUrl.hostname.includes('duckduckgo.com')) {
      const redirected = parsedUrl.searchParams.get('uddg');
      return redirected ? decodeURIComponent(redirected) : '';
    }
    return parsedUrl.href;
  } catch (error) {
    return '';
  }
}

function isBotProtectionResponse(body) {
  const text = String(body || '').trim().toLowerCase();
  if (!text) {
    return false;
  }

  return [
    'anomaly.js',
    'px-captcha',
    'perimeterx',
    'human verification',
    'press & hold to confirm you are a human',
    'complete the security check',
    'request blocked',
    'access to this page has been denied',
    'captcha'
  ].some((marker) => text.includes(marker));
}

function extractDuckDuckGoSearchResults(html, source) {
  const results = [];
  const seenUrls = new Set();
  const anchorPattern = /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(String(html || '')))) {
    const resolvedUrl = extractDuckDuckGoResultUrl(match[1]);
    if (!resolvedUrl || inferListingSourceFromUrl(resolvedUrl) !== source || seenUrls.has(resolvedUrl)) {
      continue;
    }

    seenUrls.add(resolvedUrl);
    results.push({
      url: resolvedUrl,
      title: normalizeListingText(match[2])
    });
  }

  return results;
}

function getAddressSearchQueries(address, source) {
  const domain = source === 'redfin' ? 'redfin.com' : 'zillow.com';
  const trimmedAddress = String(address || '').trim();
  const normalizedAddress = normalizeAddressMatchText(trimmedAddress);
  const withoutZip = normalizedAddress.replace(/\b\d{5}(?: \d{4})?\b/g, '').trim();
  return Array.from(new Set([
    `site:${domain} "${trimmedAddress}"`,
    `site:${domain} ${trimmedAddress}`,
    withoutZip ? `site:${domain} ${withoutZip}` : ''
  ].filter(Boolean)));
}

function scoreListingSearchCandidate(candidate, address, source) {
  const queryText = normalizeAddressMatchText(address);
  const queryTokens = tokenizeAddressMatchText(address);
  const titleText = normalizeAddressMatchText(candidate && candidate.title);
  const urlText = normalizeAddressMatchText(candidate && candidate.url);
  const zipMatch = queryText.match(/\b\d{5}\b/);
  const streetNumberMatch = queryText.match(/^\d+[a-z]?\b/);
  let score = 0;

  if (queryText && titleText.includes(queryText)) {
    score += 120;
  }

  if (queryText && urlText.includes(queryText)) {
    score += 80;
  }

  if (streetNumberMatch && (titleText.includes(streetNumberMatch[0]) || urlText.includes(streetNumberMatch[0]))) {
    score += 20;
  }

  if (zipMatch && (titleText.includes(zipMatch[0]) || urlText.includes(zipMatch[0]))) {
    score += 25;
  }

  const tokenMatches = queryTokens.reduce((total, token) => {
    if (token.length <= 1) {
      return total;
    }
    return total + ((titleText.includes(token) || urlText.includes(token)) ? 1 : 0);
  }, 0);
  score += tokenMatches * 4;

  if (source === 'zillow') {
    if (/\/homedetails\//i.test(candidate.url || '')) {
      score += 30;
    }
    if (/_zpid/i.test(candidate.url || '')) {
      score += 15;
    }
    if (/\/apartments\//i.test(candidate.url || '')) {
      score -= 10;
    }
  }

  if (source === 'redfin') {
    if (/\/home\//i.test(candidate.url || '')) {
      score += 30;
    }
    if (/\/apartment\//i.test(candidate.url || '')) {
      score -= 4;
    }
  }

  return score;
}

async function searchListingUrlByAddress(address, source) {
  const queries = getAddressSearchQueries(address, source);
  const candidates = [];
  const seenUrls = new Set();
  let blockedByBotProtection = false;

  for (const query of queries) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache'
      }
    });

    if (response.status === 202) {
      blockedByBotProtection = true;
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    if (isBotProtectionResponse(html)) {
      blockedByBotProtection = true;
      continue;
    }

    const parsedResults = extractDuckDuckGoSearchResults(html, source);
    parsedResults.forEach((candidate) => {
      if (seenUrls.has(candidate.url)) {
        return;
      }
      seenUrls.add(candidate.url);
      candidates.push(candidate);
    });

    if (candidates.length >= 5) {
      break;
    }
  }

  const bestCandidate = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreListingSearchCandidate(candidate, address, source)
    }))
    .sort((left, right) => right.score - left.score)[0];

  if ((!bestCandidate || bestCandidate.score <= 0) && blockedByBotProtection) {
    throw new Error(`Automated ${source === 'redfin' ? 'Redfin' : 'Zillow'} lookup is currently blocked by bot protection.`);
  }

  return bestCandidate && bestCandidate.score > 0 ? bestCandidate.url : '';
}

async function fetchImportedListingFromUrl(rawUrl, requestedSource = '') {
  let parsedUrl;
  try {
    parsedUrl = new URL(String(rawUrl || '').trim());
  } catch (error) {
    throw new Error('Enter a valid property URL.');
  }
  const inferredSource = inferListingSourceFromUrl(parsedUrl.href);
  const source = String(requestedSource || inferredSource).trim().toLowerCase();

  if (!source || !['zillow', 'redfin'].includes(source)) {
    throw new Error('Only Zillow and Redfin property links are supported right now.');
  }

  if (!inferListingSourceFromUrl(parsedUrl.href)) {
    throw new Error('The pasted link does not look like a Zillow or Redfin property page.');
  }

  const response = await fetch(parsedUrl.href, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache'
    }
  });

  const html = await response.text();

  if (isBotProtectionResponse(html)) {
    throw new Error(`The ${source === 'zillow' ? 'Zillow' : 'Redfin'} page is blocking automated access right now.`);
  }

  if (!response.ok) {
    throw new Error(`The ${source === 'zillow' ? 'Zillow' : 'Redfin'} page could not be loaded right now.`);
  }

  const listing = extractListingImportData(html, parsedUrl.href, source);

  if (!listing.address && !listing.price && !listing.imageUrl) {
    throw new Error(`FAST could not read enough public listing data from this ${source === 'zillow' ? 'Zillow' : 'Redfin'} page.`);
  }

  return {
    source,
    url: parsedUrl.href,
    listing
  };
}

function getListingCompletenessScore(listing) {
  if (!listing || typeof listing !== 'object') {
    return 0;
  }

  return [
    listing.address,
    listing.location,
    listing.price,
    listing.beds,
    listing.baths,
    listing.area,
    listing.lotSize,
    listing.yearBuilt,
    listing.imageUrl,
    listing.notes,
    listing.mlsId
  ].reduce((total, value) => total + (String(value || '').trim() ? 1 : 0), 0);
}

function mergeImportedListingsByQuality(results, address) {
  const importedResults = Array.isArray(results)
    ? results.filter((item) => item && item.listing && typeof item.listing === 'object')
    : [];
  const rankedResults = importedResults
    .map((item) => ({
      ...item,
      score: getListingCompletenessScore(item.listing)
    }))
    .sort((left, right) => right.score - left.score);

  if (!rankedResults.length) {
    return {
      primarySource: '',
      primaryUrl: '',
      listing: null
    };
  }

  const primary = rankedResults[0];
  const fallback = rankedResults[1] || null;
  const mergedListing = {
    ...((fallback && fallback.listing) || {}),
    ...primary.listing,
    address: String(primary.listing.address || (fallback && fallback.listing.address) || address || '').trim(),
    location: String(primary.listing.location || (fallback && fallback.listing.location) || '').trim(),
    notes: String(primary.listing.notes || (fallback && fallback.listing.notes) || '').trim(),
    imageUrl: String(primary.listing.imageUrl || (fallback && fallback.listing.imageUrl) || '').trim(),
    source: primary.source,
    url: primary.url
  };

  return {
    primarySource: primary.source,
    primaryUrl: primary.url,
    listing: mergedListing
  };
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

function getTwilioVoiceConfig() {
  const messagingConfig = getTwilioMessagingConfig();
  return {
    ...messagingConfig,
    apiKeySid: String(process.env.TWILIO_API_KEY_SID || '').trim(),
    apiKeySecret: String(process.env.TWILIO_API_KEY_SECRET || '').trim(),
    twimlAppSid: String(process.env.TWILIO_TWIML_APP_SID || '').trim()
  };
}

function isTwilioConfigured(config = getTwilioMessagingConfig()) {
  return Boolean(config.accountSid && config.authToken && (config.messagingServiceSid || config.fromNumber));
}

function isTwilioVoiceConfigured(config = getTwilioVoiceConfig()) {
  return Boolean(config.accountSid && config.authToken && config.apiKeySid && config.apiKeySecret);
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

function buildTwilioVoiceIdentity(userLike) {
  if (!userLike || typeof userLike !== 'object') {
    return '';
  }

  const userId = Number(userLike.id) || 0;
  if (userId > 0) {
    return `fast-user-${userId}`;
  }

  const fallback = String(userLike.email || userLike.name || '').trim().toLowerCase();
  const sanitized = fallback.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized ? `fast-user-${sanitized}` : '';
}

function pruneTwilioVoicePresence(now = Date.now()) {
  for (const [identity, entry] of twilioVoicePresence.entries()) {
    if (!entry || (now - Number(entry.lastSeenAt || 0)) > TWILIO_VOICE_PRESENCE_WINDOW_MS) {
      twilioVoicePresence.delete(identity);
    }
  }
}

function listActiveTwilioVoicePresence() {
  pruneTwilioVoicePresence();
  return Array.from(twilioVoicePresence.values());
}

function registerTwilioVoicePresence(userLike) {
  const identity = buildTwilioVoiceIdentity(userLike);
  if (!identity) {
    return null;
  }

  const nextEntry = {
    identity,
    userId: Number(userLike.id) || 0,
    name: String(userLike.name || '').trim(),
    email: String(userLike.email || '').trim().toLowerCase(),
    role: String(userLike.role || '').trim().toLowerCase(),
    lastSeenAt: Date.now()
  };

  twilioVoicePresence.set(identity, nextEntry);
  pruneTwilioVoicePresence(nextEntry.lastSeenAt);
  return nextEntry;
}

function unregisterTwilioVoicePresence(userLike) {
  const identity = buildTwilioVoiceIdentity(userLike);
  if (!identity) {
    return false;
  }

  return twilioVoicePresence.delete(identity);
}

function createTwilioVoiceAccessToken(userLike) {
  const config = getTwilioVoiceConfig();
  if (!isTwilioVoiceConfigured(config)) {
    return null;
  }

  const identity = buildTwilioVoiceIdentity(userLike);
  if (!identity) {
    return null;
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  const accessToken = new AccessToken(config.accountSid, config.apiKeySid, config.apiKeySecret, {
    identity,
    ttl: TWILIO_VOICE_TOKEN_TTL_SECONDS
  });

  const voiceGrant = new VoiceGrant({
    incomingAllow: true,
    ...(config.twimlAppSid ? { outgoingApplicationSid: config.twimlAppSid } : {})
  });

  accessToken.addGrant(voiceGrant);

  return {
    identity,
    token: accessToken.toJwt(),
    expiresIn: TWILIO_VOICE_TOKEN_TTL_SECONDS
  };
}

function sanitizeTwilioVoiceRoomName(value) {
  const normalized = String(value || 'community-voice-lounge')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.slice(0, 64) || 'community-voice-lounge';
}

function buildTwilioIncomingVoiceResponse(req) {
  const config = getTwilioVoiceConfig();
  const response = new twilio.twiml.VoiceResponse();
  const activePresence = listActiveTwilioVoicePresence();

  if (activePresence.length === 0) {
    response.say({ voice: 'Polly.Joanna' }, 'FAST is unavailable right now. Please try again shortly.');
    response.hangup();
    return response.toString();
  }

  const dial = response.dial({
    answerOnBridge: true,
    timeout: 20,
    ...(String(req.body?.To || config.fromNumber || '').trim() ? { callerId: String(req.body?.To || config.fromNumber || '').trim() } : {})
  });

  activePresence.slice(0, 20).forEach((entry) => {
    if (!entry || !entry.identity) {
      return;
    }
    dial.client(entry.identity);
  });

  return response.toString();
}

function buildTwilioVoiceLoungeResponse(req) {
  const response = new twilio.twiml.VoiceResponse();
  const roomName = sanitizeTwilioVoiceRoomName(req.body?.room);
  const dial = response.dial();

  dial.conference(
    {
      startConferenceOnEnter: true,
      endConferenceOnExit: false,
      beep: false,
      maxParticipants: 50
    },
    `fast-${roomName}`
  );

  return response.toString();
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

function normalizeTwilioPlatformIdentity(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  return normalizeSmsPhone(raw) || raw.toUpperCase();
}

function buildTwilioConversationKey(contactPhone, platformIdentity) {
  const normalizedContact = normalizeSmsPhone(contactPhone) || String(contactPhone || '').trim();
  const normalizedPlatform = normalizeTwilioPlatformIdentity(platformIdentity);
  if (!normalizedContact || !normalizedPlatform) {
    return '';
  }
  return `${normalizedContact}::${normalizedPlatform}`;
}

function getTwilioRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || String(req.protocol || '').trim() || 'https';
  const host = forwardedHost || String(req.get('host') || '').trim();
  if (!host) {
    return '';
  }
  return `${protocol}://${host}`;
}

function getTwilioWebhookRequestUrl(req) {
  const origin = getTwilioRequestOrigin(req);
  const originalUrl = String(req.originalUrl || req.url || '').trim();
  if (!origin || !originalUrl) {
    return '';
  }
  return `${origin}${originalUrl}`;
}

function buildTwilioWebhookUrl(req, pathName) {
  const origin = getTwilioRequestOrigin(req);
  if (!origin) {
    return '';
  }

  try {
    return new URL(String(pathName || '').trim() || '/', origin).toString();
  } catch (error) {
    return '';
  }
}

function listTwilioWebhookValidationUrls(req) {
  const originalUrl = String(req.originalUrl || req.url || '').trim();
  if (!originalUrl) {
    return [];
  }

  const candidates = new Set();
  const directUrl = getTwilioWebhookRequestUrl(req);
  if (directUrl) {
    candidates.add(directUrl);
  }

  const hostCandidates = [
    String(req.headers['x-forwarded-host'] || '').split(',')[0].trim(),
    String(req.get('host') || '').trim()
  ].filter(Boolean);
  const protocolCandidates = [
    String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim(),
    String(req.protocol || '').trim(),
    'https'
  ].filter(Boolean);
  const baseUrlCandidates = [
    String(process.env.PUBLIC_APP_URL || '').trim(),
    String(process.env.APP_URL || '').trim(),
    String(process.env.RENDER_EXTERNAL_URL || '').trim(),
    'https://fastbridgegroupllc.com',
    'https://fast-bridge-group-llc.onrender.com'
  ].filter(Boolean);

  protocolCandidates.forEach((protocol) => {
    hostCandidates.forEach((host) => {
      try {
        candidates.add(new URL(originalUrl, `${protocol}://${host}`).toString());
      } catch (error) {
        // Ignore malformed candidate URLs.
      }
    });
  });

  baseUrlCandidates.forEach((baseUrl) => {
    try {
      candidates.add(new URL(originalUrl, baseUrl).toString());
    } catch (error) {
      // Ignore malformed candidate URLs.
    }
  });

  return Array.from(candidates);
}

function isTwilioWebhookRequestValid(req) {
  const config = getTwilioMessagingConfig();
  if (!config.authToken) {
    return false;
  }

  const signature = String(req.headers['x-twilio-signature'] || '').trim();
  if (!signature) {
    return String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production';
  }

  const requestUrls = listTwilioWebhookValidationUrls(req);
  if (requestUrls.length === 0) {
    return false;
  }

  try {
    return requestUrls.some((requestUrl) => twilio.validateRequest(config.authToken, signature, requestUrl, req.body || {}));
  } catch (error) {
    return false;
  }
}

function safeJsonStringify(value, fallback = '{}') {
  try {
    return JSON.stringify(value ?? {});
  } catch (error) {
    return fallback;
  }
}

function getTwilioConversationDetails({ contactPhone, platformIdentity }) {
  const normalizedContactPhone = normalizeSmsPhone(contactPhone);
  const normalizedPlatformIdentity = normalizeTwilioPlatformIdentity(platformIdentity);
  return {
    contactPhone: normalizedContactPhone,
    platformIdentity: normalizedPlatformIdentity,
    conversationKey: buildTwilioConversationKey(normalizedContactPhone, normalizedPlatformIdentity)
  };
}

function getTwilioConversationDetailsFromPayload(payload, direction) {
  const inbound = String(direction || '').trim().toLowerCase() === 'inbound';
  const contactPhone = inbound ? payload?.From : payload?.To;
  const platformIdentity = payload?.MessagingServiceSid || (inbound ? payload?.To : payload?.From);
  return getTwilioConversationDetails({ contactPhone, platformIdentity });
}

function serializeTwilioInboxMessage(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  return {
    id: Number(row.id) || 0,
    messageSid: String(row.message_sid || '').trim(),
    conversationKey: String(row.conversation_key || '').trim(),
    campaignName: String(row.campaign_name || '').trim(),
    contactName: String(row.contact_name || '').trim(),
    contactPhone: String(row.contact_phone || '').trim(),
    platformIdentity: String(row.platform_identity || '').trim(),
    direction: String(row.direction || '').trim().toLowerCase() === 'inbound' ? 'inbound' : 'outgoing',
    body: String(row.body || '').trim(),
    status: String(row.status || '').trim(),
    errorCode: String(row.error_code || '').trim(),
    errorMessage: String(row.error_message || '').trim(),
    createdAt: normalizeApiTimestamp(row.created_at) || new Date().toISOString(),
    updatedAt: normalizeApiTimestamp(row.updated_at) || normalizeApiTimestamp(row.created_at) || new Date().toISOString(),
    readAt: normalizeApiTimestamp(row.read_at)
  };
}

async function getAuthenticatedUserFromBearerHeader(authHeader) {
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = Number(decoded?.id) || 0;
    if (!userId) {
      return null;
    }
    const userRow = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    return userRow || null;
  } catch (error) {
    return null;
  }
}

async function upsertTwilioInboxMessage(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const messageSid = String(record.messageSid || '').trim();
  const conversationKey = String(record.conversationKey || '').trim();
  const contactPhone = normalizeSmsPhone(record.contactPhone);
  const platformIdentity = normalizeTwilioPlatformIdentity(record.platformIdentity);
  const createdAt = normalizeApiTimestamp(record.createdAt) || new Date().toISOString();
  const updatedAt = normalizeApiTimestamp(record.updatedAt) || createdAt;
  const readAt = normalizeApiTimestamp(record.readAt);
  const payloadJson = safeJsonStringify(record.rawPayload || {});

  if (!conversationKey || !contactPhone || !platformIdentity) {
    return null;
  }

  if (messageSid) {
    await dbRun(
      `INSERT INTO twilio_inbox_messages (
         message_sid,
         account_sid,
         conversation_key,
         campaign_name,
         contact_name,
         contact_phone,
         platform_identity,
         owner_user_id,
         owner_name,
         owner_email,
         direction,
         body,
         status,
         error_code,
         error_message,
         raw_payload_json,
         created_at,
         updated_at,
         read_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(message_sid) DO UPDATE SET
         account_sid = excluded.account_sid,
         conversation_key = excluded.conversation_key,
         campaign_name = excluded.campaign_name,
         contact_name = excluded.contact_name,
         contact_phone = excluded.contact_phone,
         platform_identity = excluded.platform_identity,
         owner_user_id = COALESCE(excluded.owner_user_id, twilio_inbox_messages.owner_user_id),
         owner_name = COALESCE(NULLIF(excluded.owner_name, ''), twilio_inbox_messages.owner_name),
         owner_email = COALESCE(NULLIF(excluded.owner_email, ''), twilio_inbox_messages.owner_email),
         direction = excluded.direction,
         body = excluded.body,
         status = excluded.status,
         error_code = excluded.error_code,
         error_message = excluded.error_message,
         raw_payload_json = excluded.raw_payload_json,
         updated_at = excluded.updated_at,
         read_at = COALESCE(excluded.read_at, twilio_inbox_messages.read_at)`,
      [
        messageSid,
        String(record.accountSid || '').trim(),
        conversationKey,
        String(record.campaignName || '').trim(),
        String(record.contactName || '').trim(),
        contactPhone,
        platformIdentity,
        Number(record.ownerUserId) || null,
        String(record.ownerName || '').trim(),
        String(record.ownerEmail || '').trim().toLowerCase(),
        String(record.direction || '').trim().toLowerCase() === 'inbound' ? 'inbound' : 'outbound',
        String(record.body || '').trim(),
        String(record.status || '').trim(),
        String(record.errorCode || '').trim(),
        String(record.errorMessage || '').trim(),
        payloadJson,
        createdAt,
        updatedAt,
        readAt
      ]
    );

    return dbGet('SELECT * FROM twilio_inbox_messages WHERE message_sid = ?', [messageSid]);
  }

  const result = await dbRun(
    `INSERT INTO twilio_inbox_messages (
       account_sid,
       conversation_key,
       campaign_name,
       contact_name,
       contact_phone,
       platform_identity,
       owner_user_id,
       owner_name,
       owner_email,
       direction,
       body,
       status,
       error_code,
       error_message,
       raw_payload_json,
       created_at,
       updated_at,
       read_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(record.accountSid || '').trim(),
      conversationKey,
      String(record.campaignName || '').trim(),
      String(record.contactName || '').trim(),
      contactPhone,
      platformIdentity,
      Number(record.ownerUserId) || null,
      String(record.ownerName || '').trim(),
      String(record.ownerEmail || '').trim().toLowerCase(),
      String(record.direction || '').trim().toLowerCase() === 'inbound' ? 'inbound' : 'outgoing',
      String(record.body || '').trim(),
      String(record.status || '').trim(),
      String(record.errorCode || '').trim(),
      String(record.errorMessage || '').trim(),
      payloadJson,
      createdAt,
      updatedAt,
      readAt
    ]
  );

  return dbGet('SELECT * FROM twilio_inbox_messages WHERE id = ?', [result.lastID]);
}

async function listTwilioInboxConversations() {
  return dbAll(
    `SELECT
        base.conversation_key,
        base.contact_phone,
        base.platform_identity,
        COALESCE(
          NULLIF((
            SELECT contact_name
              FROM twilio_inbox_messages latest_name
             WHERE latest_name.conversation_key = base.conversation_key
               AND TRIM(COALESCE(latest_name.contact_name, '')) <> ''
             ORDER BY datetime(latest_name.created_at) DESC, latest_name.id DESC
             LIMIT 1
          ), ''),
          base.contact_phone
        ) AS contact_name,
        COALESCE((
          SELECT campaign_name
            FROM twilio_inbox_messages latest_campaign
           WHERE latest_campaign.conversation_key = base.conversation_key
             AND TRIM(COALESCE(latest_campaign.campaign_name, '')) <> ''
           ORDER BY datetime(latest_campaign.created_at) DESC, latest_campaign.id DESC
           LIMIT 1
        ), '') AS campaign_name,
        (
          SELECT body
            FROM twilio_inbox_messages latest_body
           WHERE latest_body.conversation_key = base.conversation_key
           ORDER BY datetime(latest_body.created_at) DESC, latest_body.id DESC
           LIMIT 1
        ) AS last_message_body,
        (
          SELECT created_at
            FROM twilio_inbox_messages latest_created
           WHERE latest_created.conversation_key = base.conversation_key
           ORDER BY datetime(latest_created.created_at) DESC, latest_created.id DESC
           LIMIT 1
        ) AS last_message_at,
        (
          SELECT direction
            FROM twilio_inbox_messages latest_direction
           WHERE latest_direction.conversation_key = base.conversation_key
           ORDER BY datetime(latest_direction.created_at) DESC, latest_direction.id DESC
           LIMIT 1
        ) AS last_direction,
        (
          SELECT status
            FROM twilio_inbox_messages latest_status
           WHERE latest_status.conversation_key = base.conversation_key
           ORDER BY datetime(latest_status.created_at) DESC, latest_status.id DESC
           LIMIT 1
        ) AS last_status,
        SUM(CASE WHEN base.direction = 'inbound' AND base.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
       FROM twilio_inbox_messages base
      GROUP BY base.conversation_key, base.contact_phone, base.platform_identity
      ORDER BY datetime(last_message_at) DESC, LOWER(contact_name) ASC`,
    []
  );
}

async function listTwilioInboxMessages(conversationKey) {
  return dbAll(
    `SELECT *
       FROM twilio_inbox_messages
      WHERE conversation_key = ?
      ORDER BY datetime(created_at) ASC, id ASC`,
    [String(conversationKey || '').trim()]
  );
}

async function getLatestTwilioConversationRow(conversationKey) {
  return dbGet(
    `SELECT *
       FROM twilio_inbox_messages
      WHERE conversation_key = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 1`,
    [String(conversationKey || '').trim()]
  );
}

async function markTwilioConversationRead(conversationKey) {
  await dbRun(
    `UPDATE twilio_inbox_messages
        SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
      WHERE conversation_key = ?
        AND direction = 'inbound'
        AND read_at IS NULL`,
    [String(conversationKey || '').trim()]
  );
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

function extractJsonPayloadFromText(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const candidates = [];
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    candidates.push(String(fencedMatch[1] || '').trim());
  }

  candidates.push(raw);

  const arrayStart = raw.indexOf('[');
  const arrayEnd = raw.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    candidates.push(raw.slice(arrayStart, arrayEnd + 1));
  }

  const objectStart = raw.indexOf('{');
  const objectEnd = raw.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(raw.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Try the next candidate.
    }
  }

  return null;
}

async function queryOpenAiForStructuredJson(systemPrompt, userPrompt, options = {}) {
  const apiKeys = getOpenAiApiKeyCandidates();
  if (apiKeys.length === 0) {
    return { ok: false, error: 'OpenAI API key is not configured.' };
  }

  if (typeof fetch !== 'function') {
    return { ok: false, error: 'This Node runtime does not support fetch.' };
  }

  const maxInputChars = Math.max(2000, Math.min(Number(options.maxInputChars) || 14000, 40000));
  const normalizedSystemPrompt = String(systemPrompt || '').trim();
  const normalizedUserPrompt = String(userPrompt || '').slice(0, maxInputChars);
  let lastError = 'OpenAI structured extraction failed.';

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
                  text: normalizedSystemPrompt
                }
              ]
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: normalizedUserPrompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        lastError = `OpenAI structured extraction failed (${response.status}): ${detail.slice(0, 300)}`;
        continue;
      }

      const payload = await response.json();
      const answer = extractOpenAiResponseText(payload);
      const parsed = extractJsonPayloadFromText(answer);
      if (!parsed) {
        lastError = 'OpenAI returned non-JSON output.';
        continue;
      }

      cachedOpenAiApiKey = apiKey;
      return { ok: true, payload: parsed };
    } catch (error) {
      lastError = error.message || 'OpenAI structured extraction failed.';
    }
  }

  return { ok: false, error: lastError };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '25mb' }));

function isTestUserRole(roleValue) {
  return String(roleValue || '').trim().toLowerCase() === TEST_USER_ROLE;
}

function shouldAllowTestUserMutation(pathname) {
  const normalizedPath = String(pathname || '').trim().toLowerCase();
  return normalizedPath === '/api/login'
    || normalizedPath === '/api/login/2fa'
    || normalizedPath === '/api/logout'
    || normalizedPath === '/api/verify';
}

function rejectTestUserWriteAccess(req, res, next) {
  const method = String(req.method || 'GET').trim().toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  if (shouldAllowTestUserMutation(req.path || req.originalUrl || '')) {
    next();
    return;
  }

  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (isTestUserRole(decoded?.role)) {
      res.status(403).json({ error: 'TEST USER accounts are browse-only and cannot perform this action.' });
      return;
    }
  } catch (error) {
    // Let route-level auth handlers return the appropriate auth error.
  }

  next();
}

app.use(rejectTestUserWriteAccess);
app.use(express.static(path.join(__dirname), {
  setHeaders(res, filePath) {
    if (String(path.extname(filePath) || '').toLowerCase() === '.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.post('/api/community/voice/join', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const roomName = sanitizeCommunityVoiceRoomName(req.body?.room);
  const clientId = String(req.body?.clientId || '').trim().slice(0, 160);
  if (!clientId) {
    return res.status(400).json({ error: 'A voice client ID is required.' });
  }

  const userId = Number(decoded.id) || 0;
  if (!userId) {
    return res.status(400).json({ error: 'Unable to resolve the signed-in user for voice chat.' });
  }

  const displayName = String(decoded.name || decoded.email || 'FAST User').trim() || 'FAST User';
  const role = String(decoded.role || '').trim() || 'user';
  const now = Date.now();
  const roomState = pruneCommunityVoiceRoom(roomName, getCommunityVoiceRoom(roomName, true)) || getCommunityVoiceRoom(roomName, true);

  let participant = roomState.participants.find((entry) => entry.clientId === clientId && Number(entry.userId) === userId) || null;
  if (!participant) {
    participant = {
      id: crypto.randomUUID(),
      clientId,
      userId,
      name: displayName,
      role,
      joinedAt: now,
      lastSeenAt: now
    };
    roomState.participants.push(participant);
  } else {
    participant.name = displayName;
    participant.role = role;
    participant.lastSeenAt = now;
  }

  return res.json({
    success: true,
    room: roomState.room,
    participant: serializeCommunityVoiceParticipant(participant),
    participants: roomState.participants.filter((entry) => entry.id !== participant.id).map(serializeCommunityVoiceParticipant),
    signalCursor: Math.max(0, Number(roomState.nextSignalId || 1) - 1)
  });
});

app.get('/api/community/voice/events', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const roomName = sanitizeCommunityVoiceRoomName(req.query?.room);
  const participantId = String(req.query?.participantId || '').trim();
  const after = Math.max(0, Number.parseInt(String(req.query?.after || '0'), 10) || 0);
  const userId = Number(decoded.id) || 0;
  const roomState = pruneCommunityVoiceRoom(roomName, getCommunityVoiceRoom(roomName, false));

  if (!roomState) {
    return res.json({ success: true, room: roomName, participants: [], signals: [], signalCursor: after });
  }

  const participant = roomState.participants.find((entry) => entry.id === participantId && Number(entry.userId) === userId) || null;
  if (!participant) {
    return res.status(404).json({ error: 'Voice lounge session not found. Join the room again.' });
  }

  participant.lastSeenAt = Date.now();

  return res.json({
    success: true,
    room: roomState.room,
    participants: roomState.participants.filter((entry) => entry.id !== participant.id).map(serializeCommunityVoiceParticipant),
    signals: roomState.signals
      .filter((signal) => signal.toParticipantId === participant.id && Number(signal.id) > after)
      .map((signal) => ({
        id: signal.id,
        fromParticipantId: signal.fromParticipantId,
        type: signal.type,
        payload: signal.payload,
        createdAt: signal.createdAt
      })),
    signalCursor: Math.max(after, Number(roomState.nextSignalId || 1) - 1)
  });
});

app.post('/api/community/voice/signal', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const roomName = sanitizeCommunityVoiceRoomName(req.body?.room);
  const participantId = String(req.body?.participantId || '').trim();
  const toParticipantId = String(req.body?.toParticipantId || '').trim();
  const type = String(req.body?.type || '').trim().toLowerCase();
  const payload = req.body?.payload ?? null;
  const userId = Number(decoded.id) || 0;
  const roomState = pruneCommunityVoiceRoom(roomName, getCommunityVoiceRoom(roomName, false));

  if (!roomState) {
    return res.status(404).json({ error: 'Voice lounge room was not found.' });
  }

  const sender = roomState.participants.find((entry) => entry.id === participantId && Number(entry.userId) === userId) || null;
  if (!sender) {
    return res.status(404).json({ error: 'Voice lounge session not found. Join the room again.' });
  }

  const recipient = roomState.participants.find((entry) => entry.id === toParticipantId) || null;
  if (!recipient) {
    return res.status(404).json({ error: 'The target voice participant is no longer active.' });
  }

  if (!['offer', 'answer', 'candidate'].includes(type)) {
    return res.status(400).json({ error: 'Unsupported voice signal type.' });
  }

  sender.lastSeenAt = Date.now();
  const signalId = roomState.nextSignalId++;
  roomState.signals.push({
    id: signalId,
    fromParticipantId: sender.id,
    toParticipantId: recipient.id,
    type,
    payload,
    createdAt: Date.now()
  });

  return res.json({ success: true, signalId });
});

app.post('/api/community/voice/leave', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const roomName = sanitizeCommunityVoiceRoomName(req.body?.room);
  const participantId = String(req.body?.participantId || '').trim();
  const userId = Number(decoded.id) || 0;
  const roomState = getCommunityVoiceRoom(roomName, false);

  if (!roomState) {
    return res.json({ success: true, room: roomName, activeParticipants: 0 });
  }

  roomState.participants = roomState.participants.filter((entry) => !(entry.id === participantId && Number(entry.userId) === userId));
  pruneCommunityVoiceRoom(roomName, roomState);
  const activeRoom = getCommunityVoiceRoom(roomName, false);

  return res.json({
    success: true,
    room: roomName,
    activeParticipants: activeRoom ? activeRoom.participants.length : 0
  });
});

app.post('/api/import-listing-by-address', async (req, res) => {
  const rawAddress = String(req.body?.address || '').trim();
  const requestedSource = String(req.body?.source || '').trim().toLowerCase();
  const requestedSources = requestedSource === 'redfin'
    ? ['redfin']
    : ['zillow', 'redfin'];

  if (!rawAddress) {
    return res.status(400).json({ error: requestedSource === 'redfin' ? 'Add a property address before searching Redfin.' : 'Add a property address before searching Zillow and Redfin.' });
  }

  const sourceResults = await Promise.allSettled(requestedSources.map(async (source) => {
    const url = await searchListingUrlByAddress(rawAddress, source);
    if (!url) {
      return {
        source,
        url: '',
        listing: null
      };
    }

    try {
      const imported = await fetchImportedListingFromUrl(url, source);
      return imported;
    } catch (error) {
      return {
        source,
        url,
        listing: null,
        error: error && error.message ? error.message : 'The listing could not be imported.'
      };
    }

  }));

  const links = {};
  const importedListings = [];
  const missingSources = [];
  const blockedSources = [];

  sourceResults.forEach((result) => {
    if (result.status !== 'fulfilled') {
      const message = String(result.reason && result.reason.message || '').trim().toLowerCase();
      if (message.includes('bot protection')) {
        const sourceMatch = message.includes('redfin') ? 'redfin' : (message.includes('zillow') ? 'zillow' : '');
        if (sourceMatch) {
          blockedSources.push(sourceMatch);
        }
      }
      return;
    }

    const value = result.value || {};
    const source = String(value.source || '').trim().toLowerCase();
    if (!source) {
      return;
    }

    if (value.url) {
      links[source] = value.url;
    } else {
      missingSources.push(source);
    }

    if (value.listing) {
      importedListings.push(value);
    }
  });

  if (!Object.keys(links).length) {
    if (blockedSources.length) {
      const label = Array.from(new Set(blockedSources)).map((source) => source === 'redfin' ? 'Redfin' : 'Zillow').join(' and ');
      return res.status(502).json({ error: `${label} blocked automated address lookup right now. Paste a direct listing link to keep importing this property.` });
    }
    return res.status(404).json({ error: requestedSource === 'redfin' ? 'FAST could not find a matching Redfin listing for this address.' : 'FAST could not find a matching Zillow or Redfin listing for this address.' });
  }

  const merged = mergeImportedListingsByQuality(importedListings, rawAddress);
  if (!merged.listing) {
    return res.status(422).json({ error: 'FAST found listing links but could not import enough public property details from them.' });
  }

  return res.json({
    address: rawAddress,
    links,
    missingSources,
    primarySource: merged.primarySource,
    primaryUrl: merged.primaryUrl,
    listing: merged.listing
  });
});

app.post('/api/import-listing-preview', async (req, res) => {
  const rawUrl = String(req.body?.url || '').trim();
  const requestedSource = String(req.body?.source || '').trim().toLowerCase();

  if (!rawUrl) {
    return res.status(400).json({ error: 'Paste a Zillow or Redfin listing URL first.' });
  }

  try {
    const imported = await fetchImportedListingFromUrl(rawUrl, requestedSource);
    return res.json({ listing: imported.listing });
  } catch (error) {
    const message = error && error.message ? error.message : 'The listing import failed.';
    const normalizedMessage = String(message).toLowerCase();

    if (normalizedMessage.includes('valid property url')) {
      return res.status(400).json({ error: message });
    }
    if (normalizedMessage.includes('supported')) {
      return res.status(400).json({ error: message });
    }
    if (normalizedMessage.includes('does not look like')) {
      return res.status(400).json({ error: message });
    }
    if (normalizedMessage.includes('could not be loaded')) {
      return res.status(502).json({ error: message });
    }
    if (normalizedMessage.includes('could not read enough')) {
      return res.status(422).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

const DATABASE_FILE_PATH = ensureDatabaseStorageReady(resolveDatabaseFilePath());

if (isUsingFallbackDatabasePath(DATABASE_FILE_PATH)) {
  console.warn('SQLite is using the app directory fallback path. Configure DATABASE_PATH or a persistent storage mount to prevent message history loss on redeploys.');

  if (isProductionEnvironment()) {
    throw new Error('Production requires persistent SQLite storage. Set DATABASE_PATH, RENDER_DISK_MOUNT_PATH, PERSISTENT_STORAGE_PATH, or DATA_DIR.');
  }
}

// Database connection
const db = new sqlite3.Database(DATABASE_FILE_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database:', DATABASE_FILE_PATH);
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
      access_granted INTEGER DEFAULT 0,
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
      db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN avatar_upload_id TEXT`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN access_granted INTEGER DEFAULT 0`, () => {});
      syncIsaacAdminAccount();
      syncSteveAdminAccount();
      syncLoriaBrokerAccount();
      syncPublicTestAccount();
      purgeSuppressedAccounts().catch((error) => {
        console.error('Failed to purge suppressed accounts during startup:', error);
      });
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
    CREATE TABLE IF NOT EXISTS property_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_name TEXT NOT NULL,
      seller_email TEXT NOT NULL,
      seller_phone TEXT,
      sms_consent INTEGER DEFAULT 0,
      sms_consent_text TEXT,
      sms_consent_at DATETIME,
      property_address TEXT NOT NULL,
      property_city TEXT,
      property_state TEXT,
      property_zip TEXT,
      property_type TEXT,
      bedrooms TEXT,
      bathrooms TEXT,
      square_feet TEXT,
      asking_price TEXT,
      timeline TEXT,
      condition_issues TEXT,
      issue_notes TEXT,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating property_submissions table:', err);
    } else {
      console.log('Property submissions table ready');
    }
  });

  db.run(`ALTER TABLE property_submissions ADD COLUMN sms_consent INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE property_submissions ADD COLUMN sms_consent_text TEXT`, () => {});
  db.run(`ALTER TABLE property_submissions ADD COLUMN sms_consent_at DATETIME`, () => {});

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
      repairApprovedSmtpUsersFromRequests();
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS mls_import_runs (
      id TEXT PRIMARY KEY,
      requester_user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      message TEXT,
      page_count INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      persisted_row_count INTEGER DEFAULT 0,
      started_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER,
      error TEXT DEFAULT ''
    )
  `, (err) => {
    if (err) {
      console.error('Error creating mls_import_runs table:', err);
    } else {
      console.log('MLS import runs table ready');
      db.run('ALTER TABLE mls_import_runs ADD COLUMN persisted_row_count INTEGER DEFAULT 0', (alterError) => {
        if (alterError && !String(alterError.message || '').includes('duplicate column name')) {
          console.error('Error ensuring persisted_row_count on mls_import_runs:', alterError);
        }
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_mls_import_runs_requester_updated ON mls_import_runs(requester_user_id, updated_at DESC)', () => {});
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS mls_import_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL,
      import_run_id TEXT,
      match_key TEXT NOT NULL,
      import_date TEXT,
      property_address TEXT,
      la_name TEXT,
      lo_phone TEXT,
      offers_email TEXT,
      la_cell TEXT,
      la_direct TEXT,
      la_email TEXT,
      status TEXT,
      pdf_file TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_user_id, match_key)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating mls_import_rows table:', err);
    } else {
      console.log('MLS import rows table ready');
      db.run('ALTER TABLE mls_import_rows ADD COLUMN la_direct TEXT', (alterError) => {
        if (alterError && !String(alterError.message || '').includes('duplicate column name')) {
          console.error('Error ensuring la_direct on mls_import_rows:', alterError);
        }
      });
      db.run('ALTER TABLE mls_import_rows ADD COLUMN la_email TEXT', (alterError) => {
        if (alterError && !String(alterError.message || '').includes('duplicate column name')) {
          console.error('Error ensuring la_email on mls_import_rows:', alterError);
        }
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_mls_import_rows_owner_updated ON mls_import_rows(owner_user_id, updated_at DESC, id DESC)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_mls_import_rows_run ON mls_import_rows(import_run_id)', () => {});
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

  db.run(`
    CREATE TABLE IF NOT EXISTS user_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_user_id INTEGER NOT NULL,
      recipient_user_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY(sender_user_id) REFERENCES users(id),
      FOREIGN KEY(recipient_user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_messages table:', err);
    } else {
      console.log('User messages table ready');
      db.run(`ALTER TABLE user_messages ADD COLUMN edited_at DATETIME`, () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_user_messages_pair_created ON user_messages(sender_user_id, recipient_user_id, created_at)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_read ON user_messages(recipient_user_id, read_at)', () => {});
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS twilio_inbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_sid TEXT UNIQUE,
      account_sid TEXT,
      conversation_key TEXT NOT NULL,
      campaign_name TEXT,
      contact_name TEXT,
      contact_phone TEXT NOT NULL,
      platform_identity TEXT NOT NULL,
      owner_user_id INTEGER,
      owner_name TEXT,
      owner_email TEXT,
      direction TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT,
      error_code TEXT,
      error_message TEXT,
      raw_payload_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Error creating twilio_inbox_messages table:', err);
    } else {
      console.log('Twilio inbox messages table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_twilio_inbox_conversation_created ON twilio_inbox_messages(conversation_key, created_at, id)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_twilio_inbox_unread ON twilio_inbox_messages(direction, read_at, created_at)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_twilio_inbox_contact_phone ON twilio_inbox_messages(contact_phone, created_at DESC)', () => {});
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS subscription_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      plan_key TEXT NOT NULL DEFAULT 'basic',
      billing_name TEXT,
      billing_email TEXT,
      billing_phone TEXT,
      company_name TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT,
      state_region TEXT,
      postal_code TEXT,
      country TEXT,
      cardholder_name TEXT,
      card_brand TEXT,
      card_last4 TEXT,
      subscription_status TEXT NOT NULL DEFAULT 'inactive',
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      activated_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating subscription_profiles table:', err);
    } else {
      console.log('Subscription profiles table ready');
      db.run(`ALTER TABLE subscription_profiles ADD COLUMN stripe_payment_method_id TEXT`, () => {});
      syncStevenCastilloUserAccount();
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS user_security_settings (
      user_id INTEGER PRIMARY KEY,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      app_enabled INTEGER NOT NULL DEFAULT 0,
      totp_secret TEXT,
      app_verified_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_security_settings table:', err);
    } else {
      console.log('User security settings table ready');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS app_feature_settings (
      setting_key TEXT PRIMARY KEY,
      config_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by_user_id INTEGER,
      updated_by_email TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating app_feature_settings table:', err);
    } else {
      console.log('App feature settings table ready');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME,
      revoked_reason TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating auth_sessions table:', err);
    } else {
      console.log('Auth sessions table ready');
      db.all('SELECT id FROM auth_sessions WHERE revoked_at IS NOT NULL', (selectError, rows) => {
        if (selectError) {
          return;
        }
        rows.forEach((row) => {
          if (row && row.id) {
            revokedSessionIds.add(String(row.id));
          }
        });
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS user_uploads (
      id TEXT PRIMARY KEY,
      owner_user_id INTEGER NOT NULL,
      scope TEXT NOT NULL,
      context_key TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      stored_file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT,
      storage_provider TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(owner_user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_uploads table:', err);
    } else {
      console.log('User uploads table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_uploads_owner_scope_context ON user_uploads(owner_user_id, scope, context_key, updated_at DESC)', () => {});
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS closed_deals (
      id TEXT PRIMARY KEY,
      owner_user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      property_address TEXT,
      close_date TEXT,
      wholesale_fee REAL NOT NULL DEFAULT 0,
      earned_amount REAL NOT NULL DEFAULT 0,
      note TEXT,
      documents_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(owner_user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating closed_deals table:', err);
    } else {
      console.log('Closed deals table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_closed_deals_owner_updated ON closed_deals(owner_user_id, updated_at DESC, created_at DESC)', () => {});
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

function normalizeMlsImportSpreadsheetValue(value) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeMlsImportStatusLabel(value) {
  const normalized = normalizeMlsImportSpreadsheetValue(value).toLowerCase();
  if (!normalized) {
    return '';
  }
  if (/\bact(?:ive)?\s*u\/?c\b|\bact\s+uc\b|\bauct\b/.test(normalized)) {
    return 'Active Under Contract';
  }
  if (normalized.includes('active under contract') || /\bauct\b/.test(normalized)) {
    return 'Active Under Contract';
  }
  if (normalized.includes('under contract') || /\bu\/?c\b/.test(normalized)) {
    return 'Active Under Contract';
  }
  if (/\bpend(?:ing)?\b/.test(normalized)) {
    return 'Pending';
  }
  if (normalized.includes('pending') || normalized.includes('contingent') || normalized.includes('backup')) {
    return 'Pending';
  }
  if (/\bhold\b|\bhld\b/.test(normalized)) {
    return 'Hold';
  }
  if (normalized.includes('hold')) {
    return 'Hold';
  }
  if (/\boff\b/.test(normalized) && normalized.includes('market')) {
    return 'Off Market';
  }
  if (normalized.includes('temporarily off market') || normalized.includes('off market') || normalized.includes('withdrawn') || normalized.includes('cancelled') || normalized.includes('canceled') || normalized.includes('expired')) {
    return 'Off Market';
  }
  if (normalized.includes('coming soon')) {
    return 'Coming Soon';
  }
  if (normalized.includes('closed')) {
    return 'Closed';
  }
  if (normalized.includes('sold')) {
    return 'Sold';
  }
  if (normalized.includes('active')) {
    return 'Active';
  }
  return normalized
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function normalizeMlsImportSpreadsheetDate(value) {
  const normalized = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? normalized
    : new Date().toISOString().slice(0, 10);
}

function hasMeaningfulMlsImportSpreadsheetRow(rowLike) {
  const row = rowLike && typeof rowLike === 'object' ? rowLike : {};
  return [
    row.importDate,
    row.propertyAddress,
    row.laName,
    row.loPhone,
    row.offersEmail,
    row.laCell,
    row.laDirect,
    row.laEmail,
    row.status,
    row.pdfFile
  ].some((value) => Boolean(normalizeMlsImportSpreadsheetValue(value)));
}

function normalizeMlsImportSpreadsheetRow(rowLike, defaults = {}) {
  const row = rowLike && typeof rowLike === 'object' ? rowLike : {};
  return {
    id: Number.isInteger(Number(row.id)) ? Number(row.id) : null,
    matchKey: normalizeMlsImportSpreadsheetValue(row.matchKey || defaults.matchKey || ''),
    importDate: normalizeMlsImportSpreadsheetDate(row.importDate || defaults.importDate),
    propertyAddress: normalizeMlsImportSpreadsheetValue(row.propertyAddress || defaults.propertyAddress),
    laName: normalizeMlsImportSpreadsheetValue(row.laName || defaults.laName),
    loPhone: normalizeMlsImportSpreadsheetValue(row.loPhone || defaults.loPhone),
    offersEmail: normalizeMlsImportSpreadsheetValue(row.offersEmail || defaults.offersEmail),
    laCell: normalizeMlsImportSpreadsheetValue(row.laCell || defaults.laCell),
    laDirect: normalizeMlsImportSpreadsheetValue(row.laDirect || defaults.laDirect),
    laEmail: normalizeMlsImportSpreadsheetValue(row.laEmail || defaults.laEmail),
    status: normalizeMlsImportStatusLabel(row.status || defaults.status),
    pdfFile: normalizeMlsImportSpreadsheetValue(row.pdfFile || defaults.pdfFile)
  };
}

function createMlsImportSpreadsheetMatchKey(rowLike) {
  const row = normalizeMlsImportSpreadsheetRow(rowLike);
  const propertyAddressKey = createMlsImportAddressMergeKey(row.propertyAddress);
  const offersEmailKey = row.offersEmail.toLowerCase();
  const laCellKey = row.laCell.toLowerCase();
  const laDirectKey = row.laDirect.toLowerCase();
  const laEmailKey = row.laEmail.toLowerCase();
  const loPhoneKey = row.loPhone.toLowerCase();

  if (propertyAddressKey) {
    return [propertyAddressKey, offersEmailKey, laCellKey, laDirectKey, laEmailKey, loPhoneKey].join('|');
  }

  return row.matchKey || `manual|${crypto.randomUUID()}`;
}

function mergeMlsImportSpreadsheetRows(previousRowLike, nextRowLike, defaults = {}) {
  const previousRow = normalizeMlsImportSpreadsheetRow(previousRowLike, defaults);
  const nextRow = normalizeMlsImportSpreadsheetRow(nextRowLike, defaults);

  return {
    id: nextRow.id || previousRow.id || null,
    matchKey: nextRow.matchKey || previousRow.matchKey,
    importDate: nextRow.importDate || previousRow.importDate,
    propertyAddress: mergeMlsImportRowValues(previousRow.propertyAddress, nextRow.propertyAddress),
    laName: mergeMlsImportRowValues(previousRow.laName, nextRow.laName),
    loPhone: mergeMlsImportRowValues(previousRow.loPhone, nextRow.loPhone),
    offersEmail: mergeMlsImportRowValues(previousRow.offersEmail, nextRow.offersEmail),
    laCell: mergeMlsImportRowValues(previousRow.laCell, nextRow.laCell),
    laDirect: mergeMlsImportRowValues(previousRow.laDirect, nextRow.laDirect),
    laEmail: mergeMlsImportRowValues(previousRow.laEmail, nextRow.laEmail),
    status: mergeMlsImportRowValues(previousRow.status, nextRow.status),
    pdfFile: nextRow.pdfFile || previousRow.pdfFile
  };
}

function mapMlsImportSpreadsheetRowRecord(rowLike) {
  const row = rowLike && typeof rowLike === 'object' ? rowLike : {};
  return {
    id: Number(row.id) || 0,
    matchKey: normalizeMlsImportSpreadsheetValue(row.match_key || row.matchKey || ''),
    importDate: normalizeMlsImportSpreadsheetDate(row.import_date || row.importDate),
    propertyAddress: normalizeMlsImportSpreadsheetValue(row.property_address || row.propertyAddress),
    laName: normalizeMlsImportSpreadsheetValue(row.la_name || row.laName),
    loPhone: normalizeMlsImportSpreadsheetValue(row.lo_phone || row.loPhone),
    offersEmail: normalizeMlsImportSpreadsheetValue(row.offers_email || row.offersEmail),
    laCell: normalizeMlsImportSpreadsheetValue(row.la_cell || row.laCell),
    laDirect: normalizeMlsImportSpreadsheetValue(row.la_direct || row.laDirect),
    laEmail: normalizeMlsImportSpreadsheetValue(row.la_email || row.laEmail),
    status: normalizeMlsImportStatusLabel(row.status),
    pdfFile: normalizeMlsImportSpreadsheetValue(row.pdf_file || row.pdfFile)
  };
}

async function countMlsImportSpreadsheetRowsForUser(ownerUserId) {
  const row = await dbGet('SELECT COUNT(*) AS total FROM mls_import_rows WHERE owner_user_id = ?', [ownerUserId]);
  return Math.max(0, Number(row && row.total) || 0);
}

async function loadMlsImportSpreadsheetRowsForUser(ownerUserId, options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 150, 500));
  const offset = Math.max(0, Number(options.offset) || 0);
  const [rows, totalCount] = await Promise.all([
    dbAll(
      `SELECT id, match_key, import_date, property_address, la_name, lo_phone, offers_email, la_cell, la_direct, la_email, status, pdf_file
       FROM mls_import_rows
       WHERE owner_user_id = ?
       ORDER BY datetime(updated_at) DESC, id DESC
       LIMIT ? OFFSET ?`,
      [ownerUserId, limit, offset]
    ),
    countMlsImportSpreadsheetRowsForUser(ownerUserId)
  ]);

  return {
    rows: Array.isArray(rows) ? rows.map(mapMlsImportSpreadsheetRowRecord) : [],
    totalCount,
    limit,
    offset
  };
}

async function persistMlsImportSpreadsheetRowsForUser(ownerUserId, rows, options = {}) {
  const normalizedOwnerUserId = Number(ownerUserId) || 0;
  const importRunId = normalizeMlsImportSpreadsheetValue(options.importRunId || '');
  const defaultPdfFile = normalizeMlsImportSpreadsheetValue(options.pdfFile || '');
  const sourceRows = Array.isArray(rows) ? rows : [];
  const savedRows = [];
  let createdCount = 0;
  let updatedCount = 0;
  const existingRows = await dbAll('SELECT * FROM mls_import_rows WHERE owner_user_id = ?', [normalizedOwnerUserId]);
  const existingRowsById = new Map();
  const existingRowsByMatchKey = new Map();
  const existingRowsByAddressKey = new Map();

  existingRows.forEach((rowRecord) => {
    const mappedRow = mapMlsImportSpreadsheetRowRecord(rowRecord);
    const addressKey = createMlsImportAddressMergeKey(mappedRow.propertyAddress);

    existingRowsById.set(mappedRow.id, mappedRow);
    if (mappedRow.matchKey) {
      existingRowsByMatchKey.set(mappedRow.matchKey, mappedRow);
    }
    if (addressKey && !existingRowsByAddressKey.has(addressKey)) {
      existingRowsByAddressKey.set(addressKey, mappedRow);
    }
  });

  const cacheSavedRow = (rowLike) => {
    const mappedRow = mapMlsImportSpreadsheetRowRecord(rowLike);
    const addressKey = createMlsImportAddressMergeKey(mappedRow.propertyAddress);

    existingRowsById.set(mappedRow.id, mappedRow);
    if (mappedRow.matchKey) {
      existingRowsByMatchKey.set(mappedRow.matchKey, mappedRow);
    }
    if (addressKey) {
      existingRowsByAddressKey.set(addressKey, mappedRow);
    }

    return mappedRow;
  };

  for (const rowLike of sourceRows) {
    const normalizedRow = normalizeMlsImportSpreadsheetRow(rowLike, { pdfFile: defaultPdfFile });
    if (!hasMeaningfulMlsImportSpreadsheetRow(normalizedRow)) {
      continue;
    }

    const addressKey = createMlsImportAddressMergeKey(normalizedRow.propertyAddress);
    let matchKey = createMlsImportSpreadsheetMatchKey({ ...normalizedRow, matchKey: normalizedRow.matchKey });
    let desiredPdfFile = normalizedRow.pdfFile || defaultPdfFile;

    let savedRow = null;
    if (normalizedRow.id) {
      const existingById = existingRowsById.get(normalizedRow.id) || null;

      if (existingById) {
        const mergedRow = mergeMlsImportSpreadsheetRows(existingById, normalizedRow, { pdfFile: defaultPdfFile });
        matchKey = createMlsImportSpreadsheetMatchKey(mergedRow);
        desiredPdfFile = mergedRow.pdfFile || defaultPdfFile;
        await dbRun(
          `UPDATE mls_import_rows
           SET import_run_id = COALESCE(NULLIF(?, ''), import_run_id),
               match_key = ?,
               import_date = ?,
               property_address = ?,
               la_name = ?,
               lo_phone = ?,
               offers_email = ?,
               la_cell = ?,
                 la_direct = ?,
                 la_email = ?,
               status = ?,
               pdf_file = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND owner_user_id = ?`,
          [
            importRunId,
            matchKey,
            mergedRow.importDate,
            mergedRow.propertyAddress,
            mergedRow.laName,
            mergedRow.loPhone,
            mergedRow.offersEmail,
            mergedRow.laCell,
            mergedRow.laDirect,
            mergedRow.laEmail,
            mergedRow.status,
            desiredPdfFile,
            normalizedRow.id,
            normalizedOwnerUserId
          ]
        );
        savedRow = cacheSavedRow(await dbGet('SELECT * FROM mls_import_rows WHERE id = ?', [normalizedRow.id]));
        updatedCount += 1;
      }
    }

    if (!savedRow) {
      const existingByMatchKey = existingRowsByMatchKey.get(matchKey) || (addressKey ? existingRowsByAddressKey.get(addressKey) || null : null);

      if (existingByMatchKey) {
        const mergedRow = mergeMlsImportSpreadsheetRows(existingByMatchKey, normalizedRow, { pdfFile: defaultPdfFile });
        matchKey = createMlsImportSpreadsheetMatchKey(mergedRow);
        desiredPdfFile = mergedRow.pdfFile || defaultPdfFile;
        await dbRun(
          `UPDATE mls_import_rows
           SET import_run_id = COALESCE(NULLIF(?, ''), import_run_id),
               match_key = ?,
               import_date = ?,
               property_address = ?,
               la_name = ?,
               lo_phone = ?,
               offers_email = ?,
               la_cell = ?,
                 la_direct = ?,
                 la_email = ?,
               status = ?,
               pdf_file = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            importRunId,
            matchKey,
            mergedRow.importDate,
            mergedRow.propertyAddress,
            mergedRow.laName,
            mergedRow.loPhone,
            mergedRow.offersEmail,
            mergedRow.laCell,
            mergedRow.laDirect,
            mergedRow.laEmail,
            mergedRow.status,
            desiredPdfFile,
            existingByMatchKey.id
          ]
        );
        savedRow = cacheSavedRow(await dbGet('SELECT * FROM mls_import_rows WHERE id = ?', [existingByMatchKey.id]));
        updatedCount += 1;
      } else {
        const insertResult = await dbRun(
          `INSERT INTO mls_import_rows (
            owner_user_id,
            import_run_id,
            match_key,
            import_date,
            property_address,
            la_name,
            lo_phone,
            offers_email,
            la_cell,
            la_direct,
            la_email,
            status,
            pdf_file
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            normalizedOwnerUserId,
            importRunId,
            matchKey,
            normalizedRow.importDate,
            normalizedRow.propertyAddress,
            normalizedRow.laName,
            normalizedRow.loPhone,
            normalizedRow.offersEmail,
            normalizedRow.laCell,
            normalizedRow.laDirect,
            normalizedRow.laEmail,
            normalizedRow.status,
            desiredPdfFile
          ]
        );
        savedRow = cacheSavedRow(await dbGet('SELECT * FROM mls_import_rows WHERE id = ?', [insertResult.lastID]));
        createdCount += 1;
      }
    }

    if (savedRow) {
      savedRows.push(mapMlsImportSpreadsheetRowRecord(savedRow));
    }
  }

  return {
    rows: savedRows,
    createdCount,
    updatedCount,
    totalCount: await countMlsImportSpreadsheetRowsForUser(normalizedOwnerUserId)
  };
}

async function clearMlsImportSpreadsheetRowsForUser(ownerUserId) {
  const normalizedOwnerUserId = Number(ownerUserId) || 0;
  const clearedAt = Date.now();
  let cancelledJobCount = 0;

  mlsImportSpreadsheetClearedAtByUser.set(normalizedOwnerUserId, clearedAt);
  mlsImportPdfJobs.forEach((job, jobId) => {
    if (Number(job && job.requesterId) === normalizedOwnerUserId) {
      mlsImportPdfJobs.delete(jobId);
      cancelledJobCount += 1;
    }
  });

  await dbRun('DELETE FROM mls_import_rows WHERE owner_user_id = ?', [normalizedOwnerUserId]);
  await dbRun('DELETE FROM mls_import_runs WHERE requester_user_id = ?', [normalizedOwnerUserId]);

  return {
    clearedAt,
    cancelledJobCount
  };
}

async function cancelMlsImportPdfJobForUser(jobId, ownerUserId) {
  const normalizedJobId = String(jobId || '').trim();
  const normalizedOwnerUserId = Number(ownerUserId) || 0;
  if (!normalizedJobId || !normalizedOwnerUserId) {
    return null;
  }

  const currentJob = mlsImportPdfJobs.get(normalizedJobId) || await loadMlsImportPdfJobRecord(normalizedJobId);
  if (!currentJob) {
    return null;
  }

  if (Number(currentJob.requesterId) !== normalizedOwnerUserId) {
    return false;
  }

  const normalizedStatus = String(currentJob.status || '').trim().toLowerCase();
  if (normalizedStatus === 'completed' || normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
    mlsImportPdfJobs.delete(normalizedJobId);
    return currentJob;
  }

  const cancelledJob = {
    ...currentJob,
    status: 'cancelled',
    message: 'MLS PDF import was cancelled.',
    progressPercent: 100,
    extracted: null,
    error: '',
    updatedAt: Date.now()
  };

  await persistMlsImportPdfJobRecord(cancelledJob);
  mlsImportPdfJobs.delete(normalizedJobId);
  return cancelledJob;
}

function wasMlsImportSpreadsheetClearedSince(ownerUserId, startedAt) {
  const normalizedOwnerUserId = Number(ownerUserId) || 0;
  const clearedAt = Number(mlsImportSpreadsheetClearedAtByUser.get(normalizedOwnerUserId)) || 0;
  return Boolean(clearedAt && clearedAt >= (Number(startedAt) || 0));
}

function mapMlsImportPdfJobRecord(rowLike) {
  if (!rowLike || typeof rowLike !== 'object') {
    return null;
  }

  const status = String(rowLike.status || 'queued').trim() || 'queued';
  const updatedAt = Number(rowLike.updated_at || rowLike.updatedAt) || Number(rowLike.started_at || rowLike.startedAt) || Date.now();

  return {
    id: String(rowLike.id || '').trim(),
    requesterId: Number(rowLike.requester_user_id || rowLike.requesterId) || 0,
    fileName: String(rowLike.file_name || rowLike.fileName || '').trim(),
    status,
    message: String(rowLike.message || '').trim(),
    pageCount: Number(rowLike.page_count || rowLike.pageCount) || 0,
    progressPercent: Math.max(0, Math.min(100, Number(rowLike.progress_percent || rowLike.progressPercent) || 0)),
    persistedRowCount: Math.max(0, Number(rowLike.persisted_row_count || rowLike.persistedRowCount) || 0),
    startedAt: Number(rowLike.started_at || rowLike.startedAt) || updatedAt,
    updatedAt,
    completedAt: Number(rowLike.completed_at || rowLike.completedAt) || null,
    extracted: null,
    error: String(rowLike.error || '').trim()
  };
}

async function loadMlsImportPdfJobRecord(jobId) {
  const normalizedJobId = String(jobId || '').trim();
  if (!normalizedJobId) {
    return null;
  }

  const row = await dbGet('SELECT * FROM mls_import_runs WHERE id = ?', [normalizedJobId]);
  return mapMlsImportPdfJobRecord(row);
}

async function loadMlsImportPdfJobsForUser(ownerUserId, options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 25, 100));
  const rows = await dbAll(
    `SELECT id, requester_user_id, file_name, status, message, page_count, progress_percent, started_at, updated_at, completed_at, error
     FROM mls_import_runs
     WHERE requester_user_id = ?
     ORDER BY updated_at DESC, started_at DESC, id DESC
     LIMIT ?`,
    [Number(ownerUserId) || 0, limit]
  );

  return Array.isArray(rows)
    ? rows.map(mapMlsImportPdfJobRecord).filter(Boolean)
    : [];
}

async function persistMlsImportPdfJobRecord(job) {
  if (!job || typeof job !== 'object') {
    return;
  }

  const normalizedStatus = String(job.status || '').trim().toLowerCase();

  await dbRun(
    `INSERT INTO mls_import_runs (
      id,
      requester_user_id,
      file_name,
      status,
      message,
      page_count,
      progress_percent,
      persisted_row_count,
      started_at,
      updated_at,
      completed_at,
      error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      requester_user_id = excluded.requester_user_id,
      file_name = excluded.file_name,
      status = excluded.status,
      message = excluded.message,
      page_count = excluded.page_count,
      progress_percent = excluded.progress_percent,
      persisted_row_count = excluded.persisted_row_count,
      updated_at = excluded.updated_at,
      completed_at = excluded.completed_at,
      error = excluded.error`,
    [
      String(job.id || '').trim(),
      Number(job.requesterId) || 0,
      String(job.fileName || '').trim(),
      String(job.status || 'queued').trim(),
      String(job.message || '').trim(),
      Number(job.pageCount) || 0,
      Math.max(0, Math.min(100, Number(job.progressPercent) || 0)),
      Math.max(0, Number(job.persistedRowCount) || 0),
      Number(job.startedAt) || Date.now(),
      Number(job.updatedAt) || Date.now(),
      normalizedStatus === 'completed' || normalizedStatus === 'failed' || normalizedStatus === 'cancelled' ? Number(job.updatedAt) || Date.now() : null,
      String(job.error || '').trim()
    ]
  );
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

function dbAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Array.isArray(rows) ? rows : []);
    });
  });
}

function isTruthyEnvironmentValue(value) {
  return /^(1|true|yes|on|required)$/i.test(String(value || '').trim());
}

function isFalsyEnvironmentValue(value) {
  return /^(0|false|no|off|disable|disabled)$/i.test(String(value || '').trim());
}

function getPostgresMessageStoreConfig() {
  const connectionString = getFirstConfiguredEnvValue(
    'MESSAGE_DATABASE_URL',
    'MESSAGE_POSTGRES_URL',
    'POSTGRES_URL',
    'DATABASE_URL'
  );
  const host = getFirstConfiguredEnvValue('MESSAGE_PGHOST', 'PGHOST');
  const portRaw = getFirstConfiguredEnvValue('MESSAGE_PGPORT', 'PGPORT');
  const user = getFirstConfiguredEnvValue('MESSAGE_PGUSER', 'PGUSER');
  const password = getFirstConfiguredEnvValue('MESSAGE_PGPASSWORD', 'PGPASSWORD');
  const database = getFirstConfiguredEnvValue('MESSAGE_PGDATABASE', 'PGDATABASE');

  const hasDiscreteConfig = Boolean(host && user && database);
  if (!connectionString && !hasDiscreteConfig) {
    return null;
  }

  const explicitSslSetting = getFirstConfiguredEnvValue('MESSAGE_DATABASE_SSL', 'MESSAGE_PGSSL', 'PGSSLMODE', 'PGSSL');
  const useSsl = explicitSslSetting
    ? !isFalsyEnvironmentValue(explicitSslSetting)
    : false;
  const poolSize = Math.max(
    1,
    Number.parseInt(String(getFirstConfiguredEnvValue('MESSAGE_PG_POOL_SIZE') || MESSAGE_POSTGRES_DEFAULT_POOL_SIZE), 10) || MESSAGE_POSTGRES_DEFAULT_POOL_SIZE
  );

  const config = {
    max: poolSize,
    idleTimeoutMillis: 30 * 1000,
    connectionTimeoutMillis: 10 * 1000
  };

  if (connectionString) {
    config.connectionString = connectionString;
  } else {
    config.host = host;
    config.port = Math.max(1, Number.parseInt(String(portRaw || '5432'), 10) || 5432);
    config.user = user;
    config.password = password;
    config.database = database;
  }

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

function isPostgresMessageStoreEnabled() {
  return Boolean(userMessageStorePool);
}

function buildUserMessageStoreStatus() {
  return {
    configured: Boolean(latestUserMessageStoreHealth?.configured),
    available: Boolean(latestUserMessageStoreHealth?.available),
    dialect: isPostgresMessageStoreEnabled() ? 'postgres' : 'sqlite',
    checkedAt: latestUserMessageStoreHealth?.checkedAt || null,
    reason: latestUserMessageStoreHealth?.reason || null
  };
}

async function syncSqliteUserMessagesToPostgres(pool) {
  const existingCountResult = await pool.query('SELECT COUNT(*)::int AS row_count FROM user_messages');
  const existingCount = Number(existingCountResult.rows?.[0]?.row_count) || 0;
  if (existingCount > 0) {
    return { migrated: 0, skipped: true };
  }

  const sqliteRows = await dbAll(
    `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
       FROM user_messages
      ORDER BY id ASC`,
    []
  );

  for (const row of sqliteRows) {
    await pool.query(
      `INSERT INTO user_messages (id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         sender_user_id = EXCLUDED.sender_user_id,
         recipient_user_id = EXCLUDED.recipient_user_id,
         body = EXCLUDED.body,
         created_at = EXCLUDED.created_at,
         edited_at = EXCLUDED.edited_at,
         read_at = EXCLUDED.read_at`,
      [
        Number(row.id) || 0,
        Number(row.sender_user_id) || 0,
        Number(row.recipient_user_id) || 0,
        String(row.body || ''),
        normalizeApiTimestamp(row.created_at) || new Date().toISOString(),
        normalizeApiTimestamp(row.edited_at),
        normalizeApiTimestamp(row.read_at)
      ]
    );
  }

  await pool.query(
    `SELECT setval(
       pg_get_serial_sequence('user_messages', 'id'),
       GREATEST((SELECT COALESCE(MAX(id), 1) FROM user_messages), 1),
       true
     )`
  );

  return { migrated: sqliteRows.length, skipped: false };
}

async function initializePostgresMessageStore() {
  const postgresConfig = getPostgresMessageStoreConfig();
  if (!postgresConfig) {
    latestUserMessageStoreHealth = {
      configured: false,
      available: false,
      dialect: 'sqlite',
      checkedAt: new Date().toISOString(),
      reason: 'PostgreSQL message store is not configured.'
    };
    return;
  }

  if (!PostgresPool) {
    latestUserMessageStoreHealth = {
      configured: true,
      available: false,
      dialect: 'sqlite',
      checkedAt: new Date().toISOString(),
      reason: 'The pg package is not installed.'
    };
    console.error('PostgreSQL message store is configured, but the pg package is not installed. Falling back to SQLite for messages.');
    return;
  }

  const pool = new PostgresPool(postgresConfig);

  try {
    await pool.query('SELECT NOW()');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_messages (
        id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        sender_user_id INTEGER NOT NULL,
        recipient_user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMPTZ,
        edited_at TIMESTAMPTZ
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_messages_pair_created ON user_messages(sender_user_id, recipient_user_id, created_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_read ON user_messages(recipient_user_id, read_at)');

    const migrationResult = await syncSqliteUserMessagesToPostgres(pool);
    userMessageStorePool = pool;
    latestUserMessageStoreHealth = {
      configured: true,
      available: true,
      dialect: 'postgres',
      checkedAt: new Date().toISOString(),
      reason: migrationResult.skipped
        ? 'PostgreSQL message store is active.'
        : `PostgreSQL message store is active. Migrated ${migrationResult.migrated} existing SQLite message(s).`
    };
    console.log(latestUserMessageStoreHealth.reason);
  } catch (error) {
    latestUserMessageStoreHealth = {
      configured: true,
      available: false,
      dialect: 'sqlite',
      checkedAt: new Date().toISOString(),
      reason: error && error.message ? error.message : 'Failed to initialize PostgreSQL message store.'
    };
    console.error('Failed to initialize PostgreSQL message store. Falling back to SQLite for messages:', error);
    try {
      await pool.end();
    } catch (shutdownError) {
      console.error('Failed to close PostgreSQL message store pool after initialization failure:', shutdownError);
    }
    userMessageStorePool = null;
  }
}

async function loadUsersByIds(userIds) {
  const uniqueIds = Array.from(new Set((Array.isArray(userIds) ? userIds : [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)));
  if (!uniqueIds.length) {
    return [];
  }

  const placeholders = uniqueIds.map(() => '?').join(', ');
  return dbAll(
    `SELECT id, name, email, role, last_login
       FROM users
      WHERE id IN (${placeholders})`,
    uniqueIds
  );
}

async function listMessageUsers(currentUserId) {
  if (!isPostgresMessageStoreEnabled()) {
    return dbAll(
      `SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.last_login,
          (
            SELECT m.body
            FROM user_messages m
            WHERE (m.sender_user_id = ? AND m.recipient_user_id = u.id)
               OR (m.sender_user_id = u.id AND m.recipient_user_id = ?)
            ORDER BY datetime(m.created_at) DESC, m.id DESC
            LIMIT 1
          ) AS last_message,
          (
            SELECT m.created_at
            FROM user_messages m
            WHERE (m.sender_user_id = ? AND m.recipient_user_id = u.id)
               OR (m.sender_user_id = u.id AND m.recipient_user_id = ?)
            ORDER BY datetime(m.created_at) DESC, m.id DESC
            LIMIT 1
          ) AS last_message_at,
          (
            SELECT COUNT(*)
            FROM user_messages m
            WHERE m.sender_user_id = u.id
              AND m.recipient_user_id = ?
              AND m.read_at IS NULL
          ) AS unread_count
       FROM users u
       WHERE u.id != ?
       ORDER BY
         CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END,
         datetime(last_message_at) DESC,
         LOWER(u.name) ASC`,
      [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]
    );
  }

  const [users, lastMessageResult, unreadResult] = await Promise.all([
    dbAll(
      `SELECT id, name, email, role, last_login
         FROM users
        WHERE id != ?`,
      [currentUserId]
    ),
    userMessageStorePool.query(
      `WITH ranked_messages AS (
         SELECT
           CASE
             WHEN sender_user_id = $1 THEN recipient_user_id
             ELSE sender_user_id
           END AS counterparty_user_id,
           body,
           created_at,
           id,
           ROW_NUMBER() OVER (
             PARTITION BY CASE
               WHEN sender_user_id = $1 THEN recipient_user_id
               ELSE sender_user_id
             END
             ORDER BY created_at DESC, id DESC
           ) AS row_rank
         FROM user_messages
         WHERE sender_user_id = $1 OR recipient_user_id = $1
       )
       SELECT counterparty_user_id, body AS last_message, created_at AS last_message_at
         FROM ranked_messages
        WHERE row_rank = 1`,
      [currentUserId]
    ),
    userMessageStorePool.query(
      `SELECT sender_user_id AS counterparty_user_id, COUNT(*)::int AS unread_count
         FROM user_messages
        WHERE recipient_user_id = $1
          AND read_at IS NULL
        GROUP BY sender_user_id`,
      [currentUserId]
    )
  ]);

  const lastMessageByUserId = new Map();
  for (const row of lastMessageResult.rows || []) {
    lastMessageByUserId.set(Number(row.counterparty_user_id), row);
  }

  const unreadByUserId = new Map();
  for (const row of unreadResult.rows || []) {
    unreadByUserId.set(Number(row.counterparty_user_id), Number(row.unread_count) || 0);
  }

  return users
    .map((user) => {
      const summary = lastMessageByUserId.get(Number(user.id)) || null;
      return {
        ...user,
        last_message: summary ? String(summary.last_message || '') : null,
        last_message_at: summary ? summary.last_message_at : null,
        unread_count: unreadByUserId.get(Number(user.id)) || 0
      };
    })
    .sort((left, right) => {
      const leftTime = Date.parse(normalizeApiTimestamp(left.last_message_at) || '') || 0;
      const rightTime = Date.parse(normalizeApiTimestamp(right.last_message_at) || '') || 0;
      if (!leftTime && rightTime) return 1;
      if (leftTime && !rightTime) return -1;
      if (leftTime !== rightTime) return rightTime - leftTime;
      return String(left.name || '').localeCompare(String(right.name || ''), undefined, { sensitivity: 'base' });
    });
}

async function markConversationMessagesRead(senderUserId, recipientUserId) {
  if (isPostgresMessageStoreEnabled()) {
    await userMessageStorePool.query(
      `UPDATE user_messages
          SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
        WHERE sender_user_id = $1
          AND recipient_user_id = $2
          AND read_at IS NULL`,
      [senderUserId, recipientUserId]
    );
    return;
  }

  await dbRun(
    `UPDATE user_messages
        SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE sender_user_id = ?
        AND recipient_user_id = ?
        AND read_at IS NULL`,
    [senderUserId, recipientUserId]
  );
}

async function listConversationMessages(userAId, userBId) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
         FROM user_messages
        WHERE (sender_user_id = $1 AND recipient_user_id = $2)
           OR (sender_user_id = $2 AND recipient_user_id = $1)
        ORDER BY created_at ASC, id ASC`,
      [userAId, userBId]
    );
    return result.rows || [];
  }

  return dbAll(
    `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
       FROM user_messages
      WHERE (sender_user_id = ? AND recipient_user_id = ?)
         OR (sender_user_id = ? AND recipient_user_id = ?)
      ORDER BY datetime(created_at) ASC, id ASC`,
    [userAId, userBId, userBId, userAId]
  );
}

async function createUserMessageRecord({ senderUserId, recipientUserId, body, createdAt = null, editedAt = null, readAt = null }) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `INSERT INTO user_messages (sender_user_id, recipient_user_id, body, created_at, edited_at, read_at)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, CURRENT_TIMESTAMP), $5::timestamptz, $6::timestamptz)
       RETURNING id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at`,
      [senderUserId, recipientUserId, body, createdAt, editedAt, readAt]
    );
    return result.rows?.[0] || null;
  }

  const result = await dbRun(
    `INSERT INTO user_messages (sender_user_id, recipient_user_id, body, created_at, edited_at, read_at)
     VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)`,
    [senderUserId, recipientUserId, body, createdAt, editedAt, readAt]
  );
  return dbGet(
    `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
       FROM user_messages
      WHERE id = ?`,
    [result.lastID]
  );
}

async function getUserMessageById(messageId) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
         FROM user_messages
        WHERE id = $1`,
      [messageId]
    );
    return result.rows?.[0] || null;
  }

  return dbGet(
    `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
       FROM user_messages
      WHERE id = ?`,
    [messageId]
  );
}

async function getOwnedUserMessage(messageId, senderUserId, recipientUserId) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
         FROM user_messages
        WHERE id = $1
          AND sender_user_id = $2
          AND recipient_user_id = $3`,
      [messageId, senderUserId, recipientUserId]
    );
    return result.rows?.[0] || null;
  }

  return dbGet(
    `SELECT id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at
       FROM user_messages
      WHERE id = ?
        AND sender_user_id = ?
        AND recipient_user_id = ?`,
    [messageId, senderUserId, recipientUserId]
  );
}

async function updateOwnedUserMessageBody(messageId, senderUserId, recipientUserId, body) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `UPDATE user_messages
          SET body = $1,
              edited_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND sender_user_id = $3
          AND recipient_user_id = $4
      RETURNING id, sender_user_id, recipient_user_id, body, created_at, edited_at, read_at`,
      [body, messageId, senderUserId, recipientUserId]
    );
    return result.rows?.[0] || null;
  }

  await dbRun(
    `UPDATE user_messages
        SET body = ?,
            edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND sender_user_id = ?
        AND recipient_user_id = ?`,
    [body, messageId, senderUserId, recipientUserId]
  );
  return getUserMessageById(messageId);
}

async function reassignUserMessages(previousUserId, nextUserId) {
  if (isPostgresMessageStoreEnabled()) {
    await userMessageStorePool.query('UPDATE user_messages SET sender_user_id = $1 WHERE sender_user_id = $2', [nextUserId, previousUserId]);
    await userMessageStorePool.query('UPDATE user_messages SET recipient_user_id = $1 WHERE recipient_user_id = $2', [nextUserId, previousUserId]);
    return;
  }

  await dbRun('UPDATE user_messages SET sender_user_id = ? WHERE sender_user_id = ?', [nextUserId, previousUserId]);
  await dbRun('UPDATE user_messages SET recipient_user_id = ? WHERE recipient_user_id = ?', [nextUserId, previousUserId]);
}

async function listExistingMessageSignaturesForPair(userAId, userBId) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `SELECT sender_user_id, recipient_user_id, body, created_at
         FROM user_messages
        WHERE (sender_user_id = $1 AND recipient_user_id = $2)
           OR (sender_user_id = $2 AND recipient_user_id = $1)`,
      [userAId, userBId]
    );
    return result.rows || [];
  }

  return dbAll(
    `SELECT sender_user_id, recipient_user_id, body, created_at
       FROM user_messages
      WHERE (sender_user_id = ? AND recipient_user_id = ?)
         OR (sender_user_id = ? AND recipient_user_id = ?)`,
    [userAId, userBId, userBId, userAId]
  );
}

async function findAccessibleMessageAttachment(currentUserId, documentId) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `SELECT id
         FROM user_messages
        WHERE (sender_user_id = $1 OR recipient_user_id = $1)
          AND body LIKE $2
        LIMIT 1`,
      [currentUserId, `%${documentId}%`]
    );
    return result.rows?.[0] || null;
  }

  return dbGet(
    `SELECT id
       FROM user_messages
      WHERE (sender_user_id = ? OR recipient_user_id = ?)
        AND body LIKE ?
      LIMIT 1`,
    [currentUserId, currentUserId, `%${documentId}%`]
  );
}

async function getLatestIncomingMessageId(currentUserId) {
  if (isPostgresMessageStoreEnabled()) {
    const result = await userMessageStorePool.query(
      `SELECT COALESCE(MAX(id), 0) AS latest_incoming_message_id
         FROM user_messages
        WHERE recipient_user_id = $1`,
      [currentUserId]
    );
    return Number(result.rows?.[0]?.latest_incoming_message_id) || 0;
  }

  const row = await dbGet(
    `SELECT MAX(id) AS latest_incoming_message_id
       FROM user_messages
      WHERE recipient_user_id = ?`,
    [currentUserId]
  );
  return Number(row?.latest_incoming_message_id) || 0;
}

async function listUnreadMessageNotifications(currentUserId, afterId) {
  if (!isPostgresMessageStoreEnabled()) {
    return dbAll(
      `SELECT
          m.id,
          m.sender_user_id,
          m.recipient_user_id,
          m.body,
          m.created_at,
          m.read_at,
          sender.id AS sender_id,
          sender.name AS sender_name,
          sender.email AS sender_email,
          sender.role AS sender_role
       FROM user_messages m
       INNER JOIN users sender ON sender.id = m.sender_user_id
       WHERE m.recipient_user_id = ?
         AND m.read_at IS NULL
         AND m.id > ?
       ORDER BY m.id ASC`,
      [currentUserId, afterId]
    );
  }

  const result = await userMessageStorePool.query(
    `SELECT id, sender_user_id, recipient_user_id, body, created_at, read_at
       FROM user_messages
      WHERE recipient_user_id = $1
        AND read_at IS NULL
        AND id > $2
      ORDER BY id ASC`,
    [currentUserId, afterId]
  );
  const rows = result.rows || [];
  const senderRows = await loadUsersByIds(rows.map((row) => row.sender_user_id));
  const senderById = new Map(senderRows.map((row) => [Number(row.id), row]));

  return rows.map((row) => {
    const sender = senderById.get(Number(row.sender_user_id)) || null;
    return {
      ...row,
      sender_id: sender ? Number(sender.id) : Number(row.sender_user_id) || 0,
      sender_name: sender ? sender.name : 'User',
      sender_email: sender ? sender.email : '',
      sender_role: sender ? sender.role : ''
    };
  });
}

function getS3StorageConfig() {
  const region = getFirstConfiguredEnvValue('AWS_S3_REGION', 'S3_REGION', 'AWS_REGION', 'AWS_DEFAULT_REGION');
  const bucket = getFirstConfiguredEnvValue('AWS_S3_BUCKET', 'S3_BUCKET', 'AWS_BUCKET_NAME');
  const accessKeyId = getFirstConfiguredEnvValue('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getFirstConfiguredEnvValue('AWS_SECRET_ACCESS_KEY');
  const endpoint = getFirstConfiguredEnvValue('AWS_S3_ENDPOINT', 'S3_ENDPOINT');
  const forcePathStyle = /^(1|true|yes)$/i.test(getFirstConfiguredEnvValue('AWS_S3_FORCE_PATH_STYLE', 'S3_FORCE_PATH_STYLE'));

  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint,
    forcePathStyle
  };
}

function isS3StorageConfigured(config = getS3StorageConfig()) {
  return Boolean(config && config.region && config.bucket);
}

function getS3Client() {
  const config = getS3StorageConfig();
  if (!isS3StorageConfigured(config)) {
    return null;
  }

  const cacheKey = JSON.stringify({
    region: config.region,
    bucket: config.bucket,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    accessKeyId: config.accessKeyId,
    hasSecret: Boolean(config.secretAccessKey)
  });

  if (!cachedS3Client || cachedS3ClientKey !== cacheKey) {
    const clientConfig = {
      region: config.region,
      forcePathStyle: config.forcePathStyle
    };

    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      };
    }

    cachedS3Client = new S3Client(clientConfig);
    cachedS3ClientKey = cacheKey;
  }

  return cachedS3Client;
}

function maskS3StorageConfig(config = getS3StorageConfig()) {
  const endpoint = String(config?.endpoint || '').trim();
  let endpointHost = '';

  if (endpoint) {
    try {
      endpointHost = new URL(endpoint).host;
    } catch (_error) {
      endpointHost = endpoint;
    }
  }

  return {
    configured: isS3StorageConfigured(config),
    region: String(config?.region || '').trim(),
    bucket: String(config?.bucket || '').trim(),
    endpointHost,
    forcePathStyle: Boolean(config?.forcePathStyle),
    hasAccessKeyId: Boolean(String(config?.accessKeyId || '').trim()),
    hasSecretAccessKey: Boolean(String(config?.secretAccessKey || '').trim())
  };
}

function buildSqliteBackupStorageStatus() {
  return {
    enabled: isS3StorageConfigured() && Boolean(SQLITE_BACKUP_S3_PREFIX),
    intervalHours: SQLITE_BACKUP_INTERVAL_HOURS,
    intervalMs: SQLITE_BACKUP_INTERVAL_MS,
    startupDelayMs: SQLITE_BACKUP_STARTUP_DELAY_MS,
    prefix: SQLITE_BACKUP_S3_PREFIX,
    lastRun: latestSqliteBackupHealth
  };
}

function buildSqliteBackupKey(isoTimestamp) {
  const safeTimestamp = String(isoTimestamp || new Date().toISOString())
    .replace(/[:.]/g, '-')
    .replace(/[^0-9A-Za-zTZ_-]/g, '');
  return `${SQLITE_BACKUP_S3_PREFIX}/${safeTimestamp}__database.db`;
}

function escapeSqliteLiteral(value) {
  return String(value || '').replace(/'/g, "''");
}

async function createSqliteBackupSnapshot(snapshotPath) {
  const escapedSnapshotPath = escapeSqliteLiteral(path.resolve(snapshotPath));

  if (fs.existsSync(snapshotPath)) {
    fs.unlinkSync(snapshotPath);
  }

  try {
    await dbRun('PRAGMA wal_checkpoint(FULL)', []);
  } catch (_error) {
    // Ignore checkpoint failures and still try to generate a snapshot.
  }

  await dbRun(`VACUUM INTO '${escapedSnapshotPath}'`, []);
  return snapshotPath;
}

async function runSqliteBackupToS3(trigger = 'scheduled') {
  if (sqliteBackupInFlight) {
    return sqliteBackupInFlight;
  }

  sqliteBackupInFlight = (async () => {
    const startedAt = new Date().toISOString();
    const s3Config = getS3StorageConfig();
    const maskedConfig = maskS3StorageConfig(s3Config);
    const s3Client = getS3Client();

    if (!s3Client || !isS3StorageConfigured(s3Config) || !SQLITE_BACKUP_S3_PREFIX) {
      const result = {
        ok: false,
        trigger,
        startedAt,
        finishedAt: new Date().toISOString(),
        reason: 'SQLite backup schedule is disabled because S3 storage is not fully configured.',
        config: maskedConfig,
        keyPrefix: SQLITE_BACKUP_S3_PREFIX
      };
      latestSqliteBackupHealth = result;
      return result;
    }

    const snapshotPath = path.join(SQLITE_BACKUP_TEMP_DIR, `${Date.now()}-${crypto.randomUUID()}-database.db`);
    const storageKey = buildSqliteBackupKey(startedAt);

    try {
      await createSqliteBackupSnapshot(snapshotPath);
      const snapshotBuffer = fs.readFileSync(snapshotPath);
      const stats = fs.statSync(snapshotPath);

      await s3Client.send(new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: storageKey,
        Body: snapshotBuffer,
        ContentType: 'application/vnd.sqlite3',
        Metadata: {
          source: 'fast-bridge-group-sqlite-backup',
          database: DATABASE_FILENAME,
          createdat: startedAt,
          trigger: String(trigger || 'scheduled')
        }
      }));

      const result = {
        ok: true,
        trigger,
        startedAt,
        finishedAt: new Date().toISOString(),
        reason: 'SQLite backup uploaded to S3 successfully.',
        config: maskedConfig,
        key: storageKey,
        keyPrefix: SQLITE_BACKUP_S3_PREFIX,
        bytes: Number(stats.size) || snapshotBuffer.length
      };
      latestSqliteBackupHealth = result;
      return result;
    } catch (error) {
      const result = {
        ok: false,
        trigger,
        startedAt,
        finishedAt: new Date().toISOString(),
        reason: error && error.message ? error.message : 'SQLite backup upload failed.',
        config: maskedConfig,
        key: storageKey,
        keyPrefix: SQLITE_BACKUP_S3_PREFIX
      };
      latestSqliteBackupHealth = result;
      return result;
    } finally {
      if (fs.existsSync(snapshotPath)) {
        try {
          fs.unlinkSync(snapshotPath);
        } catch (_error) {
          // Ignore cleanup failures for temp snapshots.
        }
      }
      sqliteBackupInFlight = null;
    }
  })();

  return sqliteBackupInFlight;
}

function scheduleSqliteBackupToS3() {
  if (sqliteBackupTimer || !isS3StorageConfigured() || !SQLITE_BACKUP_S3_PREFIX) {
    return;
  }

  setTimeout(() => {
    runSqliteBackupToS3('startup-delay')
      .then((result) => {
        if (result.ok) {
          console.log(`SQLite backup uploaded to S3: ${result.key}`);
        } else {
          console.error('SQLite backup startup run failed:', result.reason);
        }
      })
      .catch((error) => {
        console.error('SQLite backup startup run crashed:', error);
      });
  }, SQLITE_BACKUP_STARTUP_DELAY_MS).unref?.();

  sqliteBackupTimer = setInterval(() => {
    runSqliteBackupToS3('interval')
      .then((result) => {
        if (result.ok) {
          console.log(`SQLite backup uploaded to S3: ${result.key}`);
        } else {
          console.error('SQLite backup scheduled run failed:', result.reason);
        }
      })
      .catch((error) => {
        console.error('SQLite backup scheduled run crashed:', error);
      });
  }, SQLITE_BACKUP_INTERVAL_MS);

  if (sqliteBackupTimer && typeof sqliteBackupTimer.unref === 'function') {
    sqliteBackupTimer.unref();
  }
}

async function verifyS3ArchiveStorage() {
  const startedAt = new Date().toISOString();
  const s3Config = getS3StorageConfig();
  const maskedConfig = maskS3StorageConfig(s3Config);
  const s3Client = getS3Client();

  if (!s3Client || !isS3StorageConfigured(s3Config)) {
    const result = {
      ok: false,
      checkedAt: startedAt,
      reason: 'S3 archive storage is not fully configured.',
      config: maskedConfig
    };
    latestS3ArchiveHealth = result;
    return result;
  }

  const healthKey = `healthchecks/message-archive/${Date.now()}-${crypto.randomUUID()}.json`;
  const payload = {
    scope: 'message-archive-healthcheck',
    checkedAt: startedAt,
    source: 'server-startup-or-admin-check'
  };

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: healthKey,
      Body: Buffer.from(JSON.stringify(payload), 'utf8'),
      ContentType: 'application/json; charset=utf-8'
    }));

    const storedText = await readS3ObjectText(healthKey);
    let parsed = null;
    try {
      parsed = storedText ? JSON.parse(storedText) : null;
    } catch (_error) {
      parsed = null;
    }

    if (!parsed || parsed.scope !== payload.scope) {
      throw new Error('S3 health check object could not be read back correctly.');
    }

    await s3Client.send(new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: healthKey
    }));

    const result = {
      ok: true,
      checkedAt: startedAt,
      reason: 'S3 archive storage passed put/get/delete verification.',
      config: maskedConfig,
      keyPrefix: 'healthchecks/message-archive/'
    };
    latestS3ArchiveHealth = result;
    return result;
  } catch (error) {
    const result = {
      ok: false,
      checkedAt: startedAt,
      reason: error && error.message ? error.message : 'S3 archive verification failed.',
      config: maskedConfig,
      keyPrefix: 'healthchecks/message-archive/'
    };
    latestS3ArchiveHealth = result;
    return result;
  }
}

async function runS3ArchiveStartupHealthCheck() {
  const config = getS3StorageConfig();
  if (!isS3StorageConfigured(config)) {
    console.warn('S3 archive storage is not configured. Message archive recovery will stay disabled until AWS_S3_BUCKET and AWS_S3_REGION are set.');
    return;
  }

  const result = await verifyS3ArchiveStorage();
  if (result.ok) {
    console.log(`S3 archive storage verified for bucket ${result.config.bucket} in ${result.config.region}.`);
    return;
  }

  console.error('S3 archive storage check failed:', result.reason);
}

function initializeS3BackupsAndHealthChecks() {
  runS3ArchiveStartupHealthCheck().catch((error) => {
    console.error('S3 archive startup verification crashed:', error);
  });

  if (isS3StorageConfigured() && SQLITE_BACKUP_S3_PREFIX) {
    scheduleSqliteBackupToS3();
    console.log(`SQLite backup scheduler enabled: every ${SQLITE_BACKUP_INTERVAL_HOURS} hour(s) to ${SQLITE_BACKUP_S3_PREFIX}`);
  } else {
    console.warn('SQLite backup scheduler is disabled because S3 storage is not fully configured.');
  }
}

function buildUserMessageArchiveKey(messageLike) {
  const messageId = Number(messageLike?.id) || 0;
  const senderUserId = Number(messageLike?.sender_user_id || messageLike?.senderUserId) || 0;
  const recipientUserId = Number(messageLike?.recipient_user_id || messageLike?.recipientUserId) || 0;
  const createdAtValue = normalizeApiTimestamp(messageLike?.created_at || messageLike?.createdAt || '') || '';
  const createdAt = createdAtValue || new Date().toISOString();
  const safeCreatedAt = createdAt
    .replace(/[:.]/g, '-')
    .replace(/\s+/g, 'T')
    .replace(/[^0-9A-Za-zTZ_-]/g, '');
  const pairKey = [senderUserId, recipientUserId].sort((left, right) => left - right).join('-');
  return `message-archive/pair-${pairKey}/${safeCreatedAt}__msg-${messageId}.json`;
}

async function archiveUserMessageToS3(messageLike) {
  const s3Client = getS3Client();
  const s3Config = getS3StorageConfig();
  if (!s3Client || !isS3StorageConfigured(s3Config)) {
    return false;
  }

  const payload = {
    id: Number(messageLike?.id) || 0,
    senderUserId: Number(messageLike?.sender_user_id || messageLike?.senderUserId) || 0,
    recipientUserId: Number(messageLike?.recipient_user_id || messageLike?.recipientUserId) || 0,
    body: String(messageLike?.body || ''),
    createdAt: normalizeApiTimestamp(messageLike?.created_at || messageLike?.createdAt || new Date().toISOString()),
    editedAt: normalizeApiTimestamp(messageLike?.edited_at || messageLike?.editedAt || null),
    readAt: normalizeApiTimestamp(messageLike?.read_at || messageLike?.readAt || null),
    archivedAt: new Date().toISOString(),
    source: 'user_messages'
  };

  await s3Client.send(new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: buildUserMessageArchiveKey(messageLike),
    Body: Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
    ContentType: 'application/json; charset=utf-8'
  }));

  return true;
}

function buildUserMessageArchivePrefix(userAId, userBId) {
  const pairKey = [Number(userAId) || 0, Number(userBId) || 0].sort((left, right) => left - right).join('-');
  return `message-archive/pair-${pairKey}/`;
}

async function readS3ObjectText(storageKey) {
  const s3Client = getS3Client();
  const s3Config = getS3StorageConfig();
  if (!s3Client || !isS3StorageConfigured(s3Config) || !storageKey) {
    return '';
  }

  const response = await s3Client.send(new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: storageKey
  }));

  if (!response?.Body) {
    return '';
  }

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function listS3Keys(prefix) {
  const s3Client = getS3Client();
  const s3Config = getS3StorageConfig();
  if (!s3Client || !isS3StorageConfigured(s3Config) || !prefix) {
    return [];
  }

  const keys = [];
  let continuationToken = undefined;

  do {
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken
    }));

    (Array.isArray(response?.Contents) ? response.Contents : []).forEach((entry) => {
      const key = String(entry?.Key || '').trim();
      if (key) {
        keys.push(key);
      }
    });

    continuationToken = response?.IsTruncated ? response?.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

function normalizeArchivedUserMessage(messageLike) {
  const senderUserId = Number(messageLike?.senderUserId || messageLike?.sender_user_id) || 0;
  const recipientUserId = Number(messageLike?.recipientUserId || messageLike?.recipient_user_id) || 0;
  const body = String(messageLike?.body || '').trim();
  const createdAt = normalizeApiTimestamp(messageLike?.createdAt || messageLike?.created_at || '');
  const editedAt = normalizeApiTimestamp(messageLike?.editedAt || messageLike?.edited_at || '');
  const readAt = normalizeApiTimestamp(messageLike?.readAt || messageLike?.read_at || '');

  if (!senderUserId || !recipientUserId || !body || !createdAt) {
    return null;
  }

  return {
    id: Number(messageLike?.id) || 0,
    senderUserId,
    recipientUserId,
    body,
    createdAt,
    editedAt,
    readAt
  };
}

async function listArchivedUserMessagesForPair(userAId, userBId) {
  const prefix = buildUserMessageArchivePrefix(userAId, userBId);
  const keys = await listS3Keys(prefix);
  const messages = [];

  for (const key of keys) {
    try {
      const rawText = await readS3ObjectText(key);
      if (!rawText) {
        continue;
      }

      const parsed = JSON.parse(rawText);
      const normalized = normalizeArchivedUserMessage(parsed);
      if (!normalized) {
        continue;
      }

      const matchesPair = (
        (normalized.senderUserId === Number(userAId) && normalized.recipientUserId === Number(userBId))
        || (normalized.senderUserId === Number(userBId) && normalized.recipientUserId === Number(userAId))
      );

      if (matchesPair) {
        messages.push(normalized);
      }
    } catch (error) {
      console.error('Failed to read archived user message:', key, error);
    }
  }

  return messages.sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0;
    const rightTime = Date.parse(right.createdAt || '') || 0;
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return (left.id || 0) - (right.id || 0);
  });
}

async function deleteArchivedUserMessagesForUser(userId) {
  const normalizedUserId = Number.parseInt(String(userId || ''), 10);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    return { deletedCount: 0 };
  }

  const s3Client = getS3Client();
  const s3Config = getS3StorageConfig();
  if (!s3Client || !isS3StorageConfigured(s3Config)) {
    return { deletedCount: 0 };
  }

  const keys = await listS3Keys('message-archive/');
  const matchingKeys = keys.filter((key) => {
    const match = String(key || '').match(/^message-archive\/pair-(\d+)-(\d+)\//);
    if (!match) {
      return false;
    }

    return Number(match[1]) === normalizedUserId || Number(match[2]) === normalizedUserId;
  });

  for (const key of matchingKeys) {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key
    }));
  }

  return { deletedCount: matchingKeys.length };
}

async function deleteUserAccountById(userId) {
  const normalizedUserId = Number.parseInt(String(userId || ''), 10);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error('A valid user id is required.');
  }

  const userRow = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [normalizedUserId]);
  if (!userRow) {
    throw new Error('User not found.');
  }

  const normalizedEmail = String(userRow.email || '').trim().toLowerCase();
  const normalizedName = String(userRow.name || '').trim().toLowerCase();
  const ownedUploads = await dbAll('SELECT * FROM user_uploads WHERE owner_user_id = ?', [normalizedUserId]);
  const sessionRows = await dbAll('SELECT id FROM auth_sessions WHERE user_id = ?', [normalizedUserId]);

  for (const uploadRow of ownedUploads) {
    await deleteStoredUserUpload(uploadRow).catch((error) => {
      console.error('Failed to delete stored upload during user cleanup:', error);
    });
  }

  let archivedMessagesDeleted = 0;
  try {
    const archiveCleanup = await deleteArchivedUserMessagesForUser(normalizedUserId);
    archivedMessagesDeleted = Number(archiveCleanup?.deletedCount) || 0;
  } catch (error) {
    console.error('Failed to delete archived user messages during user cleanup:', error);
  }

  if (isPostgresMessageStoreEnabled()) {
    await userMessageStorePool.query(
      'DELETE FROM user_messages WHERE sender_user_id = $1 OR recipient_user_id = $1',
      [normalizedUserId]
    );
  }

  await dbRun('BEGIN TRANSACTION', []);
  try {
    await dbRun('DELETE FROM auth_sessions WHERE user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM user_security_settings WHERE user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM subscription_profiles WHERE user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM smtp_requests WHERE user_id = ? OR reviewed_by_user_id = ?', [normalizedUserId, normalizedUserId]);
    await dbRun('DELETE FROM mls_import_rows WHERE owner_user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM mls_import_runs WHERE requester_user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM closed_deals WHERE owner_user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM user_uploads WHERE owner_user_id = ?', [normalizedUserId]);
    await dbRun('DELETE FROM user_messages WHERE sender_user_id = ? OR recipient_user_id = ?', [normalizedUserId, normalizedUserId]);
    await dbRun(
      `DELETE FROM property_assignments
        WHERE LOWER(COALESCE(assigned_to_email, '')) = ?
           OR LOWER(COALESCE(assigned_by_email, '')) = ?
           OR LOWER(COALESCE(assigned_to_name, '')) = ?
           OR LOWER(COALESCE(assigned_by_name, '')) = ?
           OR LOWER(COALESCE(payload_json, '')) LIKE ?`,
      [normalizedEmail, normalizedEmail, normalizedName, normalizedName, `%${normalizedEmail}%`]
    );
    await dbRun('DELETE FROM access_requests WHERE LOWER(email) = ?', [normalizedEmail]);
    await dbRun('DELETE FROM users WHERE id = ?', [normalizedUserId]);
    await dbRun('COMMIT', []);
  } catch (error) {
    await dbRun('ROLLBACK', []).catch(() => {});
    throw error;
  }

  sessionRows.forEach((row) => {
    const sessionId = String(row?.id || '').trim();
    if (sessionId) {
      revokedSessionIds.delete(sessionId);
    }
  });

  return {
    deletedUserId: normalizedUserId,
    deletedEmail: normalizedEmail,
    deletedUploads: ownedUploads.length,
    deletedSessions: sessionRows.length,
    archivedMessagesDeleted
  };
}

async function restoreArchivedMessagesForPair(userAId, userBId) {
  const archivedMessages = await listArchivedUserMessagesForPair(userAId, userBId);
  if (!archivedMessages.length) {
    return { restoredCount: 0, archivedCount: 0 };
  }

  const existingRows = await listExistingMessageSignaturesForPair(userAId, userBId);

  const existingSignatures = new Set(
    existingRows.map((row) => {
      const createdAt = normalizeApiTimestamp(row?.created_at || '');
      return [
        Number(row?.sender_user_id) || 0,
        Number(row?.recipient_user_id) || 0,
        String(row?.body || '').trim(),
        createdAt
      ].join('|');
    })
  );

  let restoredCount = 0;

  for (const message of archivedMessages) {
    const signature = [
      message.senderUserId,
      message.recipientUserId,
      message.body,
      message.createdAt
    ].join('|');

    if (existingSignatures.has(signature)) {
      continue;
    }

    await createUserMessageRecord({
      senderUserId: message.senderUserId,
      recipientUserId: message.recipientUserId,
      body: message.body,
      createdAt: message.createdAt,
      editedAt: message.editedAt || null,
      readAt: message.readAt || null
    });

    existingSignatures.add(signature);
    restoredCount += 1;
  }

  return {
    restoredCount,
    archivedCount: archivedMessages.length
  };
}

function getContentTypeForFileName(fileName, fallbackType = '') {
  const normalizedFallback = String(fallbackType || '').trim();
  if (normalizedFallback) {
    return normalizedFallback;
  }

  const extension = path.extname(String(fileName || '')).toLowerCase();
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.doc') return 'application/msword';
  if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === '.xls') return 'application/vnd.ms-excel';
  if (extension === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (extension === '.ppt') return 'application/vnd.ms-powerpoint';
  if (extension === '.pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (extension === '.rtf') return 'application/rtf';
  if (extension === '.csv') return 'text/csv; charset=utf-8';
  if (extension === '.txt') return 'text/plain; charset=utf-8';
  if (extension === '.md') return 'text/markdown; charset=utf-8';
  if (extension === '.json') return 'application/json; charset=utf-8';
  if (extension === '.xml') return 'application/xml; charset=utf-8';
  if (extension === '.html' || extension === '.htm') return 'text/html; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return 'text/javascript; charset=utf-8';
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.bmp') return 'image/bmp';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.avif') return 'image/avif';
  if (extension === '.heic') return 'image/heic';
  if (extension === '.heif') return 'image/heif';
  if (extension === '.jfif') return 'image/jpeg';
  if (extension === '.tif' || extension === '.tiff') return 'image/tiff';
  if (extension === '.mp3') return 'audio/mpeg';
  if (extension === '.wav') return 'audio/wav';
  if (extension === '.ogg') return 'audio/ogg';
  if (extension === '.m4a') return 'audio/mp4';
  if (extension === '.aac') return 'audio/aac';
  if (extension === '.flac') return 'audio/flac';
  if (extension === '.mp4') return 'video/mp4';
  if (extension === '.mov') return 'video/quicktime';
  if (extension === '.avi') return 'video/x-msvideo';
  if (extension === '.webm') return 'video/webm';
  if (extension === '.zip') return 'application/zip';
  if (extension === '.rar') return 'application/vnd.rar';
  if (extension === '.7z') return 'application/x-7z-compressed';
  return 'application/octet-stream';
}

function isAllowedUserUploadForScope(scope, extension, mimeType = '') {
  if (String(scope || '').trim().toLowerCase() === 'fbg-message') {
    return true;
  }

  return isAllowedInvestorAttachmentFile(extension, mimeType);
}

function isInlineMessageAttachmentType(fileName, fileType = '') {
  const normalizedType = String(fileType || '').trim().toLowerCase();
  const extension = path.extname(String(fileName || '')).toLowerCase();

  if (normalizedType.startsWith('image/') || normalizedType.startsWith('audio/') || normalizedType.startsWith('video/')) {
    return true;
  }

  if (
    normalizedType === 'application/pdf'
    || normalizedType === 'application/x-pdf'
    || normalizedType.startsWith('text/')
    || normalizedType.includes('json')
    || normalizedType.includes('xml')
  ) {
    return true;
  }

  return [
    '.pdf',
    '.txt',
    '.csv',
    '.md',
    '.json',
    '.xml',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.bmp',
    '.svg',
    '.avif',
    '.heic',
    '.heif',
    '.jfif',
    '.tif',
    '.tiff',
    '.mp3',
    '.wav',
    '.ogg',
    '.m4a',
    '.aac',
    '.flac',
    '.mp4',
    '.mov',
    '.avi',
    '.webm'
  ].includes(extension);
}

function sanitizeUserUploadScope(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['closed-deal', 'offer-package', 'agent-workspace', 'profile-avatar', 'fbg-message', 'property-detail'].includes(normalized)
    ? normalized
    : '';
}

function buildProfileAvatarContentPath(documentId) {
  const normalizedDocumentId = String(documentId || '').trim();
  if (!normalizedDocumentId) {
    return '';
  }

  return `/api/profile/avatar/content/${encodeURIComponent(normalizedDocumentId)}`;
}

function buildUserUploadContentPath(documentId, download = false) {
  const normalizedDocumentId = String(documentId || '').trim();
  if (!normalizedDocumentId) {
    return '';
  }

  return `/api/user-uploads/${encodeURIComponent(normalizedDocumentId)}/content?download=${download ? '1' : '0'}`;
}

function sanitizeUserUploadContextKey(value, fallback = 'default') {
  const normalized = String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 160);

  return normalized || fallback;
}

function buildUserUploadStoredFileName(documentId, originalFileName) {
  const extension = path.extname(String(originalFileName || '')).toLowerCase();
  const baseName = path.basename(String(originalFileName || 'document'), extension);
  const safeBaseName = sanitizeAgentWorkspaceSegment(baseName)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase() || 'document';
  return `${documentId}__${safeBaseName}${extension}`;
}

function buildUserUploadStorageLocation({ ownerUserId, scope, contextKey, documentId, fileName }) {
  const safeScope = sanitizeUserUploadScope(scope);
  const safeContextKey = sanitizeUserUploadContextKey(contextKey, 'default');
  const storedFileName = buildUserUploadStoredFileName(documentId, fileName);
  const s3Key = `user-uploads/${safeScope}/user-${Number(ownerUserId) || 0}/${safeContextKey}/${storedFileName}`;
  const localDirectory = path.join(USER_UPLOADS_LOCAL_ROOT, safeScope, `user-${Number(ownerUserId) || 0}`, safeContextKey);

  return {
    storedFileName,
    s3Key,
    localDirectory,
    localPath: path.join(localDirectory, storedFileName)
  };
}

async function storeUserUploadBuffer({ ownerUserId, scope, contextKey, documentId, fileName, fileType, buffer }) {
  const storageLocation = buildUserUploadStorageLocation({ ownerUserId, scope, contextKey, documentId, fileName });
  const s3Client = getS3Client();
  const s3Config = getS3StorageConfig();
  const contentType = getContentTypeForFileName(fileName, fileType);

  if (s3Client && isS3StorageConfigured(s3Config)) {
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: storageLocation.s3Key,
      Body: buffer,
      ContentType: contentType
    }));

    return {
      storageProvider: 's3',
      storageKey: storageLocation.s3Key,
      storedFileName: storageLocation.storedFileName,
      contentType
    };
  }

  fs.mkdirSync(storageLocation.localDirectory, { recursive: true });
  fs.writeFileSync(storageLocation.localPath, buffer);

  return {
    storageProvider: 'local',
    storageKey: storageLocation.localPath,
    storedFileName: storageLocation.storedFileName,
    contentType
  };
}

async function deleteStoredUserUpload(uploadRecord) {
  const storageProvider = String(uploadRecord?.storage_provider || uploadRecord?.storageProvider || '').trim().toLowerCase();
  const storageKey = String(uploadRecord?.storage_key || uploadRecord?.storageKey || '').trim();
  if (!storageProvider || !storageKey) {
    return;
  }

  if (storageProvider === 's3') {
    const s3Client = getS3Client();
    const s3Config = getS3StorageConfig();
    if (!s3Client || !isS3StorageConfigured(s3Config)) {
      throw new Error('S3 storage is not configured.');
    }
    await s3Client.send(new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: storageKey
    }));
    return;
  }

  await fs.promises.unlink(storageKey).catch(() => {});
}

async function createUserUploadRecord({ ownerUserId, scope, contextKey, fileName, fileSize, fileType, buffer }) {
  const documentId = crypto.randomUUID();
  const safeScope = sanitizeUserUploadScope(scope);
  const safeContextKey = sanitizeUserUploadContextKey(contextKey, 'default');
  const createdAt = Date.now();
  const stored = await storeUserUploadBuffer({
    ownerUserId,
    scope: safeScope,
    contextKey: safeContextKey,
    documentId,
    fileName,
    fileType,
    buffer
  });

  await dbRun(
    `INSERT INTO user_uploads (
      id, owner_user_id, scope, context_key, original_file_name, stored_file_name,
      file_size, file_type, storage_provider, storage_key, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      documentId,
      ownerUserId,
      safeScope,
      safeContextKey,
      fileName,
      stored.storedFileName,
      Math.max(Number(fileSize) || 0, 0),
      stored.contentType,
      stored.storageProvider,
      stored.storageKey,
      createdAt,
      createdAt
    ]
  );

  return getUserUploadByIdForOwner(ownerUserId, documentId);
}

async function listUserUploadsForOwner(ownerUserId, options = {}) {
  const whereClauses = ['owner_user_id = ?'];
  const params = [ownerUserId];
  const scope = sanitizeUserUploadScope(options.scope || '');
  const contextKey = String(options.contextKey || '').trim();

  if (scope) {
    whereClauses.push('scope = ?');
    params.push(scope);
  }

  if (contextKey) {
    whereClauses.push('context_key = ?');
    params.push(sanitizeUserUploadContextKey(contextKey, 'default'));
  }

  return dbAll(
    `SELECT *
       FROM user_uploads
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY updated_at DESC, created_at DESC`,
    params
  );
}

async function getUserUploadByIdForOwner(ownerUserId, documentId) {
  return dbGet(
    `SELECT *
       FROM user_uploads
      WHERE owner_user_id = ? AND id = ?`,
    [ownerUserId, String(documentId || '').trim()]
  );
}

async function getProfileAvatarUploadRecordForUser(ownerUserId) {
  const userRow = await dbGet('SELECT avatar_upload_id FROM users WHERE id = ?', [ownerUserId]);
  const avatarUploadId = String(userRow?.avatar_upload_id || '').trim();
  if (!avatarUploadId) {
    return null;
  }

  return getUserUploadByIdForOwner(ownerUserId, avatarUploadId);
}

function normalizeClosedDealDocumentsForStorage(documents) {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents
    .map((documentItem) => ({
      id: String(documentItem?.id || '').trim(),
      label: String(documentItem?.label || documentItem?.fileName || 'Document').trim() || 'Document',
      fileName: String(documentItem?.fileName || documentItem?.label || 'Document').trim() || 'Document',
      fileSize: Math.max(Number(documentItem?.fileSize) || 0, 0),
      fileType: String(documentItem?.fileType || '').trim(),
      storage: ['cloud', 'indexeddb', 'inline-base64'].includes(String(documentItem?.storage || '').trim())
        ? String(documentItem.storage).trim()
        : 'cloud',
      contentBase64: String(documentItem?.contentBase64 || '').trim(),
      contentPath: String(documentItem?.contentPath || '').trim(),
      downloadPath: String(documentItem?.downloadPath || '').trim(),
      createdAt: Number(documentItem?.createdAt) || Date.now(),
      updatedAt: Number(documentItem?.updatedAt) || Number(documentItem?.createdAt) || Date.now()
    }))
    .filter((documentItem) => documentItem.id && (documentItem.storage !== 'inline-base64' || documentItem.contentBase64));
}

function hydrateClosedDealDocument(documentItem) {
  const normalized = normalizeClosedDealDocumentsForStorage([documentItem])[0];
  if (!normalized) {
    return null;
  }

  if (normalized.storage === 'cloud' && normalized.id) {
    return {
      ...normalized,
      contentPath: normalized.contentPath || buildUserUploadContentPath(normalized.id, false),
      downloadPath: normalized.downloadPath || buildUserUploadContentPath(normalized.id, true)
    };
  }

  return normalized;
}

function serializeClosedDealRow(row) {
  if (!row) {
    return null;
  }

  let documents = [];
  try {
    documents = normalizeClosedDealDocumentsForStorage(JSON.parse(String(row.documents_json || '[]')))
      .map((documentItem) => hydrateClosedDealDocument(documentItem))
      .filter(Boolean);
  } catch (error) {
    documents = [];
  }

  return {
    id: String(row.id || '').trim(),
    title: String(row.title || '').trim(),
    propertyAddress: String(row.property_address || row.title || '').trim(),
    closeDate: String(row.close_date || '').trim(),
    wholesaleFee: Number(row.wholesale_fee) || 0,
    earnedAmount: Number(row.earned_amount) || 0,
    note: String(row.note || '').trim(),
    documents,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Number(row.created_at) || Date.now()
  };
}

async function listClosedDealsForOwner(ownerUserId) {
  const rows = await dbAll(
    `SELECT *
       FROM closed_deals
      WHERE owner_user_id = ?
      ORDER BY updated_at DESC, created_at DESC`,
    [ownerUserId]
  );
  return rows.map((row) => serializeClosedDealRow(row)).filter(Boolean);
}

async function getClosedDealForOwner(ownerUserId, closedDealId) {
  const row = await dbGet(
    `SELECT *
       FROM closed_deals
      WHERE owner_user_id = ? AND id = ?`,
    [ownerUserId, String(closedDealId || '').trim()]
  );
  return serializeClosedDealRow(row);
}

function serializeUserUpload(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id || '').trim(),
    scope: String(row.scope || '').trim(),
    contextKey: String(row.context_key || '').trim(),
    fileName: String(row.original_file_name || '').trim(),
    fileSize: Math.max(Number(row.file_size) || 0, 0),
    fileType: String(row.file_type || '').trim() || getContentTypeForFileName(row.original_file_name),
    storage: String(row.storage_provider || '').trim().toLowerCase() === 's3' ? 'cloud' : 'local',
    contentPath: buildUserUploadContentPath(row.id, false),
    downloadPath: buildUserUploadContentPath(row.id, true),
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Number(row.created_at) || Date.now()
  };
}

async function streamStoredUserUploadToResponse(uploadRecord, res) {
  const storageProvider = String(uploadRecord?.storage_provider || '').trim().toLowerCase();
  const storageKey = String(uploadRecord?.storage_key || '').trim();

  if (storageProvider === 's3') {
    const s3Client = getS3Client();
    const s3Config = getS3StorageConfig();
    if (!s3Client || !isS3StorageConfigured(s3Config)) {
      throw new Error('S3 storage is not configured.');
    }

    const response = await s3Client.send(new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: storageKey
    }));

    if (response?.Body && typeof response.Body.pipe === 'function') {
      response.Body.pipe(res);
      return;
    }

    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    res.end(Buffer.concat(chunks));
    return;
  }

  fs.createReadStream(storageKey).pipe(res);
}

function base32Encode(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(value) {
  const normalized = String(value || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let accumulator = 0;
  const output = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      continue;
    }
    accumulator = (accumulator << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function generateTotpCode(secret, timestamp = Date.now()) {
  const key = base32Decode(secret);
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD_SECONDS);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  const digest = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

function verifyTotpCode(secret, code) {
  const normalizedCode = String(code || '').replace(/\D+/g, '');
  if (normalizedCode.length !== TOTP_DIGITS || !secret) {
    return false;
  }

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const candidate = generateTotpCode(secret, Date.now() + (offset * TOTP_PERIOD_SECONDS * 1000));
    if (candidate === normalizedCode) {
      return true;
    }
  }

  return false;
}

function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '')
    .split(',')[0]
    .trim()
    .slice(0, 120);
}

async function createAuthSession(userId, req) {
  const sessionId = crypto.randomUUID();
  await dbRun(
    'INSERT INTO auth_sessions (id, user_id, user_agent, ip_address) VALUES (?, ?, ?, ?)',
    [sessionId, userId, String(req.headers['user-agent'] || '').slice(0, 255), getClientIp(req)]
  );
  return sessionId;
}

async function revokeAuthSession(sessionId, reason = 'revoked') {
  const normalizedSessionId = String(sessionId || '').trim();
  if (!normalizedSessionId) {
    return;
  }
  revokedSessionIds.add(normalizedSessionId);
  await dbRun(
    'UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = COALESCE(revoked_reason, ?) WHERE id = ? AND revoked_at IS NULL',
    [String(reason || 'revoked').slice(0, 80), normalizedSessionId]
  );
}

function issueTwoFactorChallenge(userLike) {
  const serializedUser = serializeUser(userLike);
  return jwt.sign(
    {
      id: serializedUser.id,
      email: serializedUser.email,
      name: serializedUser.name,
      role: serializedUser.role,
      purpose: 'two-factor-challenge'
    },
    JWT_SECRET,
    { expiresIn: TWO_FACTOR_CHALLENGE_TTL }
  );
}

function verifyTwoFactorChallenge(token) {
  const decoded = jwt.verify(String(token || ''), JWT_SECRET);
  if (!decoded || decoded.purpose !== 'two-factor-challenge') {
    throw new Error('Invalid two-factor challenge');
  }
  return decoded;
}

async function getUserSecuritySettings(userId) {
  const row = await dbGet(
    `SELECT two_factor_enabled, app_enabled, totp_secret, app_verified_at, updated_at
       FROM user_security_settings
      WHERE user_id = ?`,
    [userId]
  );

  return {
    enabled: Boolean(row?.two_factor_enabled),
    appEnabled: Boolean(row?.app_enabled),
    totpSecret: String(row?.totp_secret || '').trim(),
    appVerifiedAt: row?.app_verified_at || '',
    updatedAt: row?.updated_at || ''
  };
}

async function saveUserSecuritySettings(userId, settings) {
  await dbRun(
    `INSERT INTO user_security_settings (user_id, two_factor_enabled, app_enabled, totp_secret, app_verified_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       two_factor_enabled = excluded.two_factor_enabled,
       app_enabled = excluded.app_enabled,
       totp_secret = excluded.totp_secret,
       app_verified_at = excluded.app_verified_at,
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      settings.enabled ? 1 : 0,
      settings.appEnabled ? 1 : 0,
      settings.totpSecret || '',
      settings.appVerifiedAt || null
    ]
  );
}

function serializeUser(userLike) {
  if (!userLike || typeof userLike !== 'object') {
    return null;
  }

  const avatarUploadId = String(userLike.avatar_upload_id || userLike.avatarUploadId || '').trim();

  return {
    id: userLike.id,
    name: userLike.name,
    email: userLike.email,
    role: isKnownAdminEmail(userLike.email) ? 'admin' : String(userLike.role || '').trim().toLowerCase(),
    avatarUploadId,
    avatarImage: buildProfileAvatarContentPath(avatarUploadId)
  };
}

function issueAuthToken(userLike, sessionId = '') {
  const serializedUser = serializeUser(userLike);
  return jwt.sign({ ...serializedUser, sessionId: String(sessionId || '').trim() }, JWT_SECRET, { expiresIn: AUTH_SESSION_TTL });
}

function detectCardBrand(cardNumber) {
  const digits = String(cardNumber || '').replace(/\D+/g, '');
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(digits)) {
    return 'Visa';
  }
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7([01]\d{12}|20\d{12})))$/.test(digits)) {
    return 'Mastercard';
  }
  if (/^3[47]\d{13}$/.test(digits)) {
    return 'American Express';
  }
  if (/^6(?:011|5\d{2})\d{12}$/.test(digits)) {
    return 'Discover';
  }
  return 'Card';
}

function hasValidLuhn(cardNumber) {
  const digits = String(cardNumber || '').replace(/\D+/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number.parseInt(digits[index], 10);
    if (!Number.isFinite(digit)) {
      return false;
    }
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isValidFutureExpiry(monthValue, yearValue) {
  const month = Number.parseInt(String(monthValue || '').trim(), 10);
  const rawYear = String(yearValue || '').trim();
  const year = rawYear.length === 2 ? 2000 + Number.parseInt(rawYear, 10) : Number.parseInt(rawYear, 10);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
    return false;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return year <= currentYear + 20;
}

function sanitizeBillingField(value, maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength);
}

function buildSubscriptionPayload(userRow, subscriptionRow) {
  const role = String(userRow?.role || '').trim().toLowerCase();
  const isAdmin = role === 'admin';
  const isPremium = role === PREMIUM_USER_ROLE;
  const isTestUser = role === TEST_USER_ROLE;
  const activePlan = isAdmin ? 'admin' : (isPremium ? PREMIUM_PLAN_KEY : 'basic');
  const maskedCard = subscriptionRow?.card_last4
    ? `${subscriptionRow.card_brand || 'Card'} ending in ${subscriptionRow.card_last4}`
    : '';

  return {
    plan: activePlan,
    role: role || 'user',
    amountCents: isPremium ? PREMIUM_PRICE_CENTS : 0,
    currency: PREMIUM_CURRENCY,
    unlockedAllTabs: isAdmin || isPremium || isTestUser,
    adminAccess: isAdmin,
    billingProfile: subscriptionRow ? {
      billingName: subscriptionRow.billing_name || '',
      billingEmail: subscriptionRow.billing_email || '',
      billingPhone: subscriptionRow.billing_phone || '',
      companyName: subscriptionRow.company_name || '',
      addressLine1: subscriptionRow.address_line1 || '',
      addressLine2: subscriptionRow.address_line2 || '',
      city: subscriptionRow.city || '',
      stateRegion: subscriptionRow.state_region || '',
      postalCode: subscriptionRow.postal_code || '',
      country: subscriptionRow.country || '',
      cardholderName: subscriptionRow.cardholder_name || '',
      cardBrand: subscriptionRow.card_brand || '',
      cardLast4: subscriptionRow.card_last4 || '',
      maskedCard,
      status: subscriptionRow.subscription_status || 'inactive',
      activatedAt: subscriptionRow.activated_at || ''
    } : null
  };
}

function cloneFeatureAccessDefaults() {
  const cloned = {};

  Object.entries(FEATURE_ACCESS_DEFAULTS).forEach(([featureKey, feature]) => {
    cloned[featureKey] = {
      key: feature.key,
      label: feature.label,
      path: feature.path,
      roles: { ...feature.roles }
    };
  });

  return cloned;
}

function normalizeFeatureAccessBoolean(value, fallbackValue) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalizedValue = String(value || '').trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  return fallbackValue;
}

function normalizeFeatureAccessConfig(rawConfig) {
  const normalized = cloneFeatureAccessDefaults();
  const source = rawConfig && typeof rawConfig === 'object'
    ? (rawConfig.features && typeof rawConfig.features === 'object' ? rawConfig.features : rawConfig)
    : {};

  Object.entries(normalized).forEach(([featureKey, feature]) => {
    const sourceFeature = source[featureKey] && typeof source[featureKey] === 'object'
      ? source[featureKey]
      : (source[feature.key] && typeof source[feature.key] === 'object' ? source[feature.key] : null);
    const sourceRoles = sourceFeature && typeof sourceFeature.roles === 'object'
      ? sourceFeature.roles
      : sourceFeature;

    FEATURE_ACCESS_ROLE_KEYS.forEach((roleKey) => {
      if (roleKey === 'admin') {
        feature.roles.admin = true;
        return;
      }

      feature.roles[roleKey] = normalizeFeatureAccessBoolean(
        sourceRoles && Object.prototype.hasOwnProperty.call(sourceRoles, roleKey) ? sourceRoles[roleKey] : undefined,
        feature.roles[roleKey]
      );
    });

    feature.roles.admin = true;
  });

  return normalized;
}

function buildFeatureAccessPayload(config, metadata) {
  const normalized = normalizeFeatureAccessConfig(config);
  const details = metadata && typeof metadata === 'object' ? metadata : {};

  return {
    updatedAt: details.updatedAt || '',
    updatedByUserId: Number.isInteger(Number(details.updatedByUserId)) ? Number(details.updatedByUserId) : null,
    updatedByEmail: String(details.updatedByEmail || '').trim().toLowerCase(),
    features: normalized
  };
}

async function getFeatureAccessSettings() {
  const defaultsPayload = buildFeatureAccessPayload(null, {});

  try {
    const row = await dbGet(
      'SELECT config_json, updated_at, updated_by_user_id, updated_by_email FROM app_feature_settings WHERE setting_key = ?',
      [FEATURE_ACCESS_SETTING_KEY]
    );

    if (!row) {
      return defaultsPayload;
    }

    let parsedConfig = null;
    try {
      parsedConfig = JSON.parse(String(row.config_json || '{}'));
    } catch (error) {
      parsedConfig = null;
    }

    return buildFeatureAccessPayload(parsedConfig, {
      updatedAt: row.updated_at,
      updatedByUserId: row.updated_by_user_id,
      updatedByEmail: row.updated_by_email
    });
  } catch (error) {
    console.error('Feature access settings load error:', error);
    return defaultsPayload;
  }
}

async function saveFeatureAccessSettings(nextConfig, updatedBy) {
  const normalizedPayload = buildFeatureAccessPayload(nextConfig, {
    updatedByUserId: updatedBy?.id,
    updatedByEmail: updatedBy?.email
  });
  const configJson = JSON.stringify({ features: normalizedPayload.features });
  const updatedAt = new Date().toISOString();
  const updatedByUserId = Number(updatedBy?.id) || null;
  const updatedByEmail = String(updatedBy?.email || '').trim().toLowerCase();

  await dbRun(
    `INSERT INTO app_feature_settings (setting_key, config_json, updated_at, updated_by_user_id, updated_by_email)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       config_json = excluded.config_json,
       updated_at = excluded.updated_at,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_by_email = excluded.updated_by_email`,
    [FEATURE_ACCESS_SETTING_KEY, configJson, updatedAt, updatedByUserId, updatedByEmail]
  );

  return buildFeatureAccessPayload(normalizedPayload.features, {
    updatedAt,
    updatedByUserId,
    updatedByEmail
  });
}

function buildAnnouncementPayload(rawConfig, metadata = {}) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
  const title = cleanDocuSignText(source.title || source.headline || '', 160);
  const message = cleanDocuSignText(source.message || source.body || '', 2000);
  const ctaLabel = cleanDocuSignText(source.ctaLabel || source.buttonLabel || '', 80);
  const ctaUrl = cleanDocuSignText(source.ctaUrl || source.linkUrl || '', 500);
  const startAt = normalizeAnnouncementDateTime(source.startAt || source.publishAt || source.startsAt || '');
  let endAt = normalizeAnnouncementDateTime(source.endAt || source.expiresAt || source.endsAt || '');
  const tone = ['info', 'success', 'warning', 'urgent'].includes(String(source.tone || '').trim().toLowerCase())
    ? String(source.tone || '').trim().toLowerCase()
    : 'info';
  const configuredEnabled = Boolean(source.enabled && title && message);

  if (startAt && endAt) {
    const startTime = Date.parse(startAt);
    const endTime = Date.parse(endAt);
    if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime <= startTime) {
      endAt = '';
    }
  }

  const scheduleState = getAnnouncementScheduleState({
    enabled: configuredEnabled,
    title,
    message,
    startAt,
    endAt
  });

  return {
    enabled: configuredEnabled,
    title,
    message,
    ctaLabel,
    ctaUrl,
    tone,
    startAt,
    endAt,
    isLive: scheduleState.isLive,
    status: scheduleState.status,
    updatedAt: metadata.updatedAt || '',
    updatedByUserId: metadata.updatedByUserId || null,
    updatedByEmail: metadata.updatedByEmail || ''
  };
}

function normalizeAnnouncementDateTime(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString();
}

function getAnnouncementScheduleState(announcement, now = Date.now()) {
  const enabled = Boolean(announcement?.enabled && announcement?.title && announcement?.message);
  if (!enabled) {
    return { isLive: false, status: 'inactive' };
  }

  const startTime = announcement?.startAt ? Date.parse(String(announcement.startAt)) : Number.NaN;
  const endTime = announcement?.endAt ? Date.parse(String(announcement.endAt)) : Number.NaN;

  if (Number.isFinite(startTime) && now < startTime) {
    return { isLive: false, status: 'scheduled' };
  }

  if (Number.isFinite(endTime) && now >= endTime) {
    return { isLive: false, status: 'expired' };
  }

  return { isLive: true, status: 'live' };
}

async function getAnnouncementSettings() {
  const defaultsPayload = buildAnnouncementPayload(null, {});

  try {
    const row = await dbGet(
      'SELECT config_json, updated_at, updated_by_user_id, updated_by_email FROM app_feature_settings WHERE setting_key = ?',
      [ANNOUNCEMENT_SETTING_KEY]
    );

    if (!row) {
      return defaultsPayload;
    }

    let parsedConfig = null;
    try {
      parsedConfig = JSON.parse(String(row.config_json || '{}'));
    } catch (error) {
      parsedConfig = null;
    }

    return buildAnnouncementPayload(parsedConfig, {
      updatedAt: row.updated_at,
      updatedByUserId: row.updated_by_user_id,
      updatedByEmail: row.updated_by_email
    });
  } catch (error) {
    console.error('Announcement settings load error:', error);
    return defaultsPayload;
  }
}

async function saveAnnouncementSettings(nextConfig, updatedBy) {
  const normalizedPayload = buildAnnouncementPayload(nextConfig, {
    updatedByUserId: updatedBy?.id,
    updatedByEmail: updatedBy?.email
  });
  const configJson = JSON.stringify({
    enabled: normalizedPayload.enabled,
    title: normalizedPayload.title,
    message: normalizedPayload.message,
    ctaLabel: normalizedPayload.ctaLabel,
    ctaUrl: normalizedPayload.ctaUrl,
    tone: normalizedPayload.tone,
    startAt: normalizedPayload.startAt,
    endAt: normalizedPayload.endAt
  });
  const updatedAt = new Date().toISOString();
  const updatedByUserId = Number(updatedBy?.id) || null;
  const updatedByEmail = String(updatedBy?.email || '').trim().toLowerCase();

  await dbRun(
    `INSERT INTO app_feature_settings (setting_key, config_json, updated_at, updated_by_user_id, updated_by_email)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       config_json = excluded.config_json,
       updated_at = excluded.updated_at,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_by_email = excluded.updated_by_email`,
    [ANNOUNCEMENT_SETTING_KEY, configJson, updatedAt, updatedByUserId, updatedByEmail]
  );

  return buildAnnouncementPayload(normalizedPayload, {
    updatedAt,
    updatedByUserId,
    updatedByEmail
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

const AGENT_PROPERTY_STATUS_ALIASES = {
  acquired: 'acquired',
  '100-closed-deal': 'acquired',
  'closed-deal': 'acquired',
  'in-negotiations': 'in-negotiations',
  '60-in-negotiations': 'in-negotiations',
  'contract-submitted': 'contract-submitted',
  '50-contract-submitted': 'contract-submitted',
  'back-up': 'back-up',
  '30-back-up': 'back-up',
  'offer-terms-sent': 'offer-terms-sent',
  '30-offer-terms-sent': 'offer-terms-sent',
  'continue-to-follow': 'continue-to-follow',
  '20-continue-to-follow': 'continue-to-follow',
  'initial-contact-started': 'initial-contact-started',
  '10-initial-contact-started': 'initial-contact-started',
  'cancelled-fec': 'cancelled-fec',
  '0-cancelled-fec': 'cancelled-fec',
  'do-not-use': 'do-not-use',
  '0-do-not-use': 'do-not-use',
  none: 'none',
  '0-none': 'none',
  pass: 'pass',
  '0-pass': 'pass',
  'sold-others-close': 'sold-others-close',
  '0-sold-others-close': 'sold-others-close'
};

function normalizeAgentPropertyStatus(value) {
  const rawValue = String(value || '').trim().toLowerCase();
  if (!rawValue) {
    return 'none';
  }

  const normalizedKey = rawValue
    .replace(/[%]/g, '')
    .replace(/[|/()]+/g, ' ')
    .replace(/_/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '-');

  return AGENT_PROPERTY_STATUS_ALIASES[normalizedKey] || AGENT_PROPERTY_STATUS_ALIASES[rawValue] || normalizedKey || 'none';
}

function normalizeAgentPropertyMemoryKey(agentLike) {
  const email = normalizeKnownEmail(agentLike?.email || '');
  if (email) {
    return `email:${email}`;
  }

  const phone = String(agentLike?.phone || '').replace(/[^0-9]/g, '');
  if (phone) {
    return `phone:${phone}`;
  }

  const name = String(agentLike?.name || '').trim().toLowerCase();
  const brokerage = String(agentLike?.brokerage || '').trim().toLowerCase();
  const composite = [name, brokerage].filter(Boolean).join('|');
  return composite ? `name:${composite}` : '';
}

function normalizeAgentPropertyMemoryRecord(propertyKey, detailLike, ownerUserLike, fallbackSavedBy) {
  const normalizedPropertyKey = normalizePropertyAssignmentKey(propertyKey || detailLike?.address || detailLike?.propertyAddress);
  if (!normalizedPropertyKey || !detailLike || typeof detailLike !== 'object') {
    return null;
  }

  const snapshot = { ...detailLike };
  const propertyAddress = String(snapshot.address || snapshot.propertyAddress || 'Property').trim() || 'Property';
  const agentRecord = snapshot.agentRecord && typeof snapshot.agentRecord === 'object'
    ? { ...snapshot.agentRecord }
    : {};
  const agentKey = normalizeAgentPropertyMemoryKey(agentRecord);

  if (!agentKey) {
    return null;
  }

  const ownerUser = normalizeAssignmentUser(ownerUserLike || fallbackSavedBy || {});
  const savedBy = normalizeAssignmentUser(fallbackSavedBy || ownerUser || {});
  const statusValue = normalizeAgentPropertyStatus(snapshot.piqAgentStatus || agentRecord.agentStatus || 'none');

  snapshot.address = propertyAddress;
  snapshot.propertyAddress = propertyAddress;
  snapshot.piqAgentStatus = statusValue;
  snapshot.agentRecord = {
    ...agentRecord,
    name: String(agentRecord.name || '').trim(),
    email: normalizeKnownEmail(agentRecord.email || ''),
    brokerage: String(agentRecord.brokerage || '').trim(),
    agentStatus: String(agentRecord.agentStatus || statusValue).trim() || statusValue
  };

  return {
    propertyKey: normalizedPropertyKey,
    agentKey,
    agentName: String(snapshot.agentRecord.name || '').trim(),
    agentEmail: String(snapshot.agentRecord.email || '').trim(),
    propertyAddress,
    statusValue,
    ownerUser,
    savedBy,
    snapshot,
    updatedAt: new Date().toISOString()
  };
}

function parseAgentPropertyMemoryRow(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(String(row.payload_json || '{}'));
    const normalized = normalizeAgentPropertyMemoryRecord(row.property_key, parsedPayload.snapshot || parsedPayload.detail || parsedPayload, {
      key: row.owner_user_key,
      email: row.owner_user_email,
      name: row.owner_user_name
    }, parsedPayload.savedBy || {});

    if (normalized) {
      return {
        ...normalized,
        updatedAt: String(row.updated_at || normalized.updatedAt || '').trim() || normalized.updatedAt
      };
    }
  } catch (error) {
    // Fall through to the row-based fallback.
  }

  return {
    propertyKey: normalizePropertyAssignmentKey(row.property_key),
    agentKey: String(row.agent_key || '').trim(),
    agentName: String(row.agent_name || '').trim(),
    agentEmail: normalizeKnownEmail(row.agent_email || ''),
    propertyAddress: String(row.property_address || 'Property').trim() || 'Property',
    statusValue: normalizeAgentPropertyStatus(row.status_value || 'none'),
    ownerUser: normalizeAssignmentUser({
      key: row.owner_user_key,
      email: row.owner_user_email,
      name: row.owner_user_name
    }),
    savedBy: normalizeAssignmentUser({}),
    snapshot: {
      address: String(row.property_address || 'Property').trim() || 'Property',
      propertyAddress: String(row.property_address || 'Property').trim() || 'Property',
      piqAgentStatus: normalizeAgentPropertyStatus(row.status_value || 'none'),
      agentRecord: {
        name: String(row.agent_name || '').trim(),
        email: normalizeKnownEmail(row.agent_email || '')
      }
    },
    updatedAt: String(row.updated_at || '').trim()
  };
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

function normalizePropertyAssignmentIdentityKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function buildActiveUserIdentityLookup() {
  const rows = await dbAll('SELECT id, name, email FROM users', []);
  const lookup = new Set();

  (rows || []).forEach((row) => {
    if (isSuppressedAccountIdentity(row)) {
      return;
    }

    const email = normalizeKnownEmail(row?.email || '');
    const name = normalizePropertyAssignmentIdentityKey(row?.name || '');
    const id = Number(row?.id) || 0;

    if (email) {
      lookup.add(email);
    }
    if (name) {
      lookup.add(name);
    }
    if (id > 0) {
      lookup.add(String(id));
    }
  });

  return lookup;
}

function isKnownPropertyAssignmentUser(assignedTo, activeIdentityLookup) {
  const safeAssignedTo = assignedTo && typeof assignedTo === 'object' ? assignedTo : {};
  if (isSuppressedAccountIdentity(safeAssignedTo)) {
    return false;
  }
  const normalizedEmail = normalizeKnownEmail(safeAssignedTo.email || '');
  const normalizedKey = normalizeKnownEmail(safeAssignedTo.key || '');
  const normalizedName = normalizePropertyAssignmentIdentityKey(safeAssignedTo.name || '');

  if (normalizedEmail && activeIdentityLookup.has(normalizedEmail)) {
    return true;
  }

  if (normalizedKey && activeIdentityLookup.has(normalizedKey)) {
    return true;
  }

  if (normalizedName && activeIdentityLookup.has(normalizedName)) {
    return true;
  }

  return false;
}

async function sanitizePropertyAssignments(rows) {
  const activeIdentityLookup = await buildActiveUserIdentityLookup();
  const assignments = {};
  const orphanedPropertyKeys = [];

  (rows || []).forEach((row) => {
    const record = parsePropertyAssignmentRow(row);
    if (!record || !record.propertyKey) {
      return;
    }

    if (record.assignedTo && !isKnownPropertyAssignmentUser(record.assignedTo, activeIdentityLookup)) {
      orphanedPropertyKeys.push(record.propertyKey);
      return;
    }

    assignments[record.propertyKey] = record;
  });

  if (orphanedPropertyKeys.length) {
    await Promise.all(
      orphanedPropertyKeys.map((propertyKey) => dbRun('DELETE FROM property_assignments WHERE property_key = ?', [propertyKey]).catch((error) => {
        console.error('Failed to delete orphaned property assignment:', propertyKey, error);
      }))
    );
  }

  return assignments;
}

async function syncIsaacAdminAccount() {
  const canonicalEmail = CANONICAL_ISAAC_EMAIL;
  const legacyEmails = ['isaacs.hesed@gmail.com', 'isaacs.hesed@fastbridgegroup.com'];
  const canonicalName = 'ISAAC HARO';
  const canonicalPassword = '315598';
  const envSmtpConfig = getPerUserSmtpEnvConfig(canonicalEmail);
  const envSmtpPass = String(envSmtpConfig.smtpPass || '').trim();
  const envSmtpSignature = String(envSmtpConfig.smtpSignature || '').trim();

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
        'INSERT INTO users (name, email, password_hash, role, access_granted, smtp_user, smtp_pass, smtp_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, 'admin', 1, canonicalEmail, envSmtpPass, envSmtpSignature]
      );
      console.log('Isaac admin account created/synced');
      return;
    }

    const currentEmail = String(account.email || '').trim().toLowerCase();
    const currentSmtpUser = String(account.smtp_user || '').trim().toLowerCase();
    const currentSmtpPass = String(account.smtp_pass || '').trim();
    const currentSmtpSignature = String(account.smtp_signature || '').trim();
    const shouldUpdateSmtpUser = !currentSmtpUser || currentSmtpUser === currentEmail || legacyEmails.includes(currentSmtpUser);
    const nextSmtpUser = shouldUpdateSmtpUser ? canonicalEmail : account.smtp_user;
    const nextSmtpPass = currentSmtpPass || envSmtpPass;
    const nextSmtpSignature = currentSmtpSignature || envSmtpSignature;

    await dbRun(
      'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, access_granted = 1, smtp_user = ?, smtp_pass = ?, smtp_signature = ? WHERE id = ?',
      [
        canonicalName,
        canonicalEmail,
        hash,
        'admin',
        nextSmtpUser,
        nextSmtpPass,
        nextSmtpSignature,
        account.id
      ]
    );

    await mergeLegacyConversationUsersIntoCanonicalAccount({
      canonicalUserId: account.id,
      canonicalEmail,
      canonicalName,
      legacyEmails,
      logLabel: 'Isaac admin account'
    });

    console.log('Isaac admin account synced');
  } catch (error) {
    console.error('Failed to sync Isaac admin account:', error);
  }
}

async function mergeLegacyConversationUsersIntoCanonicalAccount({ canonicalUserId, canonicalEmail, canonicalName, legacyEmails, logLabel }) {
  const primaryUserId = Number(canonicalUserId);
  if (!Number.isInteger(primaryUserId) || primaryUserId <= 0) {
    return;
  }

  const normalizedCanonicalEmail = normalizeKnownEmail(canonicalEmail);
  const normalizedLegacyEmails = Array.isArray(legacyEmails)
    ? legacyEmails.map((email) => normalizeKnownEmail(email)).filter(Boolean)
    : [];
  const candidateEmails = Array.from(new Set([normalizedCanonicalEmail, ...normalizedLegacyEmails].filter(Boolean)));
  const normalizedCanonicalName = String(canonicalName || '').trim().toLowerCase();

  if (candidateEmails.length === 0 && !normalizedCanonicalName) {
    return;
  }

  const emailPlaceholders = candidateEmails.map(() => '?').join(', ');
  const conditions = [];
  const params = [primaryUserId];

  if (candidateEmails.length > 0) {
    conditions.push(`LOWER(email) IN (${emailPlaceholders})`);
    params.push(...candidateEmails);
  }

  if (normalizedCanonicalName) {
    conditions.push('LOWER(name) = ?');
    params.push(normalizedCanonicalName);
  }

  if (conditions.length === 0) {
    return;
  }

  try {
    const duplicateUsers = await dbAll(
      `SELECT id, email, name
       FROM users
       WHERE id != ?
         AND (${conditions.join(' OR ')})
       ORDER BY id ASC`,
      params
    );

    if (!Array.isArray(duplicateUsers) || duplicateUsers.length === 0) {
      return;
    }

    const duplicateIds = duplicateUsers
      .map((user) => Number(user && user.id))
      .filter((id) => Number.isInteger(id) && id > 0 && id !== primaryUserId);

    if (duplicateIds.length === 0) {
      return;
    }

    for (const duplicateId of duplicateIds) {
      await reassignUserMessages(duplicateId, primaryUserId);
    }

    console.log(`${logLabel || 'Canonical'} message history merged from legacy user ids: ${duplicateIds.join(', ')}`);
  } catch (error) {
    console.error(`Failed to merge ${logLabel || 'canonical'} legacy conversations:`, error);
  }
}

async function syncSteveAdminAccount() {
  const canonicalEmail = CANONICAL_STEVE_EMAIL;
  const legacyEmails = ['medinafbg@gmail.com', 'medinastj@gmail.com'];
  const canonicalName = 'Steve Medina';
  const canonicalPassword = CANONICAL_STEVE_PASSWORD;
  const envSmtpConfig = getPerUserSmtpEnvConfig(canonicalEmail);
  const envSmtpPass = String(envSmtpConfig.smtpPass || '').trim();
  const envSmtpSignature = String(envSmtpConfig.smtpSignature || '').trim();

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
        'INSERT INTO users (name, email, password_hash, role, access_granted, smtp_user, smtp_pass, smtp_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, 'admin', 1, canonicalEmail, envSmtpPass, envSmtpSignature]
      );
      console.log('Steve admin account created/synced');
      return;
    }

    const currentEmail = String(account.email || '').trim().toLowerCase();
    const currentSmtpUser = String(account.smtp_user || '').trim().toLowerCase();
    const currentSmtpPass = String(account.smtp_pass || '').trim();
    const currentSmtpSignature = String(account.smtp_signature || '').trim();
    const shouldUpdateSmtpUser = !currentSmtpUser || currentSmtpUser === currentEmail || legacyEmails.includes(currentSmtpUser);
    const nextSmtpUser = shouldUpdateSmtpUser ? canonicalEmail : account.smtp_user;
    const nextSmtpPass = currentSmtpPass || envSmtpPass;
    const nextSmtpSignature = currentSmtpSignature || envSmtpSignature;

    await dbRun(
      'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, access_granted = 1, smtp_user = ?, smtp_pass = ?, smtp_signature = ? WHERE id = ?',
      [
        canonicalName,
        canonicalEmail,
        hash,
        'admin',
        nextSmtpUser,
        nextSmtpPass,
        nextSmtpSignature,
        account.id
      ]
    );

    await mergeLegacyConversationUsersIntoCanonicalAccount({
      canonicalUserId: account.id,
      canonicalEmail,
      canonicalName,
      legacyEmails,
      logLabel: 'Steve admin account'
    });

    console.log('Steve admin account synced');
  } catch (error) {
    console.error('Failed to sync Steve admin account:', error);
  }
}

async function syncLoriaBrokerAccount() {
  const canonicalEmail = CANONICAL_LORIA_EMAIL;
  const canonicalName = CANONICAL_LORIA_NAME;
  const canonicalPassword = CANONICAL_LORIA_PASSWORD;
  const legacyEmails = [];

  try {
    const account = await dbGet(
      `SELECT * FROM users
       WHERE LOWER(email) = ?
          OR LOWER(name) = LOWER(?)
       ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END, id ASC`,
      [canonicalEmail, canonicalName, canonicalEmail]
    );

    const hash = await bcrypt.hash(canonicalPassword, 10);

    if (!account) {
      await dbRun(
        'INSERT INTO users (name, email, password_hash, role, access_granted, smtp_user, smtp_pass, smtp_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, 'broker', 1, canonicalEmail, '', '']
      );
      console.log('Loria broker account created/synced');
      return;
    }

    const currentEmail = String(account.email || '').trim().toLowerCase();
    const currentSmtpUser = String(account.smtp_user || '').trim().toLowerCase();
    const currentSmtpPass = String(account.smtp_pass || '').trim();
    const currentSmtpSignature = String(account.smtp_signature || '').trim();
    const nextSmtpUser = !currentSmtpUser || currentSmtpUser === currentEmail ? canonicalEmail : account.smtp_user;

    await dbRun(
      'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, access_granted = 1, smtp_user = ?, smtp_pass = ?, smtp_signature = ? WHERE id = ?',
      [
        canonicalName,
        canonicalEmail,
        hash,
        'broker',
        nextSmtpUser,
        currentSmtpPass,
        currentSmtpSignature,
        account.id
      ]
    );

    await mergeLegacyConversationUsersIntoCanonicalAccount({
      canonicalUserId: account.id,
      canonicalEmail,
      canonicalName,
      legacyEmails,
      logLabel: 'Loria broker account'
    });

    console.log('Loria broker account synced');
  } catch (error) {
    console.error('Failed to sync Loria broker account:', error);
  }
}

async function syncStevenCastilloUserAccount() {
  const canonicalEmail = CANONICAL_STEVEN_CASTILLO_EMAIL;
  const canonicalName = CANONICAL_STEVEN_CASTILLO_NAME;
  const canonicalPassword = CANONICAL_STEVEN_CASTILLO_PASSWORD;
  const legacyEmails = [];
  const canonicalRole = PREMIUM_USER_ROLE;

  try {
    const account = await dbGet(
      `SELECT * FROM users
       WHERE LOWER(email) = ?
          OR LOWER(name) = LOWER(?)
       ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END, id ASC`,
      [canonicalEmail, canonicalName, canonicalEmail]
    );

    const hash = await bcrypt.hash(canonicalPassword, 10);

    if (!account) {
      await dbRun(
        'INSERT INTO users (name, email, password_hash, role, access_granted, smtp_user, smtp_pass, smtp_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, canonicalRole, 1, '', '', '']
      );
      const createdAccount = await dbGet('SELECT id FROM users WHERE LOWER(email) = ?', [canonicalEmail]);
      if (createdAccount) {
        await dbRun(
          `INSERT INTO subscription_profiles (
              user_id, plan_key, billing_name, billing_email, subscription_status, amount_cents,
              currency, activated_at, updated_at
            ) VALUES (?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
              plan_key = excluded.plan_key,
              billing_name = COALESCE(NULLIF(subscription_profiles.billing_name, ''), excluded.billing_name),
              billing_email = COALESCE(NULLIF(subscription_profiles.billing_email, ''), excluded.billing_email),
              subscription_status = 'active',
              amount_cents = excluded.amount_cents,
              currency = excluded.currency,
              activated_at = COALESCE(subscription_profiles.activated_at, CURRENT_TIMESTAMP),
              updated_at = CURRENT_TIMESTAMP`,
          [
            createdAccount.id,
            PREMIUM_PLAN_KEY,
            canonicalName,
            canonicalEmail,
            PREMIUM_PRICE_CENTS,
            PREMIUM_CURRENCY
          ]
        );
      }
      console.log('Steven Castillo user account created/synced');
      return;
    }

    const currentSmtpPass = String(account.smtp_pass || '').trim();
    const currentSmtpSignature = String(account.smtp_signature || '').trim();

    await dbRun(
      'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, access_granted = 1, smtp_user = ?, smtp_pass = ?, smtp_signature = ? WHERE id = ?',
      [
        canonicalName,
        canonicalEmail,
        hash,
        canonicalRole,
        account.smtp_user || '',
        currentSmtpPass,
        currentSmtpSignature,
        account.id
      ]
    );

    await dbRun(
      `INSERT INTO subscription_profiles (
          user_id, plan_key, billing_name, billing_email, subscription_status, amount_cents,
          currency, activated_at, updated_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          plan_key = excluded.plan_key,
          billing_name = COALESCE(NULLIF(subscription_profiles.billing_name, ''), excluded.billing_name),
          billing_email = COALESCE(NULLIF(subscription_profiles.billing_email, ''), excluded.billing_email),
          subscription_status = 'active',
          amount_cents = excluded.amount_cents,
          currency = excluded.currency,
          activated_at = COALESCE(subscription_profiles.activated_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP`,
      [
        account.id,
        PREMIUM_PLAN_KEY,
        canonicalName,
        canonicalEmail,
        PREMIUM_PRICE_CENTS,
        PREMIUM_CURRENCY
      ]
    );

    await mergeLegacyConversationUsersIntoCanonicalAccount({
      canonicalUserId: account.id,
      canonicalEmail,
      canonicalName,
      legacyEmails,
      logLabel: 'Steven Castillo user account'
    });

    console.log('Steven Castillo user account synced');
  } catch (error) {
    console.error('Failed to sync Steven Castillo user account:', error);
  }
}

async function syncPublicTestAccount() {
  const canonicalEmail = CANONICAL_TEST_EMAIL;
  const canonicalName = CANONICAL_TEST_NAME;
  const canonicalPassword = CANONICAL_TEST_PASSWORD;

  try {
    const account = await dbGet(
      `SELECT * FROM users
       WHERE LOWER(email) = ?
          OR LOWER(name) = LOWER(?)
       ORDER BY CASE WHEN LOWER(email) = ? THEN 0 ELSE 1 END, id ASC`,
      [canonicalEmail, canonicalName, canonicalEmail]
    );

    const hash = await bcrypt.hash(canonicalPassword, 10);
    let userId = null;

    if (!account) {
      const insertResult = await dbRun(
        'INSERT INTO users (name, email, password_hash, role, access_granted, smtp_user, smtp_pass, smtp_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [canonicalName, canonicalEmail, hash, TEST_USER_ROLE, 1, '', '', '']
      );
      userId = insertResult.lastID;
      console.log('Public test account created/synced');
    } else {
      userId = account.id;
      await dbRun(
        'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, access_granted = 1, smtp_user = ?, smtp_pass = ?, smtp_signature = ? WHERE id = ?',
        [canonicalName, canonicalEmail, hash, TEST_USER_ROLE, '', '', '', account.id]
      );
      console.log('Public test account synced');
    }
    if (userId) {
      await saveUserSecuritySettings(userId, {
        enabled: false,
        appEnabled: false,
        totpSecret: '',
        appVerifiedAt: null
      });
    }
  } catch (error) {
    console.error('Failed to sync public test account:', error);
  }
}

async function repairApprovedSmtpUsersFromRequests() {
  try {
    const approvedRows = await dbAll(
      `SELECT request.user_id, request.smtp_user, request.smtp_pass
       FROM smtp_requests request
       INNER JOIN (
         SELECT user_id, MAX(id) AS latest_id
         FROM smtp_requests
         WHERE status = 'approved' AND user_id IS NOT NULL
         GROUP BY user_id
       ) latest
         ON latest.latest_id = request.id`,
      []
    );

    for (const row of approvedRows) {
      const userId = Number(row && row.user_id);
      const approvedSmtpUser = String(row && row.smtp_user || '').trim().toLowerCase();
      const approvedSmtpPass = String(row && row.smtp_pass || '').trim();
      if (!Number.isInteger(userId) || userId <= 0 || !approvedSmtpUser || !approvedSmtpPass) {
        continue;
      }

      const userRow = await dbGet('SELECT email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [userId]);
      if (!userRow) {
        continue;
      }

      const normalizedEmail = normalizeKnownEmail(userRow.email);
      if (!smtpIdentityMatchesAccount(approvedSmtpUser, normalizedEmail)) {
        continue;
      }

      const existingSmtpUser = String(userRow.smtp_user || '').trim();
      const existingSmtpPass = String(userRow.smtp_pass || '').trim();
      if (existingSmtpUser && existingSmtpPass) {
        continue;
      }

      await dbRun(
        'UPDATE users SET smtp_user = ?, smtp_pass = ?, smtp_signature = COALESCE(smtp_signature, \'\') WHERE id = ?',
        [approvedSmtpUser, approvedSmtpPass, userId]
      );
    }
  } catch (error) {
    if (!/no such table/i.test(String(error && error.message || ''))) {
      console.error('Failed to repair approved Gmail outboxes from request history:', error);
    }
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
const FBG_OFFER_TERMS_ROOT = path.resolve(__dirname, 'Email - Offer Terms');
const AGENT_WORKSPACE_UPLOADS_ROOT = path.resolve(__dirname, 'AGENT_WORKSPACE_UPLOADS');
const AGENT_WORKSPACE_DOCUMENT_CATEGORIES = Object.freeze({
  'executed-contracts': 'Executed Contracts',
  'wire-instructions': 'Wire Instructions',
  disclosures: 'Disclosures',
  'assignment-agreements': 'Assignment Agreement',
  invoices: 'Invoices'
});

const ALLOWED_INVESTOR_ATTACHMENT_EXTENSIONS = Object.freeze([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt',
  '.bmp', '.svg', '.avif', '.heic', '.heif', '.jfif', '.tif', '.tiff'
]);

function isAllowedInvestorAttachmentExtension(extension) {
  return ALLOWED_INVESTOR_ATTACHMENT_EXTENSIONS.includes(String(extension || '').toLowerCase());
}

function isAllowedInvestorAttachmentMimeType(mimeType) {
  const normalized = String(mimeType || '').trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === 'application/pdf' || normalized === 'application/x-pdf') {
    return true;
  }

  if (normalized.startsWith('image/')) {
    return true;
  }

  return [
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ].includes(normalized);
}

function isAllowedInvestorAttachmentFile(extension, mimeType = '') {
  return isAllowedInvestorAttachmentExtension(extension) || isAllowedInvestorAttachmentMimeType(mimeType);
}

function isProofOfFundsFileName(value) {
  return /(?:^|[^a-z0-9])(pof|proof\s*of\s*funds)(?:[^a-z0-9]|$)/i.test(String(value || '').trim());
}

const INVESTOR_ATTACHMENT_PACKAGE_FILE_RULES = Object.freeze({});

function getInvestorAttachmentPackageFileRules(folderName) {
  const normalizedFolderName = String(folderName || '').trim();
  return INVESTOR_ATTACHMENT_PACKAGE_FILE_RULES[normalizedFolderName] || null;
}

function shouldIncludeInvestorAttachmentFile(folderName, fileName) {
  const rules = getInvestorAttachmentPackageFileRules(folderName);
  if (!rules) {
    return true;
  }

  if (rules.excludeProofOfFunds && isProofOfFundsFileName(fileName)) {
    return false;
  }

  return true;
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

function listLegacyAgentWorkspaceDocumentsForUser(decoded) {
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

function findLegacyAgentWorkspaceDocumentForUser(decoded, documentId) {
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

async function listAgentWorkspaceDocumentsForUser(decoded) {
  const uploadedRows = await listUserUploadsForOwner(Number(decoded?.id) || 0, {
    scope: 'agent-workspace'
  });
  const cloudDocuments = uploadedRows.map((row) => ({
    id: String(row.id || '').trim(),
    category: String(row.context_key || '').trim(),
    categoryLabel: getAgentWorkspaceCategoryLabel(row.context_key),
    fileName: String(row.original_file_name || '').trim(),
    fileSize: Math.max(Number(row.file_size) || 0, 0),
    fileType: String(row.file_type || '').trim() || getContentTypeForFileName(row.original_file_name),
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Number(row.created_at) || Date.now(),
    storage: String(row.storage_provider || '').trim().toLowerCase() === 's3' ? 'cloud' : 'local'
  }));

  const legacyDocuments = listLegacyAgentWorkspaceDocumentsForUser(decoded);
  const seenIds = new Set(cloudDocuments.map((item) => item.id));

  legacyDocuments.forEach((item) => {
    if (!seenIds.has(item.id)) {
      cloudDocuments.push(item);
    }
  });

  return cloudDocuments.sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
}

async function findAgentWorkspaceDocumentForUser(decoded, documentId) {
  const uploadRow = await getUserUploadByIdForOwner(Number(decoded?.id) || 0, documentId);
  if (uploadRow && String(uploadRow.scope || '').trim() === 'agent-workspace') {
    return {
      id: String(uploadRow.id || '').trim(),
      category: String(uploadRow.context_key || '').trim(),
      categoryLabel: getAgentWorkspaceCategoryLabel(uploadRow.context_key),
      fileName: String(uploadRow.original_file_name || '').trim(),
      fileSize: Math.max(Number(uploadRow.file_size) || 0, 0),
      fileType: String(uploadRow.file_type || '').trim() || getContentTypeForFileName(uploadRow.original_file_name),
      createdAt: Number(uploadRow.created_at) || Date.now(),
      updatedAt: Number(uploadRow.updated_at) || Number(uploadRow.created_at) || Date.now(),
      storageProvider: String(uploadRow.storage_provider || '').trim().toLowerCase(),
      storageKey: String(uploadRow.storage_key || '').trim(),
      dbRow: uploadRow
    };
  }

  return findLegacyAgentWorkspaceDocumentForUser(decoded, documentId);
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

  const packageRelativePath = path.relative(INVESTOR_ATTACHMENTS_ROOT, absolutePath);
  const packageSegments = packageRelativePath.split(path.sep).filter(Boolean);
  if (packageSegments.length < 2) {
    return '';
  }

  const packageFolderName = packageSegments[0] || '';
  const packageFileName = packageSegments.length > 1 ? packageSegments[packageSegments.length - 1] : '';

  if (!shouldIncludeInvestorAttachmentFile(packageFolderName, packageFileName)) {
    return '';
  }

  return absolutePath;
}

const INVESTOR_ATTACHMENT_PACKAGE_METADATA = {
  Alex: {
    label: 'Alex - Chapter One Holdings LLC',
    offerProfile: {
      entityValue: 'chapter-one-holdings-llc',
      entityLabel: 'Chapter One Holdings LLC',
      signerName: 'Alex Di Girgis',
      depositMode: 'flat-fee',
      depositAmount: '10000',
      closeEscrowDays: '17',
      closeEscrowNote: '17 days after acceptance',
      offerType: 'cash',
      appraisal: 'no-appraisal-contingencies',
      inspectionPeriod: '5',
      disclosures: '5',
      termiteInspection: 'no-termite',
      escrowFees: 'buyer',
      titleFees: 'buyer',
      cityTransferTax: 'seller',
      countyTransferTax: 'seller',
      escrowCompany: 'Clear Water Escrow - Rosalee Whitby',
      titleCompany: "Lawyer's Title - Orange County - Liz Ochoa",
      otherTermsSummary: 'Property to be delivered vacant at close of escrow.',
      contingencySummary: '5 day inspection, 5 day disclosures, no appraisal contingency, no termite inspection, and buyer waives home warranty.',
      closingCostSummary: 'Seller pays 3Q(1-6), if applicable, and 3Q(10-11). Buyer chooses and pays both sides for escrow with Clear Water Escrow - Rosalee Whitby and title with Lawyer\'s Title - Orange County - Liz Ochoa. Buyer waives home warranty.',
      additionalTerms: [
        'Buyer(s) are licensed brokers and licensed agents.',
        'Buyer is a professional real estate investor who buys property at below-market prices for the purposes of resale for profit.',
        'Buyer reserves the right to utilize any and all investment strategies to maximize profit, including buy and hold, fix and flip, resell as-is, or rent as-is.',
        'Property to be delivered vacant at close of escrow.'
      ],
      customSections: [
        {
          heading: 'Contract Terms',
          lines: [
            'Buyer - Chapter signor is Alex Di Girgis.',
            '3A. Price - all cash.',
            '3B. COE - 17 days after acceptance.',
            '3D(1). EMD - $10,000.',
            '3L(3). Inspection - 5 days.',
            '3N(1). Disclosures - 5 days.',
            '3Q(1-6 if applicable) - Seller pays.',
            '3Q(7) - Buyer chooses and pays both sides (Clear Water Escrow - Rosalee Whitby).',
            '3Q(8) - Buyer chooses and pays both sides (Lawyer\'s Title - Orange County - Liz Ochoa).',
            '3Q(10,11) - Seller pays.',
            '3Q(18) - Buyer waives home warranty.'
          ]
        }
      ],
      assignmentVerbiage: 'Buyer(s) are licensed brokers, licensed agents. Buyer is a professional Real Estate Investor who buys property at below-market prices for the purposes of resale for profit. Buyer reserves the right to utilize any and all investment strategies to maximize their profit (i.e. buyhold, fix and flip, resell as-is, rent as-is, etc). Property to be delivered vacant at close of escrow.'
    }
  },
  Kaylnn: {
    label: 'Kalynn Brown - WH4, LLC',
    offerProfile: {
      entityValue: 'wh4-llc',
      entityLabel: 'WH4, LLC',
      signerName: 'Darin Puhl, as authorized agent',
      recipientName: 'Kalynn Brown',
      recipientEmail: 'kbrown@wedgewoodhomesrealty.com',
      assignmentVerbiage: 'EMD to be fully refundable in the instance of seller/assignor non-performance including property not being delivered vacant, not having clear and marketable title, or not in similar condition as when this assignment was executed. Buyer will not assume any payoffs, liens, or assessments. Buyer to walk through on date of funding to verify occupancy status and condition. Any personal property remaining at the property at close of escrow is expressly abandoned by the seller and otherwise released to the buyer.'
    }
  },
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
        .filter((fileEntry) => shouldIncludeInvestorAttachmentFile(folderName, fileEntry.name))
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

function listFbgOfferTermsFiles() {
  if (!fs.existsSync(FBG_OFFER_TERMS_ROOT)) {
    return [];
  }

  return fs.readdirSync(FBG_OFFER_TERMS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isAllowedInvestorAttachmentExtension(path.extname(entry.name)))
    .map((entry) => ({
      name: entry.name,
      path: path.join(FBG_OFFER_TERMS_ROOT, entry.name)
    }))
    .filter((entry) => fs.existsSync(entry.path) && fs.statSync(entry.path).isFile())
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function completeOAuthLogin({ email, name }) {
  const normalizedEmail = normalizeKnownEmail(email);
  if (!normalizedEmail) {
    throw new Error('OAuth provider did not return an email');
  }

  if (!isFastBridgeWorkspaceEmail(normalizedEmail)) {
    throw new Error('Only @fastbridgegroupllc.com Google accounts can sign in.');
  }

  const normalizedName = String(name || '').trim() || normalizedEmail.split('@')[0] || 'User';
  const existingUser = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
  if (!existingUser) {
    throw new Error('This Google account is not approved for access. Ask an admin to create your FAST account first.');
  }

  if (!userHasWebsiteAccess(existingUser)) {
    throw new Error('This account does not have website access yet. Have an admin create or approve it first.');
  }

  const userId = existingUser.id;
  const userRole = isKnownAdminEmail(normalizedEmail) ? 'admin' : existingUser.role;
  await dbRun('UPDATE users SET name = ?, role = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?', [normalizedName, userRole, existingUser.id]);

  const userPayload = {
    id: userId,
    email: normalizedEmail,
    role: userRole,
    name: normalizedName
  };

  return { user: serializeUser(userPayload) };
}

function redirectOAuthError(res, message) {
  const params = new URLSearchParams({ oauth_error: String(message || 'OAuth sign in failed') });
  res.redirect(`/login.html?${params.toString()}`);
}

function formatGoogleOAuthError(error) {
  const rawMessage = String(error?.message || error || '').trim();
  const normalized = rawMessage.toLowerCase();

  if (!rawMessage) {
    return 'Google sign-in failed';
  }

  if (normalized.includes('redirect_uri_mismatch')) {
    return 'Google sign-in redirect URI mismatch. In Google Cloud, add https://fastbridgegroupllc.com/auth/google/callback as an authorized redirect URI.';
  }

  if (normalized.includes('invalid_client')) {
    return 'Google sign-in client credentials are invalid. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server environment.';
  }

  if (normalized.includes('access blocked') || normalized.includes('access_denied')) {
    return 'Google blocked this OAuth app. Check the OAuth consent screen publishing status and allowed test users in Google Cloud.';
  }

  if (normalized.includes('did not return an access token')) {
    return 'Google sign-in failed because Google did not return an access token.';
  }

  if (normalized.includes('userinfo')) {
    return 'Google sign-in succeeded at authorization but failed while reading the Google account profile.';
  }

  if (normalized.includes('not fully configured')) {
    return 'Google sign-in is not fully configured on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the environment.';
  }

  return rawMessage.length > 220 ? `${rawMessage.slice(0, 217)}...` : rawMessage;
}

// Routes

app.get('/api/auth/google', (req, res) => {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = getGoogleRedirectUri(req);

  if (!clientId || !clientSecret) {
    return res.status(503).json({
      configured: false,
      error: 'Google sign-in is not fully configured on the server yet'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    hd: 'fastbridgegroupllc.com',
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
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = getGoogleRedirectUri(req);

  if (!clientId || !clientSecret) {
    return redirectOAuthError(res, 'Google sign-in is not fully configured on the server yet');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    hd: 'fastbridgegroupllc.com',
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

    const security = await getUserSecuritySettings(login.user.id);
    const params = new URLSearchParams({ oauth: 'google' });
    if (security.enabled && security.appEnabled && security.totpSecret && security.appVerifiedAt) {
      params.set('two_factor', '1');
      params.set('challenge', issueTwoFactorChallenge(login.user));
      params.set('email', login.user.email);
      return res.redirect(`/login.html?${params.toString()}`);
    }

    const sessionId = await createAuthSession(login.user.id, req);
    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [login.user.id]);
    params.set('token', issueAuthToken(login.user, sessionId));
    return res.redirect(`/login.html?${params.toString()}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirectOAuthError(res, formatGoogleOAuthError(error));
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = normalizeKnownEmail(email);

  if (!isFastBridgeWorkspaceEmail(normalizedEmail)) {
    return res.status(403).json({ error: 'Only @fastbridgegroupllc.com accounts can sign in.' });
  }

  if (normalizedEmail === CANONICAL_LORIA_EMAIL) {
    await syncLoriaBrokerAccount();
  }

  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!userHasWebsiteAccess(user)) {
      return res.status(403).json({ error: 'This account does not have website access yet. Contact an admin.' });
    }

    try {
      // Compare password with hash
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const security = await getUserSecuritySettings(user.id);
      if (security.enabled && security.appEnabled && security.totpSecret && security.appVerifiedAt) {
        return res.json({
          success: true,
          requiresTwoFactor: true,
          challengeToken: issueTwoFactorChallenge(user),
          methods: ['app'],
          user: {
            email: user.email,
            name: user.name
          }
        });
      }

      await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      const sessionId = await createAuthSession(user.id, req);
      const token = issueAuthToken(user, sessionId);

      return res.json({
        success: true,
        token,
        user: serializeUser(user)
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

app.post('/api/login/2fa', async (req, res) => {
  const challengeToken = String(req.body?.challengeToken || '').trim();
  const code = String(req.body?.code || '').trim();

  if (!challengeToken || !code) {
    return res.status(400).json({ error: 'Challenge token and verification code are required.' });
  }

  try {
    const challenge = verifyTwoFactorChallenge(challengeToken);
    const user = await dbGet('SELECT id, name, email, role, avatar_upload_id FROM users WHERE id = ?', [challenge.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const security = await getUserSecuritySettings(user.id);
    if (!(security.enabled && security.appEnabled && security.totpSecret && security.appVerifiedAt)) {
      return res.status(400).json({ error: 'Two-factor authentication is not configured for this account.' });
    }

    if (!verifyTotpCode(security.totpSecret, code)) {
      return res.status(401).json({ error: 'Invalid verification code.' });
    }

    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    const sessionId = await createAuthSession(user.id, req);
    const token = issueAuthToken(user, sessionId);

    return res.json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    return res.status(401).json({ error: 'The two-factor challenge is invalid or expired.' });
  }
});

// Public registration is disabled. Use admin-only endpoint below.
app.post('/api/register', (req, res) => {
  return res.status(403).json({ error: 'Public registration is disabled. Contact an admin.' });
});

app.get('/api/feature-access', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const featureAccess = await getFeatureAccessSettings();
    return res.json({ success: true, featureAccess });
  } catch (error) {
    console.error('Feature access status error:', error);
    return res.status(500).json({ error: 'Unable to load feature access settings.' });
  }
});

app.get('/api/announcements/current', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  try {
    const announcement = await getAnnouncementSettings();
    return res.json({ success: true, announcement });
  } catch (error) {
    console.error('Announcement status error:', error);
    return res.status(500).json({ error: 'Unable to load the current announcement.' });
  }
});

app.get('/api/admin/announcements', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const announcement = await getAnnouncementSettings();
    return res.json({ success: true, announcement });
  } catch (error) {
    console.error('Admin announcement load error:', error);
    return res.status(500).json({ error: 'Unable to load admin announcement settings.' });
  }
});

app.put('/api/admin/announcements', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const nextAnnouncement = req.body?.announcement || req.body;
    const announcement = await saveAnnouncementSettings(nextAnnouncement, {
      id: decoded.id,
      email: decoded.email
    });

    return res.json({
      success: true,
      message: !announcement.enabled
        ? 'Announcement cleared successfully.'
        : announcement.status === 'scheduled'
          ? 'Announcement scheduled successfully.'
          : 'Announcement published successfully.',
      announcement
    });
  } catch (error) {
    console.error('Admin announcement save error:', error);
    return res.status(500).json({ error: 'Unable to save the announcement.' });
  }
});

app.get('/api/admin/feature-access', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const featureAccess = await getFeatureAccessSettings();
    return res.json({ success: true, featureAccess });
  } catch (error) {
    console.error('Admin feature access load error:', error);
    return res.status(500).json({ error: 'Unable to load admin feature access settings.' });
  }
});

app.put('/api/admin/feature-access', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const nextFeatures = req.body?.featureAccess?.features || req.body?.features || req.body;
    const featureAccess = await saveFeatureAccessSettings(nextFeatures, {
      id: decoded.id,
      email: decoded.email
    });

    return res.json({
      success: true,
      message: 'Feature access settings saved successfully.',
      featureAccess
    });
  } catch (error) {
    console.error('Admin feature access save error:', error);
    return res.status(500).json({ error: 'Unable to save feature access settings.' });
  }
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
  const normalizedEmail = normalizeKnownEmail(email);
  const normalizedRole = String(role || 'user').trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (!isFastBridgeWorkspaceEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'User email must use the @fastbridgegroupllc.com domain' });
  }

  if (!['admin', 'user', 'broker', PREMIUM_USER_ROLE, TEST_USER_ROLE].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Role must be admin, user, broker, premium user, or test user' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  bcrypt.hash(password, 10, (hashError, hash) => {
    if (hashError) {
      return res.status(500).json({ error: 'Error processing password' });
    }

    db.run(
      'INSERT INTO users (name, email, password_hash, role, access_granted) VALUES (?, ?, ?, ?, ?)',
      [normalizedName, normalizedEmail, hash, normalizedRole, 1],
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
          user: serializeUser({
            id: this.lastID,
            name: normalizedName,
            email: normalizedEmail,
            role: normalizedRole
          })
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
  const nextEmail = normalizeKnownEmail(req.body?.email || '');
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

  if (!isFastBridgeWorkspaceEmail(nextEmail)) {
    return res.status(400).json({ error: 'User email must use the @fastbridgegroupllc.com domain' });
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

app.delete('/api/admin/users/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const userId = Number.parseInt(String(req.params?.id || ''), 10);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Valid user id is required' });
  }

  if (Number(decoded.id) === userId) {
    return res.status(400).json({ error: 'You cannot delete your own account while signed in' });
  }

  try {
    const userRow = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const normalizedEmail = String(userRow.email || '').trim().toLowerCase();
    const normalizedRole = String(userRow.role || '').trim().toLowerCase();
    if (normalizedRole === 'admin' || isKnownAdminEmail(normalizedEmail)) {
      return res.status(403).json({ error: 'Protected admin accounts cannot be deleted' });
    }

    const cleanup = await deleteUserAccountById(userId);

    return res.json({
      success: true,
      message: 'User deleted successfully',
      user: serializeUser(userRow),
      cleanup
    });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return res.status(500).json({ error: 'Unable to delete user account' });
  }
});

app.get('/api/admin/online-users', (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  db.all(
    `SELECT
        u.id AS user_id,
        u.name,
        u.email,
        u.role,
        s.id AS session_id,
        s.user_agent,
        s.ip_address,
        s.created_at,
        s.last_seen_at
      FROM auth_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.revoked_at IS NULL
        AND datetime(COALESCE(s.last_seen_at, s.created_at)) >= datetime('now', ?)
      ORDER BY datetime(COALESCE(s.last_seen_at, s.created_at)) DESC`,
    [`-${ONLINE_USER_ACTIVITY_WINDOW_MINUTES} minutes`],
    (error, rows) => {
      if (error) {
        console.error('Online users query error:', error);
        return res.status(500).json({ error: 'Unable to load online users.' });
      }

      const byUserId = new Map();
      const sessions = Array.isArray(rows) ? rows : [];

      sessions.forEach((row) => {
        const userId = Number(row.user_id);
        if (!byUserId.has(userId)) {
          byUserId.set(userId, {
            id: userId,
            name: row.name,
            email: row.email,
            role: serializeUser(row)?.role || String(row.role || '').trim().toLowerCase(),
            lastSeenAt: row.last_seen_at || row.created_at || '',
            sessions: []
          });
        }

        const item = byUserId.get(userId);
        const sessionLastSeen = row.last_seen_at || row.created_at || '';
        if (sessionLastSeen && (!item.lastSeenAt || new Date(sessionLastSeen).getTime() > new Date(item.lastSeenAt).getTime())) {
          item.lastSeenAt = sessionLastSeen;
        }

        item.sessions.push({
          id: row.session_id,
          userAgent: String(row.user_agent || ''),
          ipAddress: String(row.ip_address || ''),
          createdAt: row.created_at,
          lastSeenAt: row.last_seen_at || row.created_at || ''
        });
      });

      const users = Array.from(byUserId.values())
        .map((user) => ({
          ...user,
          sessionCount: user.sessions.length
        }))
        .sort((left, right) => new Date(right.lastSeenAt || 0).getTime() - new Date(left.lastSeenAt || 0).getTime());

      return res.json({
        success: true,
        windowMinutes: ONLINE_USER_ACTIVITY_WINDOW_MINUTES,
        totalUsersOnline: users.length,
        totalSessionsOnline: sessions.length,
        users
      });
    }
  );
});

// Verify token endpoint
app.post('/api/verify', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  db.get('SELECT id, name, email, role, avatar_upload_id FROM users WHERE id = ?', [decoded.id], (error, userRow) => {
    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user: serializeUser(userRow) });
  });
});

app.post('/api/logout', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    if (decoded.sessionId) {
      await revokeAuthSession(decoded.sessionId, 'logout');
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to end session.' });
  }
});

app.post('/api/security/change-password', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All password fields are required.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const user = await dbGet('SELECT id, password_hash FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [nextHash, decoded.id]);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Unable to change password right now.' });
  }
});

app.get('/api/security/2fa', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const settings = await getUserSecuritySettings(decoded.id);
    return res.json({
      success: true,
      settings: {
        enabled: settings.enabled,
        appEnabled: settings.appEnabled,
        appVerified: Boolean(settings.appVerifiedAt),
        hasSecret: Boolean(settings.totpSecret),
        updatedAt: settings.updatedAt,
        setupKey: settings.appVerifiedAt ? '' : settings.totpSecret
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load 2FA settings.' });
  }
});

app.post('/api/security/2fa/app/setup', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const secret = generateTotpSecret();
    await saveUserSecuritySettings(decoded.id, {
      enabled: false,
      appEnabled: true,
      totpSecret: secret,
      appVerifiedAt: ''
    });

    const issuer = encodeURIComponent('FAST BRIDGE GROUP');
    const label = encodeURIComponent(decoded.email);
    const otpauthUri = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;
    return res.json({ success: true, setupKey: secret, otpauthUri });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to create a 2FA setup key.' });
  }
});

app.post('/api/security/2fa/app/verify', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const code = String(req.body?.code || '').trim();
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  try {
    const current = await getUserSecuritySettings(decoded.id);
    if (!current.totpSecret) {
      return res.status(400).json({ error: 'Create a setup key before verifying 2FA.' });
    }
    if (!verifyTotpCode(current.totpSecret, code)) {
      return res.status(401).json({ error: 'Invalid verification code.' });
    }

    const verifiedAt = new Date().toISOString();
    await saveUserSecuritySettings(decoded.id, {
      enabled: true,
      appEnabled: true,
      totpSecret: current.totpSecret,
      appVerifiedAt: verifiedAt
    });

    return res.json({ success: true, settings: { enabled: true, appEnabled: true, appVerified: true, updatedAt: verifiedAt } });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to verify 2FA.' });
  }
});

app.put('/api/security/2fa', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const enabled = Boolean(req.body?.enabled);
  const appEnabled = Boolean(req.body?.appEnabled);

  try {
    const current = await getUserSecuritySettings(decoded.id);
    if (enabled && !(appEnabled && current.totpSecret && current.appVerifiedAt)) {
      return res.status(400).json({ error: 'Verify your authenticator app before enabling 2FA.' });
    }

    await saveUserSecuritySettings(decoded.id, {
      enabled,
      appEnabled: appEnabled && Boolean(current.totpSecret),
      totpSecret: current.totpSecret,
      appVerifiedAt: current.appVerifiedAt
    });

    return res.json({
      success: true,
      settings: {
        enabled,
        appEnabled: appEnabled && Boolean(current.totpSecret),
        appVerified: Boolean(current.appVerifiedAt)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to update 2FA settings.' });
  }
});

app.get('/api/security/sessions', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  db.all(
    `SELECT id, user_agent, ip_address, created_at, last_seen_at, revoked_at
       FROM auth_sessions
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC`,
    [decoded.id],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ error: 'Unable to load active sessions.' });
      }

      const sessions = (Array.isArray(rows) ? rows : []).map((row) => ({
        id: row.id,
        userAgent: String(row.user_agent || ''),
        ipAddress: String(row.ip_address || ''),
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        revokedAt: row.revoked_at,
        current: String(decoded.sessionId || '') === String(row.id || ''),
        active: !row.revoked_at
      }));

      return res.json({ success: true, sessions });
    }
  );
});

app.delete('/api/security/sessions/:id', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const sessionId = String(req.params?.id || '').trim();
  if (!sessionId) {
    return res.status(400).json({ error: 'Session id is required.' });
  }

  try {
    const session = await dbGet('SELECT id, user_id, revoked_at FROM auth_sessions WHERE id = ?', [sessionId]);
    if (!session || Number(session.user_id) !== Number(decoded.id)) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (!session.revoked_at) {
      await revokeAuthSession(sessionId, sessionId === decoded.sessionId ? 'current-session-revoked' : 'revoked-from-security');
    }
    return res.json({ success: true, revokedCurrent: sessionId === decoded.sessionId });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to revoke session.' });
  }
});

app.get('/api/subscription/status', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const userRow = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptionRow = await dbGet(
      `SELECT billing_name, billing_email, billing_phone, company_name, address_line1, address_line2,
              city, state_region, postal_code, country, cardholder_name, card_brand, card_last4,
              subscription_status, activated_at
         FROM subscription_profiles
        WHERE user_id = ?`,
      [decoded.id]
    );

    return res.json({
      success: true,
      user: serializeUser(userRow),
      subscription: buildSubscriptionPayload(userRow, subscriptionRow)
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return res.status(500).json({ error: 'Unable to load subscription status' });
  }
});

app.get('/api/subscription/stripe-config', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  return res.json({
    success: true,
    enabled: Boolean(STRIPE_PUBLISHABLE_KEY),
    publishableKey: STRIPE_PUBLISHABLE_KEY
  });
});

app.get('/api/maps/google-config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  const earthMapId = GOOGLE_MAPS_MAP_ID || GOOGLE_EARTH_FALLBACK_MAP_ID;
  const earthMissingConfig = [];
  if (!GOOGLE_MAPS_API_KEY) {
    earthMissingConfig.push('GOOGLE_MAPS_API_KEY');
  }

  const earthEnabled = earthMissingConfig.length === 0;
  const earthMessage = earthEnabled
    ? (GOOGLE_MAPS_MAP_ID
      ? 'FAST Earth is configured through Google Maps JavaScript 3D with your JavaScript Map ID.'
      : 'FAST Earth is using the Google Maps JavaScript 3D demo Map ID because GOOGLE_MAPS_MAP_ID is not configured on the server yet.')
    : `FAST Earth uses Google Maps JavaScript 3D, not Google Earth Engine. Missing ${earthMissingConfig.join(' and ')} on the server. Also verify Maps JavaScript API, billing, and a JavaScript Map ID are enabled in Google Cloud.`;

  return res.json({
    success: true,
    enabled: Boolean(GOOGLE_MAPS_API_KEY),
    apiKey: GOOGLE_MAPS_API_KEY,
    mapId: GOOGLE_MAPS_MAP_ID,
    earthMapId,
    earthEnabled,
    earthViewer: 'google-maps-javascript-3d',
    earthMissingConfig,
    earthMessage,
    stylePath: '/Themes/google-maps-mls-light.json'
  });
});

app.post('/api/subscription/premium-checkout', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  if (String(decoded.role || '').trim().toLowerCase() === 'admin') {
    return res.status(400).json({ error: 'Admin accounts already have full access and do not require a subscription.' });
  }

  const billingName = sanitizeBillingField(req.body?.billingName);
  const billingEmail = sanitizeBillingField(req.body?.billingEmail).toLowerCase();
  const billingPhone = sanitizeBillingField(req.body?.billingPhone, 40);
  const companyName = sanitizeBillingField(req.body?.companyName);
  const addressLine1 = sanitizeBillingField(req.body?.addressLine1);
  const addressLine2 = sanitizeBillingField(req.body?.addressLine2);
  const city = sanitizeBillingField(req.body?.city, 80);
  const stateRegion = sanitizeBillingField(req.body?.stateRegion, 80);
  const postalCode = sanitizeBillingField(req.body?.postalCode, 24);
  const country = sanitizeBillingField(req.body?.country, 80) || 'United States';
  const cardholderName = sanitizeBillingField(req.body?.cardholderName) || billingName;
  const paymentMethodId = sanitizeBillingField(req.body?.paymentMethodId, 160);
  const cardBrand = sanitizeBillingField(req.body?.cardBrand, 40);
  const cardLast4 = String(req.body?.cardLast4 || '').replace(/\D+/g, '').slice(-4);

  if (!billingName || !billingEmail || !addressLine1 || !city || !stateRegion || !postalCode || !cardholderName) {
    return res.status(400).json({ error: 'Complete all required billing fields.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return res.status(400).json({ error: 'Enter a valid billing email address.' });
  }

  if (!paymentMethodId) {
    return res.status(400).json({ error: 'Add a card through Stripe before activating Premium.' });
  }

  if (!cardBrand || !/^\d{4}$/.test(cardLast4)) {
    return res.status(400).json({ error: 'Stripe card details are incomplete. Try re-entering the card.' });
  }

  try {
    const userRow = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    await dbRun('UPDATE users SET role = ? WHERE id = ?', [PREMIUM_USER_ROLE, decoded.id]);
    await dbRun(
      `INSERT INTO subscription_profiles (
          user_id, plan_key, billing_name, billing_email, billing_phone, company_name,
          address_line1, address_line2, city, state_region, postal_code, country,
          cardholder_name, card_brand, card_last4, stripe_payment_method_id, subscription_status, amount_cents,
          currency, activated_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          plan_key = excluded.plan_key,
          billing_name = excluded.billing_name,
          billing_email = excluded.billing_email,
          billing_phone = excluded.billing_phone,
          company_name = excluded.company_name,
          address_line1 = excluded.address_line1,
          address_line2 = excluded.address_line2,
          city = excluded.city,
          state_region = excluded.state_region,
          postal_code = excluded.postal_code,
          country = excluded.country,
          cardholder_name = excluded.cardholder_name,
          card_brand = excluded.card_brand,
          card_last4 = excluded.card_last4,
          stripe_payment_method_id = excluded.stripe_payment_method_id,
          subscription_status = 'active',
          amount_cents = excluded.amount_cents,
          currency = excluded.currency,
          activated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP`,
      [
        decoded.id,
        PREMIUM_PLAN_KEY,
        billingName,
        billingEmail,
        billingPhone,
        companyName,
        addressLine1,
        addressLine2,
        city,
        stateRegion,
        postalCode,
        country,
        cardholderName,
        cardBrand,
        cardLast4,
        paymentMethodId,
        PREMIUM_PRICE_CENTS,
        PREMIUM_CURRENCY
      ]
    );

    const updatedUser = {
      ...userRow,
      role: PREMIUM_USER_ROLE
    };
    const token = issueAuthToken(updatedUser);

    return res.json({
      success: true,
      message: 'Premium activated successfully.',
      token,
      user: serializeUser(updatedUser),
      subscription: buildSubscriptionPayload(updatedUser, {
        billing_name: billingName,
        billing_email: billingEmail,
        billing_phone: billingPhone,
        company_name: companyName,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state_region: stateRegion,
        postal_code: postalCode,
        country,
        cardholder_name: cardholderName,
        card_brand: cardBrand,
        card_last4: cardLast4,
        subscription_status: 'active',
        activated_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Premium checkout error:', error);
    return res.status(500).json({ error: 'Unable to activate premium right now.' });
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
    const decoded = jwt.verify(token, JWT_SECRET);
    const sessionId = String(decoded?.sessionId || '').trim();
    if (sessionId && revokedSessionIds.has(sessionId)) {
      res.status(401).json({ error: 'Session has expired. Please sign in again.' });
      return null;
    }
    if (sessionId) {
      db.run('UPDATE auth_sessions SET last_seen_at = ? WHERE id = ? AND revoked_at IS NULL', [new Date().toISOString(), sessionId], () => {});
    }
    return decoded;
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

app.get('/api/admin/storage-status', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const shouldVerify = /^(1|true|yes)$/i.test(String(req.query?.verify || '').trim());
  const shouldRunBackup = /^(1|true|yes)$/i.test(String(req.query?.backup || '').trim());
  const databasePath = path.resolve(DATABASE_FILE_PATH);
  const usingFallbackDatabase = isUsingFallbackDatabasePath(DATABASE_FILE_PATH);
  const persistentDatabaseConfigured = !usingFallbackDatabase;
  const s3ConfigSummary = maskS3StorageConfig();

  try {
    const s3Archive = shouldVerify
      ? await verifyS3ArchiveStorage()
      : (latestS3ArchiveHealth || {
          ok: false,
          checkedAt: null,
          reason: s3ConfigSummary.configured
            ? 'S3 archive verification has not been run yet. Call this endpoint with ?verify=1.'
            : 'S3 archive storage is not fully configured.',
          config: s3ConfigSummary
        });
    const sqliteBackup = shouldRunBackup
      ? await runSqliteBackupToS3('admin-endpoint')
      : buildSqliteBackupStorageStatus();

    return res.json({
      success: true,
      database: {
        path: databasePath,
        persistent: persistentDatabaseConfigured,
        usingFallbackAppFile: usingFallbackDatabase,
        production: isProductionEnvironment()
      },
      messageStore: buildUserMessageStoreStatus(),
      s3Archive,
      sqliteBackup
    });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : 'Unable to load storage status.'
    });
  }
});

function normalizeApiTimestamp(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(rawValue)) {
    return `${rawValue.replace(' ', 'T')}Z`;
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return parsed.toISOString();
}

function serializeUserMessage(row, currentUserId) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const senderUserId = Number(row.sender_user_id);
  const recipientUserId = Number(row.recipient_user_id);
  const activeUserId = Number(currentUserId);
  const createdAt = normalizeApiTimestamp(row.created_at);
  const editedAt = normalizeApiTimestamp(row.edited_at);
  const createdDate = createdAt ? new Date(createdAt) : null;
  const editWindowEndsAt = createdDate && !Number.isNaN(createdDate.getTime())
    ? new Date(createdDate.getTime() + USER_MESSAGE_EDIT_WINDOW_MS).toISOString()
    : null;
  const canEdit = senderUserId === activeUserId
    && createdDate instanceof Date
    && !Number.isNaN(createdDate.getTime())
    && (Date.now() - createdDate.getTime()) <= USER_MESSAGE_EDIT_WINDOW_MS;

  return {
    id: Number(row.id),
    senderUserId,
    recipientUserId,
    body: String(row.body || '').trim(),
    createdAt,
    editedAt,
    editWindowEndsAt,
    canEdit,
    readAt: normalizeApiTimestamp(row.read_at),
    direction: senderUserId === activeUserId ? 'outgoing' : 'incoming'
  };
}

function serializeMessageNotification(row, currentUserId) {
  const message = serializeUserMessage(row, currentUserId);
  if (!message) {
    return null;
  }

  return {
    ...message,
    sender: {
      id: Number(row.sender_id) || Number(row.sender_user_id) || 0,
      name: String(row.sender_name || '').trim() || 'User',
      email: String(row.sender_email || '').trim().toLowerCase(),
      role: String(row.sender_role || '').trim().toLowerCase()
    }
  };
}

function normalizePdfExtractText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildFullPdfText(parsedResult) {
  const parsed = parsedResult && typeof parsedResult === 'object' ? parsedResult : {};
  const pageTexts = Array.isArray(parsed.pages)
    ? parsed.pages
        .map((page) => normalizePdfExtractText(page && typeof page === 'object' ? page.text : ''))
        .filter(Boolean)
    : [];
  const mergedPageText = pageTexts.join('\n\n');
  const aggregateText = normalizePdfExtractText(parsed.text);

  if (mergedPageText.length > aggregateText.length) {
    return {
      text: mergedPageText,
      pageTexts,
      parsedPageCount: pageTexts.length
    };
  }

  return {
    text: aggregateText || mergedPageText,
    pageTexts,
    parsedPageCount: pageTexts.length
  };
}

function buildMlsImportExtractionSegments(fullText, pageTexts) {
  const segments = [];
  const seenTexts = new Set();
  const normalizedPages = (Array.isArray(pageTexts) ? pageTexts : [])
    .map((pageText) => normalizePdfExtractText(pageText))
    .filter(Boolean);
  const listingSegments = [];

  const pushSegment = (text, label) => {
    const normalizedText = normalizePdfExtractText(text);
    if (!normalizedText || seenTexts.has(normalizedText)) {
      return null;
    }

    seenTexts.add(normalizedText);
    const segment = {
      text: normalizedText,
      label: String(label || '').trim()
    };
    segments.push(segment);
    return segment;
  };

  if (normalizedPages.length > 1) {
    let currentPages = [];
    let currentStartPage = 1;

    const flushListingSegment = () => {
      if (currentPages.length === 0) {
        return;
      }

      const endPage = currentStartPage + currentPages.length - 1;
      const listingSegment = pushSegment(
        currentPages.join('\n\n'),
        currentStartPage === endPage
          ? `listing page ${currentStartPage}`
          : `listing pages ${currentStartPage}-${endPage}`
      );
      if (listingSegment) {
        listingSegments.push(listingSegment);
      }
      currentPages = [];
    };

    normalizedPages.forEach((pageText, index) => {
      const lines = pageText.split(/\n+/).map((line) => String(line || '').trim()).filter(Boolean);
      const pageLooksLikeListingStart = lines.slice(0, 8).some((line) => Boolean(extractPropertyAddressCandidateFromLine(line)));

      if (pageLooksLikeListingStart && currentPages.length > 0) {
        flushListingSegment();
        currentStartPage = index + 1;
      } else if (currentPages.length === 0) {
        currentStartPage = index + 1;
      }

      currentPages.push(pageText);
    });

    flushListingSegment();
  }

  if (normalizedPages.length >= 80 && listingSegments.length > 0) {
    return listingSegments;
  }

  normalizedPages.forEach((pageText, index) => {
    pushSegment(pageText, `page ${index + 1}`);
  });

  for (let index = 0; index < normalizedPages.length - 1; index += 1) {
    pushSegment(
      [normalizedPages[index], normalizedPages[index + 1]].filter(Boolean).join('\n\n'),
      `pages ${index + 1}-${index + 2}`
    );
  }

  const chunkSize = normalizedPages.length >= 300
    ? 8
    : normalizedPages.length >= 120
      ? 6
      : normalizedPages.length >= 40
        ? 4
        : 3;
  const chunkStep = normalizedPages.length >= 300 ? 4 : Math.max(1, chunkSize - 1);

  for (let startIndex = 0; startIndex < normalizedPages.length; startIndex += chunkStep) {
    const chunkPages = normalizedPages.slice(startIndex, startIndex + chunkSize).filter(Boolean);
    if (chunkPages.length < 3) {
      continue;
    }
    pushSegment(
      chunkPages.join('\n\n'),
      `pages ${startIndex + 1}-${startIndex + chunkPages.length}`
    );
  }

  pushSegment(fullText, normalizedPages.length > 0 ? `full document (${normalizedPages.length} pages)` : 'full document');

  return segments;
}

function buildMlsImportAiExtractionSegments(fullText, pageTexts) {
  const normalizedPages = (Array.isArray(pageTexts) ? pageTexts : [])
    .map((pageText) => normalizePdfExtractText(pageText))
    .filter(Boolean);

  if (normalizedPages.length === 0) {
    return [{
      text: normalizePdfExtractText(fullText),
      label: 'full document'
    }].filter((segment) => Boolean(segment.text));
  }

  const segments = [];
  if (normalizedPages.length >= 80) {
    let currentPages = [];
    let currentStartPage = 1;

    const flushListingChunk = () => {
      if (currentPages.length === 0) {
        return;
      }
      const endPage = currentStartPage + currentPages.length - 1;
      segments.push({
        text: currentPages.join('\n\n'),
        label: currentStartPage === endPage ? `listing page ${currentStartPage}` : `listing pages ${currentStartPage}-${endPage}`
      });
      currentPages = [];
    };

    normalizedPages.forEach((pageText, index) => {
      const lines = pageText.split(/\n+/).map((line) => String(line || '').trim()).filter(Boolean);
      const pageLooksLikeListingStart = lines.slice(0, 8).some((line) => Boolean(extractPropertyAddressCandidateFromLine(line)));

      if (pageLooksLikeListingStart && currentPages.length > 0) {
        flushListingChunk();
        currentStartPage = index + 1;
      } else if (currentPages.length === 0) {
        currentStartPage = index + 1;
      }

      currentPages.push(pageText);
    });

    flushListingChunk();

    if (segments.length > 0) {
      return segments;
    }
  }

  const maxCharsPerSegment = normalizedPages.length >= 180 ? 12000 : 15000;
  const maxPagesPerSegment = normalizedPages.length >= 240 ? 4 : normalizedPages.length >= 120 ? 5 : 6;

  let index = 0;
  while (index < normalizedPages.length) {
    const collectedPages = [];
    let collectedChars = 0;
    const startPage = index + 1;

    while (index < normalizedPages.length && collectedPages.length < maxPagesPerSegment) {
      const nextPage = normalizedPages[index];
      const nextLength = nextPage.length + (collectedPages.length > 0 ? 2 : 0);
      if (collectedPages.length > 0 && collectedChars + nextLength > maxCharsPerSegment) {
        break;
      }

      collectedPages.push(nextPage);
      collectedChars += nextLength;
      index += 1;
    }

    if (collectedPages.length === 0) {
      collectedPages.push(normalizedPages[index].slice(0, maxCharsPerSegment));
      index += 1;
    }

    const endPage = startPage + collectedPages.length - 1;
    segments.push({
      text: collectedPages.join('\n\n'),
      label: startPage === endPage ? `page ${startPage}` : `pages ${startPage}-${endPage}`
    });
  }

  return segments;
}

function extractRowsFromMlsImportCandidateText(text) {
  const normalizedText = normalizePdfExtractText(text);
  if (!normalizedText) {
    return [];
  }

  const blockTexts = splitMlsImportTextIntoBlocks(normalizedText);
  const sourceRows = mergeMlsImportRows(
    (blockTexts.length > 0 ? blockTexts : [normalizedText])
      .map((blockText) => extractMlsImportRowFromText(blockText))
      .filter(Boolean)
  );

  if (sourceRows.length > 0) {
    return sourceRows;
  }

  const wholeTextRow = extractMlsImportRowFromText(normalizedText);
  return wholeTextRow ? [wholeTextRow] : [];
}

function waitForMlsImportAnalysisTurn() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

function sanitizeMlsImportAiRow(rowLike) {
  const source = rowLike && typeof rowLike === 'object' ? rowLike : {};
  const rawAddress = normalizePdfPropertyAddressValue(source.propertyAddress || source.address || source.property || '');
  const normalizedAddress = extractPropertyAddressCandidateFromLine(rawAddress);
  const normalizedName = formatPersonName(source.laName || source.agentName || source.listingAgent || source.name || '');
  const normalizedOfficePhone = extractPhoneNumber(source.loPhone || source.officePhone || source.brokerPhone || '');
  const normalizedOffersEmail = extractEmailAddress(source.offersEmail || source.offerEmail || source.email || '');
  const normalizedLaCell = extractPhoneNumber(source.laCell || source.agentCell || source.mobile || source.phone || '');
  const normalizedLaDirect = extractPhoneNumber(source.laDirect || source.directPhone || source.directLine || source.agentDirect || source.listingAgentDirect || '');
  const normalizedLaEmail = extractEmailAddress(source.laEmail || source.agentEmail || source.listingAgentEmail || source.directEmail || '');
  const normalizedStatus = formatMlsStatusFieldValue(source.status || source.listingStatus || '');

  return normalizeMlsImportRow({
    propertyAddress: normalizedAddress,
    laName: normalizedName,
    loPhone: normalizedOfficePhone,
    offersEmail: normalizedOffersEmail,
    laCell: normalizedLaCell,
    laDirect: normalizedLaDirect,
    laEmail: normalizedLaEmail,
    status: normalizedStatus
  });
}

function isUsefulMlsImportRow(rowLike) {
  const row = normalizeMlsImportRow(rowLike);
  const hasAddress = Boolean(row.propertyAddress);
  const hasContact = Boolean(row.laName || row.loPhone || row.offersEmail || row.laCell || row.laDirect || row.laEmail);
  return hasAddress && hasContact;
}

function shouldUseOpenAiMlsFallback(rows, pageCount) {
  if (getOpenAiApiKeyCandidates().length === 0) {
    return false;
  }

  const usefulRows = (Array.isArray(rows) ? rows : []).filter(isUsefulMlsImportRow);
  const totalPages = Math.max(0, Number(pageCount) || 0);
  if (usefulRows.length === 0) {
    return true;
  }

  if (totalPages >= 40 && usefulRows.length < 25) {
    return true;
  }

  if (totalPages >= 120 && usefulRows.length < 80) {
    return true;
  }

  return false;
}

async function extractMlsImportRowsWithOpenAi(fullText, pageTexts, options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const onRows = typeof options.onRows === 'function' ? options.onRows : null;
  const pageCount = Math.max(0, Number(options.pageCount) || 0);
  const segments = buildMlsImportAiExtractionSegments(fullText, pageTexts);
  const extractedRows = [];
  const systemPrompt = [
    'You extract MLS spreadsheet rows from PDF text.',
    'Return only valid JSON.',
    'Output a JSON array of objects with exactly these keys: propertyAddress, laName, loPhone, offersEmail, laCell, laDirect, laEmail, status.',
    'Each object must represent one property listing explicitly present in the text.',
    'Use empty strings for missing fields.',
    'Do not invent listings or contact info.',
    'Prefer listing agent contact details and offer submission email when present.',
    'propertyAddress must contain only the actual property address.',
    'Never return driving directions, route text, freeway instructions, turn-by-turn notes, or destination phrases as propertyAddress.'
  ].join(' ');

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index] || {};
    if (onProgress) {
      onProgress({
        phase: 'ai-analyzing-rows',
        pageCount,
        processedSegments: index,
        totalSegments: segments.length,
        discoveredRows: extractedRows.length,
        message: `AI fallback is reviewing ${segment.label || `segment ${index + 1}`} for missed MLS rows...`
      });
    }

    const result = await queryOpenAiForStructuredJson(
      systemPrompt,
      [
        `Extract MLS rows from ${segment.label || `segment ${index + 1}`}.`,
        'Return only a JSON array. No markdown. No extra commentary.',
        '',
        segment.text || ''
      ].join('\n'),
      { maxInputChars: 18000 }
    );

    if (result.ok) {
      const payloadRows = Array.isArray(result.payload)
        ? result.payload
        : Array.isArray(result.payload && result.payload.rows)
          ? result.payload.rows
          : [];

      const nextRows = payloadRows
        .map(sanitizeMlsImportAiRow)
        .filter(isUsefulMlsImportRow);

      nextRows.forEach((row) => extractedRows.push(row));

      if (onRows && nextRows.length > 0) {
        await onRows(nextRows, {
          phase: 'ai-analyzing-rows',
          pageCount,
          processedSegments: index + 1,
          totalSegments: segments.length
        });
      }
    }

    if (onProgress) {
      onProgress({
        phase: 'ai-analyzing-rows',
        pageCount,
        processedSegments: index + 1,
        totalSegments: segments.length,
        discoveredRows: extractedRows.length,
        message: `AI fallback analyzed ${index + 1}/${segments.length} MLS chunk${segments.length === 1 ? '' : 's'}... found ${extractedRows.length} additional row${extractedRows.length === 1 ? '' : 's'} so far.`
      });
    }

    await waitForMlsImportAnalysisTurn();
  }

  return extractedRows;
}

function cleanupExpiredMlsImportPdfJobs() {
  const now = Date.now();
  mlsImportPdfJobs.forEach((job, jobId) => {
    const updatedAt = Number(job && job.updatedAt) || 0;
    if (!updatedAt || now - updatedAt > MLS_IMPORT_PDF_JOB_TTL_MS) {
      mlsImportPdfJobs.delete(jobId);
    }
  });
}

let agentPropertyMemoryReadyPromise = null;

function ensureAgentPropertyMemoryTable() {
  if (agentPropertyMemoryReadyPromise) {
    return agentPropertyMemoryReadyPromise;
  }

  agentPropertyMemoryReadyPromise = new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS agent_property_memory (
        property_key TEXT NOT NULL,
        agent_key TEXT NOT NULL,
        agent_name TEXT,
        agent_email TEXT,
        property_address TEXT NOT NULL,
        status_value TEXT NOT NULL,
        owner_user_key TEXT NOT NULL,
        owner_user_email TEXT,
        owner_user_name TEXT,
        payload_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (property_key, agent_key, owner_user_key)
      )
    `, (err) => {
      if (err) {
        agentPropertyMemoryReadyPromise = null;
        reject(err);
        return;
      }

      db.run('CREATE INDEX IF NOT EXISTS idx_agent_property_memory_owner_updated ON agent_property_memory(owner_user_key, updated_at DESC)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_agent_property_memory_agent_owner ON agent_property_memory(agent_key, owner_user_key)', () => {});
      db.run('CREATE INDEX IF NOT EXISTS idx_agent_property_memory_status_owner ON agent_property_memory(status_value, owner_user_key)', () => {});
      resolve();
    });
  });

  return agentPropertyMemoryReadyPromise;
}

ensureAgentPropertyMemoryTable()
  .then(() => {
    console.log('Agent property memory table ready');
  })
  .catch((err) => {
    console.error('Error creating agent_property_memory table:', err);
  });

function createMlsImportPdfJob({ requesterId, fileName }) {
  cleanupExpiredMlsImportPdfJobs();
  const jobId = crypto.randomUUID();
  const now = Date.now();
  const job = {
    id: jobId,
    requesterId: Number(requesterId) || 0,
    fileName: String(fileName || '').trim(),
    status: 'queued',
    message: 'Queued MLS PDF extraction...',
    pageCount: 0,
    progressPercent: 0,
    persistedRowCount: 0,
    startedAt: now,
    updatedAt: now,
    extracted: null,
    error: ''
  };
  mlsImportPdfJobs.set(jobId, job);
  return job;
}

function updateMlsImportPdfJob(jobId, patch) {
  const currentJob = mlsImportPdfJobs.get(jobId);
  if (!currentJob) {
    return null;
  }

  const nextJob = {
    ...currentJob,
    ...(patch && typeof patch === 'object' ? patch : {}),
    updatedAt: Date.now()
  };
  mlsImportPdfJobs.set(jobId, nextJob);
  return nextJob;
}

async function getMlsImportPdfJob(jobId) {
  cleanupExpiredMlsImportPdfJobs();
  const inMemoryJob = mlsImportPdfJobs.get(jobId) || null;
  if (inMemoryJob) {
    return inMemoryJob;
  }

  return loadMlsImportPdfJobRecord(jobId);
}

function serializeMlsImportPdfJob(job) {
  if (!job || typeof job !== 'object') {
    return null;
  }

  return {
    id: job.id,
    fileName: job.fileName,
    status: job.status,
    message: job.message,
    pageCount: Number(job.pageCount) || 0,
    progressPercent: Math.max(0, Math.min(100, Number(job.progressPercent) || 0)),
    persistedRowCount: Math.max(0, Number(job.persistedRowCount) || 0),
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    extracted: job.status === 'completed' ? job.extracted : null,
    error: job.status === 'failed' ? String(job.error || '').trim() : ''
  };
}

function getMlsImportPdfProgressPercent(progress) {
  const state = progress && typeof progress === 'object' ? progress : {};
  const phase = String(state.phase || '').trim().toLowerCase();

  if (phase === 'completed') {
    return 100;
  }

  if (phase === 'failed') {
    return 100;
  }

  if (phase === 'metadata') {
    return 6;
  }

  if (phase === 'prepare') {
    return 12;
  }

  if (phase === 'parsing-pages') {
    const totalBatches = Math.max(1, Number(state.totalBatches) || 1);
    const batchIndex = Math.max(1, Number(state.batchIndex) || 1);
    const ratio = Math.min(1, batchIndex / totalBatches);
    return Math.round(12 + (ratio * 58));
  }

  if (phase === 'analyzing') {
    return 72;
  }

  if (phase === 'analyzing-rows') {
    const totalSegments = Math.max(1, Number(state.totalSegments) || 1);
    const processedSegments = Math.max(0, Number(state.processedSegments) || 0);
    const ratio = Math.min(1, processedSegments / totalSegments);
    return Math.round(72 + (ratio * 27));
  }

  if (phase === 'ai-analyzing-rows') {
    const totalSegments = Math.max(1, Number(state.totalSegments) || 1);
    const processedSegments = Math.max(0, Number(state.processedSegments) || 0);
    const ratio = Math.min(1, processedSegments / totalSegments);
    return Math.round(86 + (ratio * 13));
  }

  return 4;
}

function extractPdfTextInWorker(source, options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const sourcePath = typeof source === 'string' ? source.trim() : '';
  const workerBytes = sourcePath ? null : Uint8Array.from(source || []);

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;
    const worker = new Worker(path.join(__dirname, 'scripts', 'mls-pdf-text-worker.js'), {
      workerData: {
        pdfBytes: workerBytes,
        pdfPath: sourcePath,
        defaultBatchSize: MLS_IMPORT_PDF_PAGE_BATCH_SIZE
      }
    });

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      worker.removeAllListeners();
    };

    const finishResolve = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    };

    const finishReject = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };

    timeoutId = setTimeout(() => {
      worker.terminate().catch(() => {});
      finishReject(new Error('The PDF extraction took too long. Try a smaller file or retry the upload.'));
    }, MLS_IMPORT_PDF_WORKER_TIMEOUT_MS);

    worker.on('message', (message) => {
      const payload = message && typeof message === 'object' ? message : {};
      if (payload.type === 'progress') {
        if (onProgress) {
          onProgress(payload.progress || {});
        }
        return;
      }

      if (payload.type === 'result') {
        finishResolve(payload.result || {});
        return;
      }

      if (payload.type === 'error') {
        finishReject(new Error(String(payload.error || 'Failed to extract PDF text.').trim()));
      }
    });

    worker.on('error', (error) => {
      finishReject(error instanceof Error ? error : new Error('Failed to extract PDF text.'));
    });

    worker.on('exit', (code) => {
      if (!settled && code !== 0) {
        finishReject(new Error(`PDF extraction worker stopped unexpectedly (exit code ${code}).`));
      }
    });
  });
}

function extractPdfFieldByLabel(lines, labels, valuePattern, options = {}) {
  const labelMatchers = Array.isArray(labels) ? labels : [];
  const lookahead = Math.max(1, Math.min(Number(options.lookahead) || 2, 6));
  const transform = typeof options.transform === 'function'
    ? options.transform
    : (value) => String(value || '').trim();
  const isValid = typeof options.validate === 'function'
    ? options.validate
    : (value) => Boolean(String(value || '').trim());

  for (let index = 0; index < lines.length; index += 1) {
    const line = String(lines[index] || '').trim();
    if (!line) {
      continue;
    }

    for (const labelMatcher of labelMatchers) {
      if (!labelMatcher.test(line)) {
        continue;
      }

      const inlineMatch = line.match(valuePattern);
      if (inlineMatch && inlineMatch[1]) {
        const transformedInline = transform(inlineMatch[1]);
        if (isValid(transformedInline, { sourceLine: line, lineIndex: index, offset: 0 })) {
          return String(transformedInline || '').trim();
        }
      }

      for (let offset = 1; offset <= lookahead; offset += 1) {
        const nextLine = String(lines[index + offset] || '').trim();
        if (!nextLine) {
          continue;
        }
        if (labelMatchers.some((matcher) => matcher.test(nextLine))) {
          continue;
        }
        const nextMatch = nextLine.match(valuePattern);
        if (nextMatch && nextMatch[1]) {
          const transformedMatch = transform(nextMatch[1]);
          if (isValid(transformedMatch, { sourceLine: nextLine, lineIndex: index + offset, offset })) {
            return String(transformedMatch || '').trim();
          }
          continue;
        }

        const transformedLine = transform(nextLine);
        if (isValid(transformedLine, { sourceLine: nextLine, lineIndex: index + offset, offset })) {
          return String(transformedLine || '').trim();
        }
      }
    }
  }

  return '';
}

function normalizePdfLabelKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function extractPdfFieldByDeepLabelSearch(lines, labels, valueExtractor, options = {}) {
  const sourceLines = Array.isArray(lines)
    ? lines.map((line) => String(line || '').trim()).filter(Boolean)
    : [];
  const labelKeys = Array.from(new Set((Array.isArray(labels) ? labels : [])
    .map((label) => normalizePdfLabelKey(label))
    .filter(Boolean)));
  const lookahead = Math.max(1, Math.min(Number(options.lookahead) || 3, 6));
  const extractValue = typeof valueExtractor === 'function'
    ? valueExtractor
    : (value) => String(value || '').trim();
  const isBoundary = typeof options.isBoundary === 'function'
    ? options.isBoundary
    : (line) => /^(?:\d+\.?\s*)?(?:co\s*la|la|lo|listing|list|show|offers?|email|direct|phone|mobile|cell)\b/i.test(String(line || '').trim());

  if (sourceLines.length === 0 || labelKeys.length === 0) {
    return '';
  }

  for (let index = 0; index < sourceLines.length; index += 1) {
    const line = sourceLines[index];
    const lineKey = normalizePdfLabelKey(line);
    if (!lineKey) {
      continue;
    }

    const hasMatchingLabel = labelKeys.some((labelKey) => lineKey.includes(labelKey));
    if (!hasMatchingLabel) {
      continue;
    }

    const inlineValue = extractValue(line);
    if (inlineValue) {
      return String(inlineValue || '').trim();
    }

    for (let offset = 1; offset <= lookahead; offset += 1) {
      const nextLine = String(sourceLines[index + offset] || '').trim();
      if (!nextLine) {
        continue;
      }

      const nextLineKey = normalizePdfLabelKey(nextLine);
      if (labelKeys.some((labelKey) => nextLineKey.includes(labelKey))) {
        continue;
      }

      if (isBoundary(nextLine)) {
        break;
      }

      const nextValue = extractValue(nextLine);
      if (nextValue) {
        return String(nextValue || '').trim();
      }
    }
  }

  return '';
}

function extractPhoneNumber(value) {
  const match = String(value || '').match(/(\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/);
  return match ? String(match[0] || '').trim() : '';
}

function extractEmailAddress(value) {
  const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? String(match[0] || '').trim() : '';
}

function cleanPersonName(value) {
  return String(value || '')
    .replace(/^(?:\([A-Za-z0-9_-]+\)\s*)+/, '')
    .replace(/^[-:|]+\s*/, '')
    .replace(/^[\\/]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPersonName(value) {
  const cleaned = cleanPersonName(value).replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(' ')
    .map((part) => {
      if (!part) {
        return '';
      }

      if (/^(jr|sr)\.?$/i.test(part)) {
        return `${part.charAt(0).toUpperCase()}${part.charAt(1).toLowerCase()}.`;
      }

      if (/^(ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(part)) {
        return part.toUpperCase();
      }

      return part
        .toLowerCase()
        .replace(/(^|[-'])[a-z]/g, (match) => match.toUpperCase());
    })
    .join(' ');
}

function isNoisePdfFieldValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return true;
  }

  return /office contact priority|submit offers|offer instructions|showingtime|private remarks|public remarks|agent remarks|broker remarks|confidential|occupant|tenant occupied|call listing office|see remarks/i.test(normalized);
}

function isLikelyPersonName(value) {
  const cleaned = cleanPersonName(value);
  if (!cleaned || isNoisePdfFieldValue(cleaned)) {
    return false;
  }
  if (extractPhoneNumber(cleaned) || extractEmailAddress(cleaned)) {
    return false;
  }
  if ((cleaned.match(/\d/g) || []).length > 1) {
    return false;
  }

  const normalized = cleaned
    .replace(/[\\/|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = normalized.match(/[A-Za-z][A-Za-z.'-]*/g) || [];

  if (words.length < 2 || words.length > 6) {
    return false;
  }

  return true;
}

function normalizePdfPropertyAddressValue(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s+/g, ', ')
    .trim();
}

function normalizePropertyAddressForComparison(value) {
  return normalizePdfPropertyAddressValue(value)
    .toLowerCase()
    .replace(/\bcalifornia\b/g, 'ca')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bterrace\b/g, 'ter')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bhighway\b/g, 'hwy')
    .replace(/\bparkway\b/g, 'pkwy')
    .replace(/\bmountain\b/g, 'mtn')
    .replace(/\bsaint\b/g, 'st')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function areMatchingPropertyAddresses(previousAddress, nextAddress) {
  const previous = normalizePropertyAddressForComparison(previousAddress);
  const next = normalizePropertyAddressForComparison(nextAddress);
  if (!previous || !next) {
    return false;
  }

  if (previous === next) {
    return true;
  }

  const previousWithoutStateZip = previous
    .replace(/\bca\b\s*\d{5}(?:-\d{4})?$/i, '')
    .replace(/\d{5}(?:-\d{4})?$/i, '')
    .trim();
  const nextWithoutStateZip = next
    .replace(/\bca\b\s*\d{5}(?:-\d{4})?$/i, '')
    .replace(/\d{5}(?:-\d{4})?$/i, '')
    .trim();

  return Boolean(previousWithoutStateZip)
    && previousWithoutStateZip === nextWithoutStateZip;
}

function isDuplicatePropertyAddressLine(currentBlock, nextLine) {
  const nextAddress = extractPropertyAddressCandidateFromLine(nextLine);
  if (!nextAddress) {
    return false;
  }

  const existingAddresses = (Array.isArray(currentBlock) ? currentBlock : [])
    .map((line) => extractPropertyAddressCandidateFromLine(line))
    .filter(Boolean);

  return existingAddresses.some((existingAddress) => areMatchingPropertyAddresses(existingAddress, nextAddress));
}

function isLikelyDirectionalInstructionAddressLine(value) {
  const normalized = normalizePdfPropertyAddressValue(value).toLowerCase();
  if (!normalized) {
    return false;
  }

  if (/^\d{2,6}\s+(?:f(?:ree)?way|frwy|fwy|hwy|highway)\b/.test(normalized)) {
    return true;
  }

  if (/^\d{2,6}\s+off\s+[a-z]/.test(normalized)) {
    return true;
  }

  if (/\bto\s+[a-z0-9.'#&\-/]+(?:\s+[a-z0-9.'#&\-/]+){0,4}\s+(?:street|st|avenue|ave|boulevard|blvd|drive|dr|road|rd|court|ct|lane|ln|place|pl|terrace|ter|circle|cir|parkway|pkwy|highway|hwy|way|trail|trl)\b/i.test(normalized)) {
    return true;
  }

  if ((normalized.match(/\bto\b/g) || []).length >= 2) {
    return true;
  }

  return /\b(?:get\s+off|off\s+[a-z]|take\s+(?:the\s+)?exit|turn|merge|keep\s+(?:left|right)|continue\s+(?:on|onto|straight)|toward(?:s)?|ramp|destination|make\s+a\s+(?:left|right)|left\s+on|right\s+on|head\s+(?:north|south|east|west)|go\s+(?:north|south|east|west)|(?:f(?:ree)?way|frwy|fwy|hwy|highway)\s+(?:north|south|east|west))\b/.test(normalized);
}

function extractPropertyAddressCandidateFromLine(line) {
  const normalizedLine = normalizePdfPropertyAddressValue(
    String(line || '')
      .replace(/^(?:property address|address|subject property)\s*[:#-]?\s*/i, '')
      .replace(/\s+(?:status|list price|recent|next oh|bed\s*\/\s*bath|sqft\(src\)|price per sqft|lot\(src\)|listing id)\b.*$/i, '')
      .replace(/\s+listing\b.*$/i, '')
  );

  if (!normalizedLine || !/^\d{2,6}\s+/.test(normalizedLine)) {
    return '';
  }

  const withoutHouseNumber = normalizedLine.replace(/^\d{2,6}\s+/, '').trim();
  if (!withoutHouseNumber || !/[A-Za-z]/.test(withoutHouseNumber)) {
    return '';
  }

  if (/^\d{2,6}\s+\d{2,6}(?:[\s-]\d{2,6})*$/.test(normalizedLine)) {
    return '';
  }

  if (extractPhoneNumber(normalizedLine) || extractEmailAddress(normalizedLine)) {
    return '';
  }

  if (isLikelyDirectionalInstructionAddressLine(normalizedLine)) {
    return '';
  }

  if (/\b(?:sq\.?\s*ft|sqft|square feet|yard|yards|acre|acres|lot size|lot|garage|garages|bed|beds|bath|baths|story|stories|carport|patio|pool|room|rooms)\b/i.test(normalizedLine)) {
    return '';
  }

  if (/\b(?:listing id|agent full|printed by|residential|status|public remarks|private remarks|submit offers|showingtime)\b/i.test(normalizedLine)) {
    return '';
  }

  const addressPatterns = [
    /^(\d{2,6}\s+[A-Za-z0-9.'#&\-/]+(?:\s+[A-Za-z0-9.'#&\-/]+){0,10},\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)$/i,
    /^(\d{2,6}\s+[A-Za-z0-9.'#&\-/]+(?:\s+[A-Za-z0-9.'#&\-/]+){0,10},\s*[A-Za-z .'-]+\s+\d{5}(?:-\d{4})?)$/i,
    /^(\d{2,6}\s+[A-Za-z0-9.'#&\-/]+(?:\s+[A-Za-z0-9.'#&\-/]+){0,10},\s*[A-Za-z .'-]+(?:,\s*[A-Z]{2})?)$/i,
    /^(\d{2,6}\s+[A-Za-z0-9.'#&\-/]+(?:\s+[A-Za-z0-9.'#&\-/]+){0,10}\s+(?:street|st|avenue|ave|boulevard|blvd|drive|dr|road|rd|court|ct|lane|ln|place|pl|terrace|ter|circle|cir|parkway|pkwy|highway|hwy|way|trail|trl))$/i
  ];

  for (const pattern of addressPatterns) {
    const match = normalizedLine.match(pattern);
    if (match && match[1]) {
      return normalizePdfPropertyAddressValue(match[1]);
    }
  }

  return '';
}

function extractPropertyAddressFromPdfText(text, lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^property address\b/i, /^address\b/i, /^subject property\b/i],
    /^(?:property address|address|subject property)\s*[:#-]?\s*(.+)$/i
  );
  if (labeledValue) {
    const labeledAddress = extractPropertyAddressCandidateFromLine(labeledValue);
    if (labeledAddress) {
      return labeledAddress;
    }
  }

  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || '').trim()).filter(Boolean)
    : [];

  for (const line of normalizedLines) {
    const candidate = extractPropertyAddressCandidateFromLine(line);
    if (candidate) {
      return candidate;
    }
  }

  return '';
}

function extractLaNameFromLine(line) {
  const normalizedLine = String(line || '').trim();
  if (!normalizedLine || /^\s*(?:\d+\.?\s*)?cola\s*:/i.test(normalizedLine)) {
    return '';
  }

  const inlineMatch = normalizedLine.match(/^\s*(?:\d+\.?\s*)?la\s*[:#-]\s*(?:\([^)]+\)\s*)*(.+)$/i);
  if (!inlineMatch || !inlineMatch[1]) {
    return '';
  }

  const candidate = String(inlineMatch[1] || '')
    .replace(/^[-:|]+\s*/, '')
    .replace(/^[\\/]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return isLikelyPersonName(candidate) ? candidate : '';
}

function isAgentOfficeContactPriorityBoundary(line) {
  const normalizedLine = String(line || '').trim();
  if (!normalizedLine) {
    return false;
  }

  return /^(?:COMPARABLE INFORMATION|AGENT FULL\b|PUBLIC REMARKS\b|SHOWING INFORMATION\b|ROOM INFO\b|LISTING\b|EXTERIOR\b|INTERIOR\b|PROPERTY INFORMATION\b)/i.test(normalizedLine)
    || /\bPrinted by\b/i.test(normalizedLine);
}

function normalizeContactPriorityRoleToken(value) {
  return String(value || '').replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function extractInlineContactPriorityValue(lines, expectedRoles, expectedLabels, valueExtractor) {
  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || '').trim()).filter(Boolean)
    : [];
  const roleVariants = Array.from(new Set((Array.isArray(expectedRoles) ? expectedRoles : [])
    .map((role) => normalizeContactPriorityRoleToken(role))
    .filter(Boolean)));
  const labelVariants = Array.from(new Set((Array.isArray(expectedLabels) ? expectedLabels : [])
    .map((label) => String(label || '').trim())
    .filter(Boolean)));
  const extractValue = typeof valueExtractor === 'function'
    ? valueExtractor
    : (value) => String(value || '').trim();

  if (normalizedLines.length === 0 || roleVariants.length === 0 || labelVariants.length === 0) {
    return '';
  }

  const escapedRoles = roleVariants
    .map((role) => role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .map((role) => role.replace(/\s+/g, '[\\s.-]*'));
  const escapedVariants = labelVariants
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .map((label) => label.replace(/\s+/g, '[\\s.-]*'));
  const rolePattern = escapedRoles.join('|');
  const labelPattern = escapedVariants.join('|');
  const numberedRolePrefix = `(?:\\d+\\s*[.)-]?\\s*)?(?:${rolePattern})\\s*`;
  const fieldPattern = `(?:^|\\b)${numberedRolePrefix}(?:${labelPattern})\\s*[:#-]?\\s*(.+?)(?=(?:\\s+${numberedRolePrefix}(?:${labelPattern})\\s*[:#-]?)|$)`;
  const fieldRegex = new RegExp(fieldPattern, 'i');
  const lineQualifier = new RegExp(`contact\\s+priority|(?:^|\\b)(?:\\d+\\s*[.)-]?\\s*)?(?:${rolePattern})`, 'i');

  for (const line of normalizedLines) {
    if (!lineQualifier.test(line)) {
      continue;
    }

    const match = line.match(fieldRegex);
    if (!match || !match[1]) {
      continue;
    }

    const extracted = extractValue(match[1]);
    if (extracted) {
      return String(extracted || '').trim();
    }
  }

  return '';
}

function extractContactPriorityValueForRoles(lines, expectedRoles, expectedLabels, valueExtractor) {
  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || '').trim()).filter(Boolean)
    : [];
  if (normalizedLines.length === 0) {
    return '';
  }

  const normalizedRoles = Array.from(new Set((Array.isArray(expectedRoles) ? expectedRoles : [])
    .map((role) => normalizeContactPriorityRoleToken(role))
    .filter(Boolean)));
  if (normalizedRoles.length === 0) {
    return '';
  }

  const headerIndex = normalizedLines.findIndex((line) => /(?:agent\s*\/\s*office\s+)?contact\s+priority/i.test(line));
  if (headerIndex < 0) {
    return extractInlineContactPriorityValue(normalizedLines, normalizedRoles, expectedLabels, valueExtractor);
  }

  const labelSet = new Set(
    (Array.isArray(expectedLabels) ? expectedLabels : [])
      .map((label) => String(label || '').replace(/[^a-z0-9]+/gi, '').toLowerCase())
      .filter(Boolean)
  );
  if (labelSet.size === 0) {
    return '';
  }

  const extractValue = typeof valueExtractor === 'function'
    ? valueExtractor
    : (value) => String(value || '').trim();

  const inlinePriorityValue = extractInlineContactPriorityValue(
    normalizedLines.slice(headerIndex, Math.min(normalizedLines.length, headerIndex + 8)),
    normalizedRoles,
    Array.from(labelSet.values()),
    extractValue
  );
  if (inlinePriorityValue) {
    return inlinePriorityValue;
  }

  const endIndex = Math.min(normalizedLines.length, headerIndex + 24);
  for (let index = headerIndex + 1; index < endIndex; index += 1) {
    const line = normalizedLines[index];
    if (isAgentOfficeContactPriorityBoundary(line)) {
      break;
    }

    const labelMatch = line.match(/^(?:\d+\s*[.)-]?\s*)?(co\s*la|la|lo)\s*([a-z\s-]+?)\s*[:#-]?\s*(.*)$/i);
    if (!labelMatch) {
      continue;
    }

    const role = normalizeContactPriorityRoleToken(labelMatch[1]);
    if (!normalizedRoles.includes(role)) {
      continue;
    }

    const normalizedLabel = String(labelMatch[2] || '').replace(/[^a-z0-9]+/gi, '').toLowerCase();
    if (!labelSet.has(normalizedLabel)) {
      continue;
    }

    const inlineValue = extractValue(labelMatch[3]);
    if (inlineValue) {
      return inlineValue;
    }

    for (let offset = 1; offset <= 2; offset += 1) {
      const nextLine = String(normalizedLines[index + offset] || '').trim();
      if (!nextLine || isAgentOfficeContactPriorityBoundary(nextLine)) {
        break;
      }
      if (/^(?:\d+\.?\s*)?(?:co\s*la|la|lo)\s*[a-z\s-]+?\s*[:#-]?/i.test(nextLine)) {
        break;
      }

      const nextValue = extractValue(nextLine);
      if (nextValue) {
        return nextValue;
      }
    }
  }

  return '';
}

function extractAgentOfficeContactPriorityValue(lines, expectedLabels, valueExtractor) {
  return extractContactPriorityValueForRoles(lines, ['la'], expectedLabels, valueExtractor);
}

function extractListingOfficeContactPriorityValue(lines, expectedLabels, valueExtractor) {
  return extractContactPriorityValueForRoles(lines, ['lo'], expectedLabels, valueExtractor);
}

function extractAgentNameFromPdfText(lines) {
  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || '').trim()).filter(Boolean)
    : [];

  const agentOfficeIndex = normalizedLines.findIndex((line) => /agent\s*\/\s*office|agent\s+office/i.test(line));
  if (agentOfficeIndex >= 0) {
    const searchEnd = Math.min(normalizedLines.length, agentOfficeIndex + 18);
    for (let index = agentOfficeIndex; index < searchEnd; index += 1) {
      const candidate = extractLaNameFromLine(normalizedLines[index]);
      if (candidate) {
        return candidate;
      }
    }
  }

  for (const line of normalizedLines) {
    const candidate = extractLaNameFromLine(line);
    if (candidate) {
      return candidate;
    }
  }

  const showContactName = extractPdfFieldByLabel(
    normalizedLines,
    [/^show contact name\b/i],
    /^(?:show contact name)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 2,
      transform: (value) => formatPersonName(value),
      validate: (value) => isLikelyPersonName(value)
    }
  );
  if (showContactName) {
    return showContactName;
  }

  return '';
}

function extractLaCellFromPdfText(lines) {
  const primaryLabeledValue = extractPdfFieldByLabel(
    lines,
    [/^\d*\.?\s*la\s*cell\b/i, /^listing agent cell\b/i, /^la\s*mobile\b/i, /^la\s*phone\b/i],
    /^(?:\d*\.?\s*)?(?:la\s*cell|listing agent cell|la\s*mobile|la\s*phone)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractPhoneNumber(value))
    }
  );
  const directPhone = extractPhoneNumber(primaryLabeledValue);
  if (directPhone) {
    return directPhone;
  }

  const contactPriorityPhone = extractAgentOfficeContactPriorityValue(
    lines,
    ['cell', 'mobile', 'phone', 'text', 'home', 'direct', 'directphone', 'directline'],
    (value) => extractPhoneNumber(value)
  );
  if (contactPriorityPhone) {
    return contactPriorityPhone;
  }

  const showContactType = extractPdfFieldByLabel(
    lines,
    [/^show contact type\b/i],
    /^(?:show contact type)\s*[:#-]?\s*(.+)$/i,
    { lookahead: 1 }
  );
  const showContactPhone = extractPdfFieldByLabel(
    lines,
    [/^show contact ph\b/i, /^show contact phone\b/i],
    /^(?:show contact ph|show contact phone)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 2,
      validate: (value) => Boolean(extractPhoneNumber(value))
    }
  );

  if (/\bagent\b/i.test(String(showContactType || ''))) {
    return extractPhoneNumber(showContactPhone);
  }

  return '';
}

function extractLaDirectFromPdfText(lines) {
  const directLabelValue = extractPdfFieldByLabel(
    lines,
    [
      /^\d*\.?\s*l\.?\s*a\.?\s*direct(?:\s+(?:phone|line|ph))?\b/i,
      /^\d*\.?\s*(?:listing|list)\s*agent\s*direct(?:\s+(?:phone|line|ph))?\b/i,
      /^\d*\.?\s*direct\s*(?:line|phone|ph)\b/i
    ],
    /^(?:\d*\.?\s*)?(?:l\.?\s*a\.?\s*direct(?:\s+(?:phone|line|ph))?|(?:listing|list)\s*agent\s*direct(?:\s+(?:phone|line|ph))?|direct\s*(?:line|phone|ph))\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractPhoneNumber(value))
    }
  );
  const directPhone = extractPhoneNumber(directLabelValue);
  if (directPhone) {
    return directPhone;
  }

  const deepDirectPhone = extractPdfFieldByDeepLabelSearch(
    lines,
    [
      'la direct',
      'l a direct',
      'ladirect',
      'la direct phone',
      'la direct line',
      'listing agent direct',
      'list agent direct',
      'listingagentdirect',
      'listagentdirect',
      'direct line',
      'direct phone',
      'directline',
      'directphone'
    ],
    (value) => extractPhoneNumber(value),
    {
      lookahead: 4,
      isBoundary: (line) => /^(?:\d+\.?\s*)?(?:co\s*la|la|lo|listing|list|show|offers?|submit offers|offer instructions)\b/i.test(String(line || '').trim())
    }
  );
  if (deepDirectPhone) {
    return deepDirectPhone;
  }

  return extractAgentOfficeContactPriorityValue(lines, ['direct', 'directphone', 'directline', 'officephone'], (value) => extractPhoneNumber(value));
}

function extractLoPhoneFromPdfText(lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^\d*\.?\s*lo phone\b/i, /^\d*\.?\s*listing office phone\b/i, /^\d*\.?\s*office phone\b/i, /^\d*\.?\s*broker phone\b/i],
    /^(?:\d*\.?\s*)?(?:lo phone|listing office phone|office phone|broker phone)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractPhoneNumber(value))
    }
  );
  const loPhone = extractPhoneNumber(labeledValue);
  if (loPhone) {
    return loPhone;
  }

  return extractListingOfficeContactPriorityValue(lines, ['phone', 'officephone', 'brokerphone'], (value) => extractPhoneNumber(value));
}

function extractOffersEmailFromPdfText(lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^\d*\.?\s*offers?\s*e-?mail\b/i, /^submit offers(?: to)?\b/i, /^offer instructions\b/i, /^e-?mail for offers\b/i],
    /^(?:\d*\.?\s*)?(?:offers?\s*e-?mail|submit offers(?: to)?|offer instructions|e-?mail for offers)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractEmailAddress(value))
    }
  );
  const offersEmail = extractEmailAddress(labeledValue);
  if (offersEmail) {
    return offersEmail;
  }

  return extractAgentOfficeContactPriorityValue(lines, ['email', 'emailaddress', 'emailaddr', 'directemail'], (value) => extractEmailAddress(value));
}

function extractLaEmailFromPdfText(lines) {
  const laEmailValue = extractPdfFieldByLabel(
    lines,
    [
      /^\d*\.?\s*l\.?\s*a\.?\s*e[\s-]*mail\b/i,
      /^\d*\.?\s*(?:listing|list)\s*agent\s*e[\s-]*mail\b/i,
      /^\d*\.?\s*agent\s*e[\s-]*mail\b/i,
      /^\d*\.?\s*direct\s*e[\s-]*mail\b/i
    ],
    /^(?:\d*\.?\s*)?(?:l\.?\s*a\.?\s*e[\s-]*mail|(?:listing|list)\s*agent\s*e[\s-]*mail|agent\s*e[\s-]*mail|direct\s*e[\s-]*mail)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractEmailAddress(value))
    }
  );
  const laEmail = extractEmailAddress(laEmailValue);
  if (laEmail) {
    return laEmail;
  }

  const deepLaEmail = extractPdfFieldByDeepLabelSearch(
    lines,
    [
      'la email',
      'l a email',
      'la e mail',
      'la e-mail',
      'laemail',
      'laemailaddress',
      'listing agent email',
      'list agent email',
      'listingagentemail',
      'listagentemail',
      'agent email',
      'agentemail',
      'direct email',
      'directemail',
      'email address'
    ],
    (value) => extractEmailAddress(value),
    {
      lookahead: 4,
      isBoundary: (line) => /^(?:\d+\.?\s*)?(?:co\s*la|la|lo|listing|list|show|offers?|submit offers|offer instructions)\b/i.test(String(line || '').trim())
    }
  );
  if (deepLaEmail) {
    return deepLaEmail;
  }

  return extractAgentOfficeContactPriorityValue(lines, ['email', 'emailaddress', 'emailaddr', 'directemail'], (value) => extractEmailAddress(value));
}

function formatMlsStatusFieldValue(value) {
  const cleaned = String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\|+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^['"([{]+\s*/g, '')
    .replace(/\s*['"\])}]+$/g, '')
    .replace(/^(?:(?:status|listing status|mls status|current status|contract status|listing contract status|marketing status)\s*[:#-]?\s*)+/i, '')
    .replace(/(?:\s{2,}|\s+[|/\\-]\s+)(?:dom|cdom|listing id|mls(?:#| no\.?| number)?|beds?|baths?|price|printed by|agent full|show contact|list price|original list price)\b.*$/i, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  const normalized = cleaned.toLowerCase();
  const knownStatuses = [
    { pattern: /\bactive\s+under\s+contract\b|\bauct\b/i, value: 'Active Under Contract' },
    { pattern: /\bunder\s+contract\b|\bu\/?c\b/i, value: 'Under Contract' },
    { pattern: /\bpending\s+(?:continue\s+to\s+show|taking\s+backups?)\b/i, value: 'Pending' },
    { pattern: /\bpending\b/i, value: 'Pending' },
    { pattern: /\bbackup\b/i, value: 'Backup' },
    { pattern: /\btemporar(?:ily)?\s+off\s+market\b|\btom\b/i, value: 'Temporarily Off Market' },
    { pattern: /\boff\s+market\b/i, value: 'Off Market' },
    { pattern: /\bon\s+hold\b/i, value: 'On Hold' },
    { pattern: /\bcontingent\b/i, value: 'Contingent' },
    { pattern: /\bcoming\s+soon\b/i, value: 'Coming Soon' },
    { pattern: /\bwithdrawn\b/i, value: 'Withdrawn' },
    { pattern: /\bcancel(?:ed|led)\b/i, value: 'Cancelled' },
    { pattern: /\bexpired\b/i, value: 'Expired' },
    { pattern: /\bclosed\b/i, value: 'Closed' },
    { pattern: /\bsold\b/i, value: 'Sold' },
    { pattern: /\bactive\b/i, value: 'Active' },
  ];

  const matchedStatus = knownStatuses.find((entry) => entry.pattern.test(normalized));
  if (matchedStatus) {
    return normalizeMlsImportStatusLabel(matchedStatus.value);
  }

  if (!/^[a-z][a-z /&-]{1,50}$/i.test(cleaned)) {
    return '';
  }

  return normalizeMlsImportStatusLabel(cleaned);
}

function extractMlsStatusFromPdfText(text, lines) {
  const normalizedLines = Array.isArray(lines)
    ? lines.map((line) => String(line || '').trim()).filter(Boolean)
    : [];
  const normalizedText = normalizePdfExtractText(text);
  const statusLabelPattern = '(?:listing status|mls status|current status|status|contract status|listing contract status|marketing status)';
  const directStatusLinePatterns = [
    /\bSTATUS\b\s*[:#-]?\s*([^\n|]+?)(?=\s{2,}\b(?:LIST PRICE|PRICE|MLS|DOM|CDOM|BED|BATH|SQFT|LOT|YEAR|PROP)\b|$)/i,
    /\bSTATUS\b\s*[:#-]?\s*([^\n]+)$/i
  ];
  const recentStatusPattern = /\bRecent\s*:\s*[^\n]*?:\s*([A-Z][A-Z\s\/.-]{1,20})\s*:/i;

  for (const pattern of directStatusLinePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const formattedStatus = formatMlsStatusFieldValue(match[1]);
      if (formattedStatus) {
        return formattedStatus;
      }
    }
  }

  const labeledStatusPatterns = [
    new RegExp(`${statusLabelPattern}\\s*[:#-]\\s*([^\\n]+)`, 'i'),
    new RegExp(`${statusLabelPattern}\\s+([^\\n]{2,80})`, 'i')
  ];

  for (const pattern of labeledStatusPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const formattedStatus = formatMlsStatusFieldValue(match[1]);
      if (formattedStatus) {
        return formattedStatus;
      }
    }
  }

  for (let index = 0; index < normalizedLines.length; index += 1) {
    const line = normalizedLines[index];
    const directLineStatusMatch = line.match(/\bSTATUS\b\s*[:#-]?\s*(.+?)(?=\s{2,}\b(?:LIST PRICE|PRICE|MLS|DOM|CDOM|BED|BATH|SQFT|LOT|YEAR|PROP)\b|$)/i);
    if (directLineStatusMatch && directLineStatusMatch[1]) {
      const directLineStatus = formatMlsStatusFieldValue(directLineStatusMatch[1]);
      if (directLineStatus) {
        return directLineStatus;
      }
    }

    const inlineMatch = line.match(new RegExp(`^${statusLabelPattern}\\s*[:#-]?\\s*(.+)$`, 'i'));
    if (inlineMatch && inlineMatch[1]) {
      const inlineStatus = formatMlsStatusFieldValue(inlineMatch[1]);
      if (inlineStatus) {
        return inlineStatus;
      }
    }

    if (new RegExp(`^${statusLabelPattern}\\s*[:#-]?$`, 'i').test(line)) {
      for (let lookahead = 1; lookahead <= 2; lookahead += 1) {
        const nextLine = normalizedLines[index + lookahead] || '';
        const nextStatus = formatMlsStatusFieldValue(nextLine);
        if (nextStatus) {
          return nextStatus;
        }
      }
    }

    const standaloneStatus = formatMlsStatusFieldValue(line);
    if (standaloneStatus && /^(?:active|active under contract|under contract|pending|backup|off market|temporarily off market|on hold|contingent|coming soon|withdrawn|cancel(?:ed|led)|expired|closed|sold)$/i.test(line)) {
      return standaloneStatus;
    }
  }

  const recentStatusMatch = normalizedText.match(recentStatusPattern);
  if (recentStatusMatch && recentStatusMatch[1]) {
    const recentStatus = normalizeMlsImportStatusLabel(recentStatusMatch[1]);
    if (recentStatus) {
      return recentStatus;
    }
  }

  return '';
}

function extractMlsImportRowFromText(text) {
  const normalizedText = normalizePdfExtractText(text);
  if (!normalizedText) {
    return null;
  }

  const lines = normalizedText.split(/\n+/).map((line) => String(line || '').trim()).filter(Boolean);
  const row = {
    propertyAddress: extractPropertyAddressFromPdfText(normalizedText, lines),
    laName: extractAgentNameFromPdfText(lines),
    loPhone: extractLoPhoneFromPdfText(lines),
    offersEmail: extractOffersEmailFromPdfText(lines),
    laCell: extractLaCellFromPdfText(lines),
    laDirect: extractLaDirectFromPdfText(lines),
    laEmail: extractLaEmailFromPdfText(lines),
    status: extractMlsStatusFromPdfText(normalizedText, lines)
  };

  const hasMeaningfulValue = Object.values(row).some((value) => String(value || '').trim());
  return hasMeaningfulValue ? row : null;
}

function isLikelyPropertyAddressLine(line) {
  return Boolean(extractPropertyAddressCandidateFromLine(line));
}

function isLikelyMlsListingFooterLine(line) {
  const normalizedLine = String(line || '').trim();
  if (!normalizedLine) {
    return false;
  }

  return /\bprinted by\b/i.test(normalizedLine)
    || (/\bagent full\b/i.test(normalizedLine) && /\blisting id\b/i.test(normalizedLine));
}

function splitMlsImportTextIntoBlocks(text) {
  const lines = normalizePdfExtractText(text)
    .split(/\n+/)
    .map((line) => String(line || '').trim())
    .filter(Boolean);
  const blocks = [];
  let currentBlock = [];
  let currentBlockHasAddress = false;

  const flushBlock = () => {
    if (!currentBlock.length) {
      return;
    }
    const blockText = normalizePdfExtractText(currentBlock.join('\n'));
    if (blockText) {
      blocks.push(blockText);
    }
    currentBlock = [];
    currentBlockHasAddress = false;
  };

  lines.forEach((line) => {
    const startsNewBlock = isLikelyPropertyAddressLine(line);
    const isDuplicateAddressLine = startsNewBlock
      && currentBlockHasAddress
      && isDuplicatePropertyAddressLine(currentBlock, line);

    if (startsNewBlock && currentBlockHasAddress && !isDuplicateAddressLine) {
      flushBlock();
    }

    currentBlock.push(line);
    if (startsNewBlock) {
      currentBlockHasAddress = true;
    }

    if (currentBlockHasAddress && isLikelyMlsListingFooterLine(line)) {
      flushBlock();
    }
  });

  flushBlock();
  return blocks;
}

function normalizeMlsImportRow(row) {
  const source = row && typeof row === 'object' ? row : {};
  const normalizedRow = {
    propertyAddress: String(source.propertyAddress || '').trim(),
    laName: String(source.laName || '').trim(),
    loPhone: String(source.loPhone || '').trim(),
    offersEmail: String(source.offersEmail || '').trim(),
    laCell: String(source.laCell || '').trim(),
    laDirect: String(source.laDirect || '').trim(),
    laEmail: String(source.laEmail || '').trim(),
    status: normalizeMlsImportStatusLabel(source.status || '')
  };

  if (!normalizedRow.offersEmail && normalizedRow.laEmail) {
    normalizedRow.offersEmail = normalizedRow.laEmail;
  }

  if (!normalizedRow.laCell && normalizedRow.laDirect) {
    normalizedRow.laCell = normalizedRow.laDirect;
  }

  return normalizedRow;
}

function countMlsImportRowValues(row) {
  const normalizedRow = normalizeMlsImportRow(row);
  return Object.values(normalizedRow).filter(Boolean).length;
}

function hasMeaningfulMlsImportRowAddress(row) {
  return Boolean(String(row && row.propertyAddress || '').trim());
}

function createMlsImportAddressMergeKey(value) {
  const normalizedAddress = normalizePropertyAddressForComparison(value)
    .replace(/\bca\b\s*\d{5}(?:-\d{4})?$/i, '')
    .replace(/\d{5}(?:-\d{4})?$/i, '')
    .trim();

  return normalizedAddress || normalizePropertyAddressForComparison(value);
}

function mergeMlsImportRowValues(previousValue, nextValue) {
  const previous = String(previousValue || '').trim();
  const next = String(nextValue || '').trim();
  if (!previous) {
    return next;
  }
  if (!next) {
    return previous;
  }
  return previous;
}

function shouldMergeMlsImportRows(previousRow, nextRow) {
  if (!previousRow || !nextRow) {
    return false;
  }

  const previousAddress = String(previousRow.propertyAddress || '').trim().toLowerCase();
  const nextAddress = String(nextRow.propertyAddress || '').trim().toLowerCase();

  if (previousAddress && nextAddress && previousAddress === nextAddress) {
    return true;
  }

  if (previousAddress && !nextAddress) {
    const previousMissingContact = !previousRow.laName || !previousRow.loPhone || !previousRow.offersEmail || !previousRow.laCell || !previousRow.laDirect || !previousRow.laEmail || !previousRow.status;
    const nextHasSupplementalValue = Boolean(nextRow.laName || nextRow.loPhone || nextRow.offersEmail || nextRow.laCell || nextRow.laDirect || nextRow.laEmail || nextRow.status);
    return previousMissingContact && nextHasSupplementalValue;
  }

  if (!previousAddress && nextAddress) {
    const previousHasSupplementalValue = Boolean(previousRow.laName || previousRow.loPhone || previousRow.offersEmail || previousRow.laCell || previousRow.laDirect || previousRow.laEmail || previousRow.status);
    return previousHasSupplementalValue;
  }

  return false;
}

function mergeMlsImportRows(rows) {
  const mergedRows = [];

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const normalizedRow = normalizeMlsImportRow(row);
    const hasValue = Object.values(normalizedRow).some(Boolean);
    if (!hasValue) {
      return;
    }

    const previousRow = mergedRows[mergedRows.length - 1] || null;
    if (!shouldMergeMlsImportRows(previousRow, normalizedRow)) {
      mergedRows.push(normalizedRow);
      return;
    }

    const mergedRow = {
      propertyAddress: mergeMlsImportRowValues(previousRow.propertyAddress, normalizedRow.propertyAddress),
      laName: mergeMlsImportRowValues(previousRow.laName, normalizedRow.laName),
      loPhone: mergeMlsImportRowValues(previousRow.loPhone, normalizedRow.loPhone),
      offersEmail: mergeMlsImportRowValues(previousRow.offersEmail, normalizedRow.offersEmail),
      laCell: mergeMlsImportRowValues(previousRow.laCell, normalizedRow.laCell),
      laDirect: mergeMlsImportRowValues(previousRow.laDirect, normalizedRow.laDirect),
      laEmail: mergeMlsImportRowValues(previousRow.laEmail, normalizedRow.laEmail),
      status: String(normalizedRow.status || previousRow.status || '').trim()
    };

    mergedRows[mergedRows.length - 1] = mergedRow;
  });

  return mergedRows;
}

function dedupeMlsImportRows(rows) {
  const dedupedByKey = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row || typeof row !== 'object') {
      return;
    }

    const normalizedRow = normalizeMlsImportRow(row);
    const addressKey = createMlsImportAddressMergeKey(normalizedRow.propertyAddress);
    const signature = addressKey || [
      normalizedRow.propertyAddress.toLowerCase(),
      normalizedRow.laName.toLowerCase(),
      normalizedRow.loPhone.toLowerCase(),
      normalizedRow.offersEmail.toLowerCase(),
      normalizedRow.laCell.toLowerCase(),
      normalizedRow.laDirect.toLowerCase(),
      normalizedRow.laEmail.toLowerCase(),
      normalizedRow.status.toLowerCase()
    ].join('|');

    if (!signature.replace(/\|/g, '')) {
      return;
    }

    const existingRow = dedupedByKey.get(signature);
    if (existingRow) {
      dedupedByKey.set(signature, mergeMlsImportRowObjects(existingRow, normalizedRow));
      return;
    }

    dedupedByKey.set(signature, normalizedRow);
  });

  return Array.from(dedupedByKey.values());
}

function mergeMlsImportRowObjects(previousRow, nextRow) {
  const previous = normalizeMlsImportRow(previousRow);
  const next = normalizeMlsImportRow(nextRow);

  return {
    propertyAddress: mergeMlsImportRowValues(previous.propertyAddress, next.propertyAddress),
    laName: mergeMlsImportRowValues(previous.laName, next.laName),
    loPhone: mergeMlsImportRowValues(previous.loPhone, next.loPhone),
    offersEmail: mergeMlsImportRowValues(previous.offersEmail, next.offersEmail),
    laCell: mergeMlsImportRowValues(previous.laCell, next.laCell),
    laDirect: mergeMlsImportRowValues(previous.laDirect, next.laDirect),
    laEmail: mergeMlsImportRowValues(previous.laEmail, next.laEmail),
    status: mergeMlsImportRowValues(previous.status, next.status)
  };
}

function consolidateMlsImportRows(rows) {
  const consolidatedRows = [];
  const addressIndexByKey = new Map();
  const seenSignatures = new Set();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const normalizedRow = normalizeMlsImportRow(row);
    const hasValue = Object.values(normalizedRow).some(Boolean);
    if (!hasValue) {
      return;
    }

    const addressKey = createMlsImportAddressMergeKey(normalizedRow.propertyAddress);
    if (addressKey) {
      const existingIndex = addressIndexByKey.get(addressKey);
      if (typeof existingIndex === 'number') {
        consolidatedRows[existingIndex] = mergeMlsImportRowObjects(consolidatedRows[existingIndex], normalizedRow);
        return;
      }

      addressIndexByKey.set(addressKey, consolidatedRows.length);
      consolidatedRows.push(normalizedRow);
      return;
    }

    const signature = [
      normalizedRow.propertyAddress.toLowerCase(),
      normalizedRow.laName.toLowerCase(),
      normalizedRow.loPhone.toLowerCase(),
      normalizedRow.offersEmail.toLowerCase(),
      normalizedRow.laCell.toLowerCase(),
      normalizedRow.laDirect.toLowerCase(),
      normalizedRow.laEmail.toLowerCase(),
      normalizedRow.status.toLowerCase()
    ].join('|');

    if (seenSignatures.has(signature)) {
      return;
    }

    seenSignatures.add(signature);
    consolidatedRows.push(normalizedRow);
  });

  const addressBackedRows = consolidatedRows.filter((row) => hasMeaningfulMlsImportRowAddress(row));
  const prioritizedRows = addressBackedRows.length > 0 ? addressBackedRows : consolidatedRows;

  return prioritizedRows.sort((previousRow, nextRow) => {
    const previousScore = countMlsImportRowValues(previousRow);
    const nextScore = countMlsImportRowValues(nextRow);
    return nextScore - previousScore;
  });
}

async function extractMlsImportPdfFields(pdfSource) {
  const options = arguments[1] && typeof arguments[1] === 'object' ? arguments[1] : {};
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const onRows = typeof options.onRows === 'function' ? options.onRows : null;
  let normalizedText = '';
  let pageCount = 0;
  let pageTexts = [];

  const fullTextResult = await extractPdfTextInWorker(pdfSource, { onProgress });
  normalizedText = normalizePdfExtractText(fullTextResult && fullTextResult.text);
  pageTexts = Array.isArray(fullTextResult && fullTextResult.pageTexts) ? fullTextResult.pageTexts : [];
  pageCount = Number(fullTextResult && fullTextResult.pageCount) || 0;
  if (!pageCount && Number(fullTextResult && fullTextResult.parsedPageCount) > 0) {
    pageCount = Number(fullTextResult.parsedPageCount) || 0;
  }

  if (!normalizedText) {
    throw new Error('The PDF did not contain readable text.');
  }

  if (onProgress) {
    onProgress({
      phase: 'analyzing',
      pageCount,
      message: pageCount > 0
        ? `Analyzing extracted MLS data from ${pageCount} page${pageCount === 1 ? '' : 's'}...`
        : 'Analyzing extracted MLS data...'
    });
  }

  const analysisSegments = buildMlsImportExtractionSegments(normalizedText, pageTexts);
  const candidateRows = [];

  for (let index = 0; index < analysisSegments.length; index += 1) {
    const segment = analysisSegments[index] || {};
    const extractedSegmentRows = extractRowsFromMlsImportCandidateText(segment.text);
    if (extractedSegmentRows.length > 0) {
      candidateRows.push(...extractedSegmentRows);

      if (onRows) {
        await onRows(extractedSegmentRows, {
          phase: 'analyzing-rows',
          pageCount,
          processedSegments: index + 1,
          totalSegments: analysisSegments.length
        });
      }
    }

    if (onProgress && (index === 0 || (index + 1) % 20 === 0 || index === analysisSegments.length - 1)) {
      onProgress({
        phase: 'analyzing-rows',
        pageCount,
        processedSegments: index + 1,
        totalSegments: analysisSegments.length,
        discoveredRows: candidateRows.length,
        message: analysisSegments.length > 1
          ? `Analyzing MLS rows ${index + 1}/${analysisSegments.length}... found ${candidateRows.length} potential propert${candidateRows.length === 1 ? 'y' : 'ies'} so far.`
          : 'Analyzing extracted MLS rows...'
      });
    }

    if ((index + 1) % 15 === 0) {
      await waitForMlsImportAnalysisTurn();
    }
  }

  const extractedRows = consolidateMlsImportRows(
    dedupeMlsImportRows(candidateRows)
  );
  let mergedRows = extractedRows;

  if (shouldUseOpenAiMlsFallback(extractedRows, pageCount)) {
    const aiRows = await extractMlsImportRowsWithOpenAi(normalizedText, pageTexts, {
      pageCount,
      onProgress,
      onRows
    });

    if (aiRows.length > 0) {
      mergedRows = consolidateMlsImportRows(
        dedupeMlsImportRows([
          ...extractedRows,
          ...aiRows
        ])
      );
    }
  }

  const fallbackRow = extractMlsImportRowFromText(normalizedText) || {};
  const primaryRow = mergedRows[0] || fallbackRow;

  return {
    pageCount,
    propertyAddress: String(primaryRow.propertyAddress || '').trim(),
    laName: String(primaryRow.laName || '').trim(),
    loPhone: String(primaryRow.loPhone || '').trim(),
    offersEmail: String(primaryRow.offersEmail || '').trim(),
    laCell: String(primaryRow.laCell || '').trim(),
    laDirect: String(primaryRow.laDirect || '').trim(),
    laEmail: String(primaryRow.laEmail || '').trim(),
    status: String(primaryRow.status || '').trim(),
    rows: mergedRows.length > 0 ? mergedRows : (Object.values(fallbackRow).some(Boolean) ? [fallbackRow] : [])
  };
}

app.post('/api/admin/mls-imports/extract-pdf-job', (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  mlsImportPdfUpload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      const uploadMessage = uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'PDF files must be 180 MB or smaller.'
        : (uploadError && uploadError.message ? uploadError.message : 'Failed to upload the PDF.');
      return res.status(400).json({ error: uploadMessage });
    }

    try {
      const uploadedFile = req.file;
      const fileName = String(uploadedFile && uploadedFile.originalname || '').trim();
      const uploadedPath = String(uploadedFile && uploadedFile.path || '').trim();
      const extension = path.extname(fileName).toLowerCase();

      if (!fileName || !uploadedPath) {
        return res.status(400).json({ error: 'A PDF file is required.' });
      }

      if (extension !== '.pdf') {
        await fs.promises.unlink(uploadedPath).catch(() => {});
        return res.status(400).json({ error: 'Only PDF files are supported in this import tool.' });
      }

      const stats = await fs.promises.stat(uploadedPath).catch(() => null);
      if (!stats || !stats.size) {
        await fs.promises.unlink(uploadedPath).catch(() => {});
        return res.status(400).json({ error: 'The uploaded PDF was empty.' });
      }

      const job = createMlsImportPdfJob({ requesterId: decoded.id, fileName });
      const queuedJob = updateMlsImportPdfJob(job.id, {
        status: 'running',
        message: 'Starting MLS PDF extraction...',
        progressPercent: 2
      });
      void persistMlsImportPdfJobRecord(queuedJob || job).catch((error) => {
        console.error('Failed to persist MLS import job start:', error);
      });

      setImmediate(async () => {
        let persistedRowCount = 0;
        const isSpreadsheetClearCancelled = () => {
          return wasMlsImportSpreadsheetClearedSince(decoded.id, job.startedAt)
            || !mlsImportPdfJobs.has(job.id);
        };

        try {
          const extracted = await extractMlsImportPdfFields(uploadedPath, {
            onProgress: (progress) => {
              if (isSpreadsheetClearCancelled()) {
                return;
              }

              const nextJob = updateMlsImportPdfJob(job.id, {
                status: 'running',
                pageCount: Number(progress && progress.pageCount) || 0,
                message: String(progress && progress.message || 'Extracting MLS PDF...').trim(),
                progressPercent: getMlsImportPdfProgressPercent(progress),
                persistedRowCount
              });

              void persistMlsImportPdfJobRecord(nextJob).catch((error) => {
                console.error('Failed to persist MLS import job progress:', error);
              });
            }
          });

          if (isSpreadsheetClearCancelled()) {
            return;
          }

          const finalPersistResult = await persistMlsImportSpreadsheetRowsForUser(decoded.id, Array.isArray(extracted && extracted.rows) ? extracted.rows : [], {
            importRunId: job.id,
            pdfFile: fileName
          });
          persistedRowCount = Array.isArray(finalPersistResult && finalPersistResult.rows)
            ? finalPersistResult.rows.length
            : 0;

          const completedJob = updateMlsImportPdfJob(job.id, {
            status: 'completed',
            pageCount: Number(extracted && extracted.pageCount) || 0,
            progressPercent: 100,
            persistedRowCount,
            message: Number(extracted && extracted.pageCount) > 0
              ? `Finished parsing all ${Number(extracted.pageCount)} pages.`
              : 'Finished parsing the PDF.',
            extracted,
            error: ''
          });
          if (!completedJob || isSpreadsheetClearCancelled()) {
            return;
          }

          await persistMlsImportPdfJobRecord(completedJob);
        } catch (error) {
          if (isSpreadsheetClearCancelled()) {
            return;
          }

          console.error('Failed to extract MLS import PDF fields:', error);
          const failedJob = updateMlsImportPdfJob(job.id, {
            status: 'failed',
            progressPercent: 100,
            persistedRowCount,
            message: 'MLS PDF extraction failed.',
            error: error && error.message ? error.message : 'Failed to extract fields from the uploaded PDF.'
          });
          if (!failedJob || isSpreadsheetClearCancelled()) {
            return;
          }

          await persistMlsImportPdfJobRecord(failedJob);
        } finally {
          await fs.promises.unlink(uploadedPath).catch(() => {});
        }
      });

      return res.status(202).json({ job: serializeMlsImportPdfJob(await getMlsImportPdfJob(job.id)) });
    } catch (error) {
      console.error('Failed to start MLS import PDF extraction job:', error);
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      return res.status(500).json({ error: error && error.message ? error.message : 'Failed to start PDF extraction.' });
    }
  });
});

app.get('/api/admin/mls-imports/extract-pdf-job/:jobId', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const jobId = String(req.params?.jobId || '').trim();
  if (!jobId) {
    return res.status(400).json({ error: 'A valid job id is required.' });
  }

  const job = await getMlsImportPdfJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'The MLS PDF extraction job was not found.' });
  }

  if (Number(job.requesterId) > 0 && Number(decoded.id) !== Number(job.requesterId)) {
    return res.status(403).json({ error: 'You do not have access to this MLS PDF extraction job.' });
  }

  return res.json({ job: serializeMlsImportPdfJob(job) });
});

app.delete('/api/admin/mls-imports/extract-pdf-job/:jobId', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  const jobId = String(req.params?.jobId || '').trim();
  if (!jobId) {
    return res.status(400).json({ error: 'A valid job id is required.' });
  }

  try {
    const cancelledJob = await cancelMlsImportPdfJobForUser(jobId, decoded.id);
    if (cancelledJob === false) {
      return res.status(403).json({ error: 'You do not have access to this MLS PDF extraction job.' });
    }
    if (!cancelledJob) {
      return res.status(404).json({ error: 'The MLS PDF extraction job was not found.' });
    }

    return res.json({ success: true, job: serializeMlsImportPdfJob(cancelledJob) });
  } catch (error) {
    console.error('Failed to cancel MLS import PDF job:', error);
    return res.status(500).json({ error: 'Failed to cancel the MLS PDF extraction job.' });
  }
});

app.get('/api/admin/mls-imports/extract-pdf-jobs', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const limit = Math.max(1, Math.min(Number.parseInt(String(req.query?.limit || '25'), 10) || 25, 100));
    const jobs = await loadMlsImportPdfJobsForUser(decoded.id, { limit });
    return res.json({ jobs: jobs.map((job) => serializeMlsImportPdfJob(job)) });
  } catch (error) {
    console.error('Failed to load MLS import PDF jobs:', error);
    return res.status(500).json({ error: 'Failed to load MLS import PDF jobs.' });
  }
});

app.get('/api/admin/mls-imports/rows', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const limit = Math.max(1, Math.min(Number.parseInt(String(req.query?.limit || '150'), 10) || 150, 500));
    const offset = Math.max(0, Number.parseInt(String(req.query?.offset || '0'), 10) || 0);
    const payload = await loadMlsImportSpreadsheetRowsForUser(decoded.id, { limit, offset });
    return res.json(payload);
  } catch (error) {
    console.error('Failed to load MLS import rows:', error);
    return res.status(500).json({ error: 'Failed to load MLS import rows.' });
  }
});

app.post('/api/admin/mls-imports/rows/batch', express.json({ limit: '5mb' }), async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const importRunId = normalizeMlsImportSpreadsheetValue(req.body?.importRunId || '');
    const pdfFile = normalizeMlsImportSpreadsheetValue(req.body?.pdfFile || '');
    const result = await persistMlsImportSpreadsheetRowsForUser(decoded.id, rows, { importRunId, pdfFile });
    return res.json({
      success: true,
      rows: result.rows,
      createdCount: result.createdCount,
      updatedCount: result.updatedCount,
      totalCount: result.totalCount
    });
  } catch (error) {
    console.error('Failed to save MLS import rows:', error);
    return res.status(500).json({ error: 'Failed to save MLS import rows.' });
  }
});

app.delete('/api/admin/mls-imports/rows', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const result = await clearMlsImportSpreadsheetRowsForUser(decoded.id);
    return res.json({ success: true, cancelledJobCount: Number(result && result.cancelledJobCount) || 0 });
  } catch (error) {
    console.error('Failed to clear MLS import rows:', error);
    return res.status(500).json({ error: 'Failed to clear MLS import rows.' });
  }
});

app.post('/api/admin/mls-imports/extract-pdf', express.json({ limit: MLS_IMPORT_PDF_BODY_LIMIT }), async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  try {
    const fileName = String(req.body?.fileName || '').trim();
    const contentBase64 = String(req.body?.contentBase64 || '').trim();
    const extension = path.extname(fileName).toLowerCase();

    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'A PDF file name and file content are required.' });
    }

    if (extension !== '.pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported in this import tool.' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ error: 'The uploaded PDF was empty.' });
    }

    if (buffer.length > MLS_IMPORT_PDF_MAX_BYTES) {
      return res.status(413).json({ error: 'PDF files must be 180 MB or smaller.' });
    }

    const extracted = await extractMlsImportPdfFields(buffer);
    return res.json({
      extracted,
      fileName
    });
  } catch (error) {
    console.error('Failed to extract MLS import PDF fields:', error);
    return res.status(500).json({ error: error && error.message ? error.message : 'Failed to extract fields from the uploaded PDF.' });
  }
});

// GET /api/smtp-settings — returns the authenticated user's Gmail SMTP settings
app.get('/api/smtp-settings', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) return;

  try {
    const row = await dbGet('SELECT email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id]);
    const effectiveSmtpConfig = await resolveEffectiveSmtpConfigForUser({
      userId: decoded.id,
      email: row?.email || decoded.email,
      smtpUser: row?.smtp_user,
      smtpPass: row?.smtp_pass,
      smtpSignature: row?.smtp_signature
    });
    const pendingRow = await dbGet(
      `SELECT id, smtp_user, status, created_at
       FROM smtp_requests
       WHERE user_id = ? AND status = 'pending'
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`,
      [decoded.id]
    );

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
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
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

  try {
    const row = await dbGet('SELECT email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id]);
    const effectiveSmtpConfig = await resolveEffectiveSmtpConfigForUser({
      userId: decoded.id,
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
    return res.status(500).json({ error: getEmailFailureReason(error) || 'Failed to send test email' });
  }
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
  const rawPhone = String(req.body?.phone || '').trim();
  const phone = rawPhone ? normalizeSmsPhone(rawPhone) : '';
  const company = String(req.body?.company || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (rawPhone && !phone) {
    return res.status(400).json({ error: 'Enter the phone number in E.164 format, for example +15551234567.' });
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

app.post('/api/property-submissions', (req, res) => {
  const sellerName = String(req.body?.sellerName || '').trim();
  const sellerEmail = String(req.body?.sellerEmail || '').trim().toLowerCase();
  const rawSellerPhone = String(req.body?.sellerPhone || '').trim();
  const sellerPhone = normalizeSmsPhone(rawSellerPhone);
  const smsConsent = req.body?.smsConsent === true || String(req.body?.smsConsent || '').trim().toLowerCase() === 'true';
  const smsConsentText = smsConsent
    ? 'By checking the box below and submitting this form, you agree to receive SMS text messages from FAST BRIDGE GROUP LLC about your property inquiry, offer follow-up, appointment scheduling, and transaction-related updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for assistance. Consent to receive SMS messages is not a condition of purchase.'
    : '';
  const propertyAddress = String(req.body?.propertyAddress || '').trim();
  const propertyCity = String(req.body?.propertyCity || '').trim();
  const propertyState = String(req.body?.propertyState || '').trim();
  const propertyZip = String(req.body?.propertyZip || '').trim();
  const propertyType = String(req.body?.propertyType || '').trim();
  const bedrooms = String(req.body?.bedrooms || '').trim();
  const bathrooms = String(req.body?.bathrooms || '').trim();
  const squareFeet = String(req.body?.squareFeet || '').trim();
  const askingPrice = String(req.body?.askingPrice || '').trim();
  const timeline = String(req.body?.timeline || '').trim();
  const issueNotes = String(req.body?.issueNotes || '').trim();
  const rawIssues = Array.isArray(req.body?.conditionIssues) ? req.body.conditionIssues : [];
  const conditionIssues = rawIssues
    .map((issue) => String(issue || '').trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!sellerName || !sellerEmail || !sellerPhone || !propertyAddress) {
    return res.status(400).json({ error: 'Seller name, seller email, seller phone, and property address are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (!sellerPhone) {
    return res.status(400).json({ error: 'Enter the phone number in E.164 format, for example +15551234567.' });
  }

  if (!smsConsent) {
    return res.status(400).json({ error: 'Explicit SMS consent is required for property inquiry messaging.' });
  }

  db.run(
    `INSERT INTO property_submissions (
      seller_name,
      seller_email,
      seller_phone,
      sms_consent,
      sms_consent_text,
      sms_consent_at,
      property_address,
      property_city,
      property_state,
      property_zip,
      property_type,
      bedrooms,
      bathrooms,
      square_feet,
      asking_price,
      timeline,
      condition_issues,
      issue_notes
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      sellerName,
      sellerEmail,
      sellerPhone,
      smsConsent ? 1 : 0,
      smsConsentText,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyZip,
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet,
      askingPrice,
      timeline,
      JSON.stringify(conditionIssues),
      issueNotes
    ],
    function onInsert(err) {
      if (err) {
        console.error('Failed to save property submission:', err);
        return res.status(500).json({ error: 'Unable to save property submission.' });
      }

      return res.json({
        success: true,
        message: 'Property submitted successfully.',
        submission: {
          id: this.lastID,
          sellerName,
          sellerEmail,
          sellerPhone,
          smsConsent,
          smsConsentText,
          propertyAddress,
          propertyCity,
          propertyState,
          propertyZip,
          propertyType,
          bedrooms,
          bathrooms,
          squareFeet,
          askingPrice,
          timeline,
          conditionIssues,
          issueNotes,
          status: 'new'
        }
      });
    }
  );
});

app.get('/api/property-submissions', (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) {
    return;
  }

  db.all(
    `SELECT
      id,
      seller_name,
      seller_email,
      seller_phone,
      sms_consent,
      sms_consent_text,
      sms_consent_at,
      property_address,
      property_city,
      property_state,
      property_zip,
      property_type,
      bedrooms,
      bathrooms,
      square_feet,
      asking_price,
      timeline,
      condition_issues,
      issue_notes,
      status,
      created_at
     FROM property_submissions
     ORDER BY datetime(created_at) DESC, id DESC`,
    (err, rows) => {
      if (err) {
        console.error('Failed to load property submissions:', err);
        return res.status(500).json({ error: 'Unable to load property submissions.' });
      }

      const submissions = Array.isArray(rows)
        ? rows.map((row) => {
            let conditionIssues = [];
            try {
              const parsed = JSON.parse(String(row.condition_issues || '[]'));
              conditionIssues = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (error) {
              conditionIssues = [];
            }

            return {
              id: row.id,
              sellerName: String(row.seller_name || ''),
              sellerEmail: String(row.seller_email || ''),
              sellerPhone: String(row.seller_phone || ''),
              smsConsent: Number(row.sms_consent || 0) === 1,
              smsConsentText: String(row.sms_consent_text || ''),
              smsConsentAt: row.sms_consent_at || null,
              propertyAddress: String(row.property_address || ''),
              propertyCity: String(row.property_city || ''),
              propertyState: String(row.property_state || ''),
              propertyZip: String(row.property_zip || ''),
              propertyType: String(row.property_type || ''),
              bedrooms: String(row.bedrooms || ''),
              bathrooms: String(row.bathrooms || ''),
              squareFeet: String(row.square_feet || ''),
              askingPrice: String(row.asking_price || ''),
              timeline: String(row.timeline || ''),
              conditionIssues,
              issueNotes: String(row.issue_notes || ''),
              status: String(row.status || 'new'),
              createdAt: row.created_at
            };
          })
        : [];

      return res.json({ submissions });
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

app.get('/api/fbg-offer-terms', (req, res) => {
  try {
    const files = listFbgOfferTermsFiles().map((entry) => ({ name: entry.name }));
    return res.json({
      label: 'FBG Offer Terms',
      files,
      fileCount: files.length
    });
  } catch (error) {
    console.error('Failed to list FBG offer terms files:', error);
    return res.status(500).json({ error: 'Failed to load FBG offer terms files.' });
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

app.get('/api/agent-workspace-documents', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    return res.json({ documents: await listAgentWorkspaceDocumentsForUser(decoded) });
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

  (async () => {
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
    if (!isAllowedInvestorAttachmentFile(extension, req.body?.fileType || '')) {
      return res.status(400).json({ error: 'This file type is not allowed.' });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ error: 'The uploaded file was empty.' });
    }

    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'Files must be 15 MB or smaller.' });
    }

    const createdRecord = await createUserUploadRecord({
      ownerUserId: Number(decoded.id) || 0,
      scope: 'agent-workspace',
      contextKey: category,
      fileName,
      fileSize: buffer.length,
      fileType: getContentTypeForFileName(fileName),
      buffer
    });

    return res.status(201).json({
      document: {
        id: String(createdRecord.id || '').trim(),
        category,
        categoryLabel,
        fileName,
        fileSize: Math.max(Number(createdRecord.file_size) || buffer.length, 0),
        fileType: String(createdRecord.file_type || '').trim() || getContentTypeForFileName(fileName),
        createdAt: Number(createdRecord.created_at) || Date.now(),
        updatedAt: Number(createdRecord.updated_at) || Number(createdRecord.created_at) || Date.now(),
        storage: String(createdRecord.storage_provider || '').trim().toLowerCase() === 's3' ? 'cloud' : 'local'
      }
    });
  })().catch((error) => {
    console.error('Failed to save Agent Workspace document:', error);
    return res.status(500).json({ error: 'Failed to save the uploaded file.' });
  });
});

app.get('/api/agent-workspace-documents/:documentId/content', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const documentItem = await findAgentWorkspaceDocumentForUser(decoded, req.params.documentId);
    if (!documentItem) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const download = String(req.query?.download || '').trim() === '1';
    const contentType = getContentTypeForFileName(documentItem.fileName, documentItem.fileType);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${documentItem.fileName.replace(/"/g, '')}"`
    );
    await streamStoredUserUploadToResponse(documentItem.dbRow || documentItem, res);
    return;
  } catch (error) {
    console.error('Failed to stream Agent Workspace document:', error);
    return res.status(500).json({ error: 'Failed to open the requested file.' });
  }
});

app.delete('/api/agent-workspace-documents/:documentId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const documentItem = await findAgentWorkspaceDocumentForUser(decoded, req.params.documentId);
    if (!documentItem) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (documentItem.dbRow) {
      await deleteStoredUserUpload(documentItem.dbRow);
      await dbRun('DELETE FROM user_uploads WHERE id = ? AND owner_user_id = ?', [documentItem.id, Number(decoded.id) || 0]);
    } else if (documentItem.absolutePath) {
      fs.unlinkSync(documentItem.absolutePath);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Agent Workspace document:', error);
    return res.status(500).json({ error: 'Failed to delete the selected file.' });
  }
});

app.get('/api/agent-workspace-docusign', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  return res.json(getDocuSignStatusPayload());
});

app.post('/api/agent-workspace-docusign/send', express.json({ limit: '1mb' }), async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const propertyAddress = cleanDocuSignText(req.body?.propertyAddress, 300);
    const contractDate = cleanDocuSignText(req.body?.contractDate, 40);
    const apn = cleanDocuSignText(req.body?.apn, 120);
    const purchasePrice = cleanDocuSignText(req.body?.purchasePrice, 120);
    const buyerName = cleanDocuSignText(req.body?.buyerName, 120);
    const buyerEmail = cleanDocuSignText(req.body?.buyerEmail, 180).toLowerCase();
    const sellerName = cleanDocuSignText(req.body?.sellerName, 120);
    const sellerEmail = cleanDocuSignText(req.body?.sellerEmail, 180).toLowerCase();
    const emailSubject = cleanDocuSignText(req.body?.emailSubject, 180);
    const emailMessage = cleanDocuSignText(req.body?.emailMessage, 1000);
    const offerTerms = req.body?.offerTerms && typeof req.body.offerTerms === 'object'
      ? req.body.offerTerms
      : {};

    const missingFields = [];
    if (!propertyAddress) missingFields.push('property address');
    if (!contractDate) missingFields.push('contract date');
    if (!buyerName) missingFields.push('buyer name');
    if (!buyerEmail) missingFields.push('buyer email');
    if (!sellerName) missingFields.push('seller name');
    if (!sellerEmail) missingFields.push('seller email');

    if (missingFields.length) {
      return res.status(400).json({ error: `Add ${missingFields.join(', ')} before sending DocuSign.` });
    }

    if (!isValidEmailAddress(buyerEmail) || !isValidEmailAddress(sellerEmail)) {
      return res.status(400).json({ error: 'Enter valid buyer and seller email addresses.' });
    }

    const envelope = await sendDocuSignTemplateEnvelope({
      propertyAddress,
      contractDate,
      apn,
      purchasePrice,
      buyerName,
      buyerEmail,
      sellerName,
      sellerEmail,
      emailSubject,
      emailMessage,
      offerTerms,
      requestedBy: {
        userId: Number(decoded.id) || 0,
        name: cleanDocuSignText(decoded.name, 120),
        email: cleanDocuSignText(decoded.email, 180).toLowerCase()
      }
    });

    return res.status(201).json({
      success: true,
      envelope,
      message: 'DocuSign envelope sent successfully.'
    });
  } catch (error) {
    console.error('Failed to send Agent Workspace DocuSign envelope:', error);
    const routeError = buildDocuSignRouteErrorResponse(error);
    return res.status(routeError.status).json(routeError.body);
  }
});

app.post('/api/agent-workspace-docusign/signing-link', express.json({ limit: '1mb' }), async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const envelopeId = cleanDocuSignText(req.body?.envelopeId, 120);
    const recipientType = String(req.body?.recipientType || '').trim().toLowerCase() === 'seller' ? 'seller' : 'buyer';
    const recipientName = cleanDocuSignText(req.body?.recipientName, 120);
    const recipientEmail = cleanDocuSignText(req.body?.recipientEmail, 180).toLowerCase();

    if (!envelopeId) {
      return res.status(400).json({ error: 'Send the purchase agreement first so an envelope is available.' });
    }

    if (!recipientName || !recipientEmail) {
      return res.status(400).json({ error: `Add the ${recipientType} name and email before copying a DocuSign link.` });
    }

    if (!isValidEmailAddress(recipientEmail)) {
      return res.status(400).json({ error: `Enter a valid ${recipientType} email address before copying the DocuSign link.` });
    }

    const config = getDocuSignConfig();
    const missingConfig = getDocuSignMissingConfig(config);
    if (missingConfig.length) {
      return res.status(500).json({ error: `DocuSign is not configured. Missing ${missingConfig.join(', ')}.` });
    }

    const accessToken = await getDocuSignAccessToken(config);
    const accountContext = await resolveDocuSignAccountContext(config, accessToken);
    const signingUrl = await createDocuSignRecipientSigningLink(
      accountContext,
      accessToken,
      envelopeId,
      {
        type: recipientType,
        name: recipientName,
        email: recipientEmail
      },
      getRequestOrigin(req)
    );

    return res.json({
      success: true,
      recipientType,
      signingUrl
    });
  } catch (error) {
    console.error('Failed to create Agent Workspace DocuSign signing link:', error);
    const routeError = buildDocuSignRouteErrorResponse(error);
    return res.status(routeError.status).json(routeError.body);
  }
});

app.get('/api/user-uploads', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const scope = sanitizeUserUploadScope(req.query?.scope || '');
    if (!scope) {
      return res.status(400).json({ error: 'A valid upload scope is required.' });
    }

    const rawContextKey = String(req.query?.contextKey || '').trim();
    const contextKey = rawContextKey ? sanitizeUserUploadContextKey(rawContextKey, 'default') : '';
    const rows = await listUserUploadsForOwner(Number(decoded.id) || 0, { scope, contextKey });
    return res.json({ documents: rows.map((row) => serializeUserUpload(row)).filter(Boolean) });
  } catch (error) {
    console.error('Failed to list user uploads:', error);
    return res.status(500).json({ error: 'Failed to load uploaded files.' });
  }
});

app.post('/api/user-uploads', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  userUploadMemory.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      const uploadMessage = uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'Files must be 15 MB or smaller.'
        : (uploadError && uploadError.message ? uploadError.message : 'Failed to upload the file.');
      return res.status(400).json({ error: uploadMessage });
    }

    try {
      const scope = sanitizeUserUploadScope(req.body?.scope || '');
      const contextKey = sanitizeUserUploadContextKey(req.body?.contextKey || 'default', 'default');
      const uploadedFile = req.file;
      const fileName = sanitizeAgentWorkspaceSegment(path.basename(String(uploadedFile?.originalname || '').trim()));
      const extension = path.extname(fileName).toLowerCase();

      if (!scope || !['closed-deal', 'offer-package', 'fbg-message', 'property-detail'].includes(scope)) {
        return res.status(400).json({ error: 'A valid upload scope is required.' });
      }

      if (!uploadedFile || !fileName) {
        return res.status(400).json({ error: 'A file is required.' });
      }

      if (!isAllowedUserUploadForScope(scope, extension, uploadedFile.mimetype || '')) {
        return res.status(400).json({ error: 'This file type is not allowed.' });
      }

      if (!uploadedFile.buffer || !uploadedFile.buffer.length) {
        return res.status(400).json({ error: 'The uploaded file was empty.' });
      }

      const createdRecord = await createUserUploadRecord({
        ownerUserId: Number(decoded.id) || 0,
        scope,
        contextKey,
        fileName,
        fileSize: uploadedFile.size,
        fileType: getContentTypeForFileName(fileName, uploadedFile.mimetype),
        buffer: uploadedFile.buffer
      });

      return res.status(201).json({ document: serializeUserUpload(createdRecord) });
    } catch (error) {
      console.error('Failed to save user upload:', error);
      return res.status(500).json({ error: 'Failed to save the uploaded file.' });
    }
  });
});

app.get('/api/user-uploads/:documentId/content', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const uploadRecord = await getUserUploadByIdForOwner(Number(decoded.id) || 0, req.params.documentId);
    if (!uploadRecord) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const download = String(req.query?.download || '').trim() === '1';
    const fileName = String(uploadRecord.original_file_name || 'document').trim() || 'document';
    res.setHeader('Content-Type', getContentTypeForFileName(fileName, uploadRecord.file_type));
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${fileName.replace(/"/g, '')}"`);
    await streamStoredUserUploadToResponse(uploadRecord, res);
    return;
  } catch (error) {
    console.error('Failed to stream user upload:', error);
    return res.status(500).json({ error: 'Failed to open the requested file.' });
  }
});

app.delete('/api/user-uploads/:documentId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const uploadRecord = await getUserUploadByIdForOwner(Number(decoded.id) || 0, req.params.documentId);
    if (!uploadRecord) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    await deleteStoredUserUpload(uploadRecord);
    await dbRun('DELETE FROM user_uploads WHERE id = ? AND owner_user_id = ?', [String(uploadRecord.id || '').trim(), Number(decoded.id) || 0]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user upload:', error);
    return res.status(500).json({ error: 'Failed to delete the selected file.' });
  }
});

app.get('/api/profile/avatar/content/:documentId', async (req, res) => {
  try {
    const documentId = String(req.params.documentId || '').trim();
    if (!documentId) {
      return res.status(404).end();
    }

    const uploadRecord = await dbGet(
      `SELECT *
         FROM user_uploads
        WHERE id = ? AND scope = 'profile-avatar'`,
      [documentId]
    );

    if (!uploadRecord) {
      return res.status(404).end();
    }

    const fileName = String(uploadRecord.original_file_name || 'avatar').trim() || 'avatar';
    res.setHeader('Content-Type', getContentTypeForFileName(fileName, uploadRecord.file_type));
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`);
    await streamStoredUserUploadToResponse(uploadRecord, res);
    return;
  } catch (error) {
    console.error('Failed to stream profile avatar:', error);
    return res.status(500).end();
  }
});

app.post('/api/profile/avatar', (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  userUploadMemory.single('avatar')(req, res, async (uploadError) => {
    if (uploadError) {
      const uploadMessage = uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'Profile images must be 15 MB or smaller.'
        : (uploadError && uploadError.message ? uploadError.message : 'Failed to upload the profile image.');
      return res.status(400).json({ error: uploadMessage });
    }

    try {
      const uploadedFile = req.file;
      const fileName = sanitizeAgentWorkspaceSegment(path.basename(String(uploadedFile?.originalname || '').trim()));
      const extension = path.extname(fileName).toLowerCase();
      const ownerUserId = Number(decoded.id) || 0;

      if (!uploadedFile || !fileName) {
        return res.status(400).json({ error: 'A profile image is required.' });
      }

      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(extension)) {
        return res.status(400).json({ error: 'Profile images must be PNG, JPG, GIF, or WebP.' });
      }

      if (!String(uploadedFile.mimetype || '').trim().toLowerCase().startsWith('image/')) {
        return res.status(400).json({ error: 'Only image uploads are supported for profile avatars.' });
      }

      if (!uploadedFile.buffer || !uploadedFile.buffer.length) {
        return res.status(400).json({ error: 'The uploaded profile image was empty.' });
      }

      const previousAvatarRecord = await getProfileAvatarUploadRecordForUser(ownerUserId);
      const createdRecord = await createUserUploadRecord({
        ownerUserId,
        scope: 'profile-avatar',
        contextKey: 'current',
        fileName,
        fileSize: uploadedFile.size,
        fileType: getContentTypeForFileName(fileName, uploadedFile.mimetype),
        buffer: uploadedFile.buffer
      });

      await dbRun('UPDATE users SET avatar_upload_id = ? WHERE id = ?', [String(createdRecord?.id || '').trim(), ownerUserId]);

      if (previousAvatarRecord && String(previousAvatarRecord.id || '').trim() !== String(createdRecord?.id || '').trim()) {
        await deleteStoredUserUpload(previousAvatarRecord).catch(() => {});
        await dbRun('DELETE FROM user_uploads WHERE id = ? AND owner_user_id = ?', [String(previousAvatarRecord.id || '').trim(), ownerUserId]);
      }

      const userRow = await dbGet('SELECT id, name, email, role, avatar_upload_id FROM users WHERE id = ?', [ownerUserId]);
      return res.status(201).json({
        document: serializeUserUpload(createdRecord),
        user: serializeUser(userRow)
      });
    } catch (error) {
      console.error('Failed to save profile avatar:', error);
      return res.status(500).json({ error: 'Failed to save the profile image.' });
    }
  });
});

app.delete('/api/profile/avatar', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const ownerUserId = Number(decoded.id) || 0;
    const avatarRecord = await getProfileAvatarUploadRecordForUser(ownerUserId);
    await dbRun('UPDATE users SET avatar_upload_id = NULL WHERE id = ?', [ownerUserId]);

    if (avatarRecord) {
      await deleteStoredUserUpload(avatarRecord).catch(() => {});
      await dbRun('DELETE FROM user_uploads WHERE id = ? AND owner_user_id = ?', [String(avatarRecord.id || '').trim(), ownerUserId]);
    }

    const userRow = await dbGet('SELECT id, name, email, role, avatar_upload_id FROM users WHERE id = ?', [ownerUserId]);
    return res.json({ success: true, user: serializeUser(userRow) });
  } catch (error) {
    console.error('Failed to delete profile avatar:', error);
    return res.status(500).json({ error: 'Failed to delete the profile image.' });
  }
});

app.get('/api/closed-deals', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    return res.json({ deals: await listClosedDealsForOwner(Number(decoded.id) || 0) });
  } catch (error) {
    console.error('Failed to list closed deals:', error);
    return res.status(500).json({ error: 'Failed to load closed deals.' });
  }
});

app.post('/api/closed-deals', express.json({ limit: '2mb' }), async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const id = String(req.body?.id || '').trim();
    const title = String(req.body?.title || '').trim();
    const propertyAddress = String(req.body?.propertyAddress || title).trim();
    const closeDate = String(req.body?.closeDate || '').trim();
    const wholesaleFee = Math.max(Number(req.body?.wholesaleFee) || 0, 0);
    const earnedAmount = Math.max(Number(req.body?.earnedAmount) || 0, 0);
    const note = String(req.body?.note || '').trim();
    const ownerUserId = Number(decoded.id) || 0;
    const timestamp = Date.now();

    if (!id || !title) {
      return res.status(400).json({ error: 'A closed deal id and title are required.' });
    }

    const existingDeal = await getClosedDealForOwner(ownerUserId, id);
    const incomingDocuments = normalizeClosedDealDocumentsForStorage(req.body?.documents);
    const documents = incomingDocuments.length > 0
      ? incomingDocuments
      : normalizeClosedDealDocumentsForStorage(existingDeal?.documents);

    await dbRun(
      `INSERT INTO closed_deals (
        id, owner_user_id, title, property_address, close_date, wholesale_fee, earned_amount, note, documents_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        property_address = excluded.property_address,
        close_date = excluded.close_date,
        wholesale_fee = excluded.wholesale_fee,
        earned_amount = excluded.earned_amount,
        note = excluded.note,
        documents_json = excluded.documents_json,
        updated_at = excluded.updated_at`,
      [
        id,
        ownerUserId,
        title,
        propertyAddress,
        closeDate,
        wholesaleFee,
        earnedAmount,
        note,
        JSON.stringify(documents),
        Number(req.body?.createdAt) || Number(existingDeal?.createdAt) || timestamp,
        timestamp
      ]
    );

    const deal = await getClosedDealForOwner(ownerUserId, id);
    return res.status(201).json({ deal });
  } catch (error) {
    console.error('Failed to save closed deal:', error);
    return res.status(500).json({ error: 'Failed to save closed deal.' });
  }
});

app.delete('/api/closed-deals/:dealId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const ownerUserId = Number(decoded.id) || 0;
    const deal = await getClosedDealForOwner(ownerUserId, req.params.dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Closed deal not found.' });
    }

    await dbRun('DELETE FROM closed_deals WHERE id = ? AND owner_user_id = ?', [deal.id, ownerUserId]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete closed deal:', error);
    return res.status(500).json({ error: 'Failed to delete closed deal.' });
  }
});

app.get('/api/twilio/status', (req, res) => {
  const config = getTwilioMessagingConfig();
  const voiceConfig = getTwilioVoiceConfig();

  return res.json({
    configured: isTwilioConfigured(config),
    fromNumberMasked: maskPhoneNumber(config.fromNumber),
    messagingServiceSidConfigured: Boolean(config.messagingServiceSid),
    mode: config.messagingServiceSid ? 'messaging-service' : (config.fromNumber ? 'phone-number' : 'unconfigured'),
    inboxWebhookUrl: buildTwilioWebhookUrl(req, '/api/twilio/webhook/incoming'),
    statusWebhookUrl: buildTwilioWebhookUrl(req, '/api/twilio/webhook/status'),
    voiceConfigured: isTwilioVoiceConfigured(voiceConfig),
    voiceWebhookUrl: buildTwilioWebhookUrl(req, '/api/twilio/voice/webhook/incoming'),
    activeVoiceSessions: listActiveTwilioVoicePresence().length
  });
});

app.get('/api/twilio/voice/token', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const config = getTwilioVoiceConfig();
  if (!isTwilioVoiceConfigured(config)) {
    return res.status(400).json({
      error: 'Twilio Voice is not configured. Add TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET to issue browser call tokens.'
    });
  }

  const tokenPayload = createTwilioVoiceAccessToken(decoded);
  if (!tokenPayload) {
    return res.status(500).json({ error: 'Unable to generate a Twilio Voice token for this user.' });
  }

  return res.json({
    configured: true,
    identity: tokenPayload.identity,
    token: tokenPayload.token,
    expiresIn: tokenPayload.expiresIn,
    voiceWebhookUrl: buildTwilioWebhookUrl(req, '/api/twilio/voice/webhook/incoming')
  });
});

app.post('/api/twilio/voice/presence', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  if (!isTwilioVoiceConfigured()) {
    return res.status(400).json({ error: 'Twilio Voice is not configured.' });
  }

  const entry = registerTwilioVoicePresence(decoded);
  if (!entry) {
    return res.status(400).json({ error: 'Unable to register voice presence for this user.' });
  }

  return res.json({
    success: true,
    identity: entry.identity,
    refreshedAt: new Date(entry.lastSeenAt).toISOString(),
    activeVoiceSessions: listActiveTwilioVoicePresence().length
  });
});

app.delete('/api/twilio/voice/presence', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  unregisterTwilioVoicePresence(decoded);
  return res.json({ success: true, activeVoiceSessions: listActiveTwilioVoicePresence().length });
});

app.post('/api/twilio/voice/webhook/incoming', async (req, res) => {
  if (!isTwilioWebhookRequestValid(req)) {
    console.warn('Rejected incoming Twilio voice webhook:', {
      hasSignature: Boolean(String(req.headers['x-twilio-signature'] || '').trim()),
      requestUrl: getTwilioWebhookRequestUrl(req),
      host: String(req.get('host') || '').trim()
    });
    return res.status(403).type('text/plain').send('Invalid Twilio signature');
  }

  try {
    const twiml = buildTwilioIncomingVoiceResponse(req);
    return res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('Failed to build incoming Twilio voice response:', error);
    const fallback = new twilio.twiml.VoiceResponse();
    fallback.say({ voice: 'Polly.Joanna' }, 'FAST is unavailable right now. Please try again later.');
    fallback.hangup();
    return res.type('text/xml').send(fallback.toString());
  }
});

app.post('/api/twilio/webhook/incoming', async (req, res) => {
  if (!isTwilioWebhookRequestValid(req)) {
    console.warn('Rejected incoming Twilio SMS webhook:', {
      hasSignature: Boolean(String(req.headers['x-twilio-signature'] || '').trim()),
      requestUrl: getTwilioWebhookRequestUrl(req),
      host: String(req.get('host') || '').trim()
    });
    return res.status(403).type('text/plain').send('Invalid Twilio signature');
  }

  try {
    const payload = req.body || {};
    const messageSid = String(payload.MessageSid || payload.SmsSid || '').trim();
    const body = String(payload.Body || '').trim();
    const details = getTwilioConversationDetailsFromPayload(payload, 'inbound');

    if (!messageSid || !details.conversationKey || !body) {
      return res.type('text/xml').send('<Response></Response>');
    }

    const latestRow = await getLatestTwilioConversationRow(details.conversationKey);
    await upsertTwilioInboxMessage({
      messageSid,
      accountSid: String(payload.AccountSid || '').trim(),
      conversationKey: details.conversationKey,
      campaignName: String(latestRow?.campaign_name || '').trim(),
      contactName: String(payload.ProfileName || latestRow?.contact_name || '').trim(),
      contactPhone: details.contactPhone,
      platformIdentity: details.platformIdentity,
      direction: 'inbound',
      body,
      status: String(payload.SmsStatus || payload.MessageStatus || 'received').trim(),
      errorCode: String(payload.ErrorCode || '').trim(),
      errorMessage: String(payload.ErrorMessage || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readAt: null,
      rawPayload: payload
    });

    return res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('Failed to persist inbound Twilio message:', error);
    return res.type('text/xml').send('<Response></Response>');
  }
});

app.post('/api/twilio/webhook/status', async (req, res) => {
  if (!isTwilioWebhookRequestValid(req)) {
    console.warn('Rejected Twilio status webhook:', {
      hasSignature: Boolean(String(req.headers['x-twilio-signature'] || '').trim()),
      requestUrl: getTwilioWebhookRequestUrl(req),
      host: String(req.get('host') || '').trim()
    });
    return res.status(403).type('text/plain').send('Invalid Twilio signature');
  }

  try {
    const messageSid = String(req.body?.MessageSid || req.body?.SmsSid || '').trim();
    if (!messageSid) {
      return res.status(204).end();
    }

    await dbRun(
      `UPDATE twilio_inbox_messages
          SET status = ?,
              error_code = ?,
              error_message = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE message_sid = ?`,
      [
        String(req.body?.MessageStatus || req.body?.SmsStatus || '').trim(),
        String(req.body?.ErrorCode || '').trim(),
        String(req.body?.ErrorMessage || '').trim(),
        messageSid
      ]
    );

    return res.status(204).end();
  } catch (error) {
    console.error('Failed to persist Twilio status update:', error);
    return res.status(204).end();
  }
});

app.get('/api/twilio/inbox/conversations', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const rows = await listTwilioInboxConversations();
    const conversations = rows.map((row) => ({
      conversationKey: String(row.conversation_key || '').trim(),
      campaignName: String(row.campaign_name || '').trim(),
      contactName: String(row.contact_name || '').trim() || String(row.contact_phone || '').trim(),
      contactPhone: String(row.contact_phone || '').trim(),
      platformIdentity: String(row.platform_identity || '').trim(),
      lastMessageBody: String(row.last_message_body || '').trim(),
      lastMessageAt: normalizeApiTimestamp(row.last_message_at) || null,
      lastDirection: String(row.last_direction || '').trim().toLowerCase() === 'inbound' ? 'inbound' : 'outgoing',
      lastStatus: String(row.last_status || '').trim(),
      unreadCount: Math.max(0, Number(row.unread_count) || 0)
    }));

    return res.json({ conversations });
  } catch (error) {
    console.error('Failed to load Twilio inbox conversations:', error);
    return res.status(500).json({ error: 'Unable to load Twilio inbox conversations.' });
  }
});

app.get('/api/twilio/inbox/messages', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const conversationKey = String(req.query?.conversationKey || '').trim();
  if (!conversationKey) {
    return res.status(400).json({ error: 'conversationKey is required.' });
  }

  try {
    const rows = await listTwilioInboxMessages(conversationKey);
    return res.json({
      conversationKey,
      messages: rows.map(serializeTwilioInboxMessage).filter(Boolean)
    });
  } catch (error) {
    console.error('Failed to load Twilio inbox messages:', error);
    return res.status(500).json({ error: 'Unable to load Twilio inbox messages.' });
  }
});

app.post('/api/twilio/inbox/messages/read', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const conversationKey = String(req.body?.conversationKey || '').trim();
  if (!conversationKey) {
    return res.status(400).json({ error: 'conversationKey is required.' });
  }

  try {
    await markTwilioConversationRead(conversationKey);
    return res.json({ success: true, conversationKey });
  } catch (error) {
    console.error('Failed to mark Twilio conversation read:', error);
    return res.status(500).json({ error: 'Unable to mark Twilio conversation as read.' });
  }
});

app.post('/api/twilio/inbox/reply', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const config = getTwilioMessagingConfig();
  if (!isTwilioConfigured(config)) {
    return res.status(400).json({ error: 'Twilio is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID.' });
  }

  const conversationKey = String(req.body?.conversationKey || '').trim();
  const body = String(req.body?.body || '').trim();
  const campaignName = String(req.body?.campaignName || '').trim();
  if (!conversationKey || !body) {
    return res.status(400).json({ error: 'conversationKey and body are required.' });
  }

  const latestRow = await getLatestTwilioConversationRow(conversationKey);
  if (!latestRow) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  const client = getTwilioClient();
  if (!client) {
    return res.status(500).json({ error: 'Twilio client could not be initialized.' });
  }

  try {
    const payload = {
      body: body.slice(0, 1600),
      to: String(latestRow.contact_phone || '').trim()
    };

    if (config.messagingServiceSid) {
      payload.messagingServiceSid = config.messagingServiceSid;
    } else {
      payload.from = config.fromNumber;
    }

    const statusCallbackUrl = buildTwilioWebhookUrl(req, '/api/twilio/webhook/status');
    if (statusCallbackUrl) {
      payload.statusCallback = statusCallbackUrl;
    }

    const message = await client.messages.create(payload);
    const storedRow = await upsertTwilioInboxMessage({
      messageSid: String(message.sid || '').trim(),
      accountSid: String(message.accountSid || config.accountSid || '').trim(),
      conversationKey,
      campaignName: campaignName || String(latestRow.campaign_name || '').trim(),
      contactName: String(latestRow.contact_name || '').trim(),
      contactPhone: String(latestRow.contact_phone || '').trim(),
      platformIdentity: String(latestRow.platform_identity || '').trim(),
      ownerUserId: Number(decoded.id) || null,
      ownerName: String(decoded.name || '').trim(),
      ownerEmail: String(decoded.email || '').trim().toLowerCase(),
      direction: 'outgoing',
      body: payload.body,
      status: String(message.status || 'queued').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readAt: new Date().toISOString(),
      rawPayload: {
        sid: message.sid,
        status: message.status,
        to: payload.to,
        from: payload.from || '',
        messagingServiceSid: payload.messagingServiceSid || ''
      }
    });

    await markTwilioConversationRead(conversationKey);

    return res.json({
      success: true,
      conversationKey,
      message: serializeTwilioInboxMessage(storedRow)
    });
  } catch (error) {
    console.error('Failed to send Twilio reply:', error);
    return res.status(500).json({ error: error.message || 'Unable to send Twilio reply.' });
  }
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
  const authenticatedUser = await getAuthenticatedUserFromBearerHeader(req.headers.authorization || '');
  if (!senderName && authenticatedUser) {
    senderName = String(authenticatedUser.name || '').trim();
  }

  const client = getTwilioClient();
  if (!client) {
    return res.status(500).json({ error: 'Twilio client could not be initialized.' });
  }

  const sent = [];
  const failed = [];
  const statusCallbackUrl = buildTwilioWebhookUrl(req, '/api/twilio/webhook/status');

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

      if (statusCallbackUrl) {
        payload.statusCallback = statusCallbackUrl;
      }

      const message = await client.messages.create(payload);
      const details = getTwilioConversationDetails({
        contactPhone: normalizedPhone,
        platformIdentity: payload.messagingServiceSid || payload.from || config.messagingServiceSid || config.fromNumber
      });
      const storedRow = await upsertTwilioInboxMessage({
        messageSid: String(message.sid || '').trim(),
        accountSid: String(message.accountSid || config.accountSid || '').trim(),
        conversationKey: details.conversationKey,
        campaignName,
        contactName: String(recipient.name || '').trim(),
        contactPhone: details.contactPhone,
        platformIdentity: details.platformIdentity,
        ownerUserId: Number(authenticatedUser?.id) || null,
        ownerName: String(authenticatedUser?.name || senderName || '').trim(),
        ownerEmail: String(authenticatedUser?.email || '').trim().toLowerCase(),
        direction: 'outgoing',
        body: personalizedBody,
        status: String(message.status || 'queued').trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readAt: new Date().toISOString(),
        rawPayload: {
          sid: message.sid,
          status: message.status,
          to: payload.to,
          from: payload.from || '',
          messagingServiceSid: payload.messagingServiceSid || ''
        }
      });
      sent.push({
        name: recipient.name || '',
        phone: normalizedPhone,
        sid: message.sid,
        status: message.status || 'queued',
        conversationKey: String(storedRow?.conversation_key || details.conversationKey || '').trim()
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
  const includeFbgOfferTerms = Boolean(req.body?.includeFbgOfferTerms);

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

  const resolvedInvestorAttachments = [];

  for (const item of investorAttachmentPaths) {
    const relativePath = String(item || '').trim();
    const resolvedAttachmentPath = resolveInvestorAttachmentPath(relativePath);
    if (!resolvedAttachmentPath) {
      continue;
    }

    resolvedInvestorAttachments.push(resolvedAttachmentPath);

    normalizedAttachments.push({
      filename: path.basename(resolvedAttachmentPath),
      path: resolvedAttachmentPath
    });
  }

  const availableFbgOfferTermsFiles = includeFbgOfferTerms && resolvedInvestorAttachments.length === 0
    ? listFbgOfferTermsFiles()
    : [];

  if (includeFbgOfferTerms) {
    for (const item of availableFbgOfferTermsFiles) {
      normalizedAttachments.push({
        filename: item.name,
        path: item.path
      });
    }
  }

  // Look up the authenticated user's personal SMTP settings; fall back to env vars if not set
  let authenticatedUser = null;
  let smtpUser;
  let smtpPass;
  let smtpSignature = '';
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Sign in again before sending email through the website.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const row = await dbGet('SELECT name, email, smtp_user, smtp_pass, smtp_signature FROM users WHERE id = ?', [decoded.id]);
    authenticatedUser = row || null;
    const effectiveSmtpConfig = await resolveEffectiveSmtpConfigForUser({
      userId: decoded.id,
      email: row?.email || decoded.email,
      smtpUser: row?.smtp_user,
      smtpPass: row?.smtp_pass,
      smtpSignature: row?.smtp_signature
    });
    smtpUser = effectiveSmtpConfig.smtpUser;
    smtpPass = effectiveSmtpConfig.smtpPass;
    smtpSignature = effectiveSmtpConfig.smtpSignature;
  } catch (e) {
    return res.status(401).json({ error: 'Sign in again before sending email through the website.' });
  }

  if (!authenticatedUser?.email) {
    return res.status(401).json({ error: 'Sign in again before sending email through the website.' });
  }

  if (!smtpUser || !smtpPass) {
    return res.status(400).json({ error: 'Your account does not have an approved Gmail outbox configured. Connect your own Gmail in Settings and wait for approval before sending.' });
  }

  const normalizedRequestedFromEmail = normalizeKnownEmail(fromEmail);
  const normalizedAuthenticatedEmail = normalizeKnownEmail(authenticatedUser?.email || '');
  const normalizedResolvedSmtpUser = normalizeKnownEmail(smtpUser || '');

  if (normalizedRequestedFromEmail && normalizedRequestedFromEmail !== normalizedResolvedSmtpUser) {
    return res.status(400).json({ error: `Email can only be sent from your approved Gmail outbox: ${smtpUser}.` });
  }

  if (!smtpIdentityMatchesAccount(smtpUser, normalizedAuthenticatedEmail)) {
    return res.status(400).json({ error: 'Your approved Gmail outbox does not match the signed-in account. Update the account SMTP settings before sending.' });
  }

  const safeFromEmail = String(smtpUser || '').trim();

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
  let firstSendErrorMessage = '';
  for (const email of emails) {
    try {
      let resolvedHtmlBody = htmlBody;
      if (resolvedHtmlBody && resolvedECardPath) {
        resolvedHtmlBody = `${resolvedHtmlBody}<div style="margin-top:18px;"><img src="cid:offer-ecard-inline" alt="E-card signature" style="display:block;max-width:420px;width:100%;height:auto;border-radius:12px;"></div>`;
      }

      await sendAgentEmail({
        fromName,
        fromEmail: safeFromEmail,
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
      if (!firstSendErrorMessage) {
        firstSendErrorMessage = getEmailFailureReason(err);
      }
      console.error('Send agent email error:', {
        recipient: email,
        sender: safeFromEmail,
        message: err?.message || 'Unknown send error',
        reason: getEmailFailureReason(err)
      });
    }
  }

  if (failed.length === 0) {
    return res.json({ success: true, message: `Email sent to ${sentCount} recipient(s)` });
  } else if (sentCount > 0) {
    const partialFailureMessage = firstSendErrorMessage ? ` Reason: ${firstSendErrorMessage}` : '';
    return res.json({ success: true, message: `Email sent to ${sentCount} recipient(s), but failed for: ${failed.join(', ')}.${partialFailureMessage}` });
  } else {
    const failureMessage = firstSendErrorMessage ? ` Reason: ${firstSendErrorMessage}` : '';
    return res.status(500).json({ error: `Failed to send email to: ${failed.join(', ')}.${failureMessage}` });
  }
});

// Get all users for authenticated UI selectors
app.get('/api/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    await syncLoriaBrokerAccount();
    await purgeSuppressedAccounts();

    db.all('SELECT id, name, email, role, created_at, last_login FROM users', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json({ users: (rows || []).filter((row) => !isSuppressedAccountIdentity(row)) });
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/messages/users', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentUserId = Number(decoded.id);
  if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
    return res.status(400).json({ error: 'Authenticated user id is required.' });
  }

  try {
    await purgeSuppressedAccounts();
    const users = await listMessageUsers(currentUserId);

    return res.json({
      success: true,
      users: users.filter((row) => !isSuppressedAccountIdentity(row)).map((row) => ({
        ...serializeUser(row),
        lastLogin: normalizeApiTimestamp(row.last_login),
        lastMessage: String(row.last_message || '').trim(),
        lastMessageAt: normalizeApiTimestamp(row.last_message_at),
        unreadCount: Number(row.unread_count) || 0
      }))
    });
  } catch (error) {
    console.error('Load message users error:', error);
    return res.status(500).json({ error: 'Unable to load message users.' });
  }
});

app.get('/api/messages/conversations/:userId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentUserId = Number(decoded.id);
  const otherUserId = Number.parseInt(String(req.params?.userId || ''), 10);

  if (!Number.isInteger(currentUserId) || currentUserId <= 0 || !Number.isInteger(otherUserId) || otherUserId <= 0) {
    return res.status(400).json({ error: 'Valid user ids are required.' });
  }

  if (currentUserId === otherUserId) {
    return res.status(400).json({ error: 'Choose another user to view a conversation.' });
  }

  try {
    const otherUser = await dbGet('SELECT id, name, email, role, last_login FROM users WHERE id = ?', [otherUserId]);
    if (!otherUser) {
      return res.status(404).json({ error: 'Selected user was not found.' });
    }

    await markConversationMessagesRead(otherUserId, currentUserId);

    let rows = await listConversationMessages(currentUserId, otherUserId);

    if (!rows.length && isS3StorageConfigured()) {
      try {
        const restoreResult = await restoreArchivedMessagesForPair(currentUserId, otherUserId);
        if (restoreResult.restoredCount > 0) {
          await markConversationMessagesRead(otherUserId, currentUserId);

          rows = await listConversationMessages(currentUserId, otherUserId);
        }
      } catch (restoreError) {
        console.error('Skipped archived message restore for conversation because S3 recovery is unavailable:', restoreError);
      }
    }

    return res.json({
      success: true,
      otherUser: {
        ...serializeUser(otherUser),
        lastLogin: normalizeApiTimestamp(otherUser.last_login)
      },
      messages: rows.map((row) => serializeUserMessage(row, currentUserId)).filter(Boolean)
    });
  } catch (error) {
    console.error('Load conversation error:', error);
    return res.status(500).json({ error: 'Unable to load the conversation.' });
  }
});

app.post('/api/messages/conversations/:userId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentUserId = Number(decoded.id);
  const otherUserId = Number.parseInt(String(req.params?.userId || ''), 10);
  const body = String(req.body?.body || '').trim();

  if (!Number.isInteger(currentUserId) || currentUserId <= 0 || !Number.isInteger(otherUserId) || otherUserId <= 0) {
    return res.status(400).json({ error: 'Valid user ids are required.' });
  }

  if (currentUserId === otherUserId) {
    return res.status(400).json({ error: 'You cannot message yourself here.' });
  }

  if (!body) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  if (body.length > 20000) {
    return res.status(400).json({ error: 'Keep messages under 20000 characters.' });
  }

  try {
    const otherUser = await dbGet('SELECT id FROM users WHERE id = ?', [otherUserId]);
    if (!otherUser) {
      return res.status(404).json({ error: 'Selected user was not found.' });
    }

    const inserted = await createUserMessageRecord({
      senderUserId: currentUserId,
      recipientUserId: otherUserId,
      body
    });

    try {
      await archiveUserMessageToS3(inserted);
    } catch (archiveError) {
      console.error('Failed to archive user message to S3:', archiveError);
    }

    return res.json({
      success: true,
      message: serializeUserMessage(inserted, currentUserId)
    });
  } catch (error) {
    console.error('Send conversation message error:', error);
    return res.status(500).json({ error: 'Unable to send the message.' });
  }
});

app.patch('/api/messages/conversations/:userId/messages/:messageId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentUserId = Number(decoded.id);
  const otherUserId = Number.parseInt(String(req.params?.userId || ''), 10);
  const messageId = Number.parseInt(String(req.params?.messageId || ''), 10);
  const body = String(req.body?.body || '').trim();

  if (!Number.isInteger(currentUserId) || currentUserId <= 0 || !Number.isInteger(otherUserId) || otherUserId <= 0 || !Number.isInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'Valid user ids and message id are required.' });
  }

  if (!body) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  if (body.length > 20000) {
    return res.status(400).json({ error: 'Keep messages under 20000 characters.' });
  }

  try {
    const existingMessage = await getOwnedUserMessage(messageId, currentUserId, otherUserId);

    if (!existingMessage) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const normalizedCreatedAt = normalizeApiTimestamp(existingMessage.created_at);
    const createdAtDate = normalizedCreatedAt ? new Date(normalizedCreatedAt) : new Date(Number.NaN);
    if (Number.isNaN(createdAtDate.getTime()) || (Date.now() - createdAtDate.getTime()) > USER_MESSAGE_EDIT_WINDOW_MS) {
      return res.status(403).json({ error: 'Messages can only be edited within 1 minute of sending.' });
    }

    const updated = await updateOwnedUserMessageBody(messageId, currentUserId, otherUserId, body);

    await archiveUserMessageToS3(updated);

    return res.json({
      success: true,
      message: serializeUserMessage(updated, currentUserId)
    });
  } catch (error) {
    console.error('Edit conversation message error:', error);
    return res.status(500).json({ error: 'Unable to edit the message.' });
  }
});

app.get('/api/messages/attachments/:documentId/content', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const currentUserId = Number(decoded.id);
    const documentId = String(req.params?.documentId || '').trim();
    if (!Number.isInteger(currentUserId) || currentUserId <= 0 || !documentId) {
      return res.status(400).json({ error: 'A valid attachment id is required.' });
    }

    const uploadRecord = await dbGet(
      `SELECT *
         FROM user_uploads
        WHERE id = ? AND scope = 'fbg-message'`,
      [documentId]
    );

    if (!uploadRecord) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    const relatedMessage = await findAccessibleMessageAttachment(currentUserId, documentId);

    if (!relatedMessage) {
      return res.status(403).json({ error: 'You do not have access to this attachment.' });
    }

    const download = String(req.query?.download || '').trim() === '1';
    const fileName = String(uploadRecord.original_file_name || 'attachment').trim() || 'attachment';
    const contentType = getContentTypeForFileName(fileName, uploadRecord.file_type);
    const forceDownload = download || !isInlineMessageAttachmentType(fileName, contentType);
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `${forceDownload ? 'attachment' : 'inline'}; filename="${fileName.replace(/"/g, '')}"`);
    await streamStoredUserUploadToResponse(uploadRecord, res);
    return;
  } catch (error) {
    console.error('Failed to stream message attachment:', error);
    return res.status(500).json({ error: 'Failed to open the requested attachment.' });
  }
});

app.delete('/api/messages/conversations/:userId', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentUserId = Number(decoded.id);
  const otherUserId = Number.parseInt(String(req.params?.userId || ''), 10);

  if (!Number.isInteger(currentUserId) || currentUserId <= 0 || !Number.isInteger(otherUserId) || otherUserId <= 0) {
    return res.status(400).json({ error: 'Valid user ids are required.' });
  }

  if (currentUserId === otherUserId) {
    return res.status(400).json({ error: 'Choose another user to clear a conversation.' });
  }

  try {
    const otherUser = await dbGet('SELECT id FROM users WHERE id = ?', [otherUserId]);
    if (!otherUser) {
      return res.status(404).json({ error: 'Selected user was not found.' });
    }

    return res.status(403).json({ error: 'Conversations cannot be deleted.' });
  } catch (error) {
    console.error('Clear conversation block error:', error);
    return res.status(500).json({ error: 'Unable to protect the conversation.' });
  }
});

app.get('/api/messages/notifications', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  const currentUserId = Number(decoded.id);
  const afterId = Number.parseInt(String(req.query?.afterId || ''), 10);
  const seeded = String(req.query?.seeded || '').trim() === '1';
  const safeAfterId = Number.isInteger(afterId) && afterId > 0 ? afterId : 0;

  if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
    return res.status(400).json({ error: 'Authenticated user id is required.' });
  }

  try {
    const latestIncomingMessageId = await getLatestIncomingMessageId(currentUserId);

    if (!seeded) {
      return res.json({
        success: true,
        seeded: true,
        latestIncomingMessageId,
        notifications: []
      });
    }

    const rows = await listUnreadMessageNotifications(currentUserId, safeAfterId);

    return res.json({
      success: true,
      seeded: true,
      latestIncomingMessageId,
      notifications: rows
        .map((row) => serializeMessageNotification(row, currentUserId))
        .filter(Boolean)
    });
  } catch (error) {
    console.error('Load message notifications error:', error);
    return res.status(500).json({ error: 'Unable to load message notifications.' });
  }
});

app.get('/api/property-assignments', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    const rows = await dbAll(
      `SELECT property_key, property_address, assigned_to_key, assigned_to_email, assigned_to_name,
              assigned_by_key, assigned_by_email, assigned_by_name, assigned_at, payload_json
       FROM property_assignments`,
      []
    );
    const assignments = await sanitizePropertyAssignments(rows);
    return res.json({ assignments });
  } catch (error) {
    console.error('Property assignments load error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
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

app.get('/api/agent-property-memory', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    await ensureAgentPropertyMemoryTable();
  } catch (error) {
    console.error('Failed to ensure agent_property_memory table before read:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  const ownerUser = normalizeAssignmentUser(decoded);
  const searchValue = String(req.query?.search || '').trim().toLowerCase();
  const agentValue = String(req.query?.agent || '').trim().toLowerCase();
  const requestedStatus = String(req.query?.status || 'all-statuses').trim().toLowerCase();
  const normalizedStatus = requestedStatus === 'all-statuses'
    ? 'all-statuses'
    : normalizeAgentPropertyStatus(requestedStatus);
  const requestedLimit = Number.parseInt(String(req.query?.limit || '100'), 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 250)
    : 100;

  db.all(
    `SELECT property_key, agent_key, agent_name, agent_email, property_address, status_value,
            owner_user_key, owner_user_email, owner_user_name, payload_json, updated_at
     FROM agent_property_memory
     WHERE owner_user_key = ?
     ORDER BY updated_at DESC`,
    [ownerUser.key],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const items = (rows || [])
        .map((row) => parseAgentPropertyMemoryRow(row))
        .filter((item) => {
          if (!item || !item.propertyKey || !item.agentKey) {
            return false;
          }

          if (normalizedStatus !== 'all-statuses' && item.statusValue !== normalizedStatus) {
            return false;
          }

          if (agentValue) {
            const agentHaystack = [
              item.agentName,
              item.agentEmail,
              item.snapshot?.agentRecord?.brokerage
            ].join(' ').toLowerCase();
            if (!agentHaystack.includes(agentValue)) {
              return false;
            }
          }

          if (searchValue) {
            const snapshot = item.snapshot && typeof item.snapshot === 'object' ? item.snapshot : {};
            const searchHaystack = [
              item.propertyAddress,
              item.statusValue,
              snapshot.marketInfo,
              snapshot.location,
              snapshot.areaLabel,
              snapshot.city,
              snapshot.zip,
              snapshot.apn,
              snapshot.listPrice,
              snapshot.mlsNumber,
              snapshot.propertyDetails,
              snapshot.agentComments,
              snapshot.publicComments,
              item.agentName,
              item.agentEmail,
              snapshot.agentRecord?.brokerage
            ].join(' ').toLowerCase();
            if (!searchHaystack.includes(searchValue)) {
              return false;
            }
          }

          return true;
        })
        .sort((left, right) => {
          const leftTime = new Date(left.updatedAt || 0).getTime() || 0;
          const rightTime = new Date(right.updatedAt || 0).getTime() || 0;
          return rightTime - leftTime;
        })
        .slice(0, limit);

      return res.json({
        items,
        count: items.length,
        filters: {
          search: searchValue,
          agent: agentValue,
          status: normalizedStatus,
          limit
        }
      });
    }
  );
});

app.post('/api/agent-property-memory', async (req, res) => {
  const decoded = requireAuth(req, res);
  if (!decoded) {
    return;
  }

  try {
    await ensureAgentPropertyMemoryTable();
  } catch (error) {
    console.error('Failed to ensure agent_property_memory table before write:', error);
    return res.status(500).json({ error: 'Unable to prepare agent property memory storage' });
  }

  const ownerUser = normalizeAssignmentUser(req.body?.ownerUser || decoded);
  const propertyKey = normalizePropertyAssignmentKey(req.body?.propertyKey || req.body?.detail?.address || req.body?.detail?.propertyAddress);
  if (!propertyKey) {
    return res.status(400).json({ error: 'Property key is required' });
  }

  const detail = req.body?.detail;

  if (detail == null) {
    try {
      await dbRun('DELETE FROM agent_property_memory WHERE property_key = ? AND owner_user_key = ?', [propertyKey, ownerUser.key]);
      return res.json({ success: true, propertyKey, cleared: true });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to remove agent property memory' });
    }
  }

  const normalizedRecord = normalizeAgentPropertyMemoryRecord(propertyKey, detail, ownerUser, decoded);
  if (!normalizedRecord) {
    try {
      await dbRun('DELETE FROM agent_property_memory WHERE property_key = ? AND owner_user_key = ?', [propertyKey, ownerUser.key]);
      return res.json({ success: true, propertyKey, cleared: true });
    } catch (error) {
      return res.status(500).json({ error: 'Unable to clear invalid agent property memory' });
    }
  }

  try {
    await dbRun('DELETE FROM agent_property_memory WHERE property_key = ? AND owner_user_key = ?', [normalizedRecord.propertyKey, normalizedRecord.ownerUser.key]);
    await dbRun(
      `INSERT INTO agent_property_memory (
          property_key,
          agent_key,
          agent_name,
          agent_email,
          property_address,
          status_value,
          owner_user_key,
          owner_user_email,
          owner_user_name,
          payload_json,
          updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        normalizedRecord.propertyKey,
        normalizedRecord.agentKey,
        normalizedRecord.agentName,
        normalizedRecord.agentEmail,
        normalizedRecord.propertyAddress,
        normalizedRecord.statusValue,
        normalizedRecord.ownerUser.key,
        normalizedRecord.ownerUser.email,
        normalizedRecord.ownerUser.name,
        JSON.stringify(normalizedRecord)
      ]
    );

    return res.json({
      success: true,
      propertyKey: normalizedRecord.propertyKey,
      item: normalizedRecord
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save agent property memory' });
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
async function startServer() {
  await initializePostgresMessageStore();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     FAST BRIDGE GROUP Dashboard - Secure Server              ║
║                  Running on port ${PORT}                      ║
╚════════════════════════════════════════════════════════════╝
  `);

    initializeS3BackupsAndHealthChecks();
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    if (userMessageStorePool) {
      await userMessageStorePool.end();
      userMessageStorePool = null;
      console.log('PostgreSQL message store connection closed');
    }
  } catch (error) {
    console.error('Failed to close PostgreSQL message store connection:', error);
  }

  db.close(() => {
    console.log('\nDatabase connection closed');
    process.exit(0);
  });
});
