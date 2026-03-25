// Authentication middleware script
// Include this in all pages that require authentication

(function() {
  const KNOWN_EMAIL_GROUPS = [
    {
      canonical: 'isaac.haro@fastbridgegroupllc.com',
      aliases: [
        'isaac.haro@fastbridgegroupllc.com',
        'isaacs.hesed@fastbridgegroup.com',
        'isaacs.hesed@gmail.com'
      ],
      forceRole: 'admin'
    },
    {
      canonical: 'steve.medina@fastbridgegroupllc.com',
      aliases: [
        'steve.medina@fastbridgegroupllc.com',
        'medinafbg@gmail.com',
        'medinastj@gmail.com'
      ],
      forceRole: 'admin'
    }
  ];
  const KNOWN_EMAIL_ALIAS_LOOKUP = new Map();
  const ADMIN_CANONICAL_EMAILS = new Set();
  const AUTH_USER_LOCK_KEY = 'authVerifiedUserLock';
  const PREMIUM_SETTINGS_URL = '/settings.html?tab=subscriptions';
  const TEST_USER_ROLE = 'test user';
  let premiumUpgradeTooltip = null;
  let premiumUpgradeTooltipHideTimer = null;
  let authSyncInProgress = true;
  let authNavigationGuardBound = false;
  let testUserBanner = null;

  KNOWN_EMAIL_GROUPS.forEach((group) => {
    if (group.forceRole === 'admin') {
      ADMIN_CANONICAL_EMAILS.add(group.canonical);
    }
    group.aliases.forEach((alias) => {
      KNOWN_EMAIL_ALIAS_LOOKUP.set(alias, group.canonical);
    });
  });

  function getKnownEmailGroup(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const canonicalEmail = KNOWN_EMAIL_ALIAS_LOOKUP.get(normalizedEmail) || normalizedEmail;
    return KNOWN_EMAIL_GROUPS.find((group) => group.canonical === canonicalEmail) || null;
  }

  function normalizeKnownEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return KNOWN_EMAIL_ALIAS_LOOKUP.get(normalizedEmail) || normalizedEmail;
  }

  function getKnownEmailCandidates(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return [];
    }
    const group = getKnownEmailGroup(normalizedEmail);
    return group ? group.aliases.slice() : [normalizedEmail];
  }

  function normalizeKnownUser(userLike) {
    if (!userLike || typeof userLike !== 'object') {
      return null;
    }

    const normalizedEmail = normalizeKnownEmail(userLike.email || '');
    const isKnownAdminAccount = ADMIN_CANONICAL_EMAILS.has(normalizedEmail);

    return {
      ...userLike,
      email: normalizedEmail || String(userLike.email || '').trim().toLowerCase(),
      role: isKnownAdminAccount ? 'admin' : String(userLike.role || '').trim().toLowerCase()
    };
  }

  function getScopedKeys(userLike) {
    const normalizedUser = normalizeKnownUser(userLike) || {};
    const keys = new Set();
    getKnownEmailCandidates(normalizedUser.email || userLike.email || '').forEach((candidate) => keys.add(candidate));

    const name = String(normalizedUser.name || userLike.name || 'User').trim().toLowerCase();
    if (name) {
      keys.add(name.replace(/\s+/g, '-'));
    }

    return Array.from(keys).filter(Boolean);
  }

  function readStoredUser() {
    let storedUser = null;
    try {
      storedUser = normalizeKnownUser(JSON.parse(localStorage.getItem('user') || 'null'));
    } catch (error) {
      storedUser = null;
    }

    const lockedUser = getVerifiedAuthUserLock();
    if (lockedUser && storedUser && isAuthIdentityMismatch(lockedUser, storedUser)) {
      return forceLogoutForAuthMismatch(lockedUser, storedUser);
    }

    if (lockedUser && !storedUser) {
      localStorage.setItem('user', JSON.stringify(lockedUser));
      syncLegacyUserProfile(lockedUser);
      return lockedUser;
    }

    return storedUser || lockedUser;
  }

  function writeStoredUser(userLike, options) {
    const normalizedUser = normalizeKnownUser(userLike);
    if (!normalizedUser) {
      return null;
    }

    const config = options && typeof options === 'object' ? options : {};
    const forceWrite = Boolean(config.force);
    const lockedUser = getVerifiedAuthUserLock();
    const lockedEmail = normalizeKnownEmail(lockedUser && lockedUser.email || '');
    const nextEmail = normalizeKnownEmail(normalizedUser.email || '');

    if (!forceWrite && lockedEmail && nextEmail && lockedEmail !== nextEmail) {
      return forceLogoutForAuthMismatch(lockedUser, normalizedUser);
    }

    localStorage.setItem('user', JSON.stringify(normalizedUser));
    syncLegacyUserProfile(normalizedUser);
    persistVerifiedAuthUserLock(normalizedUser, { force: forceWrite });
    return normalizedUser;
  }

  function readAuthUserLockRecord() {
    try {
      const parsed = JSON.parse(localStorage.getItem(AUTH_USER_LOCK_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function getVerifiedAuthUserLock() {
    const activeToken = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
    if (!activeToken) {
      return null;
    }

    const lockRecord = readAuthUserLockRecord();
    if (!lockRecord) {
      return null;
    }

    const lockToken = String(lockRecord.token || '').trim();
    const lockedUser = normalizeKnownUser(lockRecord.user || lockRecord);
    if (!lockToken || lockToken !== activeToken || !lockedUser || !String(lockedUser.email || '').trim()) {
      return null;
    }

    return lockedUser;
  }

  function isAuthIdentityMismatch(expectedUser, actualUser) {
    const expectedEmail = normalizeKnownEmail(expectedUser && expectedUser.email || '');
    const actualEmail = normalizeKnownEmail(actualUser && actualUser.email || '');

    if (!expectedEmail || !actualEmail) {
      return false;
    }

    return expectedEmail !== actualEmail;
  }

  function forceLogoutForAuthMismatch(expectedUser, actualUser) {
    const expectedEmail = normalizeKnownEmail(expectedUser && expectedUser.email || '');
    const actualEmail = normalizeKnownEmail(actualUser && actualUser.email || '');

    console.warn('Auth account mismatch detected. Logging out for safety.', {
      expectedEmail,
      actualEmail
    });

    clearAuthState();

    if (window.location.pathname !== '/login.html') {
      window.location.href = '/login.html';
    }

    return null;
  }

  function persistVerifiedAuthUserLock(userLike, options) {
    const activeToken = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
    const normalizedUser = normalizeKnownUser(userLike);
    if (!activeToken || !normalizedUser) {
      return null;
    }

    const config = options && typeof options === 'object' ? options : {};
    const forceWrite = Boolean(config.force);
    const lockRecord = readAuthUserLockRecord();
    const lockedUser = normalizeKnownUser(lockRecord && (lockRecord.user || lockRecord));
    const lockedEmail = normalizeKnownEmail(lockedUser && lockedUser.email || '');
    const nextEmail = normalizeKnownEmail(normalizedUser.email || '');
    const lockToken = String(lockRecord && lockRecord.token || '').trim();

    if (!forceWrite && lockToken === activeToken && lockedEmail && nextEmail && lockedEmail !== nextEmail) {
      return forceLogoutForAuthMismatch(lockedUser, normalizedUser);
    }

    localStorage.setItem(AUTH_USER_LOCK_KEY, JSON.stringify({
      token: activeToken,
      user: normalizedUser,
      updatedAt: Date.now()
    }));
    return normalizedUser;
  }

  function syncLegacyUserProfile(userLike) {
    const normalizedUser = normalizeKnownUser(userLike);
    if (!normalizedUser) {
      return null;
    }

    const userKeys = getScopedKeys(normalizedUser);
    let scopedProfile = null;

    try {
      const profileStore = JSON.parse(localStorage.getItem('userProfilesByUser') || '{}');
      if (profileStore && typeof profileStore === 'object') {
        for (const userKey of userKeys) {
          if (profileStore[userKey] && typeof profileStore[userKey] === 'object') {
            scopedProfile = profileStore[userKey];
            break;
          }
        }
      }
    } catch (error) {
      scopedProfile = null;
    }

    const mirroredProfile = {
      ...(scopedProfile || {}),
      name: String((scopedProfile && scopedProfile.name) || normalizedUser.name || 'User').trim(),
      email: normalizedUser.email,
      role: String(normalizedUser.role || (scopedProfile && scopedProfile.role) || '').trim(),
      avatarImage: String((scopedProfile && scopedProfile.avatarImage) || normalizedUser.avatarImage || '').trim()
    };

    localStorage.setItem('userProfile', JSON.stringify(mirroredProfile));
    return mirroredProfile;
  }

  function clearAuthState() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('registeredEmail');
    localStorage.removeItem('bypassAuth');
    localStorage.removeItem('bypassProfile');
    localStorage.removeItem(AUTH_USER_LOCK_KEY);
    sessionStorage.removeItem('authToken');
  }

  function setAuthSyncState(isSyncing) {
    authSyncInProgress = Boolean(isSyncing);
    document.documentElement.setAttribute('data-auth-sync', authSyncInProgress ? 'pending' : 'ready');
  }

  function shouldBlockNavigationWhileAuthSync(target) {
    if (!authSyncInProgress || !target || typeof target.closest !== 'function') {
      return false;
    }

    const link = target.closest('a[href]');
    if (!link) {
      return false;
    }

    const rawHref = String(link.getAttribute('href') || '').trim();
    if (!rawHref || rawHref.startsWith('#') || /^javascript:/i.test(rawHref) || /^(mailto|tel):/i.test(rawHref)) {
      return false;
    }

    if (link.hasAttribute('download') || String(link.getAttribute('target') || '').trim().toLowerCase() === '_blank') {
      return false;
    }

    try {
      const resolvedUrl = new URL(link.href, window.location.href);
      return resolvedUrl.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function bindAuthNavigationGuard() {
    if (authNavigationGuardBound) {
      return;
    }

    authNavigationGuardBound = true;
    document.addEventListener('click', function(event) {
      if (!shouldBlockNavigationWhileAuthSync(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function getStoredAuthToken() {
    const localToken = String(localStorage.getItem('authToken') || '').trim();
    if (localToken) {
      return localToken;
    }

    const sessionToken = String(sessionStorage.getItem('authToken') || '').trim();
    if (!sessionToken) {
      return '';
    }

    localStorage.setItem('authToken', sessionToken);
    sessionStorage.removeItem('authToken');
    return sessionToken;
  }

  function isAdminUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === 'admin');
  }

  function isRegularUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === 'user');
  }

  function isBrokerUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === 'broker');
  }

  function isPremiumUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === 'premium user');
  }

  function isTestUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === TEST_USER_ROLE);
  }

  function hasStoredAuthToken() {
    return Boolean(getStoredAuthToken());
  }

  function sanitizeLegacyProfileMirror() {
    const storedUser = readStoredUser();
    if (!storedUser || !hasStoredAuthToken()) {
      return;
    }

    let legacyProfile = null;
    try {
      legacyProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    } catch (error) {
      legacyProfile = null;
    }

    if (!legacyProfile || typeof legacyProfile !== 'object') {
      return;
    }

    const storedEmail = normalizeKnownEmail(storedUser.email || '');
    const legacyEmail = normalizeKnownEmail(legacyProfile.email || '');
    if (storedEmail && legacyEmail && storedEmail !== legacyEmail) {
      localStorage.removeItem('userProfile');
    }
  }

  function formatRoleLabel(roleValue) {
    const normalizedRole = String(roleValue || '').trim().toLowerCase();
    if (normalizedRole === 'admin') {
      return 'Administrator';
    }
    if (normalizedRole === 'broker') {
      return 'Broker';
    }
    if (normalizedRole === 'premium user') {
      return 'Premium User';
    }
    if (normalizedRole === TEST_USER_ROLE) {
      return 'TEST USER';
    }
    if (normalizedRole === 'user') {
      return 'User';
    }
    return normalizedRole || 'User';
  }

  function ensureTestUserModeStyles() {
    if (document.getElementById('test-user-mode-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'test-user-mode-styles';
    style.textContent = `
      .test-user-banner {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 10000;
        max-width: 320px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(245, 158, 11, 0.35);
        background: rgba(15, 23, 42, 0.88);
        color: #f8fafc;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
        backdrop-filter: blur(18px);
      }

      .test-user-banner strong {
        display: block;
        margin-bottom: 4px;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
      }

      .test-user-banner p {
        margin: 0;
        font-size: 0.82rem;
        line-height: 1.45;
        color: rgba(248, 250, 252, 0.82);
      }

      .test-user-locked-control,
      [data-test-user-locked="true"] {
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureTestUserBanner() {
    ensureTestUserModeStyles();
    if (testUserBanner && document.body.contains(testUserBanner)) {
      return testUserBanner;
    }

    testUserBanner = document.createElement('aside');
    testUserBanner.className = 'test-user-banner';
    testUserBanner.setAttribute('aria-live', 'polite');
    testUserBanner.innerHTML = '<strong>TEST USER</strong><p>Browse-only mode is active. Tabs and navigation work, but edits, sends, saves, uploads, and calculator actions are disabled.</p>';
    document.body.appendChild(testUserBanner);
    return testUserBanner;
  }

  function isAllowedTestUserNavigationLink(link) {
    if (!link) {
      return false;
    }

    const rawHref = String(link.getAttribute('href') || '').trim();
    if (!rawHref || rawHref.startsWith('#') || /^javascript:/i.test(rawHref) || /^(mailto|tel):/i.test(rawHref)) {
      return false;
    }

    if (link.hasAttribute('download') || String(link.getAttribute('target') || '').trim().toLowerCase() === '_blank') {
      return false;
    }

    try {
      const resolvedUrl = new URL(link.href, window.location.href);
      return resolvedUrl.origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function isAllowedTestUserControlTarget(target) {
    if (!target || typeof target.closest !== 'function') {
      return false;
    }

    if (target.closest('a.settings-nav-link[data-tab], .property-tab-btn[data-tab], [role="tab"], [data-mls-results-tab], .calendar-nav-btn, .calendar-back-btn, .piq-image-tab')) {
      return true;
    }

    const link = target.closest('a[href]');
    return isAllowedTestUserNavigationLink(link);
  }

  function markTestUserLockedControls() {
    document.querySelectorAll('button, [role="button"], .btn, .card-btn').forEach((control) => {
      if (isAllowedTestUserControlTarget(control)) {
        return;
      }

      control.dataset.testUserLocked = 'true';
      control.classList.add('test-user-locked-control');
      if (!control.getAttribute('title')) {
        control.setAttribute('title', 'TEST USER accounts are browse-only.');
      }
      control.setAttribute('aria-disabled', 'true');
    });

    document.querySelectorAll('input, textarea').forEach((field) => {
      const type = String(field.getAttribute('type') || '').trim().toLowerCase();
      if (type === 'hidden') {
        return;
      }

      field.readOnly = true;
      field.dataset.testUserLocked = 'true';
      field.classList.add('test-user-locked-control');
      if (!field.getAttribute('title')) {
        field.setAttribute('title', 'TEST USER accounts are browse-only.');
      }
    });

    document.querySelectorAll('input[type="checkbox"], input[type="radio"], input[type="file"], select').forEach((field) => {
      field.disabled = true;
      field.dataset.testUserLocked = 'true';
      field.classList.add('test-user-locked-control');
      if (!field.getAttribute('title')) {
        field.setAttribute('title', 'TEST USER accounts are browse-only.');
      }
    });

    document.querySelectorAll('[contenteditable=""], [contenteditable="true"]').forEach((field) => {
      field.setAttribute('contenteditable', 'false');
      field.dataset.testUserLocked = 'true';
      field.classList.add('test-user-locked-control');
      if (!field.getAttribute('title')) {
        field.setAttribute('title', 'TEST USER accounts are browse-only.');
      }
    });
  }

  function bindTestUserBrowseOnlyGuard() {
    if (document.documentElement.dataset.testUserBrowseOnlyBound === 'true') {
      return;
    }

    document.documentElement.dataset.testUserBrowseOnlyBound = 'true';

    const suppressEvent = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener('click', (event) => {
      if (!isTestUser(getCurrentUser())) {
        return;
      }

      if (isAllowedTestUserControlTarget(event.target)) {
        return;
      }

      const blockedTarget = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('button, [role="button"], input, select, textarea, form, label, a[href], [contenteditable], [data-tab]')
        : null;

      if (!blockedTarget) {
        return;
      }

      suppressEvent(event);
    }, true);

    document.addEventListener('submit', (event) => {
      if (!isTestUser(getCurrentUser())) {
        return;
      }
      suppressEvent(event);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (!isTestUser(getCurrentUser())) {
        return;
      }

      if (isAllowedTestUserControlTarget(event.target)) {
        return;
      }

      const blockedField = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('input, select, textarea, [contenteditable], button, [role="button"]')
        : null;

      if (!blockedField) {
        return;
      }

      suppressEvent(event);
    }, true);
  }

  function applyTestUserBrowseOnlyMode(userLike) {
    if (!isTestUser(userLike)) {
      return;
    }

    document.documentElement.setAttribute('data-test-user-mode', 'browse-only');
    ensureTestUserBanner();
    markTestUserLockedControls();
    bindTestUserBrowseOnlyGuard();
  }

  function applyAdminControlsAccess(userLike) {
    const hasKnownRole = !!String(userLike && userLike.role || '').trim();
    const isAdmin = isAdminUser(userLike);
    const adminLinks = document.querySelectorAll('.nav-link[href="admin-controls.html"], .nav-link[href="/admin-controls.html"]');

    if (hasKnownRole && !isAdmin) {
      adminLinks.forEach((link) => {
        const listItem = link.closest('.nav-item');
        if (listItem) {
          listItem.remove();
        } else {
          link.remove();
        }
      });
    }

    const normalizedPath = String(window.location.pathname || '').trim().toLowerCase();
    if (hasKnownRole && !isAdmin && (normalizedPath.endsWith('/admin-controls.html') || normalizedPath === '/admin-controls.html')) {
      window.location.href = '/dashboard.html';
      return false;
    }

    return true;
  }

  function isActiveBuyersPath(pathname) {
    const normalizedPath = String(pathname || '').trim().toLowerCase();
    return normalizedPath === '/active-buyers.html' || normalizedPath.endsWith('/active-buyers.html');
  }

  function isAnalyticsPath(pathname) {
    const normalizedPath = String(pathname || '').trim().toLowerCase();
    return normalizedPath === '/analytics.html' || normalizedPath.endsWith('/analytics.html');
  }

  function isCampaignsPath(pathname) {
    const normalizedPath = String(pathname || '').trim().toLowerCase();
    return normalizedPath === '/campaigns.html' || normalizedPath.endsWith('/campaigns.html');
  }

  function clearPremiumUpgradeTooltipHideTimer() {
    if (premiumUpgradeTooltipHideTimer) {
      window.clearTimeout(premiumUpgradeTooltipHideTimer);
      premiumUpgradeTooltipHideTimer = null;
    }
  }

  function ensurePremiumUpgradeTooltip() {
    if (premiumUpgradeTooltip && document.body.contains(premiumUpgradeTooltip)) {
      return premiumUpgradeTooltip;
    }

    premiumUpgradeTooltip = document.createElement('div');
    premiumUpgradeTooltip.className = 'premium-upgrade-tooltip';
    premiumUpgradeTooltip.setAttribute('role', 'tooltip');
    premiumUpgradeTooltip.setAttribute('aria-hidden', 'true');
    premiumUpgradeTooltip.innerHTML = '<span class="premium-upgrade-tooltip-label">Locked feature</span><a class="premium-upgrade-tooltip-link" href="' + PREMIUM_SETTINGS_URL + '">upgrade to premium</a>';

    premiumUpgradeTooltip.addEventListener('mouseenter', () => {
      clearPremiumUpgradeTooltipHideTimer();
    });

    premiumUpgradeTooltip.addEventListener('mouseleave', () => {
      hidePremiumUpgradeTooltip(true);
    });

    document.body.appendChild(premiumUpgradeTooltip);
    return premiumUpgradeTooltip;
  }

  function positionPremiumUpgradeTooltip(target) {
    const tooltip = ensurePremiumUpgradeTooltip();
    const targetRect = target.getBoundingClientRect();

    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');

    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const gutter = 12;
    let top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
    let left = targetRect.right + 14;

    if (left + tooltipRect.width + gutter > viewportWidth) {
      left = Math.max(gutter, targetRect.left - tooltipRect.width - 14);
    }

    if (left < gutter) {
      left = Math.max(gutter, Math.min(viewportWidth - tooltipRect.width - gutter, targetRect.left));
      top = targetRect.bottom + 10;
    }

    if (top + tooltipRect.height + gutter > viewportHeight) {
      top = Math.max(gutter, viewportHeight - tooltipRect.height - gutter);
    }

    if (top < gutter) {
      top = gutter;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function showPremiumUpgradeTooltip(target) {
    if (!target) {
      return;
    }

    clearPremiumUpgradeTooltipHideTimer();
    positionPremiumUpgradeTooltip(target);
  }

  function hidePremiumUpgradeTooltip(withDelay) {
    if (!premiumUpgradeTooltip) {
      return;
    }

    clearPremiumUpgradeTooltipHideTimer();

    const runHide = () => {
      if (!premiumUpgradeTooltip) {
        return;
      }
      premiumUpgradeTooltip.classList.remove('is-visible');
      premiumUpgradeTooltip.setAttribute('aria-hidden', 'true');
    };

    if (withDelay) {
      premiumUpgradeTooltipHideTimer = window.setTimeout(runHide, 120);
      return;
    }

    runHide();
  }

  function attachPremiumUpgradeTooltip(target) {
    if (!target || target.dataset.premiumUpgradeTooltipBound === 'true') {
      return;
    }

    target.dataset.premiumUpgradeTooltipBound = 'true';
    target.setAttribute('data-premium-upgrade', 'true');

    target.addEventListener('mouseenter', () => {
      showPremiumUpgradeTooltip(target);
    });

    target.addEventListener('mouseleave', () => {
      hidePremiumUpgradeTooltip(true);
    });

    target.addEventListener('focus', () => {
      showPremiumUpgradeTooltip(target);
    });

    target.addEventListener('blur', () => {
      hidePremiumUpgradeTooltip(true);
    });
  }

  window.attachPremiumUpgradeTooltip = attachPremiumUpgradeTooltip;

  function applyLockedActiveBuyersLink(link) {
    if (!link || link.dataset.lockedActiveBuyers === 'true') {
      return;
    }

    link.dataset.lockedActiveBuyers = 'true';
    link.classList.remove('active');
    link.classList.add('nav-link-locked');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'upgrade to premium');
    attachPremiumUpgradeTooltip(link);

    if (!link.querySelector('.nav-lock-badge')) {
      const badge = document.createElement('span');
      badge.className = 'nav-lock-badge';
      badge.innerHTML = '<svg class="nav-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 11V8a4 4 0 1 1 8 0v3"/><rect x="6" y="11" width="12" height="9" rx="2"/></svg>';
      link.appendChild(badge);
    }

    link.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  function applyLockedCampaignsLink(link) {
    if (!link || link.dataset.lockedCampaigns === 'true') {
      return;
    }

    link.dataset.lockedCampaigns = 'true';
    link.classList.remove('active');
    link.classList.add('nav-link-locked');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'upgrade to premium');
    attachPremiumUpgradeTooltip(link);

    if (!link.querySelector('.nav-lock-badge')) {
      const badge = document.createElement('span');
      badge.className = 'nav-lock-badge';
      badge.innerHTML = '<svg class="nav-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 11V8a4 4 0 1 1 8 0v3"/><rect x="6" y="11" width="12" height="9" rx="2"/></svg>';
      link.appendChild(badge);
    }

    link.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  function applyLockedAnalyticsLink(link) {
    if (!link || link.dataset.lockedAnalytics === 'true') {
      return;
    }

    link.dataset.lockedAnalytics = 'true';
    link.classList.remove('active');
    link.classList.add('nav-link-locked');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'upgrade to premium');
    attachPremiumUpgradeTooltip(link);

    if (!link.querySelector('.nav-lock-badge')) {
      const badge = document.createElement('span');
      badge.className = 'nav-lock-badge';
      badge.innerHTML = '<svg class="nav-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 11V8a4 4 0 1 1 8 0v3"/><rect x="6" y="11" width="12" height="9" rx="2"/></svg>';
      link.appendChild(badge);
    }

    link.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  async function syncAuthenticatedUser() {
    const token = getStoredAuthToken();
    if (!token) {
      return readStoredUser();
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthState();
          if (!['/', '/index.html', '/login.html'].includes(window.location.pathname)) {
            window.location.href = '/login.html';
          }
          return null;
        }
        return readStoredUser();
      }

      const data = await response.json();
      if (!data || !data.success || !data.user) {
        return readStoredUser();
      }

      const verifiedUser = normalizeKnownUser(data.user);
      const lockedUser = getVerifiedAuthUserLock();
      if (isAuthIdentityMismatch(lockedUser, verifiedUser)) {
        return forceLogoutForAuthMismatch(lockedUser, verifiedUser);
      }

      return writeStoredUser(verifiedUser, { force: true });
    } catch (error) {
      return readStoredUser();
    }
  }

  function getStoredProfile() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const name = String((user && user.name) || 'User').trim();
    const userKeys = getScopedKeys(user || {});

    try {
      const profileStore = JSON.parse(localStorage.getItem('userProfilesByUser') || '{}');
      if (profileStore && typeof profileStore === 'object') {
        for (const userKey of userKeys) {
          if (profileStore[userKey] && typeof profileStore[userKey] === 'object') {
            return profileStore[userKey];
          }
        }
      }
    } catch (error) {
      // Fall back to legacy key.
    }

    const profileStr = localStorage.getItem('userProfile');
    if (!profileStr) {
      return null;
    }

    try {
      const legacy = JSON.parse(profileStr);
      if (!legacy || typeof legacy !== 'object') {
        return null;
      }

      const legacyEmail = normalizeKnownEmail(legacy.email || '');
      const legacyName = String(legacy.name || '').trim().toLowerCase();
      const activeName = String(name || '').trim().toLowerCase();
      const activeEmails = new Set(getKnownEmailCandidates((user && user.email) || ''));

      if ((activeEmails.size > 0 && activeEmails.has(legacyEmail)) || (!activeEmails.size && legacyName && legacyName === activeName)) {
        return legacy;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
  
  // Check if user is authenticated
  function checkAuthentication() {
    const token = getStoredAuthToken();
    const currentPath = window.location.pathname;

    // Pages that don't require authentication
    const publicPages = ['/', '/index.html', '/login.html'];

    if (!token && !publicPages.includes(currentPath)) {
      // Redirect to login if not authenticated
      window.location.href = '/login.html';
    }

    const activeUser = window.getCurrentUser ? window.getCurrentUser() : null;
    const normalizedPath = String(currentPath || '').toLowerCase();
    if (isActiveBuyersPath(normalizedPath)) {
      if (isRegularUser(activeUser) || isBrokerUser(activeUser) || isTestUser(activeUser)) {
        window.location.href = '/dashboard.html';
        return;
      }
    }
    if (isAnalyticsPath(normalizedPath)) {
      if (isRegularUser(activeUser)) {
        window.location.href = '/dashboard.html';
        return;
      }
    }
    if (isCampaignsPath(normalizedPath)) {
      if (isRegularUser(activeUser)) {
        window.location.href = '/dashboard.html';
        return;
      }
    }
    if (normalizedPath.endsWith('/admin-controls.html') || normalizedPath === '/admin-controls.html') {
      if (!isAdminUser(activeUser)) {
        window.location.href = '/dashboard.html';
      }
    }
  }

  // Run check when page loads
  document.addEventListener('DOMContentLoaded', async function() {
    setAuthSyncState(true);

    try {
      sanitizeLegacyProfileMirror();
      const storedUser = readStoredUser();
      if (storedUser && !hasStoredAuthToken()) {
        syncLegacyUserProfile(storedUser);
      }
      if (applyAdminControlsAccess(storedUser) === false) {
        return;
      }

      const syncedUser = await syncAuthenticatedUser();
      checkAuthentication();

      const activeUser = syncedUser || getCurrentUser();
      const isAdmin = isAdminUser(activeUser);
      if (applyAdminControlsAccess(activeUser) === false) {
        return;
      }

      applyTestUserBrowseOnlyMode(activeUser);

      const activeBuyersLinks = document.querySelectorAll('.nav-link[href="active-buyers.html"], .nav-link[href="/active-buyers.html"]');
      activeBuyersLinks.forEach(link => {
        if (isRegularUser(activeUser)) {
          applyLockedActiveBuyersLink(link);
          return;
        }

        const listItem = link.closest('.nav-item');
        if (isBrokerUser(activeUser) || (!isAdmin && !isPremiumUser(activeUser))) {
          if (listItem) {
            listItem.remove();
          } else {
            link.remove();
          }
        }
      });

      const analyticsLinks = document.querySelectorAll('.nav-link[href="analytics.html"], .nav-link[href="/analytics.html"]');
      analyticsLinks.forEach(link => {
        if (isRegularUser(activeUser)) {
          applyLockedAnalyticsLink(link);
        }
      });

      const campaignLinks = document.querySelectorAll('.nav-link[href="campaigns.html"], .nav-link[href="/campaigns.html"]');
      campaignLinks.forEach(link => {
        if (isRegularUser(activeUser)) {
          applyLockedCampaignsLink(link);
        }
      });

      // Ensure sidebar/account logout link clears auth state.
      const logoutLinks = document.querySelectorAll('.nav-link[href="login.html"], .nav-link[href="/login.html"]');
      logoutLinks.forEach(link => {
        const label = String(link.textContent || '').toLowerCase();
        if (!label.includes('logout')) {
          return;
        }
        link.addEventListener('click', function(event) {
          event.preventDefault();
          window.logout();
        });
      });

      // Update user profile display if user info is available
      const user = getCurrentUser();
      if (user) {
        updateUserProfile(user);
      }
    } finally {
      setAuthSyncState(false);
    }
  });

  // Update user profile in sidebar/header
  function updateUserProfile(user) {
    const storedProfile = getStoredProfile();
    const resolvedUser = {
      ...user,
      ...(storedProfile || {}),
      name: (storedProfile && storedProfile.name) || user.name,
      email: (storedProfile && storedProfile.email) || user.email,
      role: user.role || 'admin'
    };
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');

    if (userNameEl) {
      userNameEl.textContent = resolvedUser.name || 'User';
    }

    if (userRoleEl) {
      userRoleEl.textContent = formatRoleLabel(resolvedUser.role);
    }

    if (userAvatarEl) {
      if (resolvedUser.avatarImage) {
        userAvatarEl.textContent = '';
        userAvatarEl.style.backgroundImage = `url(${resolvedUser.avatarImage})`;
        userAvatarEl.classList.add('avatar-image');
      } else {
        const initials = (resolvedUser.name || 'User')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        userAvatarEl.textContent = initials;
        userAvatarEl.style.backgroundImage = '';
        userAvatarEl.classList.remove('avatar-image');
      }
    }
  }

  // Get current user
  window.getCurrentUser = function() {
    return readStoredUser();
  };

  window.writeStoredUserIdentity = function(userLike) {
    return writeStoredUser(userLike);
  };

  window.clearStoredAuthState = function() {
    clearAuthState();
  };

  // Logout function
  window.logout = async function() {
    const token = getStoredAuthToken();
    if (token) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    clearAuthState();
    window.location.href = '/login.html';
  };

  // Check authentication
  window.isAuthenticated = function() {
    return Boolean(getStoredAuthToken());
  };

  // Get auth token
  window.getAuthToken = function() {
    return getStoredAuthToken();
  };

  bindAuthNavigationGuard();
})();
