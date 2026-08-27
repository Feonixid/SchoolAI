// js/settings.js
// ===================================================================
// SETTINGS PANEL
// Language, Performance, Accessibility configuration UI
// ===================================================================

(function () {
  'use strict';

  let settingsPanel = null;
  let isOpen = false;

  // Create settings panel HTML
  function createPanelHTML() {
    const languages = window.I18n?.getSupportedLanguages() || [];
    const currentLang = window.I18n?.current || 'en';
    const aiLang = window.I18n?.aiLanguage || 'same';
    const proficiency = window.I18n?.proficiency || 'intermediate';
    const hardware = window.HardwareProfile?.getHardwareInfo() || {};
    const profiles = window.HardwareProfile?.getProfiles() || {};
    const currentProfile = hardware.profile || 'medium';

    return `
      <div id="settingsPanel" class="settings-panel" style="display:none;">
        <div class="settings-content">
          <div class="settings-header">
            <h2>Settings</h2>
            <button class="settings-close" onclick="window.Settings.close()">×</button>
          </div>
          
          <div class="settings-tabs">
            <button class="tab-btn active" data-tab="language">Language</button>
            <button class="tab-btn" data-tab="performance">Performance</button>
            <button class="tab-btn" data-tab="network">🌐 Network &amp; Sync</button>
            <button class="tab-btn" data-tab="accessibility">Accessibility</button>
            <button class="tab-btn" data-tab="about">About</button>
          </div>
          
          <!-- Language Tab -->
          <div class="settings-tab active" id="tab-language">
            <div class="setting-group">
              <label>App Language</label>
              <select id="appLanguage" class="setting-select">
                ${languages.map(l => `
                  <option value="${l.code}" ${l.code === currentLang ? 'selected' : ''}>
                    ${l.native} (${l.name})
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="setting-group">
              <label>AI Response Language</label>
              <select id="aiLanguage" class="setting-select">
                <option value="same" ${aiLang === 'same' ? 'selected' : ''}>Same as App</option>
                ${languages.map(l => `
                  <option value="${l.code}" ${l.code === aiLang ? 'selected' : ''}>
                    ${l.native}
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="setting-group">
              <label>Proficiency Level</label>
              <select id="proficiencyLevel" class="setting-select">
                <option value="beginner" ${proficiency === 'beginner' ? 'selected' : ''}>Beginner - Simple language</option>
                <option value="intermediate" ${proficiency === 'intermediate' ? 'selected' : ''}>Intermediate - Balanced</option>
                <option value="advanced" ${proficiency === 'advanced' ? 'selected' : ''}>Advanced - Complex language</option>
              </select>
            </div>
          </div>
          
          <!-- Performance Tab -->
          <div class="settings-tab" id="tab-performance">
            <div class="hardware-info">
              <h3>Detected Hardware</h3>
              <div class="hardware-grid">
                <div class="hw-item">
                  <span class="hw-label">CPU</span>
                  <span class="hw-value">${hardware.cpu?.model || 'Unknown'}</span>
                  <span class="hw-detail">${hardware.cpu?.cores || 0} cores</span>
                </div>
                <div class="hw-item">
                  <span class="hw-label">RAM</span>
                  <span class="hw-value">${hardware.memory?.gb || 0} GB</span>
                  <span class="hw-detail">${hardware.memory?.tier || 'Unknown'} tier</span>
                </div>
                <div class="hw-item">
                  <span class="hw-label">GPU</span>
                  <span class="hw-value">${hardware.gpu?.renderer || 'None'}</span>
                  <span class="hw-detail">${hardware.gpu?.vram || 0} GB VRAM</span>
                </div>
                <div class="hw-item">
                  <span class="hw-label">Platform</span>
                  <span class="hw-value">${hardware.platform?.type || 'Unknown'}</span>
                  <span class="hw-detail">${hardware.platform?.os || 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div class="setting-group">
              <label>Performance Profile</label>
              <select id="performanceProfile" class="setting-select">
                ${Object.entries(profiles).map(([key, p]) => `
                  <option value="${key}" ${key === currentProfile ? 'selected' : ''}>
                    ${p.name} - ${p.description}
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="profile-details" id="profileDetails">
              ${renderProfileDetails(currentProfile)}
            </div>
            
            <div class="setting-group">
              <label>
                <input type="checkbox" id="overrideSettings">
                Override with custom settings
              </label>
            </div>
            
            <div class="custom-settings" id="customSettings" style="display:none;">
              <div class="setting-group">
                <label>AI Model</label>
                <select id="customModel" class="setting-select">
                  <option value="gemma3:12b">Gemma 3 12B (Best quality)</option>
                  <option value="gemma3:8b">Gemma 3 8B (High quality)</option>
                  <option value="gemma3:4b">Gemma 3 4B (Balanced)</option>
                  <option value="gemma3:2b">Gemma 3 2B (Fast)</option>
                  <option value="gemma3:1b">Gemma 3 1B (Fastest)</option>
                </select>
              </div>
              
              <div class="setting-group">
                <label>Context Length</label>
                <select id="customContext" class="setting-select">
                  <option value="2048">2K tokens</option>
                  <option value="4096">4K tokens</option>
                  <option value="8192">8K tokens</option>
                  <option value="16384">16K tokens</option>
                  <option value="32768">32K tokens</option>
                </select>
              </div>
              
              <div class="setting-group">
                <label>KV Cache Type</label>
                <select id="customKVCache" class="setting-select">
                  <option value="f16">F16 (Best quality, most memory)</option>
                  <option value="q8_0">Q8_0 (50% memory savings)</option>
                  <option value="q4_0">Q4_0 (75% memory savings)</option>
                </select>
              </div>
              
              <div class="setting-group">
                <label>
                  <input type="checkbox" id="customStreaming" checked>
                  Enable streaming responses
                </label>
              </div>
            </div>
          </div>
          
          <!-- Accessibility Tab -->
          <div class="settings-tab" id="tab-accessibility">
            <div class="setting-group">
              <label>
                <input type="checkbox" id="highContrast">
                High Contrast Mode
              </label>
              <p class="setting-desc">Increases contrast for better visibility</p>
            </div>
            
            <div class="setting-group">
              <label>
                <input type="checkbox" id="dyslexiaFont">
                Dyslexia-Friendly Font
              </label>
              <p class="setting-desc">Uses OpenDyslexic font for easier reading</p>
            </div>
            
            <div class="setting-group">
              <label>Font Size</label>
              <input type="range" id="fontSize" min="12" max="24" value="16">
              <span id="fontSizeValue">16px</span>
            </div>
            
            <div class="setting-group">
              <label>
                <input type="checkbox" id="screenReader">
                Screen Reader Mode
              </label>
              <p class="setting-desc">Optimizes for screen readers</p>
            </div>
            
            <div class="setting-group">
              <label>
                <input type="checkbox" id="readAloud">
                Auto-read AI responses
              </label>
              <p class="setting-desc">Automatically read responses aloud</p>
            </div>
          </div>
          
          <!-- Network & Sync Tab -->
          <div class="settings-tab" id="tab-network">
            <div class="setting-group">
              <label>Deployment &amp; Connection Mode</label>
              <select id="serverModeSelect" class="setting-select">
                <option value="auto">🌐 Auto-Detect (Classroom LAN / Localhost)</option>
                <option value="lan">📶 Local Classroom LAN (Teacher's Laptop)</option>
                <option value="cloud">☁️ Central School Cloud Server</option>
                <option value="custom">⚙️ Custom Server URL</option>
              </select>
              <p class="setting-desc">Choose how this computer connects with the classroom or school network.</p>
            </div>

            <div class="setting-group" id="serverTargetGroup">
              <label>Server Address / IP / URL</label>
              <div style="display:flex;gap:8px">
                <input type="text" id="serverTargetInput" placeholder="e.g. http://192.168.1.50:3001 or https://school.edu" class="setting-select" style="flex:1" />
                <button id="testConnectionBtn" class="btn-secondary" style="padding:8px 14px;white-space:nowrap;font-size:12px">⚡ Test Ping</button>
              </div>
              <div id="connectionTestStatus" style="font-size:12px;margin-top:6px;font-weight:600"></div>
            </div>

            <div class="setting-group" style="margin-top:16px;padding:14px;background:var(--input-bg);border:1px solid var(--border);border-radius:10px">
              <h4 style="margin:0 0 8px;font-size:13px;color:var(--text)">📡 Multi-Device Classroom Sync</h4>
              <p style="margin:0 0 10px;font-size:11.5px;color:var(--muted);line-height:1.5">
                • <strong>LAN Mode</strong>: Teacher's laptop acts as local Wi-Fi hub. Students connect without needing internet.<br>
                • <strong>Central Cloud</strong>: Pushes local classroom rosters, grades, and attendance to central district server.
              </p>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button id="pushCloudSyncBtn" class="btn-secondary" style="font-size:11.5px;padding:6px 12px">☁️ Push Roster to Cloud</button>
                <button id="pullCloudSyncBtn" class="btn-secondary" style="font-size:11.5px;padding:6px 12px">🔄 Pull School Updates</button>
              </div>
              <div id="cloudSyncStatus" style="font-size:11.5px;margin-top:6px;font-weight:600"></div>
            </div>
          </div>
          
          <!-- About Tab -->
          <div class="settings-tab" id="tab-about">
            <div class="about-content">
              <h3>EduAI</h3>
              <p class="version">Version 2.0.0</p>
              <p class="description">Educational AI platform powered by Gemma 4, running locally via Ollama.</p>
              
              <div class="about-links">
                <a href="https://ollama.com" target="_blank">Ollama</a>
                <a href="https://ai.google.dev/gemma" target="_blank">Gemma</a>
                <a href="https://github.com/ggml-org/llama.cpp/discussions/20969" target="_blank">TurboQuant</a>
              </div>
              
              <div class="tech-stack">
                <h4>Technology Stack</h4>
                <ul>
                  <li>AI: Gemma 4 via Ollama</li>
                  <li>Editor: Monaco Editor</li>
                  <li>Container: Docker</li>
                  <li>Runtime: Node.js / Electron</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="settings-footer">
            <button class="btn-secondary" onclick="window.Settings.close()">Cancel</button>
            <button class="btn-primary" onclick="window.Settings.save()">Save Changes</button>
          </div>
        </div>
      </div>
    `;
  }

  // Render profile details
  function renderProfileDetails(profileKey) {
    const profiles = window.HardwareProfile?.getProfiles() || {};
    const profile = profiles[profileKey] || profiles.medium;
    
    return `
      <div class="profile-info">
        <div class="profile-item">
          <span>Model:</span>
          <strong>${profile.model}</strong>
        </div>
        <div class="profile-item">
          <span>Context:</span>
          <strong>${(profile.contextLength / 1024).toFixed(0)}K tokens</strong>
        </div>
        <div class="profile-item">
          <span>KV Cache:</span>
          <strong>${profile.kvCacheType}</strong>
        </div>
        <div class="profile-item">
          <span>Streaming:</span>
          <strong>${profile.streaming ? 'Yes' : 'No'}</strong>
        </div>
        <div class="profile-item">
          <span>Docker Lab:</span>
          <strong>${profile.docker ? 'Enabled' : 'Disabled'}</strong>
        </div>
      </div>
    `;
  }

  // Open settings panel
  function open() {
    if (!settingsPanel) {
      document.body.insertAdjacentHTML('beforeend', createPanelHTML());
      settingsPanel = document.getElementById('settingsPanel');
      setupEventListeners();
    }
    
    settingsPanel.style.display = 'flex';
    isOpen = true;
    
    // Load current settings
    loadCurrentSettings();
  }

  // Close settings panel
  function close() {
    if (settingsPanel) {
      settingsPanel.style.display = 'none';
    }
    isOpen = false;
  }

  // Setup event listeners
  function setupEventListeners() {
    // Tab switching
    settingsPanel.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settingsPanel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        settingsPanel.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    // Profile change
    document.getElementById('performanceProfile')?.addEventListener('change', (e) => {
      document.getElementById('profileDetails').innerHTML = renderProfileDetails(e.target.value);
    });

    // Override toggle
    document.getElementById('overrideSettings')?.addEventListener('change', (e) => {
      document.getElementById('customSettings').style.display = e.target.checked ? 'block' : 'none';
    });

    // Network & Deployment Settings
    const serverModeSelect = document.getElementById('serverModeSelect');
    const serverTargetInput = document.getElementById('serverTargetInput');
    const testConnBtn = document.getElementById('testConnectionBtn');
    const testStatus = document.getElementById('connectionTestStatus');
    const pushCloudBtn = document.getElementById('pushCloudSyncBtn');
    const pullCloudBtn = document.getElementById('pullCloudSyncBtn');
    const cloudStatus = document.getElementById('cloudSyncStatus');

    if (serverModeSelect && serverTargetInput) {
      serverModeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'auto') {
          serverTargetInput.value = '';
          serverTargetInput.placeholder = '🌐 Auto-Detecting local network...';
        } else if (val === 'lan') {
          serverTargetInput.placeholder = 'http://192.168.1.xxx:3001 (Teacher Laptop)';
        } else if (val === 'cloud') {
          serverTargetInput.placeholder = 'https://school-server.edu.al';
        }
      });

      testConnBtn?.addEventListener('click', async () => {
        const target = serverTargetInput.value.trim() || (window.Api?.getBaseUrl ? window.Api.getBaseUrl() : window.location.origin);
        testStatus.textContent = '🔄 Testing connection to ' + target + '...';
        testStatus.style.color = 'var(--muted)';

        try {
          const t0 = performance.now();
          const res = await fetch(`${target.replace(/\/$/, '')}/api/network-info`, { signal: AbortSignal.timeout(4000) });
          const ping = Math.round(performance.now() - t0);
          if (res.ok) {
            const info = await res.json();
            testStatus.innerHTML = `✅ Connected! Latency: ${ping}ms | Mode: <strong>${info.mode}</strong> | Room: <strong>${info.roomCode}</strong>`;
            testStatus.style.color = 'var(--success)';
          } else {
            testStatus.textContent = `⚠️ Server reachable but returned status ${res.status}`;
            testStatus.style.color = 'var(--warning)';
          }
        } catch (err) {
          testStatus.textContent = `❌ Could not connect (${err.message}). Verify IP and Wi-Fi network.`;
          testStatus.style.color = 'var(--error)';
        }
      });

      pushCloudBtn?.addEventListener('click', async () => {
        cloudStatus.textContent = '⏳ Pushing classroom data to central cloud...';
        cloudStatus.style.color = 'var(--muted)';
        try {
          const res = await window.Api?.post?.('/api/sync/cloud-push', { centralUrl: serverTargetInput.value.trim() });
          const data = await res?.json?.();
          if (res && res.ok) {
            cloudStatus.textContent = `✅ ${data?.message || 'Sync complete!'}`;
            cloudStatus.style.color = 'var(--success)';
          } else {
            cloudStatus.textContent = `❌ ${data?.error || 'Sync failed.'}`;
            cloudStatus.style.color = 'var(--error)';
          }
        } catch (e) {
          cloudStatus.textContent = `❌ Cloud push error: ${e.message}`;
          cloudStatus.style.color = 'var(--error)';
        }
      });

      pullCloudBtn?.addEventListener('click', async () => {
        cloudStatus.textContent = '⏳ Pulling updates from central cloud...';
        cloudStatus.style.color = 'var(--muted)';
        try {
          const res = await window.Api?.post?.('/api/sync/cloud-pull', { centralUrl: serverTargetInput.value.trim() });
          const data = await res?.json?.();
          if (res && res.ok) {
            cloudStatus.textContent = `✅ ${data?.message || 'Update complete!'}`;
            cloudStatus.style.color = 'var(--success)';
          } else {
            cloudStatus.textContent = `❌ ${data?.error || 'Update failed.'}`;
            cloudStatus.style.color = 'var(--error)';
          }
        } catch (e) {
          cloudStatus.textContent = `❌ Cloud pull error: ${e.message}`;
          cloudStatus.style.color = 'var(--error)';
        }
      });
    }

    // Font size slider
    document.getElementById('fontSize')?.addEventListener('input', (e) => {
      document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
    });

    // Language change
    document.getElementById('appLanguage')?.addEventListener('change', (e) => {
      window.I18n?.setLanguage(e.target.value);
    });
  }

  // Load current settings into UI
  function loadCurrentSettings() {
    const hardware = window.HardwareProfile?.getHardwareInfo() || {};
    const custom = hardware.customSettings || {};

    // Network target
    const currentTarget = localStorage.getItem('eduai_server_target') || '';
    const targetInput = document.getElementById('serverTargetInput');
    const modeSelect = document.getElementById('serverModeSelect');
    if (targetInput) targetInput.value = currentTarget;
    if (modeSelect) {
      if (!currentTarget) modeSelect.value = 'auto';
      else if (currentTarget.includes('192.168.') || currentTarget.includes(':3001')) modeSelect.value = 'lan';
      else modeSelect.value = 'cloud';
    }

    // Accessibility settings
    document.getElementById('highContrast').checked = localStorage.getItem('EduAI_highContrast') === 'true';
    document.getElementById('dyslexiaFont').checked = localStorage.getItem('EduAI_dyslexiaFont') === 'true';
    document.getElementById('screenReader').checked = localStorage.getItem('EduAI_screenReader') === 'true';
    document.getElementById('readAloud').checked = localStorage.getItem('EduAI_readAloud') === 'true';
    
    const fontSize = localStorage.getItem('EduAI_fontSize') || '16';
    document.getElementById('fontSize').value = fontSize;
    document.getElementById('fontSizeValue').textContent = `${fontSize}px`;

    // Custom settings
    if (Object.keys(custom).length > 0) {
      document.getElementById('overrideSettings').checked = true;
      document.getElementById('customSettings').style.display = 'block';
      if (custom.model) document.getElementById('customModel').value = custom.model;
      if (custom.contextLength) document.getElementById('customContext').value = custom.contextLength;
      if (custom.kvCacheType) document.getElementById('customKVCache').value = custom.kvCacheType;
      if (custom.streaming !== undefined) document.getElementById('customStreaming').checked = custom.streaming;
    }
  }

  // Save settings
  function save() {
    // Network settings
    const targetInput = document.getElementById('serverTargetInput');
    const targetVal = targetInput ? targetInput.value.trim() : '';
    if (window.Api?.setServerTarget) {
      window.Api.setServerTarget(targetVal || 'auto');
    }

    // Language settings
    const appLang = document.getElementById('appLanguage')?.value;
    const aiLang = document.getElementById('aiLanguage')?.value;
    const proficiency = document.getElementById('proficiencyLevel')?.value;
    
    if (appLang) window.I18n?.setLanguage(appLang);
    if (aiLang) window.I18n?.setAILanguage(aiLang);
    if (proficiency) window.I18n.proficiency = proficiency;

    // Performance settings
    const profile = document.getElementById('performanceProfile')?.value;
    const override = document.getElementById('overrideSettings')?.checked;
    
    if (override) {
      window.HardwareProfile?.setCustomSettings({
        profile,
        model: document.getElementById('customModel')?.value,
        contextLength: parseInt(document.getElementById('customContext')?.value),
        kvCacheType: document.getElementById('customKVCache')?.value,
        streaming: document.getElementById('customStreaming')?.checked
      });
    } else {
      window.HardwareProfile?.setCustomSettings({ profile });
    }

    // Accessibility settings
    localStorage.setItem('EduAI_highContrast', document.getElementById('highContrast')?.checked);
    localStorage.setItem('EduAI_dyslexiaFont', document.getElementById('dyslexiaFont')?.checked);
    localStorage.setItem('EduAI_screenReader', document.getElementById('screenReader')?.checked);
    localStorage.setItem('EduAI_readAloud', document.getElementById('readAloud')?.checked);
    localStorage.setItem('EduAI_fontSize', document.getElementById('fontSize')?.value);

    // Apply accessibility changes
    applyAccessibilitySettings();

    // Update UI
    window.I18n?.updateAllElements();
    
    window.Toast?.success('Settings saved');
    close();
  }

  // Apply accessibility settings
  function applyAccessibilitySettings() {
    const root = document.documentElement;
    
    // High contrast
    if (localStorage.getItem('EduAI_highContrast') === 'true') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dyslexia font
    if (localStorage.getItem('EduAI_dyslexiaFont') === 'true') {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }

    // Font size
    const fontSize = localStorage.getItem('EduAI_fontSize') || '16';
    root.style.fontSize = `${fontSize}px`;
  }

  // Toggle settings panel
  function toggle() {
    if (isOpen) close();
    else open();
  }

  // Export
  window.Settings = {
    open,
    close,
    save,
    toggle,
    applyAccessibilitySettings
  };

  // Apply saved accessibility settings on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAccessibilitySettings);
  } else {
    applyAccessibilitySettings();
  }

  console.log('Settings module loaded');
})();
