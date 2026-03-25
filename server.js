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
const { PDFParse } = require('pdf-parse');

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
const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_test_51TDU29Q3MV5dyF2TauLp1mMkQukSL6PbAlgHN9zzm5fH9lzZsQIHN4iOTjh1Vu1eAsyOKGZ6bXSIANej5zS9XA2p00cn6NJsZL';
const STRIPE_PUBLISHABLE_KEY = String(process.env.STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE_PUBLISHABLE_KEY).trim();
const PREMIUM_USER_ROLE = 'premium user';
const TEST_USER_ROLE = 'test user';
const PREMIUM_PLAN_KEY = 'premium';
const PREMIUM_PRICE_CENTS = 9900;
const PREMIUM_CURRENCY = 'USD';
const AUTH_SESSION_TTL = '24h';
const TWO_FACTOR_CHALLENGE_TTL = '10m';
const ONLINE_USER_ACTIVITY_WINDOW_MINUTES = 5;
const TOTP_WINDOW = 1;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

let cachedOpenAiApiKey = null;
let cachedTwilioClient = null;
let cachedTwilioClientKey = '';
const revokedSessionIds = new Set();

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
    imageUrl: normalizeListingText(structuredImage || ogImage),
    notes: description,
    status: mapListingStatus(textFacts.status)
  };
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
app.use(express.static(path.join(__dirname)));

app.post('/api/import-listing-by-address', async (req, res) => {
  const rawAddress = String(req.body?.address || '').trim();

  if (!rawAddress) {
    return res.status(400).json({ error: 'Add a property address before searching Zillow and Redfin.' });
  }

  const sourceResults = await Promise.allSettled(['zillow', 'redfin'].map(async (source) => {
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
    return res.status(404).json({ error: 'FAST could not find a matching Zillow or Redfin listing for this address.' });
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
      db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, () => {});
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
    CREATE TABLE IF NOT EXISTS property_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_name TEXT NOT NULL,
      seller_email TEXT NOT NULL,
      seller_phone TEXT,
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

  return {
    id: userLike.id,
    name: userLike.name,
    email: userLike.email,
    role: isKnownAdminEmail(userLike.email) ? 'admin' : String(userLike.role || '').trim().toLowerCase()
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
const FBG_OFFER_TERMS_ROOT = path.resolve(__dirname, 'Email - Offer Terms');
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
    const user = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [challenge.id]);
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
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id], (error, userRow) => {
      if (error) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!userRow) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ success: true, user: serializeUser(userRow) });
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
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
      parsedPageCount: pageTexts.length
    };
  }

  return {
    text: aggregateText || mergedPageText,
    parsedPageCount: pageTexts.length
  };
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
    .replace(/^\(?[A-Z0-9]+\)?\s+/, '')
    .replace(/^[-:|]+\s*/, '')
    .replace(/^[\\/]+\s*/, '')
    .trim();
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

function extractPropertyAddressFromPdfText(text, lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^property address\b/i, /^address\b/i, /^subject property\b/i],
    /^(?:property address|address|subject property)\s*[:#-]?\s*(.+)$/i
  );
  if (labeledValue) {
    return labeledValue;
  }

  const addressMatch = String(text || '').match(/\b\d{2,6}\s+[A-Za-z0-9.'#\- ]+\b(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl|Terrace|Ter|Trail|Trl|Parkway|Pkwy|Highway|Hwy)\b(?:[^\n]*?,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)?/i);
  return addressMatch ? String(addressMatch[0] || '').trim() : '';
}

function extractAgentNameFromPdfText(lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^agent name\b/i, /^listing agent(?: name)?\b/i, /^la name\b/i, /^list agent\b/i],
    /^(?:agent name|listing agent(?: name)?|la name|list agent)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      transform: cleanPersonName,
      validate: isLikelyPersonName
    }
  );
  return cleanPersonName(labeledValue);
}

function extractLaCellFromPdfText(lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^\d*\.?\s*la cell\b/i, /^listing agent cell\b/i, /^la mobile\b/i, /^la phone\b/i],
    /^(?:\d*\.?\s*)?(?:la cell|listing agent cell|la mobile|la phone)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractPhoneNumber(value))
    }
  );
  return extractPhoneNumber(labeledValue);
}

function extractLoPhoneFromPdfText(lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^lo phone\b/i, /^listing office phone\b/i, /^office phone\b/i, /^broker phone\b/i],
    /^(?:lo phone|listing office phone|office phone|broker phone)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractPhoneNumber(value))
    }
  );
  return extractPhoneNumber(labeledValue);
}

function extractOffersEmailFromPdfText(lines) {
  const labeledValue = extractPdfFieldByLabel(
    lines,
    [/^offers?\s+e-?mail\b/i, /^submit offers(?: to)?\b/i, /^offer instructions\b/i, /^e-?mail for offers\b/i],
    /^(?:offers?\s+e-?mail|submit offers(?: to)?|offer instructions|e-?mail for offers)\s*[:#-]?\s*(.+)$/i,
    {
      lookahead: 4,
      validate: (value) => Boolean(extractEmailAddress(value))
    }
  );
  return extractEmailAddress(labeledValue);
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
    laCell: extractLaCellFromPdfText(lines)
  };

  const hasMeaningfulValue = Object.values(row).some((value) => String(value || '').trim());
  return hasMeaningfulValue ? row : null;
}

function dedupeMlsImportRows(rows) {
  const seen = new Set();
  const deduped = [];

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row || typeof row !== 'object') {
      return;
    }

    const signature = [
      String(row.propertyAddress || '').trim().toLowerCase(),
      String(row.laName || '').trim().toLowerCase(),
      String(row.loPhone || '').trim().toLowerCase(),
      String(row.offersEmail || '').trim().toLowerCase(),
      String(row.laCell || '').trim().toLowerCase()
    ].join('|');

    if (!signature.replace(/\|/g, '')) {
      return;
    }

    if (seen.has(signature)) {
      return;
    }

    seen.add(signature);
    deduped.push(row);
  });

  return deduped;
}

async function extractMlsImportPdfFields(buffer) {
  const parser = new PDFParse({ data: buffer });
  let normalizedText = '';
  let pageCount = 0;
  let pageTexts = [];

  try {
    const info = await parser.getInfo();
    pageCount = Number(info && info.total) || 0;
    const parsed = await parser.getText();
    const fullTextResult = buildFullPdfText(parsed);
    normalizedText = fullTextResult.text;
    pageTexts = Array.isArray(parsed && parsed.pages)
      ? parsed.pages
          .map((page) => normalizePdfExtractText(page && typeof page === 'object' ? page.text : ''))
          .filter(Boolean)
      : [];
    if (!pageCount && fullTextResult.parsedPageCount > 0) {
      pageCount = fullTextResult.parsedPageCount;
    }
  } finally {
    await parser.destroy().catch(() => {});
  }

  if (!normalizedText) {
    throw new Error('The PDF did not contain readable text.');
  }

  const extractedRows = dedupeMlsImportRows(
    (pageTexts.length > 0 ? pageTexts : [normalizedText])
      .map((pageText) => extractMlsImportRowFromText(pageText))
      .filter(Boolean)
  );
  const fallbackRow = extractMlsImportRowFromText(normalizedText) || {};
  const primaryRow = extractedRows[0] || fallbackRow;

  return {
    pageCount,
    propertyAddress: String(primaryRow.propertyAddress || '').trim(),
    laName: String(primaryRow.laName || '').trim(),
    loPhone: String(primaryRow.loPhone || '').trim(),
    offersEmail: String(primaryRow.offersEmail || '').trim(),
    laCell: String(primaryRow.laCell || '').trim(),
    rows: extractedRows.length > 0 ? extractedRows : (Object.values(fallbackRow).some(Boolean) ? [fallbackRow] : [])
  };
}

app.post('/api/admin/mls-imports/extract-pdf', express.json({ limit: '20mb' }), async (req, res) => {
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

    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'PDF files must be 15 MB or smaller.' });
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
      return res.status(500).json({ error: getEmailFailureReason(error) || 'Failed to send test email' });
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

app.post('/api/property-submissions', (req, res) => {
  const sellerName = String(req.body?.sellerName || '').trim();
  const sellerEmail = String(req.body?.sellerEmail || '').trim().toLowerCase();
  const sellerPhone = String(req.body?.sellerPhone || '').trim();
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

  if (!sellerName || !sellerEmail || !propertyAddress) {
    return res.status(400).json({ error: 'Seller name, seller email, and property address are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  db.run(
    `INSERT INTO property_submissions (
      seller_name,
      seller_email,
      seller_phone,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sellerName,
      sellerEmail,
      sellerPhone,
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

  if (includeFbgOfferTerms) {
    for (const item of listFbgOfferTermsFiles()) {
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
