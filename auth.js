// Authentication middleware script
// Include this in all pages that require authentication

(function() {
  function getStoredProfile() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const email = String((user && user.email) || '').trim().toLowerCase();
    const name = String((user && user.name) || 'User').trim();
    const userKey = email || name.toLowerCase().replace(/\s+/g, '-') || 'default-user';

    try {
      const profileStore = JSON.parse(localStorage.getItem('userProfilesByUser') || '{}');
      if (profileStore && profileStore[userKey] && typeof profileStore[userKey] === 'object') {
        return profileStore[userKey];
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

      const legacyEmail = String(legacy.email || '').trim().toLowerCase();
      const legacyName = String(legacy.name || '').trim().toLowerCase();
      const activeName = String(name || '').trim().toLowerCase();

      if ((email && legacyEmail === email) || (!email && legacyName && legacyName === activeName)) {
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
  document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();

    const activeUser = getCurrentUser();

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
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  // Logout function
  window.logout = function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('registeredEmail');
    localStorage.removeItem('bypassAuth');
    localStorage.removeItem('bypassProfile');
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
