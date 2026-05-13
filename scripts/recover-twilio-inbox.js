require('dotenv').config();

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const twilio = require('twilio');

const DATABASE_FILENAME = 'database.db';
const CANONICAL_EMAIL_ALIASES = new Map([
  ['isaac.haro@fastbridgegroupllc.com', 'isaac.haro@fastbridgegroupllc.com'],
  ['isaacs.hesed@gmail.com', 'isaac.haro@fastbridgegroupllc.com'],
  ['isaacs.hesed@fastbridgegroup.com', 'isaac.haro@fastbridgegroupllc.com'],
  ['steve.medina@fastbridgegroupllc.com', 'steve.medina@fastbridgegroupllc.com'],
  ['medinafbg@gmail.com', 'steve.medina@fastbridgegroupllc.com'],
  ['medinastj@gmail.com', 'steve.medina@fastbridgegroupllc.com']
]);
const DEFAULT_TWILIO_NUMBER_ASSIGNMENTS = [
  {
    phoneNumber: '+18448755968',
    email: 'isaac.haro@fastbridgegroupllc.com'
  }
];

function normalizeKnownEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return CANONICAL_EMAIL_ALIASES.get(normalizedEmail) || normalizedEmail;
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

function normalizeApiTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '';
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value || {});
  } catch (_error) {
    return '{}';
  }
}

function parseTwilioNumberAssignmentsConfig(rawValue) {
  const source = String(rawValue || '').trim();
  if (!source) {
    return [];
  }

  return source
    .split(/[\r\n,;]+/)
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .map((entry) => {
      const [phonePart, emailPart] = entry.split('=').map((part) => String(part || '').trim());
      const phoneNumber = normalizeSmsPhone(phonePart);
      const email = normalizeKnownEmail(emailPart);
      if (!phoneNumber || !email) {
        return null;
      }
      return { phoneNumber, email };
    })
    .filter(Boolean);
}

function getConfiguredTwilioNumberAssignments() {
  const configuredAssignments = parseTwilioNumberAssignmentsConfig(process.env.TWILIO_NUMBER_ASSIGNMENTS || '');
  const combinedAssignments = [...DEFAULT_TWILIO_NUMBER_ASSIGNMENTS, ...configuredAssignments];
  const dedupedAssignments = new Map();

  combinedAssignments.forEach((entry) => {
    const phoneNumber = normalizeSmsPhone(entry && entry.phoneNumber);
    const email = normalizeKnownEmail(entry && entry.email);
    if (!phoneNumber || !email) {
      return;
    }
    dedupedAssignments.set(phoneNumber, email);
  });

  return dedupedAssignments;
}

function resolveDatabaseFilePath() {
  const explicitPath = String(process.env.DATABASE_PATH || process.env.SQLITE_DATABASE_PATH || process.env.SQLITE_DB_PATH || '').trim();
  if (explicitPath) {
    return path.resolve(explicitPath);
  }

  const persistentRoot = String(process.env.RENDER_DISK_MOUNT_PATH || process.env.PERSISTENT_STORAGE_PATH || process.env.DATA_DIR || '').trim();
  if (persistentRoot) {
    return path.join(path.resolve(persistentRoot), DATABASE_FILENAME);
  }

  return path.join(path.resolve(__dirname, '..'), DATABASE_FILENAME);
}

function openDatabase(filePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(db);
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows || []);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row || null);
    });
  });
}

function dbRun(db, sql, params = []) {
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

function closeDatabase(db) {
  return new Promise((resolve) => db.close(() => resolve()));
}

async function loadUserLookup(db) {
  const rows = await dbAll(db, 'SELECT id, name, email FROM users');
  const byEmail = new Map();
  rows.forEach((row) => {
    const email = normalizeKnownEmail(row && row.email);
    if (!email) {
      return;
    }
    byEmail.set(email, {
      id: Number(row.id) || null,
      name: String(row.name || '').trim(),
      email
    });
  });
  return byEmail;
}

function getTwilioClientConfig() {
  return {
    accountSid: String(process.env.TWILIO_ACCOUNT_SID || '').trim(),
    authToken: String(process.env.TWILIO_AUTH_TOKEN || '').trim(),
    fromNumber: normalizeSmsPhone(process.env.TWILIO_PHONE_NUMBER || ''),
    messagingServiceSid: String(process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim(),
    recoverLimit: Math.max(1, Number.parseInt(String(process.env.TWILIO_RECOVER_LIMIT || '5000'), 10) || 5000)
  };
}

function resolveTwilioNumberForMessage(message, configuredNumbers, fallbackNumber) {
  const normalizedTo = normalizeSmsPhone(message && message.to);
  const normalizedFrom = normalizeSmsPhone(message && message.from);

  if (normalizedTo && configuredNumbers.has(normalizedTo)) {
    return normalizedTo;
  }
  if (normalizedFrom && configuredNumbers.has(normalizedFrom)) {
    return normalizedFrom;
  }
  return fallbackNumber || normalizedTo || normalizedFrom || '';
}

function toInboxDirection(message) {
  const direction = String(message && message.direction || '').trim().toLowerCase();
  return direction.startsWith('inbound') ? 'inbound' : 'outgoing';
}

function getContactPhoneForMessage(message, direction) {
  return direction === 'inbound'
    ? normalizeSmsPhone(message && message.from)
    : normalizeSmsPhone(message && message.to);
}

async function upsertTwilioInboxMessage(db, record) {
  const messageSid = String(record.messageSid || '').trim();
  const conversationKey = String(record.conversationKey || '').trim();
  const contactPhone = normalizeSmsPhone(record.contactPhone);
  const platformIdentity = normalizeTwilioPlatformIdentity(record.platformIdentity);
  const createdAt = normalizeApiTimestamp(record.createdAt) || new Date().toISOString();
  const updatedAt = normalizeApiTimestamp(record.updatedAt) || createdAt;
  const readAt = normalizeApiTimestamp(record.readAt);

  if (!messageSid || !conversationKey || !contactPhone || !platformIdentity) {
    return false;
  }

  await dbRun(
    db,
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
       reactions_json,
       raw_payload_json,
       created_at,
       updated_at,
       read_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      String(record.direction || '').trim().toLowerCase() === 'inbound' ? 'inbound' : 'outgoing',
      String(record.body || '').trim(),
      String(record.status || '').trim(),
      String(record.errorCode || '').trim(),
      String(record.errorMessage || '').trim(),
      '[]',
      safeJsonStringify(record.rawPayload || {}),
      createdAt,
      updatedAt,
      readAt
    ]
  );

  return true;
}

async function recoverTwilioInbox() {
  const config = getTwilioClientConfig();
  if (!config.accountSid || !config.authToken) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.');
  }
  if (!config.fromNumber && !config.messagingServiceSid && getConfiguredTwilioNumberAssignments().size === 0) {
    throw new Error('Missing TWILIO_PHONE_NUMBER, TWILIO_MESSAGING_SERVICE_SID, or TWILIO_NUMBER_ASSIGNMENTS.');
  }

  const dbPath = resolveDatabaseFilePath();
  const db = await openDatabase(dbPath);
  const configuredAssignments = getConfiguredTwilioNumberAssignments();
  const configuredNumbers = new Set(Array.from(configuredAssignments.keys()));
  if (config.fromNumber) {
    configuredNumbers.add(config.fromNumber);
  }

  const userLookup = await loadUserLookup(db);
  const client = twilio(config.accountSid, config.authToken);
  const messages = await client.messages.list({ limit: config.recoverLimit });
  let restoredCount = 0;
  let skippedCount = 0;

  try {
    for (const message of messages) {
      const direction = toInboxDirection(message);
      const contactPhone = getContactPhoneForMessage(message, direction);
      const twilioNumber = resolveTwilioNumberForMessage(message, configuredNumbers, config.fromNumber);
      const platformIdentity = twilioNumber || config.messagingServiceSid || message.messagingServiceSid || (direction === 'inbound' ? message.to : message.from);
      const conversationKey = buildTwilioConversationKey(contactPhone, platformIdentity);

      if (!contactPhone || !platformIdentity || !conversationKey) {
        skippedCount += 1;
        continue;
      }

      const ownerEmail = normalizeKnownEmail(configuredAssignments.get(normalizeSmsPhone(twilioNumber)) || '');
      const ownerUser = ownerEmail ? (userLookup.get(ownerEmail) || null) : null;

      const restored = await upsertTwilioInboxMessage(db, {
        messageSid: String(message.sid || '').trim(),
        accountSid: String(message.accountSid || config.accountSid || '').trim(),
        conversationKey,
        campaignName: '',
        contactName: String(message.to === contactPhone ? message.fromFormatted || '' : message.toFormatted || '').trim(),
        contactPhone,
        platformIdentity,
        ownerUserId: ownerUser ? ownerUser.id : null,
        ownerName: ownerUser ? ownerUser.name : '',
        ownerEmail,
        direction,
        body: String(message.body || '').trim(),
        status: String(message.status || '').trim(),
        errorCode: String(message.errorCode || '').trim(),
        errorMessage: String(message.errorMessage || '').trim(),
        createdAt: normalizeApiTimestamp(message.dateSent || message.dateCreated || message.dateUpdated || new Date()),
        updatedAt: normalizeApiTimestamp(message.dateUpdated || message.dateSent || message.dateCreated || new Date()),
        readAt: direction === 'outgoing' ? normalizeApiTimestamp(message.dateSent || message.dateCreated || new Date()) : null,
        rawPayload: {
          sid: String(message.sid || '').trim(),
          status: String(message.status || '').trim(),
          to: String(message.to || '').trim(),
          from: String(message.from || '').trim(),
          twilioNumber,
          messagingServiceSid: String(message.messagingServiceSid || config.messagingServiceSid || '').trim(),
          accountSid: String(message.accountSid || '').trim()
        }
      });

      if (restored) {
        restoredCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    const countRow = await dbGet(db, 'SELECT COUNT(*) AS total FROM twilio_inbox_messages');
    return {
      databasePath: dbPath,
      restoredCount,
      skippedCount,
      totalRows: Number(countRow && countRow.total) || 0,
      configuredNumbers: Array.from(configuredNumbers)
    };
  } finally {
    await closeDatabase(db);
  }
}

module.exports = {
  recoverTwilioInbox
};

if (require.main === module) {
  recoverTwilioInbox()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error('Failed to recover Twilio inbox history.');
      console.error(error && error.message ? error.message : error);
      process.exitCode = 1;
    });
}