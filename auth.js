// Authentication middleware script
// Include this in all pages that require authentication

(function() {
  const CANONICAL_ISAAC_EMAIL = 'isaac.haro@fastbridgegroupllc.com';
  const ISAAC_EMAIL_ALIASES = [
    CANONICAL_ISAAC_EMAIL,
    'isaacs.hesed@fastbridgegroup.com',
    'isaacs.hesed@gmail.com'
  ];

  function normalizeKnownEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return ISAAC_EMAIL_ALIASES.includes(normalizedEmail) ? CANONICAL_ISAAC_EMAIL : normalizedEmail;
  }

  function getKnownEmailCandidates(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return [];
    }
    return ISAAC_EMAIL_ALIASES.includes(normalizedEmail)
      ? ISAAC_EMAIL_ALIASES.slice()
      : [normalizedEmail];
  }

  function normalizeKnownUser(userLike) {
    if (!userLike || typeof userLike !== 'object') {
      return null;
    }

    const normalizedEmail = normalizeKnownEmail(userLike.email || '');
    const isIsaacAccount = ISAAC_EMAIL_ALIASES.includes(String(userLike.email || '').trim().toLowerCase())
      || normalizedEmail === CANONICAL_ISAAC_EMAIL;

    return {
      ...userLike,
      email: normalizedEmail || String(userLike.email || '').trim().toLowerCase(),
      role: isIsaacAccount ? 'admin' : String(userLike.role || '').trim().toLowerCase()
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
    if (normalizedPath.endsWith('/admin-controls.html') || normalizedPath === '/admin-controls.html') {
      if (!activeUser || String(activeUser.role || '').toLowerCase() !== 'admin') {
        window.location.href = '/dashboard.html';
      }
    }
  }

  // Run check when page loads
  document.addEventListener('DOMContentLoaded', async function() {
    const syncedUser = await syncAuthenticatedUser();
    checkAuthentication();

    const activeUser = syncedUser || getCurrentUser();

    const adminLinks = document.querySelectorAll('.nav-link[href="admin-controls.html"], .nav-link[href="/admin-controls.html"]');
    adminLinks.forEach(link => {
      const isAdmin = activeUser && String(activeUser.role || '').toLowerCase() === 'admin';
      const listItem = link.closest('.nav-item');
      if (!isAdmin) {
        if (listItem) {
          listItem.remove();
        } else {
          link.remove();
        }
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
      role: user.role || 'Administrator'
    };
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');

    if (userNameEl) {
      userNameEl.textContent = resolvedUser.name || 'User';
    }

    if (userRoleEl) {
      userRoleEl.textContent = resolvedUser.role === 'admin' ? 'Administrator' : resolvedUser.role || 'User';
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
