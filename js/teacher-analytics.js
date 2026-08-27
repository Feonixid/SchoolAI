// js/teacher-analytics.js
// ===================================================================
// TEACHER ANALYTICS DASHBOARD
// Heatmaps, weak-area detection, time tracking, query analysis
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // DATA COLLECTION — tracks every student interaction
  // ----------------------------------------------------------------
  if (!state.analytics) {
    state.analytics = {
      queries: [],        // { timestamp, studentId, subject, topic, grade }
      timeSpent: {},      // { subjectId: totalMs }
      topicHits: {},      // { "subject:topic": count }
      weakAreas: [],      // detected weak spots
      sessionStart: Date.now()
    };
  }

  let subjectTimer = null;
  let currentSubjectStart = Date.now();

  // Track subject time
  window.addEventListener('subjectSwitched', (e) => {
    const elapsed = Date.now() - currentSubjectStart;
    const prevSubject = state.analytics._lastSubject || 'shqip';
    state.analytics.timeSpent[prevSubject] = (state.analytics.timeSpent[prevSubject] || 0) + elapsed;
    state.analytics._lastSubject = e.detail;
    currentSubjectStart = Date.now();
  });

  // Track queries
  function trackQuery(studentId, subject, message, grade) {
    const entry = {
      timestamp: Date.now(),
      studentId: studentId || 'anonymous',
      subject: subject,
      message: message.substring(0, 200),
      grade: grade || null
    };
    state.analytics.queries.push(entry);

    // Keep last 1000 queries
    if (state.analytics.queries.length > 1000) {
      state.analytics.queries = state.analytics.queries.slice(-1000);
    }

    // Topic hit counting
    const topicKey = `${subject}:general`;
    state.analytics.topicHits[topicKey] = (state.analytics.topicHits[topicKey] || 0) + 1;

    // Persist
    try {
      localStorage.setItem('EduAI_analytics', JSON.stringify(state.analytics));
    } catch (e) { /* storage full */ }
  }

  // Restore from localStorage
  try {
    const saved = localStorage.getItem('EduAI_analytics');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state.analytics, parsed);
    }
  } catch (e) { /* ignore */ }

  // ----------------------------------------------------------------
  // OPEN ANALYTICS DASHBOARD
  // ----------------------------------------------------------------
  function openDashboard() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:6000;';

    const queries = state.analytics.queries || [];
    const timeSpent = state.analytics.timeSpent || {};
    const students = state.students?.list || [];

    // Calculate stats
    const totalQueries = queries.length;
    const uniqueStudents = new Set(queries.map(q => q.studentId)).size;
    const subjectBreakdown = {};
    queries.forEach(q => {
      subjectBreakdown[q.subject] = (subjectBreakdown[q.subject] || 0) + 1;
    });

    // Time breakdown
    const totalTime = Object.values(timeSpent).reduce((s, v) => s + v, 0);

    // Hourly activity (last 7 days)
    const now = Date.now();
    const weekQueries = queries.filter(q => now - q.timestamp < 7 * 86400000);
    const hourlyActivity = new Array(24).fill(0);
    weekQueries.forEach(q => {
      const hour = new Date(q.timestamp).getHours();
      hourlyActivity[hour]++;
    });
    const maxHourly = Math.max(...hourlyActivity, 1);

    // Weak areas: subjects with high question frequency but repeated topics
    const weakAreas = Object.entries(subjectBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([subject, count]) => ({ subject, count, pct: totalQueries > 0 ? Math.round(count / totalQueries * 100) : 0 }));

    overlay.innerHTML = `
      <div class="modal" style="width:900px;max-width:95vw;max-height:92vh;overflow-y:auto;padding:0;border-radius:14px">
        <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:20px 24px;color:white">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h2 style="margin:0;font-size:20px">📊 Teaching Analytics</h2>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.85">Insights from student interactions</p>
            </div>
            <button id="closeAnalytics" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px">×</button>
          </div>
        </div>

        <div style="padding:20px 24px">
          <!-- Stats Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px">
            <div style="padding:16px;background:#dbeafe;border-radius:10px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:#1e40af">${totalQueries}</div>
              <div style="font-size:11px;color:#1e40af;margin-top:2px">Total Queries</div>
            </div>
            <div style="padding:16px;background:#d1fae5;border-radius:10px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:#065f46">${uniqueStudents}</div>
              <div style="font-size:11px;color:#065f46;margin-top:2px">Active Students</div>
            </div>
            <div style="padding:16px;background:#ede9fe;border-radius:10px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:#5b21b6">${Object.keys(subjectBreakdown).length}</div>
              <div style="font-size:11px;color:#5b21b6;margin-top:2px">Subjects Used</div>
            </div>
            <div style="padding:16px;background:#fef3c7;border-radius:10px;text-align:center">
              <div style="font-size:28px;font-weight:800;color:#92400e">${Math.round(totalTime / 60000)}m</div>
              <div style="font-size:11px;color:#92400e;margin-top:2px">Total Time</div>
            </div>
          </div>

          <!-- Activity Heatmap -->
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 12px;font-size:15px">🕐 Activity by Hour (Last 7 Days)</h3>
            <div style="display:flex;gap:2px;align-items:flex-end;height:80px;padding:0 4px">
              ${hourlyActivity.map((count, hour) => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
                  <div style="width:100%;background:${count > 0 ? `rgba(37,99,235,${0.2 + (count/maxHourly)*0.8})` : '#f1f5f9'};
                    height:${Math.max(4, (count/maxHourly)*70)}px;border-radius:3px;transition:height 0.3s" title="${count} queries at ${hour}:00"></div>
                  <span style="font-size:8px;color:var(--muted)">${hour % 4 === 0 ? hour + ':00' : ''}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Subject Breakdown -->
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 12px;font-size:15px">📚 Questions by Subject</h3>
            ${weakAreas.length > 0 ? weakAreas.map(wa => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="font-size:13px;min-width:120px;font-weight:600">${wa.subject}</span>
                <div style="flex:1;height:20px;background:#f1f5f9;border-radius:10px;overflow:hidden">
                  <div style="height:100%;width:${wa.pct}%;background:linear-gradient(90deg,#2563eb,#7c3aed);border-radius:10px;transition:width 0.5s"></div>
                </div>
                <span style="font-size:12px;color:var(--muted);min-width:60px;text-align:right">${wa.count} (${wa.pct}%)</span>
              </div>
            `).join('') : '<p style="color:var(--muted);font-size:13px">No data yet. Students need to start asking questions.</p>'}
          </div>

          <!-- Weak Areas Alert -->
          ${weakAreas.length > 0 ? `
            <div style="padding:14px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca;margin-bottom:24px">
              <h4 style="margin:0 0 8px;color:#991b1b;font-size:14px">⚠️ Potential Weak Areas</h4>
              <p style="margin:0;font-size:12px;color:#7f1d1d">
                Students are asking the most about <strong>${weakAreas[0]?.subject || 'N/A'}</strong>
                (${weakAreas[0]?.count || 0} questions). Consider dedicating extra class time or setting the Active Focus there.
              </p>
            </div>
          ` : ''}

          <!-- Recent Queries -->
          <div>
            <h3 style="margin:0 0 12px;font-size:15px">💬 Recent Student Queries</h3>
            <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
              ${queries.slice(-20).reverse().map(q => `
                <div style="padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px;display:flex;gap:8px">
                  <span style="color:var(--muted);min-width:50px">${new Date(q.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                  <span style="color:var(--accent);min-width:80px;font-weight:600">${q.subject}</span>
                  <span style="flex:1;color:var(--text)">${q.message}</span>
                </div>
              `).join('') || '<div style="padding:20px;text-align:center;color:var(--muted)">No queries recorded yet.</div>'}
            </div>
          </div>

          <!-- Export Button -->
          <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
            <button id="exportAnalytics" class="btn-secondary" style="font-size:12px">📥 Export CSV</button>
            <button id="clearAnalytics" class="btn-secondary" style="font-size:12px;color:#ef4444">🗑️ Clear Data</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#closeAnalytics').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#exportAnalytics')?.addEventListener('click', () => {
      exportAnalyticsCSV();
    });

    overlay.querySelector('#clearAnalytics')?.addEventListener('click', () => {
      if (confirm('Clear all analytics data? This cannot be undone.')) {
        state.analytics.queries = [];
        state.analytics.timeSpent = {};
        state.analytics.topicHits = {};
        localStorage.removeItem('EduAI_analytics');
        overlay.remove();
        window.Toast?.success('Analytics data cleared');
      }
    });
  }

  // ----------------------------------------------------------------
  // EXPORT CSV
  // ----------------------------------------------------------------
  function exportAnalyticsCSV() {
    const queries = state.analytics.queries || [];
    let csv = 'Timestamp,Student,Subject,Grade,Message\n';
    queries.forEach(q => {
      csv += `"${new Date(q.timestamp).toISOString()}","${q.studentId}","${q.subject}","${q.grade || ''}","${(q.message || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------------------
  // ADD BUTTON TO TEACHER SIDEBAR
  // ----------------------------------------------------------------
  function addAnalyticsButton() {
    const teacherTools = document.getElementById('teacherToolsSection');
    if (!teacherTools || document.getElementById('analyticsBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'analyticsBtn';
    btn.style.cssText = 'width:100%;padding:9px 12px;background:linear-gradient(135deg,#1e40af,#7c3aed);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;margin-top:6px';
    btn.innerHTML = '<span>📊</span> Teaching Analytics';
    btn.addEventListener('click', openDashboard);
    teacherTools.appendChild(btn);
  }

  // Init
  window.addEventListener('teacherModeUnlocked', () => setTimeout(addAnalyticsButton, 200));

  window.TeacherAnalytics = {
    openDashboard,
    trackQuery,
    exportCSV: exportAnalyticsCSV,
    getData: () => state.analytics
  };

  console.log('✅ Teacher Analytics module loaded');
})();
