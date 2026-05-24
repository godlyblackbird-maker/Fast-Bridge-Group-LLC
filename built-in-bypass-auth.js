function parseBuiltInBypassTokenValues(value, fallbackToken) {
  const configuredTokens = String(value || '')
    .split(',')
    .map((tokenValue) => String(tokenValue || '').trim())
    .filter(Boolean);

  if (configuredTokens.length) {
    return Array.from(new Set(configuredTokens));
  }

  const fallback = String(fallbackToken || '').trim();
  return fallback ? [fallback] : [];
}

function parseBuiltInBypassAllowedIps(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
  );
}

function findBuiltInBypassDefaultTokenEnvWarnings(entries) {
  const source = Array.isArray(entries) ? entries : [];
  return source.reduce((warnings, entry) => {
    const envKey = String(entry?.envKey || '').trim();
    const defaultToken = String(entry?.defaultToken || '').trim();
    const configuredTokens = parseBuiltInBypassTokenValues(entry?.configuredValue || '', defaultToken);

    if (!envKey || !defaultToken) {
      return warnings;
    }

    if (configuredTokens.includes(defaultToken)) {
      warnings.push(envKey);
    }

    return warnings;
  }, []);
}

function resolveBuiltInBypassAuth(options) {
  const config = options && typeof options === 'object' ? options : {};
  const normalizedToken = String(config.token || '').trim();
  const tokenLabelByToken = config.tokenLabelByToken instanceof Map ? config.tokenLabelByToken : new Map();
  const userByToken = config.userByToken instanceof Map ? config.userByToken : new Map();
  const allowedIps = config.allowedIps instanceof Set ? config.allowedIps : new Set();
  const requestIp = String(config.requestIp || '').trim();

  if (!normalizedToken) {
    return { user: null, outcome: 'missing-token', tokenLabel: null };
  }

  const tokenLabel = tokenLabelByToken.get(normalizedToken) || null;
  if (!config.enabled) {
    return { user: null, outcome: tokenLabel ? 'blocked-disabled' : 'disabled', tokenLabel };
  }

  const userRecord = userByToken.get(normalizedToken) || null;
  if (!userRecord) {
    return { user: null, outcome: 'not-found', tokenLabel };
  }

  if (allowedIps.size && (!requestIp || !allowedIps.has(requestIp))) {
    return { user: null, outcome: 'blocked-ip', tokenLabel: String(userRecord.tokenLabel || tokenLabel || '').trim() || null };
  }

  return {
    user: { ...userRecord },
    outcome: 'accepted',
    tokenLabel: String(userRecord.tokenLabel || tokenLabel || '').trim() || null
  };
}

module.exports = {
  findBuiltInBypassDefaultTokenEnvWarnings,
  parseBuiltInBypassAllowedIps,
  parseBuiltInBypassTokenValues,
  resolveBuiltInBypassAuth
};