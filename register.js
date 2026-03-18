document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  const registerBtn = document.getElementById('register-btn');
  const errorDiv = document.getElementById('register-error-message');

  if (!registerForm || !registerBtn || !errorDiv) {
    return;
  }

  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('register-terms').checked;

    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    if (!name || !email || !password || !confirmPassword) {
      errorDiv.textContent = 'Please fill out all fields.';
      errorDiv.style.display = 'block';
      return;
    }

    if (!termsAccepted) {
      errorDiv.textContent = 'You must agree to the Terms & Conditions.';
      errorDiv.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      errorDiv.textContent = 'Passwords do not match.';
      errorDiv.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorDiv.textContent = 'Password must be at least 6 characters.';
      errorDiv.style.display = 'block';
      return;
    }

    registerBtn.disabled = true;
    const originalText = registerBtn.innerHTML;
    registerBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('registeredEmail', email);
        window.location.href = '/login.html?registered=1';
        return;
      }

      errorDiv.textContent = data.error || 'Unable to create account.';
      errorDiv.style.display = 'block';
    } catch (error) {
      console.error('Register error:', error);
      errorDiv.textContent = 'Connection error. Please try again.';
      errorDiv.style.display = 'block';
    } finally {
      registerBtn.disabled = false;
      registerBtn.innerHTML = originalText;
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
});
