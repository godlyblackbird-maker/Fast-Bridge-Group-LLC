const test = require('node:test');
const assert = require('node:assert/strict');

const {
  findBuiltInBypassDefaultTokenEnvWarnings,
  parseBuiltInBypassAllowedIps,
  parseBuiltInBypassTokenValues,
  resolveBuiltInBypassAuth
} = require('../built-in-bypass-auth');

test('parseBuiltInBypassTokenValues keeps unique trimmed tokens and falls back when blank', () => {
  assert.deepEqual(
    parseBuiltInBypassTokenValues('  alpha , beta,alpha ,, gamma ', 'fallback-token'),
    ['alpha', 'beta', 'gamma']
  );

  assert.deepEqual(
    parseBuiltInBypassTokenValues('', 'fallback-token'),
    ['fallback-token']
  );
});

test('parseBuiltInBypassAllowedIps keeps unique trimmed entries', () => {
  assert.deepEqual(
    Array.from(parseBuiltInBypassAllowedIps(' 203.0.113.10 , 198.51.100.24,203.0.113.10 ')),
    ['203.0.113.10', '198.51.100.24']
  );
});

test('findBuiltInBypassDefaultTokenEnvWarnings catches default tokens inside rotation lists', () => {
  assert.deepEqual(
    findBuiltInBypassDefaultTokenEnvWarnings([
      {
        envKey: 'ISAAC_ADMIN_BYPASS_TOKEN',
        configuredValue: 'new-token,isaacAdminBypassToken',
        defaultToken: 'isaacAdminBypassToken'
      },
      {
        envKey: 'STEVE_ADMIN_BYPASS_TOKEN',
        configuredValue: 'rotated-steve-token',
        defaultToken: 'steveAdminBypassToken'
      }
    ]),
    ['ISAAC_ADMIN_BYPASS_TOKEN']
  );
});

test('resolveBuiltInBypassAuth accepts a valid bypass token from an allowed IP', () => {
  const tokenLabelByToken = new Map([['valid-token', 'isaac-admin']]);
  const userByToken = new Map([['valid-token', { id: 7, email: 'isaac@example.com', role: 'admin', tokenLabel: 'isaac-admin', isBypassAuth: true }]]);
  const allowedIps = new Set(['203.0.113.10']);

  const decision = resolveBuiltInBypassAuth({
    token: 'valid-token',
    enabled: true,
    requestIp: '203.0.113.10',
    allowedIps,
    userByToken,
    tokenLabelByToken
  });

  assert.equal(decision.outcome, 'accepted');
  assert.equal(decision.tokenLabel, 'isaac-admin');
  assert.deepEqual(decision.user, {
    id: 7,
    email: 'isaac@example.com',
    role: 'admin',
    tokenLabel: 'isaac-admin',
    isBypassAuth: true
  });
});

test('resolveBuiltInBypassAuth blocks disabled and IP-mismatched bypass requests', () => {
  const tokenLabelByToken = new Map([['valid-token', 'isaac-admin']]);
  const userByToken = new Map([['valid-token', { id: 7, email: 'isaac@example.com', role: 'admin', tokenLabel: 'isaac-admin', isBypassAuth: true }]]);

  const disabledDecision = resolveBuiltInBypassAuth({
    token: 'valid-token',
    enabled: false,
    requestIp: '203.0.113.10',
    allowedIps: new Set(),
    userByToken,
    tokenLabelByToken
  });
  assert.equal(disabledDecision.outcome, 'blocked-disabled');
  assert.equal(disabledDecision.user, null);

  const blockedIpDecision = resolveBuiltInBypassAuth({
    token: 'valid-token',
    enabled: true,
    requestIp: '198.51.100.24',
    allowedIps: new Set(['203.0.113.10']),
    userByToken,
    tokenLabelByToken
  });
  assert.equal(blockedIpDecision.outcome, 'blocked-ip');
  assert.equal(blockedIpDecision.user, null);
});