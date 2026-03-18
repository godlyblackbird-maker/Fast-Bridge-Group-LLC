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
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/dashboard.html';
      return;
    }
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const errorDiv = document.getElementById('error-message');
  const emailInput = document.getElementById('email');
  const googleSignInBtn = document.getElementById('google-signin-btn');
  const loginVersionLabel = document.getElementById('login-version-label');

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
      loginVersionLabel.textContent = 'Version v1.1.6';
    }
  }

  async function startGoogleSignIn() {
    if (!googleSignInBtn) {
      return;
    }

    const originalMarkup = googleSignInBtn.innerHTML;
    googleSignInBtn.disabled = true;

    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }

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

  if (oauthError && errorDiv) {
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#ef4444';
    errorDiv.textContent = decodeURIComponent(oauthError);
  }

  if (oauthToken) {
    completeOauthSignIn(oauthToken, errorDiv);
    return;
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

  loadBuildVersion();

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;

      // Clear previous errors
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';

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
          // Store token in localStorage
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.removeItem('registeredEmail');

          // Redirect to dashboard
          window.location.href = '/dashboard.html';
        } else {
          // Show error message
          errorDiv.textContent = data.error || 'Login failed';
          errorDiv.style.display = 'block';
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
  checkAuthStatus();
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

    localStorage.setItem('user', JSON.stringify(verifyData.user));
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
function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  const bypassEnabled = localStorage.getItem('bypassAuth') === 'true';
  if ((token || bypassEnabled) && window.location.pathname === '/login.html') {
    // If user is logged in and on login page, redirect to dashboard
    window.location.href = '/dashboard.html';
  }
}

// Logout function (can be called from any page)
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('registeredEmail');
  localStorage.removeItem('bypassAuth');
  localStorage.removeItem('bypassProfile');
  window.location.href = '/login.html';
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null;
}
