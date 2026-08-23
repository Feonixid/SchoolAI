// js/student-dashboard.js
// ===================================================================
// STUDENT PORTAL & COMPREHENSIVE SCHOOL COMMAND CENTER
// Unified student hub: Announcements, Homework, Interactive Labs,
// Practice Tests, Classes, Attendance, Gamification, and Study Planner.
// ===================================================================

(function () {
  'use strict';

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
    ? (window.location.protocol + '//' + window.location.hostname + ':3001')
    : window.location.origin;

  function getAuthHeaders() {
    const token = sessionStorage.getItem('shqipai_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async function fetchJson(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { headers: { ...getAuthHeaders() } });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  // ----------------------------------------------------------------
  // OPEN DASHBOARD
  // ----------------------------------------------------------------
  async function openDashboard(initialTab = 'overview') {
    const user = (window.Accounts && window.Accounts.isLoggedIn())
      ? window.Accounts.getUser()
      : { username: 'Nxënës', firstName: 'Student', accountType: 'student' };

    if (user.accountType === 'teacher' || user.accountType === 'admin') {
      window.Toast?.info('Teachers use the teacher sidebar and dashboard for class management.');
    }

    // Remove existing if any
    document.getElementById('studentPortalOverlay')?.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'studentPortalOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:5000;background:rgba(0,0,0,0.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;';
    overlay.innerHTML = `
      <div class="modal" style="width:920px;max-width:96vw;max-height:92vh;overflow-y:auto;padding:0;border-radius:20px;box-shadow:0 28px 64px rgba(0,0,0,0.3);border:1px solid var(--border);background:var(--panel);display:flex;flex-direction:column">
        
        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed,#ec4899);padding:24px 30px;color:white;position:relative;flex-shrink:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
                🎓
              </div>
              <div>
                <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">Student Portal &amp; School Hub</h2>
                <p style="margin:3px 0 0;font-size:13.5px;opacity:0.92;font-weight:500">${user.firstName || user.username} · ${user.gradeLevel ? `Klasa ${user.gradeLevel}` : 'Nxënës'} · EduAI Next-Gen</p>
              </div>
            </div>
            <button id="closeDashboard" style="background:rgba(255,255,255,0.2);border:none;color:white;width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:background 0.2s">×</button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div style="padding:16px 28px 0;background:var(--panel);border-bottom:1px solid var(--border);flex-shrink:0">
          <div id="dashboardTabs" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none">
            <button class="dash-tab ${initialTab === 'overview' ? 'active' : ''}" data-tab="overview">📊 Përmbledhje</button>
            <button class="dash-tab ${initialTab === 'announcements' ? 'active' : ''}" data-tab="announcements">📢 Njoftime</button>
            <button class="dash-tab ${initialTab === 'assignments' ? 'active' : ''}" data-tab="assignments">📝 Detyrat</button>
            <button class="dash-tab ${initialTab === 'labs' ? 'active' : ''}" data-tab="labs">🔬 Laboratori</button>
            <button class="dash-tab ${initialTab === 'practice' ? 'active' : ''}" data-tab="practice">🧪 Provime &amp; Kuice</button>
            <button class="dash-tab ${initialTab === 'classes' ? 'active' : ''}" data-tab="classes">🏫 Lëndët</button>
            <button class="dash-tab ${initialTab === 'planner' ? 'active' : ''}" data-tab="planner">📅 Plani i Studimit</button>
            <button class="dash-tab ${initialTab === 'attendance' ? 'active' : ''}" data-tab="attendance">📋 Prezenca</button>
            <button class="dash-tab ${initialTab === 'points' ? 'active' : ''}" data-tab="points">🏆 Pikët</button>
          </div>
        </div>

        <!-- Body Content Area -->
        <div style="padding:24px 28px;flex:1;overflow-y:auto">
          <div id="dashboardContent" style="min-height:280px">
            <div style="text-align:center;padding:40px;color:var(--muted)">Duke ngarkuar të dhënat...</div>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Style tabs
    const style = document.createElement('style');
    style.textContent = `
      .dash-tab { padding:7px 14px; border-radius:12px; border:1px solid var(--border);
        background:var(--input-bg); color:var(--text); cursor:pointer; font-size:12.5px;
        font-weight:600; font-family:inherit; transition:all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1); white-space:nowrap; display:flex; align-items:center; gap:6px; }
      .dash-tab.active { background:var(--accent,#4f46e5); color:white; border-color:var(--accent,#4f46e5); box-shadow:0 2px 8px rgba(79,70,229,0.3); }
      .dash-tab:hover:not(.active) { background:var(--hover-bg); border-color:var(--accent); }
      .dash-stat { padding:16px; border-radius:14px; text-align:center; border:1px solid transparent; transition:transform 0.2s; }
      .dash-stat:hover { transform:translateY(-2px); }
      .dash-stat-value { font-size:28px; font-weight:800; letter-spacing:-0.5px; }
      .dash-stat-label { font-size:12px; margin-top:4px; font-weight:600; opacity:0.9; }
      .class-card {
        padding:16px; border-radius:14px; border:1px solid var(--border);
        background:var(--input-bg); transition:all 0.2s ease; display:flex;
        justify-content:space-between; align-items:center; gap:12px;
      }
      .class-card:hover { border-color:var(--accent); transform:translateY(-2px); box-shadow:0 6px 16px var(--shadow); }
      .quick-action-card {
        padding:18px; border-radius:14px; border:1px solid var(--border);
        background:var(--input-bg); cursor:pointer; transition:all 0.2s ease; display:flex;
        flex-direction:column; gap:8px;
      }
      .quick-action-card:hover { border-color:var(--accent); transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.08); }
    `;
    overlay.appendChild(style);

    // Close listeners
    overlay.querySelector('#closeDashboard').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Tab switching
    overlay.querySelectorAll('.dash-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTab(btn.dataset.tab, overlay.querySelector('#dashboardContent'), overlay);
      });
    });

    // Load initial tab
    loadTab(initialTab, overlay.querySelector('#dashboardContent'), overlay);
  }

  // ----------------------------------------------------------------
  // TAB LOADERS
  // ----------------------------------------------------------------
  async function loadTab(tab, container, overlay) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Duke ngarkuar...</div>';

    switch (tab) {
      case 'overview': return renderOverview(container, overlay);
      case 'announcements': return renderAnnouncements(container);
      case 'assignments': return renderAssignments(container, overlay);
      case 'labs': return renderLabs(container, overlay);
      case 'practice': return renderPractice(container, overlay);
      case 'classes': return renderClasses(container, overlay);
      case 'planner': return renderPlanner(container, overlay);
      case 'attendance': return renderAttendance(container);
      case 'points': return renderPoints(container);
    }
  }

  function getLocalStudentId() {
    const user = window.Accounts?.getUser();
    return user ? (user.id || user.username) : 'local_student';
  }

  // ----------------------------------------------------------------
  // 1. OVERVIEW
  // ----------------------------------------------------------------
  async function renderOverview(container, overlay) {
    const [att, gam, assign, annData] = await Promise.all([
      fetchJson('/api/my-attendance'),
      fetchJson('/api/my-gamification'),
      fetchJson('/api/my-assignments'),
      fetchJson('/api/announcements')
    ]);

    const studentId = getLocalStudentId();
    const localProgress = window.AppState?.gamification?.studentProgress?.[studentId] || {};
    const localAttendance = window.Attendance?.getAttendanceStats ? window.Attendance.getAttendanceStats(studentId) : null;

    const stats = att?.stats || localAttendance || { present: 0, absent: 0, late: 0, rate: 100 };
    const points = gam?.progress?.points ?? localProgress.points ?? 120;
    const achievements = gam?.progress?.achievements?.length ?? localProgress.achievements?.length ?? 2;
    
    const allAssignments = assign?.assignments || window.AppState?.assignments?.list || [];
    const submissions = assign?.submissions || [];
    const pending = allAssignments.filter(a => !submissions.find(s => s.assignmentId === a.id)).length;
    const announcements = annData?.announcements || window.AppState?.communication?.announcements || [];

    container.innerHTML = `
      <!-- Stats Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px">
        <div class="dash-stat" style="background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.3)">
          <div class="dash-stat-value" style="color:#059669">${stats.rate || stats.attendanceRate || 100}%</div>
          <div class="dash-stat-label" style="color:#059669">Prezenca në Mësim</div>
        </div>
        <div class="dash-stat" style="background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.3)">
          <div class="dash-stat-value" style="color:#4f46e5">${points} XP</div>
          <div class="dash-stat-label" style="color:#4f46e5">Pikë &amp; Progres</div>
        </div>
        <div class="dash-stat" style="background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.3)">
          <div class="dash-stat-value" style="color:#d97706">${pending}</div>
          <div class="dash-stat-label" style="color:#d97706">Detyra në Pritje</div>
        </div>
        <div class="dash-stat" style="background:rgba(168,85,247,0.12);border-color:rgba(168,85,247,0.3)">
          <div class="dash-stat-value" style="color:#7c3aed">${achievements} 🏆</div>
          <div class="dash-stat-label" style="color:#7c3aed">Distinktivë</div>
        </div>
      </div>

      <!-- Hub Quick Launch Grid -->
      <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:var(--text)">🚀 Shkurtesa të Shpejta të Shkollës</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px">
        
        <div class="quick-action-card" id="quickLaunchLab">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">🔬</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Laboratori Shkencor</div>
              <div style="font-size:12px;color:var(--muted)">Simulime interaktive</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchPractice">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">🧪</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Provim Provues AI</div>
              <div style="font-size:12px;color:var(--muted)">Gjenero test nga lënda</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchFocus">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">⏱️</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Koha e Fokusit</div>
              <div style="font-size:12px;color:var(--muted)">Timer Pomodoro &amp; Notat</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchHomework">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">📝</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Detyrat e Shtëpisë</div>
              <div style="font-size:12px;color:var(--muted)">${pending} detyra për dorëzim</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchEssay">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">✍️</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Studio e Eseve &amp; Shkrimit</div>
              <div style="font-size:12px;color:var(--muted)">Vlerësim rubrikash &amp; këshilla</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchBattle">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">⚔️</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Arena e Betejës (Quiz)</div>
              <div style="font-size:12px;color:var(--muted)">Betejë 60s &amp; XP shpërblime</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchSpeech">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">🗣️</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">AI Trajneri i Shqiptimit</div>
              <div style="font-size:12px;color:var(--muted)">Praktikë fonetike në 5 gjuhë</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchRoadmap">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">🗺️</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Harta e Dijes &amp; Rrugët</div>
              <div style="font-size:12px;color:var(--muted)">Pema e aftësive &amp; progresi</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchChallenges">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">🏆</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Sfidat &amp; Ushtrimet</div>
              <div style="font-size:12px;color:var(--muted)">Zgjidh probleme &amp; fito XP</div>
            </div>
          </div>
        </div>

        <div class="quick-action-card" id="quickLaunchCalendar">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">📅</span>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">Kalendari &amp; Orari</div>
              <div style="font-size:12px;color:var(--muted)">Provimet, orët &amp; afatet</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Recent Announcements Banner -->
      ${announcements.length > 0 ? `
        <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:14px;padding:16px;margin-top:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px">
              <span>📢</span> Njoftimi i Fundit nga Shkolla
            </div>
            <span style="font-size:11.5px;color:var(--muted)">${new Date(announcements[0].timestamp || Date.now()).toLocaleDateString()}</span>
          </div>
          <div style="font-weight:600;font-size:13.5px;color:var(--text);margin-bottom:4px">${announcements[0].title}</div>
          <div style="font-size:12.5px;color:var(--muted);line-height:1.5">${announcements[0].body?.slice(0, 140)}...</div>
        </div>
      ` : ''}
    `;

    // Wire Quick Launch Buttons
    container.querySelector('#quickLaunchLab')?.addEventListener('click', () => {
      overlay.remove();
      if (window.InteractiveLab) window.InteractiveLab.open();
    });
    container.querySelector('#quickLaunchPractice')?.addEventListener('click', () => {
      overlay.remove();
      if (window.PracticeTest) window.PracticeTest.openTestGenerator();
    });
    container.querySelector('#quickLaunchFocus')?.addEventListener('click', () => {
      overlay.remove();
      if (window.SchoolOS) window.SchoolOS.open();
    });
    container.querySelector('#quickLaunchHomework')?.addEventListener('click', () => {
      overlay.querySelectorAll('.dash-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'assignments'));
      loadTab('assignments', container, overlay);
    });
    container.querySelector('#quickLaunchEssay')?.addEventListener('click', () => {
      overlay.remove();
      if (window.EssayCoach) window.EssayCoach.open();
    });
    container.querySelector('#quickLaunchBattle')?.addEventListener('click', () => {
      overlay.remove();
      if (window.QuizBattle) window.QuizBattle.open();
    });
    container.querySelector('#quickLaunchSpeech')?.addEventListener('click', () => {
      overlay.remove();
      if (window.PronunciationCoach) window.PronunciationCoach.open();
    });
    container.querySelector('#quickLaunchRoadmap')?.addEventListener('click', () => {
      overlay.remove();
      if (window.LearningRoadmap) window.LearningRoadmap.open();
    });
    container.querySelector('#quickLaunchChallenges')?.addEventListener('click', () => {
      overlay.remove();
      if (window.Challenges) window.Challenges.open();
    });
    container.querySelector('#quickLaunchCalendar')?.addEventListener('click', () => {
      overlay.remove();
      if (window.StudyCalendar) window.StudyCalendar.open();
    });
  }

  // ----------------------------------------------------------------
  // 2. ANNOUNCEMENTS
  // ----------------------------------------------------------------
  async function renderAnnouncements(container) {
    let data = await fetchJson('/api/announcements');
    let list = data?.announcements || window.AppState?.communication?.announcements || [];

    if (list.length === 0) {
      list = [
        {
          id: 'welcome_ann',
          title: 'Mirë se vini në Platformën Inteligjente EduAI!',
          body: 'Platforma përmban oraret e lëndëve, laboratorët shkencorë, planifikuesin e detyrave dhe tutorin inteligjent Sokratik për të gjitha klasat.',
          author: 'Drejtoria e Shkollës',
          gradeLevel: null,
          priority: 'high',
          timestamp: Date.now() - 3600000 * 24
        },
        {
          id: 'stem_ann',
          title: 'Laboratori Shkencor Interaktiv është Aktiv',
          body: 'Mund të eksploroni simulimet e lëvizjes së trupave në Fizikë, katrorin Punnett në Biologji, dhe shkallën e pH në Kimi direkt nga menyja e shkollës.',
          author: 'Departamenti STEM',
          gradeLevel: null,
          priority: 'normal',
          timestamp: Date.now() - 3600000 * 12
        }
      ];
    }

    const priorityBadges = {
      high: { bg: '#fee2e2', text: '#991b1b', label: '🔴 E Rëndësishme' },
      normal: { bg: '#dbeafe', text: '#1e40af', label: '🟡 Njoftim' },
      low: { bg: '#f3f4f6', text: '#4b5563', label: '🟢 Informacion' }
    };

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">Njoftime &amp; Lajme nga Shkolla</h3>
        <span style="font-size:12px;color:var(--muted)">Gjithsej: ${list.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${list.map(ann => {
          const badge = priorityBadges[ann.priority] || priorityBadges.normal;
          return `
            <div style="padding:16px;background:var(--input-bg);border:1px solid var(--border);border-radius:14px;transition:border-color 0.2s">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div>
                  <div style="font-weight:700;font-size:15px;color:var(--text)">${ann.title}</div>
                  <div style="font-size:12px;color:var(--muted);margin-top:2px">
                    ✍️ ${ann.author || 'Mësuesi'} ${ann.gradeLevel ? `· Klasa ${ann.gradeLevel}` : '· Të gjitha klasat'}
                  </div>
                </div>
                <div style="text-align:right">
                  <span style="padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;background:${badge.bg};color:${badge.text}">${badge.label}</span>
                  <div style="font-size:11px;color:var(--muted);margin-top:4px">${new Date(ann.timestamp || Date.now()).toLocaleDateString('sq-AL')}</div>
                </div>
              </div>
              <p style="margin:8px 0 0;font-size:13.5px;line-height:1.6;color:var(--text);white-space:pre-wrap">${ann.body}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ----------------------------------------------------------------
  // 3. ASSIGNMENTS & HOMEWORK
  // ----------------------------------------------------------------
  async function renderAssignments(container, overlay) {
    let data = await fetchJson('/api/my-assignments');
    if (!data) {
      const localList = window.AppState?.assignments?.list || [];
      if (localList.length) {
        data = { assignments: localList, submissions: [] };
      }
    }

    const assignments = data?.assignments || [];
    const submissions = data?.submissions || [];

    if (assignments.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--muted)">
          <div style="font-size:40px;margin-bottom:8px">🎉</div>
          <h4 style="margin:0 0 6px;color:var(--text)">Nuk keni detyra të padorëzuara!</h4>
          <p style="font-size:13px;margin:0">Të gjitha detyrat e shtëpisë dhe projektet janë të përfunduara.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">Detyrat e Shtëpisë &amp; Projektet</h3>
        <span style="font-size:12px;color:var(--muted)">${assignments.length} detyra</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${assignments.map(a => {
          const sub = submissions.find(s => s.assignmentId === a.id);
          const isSubmitted = !!sub;
          const status = sub
            ? (sub.graded ? `✅ Vlerësuar: ${sub.grade}/${a.maxPoints}` : '📨 Dorëzuar — pret notën')
            : (a.dueDate && new Date(a.dueDate) < Date.now() ? '⚠️ Afati ka kaluar' : '📝 Në pritje');
          const statusBg = sub?.graded ? '#d1fae5' : (sub ? '#dbeafe' : '#fef3c7');
          const statusColor = sub?.graded ? '#065f46' : (sub ? '#1e40af' : '#92400e');

          return `
            <div style="padding:16px;border:1px solid var(--border);border-radius:14px;background:var(--input-bg)">
              <div style="display:flex;justify-content:space-between;align-items:start">
                <div>
                  <div style="font-weight:700;font-size:15px;color:var(--text)">${a.title}</div>
                  <div style="font-size:12.5px;color:var(--muted);margin-top:3px">${a.description || 'Nuk ka përshkrim'}</div>
                </div>
                <span style="padding:3px 9px;border-radius:12px;font-size:11.5px;font-weight:700;background:${statusBg};color:${statusColor}">${status}</span>
              </div>
              <div style="display:flex;gap:16px;font-size:12px;color:var(--muted);margin-top:8px">
                ${a.dueDate ? `<span>📅 Afati: <b>${new Date(a.dueDate).toLocaleDateString()}</b></span>` : ''}
                ${a.maxPoints ? `<span>🎯 Pikët maksimale: <b>${a.maxPoints}</b></span>` : ''}
              </div>
              ${sub?.feedback ? `
                <div style="margin-top:10px;padding:10px 14px;background:rgba(52,199,89,0.12);border-radius:8px;font-size:12.5px;color:#065f46">
                  <strong>💬 Komenti i Mësuesit:</strong> ${sub.feedback}
                </div>
              ` : ''}
              ${!isSubmitted ? `
                <div style="margin-top:12px;display:flex;gap:8px">
                  <button class="start-work-btn" data-assignment='${JSON.stringify({ id: a.id, title: a.title, description: a.description, dueDate: a.dueDate, maxPoints: a.maxPoints, questions: a.questions || [], hardLock: a.hardLock || false }).replace(/'/g, '&#39;')}'
                    style="padding:8px 16px;background:var(--accent,#4f46e5);color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:12.5px;display:flex;align-items:center;gap:6px;transition:all 0.15s">
                    ✏️ Fillo Zgjidhjen në Hapësirën e Nxënësit
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.start-work-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const assignment = JSON.parse(btn.dataset.assignment);
          if (window.StudentWorkspace) {
            overlay?.remove();
            window.StudentWorkspace.openToolPicker(assignment, assignment.hardLock || false);
          } else {
            alert('Hapësira e punës së nxënësit po ngarkohet...');
          }
        } catch (e) {
          console.error('Failed to open workspace:', e);
        }
      });
    });
  }

  // ----------------------------------------------------------------
  // 4. INTERACTIVE LABS
  // ----------------------------------------------------------------
  function renderLabs(container, overlay) {
    const labs = [
      { id: 'ai', emoji: '🤖', title: 'Inteligjencë Artificiale: Neural Network Playground', desc: 'Eksploro rrjetat neurale, gradient descent, dhe sipërfaqet e vendimmarrjes live.' },
      { id: 'activations', emoji: '⚡', title: 'AI: Funksionet e Aktivizimit & Humbja (Loss)', desc: 'Mëso ReLU, Sigmoid, Tanh, GELU, derivatet dhe rregullimin L1/L2.' },
      { id: 'algorithms', emoji: '🔢', title: 'Shkenca Kompjuterike: Animuesi i Algoritmeve', desc: 'Shiko hap pas hapi Bubble Sort, Quick Sort, Selection Sort dhe Binary Search.' },
      { id: 'circuits', emoji: '⚡', title: 'Fizikë: Laboratori i Qarqeve & Ligji i Ohm-it', desc: 'Eksperimento me tensionin, rezistencën, rrjedhën e elektroneve dhe fuqinë e llambës.' },
      { id: 'reactions', emoji: '⚗️', title: 'Kimi: Barazimi i Reaksioneve & Ruajtja e Masës', desc: 'Barazo ekuacionet kimike automatikisht dhe verifiko balancën atomike.' },
      { id: 'economics', emoji: '📊', title: 'Ekonomi: Ekuilibri i Tregut & Oferta/Kërkesa', desc: 'Eksploro lakoret e kërkesës dhe ofertës, çmimin e ekuilibrit dhe tepricën konsumatore.' },
      { id: 'dna', emoji: '🧬', title: 'Biologji: Transkriptimi i DNA & Sinteza e Proteinave', desc: 'Hap pas hapi nga vargu i DNA te mRNA dhe zinxhiri polipeptidik i aminoacideve.' },
      { id: 'physics', emoji: '🚀', title: 'Fizikë: Lëvizja e Trupave (Projectile Motion)', desc: 'Llogarit trajektoren, shpejtësinë, këndin dhe gravitetin në kohë reale me vizualizim 2D.' },
      { id: 'biology', emoji: '🌱', title: 'Biologji: Katrori Punnett & Gjenetika', desc: 'Llogarit raportet gjenotipike dhe fenotipike të trashëgimisë gjenetike.' },
      { id: 'chemistry', emoji: '🧪', title: 'Kimi: Shkalla e pH & Acidet/Bazat', desc: 'Eksploro spektrin e pH-së nga acidet e forta te bazat dhe substancat reale.' },
      { id: 'math', emoji: '📈', title: 'Matematikë: Grafiku i Funksioneve Live', desc: 'Shkruaj funksione matematikore f(x) dhe shih lakoren e tyre të vizatuar menjëherë.' },
      { id: 'timeline', emoji: '🏛️', title: 'Histori: Vija Kohore Interaktive', desc: 'Ngjarjet kryesore historike kombëtare dhe botërore të renditura kronologjikisht.' },
      { id: 'astronomy', emoji: '🪐', title: 'Astronomi: Graviteti & Mekanika Orbitale', desc: 'Simulo ligjet e Keplerit, orbitat eliptike dhe gravitetin universal të Njutonit.' }
    ];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">🔬 Laboratori Shkencor &amp; Matematikor</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">Eksperimento dhe mëso përmes simulimeve vizuale interaktive</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
        ${labs.map(l => `
          <div class="quick-action-card lab-card" data-lab="${l.id}">
            <div style="font-size:32px">${l.emoji}</div>
            <div style="font-weight:700;font-size:14px;color:var(--text)">${l.title}</div>
            <div style="font-size:12.5px;color:var(--muted);line-height:1.5">${l.desc}</div>
            <button style="margin-top:auto;padding:7px 12px;border-radius:8px;background:var(--accent,#4f46e5);color:white;border:none;cursor:pointer;font-weight:600;font-size:12px;align-self:flex-start">
              Hap Simulimin 🚀
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.lab-card').forEach(card => {
      card.addEventListener('click', () => {
        const labId = card.dataset.lab;
        overlay?.remove();
        if (window.InteractiveLab) {
          window.InteractiveLab.open(labId);
        }
      });
    });
  }

  // ----------------------------------------------------------------
  // 5. PRACTICE TESTS & QUIZZES
  // ----------------------------------------------------------------
  function renderPractice(container, overlay) {
    const subjects = window.Subjects ? window.Subjects.getAll() : [];
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">🧪 Provime Provuese &amp; Përgatitje Testesh</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">Gjenero teste të personalizuara me AI bazuar në kurrikulën tënde</p>
        </div>
        <button id="openTestGenBtn" style="padding:8px 16px;background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:6px">
          <span>✨</span> Gjenero Test të Ri
        </button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
        ${subjects.map(s => `
          <div class="quick-action-card subject-test-card" data-subject="${s.id}">
            <div style="font-size:28px">${s.emoji}</div>
            <div style="font-weight:700;font-size:14px;color:var(--text)">${s.label}</div>
            <div style="font-size:11.5px;color:var(--muted)">Pyetje &amp; Ushtrime Provuese</div>
            <button style="margin-top:auto;padding:6px 10px;border-radius:8px;background:rgba(99,102,241,0.12);color:var(--accent,#4f46e5);border:none;cursor:pointer;font-weight:600;font-size:11.5px;align-self:flex-start">
              Fillo Kuicin 🎯
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#openTestGenBtn')?.addEventListener('click', () => {
      overlay?.remove();
      if (window.PracticeTest) window.PracticeTest.openTestGenerator();
    });

    container.querySelectorAll('.subject-test-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.dataset.subject;
        if (window.Subjects?.switchTo) window.Subjects.switchTo(subId);
        overlay?.remove();
        if (window.PracticeTest) window.PracticeTest.openTestGenerator();
      });
    });
  }

  // ----------------------------------------------------------------
  // 6. CLASSES & SUBJECTS
  // ----------------------------------------------------------------
  async function renderClasses(container, overlay) {
    const subjects = window.Subjects ? window.Subjects.getAll() : [];
    const activeGrade = window.AppState?.academic?.activeGrade || 10;
    const curr = window.CurriculumRAG ? window.CurriculumRAG.getCurriculum() : { name: 'Kombëtare' };
    const profile = window.MyPath?.getProfile?.() || {};

    const teacherMap = {
      'shqip': 'Znj. Manastirliu (Gjuhë Shqipe)',
      'matematike': 'Prof. Gjoni (Matematikë)',
      'fizike': 'Prof. Hoxha (Fizikë)',
      'kimia': 'Znj. Prifti (Kimi)',
      'biologji': 'Dr. Kuka (Biologji)',
      'ekonomi': 'Prof. Deda (Ekonomi)',
      'histori': 'Prof. Shehu (Histori)',
      'anglisht': 'Ms. Evans (English Literature)',
      'coding': 'Ing. Basha (Computer Science)',
      'cyber': 'Ing. Çela (Cybersecurity)',
      'german': 'Herr Müller (Deutsch)',
      'french': 'Mme. Dubois (Français)',
      'spanish': 'Sr. Garcia (Español)'
    };

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">Kurset &amp; Lëndët e Regjistruara</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">Sistemi: ${curr.name} · Klasa ${activeGrade}</p>
        </div>
        <span style="font-size:12px;font-weight:600;color:var(--accent)">${subjects.length} Lëndë Aktive</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
        ${subjects.map(s => {
          const teacher = teacherMap[s.id] || 'Mësuesi i Lëndës';
          const mastery = profile.mastery?.[s.id];
          const masteryLabels = ['Fillestar', 'Bazë', 'Mesatar', 'I Avancuar', 'Ekspert'];
          const masteryText = mastery !== undefined ? masteryLabels[mastery] : 'Mesatar';

          return `
            <div class="class-card">
              <div style="display:flex;align-items:center;gap:12px;min-width:0">
                <div style="font-size:28px;width:44px;height:44px;border-radius:10px;background:rgba(0,122,255,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  ${s.emoji}
                </div>
                <div style="min-width:0">
                  <div style="font-weight:700;font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label}</div>
                  <div style="font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${teacher}</div>
                  <div style="font-size:11px;color:var(--accent);font-weight:600;margin-top:2px">Niveli: ${masteryText}</div>
                </div>
              </div>
              <button class="open-class-btn" data-subject-id="${s.id}" style="padding:6px 12px;border-radius:8px;background:var(--accent);color:white;border:none;cursor:pointer;font-weight:600;font-size:11.5px;white-space:nowrap;transition:all 0.15s">
                Hyr 🚀
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.open-class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const subId = btn.dataset.subjectId;
        if (window.Subjects?.switchTo) {
          window.Subjects.switchTo(subId);
        }
        overlay?.remove();
      });
    });
  }

  // ----------------------------------------------------------------
  // 7. STUDY PLANNER
  // ----------------------------------------------------------------
  function renderPlanner(container, overlay) {
    const saved = localStorage.getItem('eduai_school_planner');
    let items = saved ? JSON.parse(saved) : [
      { id: '1', title: 'Ushtrimet e Matematikës (Faqe 45)', subject: 'Matematikë', due: 'Nesër', done: false },
      { id: '2', title: 'Projekt Fizike: Ligjet e Njutonit', subject: 'Fizikë', due: 'Të Premten', done: false },
      { id: '3', title: 'Lexim Letërsie: Ismail Kadare', subject: 'Gjuhë Shqipe', due: 'Të Hënën', done: true }
    ];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">📅 Plani i Studimit &amp; Kalendari i Detyrave</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">Organizoni oraret e mësimit dhe afatet e provimeve</p>
        </div>
        <button id="openSchoolOsPlannerBtn" style="padding:8px 14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:10px;font-weight:600;font-size:12px;cursor:pointer">
          Hap Planifikuesin e Plotë 📋
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px" id="plannerItemList">
        ${items.map(item => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;background:var(--input-bg);border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:12px">
              <input type="checkbox" ${item.done ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer" disabled />
              <div>
                <div style="font-weight:600;font-size:13.5px;color:var(--text);${item.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${item.title}</div>
                <div style="font-size:11.5px;color:var(--muted)">${item.subject} · Afati: <b>${item.due}</b></div>
              </div>
            </div>
            <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;background:${item.done ? '#d1fae5' : '#fef3c7'};color:${item.done ? '#065f46' : '#92400e'}">
              ${item.done ? 'E Përfunduar' : 'Në Proces'}
            </span>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#openSchoolOsPlannerBtn')?.addEventListener('click', () => {
      overlay?.remove();
      if (window.SchoolOS) window.SchoolOS.open('planner');
    });
  }

  // ----------------------------------------------------------------
  // 8. ATTENDANCE
  // ----------------------------------------------------------------
  async function renderAttendance(container) {
    let data = await fetchJson('/api/my-attendance');
    const studentId = getLocalStudentId();
    
    if (!data && window.Attendance?.getAttendanceStats) {
      data = {
        stats: window.Attendance.getAttendanceStats(studentId),
        attendance: window.Attendance.getStudentAttendance ? window.Attendance.getStudentAttendance(studentId) : []
      };
    }

    const stats = data?.stats || { present: 18, absent: 0, late: 1, rate: 95 };
    const records = (data?.attendance || []).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        <div class="dash-stat" style="background:#d1fae5"><div class="dash-stat-value" style="color:#065f46;font-size:22px">${stats.present || 18}</div><div class="dash-stat-label" style="color:#065f46">Prezent</div></div>
        <div class="dash-stat" style="background:#fee2e2"><div class="dash-stat-value" style="color:#991b1b;font-size:22px">${stats.absent || 0}</div><div class="dash-stat-label" style="color:#991b1b">Mungesa</div></div>
        <div class="dash-stat" style="background:#fef3c7"><div class="dash-stat-value" style="color:#92400e;font-size:22px">${stats.late || 1}</div><div class="dash-stat-label" style="color:#92400e">Vonesa</div></div>
        <div class="dash-stat" style="background:#dbeafe"><div class="dash-stat-value" style="color:#1e40af;font-size:22px">${stats.rate || stats.attendanceRate || 95}%</div><div class="dash-stat-label" style="color:#1e40af">Përqindja</div></div>
      </div>
      ${records.length > 0 ? `
        <div style="max-height:260px;overflow-y:auto">
          ${records.map(r => {
            const icon = r.status === 'present' ? '✅' : r.status === 'absent' ? '❌' : '⏰';
            return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
              <span>${icon}</span><span style="flex:1">${r.date}</span><span style="color:var(--muted)">${r.notes || ''}</span>
            </div>`;
          }).join('')}
        </div>
      ` : '<p style="color:var(--muted);font-size:13px;text-align:center;padding:20px">Regjistri i rregullt i prezencës.</p>'}
    `;
  }

  // ----------------------------------------------------------------
  // 9. POINTS & ACHIEVEMENTS
  // ----------------------------------------------------------------
  async function renderPoints(container) {
    let data = await fetchJson('/api/my-gamification');
    const studentId = getLocalStudentId();
    if (!data) {
      const localP = window.AppState?.gamification?.studentProgress?.[studentId] || { points: 150, achievements: ['Kërkues i Dijes', 'Mjeshtër i Detyrave', 'Eksplorues i Shkencës'], history: [] };
      data = { progress: localP };
    }

    const p = data.progress || {};
    container.innerHTML = `
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:48px;font-weight:800;color:var(--accent,#4f46e5)">${p.points || 150} XP</div>
        <div style="font-size:14px;color:var(--muted)">Gjithsej Pikë të Fituara</div>
      </div>
      ${p.achievements?.length ? `
        <h4 style="margin:0 0 8px;color:var(--text)">🏆 Distinktivët &amp; Arritjet (${p.achievements.length})</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
          ${p.achievements.map(a => `<span style="padding:6px 14px;background:rgba(99,102,241,0.15);color:var(--accent,#4f46e5);border-radius:14px;font-size:12px;font-weight:700">🌟 ${a}</span>`).join('')}
        </div>
      ` : ''}
    `;
  }

  // ----------------------------------------------------------------
  // ADD BUTTON TO SIDEBAR
  // ----------------------------------------------------------------
  function addDashboardButton() {
    const studentTools = document.getElementById('studentToolsSection');
    if (!studentTools || document.getElementById('myProgressBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'myProgressBtn';
    btn.style.cssText = 'width:100%;padding:9px 12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13.5px;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;margin-top:8px';
    btn.innerHTML = '<span>📊</span> Student Portal &amp; Hub';
    btn.addEventListener('click', () => openDashboard('overview'));

    const joinBtn = document.getElementById('joinClassBtn');
    if (joinBtn && joinBtn.parentElement) {
      joinBtn.parentElement.insertAdjacentElement('afterend', btn);
    } else {
      studentTools.appendChild(btn);
    }
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addDashboardButton, 600));
  } else {
    setTimeout(addDashboardButton, 600);
  }

  window.StudentDashboard = { openDashboard };
  console.log('✅ Next-Gen Student Portal module loaded');
})();
