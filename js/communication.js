// js/communication.js
// ===================================================================
// COMMUNICATION & MESSAGING SYSTEM
// Internal messaging and announcements
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error(' AppState not loaded!');
    return;
  }

  // Initialize communication in state
  if (!state.communication) {
    state.communication = {
      messages: [],
      announcements: []
    };
  }

  // API Base URL for backend sync
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
    ? (window.location.protocol + '//' + window.location.hostname + ':3001')
    : window.location.origin;

  // Get auth headers for API calls
  function getAuthHeaders() {
    const token = sessionStorage.getItem('EduAI_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Sync announcements with backend
  async function syncAnnouncementsWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      state.communication.announcements = data.announcements || [];
      console.log(' Announcements synced from backend:', state.communication.announcements.length);
    } catch (err) {
      console.warn('Could not sync announcements:', err.message);
    }
  }

  // Save announcement to backend
  async function saveAnnouncementToBackend(announcement) {
    if (!window.Accounts?.isLoggedIn()) return null;
    
    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      console.log(' Announcement saved to backend:', data.announcement);
      return data.announcement;
    } catch (err) {
      console.warn('Could not save announcement:', err.message);
      return null;
    }
  }

  // Delete announcement from backend
  async function deleteAnnouncementFromBackend(announcementId) {
    if (!window.Accounts?.isLoggedIn()) return false;
    
    try {
      const res = await fetch(`${API_BASE}/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      console.log(' Announcement deleted from backend');
      return true;
    } catch (err) {
      console.warn('Could not delete announcement:', err.message);
      return false;
    }
  }

  // Send message
  function sendMessage(to, subject, body) {
    const message = {
      id: Date.now(),
      from: 'Mësuesi',
      to,
      subject,
      body,
      timestamp: Date.now(),
      read: false
    };

    state.communication.messages.push(message);
    console.log(' Message sent:', message);
    return message;
  }

  // Create announcement (now async with backend sync)
  async function createAnnouncement(title, body, gradeLevel = null, priority = 'normal') {
    const announcement = {
      title,
      body,
      gradeLevel,
      priority
    };

    // Save to backend first
    const savedAnnouncement = await saveAnnouncementToBackend(announcement);
    
    if (savedAnnouncement) {
      state.communication.announcements.push(savedAnnouncement);
      console.log(' Announcement created:', savedAnnouncement);
      return savedAnnouncement;
    } else {
      // Fallback to local only
      announcement.id = Date.now();
      announcement.timestamp = Date.now();
      state.communication.announcements.push(announcement);
      console.log(' Announcement created (local only):', announcement);
      return announcement;
    }
  }

  // Get announcements
  function getAnnouncements(gradeLevel = null) {
    let announcements = [...state.communication.announcements];

    if (gradeLevel) {
      announcements = announcements.filter(a => !a.gradeLevel || a.gradeLevel === gradeLevel);
    }

    return announcements.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Open announcement board
  function openAnnouncementBoard() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    const user = window.Accounts?.getUser();
    const isTeacherOrAdmin = user?.accountType === 'teacher' || user?.accountType === 'admin' || (state.ui?.teacherMode && state.ui?.teacherModeUnlocked);

    modal.innerHTML = `
      <div class="modal" style="width:700px;max-width:95vw;max-height:90vh;overflow-y:auto;border-radius:14px;background:var(--panel);border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent);font-size:18px;font-weight:700">📢 Njoftime & Lajmërime</h3>
          <button class="icon-btn close-announcements" style="width:32px;height:32px;font-size:18px;border-radius:8px">×</button>
        </div>

        ${isTeacherOrAdmin ? `
          <button id="createAnnouncementBtn" class="btn-primary" style="width:100%;margin-bottom:16px;padding:10px 16px;border-radius:10px;font-weight:600">
            ➕ Krijo Njoftim të Ri
          </button>
        ` : `
          <div style="margin-bottom:14px;padding:8px 12px;background:var(--input-bg);border-radius:8px;font-size:12px;color:var(--muted)">
            ℹ️ Këtu shfaqen të gjitha njoftimet zyrtare nga mësuesit dhe drejtoria e shkollës.
          </div>
        `}

        <div id="announcementsList"></div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-announcements').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const createBtn = modal.querySelector('#createAnnouncementBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openAnnouncementForm();
      });
    }

    renderAnnouncements(modal.querySelector('#announcementsList'));
  }

  // Render announcements
  function renderAnnouncements(container) {
    const gradeLevel = state.academic.activeGrade;
    const announcements = getAnnouncements(gradeLevel);

    if (announcements.length === 0) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--muted);background:#f9fafb;border-radius:8px">
          Nuk ka njoftime.
        </div>
      `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:12px">';

    announcements.forEach(ann => {
      const priorityColors = {
        low: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
        normal: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        high: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
      };

      const colors = priorityColors[ann.priority] || priorityColors.normal;

      html += `
        <div style="padding:16px;background:${colors.bg};border-radius:10px;border-left:4px solid ${colors.border}">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
            <h4 style="margin:0;color:${colors.text};font-size:16px">${ann.title}</h4>
            <div style="font-size:11px;color:var(--muted)">
              ${new Date(ann.timestamp).toLocaleDateString('sq-AL')}
            </div>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.6;color:var(--text)">
            ${ann.body}
          </p>
          <div style="margin-top:8px;font-size:11px;color:var(--muted)">
            ${ann.gradeLevel ? `Klasa ${ann.gradeLevel}` : 'Të gjitha klasat'} • 
            ${ann.priority === 'high' ? '🔴 Prioritet i lartë' :
          ann.priority === 'normal' ? '🟡 Prioritet normal' :
            '🟢 Prioritet i ulët'}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // Open announcement form
  function openAnnouncementForm() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:550px;max-width:95vw">
        <h3 style="margin:0 0 16px;color:var(--accent)">📢 Krijo Njoftim</h3>

        <div style="margin-bottom:12px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Titulli</label>
          <input type="text" id="announcementTitle" placeholder="p.sh. Pushim i Parakohshëm Nesër"
                 style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                 background:#fff;font-size:14px" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Klasa</label>
            <select id="announcementGrade" style="width:100%;padding:10px;border-radius:8px;
                    border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
              <option value="">Të gjitha klasat</option>
              ${Array.from({ length: 12 }, (_, i) => i + 1).map(g =>
      `<option value="${g}">Klasa ${g}</option>`
    ).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Prioriteti</label>
            <select id="announcementPriority" style="width:100%;padding:10px;border-radius:8px;
                    border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
              <option value="low">🟢 I ulët</option>
              <option value="normal" selected>🟡 Normal</option>
              <option value="high">🔴 I lartë</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Përmbajtja</label>
          <textarea id="announcementBody" rows="5" placeholder="Shëno detajet e njoftimit..."
                    style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:14px;resize:vertical"></textarea>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-secondary close-announcement-form">Anulo</button>
          <button id="saveAnnouncement" class="btn-primary">📢 Publiko</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-announcement-form').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#saveAnnouncement').addEventListener('click', () => {
      const title = modal.querySelector('#announcementTitle').value.trim();
      const body = modal.querySelector('#announcementBody').value.trim();
      const gradeValue = modal.querySelector('#announcementGrade').value;
      const priority = modal.querySelector('#announcementPriority').value;

      if (!title || !body) {
        alert('⚠️ Ju lutem plotësoni të gjitha fushat.');
        return;
      }

      const gradeLevel = gradeValue ? parseInt(gradeValue) : null;
      createAnnouncement(title, body, gradeLevel, priority);
      alert('✅ Njoftimi u publikua me sukses!');
      modal.remove();
    });
  }

  // Add announcements button to teacher panel
  function initializeCommunicationUI() {
    const featureContainer = document.getElementById('teacherFeatureButtons');
    if (!featureContainer) return;

    if (document.getElementById('teacherAnnouncementsBtn')) return;

    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">📢 Komunikim</h3>
      <div class="quizControls">
        <button id="teacherAnnouncementsBtn" class="quizBtn">📢 Njoftime</button>
      </div>
    `;

    featureContainer.appendChild(section);

    document.getElementById('teacherAnnouncementsBtn')?.addEventListener('click', openAnnouncementBoard);
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(initializeCommunicationUI, 100);
          syncAnnouncementsWithBackend(); // Sync on teacher mode unlock
        }
      };
    }
  });

  // Sync on teacher mode unlocked event
  window.addEventListener('teacherModeUnlocked', () => {
    syncAnnouncementsWithBackend();
  });

  // Export
  window.Communication = {
    sendMessage,
    createAnnouncement,
    getAnnouncements,
    openAnnouncementBoard,
    syncAnnouncementsWithBackend,
    deleteAnnouncementFromBackend
  };

  console.log('✅ Communication module initialized');
})();