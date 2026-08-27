// js/attendance.js
// ===================================================================
// ATTENDANCE TRACKING SYSTEM
// Track student presence, absences, and tardiness
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Initialize attendance in state
  if (!state.attendance) {
    state.attendance = {
      records: [] // { id, studentId, date, status: 'present'|'absent'|'late', notes }
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

  // Sync attendance with backend
  async function syncAttendanceWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/attendance`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.attendance && data.attendance.length > 0) {
          state.attendance.records = data.attendance;
          console.log('✅ Attendance synced from backend');
        }
      }
    } catch (e) {
      console.warn('Could not sync attendance with backend:', e.message);
    }
  }

  // Save attendance to backend
  async function saveAttendanceToBackend(studentId, date, status, notes) {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ studentId, date, status, notes })
      });
      
      if (res.ok) {
        console.log('✅ Attendance saved to backend');
      }
    } catch (e) {
      console.warn('Could not save attendance to backend:', e.message);
    }
  }

  // Mark attendance for a student
  async function markAttendance(studentId, date, status, notes = '') {
    const record = {
      id: Date.now(),
      studentId,
      date: date || new Date().toISOString().split('T')[0],
      status,
      notes,
      timestamp: Date.now()
    };

    state.attendance.records.push(record);
    
    // Sync with backend
    await saveAttendanceToBackend(studentId, record.date, status, notes);
    
    console.log('✅ Attendance marked:', record);
    return record;
  }

  // Get attendance for a student
  function getStudentAttendance(studentId, startDate = null, endDate = null) {
    let records = state.attendance.records.filter(r => r.studentId === studentId);

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Get attendance statistics
  function getAttendanceStats(studentId) {
    const records = getStudentAttendance(studentId);

    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      attendanceRate: 0
    };

    if (stats.total > 0) {
      stats.attendanceRate = ((stats.present + stats.late) / stats.total * 100).toFixed(1);
    }

    return stats;
  }

  // Get class attendance for a date
  function getClassAttendance(gradeLevel, date) {
    const students = state.students.list.filter(s => s.gradeLevel === gradeLevel);
    const dateStr = date || new Date().toISOString().split('T')[0];

    return students.map(student => {
      const record = state.attendance.records.find(r =>
        r.studentId === student.id && r.date === dateStr
      );

      return {
        studentId: student.id,
        studentName: student.name,
        status: record ? record.status : null,
        notes: record ? record.notes : '',
        recordId: record ? record.id : null
      };
    });
  }

  // Open attendance tracker modal
  function openAttendanceTracker() {
    if (!state.academic.activeGrade) {
      alert('⚠️ Ju lutem zgjidhni një klasë.');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    const today = new Date().toISOString().split('T')[0];

    modal.innerHTML = `
      <div class="modal" style="width:700px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">📅 Prezenca - Klasa ${state.academic.activeGrade}</h3>
          <button class="icon-btn close-attendance" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
          <label style="font-size:14px;color:var(--muted)">Data:</label>
          <input type="date" id="attendanceDate" value="${today}" 
                 style="padding:8px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                 background:#fff;font-size:14px" />
          <button id="loadAttendance" class="btn-primary" style="padding:8px 16px">
            Ngarko
          </button>
        </div>

        <div id="attendanceList"></div>

        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-secondary close-attendance">Mbyll</button>
          <button id="saveAllAttendance" class="btn-primary">💾 Ruaj të Gjitha</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelectorAll('.close-attendance').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Load attendance
    function loadAttendance() {
      const date = modal.querySelector('#attendanceDate').value;
      const attendance = getClassAttendance(state.academic.activeGrade, date);
      renderAttendanceList(attendance, modal.querySelector('#attendanceList'));
    }

    modal.querySelector('#loadAttendance').addEventListener('click', loadAttendance);

    // Save all
    modal.querySelector('#saveAllAttendance').addEventListener('click', async () => {
      const date = modal.querySelector('#attendanceDate').value;
      const items = modal.querySelectorAll('.attendance-item');

      const promises = [];

      items.forEach(item => {
        const studentId = parseInt(item.dataset.studentId);
        const status = item.querySelector('.attendance-status').value;
        const notes = item.querySelector('.attendance-notes').value;

        if (status) {
          // Remove old record for this date
          state.attendance.records = state.attendance.records.filter(r =>
            !(r.studentId === studentId && r.date === date)
          );

          // Add new record (async)
          promises.push(markAttendance(studentId, date, status, notes));
        }
      });

      await Promise.all(promises);
      alert('✅ Prezenca u ruajt me sukses!');
    });

    // Initial load
    loadAttendance();
  }

  // Render attendance list
  function renderAttendanceList(attendance, container) {
    if (attendance.length === 0) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--muted)">
          Nuk ka nxënës në këtë klasë.
        </div>
      `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px">';

    attendance.forEach(record => {
      html += `
        <div class="attendance-item" data-student-id="${record.studentId}"
             style="padding:12px;background:#fff;border-radius:8px;border:1px solid rgba(15,33,56,0.10)">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
            <div style="flex:1;font-weight:600;font-size:14px">${record.studentName}</div>
            <select class="attendance-status" 
                    style="padding:6px 10px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:13px">
              <option value="">Zgjidhni...</option>
              <option value="present" ${record.status === 'present' ? 'selected' : ''}>✅ Prezent</option>
              <option value="absent" ${record.status === 'absent' ? 'selected' : ''}>❌ Mungon</option>
              <option value="late" ${record.status === 'late' ? 'selected' : ''}>⏰ Vonë</option>
            </select>
          </div>
          <input type="text" class="attendance-notes" placeholder="Shënime (opsionale)"
                 value="${record.notes || ''}"
                 style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(15,33,56,0.20);
                 background:#f9fafb;font-size:12px" />
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // Add attendance button to teacher panel
  function initializeAttendanceUI() {
    const featureContainer = document.getElementById('teacherFeatureButtons');
    if (!featureContainer) return;

    if (document.getElementById('attendanceBtn')) return;

    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">📅 Menaxhim & Ndjekje</h3>
      <div class="quizControls">
        <button id="attendanceBtn" class="quizBtn">📅 Shëno Prezencën</button>
      </div>
    `;

    featureContainer.appendChild(section);

    document.getElementById('attendanceBtn').addEventListener('click', openAttendanceTracker);
  }

  // Add attendance stats to student modal
  function enhanceStudentModalWithAttendance() {
    const originalOpenStudentModal = window.openStudentModal;
    if (!originalOpenStudentModal) return;

    window.openStudentModal = function (studentId) {
      originalOpenStudentModal(studentId);

      setTimeout(() => {
        const modal = document.getElementById('studentModal');
        if (!modal) return;

        if (modal.querySelector('#attendanceStats')) return;

        const stats = getAttendanceStats(studentId);
        const aiSection = modal.querySelector('#aiNotesDisplay');
        if (!aiSection || !aiSection.parentElement || !aiSection.parentElement.parentElement) return;

        const attendanceHTML = `
          <div id="attendanceStats" style="margin-top:16px">
            <h4 class="panel-title">📅 Statistika e Prezencës</h4>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">
              <div style="padding:8px;background:#d1fae5;border-radius:6px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#065f46">${stats.present}</div>
                <div style="font-size:11px;color:#065f46">Prezent</div>
              </div>
              <div style="padding:8px;background:#fee2e2;border-radius:6px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#991b1b">${stats.absent}</div>
                <div style="font-size:11px;color:#991b1b">Mungon</div>
              </div>
              <div style="padding:8px;background:#fef3c7;border-radius:6px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#92400e">${stats.late}</div>
                <div style="font-size:11px;color:#92400e">Vonë</div>
              </div>
              <div style="padding:8px;background:#dbeafe;border-radius:6px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#1e40af">${stats.attendanceRate}%</div>
                <div style="font-size:11px;color:#1e40af">Pjesëmarrje</div>
              </div>
            </div>
          </div>
        `;

        aiSection.parentElement.parentElement.insertAdjacentHTML('beforeend', attendanceHTML);
      }, 150);
    };
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    enhanceStudentModalWithAttendance();

    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(initializeAttendanceUI, 100);
        }
      };
    }
  });

  // Export
  window.Attendance = {
    markAttendance,
    getStudentAttendance,
    getAttendanceStats,
    getClassAttendance,
    openAttendanceTracker,
    syncAttendanceWithBackend
  };

  console.log('✅ Attendance module initialized');
})();