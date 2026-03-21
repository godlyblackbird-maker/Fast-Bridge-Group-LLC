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
    try {
      return normalizeKnownUser(JSON.parse(localStorage.getItem('user') || 'null'));
    } catch (error) {
      return null;
    }
  }

  function writeStoredUser(userLike) {
    const normalizedUser = normalizeKnownUser(userLike);
    if (!normalizedUser) {
      return null;
    }
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    return normalizedUser;
  }

  function clearAuthState() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('registeredEmail');
    localStorage.removeItem('bypassAuth');
    localStorage.removeItem('bypassProfile');
  }

  function isAdminUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === 'admin');
  }

  function isRegularUser(userLike) {
    return !!(userLike && String(userLike.role || '').trim().toLowerCase() === 'user');
  }

  function formatRoleLabel(roleValue) {
    const normalizedRole = String(roleValue || '').trim().toLowerCase();
    if (normalizedRole === 'admin') {
      return 'Administrator';
    }
    if (normalizedRole === 'broker') {
      return 'Broker';
    }
    if (normalizedRole === 'user') {
      return 'User';
    }
    return normalizedRole || 'User';
  }

  function isActiveBuyersPath(pathname) {
    const normalizedPath = String(pathname || '').trim().toLowerCase();
    return normalizedPath === '/active-buyers.html' || normalizedPath.endsWith('/active-buyers.html');
  }

  function isCampaignsPath(pathname) {
    const normalizedPath = String(pathname || '').trim().toLowerCase();
    return normalizedPath === '/campaigns.html' || normalizedPath.endsWith('/campaigns.html');
  }

  function applyLockedActiveBuyersLink(link) {
    if (!link || link.dataset.lockedActiveBuyers === 'true') {
      return;
    }

    link.dataset.lockedActiveBuyers = 'true';
    link.classList.remove('active');
    link.classList.add('nav-link-locked');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'Active Buyers is restricted to administrators.');

    if (!link.querySelector('.nav-lock-badge')) {
      const badge = document.createElement('span');
      badge.className = 'nav-lock-badge';
      badge.innerHTML = '<svg class="nav-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 11V8a4 4 0 1 1 8 0v3"/><rect x="6" y="11" width="12" height="9" rx="2"/></svg><span>Locked</span>';
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
    link.setAttribute('title', 'Campaigns is locked for User accounts.');

    if (!link.querySelector('.nav-lock-badge')) {
      const badge = document.createElement('span');
      badge.className = 'nav-lock-badge';
      badge.innerHTML = '<svg class="nav-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 11V8a4 4 0 1 1 8 0v3"/><rect x="6" y="11" width="12" height="9" rx="2"/></svg><span>Locked</span>';
      link.appendChild(badge);
    }

    link.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  async function syncAuthenticatedUser() {
    const token = localStorage.getItem('authToken');
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

      return writeStoredUser(data.user);
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
    const token = localStorage.getItem('authToken');
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
      if (!isAdminUser(activeUser)) {
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
    const syncedUser = await syncAuthenticatedUser();
    checkAuthentication();

    const activeUser = syncedUser || getCurrentUser();
    const isAdmin = isAdminUser(activeUser);

    const adminLinks = document.querySelectorAll('.nav-link[href="admin-controls.html"], .nav-link[href="/admin-controls.html"]');
    adminLinks.forEach(link => {
      const listItem = link.closest('.nav-item');
      if (!isAdmin) {
        if (listItem) {
          listItem.remove();
        } else {
          link.remove();
        }
      }
    });

    const activeBuyersLinks = document.querySelectorAll('.nav-link[href="active-buyers.html"], .nav-link[href="/active-buyers.html"]');
    activeBuyersLinks.forEach(link => {
      const listItem = link.closest('.nav-item');
      if (!isAdmin) {
        if (listItem) {
          listItem.remove();
        } else {
          link.remove();
        }
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

  // Logout function
  window.logout = function() {
    clearAuthState();
    window.location.href = '/login.html';
  };

  // Check authentication
  window.isAuthenticated = function() {
    return localStorage.getItem('authToken') !== null;
  };

  // Get auth token
  window.getAuthToken = function() {
    return localStorage.getItem('authToken');
  };
})();
