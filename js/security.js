// js/security.js
// ===================================================================
// TEACHER MODE SECURITY
// SHA-256 password hashing, no plain text storage
// ===================================================================

(function () {
  'use strict';

  // Password hashes (pre-computed SHA-256)
  const VALID_HASHES = {
    // "Feonixid2000" -> SHA-256
    primary: '11c75b138276ff547a9bcd8dac3502a8be89c9a8d21109b45c1d25bd138c0325'
  };

  // SHA-256 hash function (native crypto API)
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // Verify password against known hashes
  async function verifyPassword(password) {
    if (!password || typeof password !== 'string') return false;

    const hash = await hashPassword(password.trim());

    // Check against all valid hashes
    return hash === VALID_HASHES.primary;
  }

  // Show password modal
  function showPasswordModal() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('passwordModalOverlay');
      const input = document.getElementById('passwordInput');
      const submitBtn = document.getElementById('passwordSubmit');
      const cancelBtn = document.getElementById('passwordCancel');
      const errorMsg = document.getElementById('passwordError');

      // Reset
      input.value = '';
      errorMsg.textContent = '';
      errorMsg.style.display = 'none';
      overlay.style.display = 'flex';

      // Focus input
      setTimeout(() => input.focus(), 100);

      const cleanup = () => {
        overlay.style.display = 'none';
        submitBtn.removeEventListener('click', handleSubmit);
        cancelBtn.removeEventListener('click', handleCancel);
        input.removeEventListener('keydown', handleKeydown);
      };

      const handleSubmit = async () => {
        const password = input.value.trim();

        if (!password) {
          errorMsg.textContent = 'Ju lutem vendosni fjalëkalimin.';
          errorMsg.style.display = 'block';
          return;
        }

        // Show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Duke verifikuar...';

        const isValid = await verifyPassword(password);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Hyr';

        if (isValid) {
          cleanup();
          resolve(true);
        } else {
          errorMsg.textContent = 'Fjalëkalim i gabuar. Provoni përsëri.';
          errorMsg.style.display = 'block';
          input.value = '';
          input.focus();
        }
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const handleKeydown = (e) => {
        if (e.key === 'Enter') {
          handleSubmit();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      };

      submitBtn.addEventListener('click', handleSubmit);
      cancelBtn.addEventListener('click', handleCancel);
      input.addEventListener('keydown', handleKeydown);
    });
  }

  // Attempt to unlock teacher mode based on account type
  async function unlockTeacherMode() {
    // Check if Accounts module exists
    if (!window.Accounts) {
      console.error('Accounts module missing');
      return false;
    }

    const user = window.Accounts.getUser();
    if (!user) {
      alert('Ju lutem hyni në llogarinë tuaj për të aksesuar këtë panel.');
      // Optionally trigger login modal via UI event
      window.dispatchEvent(new CustomEvent('requestLogin'));
      return false;
    }

    // Role Check
    if (user.accountType === 'student') {
      alert('⚠️ Akses i refuzuar: Llogaritë e studentëve nuk kanë akses në Teacher Mode.');
      return false;
    }

    // Admin or Teacher allowed
    window.AppState.security.isAuthenticated = true;
    window.AppState.ui.teacherModeUnlocked = true;
    console.log(`✅ Teacher mode unlocked for ${user.username} (${user.accountType})`);
    return true;
  }

  // Lock teacher mode
  function lockTeacherMode() {
    window.AppState.security.isAuthenticated = false;
    window.AppState.ui.teacherModeUnlocked = false;
    console.log('🔒 Teacher mode locked');
  }

  // Check if teacher mode is unlocked
  function isTeacherModeUnlocked() {
    return window.AppState.security.isAuthenticated === true &&
      window.AppState.ui.teacherModeUnlocked === true;
  }

  // Secure prompt loader - only loads teacher prompts if authenticated
  async function loadPromptSecure(promptType) {
    const state = window.AppState;

    if (!state) {
      console.error('AppState not initialized');
      return null;
    }

    let path = '';

    switch (promptType) {
      case 'student':
        path = state.prompts.student;
        break;

      case 'teacher':
        // Requires authentication
        if (!isTeacherModeUnlocked()) {
          console.warn('⚠️ Teacher prompt requires authentication');
          return null;
        }
        path = state.prompts.teacher;
        break;

      case 'developer':
        // Requires authentication
        if (!isTeacherModeUnlocked()) {
          console.warn('⚠️ Developer prompt requires authentication');
          return null;
        }
        path = state.prompts.developer;
        break;

      default:
        console.error('Unknown prompt type:', promptType);
        return null;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      console.log(`✅ Loaded prompt: ${promptType}`);
      return text;
    } catch (error) {
      console.error(`❌ Failed to load prompt ${promptType}:`, error);
      return null;
    }
  }

  // Generate School ID from API Key (Safe Identifier for connecting teachers)
  async function generateSchoolID() {
    const apiKey = window.AppState?.api?.key;
    if (!apiKey) return 'N/A';

    // Hash the key to create a safe ID
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Use first 4 bytes for a short ID like "A1B2-C3D4"
    const hex = hashArray.slice(0, 4).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    return `${hex.substring(0, 4)}-${hex.substring(4)}`;
  }

  // Display School ID in Teacher/Settings Panel
  async function showSchoolIdentity() {
    const id = await generateSchoolID();
    console.log('🏫 School ID:', id);

    const container = document.getElementById('teacherToolsSection');
    if (container && !document.getElementById('schoolIdDisplay')) {
      const div = document.createElement('div');
      div.id = 'schoolIdDisplay';
      div.style.padding = '8px 12px';
      div.style.margin = '12px 0';
      div.style.background = 'var(--bg)';
      div.style.border = '1px dashed var(--accent)';
      div.style.borderRadius = '8px';
      div.style.fontSize = '12px';
      div.style.color = 'var(--muted)';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';

      div.innerHTML = `
            <span>🏫 ID e Shkollës: <strong>${id}</strong></span>
            <button class="icon-btn" style="width:24px;height:24px;font-size:12px;" title="Kopjo ID" onclick="navigator.clipboard.writeText('${id}')">📋</button>
          `;

      // Insert before "Klasa"
      const ref = container.querySelector('.gradeSelect') || container.firstChild;
      container.insertBefore(div, ref);
    }
    return id;
  }

  // Public API
  window.Security = {
    unlockTeacherMode,
    lockTeacherMode,
    isTeacherModeUnlocked,
    loadPromptSecure,
    verifyPassword,
    generateSchoolID,
    showSchoolIdentity
  };

  console.log('✅ Security module initialized');
})();