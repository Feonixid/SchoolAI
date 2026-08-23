// js/class-monitor.js
// ===================================================================
// REAL-TIME CLASS MONITORING
// Shows online students, active subjects, workspace status
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // SESSION TRACKING
  // ----------------------------------------------------------------
  if (!state.classMonitor) {
    state.classMonitor = {
      sessions: {},  // studentId -> { online, subject, workspace, lastSeen, queryCount }
      refreshRate: 5000
    };
  }

  // Update student session on activity
  function updateSession(studentId, data = {}) {
    if (!studentId) return;
    const sessions = state.classMonitor.sessions;
    if (!sessions[studentId]) {
      sessions[studentId] = { online: true, subject: null, workspace: null, lastSeen: Date.now(), queryCount: 0 };
    }
    Object.assign(sessions[studentId], { ...data, lastSeen: Date.now(), online: true });
  }

  // Track subject switches
  window.addEventListener('subjectSwitched', (e) => {
    const studentId = parseInt(localStorage.getItem('shqipai_logged_student'));
    if (studentId) updateSession(studentId, { subject: e.detail });
  });

  // Mark student online on any activity
  function heartbeat() {
    const studentId = parseInt(localStorage.getItem('shqipai_logged_student'));
    if (studentId) updateSession(studentId, {});
  }

  // Check for offline students (no activity for 5 minutes)
  function checkOffline() {
    const now = Date.now();
    Object.entries(state.classMonitor.sessions).forEach(([id, session]) => {
      if (now - session.lastSeen > 300000) {
        session.online = false;
      }
    });
  }

  setInterval(heartbeat, 30000);
  setInterval(checkOffline, 60000);

  // ----------------------------------------------------------------
  // MONITOR DASHBOARD
  // ----------------------------------------------------------------
  function openMonitor() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:6000;';

    function render() {
      const sessions = state.classMonitor.sessions;
      const students = state.students?.list || [];
      const onlineCount = Object.values(sessions).filter(s => s.online).length;
      const totalStudents = students.filter(s => s.status === 'active').length;
      const inWorkspace = Object.values(sessions).filter(s => s.online && s.workspace).length;

      // Subject distribution
      const subjectDist = {};
      Object.values(sessions).forEach(s => {
        if (s.online && s.subject) {
          subjectDist[s.subject] = (subjectDist[s.subject] || 0) + 1;
        }
      });

      overlay.innerHTML = `
        <div class="modal" style="width:800px;max-width:95vw;max-height:90vh;overflow-y:auto;padding:0;border-radius:14px">
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:20px 24px;color:white">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <h2 style="margin:0;font-size:20px">🖥️ Class Monitor</h2>
                <p style="margin:4px 0 0;font-size:13px;opacity:0.85">Real-time student activity</p>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <span style="font-size:12px;opacity:0.8">Auto-refresh: 5s</span>
                <button id="closeMonitor" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px">×</button>
              </div>
            </div>
          </div>

          <div style="padding:20px 24px">
            <!-- Status Cards -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
              <div style="padding:14px;background:#d1fae5;border-radius:10px;text-align:center">
                <div style="font-size:32px;font-weight:800;color:#065f46">${onlineCount}</div>
                <div style="font-size:11px;color:#065f46">Online Now</div>
              </div>
              <div style="padding:14px;background:#dbeafe;border-radius:10px;text-align:center">
                <div style="font-size:32px;font-weight:800;color:#1e40af">${totalStudents}</div>
                <div style="font-size:11px;color:#1e40af">Total Students</div>
              </div>
              <div style="padding:14px;background:#fef3c7;border-radius:10px;text-align:center">
                <div style="font-size:32px;font-weight:800;color:#92400e">${inWorkspace}</div>
                <div style="font-size:11px;color:#92400e">In Workspace</div>
              </div>
            </div>

            <!-- Subject Distribution -->
            ${Object.keys(subjectDist).length > 0 ? `
              <div style="margin-bottom:20px">
                <h3 style="margin:0 0 8px;font-size:14px">📚 Current Subject Distribution</h3>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${Object.entries(subjectDist).map(([subj, count]) => `
                    <span style="padding:4px 12px;background:var(--accent);color:white;border-radius:20px;font-size:12px;font-weight:600">
                      ${subj}: ${count}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Student List -->
            <h3 style="margin:0 0 8px;font-size:14px">👥 Students</h3>
            <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:8px 12px;background:#f8fafc;font-size:11px;font-weight:700;color:var(--muted)">
                <span>Name</span><span>Subject</span><span>Status</span><span>Last Seen</span>
              </div>
              <div style="max-height:300px;overflow-y:auto">
                ${students.filter(s => s.status === 'active').map(student => {
                  const session = sessions[student.id] || {};
                  const isOnline = session.online;
                  const statusDot = isOnline ? '🟢' : '🔴';
                  const statusText = session.workspace ? '📝 Working' : (isOnline ? 'Online' : 'Offline');
                  const lastSeen = session.lastSeen ? getRelativeTime(session.lastSeen) : 'Never';
                  const subject = session.subject || '—';

                  return `
                    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:8px 12px;border-top:1px solid var(--border);font-size:12px;align-items:center;
                      ${session.workspace ? 'background:rgba(245,158,11,0.05)' : ''}">
                      <span style="font-weight:600">${statusDot} ${student.name}</span>
                      <span style="color:var(--muted)">${subject}</span>
                      <span style="color:${isOnline ? '#059669' : '#ef4444'};font-weight:600">${statusText}</span>
                      <span style="color:var(--muted)">${lastSeen}</span>
                    </div>
                  `;
                }).join('') || '<div style="padding:20px;text-align:center;color:var(--muted)">No active students</div>'}
              </div>
            </div>
          </div>
        </div>
      `;

      overlay.querySelector('#closeMonitor')?.addEventListener('click', () => {
        clearInterval(refreshTimer);
        overlay.remove();
      });
    }

    render();
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) { clearInterval(refreshTimer); overlay.remove(); } });

    // Auto-refresh
    const refreshTimer = setInterval(() => {
      checkOffline();
      render();
    }, 5000);
  }

  function getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  // ----------------------------------------------------------------
  // ADD BUTTON TO TEACHER SIDEBAR
  // ----------------------------------------------------------------
  function addMonitorButton() {
    const teacherTools = document.getElementById('teacherToolsSection');
    if (!teacherTools || document.getElementById('classMonitorBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'classMonitorBtn';
    btn.style.cssText = 'width:100%;padding:9px 12px;background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;margin-top:6px';
    btn.innerHTML = '<span>🖥️</span> Class Monitor';
    btn.addEventListener('click', openMonitor);
    teacherTools.appendChild(btn);
  }

  window.addEventListener('teacherModeUnlocked', () => setTimeout(addMonitorButton, 300));

  window.ClassMonitor = {
    openMonitor,
    updateSession,
    getSessions: () => state.classMonitor.sessions
  };

  console.log('✅ Class Monitor module loaded');
})();
