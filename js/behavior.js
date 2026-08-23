// js/behavior.js
// ===================================================================
// BEHAVIORAL NOTES & CONDUCT TRACKING
// Track student behavior, participation, and conduct
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Initialize behavior in state
  if (!state.behavior) {
    state.behavior = {
      notes: [], // { id, studentId, date, type, severity, description, timestamp }
      conductScores: {} // { studentId: { semester1: score, semester2: score, semester3: score } }
    };
  }

  // API Base URL for backend sync
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
    ? (window.location.protocol + '//' + window.location.hostname + ':3001')
    : window.location.origin;

  // Get auth headers for API calls
  function getAuthHeaders() {
    const token = sessionStorage.getItem('shqipai_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Sync behavior with backend
  async function syncBehaviorWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/behavior`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.behavior && data.behavior.length > 0) {
          state.behavior.notes = data.behavior;
          console.log('✅ Behavior synced from backend');
        }
      }
    } catch (e) {
      console.warn('Could not sync behavior with backend:', e.message);
    }
  }

  // Save behavior note to backend
  async function saveBehaviorToBackend(studentId, type, description, severity) {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/behavior`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ studentId, type, description, severity })
      });
      
      if (res.ok) {
        console.log('✅ Behavior note saved to backend');
      }
    } catch (e) {
      console.warn('Could not save behavior to backend:', e.message);
    }
  }

  // Behavior types
  const BEHAVIOR_TYPES = {
    positive: { label: 'Pozitiv', color: '#16a34a', icon: '✅' },
    negative: { label: 'Negativ', color: '#dc2626', icon: '❌' },
    neutral: { label: 'Neutral', color: '#6b7280', icon: '📝' },
    participation: { label: 'Pjesëmarrje', color: '#3b82f6', icon: '🙋' },
    discipline: { label: 'Disiplinë', color: '#f59e0b', icon: '⚠️' }
  };

  // Add behavior note
  async function addBehaviorNote(studentId, type, description, severity = 'medium') {
    const note = {
      id: Date.now(),
      studentId,
      date: new Date().toISOString().split('T')[0],
      type,
      severity, // low, medium, high
      description,
      timestamp: Date.now()
    };

    state.behavior.notes.push(note);
    
    // Sync with backend
    await saveBehaviorToBackend(studentId, type, description, severity);
    
    console.log('✅ Behavior note added:', note);
    return note;
  }

  // Get behavior notes for student
  function getStudentBehaviorNotes(studentId) {
    return state.behavior.notes
      .filter(n => n.studentId === studentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Set conduct score
  function setConductScore(studentId, semester, score) {
    if (!state.behavior.conductScores[studentId]) {
      state.behavior.conductScores[studentId] = {};
    }
    state.behavior.conductScores[studentId][semester] = score;
    console.log(`✅ Conduct score set: Student ${studentId}, ${semester}: ${score}`);
  }

  // Get conduct score
  function getConductScore(studentId, semester) {
    return state.behavior.conductScores[studentId]?.[semester] || null;
  }

  // Calculate behavior summary
  function getBehaviorSummary(studentId) {
    const notes = getStudentBehaviorNotes(studentId);

    const summary = {
      total: notes.length,
      positive: notes.filter(n => n.type === 'positive').length,
      negative: notes.filter(n => n.type === 'negative').length,
      neutral: notes.filter(n => n.type === 'neutral').length,
      participation: notes.filter(n => n.type === 'participation').length,
      discipline: notes.filter(n => n.type === 'discipline').length,
      conductScores: state.behavior.conductScores[studentId] || {},
      recentNotes: notes.slice(0, 5)
    };

    // Calculate overall conduct trend
    const positiveRatio = summary.total > 0 ? (summary.positive / summary.total * 100) : 0;
    summary.overallTrend = positiveRatio >= 70 ? 'excellent' :
      positiveRatio >= 50 ? 'good' :
        positiveRatio >= 30 ? 'fair' : 'needs-improvement';

    return summary;
  }

  // Open behavior tracker
  function openBehaviorTracker(studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:650px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">🎯 Sjellja - ${student.name}</h3>
          <button class="icon-btn close-behavior" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div style="margin-bottom:16px">
          <h4 class="panel-title">Shto Shënim të Ri</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <select id="behaviorType" style="padding:8px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:13px">
              ${Object.entries(BEHAVIOR_TYPES).map(([key, val]) =>
      `<option value="${key}">${val.icon} ${val.label}</option>`
    ).join('')}
            </select>
            <select id="behaviorSeverity" style="padding:8px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:13px">
              <option value="low">I ulët</option>
              <option value="medium" selected>Mesatar</option>
              <option value="high">I lartë</option>
            </select>
          </div>
          <textarea id="behaviorDescription" rows="3" placeholder="Përshkrimi i sjelljes..."
                    style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:13px;resize:vertical"></textarea>
          <button id="addBehaviorNote" class="btn-primary" style="margin-top:8px;width:100%">
            ➕ Shto Shënim
          </button>
        </div>

        <div style="margin-bottom:16px">
          <h4 class="panel-title">Notat e Sjelljes</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
            ${['semester1', 'semester2', 'semester3'].map((sem, idx) => {
      const score = getConductScore(studentId, sem);
      return `
                <div>
                  <label style="display:block;font-size:11px;color:var(--muted);margin-bottom:4px">
                    Semestri ${idx + 1}
                  </label>
                  <input type="number" class="conduct-score" data-semester="${sem}" 
                         value="${score !== null ? score : ''}" min="0" max="10" step="0.5"
                         placeholder="0-10"
                         style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                         background:#fff;font-size:13px" />
                </div>
              `;
    }).join('')}
          </div>
        </div>

        <div>
          <h4 class="panel-title">Historiku i Sjelljes</h4>
          <div id="behaviorHistory" style="max-height:300px;overflow-y:auto"></div>
        </div>

        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-secondary close-behavior">Mbyll</button>
          <button id="saveConductScores" class="btn-primary">💾 Ruaj Notat</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close
    modal.querySelectorAll('.close-behavior').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Add note
    modal.querySelector('#addBehaviorNote').addEventListener('click', async () => {
      const type = modal.querySelector('#behaviorType').value;
      const severity = modal.querySelector('#behaviorSeverity').value;
      const description = modal.querySelector('#behaviorDescription').value.trim();

      if (!description) {
        alert('⚠️ Ju lutem vendosni përshkrimin.');
        return;
      }

      await addBehaviorNote(studentId, type, description, severity);
      modal.querySelector('#behaviorDescription').value = '';
      renderBehaviorHistory(studentId, modal.querySelector('#behaviorHistory'));
      alert('✅ Shënimi u shtua me sukses!');
    });

    // Save conduct scores
    modal.querySelector('#saveConductScores').addEventListener('click', () => {
      modal.querySelectorAll('.conduct-score').forEach(input => {
        const semester = input.dataset.semester;
        const score = parseFloat(input.value);

        if (!isNaN(score) && score >= 0 && score <= 10) {
          setConductScore(studentId, semester, score);
        }
      });
      alert('✅ Notat e sjelljes u ruajtën!');
    });

    // Render history
    renderBehaviorHistory(studentId, modal.querySelector('#behaviorHistory'));
  }

  // Render behavior history
  function renderBehaviorHistory(studentId, container) {
    const notes = getStudentBehaviorNotes(studentId);

    if (notes.length === 0) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--muted);background:#f9fafb;border-radius:8px">
          Nuk ka shënime ende.
        </div>
      `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px">';

    notes.forEach(note => {
      const typeInfo = BEHAVIOR_TYPES[note.type] || BEHAVIOR_TYPES.neutral;
      const severityColor = note.severity === 'high' ? '#dc2626' :
        note.severity === 'medium' ? '#f59e0b' : '#6b7280';

      html += `
        <div style="padding:10px;background:#fff;border-radius:8px;border-left:4px solid ${typeInfo.color}">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
            <div style="font-size:13px;font-weight:600;color:${typeInfo.color}">
              ${typeInfo.icon} ${typeInfo.label}
            </div>
            <div style="font-size:11px;color:var(--muted)">
              ${new Date(note.date).toLocaleDateString('sq-AL')}
            </div>
          </div>
          <div style="font-size:13px;line-height:1.4;color:var(--text)">
            ${note.description}
          </div>
          <div style="margin-top:6px;font-size:11px;color:${severityColor};font-weight:600">
            ${note.severity === 'high' ? '🔴 Prioritet i lartë' :
          note.severity === 'medium' ? '🟡 Prioritet mesatar' :
            '🟢 Prioritet i ulët'}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // Add behavior summary to student modal
  function enhanceStudentModalWithBehavior() {
    const originalOpenStudentModal = window.openStudentModal;
    if (!originalOpenStudentModal) return;

    window.openStudentModal = function (studentId) {
      originalOpenStudentModal(studentId);

      setTimeout(() => {
        const modal = document.getElementById('studentModal');
        if (!modal) return;

        if (modal.querySelector('#behaviorSummary')) return;

        const summary = getBehaviorSummary(studentId);
        const attendanceStats = modal.querySelector('#attendanceStats');
        if (!attendanceStats) return;

        const behaviorHTML = `
          <div id="behaviorSummary" style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h4 class="panel-title" style="margin:0">🎯 Sjellja & Konduita</h4>
              <button id="openBehaviorTracker" class="btn-primary" 
                      style="padding:4px 10px;font-size:12px;border-radius:6px">
                📝 Menaxho
              </button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
              <div style="padding:8px;background:#d1fae5;border-radius:6px;text-align:center">
                <div style="font-size:18px;font-weight:700;color:#065f46">${summary.positive}</div>
                <div style="font-size:11px;color:#065f46">Pozitiv</div>
              </div>
              <div style="padding:8px;background:#dbeafe;border-radius:6px;text-align:center">
                <div style="font-size:18px;font-weight:700;color:#1e40af">${summary.participation}</div>
                <div style="font-size:11px;color:#1e40af">Pjesëmarrje</div>
              </div>
              <div style="padding:8px;background:#fee2e2;border-radius:6px;text-align:center">
                <div style="font-size:18px;font-weight:700;color:#991b1b">${summary.negative}</div>
                <div style="font-size:11px;color:#991b1b">Negativ</div>
              </div>
            </div>
            ${summary.recentNotes.length > 0 ? `
              <div style="font-size:12px;color:var(--muted);margin-top:8px">
                Shënimi më i fundit: ${summary.recentNotes[0].description.substring(0, 60)}...
              </div>
            ` : ''}
          </div>
        `;

        attendanceStats.insertAdjacentHTML('afterend', behaviorHTML);

        // Wire button
        modal.querySelector('#openBehaviorTracker').addEventListener('click', () => {
          openBehaviorTracker(studentId);
        });
      }, 200);
    };
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    enhanceStudentModalWithBehavior();
    syncBehaviorWithBackend();
  });

  // Export
  window.Behavior = {
    addBehaviorNote,
    getStudentBehaviorNotes,
    setConductScore,
    getConductScore,
    getBehaviorSummary,
    openBehaviorTracker,
    syncBehaviorWithBackend
  };

  console.log('✅ Behavior module initialized');
})();