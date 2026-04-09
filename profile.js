// Profile Modal Handler

(function() {
  const USER_PROFILE_STORE_KEY = 'userProfilesByUser';
  const SMTP_SETTINGS_STORE_KEY = 'smtpSettingsByUser';
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

  function getKnownEmailGroup(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const canonicalEmail = KNOWN_EMAIL_ALIAS_LOOKUP.get(normalizedEmail) || normalizedEmail;
    return KNOWN_EMAIL_GROUPS.find((group) => group.canonical === canonicalEmail) || null;
  }

  function normalizeKnownEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return KNOWN_EMAIL_ALIAS_LOOKUP.get(normalizedEmail) || normalizedEmail;
  }

  function getScopedEmailKeys(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return [];
    }
    const group = getKnownEmailGroup(normalizedEmail);
    return group ? group.aliases.slice() : [normalizedEmail];
  }

  function getActiveUserKeys() {
    let user = null;
    if (typeof getCurrentUser === 'function') {
      user = getCurrentUser();
    }

    let fallbackUser = {};
    try {
      fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      fallbackUser = {};
    }

    const keys = new Set(getScopedEmailKeys((user && user.email) || fallbackUser.email || ''));
    const name = String((user && user.name) || fallbackUser.name || 'User').trim().toLowerCase();
    if (name) {
      keys.add(name.replace(/\s+/g, '-'));
    }

    return Array.from(keys).filter(Boolean);
  }

  function getActiveUserKey() {
    return getActiveUserKeys()[0] || 'default-user';
  }

  function getActiveAccountIdentity() {
    let activeUser = null;
    if (typeof getCurrentUser === 'function') {
      activeUser = getCurrentUser();
    }

    let fallbackUser = {};
    try {
      fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      fallbackUser = {};
    }

    const email = normalizeKnownEmail((activeUser && activeUser.email) || fallbackUser.email || '');
    const name = String((activeUser && activeUser.name) || fallbackUser.name || 'User').trim();
    const role = String((activeUser && activeUser.role) || fallbackUser.role || '').trim();

    return {
      email,
      name,
      role
    };
  }

  function getAuthToken() {
    return String(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '').trim();
  }

  function buildProfileAvatarImage(avatarUploadId) {
    const normalizedAvatarUploadId = String(avatarUploadId || '').trim();
    if (!normalizedAvatarUploadId) {
      return '';
    }

    return `/api/profile/avatar/content/${encodeURIComponent(normalizedAvatarUploadId)}`;
  }

  function resolveProfileAvatarFields(primarySource, fallbackSource = null) {
    const primary = primarySource && typeof primarySource === 'object' ? primarySource : {};
    const fallback = fallbackSource && typeof fallbackSource === 'object' ? fallbackSource : {};
    const avatarUploadId = String(primary.avatarUploadId || fallback.avatarUploadId || '').trim();

    if (avatarUploadId) {
      return {
        avatarUploadId,
        avatarImage: buildProfileAvatarImage(avatarUploadId)
      };
    }

    return {
      avatarUploadId: '',
      avatarImage: String(primary.avatarImage || fallback.avatarImage || '').trim()
    };
  }

  function dataUrlToBlob(dataUrl) {
    const normalizedDataUrl = String(dataUrl || '').trim();
    const match = normalizedDataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/i);
    if (!match) {
      throw new Error('The selected profile image could not be processed.');
    }

    const mimeType = String(match[1] || 'application/octet-stream').trim() || 'application/octet-stream';
    const payload = match[2] || '';
    const binary = window.atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
  }

  async function requestProfileAvatar(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Sign in again to update your profile image.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(payload && payload.error || 'The profile image request failed.'));
    }

    return payload;
  }

  function buildScopedProfileData(profileData) {
    const identity = getActiveAccountIdentity();
    const avatarState = resolveProfileAvatarFields(profileData);
    return {
      ...(profileData && typeof profileData === 'object' ? profileData : {}),
      name: String((profileData && profileData.name) || identity.name || 'User').trim(),
      email: identity.email || normalizeKnownEmail(profileData && profileData.email || ''),
      role: String(identity.role || (profileData && profileData.role) || '').trim(),
      avatarUploadId: avatarState.avatarUploadId,
      avatarImage: avatarState.avatarImage
    };
  }

  function getProfileStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USER_PROFILE_STORE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function getSmtpSettingsStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SMTP_SETTINGS_STORE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function setStoredProfileData(profileData) {
    const nextProfile = buildScopedProfileData(profileData);
    const keys = getActiveUserKeys();
    const store = getProfileStore();
    keys.forEach((key) => {
      store[key] = nextProfile;
    });
    localStorage.setItem(USER_PROFILE_STORE_KEY, JSON.stringify(store));
    localStorage.setItem('userProfile', JSON.stringify(nextProfile));
  }

  function persistCurrentUserIdentity(userLike) {
    if (!userLike || typeof userLike !== 'object') {
      return null;
    }

    if (typeof window.writeStoredUserIdentity === 'function') {
      return window.writeStoredUserIdentity(userLike);
    }

    const normalizedUser = {
      ...userLike,
      email: normalizeKnownEmail(userLike.email || ''),
      role: String(userLike.role || '').trim().toLowerCase()
    };
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    return normalizedUser;
  }

  function setStoredSmtpSettings(settings) {
    const normalizedSettings = {
      smtpUser: String(settings?.smtpUser || '').trim(),
      hasPassword: Boolean(settings?.hasPassword),
      pendingRequest: settings?.pendingRequest || null,
      smtpSignature: String(settings?.smtpSignature || '').trim()
    };
    const keys = getActiveUserKeys();
    const store = getSmtpSettingsStore();
    keys.forEach((key) => {
      store[key] = normalizedSettings;
    });
    localStorage.setItem(SMTP_SETTINGS_STORE_KEY, JSON.stringify(store));
    localStorage.setItem('smtpSettings', JSON.stringify(normalizedSettings));
  }

  function getStoredProfileData() {
    const keys = getActiveUserKeys();
    const store = getProfileStore();
    for (const key of keys) {
      const scoped = store[key];
      if (scoped && typeof scoped === 'object') {
        return scoped;
      }
    }

    try {
      const legacy = JSON.parse(localStorage.getItem('userProfile') || '{}');
      if (!legacy || typeof legacy !== 'object') {
        return {};
      }

      let fallbackUser = {};
      try {
        fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
      } catch (error) {
        fallbackUser = {};
      }

      const activeEmails = new Set(getScopedEmailKeys(fallbackUser.email || ''));
      const activeName = String(fallbackUser.name || '').trim().toLowerCase();
      const legacyEmail = normalizeKnownEmail(legacy.email || '');
      const legacyName = String(legacy.name || '').trim().toLowerCase();

      if ((activeEmails.size > 0 && activeEmails.has(legacyEmail)) || (!activeEmails.size && legacyName && legacyName === activeName)) {
        return legacy;
      }

      return {};
    } catch (error) {
      return {};
    }
  }

  function getInitials(name) {
    return (name || 'User')
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  }

  function getResolvedProfileData() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const stored = getStoredProfileData();
    const activeEmail = normalizeKnownEmail((user && user.email) || '');
    const storedEmail = normalizeKnownEmail(stored.email || '');
    const resolvedEmail = activeEmail || storedEmail;
    const avatarState = resolveProfileAvatarFields(stored, user);
    return {
      name: stored.name || (user && user.name) || 'User',
      email: resolvedEmail,
      phone: stored.phone || '',
      company: stored.company || '',
      address: stored.address || '',
      city: stored.city || '',
      state: stored.state || '',
      zip: stored.zip || '',
      country: stored.country || '',
      jobTitle: stored.jobTitle || '',
      bio: stored.bio || '',
      social: stored.social || '',
      avatarUploadId: avatarState.avatarUploadId,
      avatarImage: avatarState.avatarImage,
      role: (user && user.role) || 'Administrator'
    };
  }

  function ensureProfileModal() {
  let modal = document.getElementById('profile-modal');

  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `
  <div id="profile-modal" class="profile-modal" style="display: none;">
    <div class="profile-modal-overlay"></div>
    <div class="profile-modal-content">
      <div class="profile-modal-header">
        <h2>My Profile</h2>
        <button id="close-profile-modal" class="profile-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="profile-modal-body">
        <div class="profile-avatar-section">
          <div class="profile-avatar-large" id="profile-avatar-large">IH</div>
          <div class="profile-avatar-actions">
            <button id="edit-avatar-btn" class="avatar-btn" type="button">Change Image</button>
            <button id="remove-avatar-btn" class="avatar-btn avatar-btn-secondary" type="button" disabled>Remove Image</button>
            <input id="profile-avatar-input" type="file" accept="image/*" class="avatar-file-input">
          </div>
        </div>

        <form id="profile-form" class="profile-form">
          <div class="form-section">
            <h3>Personal Information</h3>
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="profile-name" class="form-input" placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="profile-email" class="form-input" placeholder="Enter your email">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" id="profile-phone" class="form-input" placeholder="Enter your phone number">
            </div>
            <div class="form-group">
              <label>Company/Organization</label>
              <input type="text" id="profile-company" class="form-input" placeholder="Enter your company">
            </div>
          </div>

          <div class="form-section">
            <h3>Contact Information</h3>
            <div class="form-group">
              <label>Address</label>
              <input type="text" id="profile-address" class="form-input" placeholder="Enter your address">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input type="text" id="profile-city" class="form-input" placeholder="City">
              </div>
              <div class="form-group">
                <label>State/Province</label>
                <input type="text" id="profile-state" class="form-input" placeholder="State">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Zip/Postal Code</label>
                <input type="text" id="profile-zip" class="form-input" placeholder="Zip Code">
              </div>
              <div class="form-group">
                <label>Country</label>
                <input type="text" id="profile-country" class="form-input" placeholder="Country">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Additional Information</h3>
            <div class="form-group">
              <label>Job Title</label>
              <input type="text" id="profile-job-title" class="form-input" placeholder="Enter your job title">
            </div>
            <div class="form-group">
              <label>Bio</label>
              <textarea id="profile-bio" class="form-input" placeholder="Tell us about yourself" style="resize: vertical; min-height: 100px;"></textarea>
            </div>
            <div class="form-group">
              <label>Social Media (Optional)</label>
              <input type="text" id="profile-social" class="form-input" placeholder="e.g., LinkedIn, Twitter profile URLs">
            </div>
          </div>

          <div class="profile-modal-actions">
            <button type="button" id="cancel-profile" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>`);
    modal = document.getElementById('profile-modal');
  }

  return modal;
  }

  const profileModal = ensureProfileModal();
  const profileButton = document.getElementById('user-profile-btn') || document.querySelector('.user-profile');
  const closeButton = document.getElementById('close-profile-modal');
  const cancelButton = document.getElementById('cancel-profile');
  const profileForm = document.getElementById('profile-form');
  const profileOverlay = document.querySelector('.profile-modal-overlay');
  const editAvatarBtn = document.getElementById('edit-avatar-btn');
  let removeAvatarBtn = document.getElementById('remove-avatar-btn');

  let avatarInput = document.getElementById('profile-avatar-input');
  if (!avatarInput) {
    const avatarActions = document.querySelector('.profile-avatar-actions');
    if (avatarActions) {
      if (!removeAvatarBtn) {
        avatarActions.insertAdjacentHTML('beforeend', '<button id="remove-avatar-btn" class="avatar-btn avatar-btn-secondary" type="button" disabled>Remove Image</button>');
        removeAvatarBtn = document.getElementById('remove-avatar-btn');
      }
      avatarActions.insertAdjacentHTML('beforeend', '<input id="profile-avatar-input" type="file" accept="image/*" class="avatar-file-input">');
      avatarInput = document.getElementById('profile-avatar-input');
    }
  }

  function updateRemoveAvatarButtonState(profileData) {
    if (!removeAvatarBtn) {
      return;
    }

    const hasAvatarImage = Boolean((profileData && profileData.avatarImage) || getResolvedProfileData().avatarImage);
    removeAvatarBtn.disabled = !hasAvatarImage;
    removeAvatarBtn.hidden = !hasAvatarImage;
  }

  let avatarAdjuster = null;
  let avatarCropImage = null;
  let avatarZoomRange = null;
  let avatarXRange = null;
  let avatarYRange = null;
  let avatarApplyBtn = null;
  let avatarCancelBtn = null;
  const avatarAdjustState = {
    source: '',
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  };

  function updateAvatarAdjustPreview() {
    if (!avatarCropImage) {
      return;
    }

    avatarCropImage.style.transform = `translate(calc(-50% + ${avatarAdjustState.offsetX}px), calc(-50% + ${avatarAdjustState.offsetY}px)) scale(${avatarAdjustState.zoom})`;
  }

  function renderAdjustedAvatarDataUrl() {
    if (!avatarCropImage || !avatarCropImage.naturalWidth || !avatarCropImage.naturalHeight) {
      return '';
    }

    const outputSize = 320;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext('2d');
    if (!context) {
      return '';
    }

    const naturalWidth = avatarCropImage.naturalWidth;
    const naturalHeight = avatarCropImage.naturalHeight;
    const baseScale = Math.min(outputSize / naturalWidth, outputSize / naturalHeight);
    const scale = baseScale * avatarAdjustState.zoom;
    const drawWidth = naturalWidth * scale;
    const drawHeight = naturalHeight * scale;
    const drawX = (outputSize - drawWidth) / 2 + avatarAdjustState.offsetX;
    const drawY = (outputSize - drawHeight) / 2 + avatarAdjustState.offsetY;

    context.clearRect(0, 0, outputSize, outputSize);
    context.drawImage(avatarCropImage, drawX, drawY, drawWidth, drawHeight);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  function closeAvatarAdjuster(resetFileInput = true) {
    if (!avatarAdjuster) {
      return;
    }

    avatarAdjuster.hidden = true;
    avatarAdjustState.source = '';
    avatarAdjustState.zoom = 1;
    avatarAdjustState.offsetX = 0;
    avatarAdjustState.offsetY = 0;

    if (avatarCropImage) {
      avatarCropImage.removeAttribute('src');
      avatarCropImage.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    if (avatarZoomRange) avatarZoomRange.value = '1';
    if (avatarXRange) avatarXRange.value = '0';
    if (avatarYRange) avatarYRange.value = '0';

    if (resetFileInput && avatarInput) {
      avatarInput.value = '';
    }
  }

  function restoreCurrentAvatarDisplay() {
    const currentProfile = getResolvedProfileData();
    updateSidebarProfile(currentProfile);
    updateRemoveAvatarButtonState(currentProfile);
  }

  function handleAvatarSelectionCanceled() {
    closeAvatarAdjuster(true);
    restoreCurrentAvatarDisplay();
  }

  function ensureAvatarAdjusterUI() {
    if (avatarAdjuster) {
      return;
    }

    const avatarSection = document.querySelector('.profile-avatar-section');
    if (!avatarSection) {
      return;
    }

    avatarSection.insertAdjacentHTML('beforeend', `
      <div id="avatar-adjuster" class="avatar-adjuster" hidden>
        <div class="avatar-crop-frame">
          <img id="avatar-crop-image" alt="Adjust profile image preview">
        </div>
        <div class="avatar-adjust-controls">
          <label>Zoom
            <input id="avatar-zoom-range" type="range" min="0.25" max="3.2" step="0.01" value="1">
          </label>
          <label>Horizontal
            <input id="avatar-x-range" type="range" min="-180" max="180" step="1" value="0">
          </label>
          <label>Vertical
            <input id="avatar-y-range" type="range" min="-180" max="180" step="1" value="0">
          </label>
        </div>
        <div class="avatar-adjust-actions">
          <button id="avatar-apply-btn" type="button" class="avatar-btn">Set Image</button>
          <button id="avatar-cancel-btn" type="button" class="avatar-btn avatar-btn-secondary">Cancel</button>
        </div>
      </div>
    `);

    avatarAdjuster = document.getElementById('avatar-adjuster');
    avatarCropImage = document.getElementById('avatar-crop-image');
    avatarZoomRange = document.getElementById('avatar-zoom-range');
    avatarXRange = document.getElementById('avatar-x-range');
    avatarYRange = document.getElementById('avatar-y-range');
    avatarApplyBtn = document.getElementById('avatar-apply-btn');
    avatarCancelBtn = document.getElementById('avatar-cancel-btn');

    if (avatarCropImage) {
      avatarCropImage.addEventListener('load', updateAvatarAdjustPreview);
    }

    if (avatarZoomRange) {
      avatarZoomRange.addEventListener('input', function(event) {
        avatarAdjustState.zoom = Number(event.target.value) || 1;
        updateAvatarAdjustPreview();
      });
    }

    if (avatarXRange) {
      avatarXRange.addEventListener('input', function(event) {
        avatarAdjustState.offsetX = Number(event.target.value) || 0;
        updateAvatarAdjustPreview();
      });
    }

    if (avatarYRange) {
      avatarYRange.addEventListener('input', function(event) {
        avatarAdjustState.offsetY = Number(event.target.value) || 0;
        updateAvatarAdjustPreview();
      });
    }

    if (avatarApplyBtn) {
      avatarApplyBtn.addEventListener('click', async function() {
        const finalImage = renderAdjustedAvatarDataUrl();
        if (!finalImage) {
          showNotification('Could not process the selected image. Please try again.', 'info');
          return;
        }

        try {
          await saveAvatarImage(finalImage);
          showNotification('Profile image updated successfully!', 'success');
          closeAvatarAdjuster(true);
        } catch (error) {
          showNotification(error.message || 'Could not update the selected image.', 'error');
        }
      });
    }

    if (avatarCancelBtn) {
      avatarCancelBtn.addEventListener('click', function() {
        handleAvatarSelectionCanceled();
      });
    }
  }

  function openAvatarAdjuster(imageDataUrl) {
    ensureAvatarAdjusterUI();
    if (!avatarAdjuster || !avatarCropImage) {
      return;
    }

    avatarAdjustState.source = imageDataUrl;
    avatarAdjustState.zoom = 1;
    avatarAdjustState.offsetX = 0;
    avatarAdjustState.offsetY = 0;

    if (avatarZoomRange) avatarZoomRange.value = '1';
    if (avatarXRange) avatarXRange.value = '0';
    if (avatarYRange) avatarYRange.value = '0';

    avatarCropImage.src = imageDataUrl;
    avatarAdjuster.hidden = false;
    updateAvatarAdjustPreview();
  }

  // Open profile modal
  if (profileButton) {
    profileButton.addEventListener('click', function() {
      profileModal.style.display = 'flex';
      loadProfileData();
      document.body.style.overflow = 'hidden';
    });
  }

  // Close profile modal
  function closeModal() {
    closeAvatarAdjuster(true);
    restoreCurrentAvatarDisplay();
    profileModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  }

  if (profileOverlay) {
    profileOverlay.addEventListener('click', closeModal);
  }

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && profileModal.style.display === 'flex') {
      closeModal();
    }
  });

  // Load profile data from localStorage
  function loadProfileData() {
    const profileData = getStoredProfileData();
    const user = getCurrentUser();
    const accountIdentity = getActiveAccountIdentity();

    if (profileData && Object.keys(profileData).length > 0) {
      const data = profileData;
      document.getElementById('profile-name').value = data.name || '';
      document.getElementById('profile-email').value = accountIdentity.email || data.email || '';
      document.getElementById('profile-phone').value = data.phone || '';
      document.getElementById('profile-company').value = data.company || '';
      document.getElementById('profile-address').value = data.address || '';
      document.getElementById('profile-city').value = data.city || '';
      document.getElementById('profile-state').value = data.state || '';
      document.getElementById('profile-zip').value = data.zip || '';
      document.getElementById('profile-country').value = data.country || '';
      document.getElementById('profile-job-title').value = data.jobTitle || '';
      document.getElementById('profile-bio').value = data.bio || '';
      document.getElementById('profile-social').value = data.social || '';
      updateSidebarProfile(data);
    } else if (user) {
      // Pre-fill with current user data
      document.getElementById('profile-name').value = user.name || '';
      document.getElementById('profile-email').value = accountIdentity.email || user.email || '';
      updateSidebarProfile(user);
    }

    const profileEmailInput = document.getElementById('profile-email');
    if (profileEmailInput) {
      profileEmailInput.readOnly = true;
      profileEmailInput.setAttribute('aria-readonly', 'true');
      profileEmailInput.title = 'Account email comes from the signed-in account.';
    }

    syncSettingsProfileSection();
    updateRemoveAvatarButtonState(getResolvedProfileData());
  }

  // Save profile data
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const existingProfile = getStoredProfileData();
      const accountIdentity = getActiveAccountIdentity();
      const profileData = {
        name: document.getElementById('profile-name').value,
        email: accountIdentity.email || existingProfile.email || '',
        phone: document.getElementById('profile-phone').value,
        company: document.getElementById('profile-company').value,
        address: document.getElementById('profile-address').value,
        city: document.getElementById('profile-city').value,
        state: document.getElementById('profile-state').value,
        zip: document.getElementById('profile-zip').value,
        country: document.getElementById('profile-country').value,
        jobTitle: document.getElementById('profile-job-title').value,
        bio: document.getElementById('profile-bio').value,
        social: document.getElementById('profile-social').value,
        avatarUploadId: existingProfile.avatarUploadId || '',
        avatarImage: existingProfile.avatarImage || '',
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage
      setStoredProfileData(profileData);

      // Update user info in localStorage
      const user = getCurrentUser();
      if (user) {
        user.name = profileData.name;
        user.email = profileData.email;
        user.avatarImage = profileData.avatarImage;
        persistCurrentUserIdentity(user);
      }

      // Update sidebar display
      updateSidebarProfile(profileData);
      syncSettingsProfileSection();

      // Show success message
      showNotification('Profile updated successfully!', 'success');

      // Close modal
      closeModal();
    });
  }

  // Update sidebar profile display
  function updateSidebarProfile(profileData) {
    const userNameEl = document.querySelector('.user-name');
    const userAvatarEl = document.querySelector('.user-avatar');
    const avatarLargeEl = document.getElementById('profile-avatar-large');
    const resolvedName = profileData.name || 'User';
    const initials = getInitials(resolvedName);
    const avatarImage = profileData.avatarImage || '';

    if (userNameEl) {
      userNameEl.textContent = resolvedName;
    }

    if (userAvatarEl) {
      if (avatarImage) {
        userAvatarEl.textContent = '';
        userAvatarEl.style.backgroundImage = `url(${avatarImage})`;
        userAvatarEl.classList.add('avatar-image');
      } else {
        userAvatarEl.textContent = initials;
        userAvatarEl.style.backgroundImage = '';
        userAvatarEl.classList.remove('avatar-image');
      }
    }

    if (avatarLargeEl) {
      if (avatarImage) {
        avatarLargeEl.textContent = '';
        avatarLargeEl.style.backgroundImage = `url(${avatarImage})`;
        avatarLargeEl.classList.add('avatar-image');
      } else {
        avatarLargeEl.textContent = initials;
        avatarLargeEl.style.backgroundImage = '';
        avatarLargeEl.classList.remove('avatar-image');
      }
    }

    updateSettingsProfileHeader({
      ...getResolvedProfileData(),
      ...profileData,
      name: profileData.name || resolvedName,
      avatarImage
    });
  }

  function updateSettingsProfileHeader(profileData) {
    const settingsAvatarEl = document.getElementById('settings-profile-avatar');
    const settingsNameEl = document.getElementById('settings-profile-name');
    const settingsMetaEl = document.getElementById('settings-profile-meta');
    const resolvedName = profileData.name || 'User';
    const initials = getInitials(resolvedName);
    const avatarImage = profileData.avatarImage || '';
    const email = profileData.email || 'No email set';
    const role = toRoleLabel(profileData.role || 'Administrator');

    if (settingsNameEl) {
      settingsNameEl.textContent = resolvedName;
    }

    if (settingsMetaEl) {
      settingsMetaEl.textContent = `${email} • ${role}`;
    }

    if (settingsAvatarEl) {
      if (avatarImage) {
        settingsAvatarEl.textContent = '';
        settingsAvatarEl.style.backgroundImage = `url(${avatarImage})`;
        settingsAvatarEl.classList.add('avatar-image');
      } else {
        settingsAvatarEl.textContent = initials;
        settingsAvatarEl.style.backgroundImage = '';
        settingsAvatarEl.classList.remove('avatar-image');
      }
    }
  }

  function syncSettingsProfileSection() {
    const firstNameInput = document.getElementById('settings-first-name');
    if (!firstNameInput) {
      return;
    }

    const profileData = getResolvedProfileData();
    const nameParts = (profileData.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    document.getElementById('settings-first-name').value = firstName;
    document.getElementById('settings-last-name').value = lastName;
    document.getElementById('settings-email').value = profileData.email || '';
    document.getElementById('settings-phone').value = profileData.phone || '';
    document.getElementById('settings-bio').value = profileData.bio || '';

    updateSettingsProfileHeader(profileData);
    syncSettingsECardSection();
  }

  function toRoleLabel(roleValue) {
    const normalized = String(roleValue || '').trim().toLowerCase();
    if (!normalized) {
      return 'Broker / Investor';
    }
    if (normalized === 'admin') {
      return 'Administrator';
    }
    if (normalized === 'premium user') {
      return 'Premium User';
    }
    if (normalized === 'user') {
      return 'User';
    }
    if (normalized === 'broker') {
      return 'Broker';
    }
    return normalized.replace(/\b\w/g, function(char) {
      return char.toUpperCase();
    });
  }

  function syncSettingsECardSection() {
    const titleInput = document.getElementById('ecard-display-title');
    if (!titleInput) {
      return;
    }

    const profileData = getResolvedProfileData();
    const displayName = (profileData.ecardDisplayName || profileData.name || 'User').trim();
    const displayPhone = (profileData.ecardDisplayPhone || profileData.phone || '').trim();
    const displayEmail = (profileData.ecardDisplayEmail || profileData.email || '').trim();
    const title = toRoleLabel(profileData.jobTitle || profileData.role);
    const license = (profileData.licenseNumber || '').trim();
    const buyBox = (profileData.buyBox || '').trim();
    const targetAreas = (profileData.targetAreas || '').trim();

    const nameField = document.getElementById('ecard-display-name');
    const phoneField = document.getElementById('ecard-display-phone');
    const emailField = document.getElementById('ecard-display-email');
    const titleField = document.getElementById('ecard-display-title');
    const licenseField = document.getElementById('ecard-license');
    const buyBoxField = document.getElementById('ecard-buy-box');
    const targetAreasField = document.getElementById('ecard-target-areas');

    if (nameField) {
      nameField.value = displayName;
    }
    if (phoneField) {
      phoneField.value = displayPhone;
    }
    if (emailField) {
      emailField.value = displayEmail;
    }
    if (titleField) {
      titleField.value = title;
    }
    if (licenseField) {
      licenseField.value = license;
    }
    if (buyBoxField) {
      buyBoxField.value = buyBox;
    }
    if (targetAreasField) {
      targetAreasField.value = targetAreas;
    }

    updateECardPreviewFromInputs(profileData);
  }

  function updateECardPreviewFromInputs(profileDataOverride) {
    const profileData = profileDataOverride || getResolvedProfileData();

    const nameField = document.getElementById('ecard-display-name');
    const phoneField = document.getElementById('ecard-display-phone');
    const emailField = document.getElementById('ecard-display-email');
    const titleField = document.getElementById('ecard-display-title');
    const licenseField = document.getElementById('ecard-license');
    const buyBoxField = document.getElementById('ecard-buy-box');
    const targetAreasField = document.getElementById('ecard-target-areas');

    const displayName = nameField ? nameField.value.trim() : (profileData.ecardDisplayName || profileData.name || 'User').trim();
    const displayPhone = phoneField ? phoneField.value.trim() : (profileData.ecardDisplayPhone || profileData.phone || '').trim();
    const displayEmail = emailField ? emailField.value.trim() : (profileData.ecardDisplayEmail || profileData.email || '').trim();
    const displayTitle = titleField ? titleField.value.trim() : toRoleLabel(profileData.jobTitle || profileData.role);
    const displayLicense = licenseField ? licenseField.value.trim() : (profileData.licenseNumber || '').trim();
    const displayBuyBox = buyBoxField ? buyBoxField.value.trim() : (profileData.buyBox || '').trim();
    const displayTargetAreas = targetAreasField ? targetAreasField.value.trim() : (profileData.targetAreas || '').trim();

    const namePreview = document.getElementById('ecard-name');
    const rolePreview = document.getElementById('ecard-role');
    const phonePreview = document.getElementById('ecard-phone');
    const emailPreview = document.getElementById('ecard-email');
    const licensePreview = document.getElementById('ecard-license-preview');
    const buyBoxPreview = document.getElementById('ecard-buy-box-preview');
    const targetAreasPreview = document.getElementById('ecard-target-areas-preview');

    function setOptionalPreviewRow(previewElement, value) {
      if (!previewElement) {
        return;
      }
      const normalized = String(value || '').trim();
      const hideRow = !normalized || normalized.toLowerCase() === 'not set';
      previewElement.textContent = hideRow ? '' : normalized;
      const row = previewElement.closest('li');
      if (row) {
        row.hidden = hideRow;
      }
    }

    if (namePreview) {
      namePreview.textContent = (displayName || 'User').toUpperCase();
    }
    if (rolePreview) {
      rolePreview.textContent = (displayTitle || 'Broker / Investor').toUpperCase();
    }
    setOptionalPreviewRow(phonePreview, displayPhone);
    setOptionalPreviewRow(emailPreview, displayEmail);
    setOptionalPreviewRow(licensePreview, displayLicense);
    setOptionalPreviewRow(buyBoxPreview, displayBuyBox);
    setOptionalPreviewRow(targetAreasPreview, displayTargetAreas);
  }

  function saveSettingsECardSection() {
    const titleInput = document.getElementById('ecard-display-title');
    if (!titleInput) {
      return;
    }

    const profileData = getStoredProfileData();
    const updatedProfile = {
      ...profileData,
      ecardDisplayName: document.getElementById('ecard-display-name').value.trim(),
      ecardDisplayPhone: document.getElementById('ecard-display-phone').value.trim(),
      ecardDisplayEmail: document.getElementById('ecard-display-email').value.trim(),
      jobTitle: document.getElementById('ecard-display-title').value.trim(),
      licenseNumber: document.getElementById('ecard-license').value.trim(),
      buyBox: document.getElementById('ecard-buy-box').value.trim(),
      targetAreas: document.getElementById('ecard-target-areas').value.trim(),
      updatedAt: new Date().toISOString()
    };

    setStoredProfileData(updatedProfile);
    syncSettingsECardSection();
    showNotification('E Card updated successfully!', 'success');
  }

  function autoSaveSettingsECardSection() {
    const titleInput = document.getElementById('ecard-display-title');
    if (!titleInput) {
      return;
    }

    const profileData = getStoredProfileData();
    const updatedProfile = {
      ...profileData,
      ecardDisplayName: document.getElementById('ecard-display-name').value.trim(),
      ecardDisplayPhone: document.getElementById('ecard-display-phone').value.trim(),
      ecardDisplayEmail: document.getElementById('ecard-display-email').value.trim(),
      jobTitle: document.getElementById('ecard-display-title').value.trim(),
      licenseNumber: document.getElementById('ecard-license').value.trim(),
      buyBox: document.getElementById('ecard-buy-box').value.trim(),
      targetAreas: document.getElementById('ecard-target-areas').value.trim(),
      updatedAt: new Date().toISOString()
    };

    setStoredProfileData(updatedProfile);
  }

  function resetSettingsECardSection() {
    syncSettingsECardSection();
    showNotification('E Card reset to saved values.', 'info');
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const content = String(text || '').trim();
    if (!content) {
      return y;
    }

    const words = content.split(/\s+/);
    let line = '';
    let lines = 0;

    for (let i = 0; i < words.length; i += 1) {
      const test = line ? `${line} ${words[i]}` : words[i];
      const w = ctx.measureText(test).width;
      if (w <= maxWidth || !line) {
        line = test;
      } else {
        ctx.fillText(line, x, y);
        y += lineHeight;
        lines += 1;
        if (maxLines && lines >= maxLines) {
          return y;
        }
        line = words[i];
      }
    }

    if (line && (!maxLines || lines < maxLines)) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }

    return y;
  }

  let html2CanvasLoaderPromise = null;

  function loadHtml2Canvas() {
    if (window.html2canvas) {
      return Promise.resolve(window.html2canvas);
    }

    if (html2CanvasLoaderPromise) {
      return html2CanvasLoaderPromise;
    }

    html2CanvasLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.async = true;
      script.onload = () => {
        if (window.html2canvas) {
          resolve(window.html2canvas);
          return;
        }
        reject(new Error('html2canvas did not initialize.'));
      };
      script.onerror = () => reject(new Error('Failed to load html2canvas.'));
      document.head.appendChild(script);
    });

    return html2CanvasLoaderPromise;
  }

  async function downloadPreviewAsExactJpg(preview, fileName) {
    const html2canvas = await loadHtml2Canvas();

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (error) {
        // Proceed even if font readiness fails.
      }
    }

    const previewRect = preview.getBoundingClientRect();
    const exportWidth = Math.max(Math.round(previewRect.width), preview.scrollWidth || 0, 560);
    const exportHeight = Math.max(Math.round(previewRect.height), preview.scrollHeight || 0, 320);

    const exportHost = document.createElement('div');
    exportHost.setAttribute('aria-hidden', 'true');
    exportHost.style.position = 'fixed';
    exportHost.style.left = '-10000px';
    exportHost.style.top = '0';
    exportHost.style.width = `${exportWidth}px`;
    exportHost.style.height = `${exportHeight}px`;
    exportHost.style.padding = '0';
    exportHost.style.margin = '0';
    exportHost.style.opacity = '1';
    exportHost.style.pointerEvents = 'none';
    exportHost.style.zIndex = '-1';
    exportHost.style.background = 'transparent';

    const exportClone = preview.cloneNode(true);
    exportClone.id = `${preview.id || 'preview'}-export-clone`;
    exportClone.style.width = `${exportWidth}px`;
    exportClone.style.minWidth = `${exportWidth}px`;
    exportClone.style.maxWidth = `${exportWidth}px`;
    exportClone.style.height = `${exportHeight}px`;
    exportClone.style.minHeight = `${exportHeight}px`;
    exportClone.style.margin = '0';
    exportClone.style.transform = 'none';

    exportHost.appendChild(exportClone);
    document.body.appendChild(exportHost);

    try {
      const canvas = await html2canvas(exportClone, {
        backgroundColor: '#ffffff',
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        logging: false,
        width: exportWidth,
        height: exportHeight,
        windowWidth: exportWidth,
        windowHeight: exportHeight
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      exportHost.remove();
    }
  }

  async function downloadECardAsJpg() {
    const preview = document.getElementById('ecard-preview');
    if (!preview) {
      showNotification('E Card preview is not available.', 'info');
      return;
    }

    updateECardPreviewFromInputs();

    const name = (document.getElementById('ecard-name')?.textContent || 'USER NAME').trim();
    const role = (document.getElementById('ecard-role')?.textContent || 'BROKER / INVESTOR').trim();
    const phone = (document.getElementById('ecard-phone')?.textContent || '').trim();
    const email = (document.getElementById('ecard-email')?.textContent || '').trim();
    const license = (document.getElementById('ecard-license-preview')?.textContent || '').trim();
    const buyBox = (document.getElementById('ecard-buy-box-preview')?.textContent || '').trim();
    const targetAreas = (document.getElementById('ecard-target-areas-preview')?.textContent || '').trim();

    const sanitizedName = (name || 'ecard').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const fileName = `${sanitizedName || 'ecard'}.jpg`;

    await downloadPreviewAsExactJpg(preview, fileName);

    showNotification('E Card downloaded as JPG.', 'success');
  }

  function saveSettingsProfileSection() {
    const firstNameInput = document.getElementById('settings-first-name');
    if (!firstNameInput) {
      return;
    }

    const firstName = firstNameInput.value.trim();
    const lastName = document.getElementById('settings-last-name').value.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const existingProfile = getStoredProfileData();
    const user = getCurrentUser();
    const resolvedAccountEmail = normalizeKnownEmail((user && user.email) || existingProfile.email || '');
    const profileData = {
      ...existingProfile,
      name: fullName || existingProfile.name || 'User',
      email: resolvedAccountEmail,
      phone: document.getElementById('settings-phone').value.trim(),
      avatarUploadId: existingProfile.avatarUploadId || '',
      bio: document.getElementById('settings-bio').value.trim(),
      updatedAt: new Date().toISOString()
    };

    setStoredProfileData(profileData);

    if (user) {
      user.name = profileData.name;
      user.email = resolvedAccountEmail;
      user.avatarImage = profileData.avatarImage || user.avatarImage || '';
      persistCurrentUserIdentity(user);
    }

    updateSidebarProfile(profileData);
    syncSettingsProfileSection();
    showNotification('Settings profile updated successfully!', 'success');
  }

  async function saveAvatarImage(avatarImage) {
    const profileData = getStoredProfileData();
    const user = getCurrentUser();
    let nextAvatarUploadId = String(profileData.avatarUploadId || (user && user.avatarUploadId) || '').trim();
    let nextAvatarImage = String(avatarImage || '').trim();

    if (nextAvatarImage && getAuthToken()) {
      const avatarBlob = dataUrlToBlob(nextAvatarImage);
      const formData = new FormData();
      formData.append('avatar', avatarBlob, 'profile-avatar.jpg');
      const payload = await requestProfileAvatar('/api/profile/avatar', {
        method: 'POST',
        body: formData
      });
      const serverUser = payload && payload.user && typeof payload.user === 'object' ? payload.user : {};
      nextAvatarUploadId = String(serverUser.avatarUploadId || '').trim();
      nextAvatarImage = String(serverUser.avatarImage || buildProfileAvatarImage(nextAvatarUploadId)).trim();
    } else if (!nextAvatarImage && nextAvatarUploadId && getAuthToken()) {
      const payload = await requestProfileAvatar('/api/profile/avatar', {
        method: 'DELETE'
      });
      const serverUser = payload && payload.user && typeof payload.user === 'object' ? payload.user : {};
      nextAvatarUploadId = String(serverUser.avatarUploadId || '').trim();
      nextAvatarImage = String(serverUser.avatarImage || '').trim();
    }

    const updatedProfile = {
      ...profileData,
      avatarUploadId: nextAvatarUploadId,
      avatarImage: nextAvatarImage,
      updatedAt: new Date().toISOString()
    };

    setStoredProfileData(updatedProfile);

    if (user) {
      user.avatarUploadId = nextAvatarUploadId;
      user.avatarImage = nextAvatarImage;
      persistCurrentUserIdentity(user);
    }

    updateSidebarProfile({
      ...user,
      ...updatedProfile,
      name: updatedProfile.name || (user && user.name) || 'User'
    });

    syncSettingsProfileSection();
    updateRemoveAvatarButtonState(updatedProfile);
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', async function() {
      const profileData = getResolvedProfileData();
      if (!profileData.avatarImage) {
        updateRemoveAvatarButtonState(profileData);
        return;
      }

      try {
        await saveAvatarImage('');
        closeAvatarAdjuster(true);
        showNotification('Profile image removed successfully!', 'success');
      } catch (error) {
        showNotification(error.message || 'Could not remove the profile image.', 'error');
      }
    });
  }

  let avatarMigrationStarted = false;

  async function migrateLegacyAvatarToCloudIfNeeded() {
    if (avatarMigrationStarted || !getAuthToken()) {
      return;
    }

    const profileData = getResolvedProfileData();
    if (profileData.avatarUploadId || !String(profileData.avatarImage || '').startsWith('data:image/')) {
      return;
    }

    avatarMigrationStarted = true;
    try {
      await saveAvatarImage(profileData.avatarImage);
    } catch (error) {
      avatarMigrationStarted = false;
      return;
    }
  }

  // Notification function
  function showNotification(message, type = 'info') {
    const rootStyles = window.getComputedStyle(document.documentElement);
    const themeSurface = rootStyles.getPropertyValue('--toast-surface').trim() || 'rgba(5, 10, 9, 0.96)';
    const themeBorder = rootStyles.getPropertyValue('--toast-border').trim() || 'rgba(255, 255, 255, 0.14)';
    const titleColor = rootStyles.getPropertyValue('--toast-title').trim() || '#f8fafc';
    const bodyColor = rootStyles.getPropertyValue('--toast-body').trim() || 'rgba(241, 245, 249, 0.92)';
    const themeShadow = rootStyles.getPropertyValue('--toast-shadow').trim() || '0 18px 44px rgba(0, 0, 0, 0.34)';
    const accentColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0ea5e9';
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 280px;
      max-width: 360px;
      padding: 15px 18px;
      background: linear-gradient(135deg, ${themeSurface}, color-mix(in srgb, ${themeSurface} 88%, white 12%));
      color: ${bodyColor};
      border-radius: 18px;
      border: 1px solid ${themeBorder};
      border-left: 6px solid ${accentColor};
      box-shadow: ${themeShadow}, 0 0 0 1px color-mix(in srgb, ${accentColor} 18%, transparent);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      z-index: 3000;
      font-size: 13px;
      line-height: 1.45;
      animation: slideIn 0.24s ease-out;
    `;
    notification.innerHTML = `<strong style="display:block;margin-bottom:5px;color:${titleColor};font-size:14px;letter-spacing:0.01em;">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'}</strong><span>${message}</span>`;

    document.body.appendChild(notification);

    const style = document.createElement('style');
    if (!document.getElementById('notification-style')) {
      style.id = 'notification-style';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Edit avatar button
  if (editAvatarBtn) {
    editAvatarBtn.addEventListener('click', function() {
      if (avatarInput) {
        avatarInput.value = '';
        avatarInput.click();
      }
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener('cancel', function() {
      handleAvatarSelectionCanceled();
    });

    avatarInput.addEventListener('change', function(event) {
      const [file] = event.target.files || [];

      if (!file) {
        handleAvatarSelectionCanceled();
        return;
      }

      if (!file.type.startsWith('image/')) {
        showNotification('Please choose an image file.', 'info');
        avatarInput.value = '';
        return;
      }

      if (file.size > 1024 * 1024 * 5) {
        showNotification('Please choose an image smaller than 5MB.', 'info');
        avatarInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(loadEvent) {
        openAvatarAdjuster(loadEvent.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  const settingsProfileSaveBtn = document.getElementById('settings-profile-save');
  if (settingsProfileSaveBtn) {
    settingsProfileSaveBtn.addEventListener('click', saveSettingsProfileSection);
  }

  const settingsProfileCancelBtn = document.getElementById('settings-profile-cancel');
  if (settingsProfileCancelBtn) {
    settingsProfileCancelBtn.addEventListener('click', function() {
      syncSettingsProfileSection();
      showNotification('Settings profile reset to saved values.', 'info');
    });
  }

  const eCardSaveBtn = document.getElementById('ecard-save');
  if (eCardSaveBtn) {
    eCardSaveBtn.addEventListener('click', saveSettingsECardSection);
  }

  const eCardResetBtn = document.getElementById('ecard-reset');
  if (eCardResetBtn) {
    eCardResetBtn.addEventListener('click', resetSettingsECardSection);
  }

  const eCardDownloadBtn = document.getElementById('ecard-download');
  if (eCardDownloadBtn) {
    eCardDownloadBtn.addEventListener('click', downloadECardAsJpg);
  }

  let eCardAutosaveTimer = null;

  ['ecard-display-name', 'ecard-display-phone', 'ecard-display-email', 'ecard-display-title', 'ecard-license', 'ecard-buy-box', 'ecard-target-areas'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        updateECardPreviewFromInputs();

        if (eCardAutosaveTimer) {
          window.clearTimeout(eCardAutosaveTimer);
        }

        eCardAutosaveTimer = window.setTimeout(() => {
          autoSaveSettingsECardSection();
        }, 300);
      });
    }
  });

  syncSettingsProfileSection();
  void migrateLegacyAvatarToCloudIfNeeded();

  // ── Gmail / SMTP settings ───────────────────────────────────────────────────
  (function initSmtpSettings() {
    const smtpUserInput  = document.getElementById('smtp-gmail-user');
    const smtpPassInput  = document.getElementById('smtp-gmail-pass');
    const smtpSaveBtn    = document.getElementById('smtp-save-btn');
    const smtpStatusMsg  = document.getElementById('smtp-status-msg');
    const smtpPassToggle = document.getElementById('smtp-pass-toggle');
    const smtpEyeIcon    = document.getElementById('smtp-eye-icon');
    let smtpHasSavedPassword = false;

    if (!smtpUserInput) return; // not on settings page

    function getToken() {
      return localStorage.getItem('authToken') || '';
    }

    function cacheSmtpSettings(settings) {
      setStoredSmtpSettings(settings);
    }

    function setSmtpStatus(msg, type) {
      if (!smtpStatusMsg) return;
      smtpStatusMsg.textContent = msg;
      smtpStatusMsg.style.color = type === 'success' ? '#22c55e'
                                 : type === 'error'   ? '#ef4444'
                                 : 'var(--text-muted)';
    }

    // Show/hide App Password
    if (smtpPassToggle && smtpPassInput) {
      smtpPassToggle.addEventListener('click', function () {
        const isHidden = smtpPassInput.type === 'password';
        smtpPassInput.type = isHidden ? 'text' : 'password';
        if (smtpEyeIcon) {
          smtpEyeIcon.innerHTML = isHidden
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
      });
    }

    // Load current SMTP settings from server
    async function loadSmtpSettings() {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch('/api/smtp-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        smtpHasSavedPassword = Boolean(data.hasPassword);
        if (smtpUserInput && data.smtpUser) smtpUserInput.value = data.smtpUser;
        if (smtpPassInput && data.hasPassword) smtpPassInput.placeholder = '••••••••••••••••';
        cacheSmtpSettings(data);
        if (data.pendingRequest) {
          setSmtpStatus(`Pending admin approval for ${data.pendingRequest.smtpUser}.`, '');
        } else if (data.smtpUser && data.hasPassword) {
          setSmtpStatus('Gmail account configured ✓', 'success');
        } else {
          setSmtpStatus('No Gmail approval request submitted yet.', '');
        }
      } catch (e) {
        // Silently ignore — server may not be available yet
      }
    }

    // Save SMTP settings
    if (smtpSaveBtn) {
      smtpSaveBtn.addEventListener('click', async function () {
        const token = getToken();
        if (!token) { setSmtpStatus('You must be logged in to save settings.', 'error'); return; }

        const smtpUser = smtpUserInput ? smtpUserInput.value.trim() : '';
        const smtpPass = smtpPassInput ? smtpPassInput.value.trim() : '';

        if (!smtpUser) { setSmtpStatus('Enter your Gmail address.', 'error'); return; }
        if (!smtpPass) { setSmtpStatus('Enter your Gmail App Password.', 'error'); return; }

        smtpSaveBtn.disabled = true;
        smtpSaveBtn.textContent = 'Submitting…';
        setSmtpStatus('', '');

        try {
          const res = await fetch('/api/smtp-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ smtpUser, smtpPass })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSmtpStatus('Gmail request submitted for admin approval ✓', 'success');
            if (smtpPassInput) smtpPassInput.value = '';
            await loadSmtpSettings();
          } else {
            setSmtpStatus(data.error || 'Failed to save settings.', 'error');
          }
        } catch (e) {
          setSmtpStatus('Network error — could not save settings.', 'error');
        } finally {
          smtpSaveBtn.disabled = false;
          smtpSaveBtn.textContent = 'Submit For Admin Approval';
        }
      });
    }

    loadSmtpSettings();
  })();
  // ────────────────────────────────────────────────────────────────────────────

  // Export to window for use in auth.js
  window.updateSidebarProfile = updateSidebarProfile;
  window.loadProfileData = loadProfileData;
})();
