const KNOWN_EMAIL_GROUPS = [
  {
    canonical: 'isaac.haro@fastbridgegroupllc.com',
    aliases: [
      'isaac.haro@fastbridgegroupllc.com',
      'isaacs.hesed@fastbridgegroup.com',
      'isaacs.hesed@gmail.com'
    ]
  },
  {
    canonical: 'steve.medina@fastbridgegroupllc.com',
    aliases: [
      'steve.medina@fastbridgegroupllc.com',
      'medinafbg@gmail.com',
      'medinastj@gmail.com'
    ]
  }
];
const KNOWN_EMAIL_ALIAS_LOOKUP = new Map();

KNOWN_EMAIL_GROUPS.forEach((group) => {
  group.aliases.forEach((alias) => {
    KNOWN_EMAIL_ALIAS_LOOKUP.set(alias, group.canonical);
  });
});

function normalizeKnownEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return KNOWN_EMAIL_ALIAS_LOOKUP.get(normalizedEmail) || normalizedEmail;
}

function readLocalJson(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

function clearStoredAuthState() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('registeredEmail');
  sessionStorage.removeItem('authToken');
}

function storedIdentityMatchesUser(userLike) {
  const normalizedVerifiedEmail = normalizeKnownEmail(userLike && userLike.email || '');
  const storedUser = readLocalJson('user');
  const storedProfile = readLocalJson('userProfile');
  const storedUserEmail = normalizeKnownEmail(storedUser && storedUser.email || '');
  const storedProfileEmail = normalizeKnownEmail(storedProfile && storedProfile.email || '');
  const hasStoredIdentity = Boolean(storedUserEmail || storedProfileEmail);

  if (!hasStoredIdentity) {
    return true;
  }

  return Boolean(
    normalizedVerifiedEmail
    && (!storedUserEmail || storedUserEmail === normalizedVerifiedEmail)
    && (!storedProfileEmail || storedProfileEmail === normalizedVerifiedEmail)
  );
}

function getStoredProfileMirror(userLike) {
  const normalizedUser = userLike && typeof userLike === 'object' ? userLike : null;
  if (!normalizedUser) {
    return null;
  }

  const candidateKeys = new Set();
  const email = String(normalizedUser.email || '').trim().toLowerCase();
  const nameKey = String(normalizedUser.name || '').trim().toLowerCase().replace(/\s+/g, '-');

  if (email) {
    candidateKeys.add(email);
  }
  if (nameKey) {
    candidateKeys.add(nameKey);
  }

  try {
    const profileStore = JSON.parse(localStorage.getItem('userProfilesByUser') || '{}');
    if (profileStore && typeof profileStore === 'object') {
      for (const key of candidateKeys) {
        if (profileStore[key] && typeof profileStore[key] === 'object') {
          return profileStore[key];
        }
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function persistAuthenticatedUser(userLike) {
  if (!userLike || typeof userLike !== 'object') {
    return;
  }

  const normalizedUser = {
    ...userLike,
    email: String(userLike.email || '').trim().toLowerCase(),
    role: String(userLike.role || '').trim().toLowerCase()
  };

  const scopedProfile = getStoredProfileMirror(normalizedUser);
  const mirroredProfile = {
    ...(scopedProfile || {}),
    name: String((scopedProfile && scopedProfile.name) || normalizedUser.name || 'User').trim(),
    email: normalizedUser.email,
    role: String(normalizedUser.role || (scopedProfile && scopedProfile.role) || '').trim(),
    avatarImage: String((scopedProfile && scopedProfile.avatarImage) || normalizedUser.avatarImage || '').trim()
  };

  localStorage.setItem('user', JSON.stringify(normalizedUser));
  localStorage.setItem('userProfile', JSON.stringify(mirroredProfile));
}

// Login handler script
document.addEventListener('DOMContentLoaded', function() {

    // Developer bypass for Isaac
    const devBypass = new URLSearchParams(window.location.search).get('devIsaac');
    if (devBypass === '1') {
      // Simulate successful login for Isaac
      const user = {
        email: 'isaac.haro@fastbridgegroupllc.com',
        name: 'Isaac',
        role: 'admin',
        id: 'dev-isaac',
      };
      localStorage.setItem('authToken', 'devIsaacToken');
      persistAuthenticatedUser(user);
      window.location.href = '/dashboard.html';
      return;
    }
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const twoFactorForm = document.getElementById('two-factor-form');
  const twoFactorBtn = document.getElementById('two-factor-btn');
  const twoFactorCancelBtn = document.getElementById('two-factor-cancel-btn');
  const twoFactorCodeInput = document.getElementById('two-factor-code');
  const twoFactorMessage = document.getElementById('two-factor-message');
  const errorDiv = document.getElementById('error-message');
  const emailInput = document.getElementById('email');
  const googleSignInBtn = document.getElementById('google-signin-btn');
  const loginVersionLabel = document.getElementById('login-version-label');
  const termsAcceptCheckbox = document.getElementById('terms-accept-checkbox');
  const termsModal = document.getElementById('terms-modal');
  const termsContinueBtn = document.getElementById('terms-continue-btn');
  const firstTermsFocusable = document.querySelector('.terms-consent-scroll');
  let pendingTwoFactorChallenge = '';

  function showLoginError(message) {
    if (!errorDiv) {
      return;
    }
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#ef4444';
    errorDiv.textContent = String(message || '');
  }

  function clearLoginError() {
    if (!errorDiv) {
      return;
    }
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }

  function setTwoFactorMode(enabled, message) {
    pendingTwoFactorChallenge = enabled ? pendingTwoFactorChallenge : '';
    if (loginForm) {
      loginForm.hidden = Boolean(enabled);
    }
    if (twoFactorForm) {
      twoFactorForm.hidden = !enabled;
    }
    if (twoFactorMessage && message) {
      twoFactorMessage.textContent = message;
      twoFactorMessage.style.color = 'var(--text-secondary)';
    }
    if (twoFactorCodeInput) {
      twoFactorCodeInput.value = '';
      if (enabled) {
        window.setTimeout(() => twoFactorCodeInput.focus(), 40);
      }
    }
  }

  function beginTwoFactorChallenge(challengeToken, message) {
    pendingTwoFactorChallenge = String(challengeToken || '').trim();
    setTwoFactorMode(true, message || 'Enter the current code from your authenticator app to finish signing in.');
    clearLoginError();
  }

  function openTermsModal() {
    if (!termsModal) {
      return;
    }

    termsModal.classList.add('is-open');
    termsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('terms-modal-open');

    if (firstTermsFocusable) {
      window.setTimeout(() => firstTermsFocusable.focus(), 40);
    }
  }

  function closeTermsModal() {
    if (!termsModal) {
      return;
    }

    termsModal.classList.remove('is-open');
    termsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('terms-modal-open');
  }

  function hasAcceptedTerms() {
    return !termsAcceptCheckbox || termsAcceptCheckbox.checked;
  }

  function syncLoginAvailability() {
    const isAccepted = hasAcceptedTerms();
    if (loginBtn) {
      loginBtn.disabled = !isAccepted;
      loginBtn.setAttribute('aria-disabled', String(!isAccepted));
    }

    if (googleSignInBtn) {
      googleSignInBtn.disabled = !isAccepted;
      googleSignInBtn.setAttribute('aria-disabled', String(!isAccepted));
      googleSignInBtn.title = isAccepted ? 'Sign in with Google' : 'Accept the Terms and Conditions first';
    }

    if (termsContinueBtn) {
      termsContinueBtn.disabled = !isAccepted;
      termsContinueBtn.setAttribute('aria-disabled', String(!isAccepted));
    }
  }

  function showTermsRequiredMessage() {
    showLoginError('You must agree to the Terms and Conditions before signing in.');
  }

  function getApiBaseOrigin() {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:3000';
    }

    return window.location.origin || 'http://localhost:3000';
  }

  async function loadBuildVersion() {
    if (!loginVersionLabel) {
      return;
    }

    try {
      const response = await fetch(`${getApiBaseOrigin()}/api/build-version`, {
        headers: {
          Accept: 'application/json'
        }
      });
      const data = await response.json();
      const version = String(data?.version || '').trim();
      if (!response.ok || !version) {
        throw new Error('Build version unavailable');
      }

      loginVersionLabel.textContent = `Version v${version}`;
    } catch (error) {
      loginVersionLabel.textContent = 'Version v1.2.8';
    }
  }

  async function startGoogleSignIn() {
    if (!googleSignInBtn) {
      return;
    }

    if (!hasAcceptedTerms()) {
      showTermsRequiredMessage();
      syncLoginAvailability();
      return;
    }

    const originalMarkup = googleSignInBtn.innerHTML;
    googleSignInBtn.disabled = true;

    clearLoginError();

    try {
      const response = await fetch(`${getApiBaseOrigin()}/api/auth/google`, {
        headers: {
          Accept: 'application/json'
        }
      });
      const data = await response.json();

      if (!response.ok || !data.configured || !data.url) {
        throw new Error(data.error || 'Google sign-in is not configured correctly.');
      }

      window.location.href = data.url;
    } catch (error) {
      if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#ef4444';
        errorDiv.textContent = String(error.message || 'Google sign-in failed to start.');
      }
      googleSignInBtn.disabled = false;
      googleSignInBtn.innerHTML = originalMarkup;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const oauthToken = params.get('token');
  const oauthError = params.get('oauth_error');
  const oauthTwoFactor = params.get('two_factor');
  const oauthChallenge = params.get('challenge');
  const oauthEmail = params.get('email');

  if (oauthError) {
    showLoginError(decodeURIComponent(oauthError));
  }

  if (oauthToken) {
    completeOauthSignIn(oauthToken, errorDiv);
    return;
  }

  if (oauthTwoFactor === '1' && oauthChallenge) {
    if (emailInput && oauthEmail) {
      emailInput.value = oauthEmail;
    }
    beginTwoFactorChallenge(oauthChallenge, 'Google sign-in needs the current code from your authenticator app to finish.');
    const url = new URL(window.location.href);
    url.searchParams.delete('two_factor');
    url.searchParams.delete('challenge');
    url.searchParams.delete('email');
    url.searchParams.delete('oauth');
    window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));
  }

  if (params.get('registered') === '1' && errorDiv) {
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#22c55e';
    errorDiv.textContent = 'Account created successfully. Please sign in.';
  }

  const registeredEmail = localStorage.getItem('registeredEmail');
  if (registeredEmail && emailInput && !emailInput.value) {
    emailInput.value = registeredEmail;
  }

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', function() {
      startGoogleSignIn();
    });
  }

  if (termsAcceptCheckbox) {
    termsAcceptCheckbox.checked = false;
    termsAcceptCheckbox.addEventListener('change', function() {
      if (errorDiv && hasAcceptedTerms() && errorDiv.textContent === 'You must agree to the Terms and Conditions before signing in.') {
        clearLoginError();
      }
      syncLoginAvailability();
    });
  }

  if (termsContinueBtn) {
    termsContinueBtn.addEventListener('click', function() {
      if (!hasAcceptedTerms()) {
        showTermsRequiredMessage();
        syncLoginAvailability();
        return;
      }

      closeTermsModal();
    });
  }

  syncLoginAvailability();
  openTermsModal();

  loadBuildVersion();

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      if (!hasAcceptedTerms()) {
        showTermsRequiredMessage();
        syncLoginAvailability();
        return;
      }

      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;

      // Clear previous errors
      clearLoginError();

      // Disable button and show loading state
      loginBtn.disabled = true;
      const originalText = loginBtn.innerHTML;
      loginBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.requiresTwoFactor && data.challengeToken) {
            beginTwoFactorChallenge(data.challengeToken, 'Enter the current code from your authenticator app to finish signing in.');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
            return;
          }

          // Store token in localStorage
          localStorage.setItem('authToken', data.token);
          persistAuthenticatedUser(data.user);
          localStorage.removeItem('registeredEmail');

          // Redirect to dashboard
          window.location.href = '/dashboard.html';
        } else {
          // Show error message
          showLoginError(data.error || 'Login failed');
          loginBtn.disabled = false;
          loginBtn.innerHTML = originalText;
        }
      } catch (error) {
        console.error('Login error:', error);
        const isFileProtocol = window.location.protocol === 'file:';
        const loginPageUrl = `${window.location.origin || 'http://localhost:3000'}/login.html`;
        if (isFileProtocol) {
          errorDiv.textContent = `Connection error. Open this app through ${loginPageUrl} (not as a local file).`;
        } else {
          errorDiv.textContent = `Connection error. Start the server with "npm start" and then open ${loginPageUrl}.`;
        }
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
      }
    });
  }

  if (twoFactorForm) {
    twoFactorForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      const code = String((twoFactorCodeInput && twoFactorCodeInput.value) || '').trim();
      if (!pendingTwoFactorChallenge || !code) {
        if (twoFactorMessage) {
          twoFactorMessage.textContent = 'Enter the current 6-digit code from your authenticator app.';
          twoFactorMessage.style.color = '#ef4444';
        }
        return;
      }

      const originalText = twoFactorBtn ? twoFactorBtn.innerHTML : '';
      if (twoFactorBtn) {
        twoFactorBtn.disabled = true;
        twoFactorBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';
      }

      try {
        const response = await fetch('/api/login/2fa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            challengeToken: pendingTwoFactorChallenge,
            code
          })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Authenticator code verification failed.');
        }

  localStorage.setItem('authToken', data.token);
  persistAuthenticatedUser(data.user);
        localStorage.removeItem('registeredEmail');
        window.location.href = '/dashboard.html';
      } catch (error) {
        if (twoFactorMessage) {
          twoFactorMessage.textContent = error.message || 'Authenticator code verification failed.';
          twoFactorMessage.style.color = '#ef4444';
        }
        if (twoFactorBtn) {
          twoFactorBtn.disabled = false;
          twoFactorBtn.innerHTML = originalText;
        }
      }
    });
  }

  if (twoFactorCancelBtn) {
    twoFactorCancelBtn.addEventListener('click', function() {
      pendingTwoFactorChallenge = '';
      setTwoFactorMode(false);
      if (twoFactorMessage) {
        twoFactorMessage.textContent = 'Enter the current code from your authenticator app to finish signing in.';
        twoFactorMessage.style.color = 'var(--text-secondary)';
      }
    });
  }

  // Add spin animation for loading state
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Check if already logged in
  void checkAuthStatus();
});

async function completeOauthSignIn(token, errorDiv) {
  try {
    localStorage.setItem('authToken', token);

    const verifyResponse = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyData.success || !verifyData.user) {
      throw new Error(verifyData.error || 'OAuth login could not be verified');
    }

    persistAuthenticatedUser(verifyData.user);
    localStorage.removeItem('registeredEmail');

    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('oauth_error');
    window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));

    window.location.href = '/dashboard.html';
  } catch (error) {
    localStorage.removeItem('authToken');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.style.color = '#ef4444';
      errorDiv.textContent = error.message || 'OAuth login failed';
    }
  }
}

// Check authentication status
async function checkAuthStatus() {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const bypassEnabled = localStorage.getItem('bypassAuth') === 'true';
  if (bypassEnabled && window.location.pathname === '/login.html') {
    window.location.href = '/dashboard.html';
    return;
  }

  if (!token || window.location.pathname !== '/login.html') {
    return;
  }

  try {
    const verifyResponse = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const verifyData = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || !verifyData.success || !verifyData.user) {
      clearStoredAuthState();
      return;
    }

    if (!storedIdentityMatchesUser(verifyData.user)) {
      clearStoredAuthState();
      if (typeof showLoginError === 'function') {
        showLoginError('Saved session belonged to a different account, so automatic sign-in was canceled. Please sign in again.');
      }
      return;
    }

    persistAuthenticatedUser(verifyData.user);
    window.location.href = '/dashboard.html';
  } catch (error) {
    clearStoredAuthState();
  }
}

// Logout function (can be called from any page)
async function logout() {
  const token = String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
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
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('registeredEmail');
  localStorage.removeItem('bypassAuth');
  localStorage.removeItem('bypassProfile');
  sessionStorage.removeItem('authToken');
  window.location.href = '/login.html';
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
function isAuthenticated() {
  return Boolean(String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim());
}
