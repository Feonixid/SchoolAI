// js/initialize-features.js
// ===================================================================
// FEATURE INITIALIZATION COORDINATOR
// Ensures all teacher features load properly
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Track which features are loaded
  const loadedFeatures = {
    attendance: false,
    behavior: false,
    calendar: false,
    communication: false,
    analytics: false,
    assignments: false,
    reports: false,
    gamification: false,
    aiFeedback: false
  };

  // Initialize all teacher features
  function initializeAllTeacherFeatures() {
    console.log('🔧 Initializing all teacher features...');

    const featureContainer = document.getElementById('teacherFeatureButtons');
    if (!featureContainer) {
      console.error('❌ teacherFeatureButtons container not found!');
      return;
    }

    // Clear existing content to prevent duplicates
    featureContainer.innerHTML = '';

    // 1. ATTENDANCE & TRACKING
    if (window.Attendance) {
      addAttendanceSection();
      loadedFeatures.attendance = true;
    }

    // 2. BEHAVIOR & CONDUCT
    if (window.Behavior) {
      addBehaviorSection();
      loadedFeatures.behavior = true;
    }

    // 3. CALENDAR & EVENTS
    if (window.Calendar) {
      addCalendarSection();
      loadedFeatures.calendar = true;
    }

    // 4. COMMUNICATION
    if (window.Communication) {
      addCommunicationSection();
      loadedFeatures.communication = true;
    }

    // 5. ANALYTICS & PERFORMANCE
    if (window.Analytics) {
      addAnalyticsSection();
      loadedFeatures.analytics = true;
    }

    // 6. ASSIGNMENTS
    if (window.Assignments) {
      addAssignmentsSection();
      loadedFeatures.assignments = true;
    }

    // 7. REPORTS & EXPORT (handled by reports.js module)
    if (window.Reports) {
      loadedFeatures.reports = true;
    }

    // 8. GAMIFICATION
    if (window.Gamification) {
      addGamificationSection();
      loadedFeatures.gamification = true;
    }

    // 9. AI FEEDBACK (depends on Analytics)
    if (window.AIFeedback && window.Analytics) {
      addAIFeedbackToAnalytics();
      loadedFeatures.aiFeedback = true;
    }

    // Log loaded features
    console.log('✅ Loaded features:', loadedFeatures);
    showFeatureStatus();

    // Show School ID (Identity)
    if (window.Security && window.Security.showSchoolIdentity) {
      window.Security.showSchoolIdentity();
    }
  }

  // 1. Attendance Section
  function addAttendanceSection() {
    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">📅 Management & Tracking</h3>
      <div class="quizControls">
        <button id="attendanceBtn" class="quizBtn">📅 Mark Attendance</button>
      </div>
    `;

    document.getElementById('teacherFeatureButtons').appendChild(section);

    document.getElementById('attendanceBtn').addEventListener('click', () => {
      if (window.Attendance && window.Attendance.openAttendanceTracker) {
        window.Attendance.openAttendanceTracker();
      }
    });
  }

  // 2. Behavior Section
  function addBehaviorSection() {
    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">🎯 Behavior & Conduct</h3>
      <div class="quizControls">
        <button id="behaviorOverviewBtn" class="quizBtn">📋 View Class Behavior</button>
      </div>
    `;

    document.getElementById('teacherFeatureButtons').appendChild(section);

    document.getElementById('behaviorOverviewBtn').addEventListener('click', () => {
      showClassBehaviorOverview();
    });
  }

  // Helper: Show class behavior overview
  function showClassBehaviorOverview() {
    if (!state.academic.activeGrade) {
      alert('⚠️ Please select a class.');
      return;
    }

    const students = state.students.list.filter(s => s.gradeLevel === state.academic.activeGrade);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    let html = `
      <div class="modal" style="width:700px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">🎯 Behavior - Class ${state.academic.activeGrade}</h3>
          <button class="close-behavior-overview icon-btn" style="width:32px;height:32px;font-size:18px">×</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
    `;

    students.forEach(student => {
      const summary = window.Behavior ? window.Behavior.getBehaviorSummary(student.id) : null;

      html += `
        <div style="padding:12px;background:#fff;border-radius:8px;border:1px solid rgba(15,33,56,0.1);
             cursor:pointer" class="student-behavior-item" data-id="${student.id}">
          <div style="font-weight:600;margin-bottom:6px">${student.name}</div>
          <div style="display:flex;gap:12px;font-size:12px">
            <span style="color:#16a34a">✅ ${summary ? summary.positive : 0} Positive</span>
            <span style="color:#3b82f6">🙋 ${summary ? summary.participation : 0} Participation</span>
            <span style="color:#dc2626">❌ ${summary ? summary.negative : 0} Negative</span>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);

    modal.querySelector('.close-behavior-overview').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelectorAll('.student-behavior-item').forEach(item => {
      item.addEventListener('click', () => {
        const studentId = parseInt(item.dataset.id);
        modal.remove();
        if (window.Behavior && window.Behavior.openBehaviorTracker) {
          window.Behavior.openBehaviorTracker(studentId);
        }
      });
    });
  }

  // 3. Calendar Section
  function addCalendarSection() {
    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">📆 Calendar & Events</h3>
      <div class="quizControls">
        <button id="calendarBtn" class="quizBtn">📅 Open Calendar</button>
      </div>
    `;

    document.getElementById('teacherFeatureButtons').appendChild(section);

    document.getElementById('calendarBtn').addEventListener('click', () => {
      if (window.Calendar && window.Calendar.openCalendar) {
        window.Calendar.openCalendar();
      }
    });
  }

  // 4. Communication Section
  function addCommunicationSection() {
    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">📢 Communication</h3>
      <div class="quizControls">
        <button id="teacherAnnounceFeatureBtn" class="quizBtn">📢 Announcements</button>
      </div>
    `;

    document.getElementById('teacherFeatureButtons').appendChild(section);

    document.getElementById('teacherAnnounceFeatureBtn')?.addEventListener('click', () => {
      if (window.Communication && window.Communication.openAnnouncementBoard) {
        window.Communication.openAnnouncementBoard();
      }
    });
  }

  // 5. Analytics Section
  function addAnalyticsSection() {
    const section = document.createElement('div');
    section.id = 'analyticsSection';
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">📊 Analytics & Performance</h3>
      <div class="quizControls" id="analyticsControls">
        <button id="classAnalyticsBtn" class="quizBtn">📊 Class Analytics</button>
      </div>
    `;

    document.getElementById('teacherFeatureButtons').appendChild(section);

    document.getElementById('classAnalyticsBtn').addEventListener('click', () => {
      if (!state.academic.activeGrade) {
        alert('⚠️ Please select a class.');
        return;
      }
      if (window.Analytics && window.Analytics.renderAnalyticsDashboard) {
        window.Analytics.renderAnalyticsDashboard();
      }
    });
  }

  // 5b. Add AI Feedback to Analytics
  function addAIFeedbackToAnalytics() {
    const analyticsControls = document.getElementById('analyticsControls');
    if (!analyticsControls) return;

    const btn = document.createElement('button');
    btn.id = 'classInsightsBtn';
    btn.className = 'quizBtn';
    btn.textContent = '🔍 Analyze Common Mistakes';

    btn.addEventListener('click', async () => {
      if (!state.academic.activeGrade) {
        alert('⚠️ Please select a class.');
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.style.zIndex = '300';
      modal.style.display = 'flex';

      modal.innerHTML = `
        <div class="modal" style="width:650px;max-width:95vw;max-height:90vh;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0;color:var(--accent)">🔍 Class Analysis ${state.academic.activeGrade}</h3>
            <button class="icon-btn close-insights" style="width:32px;height:32px;font-size:18px">×</button>
          </div>
          <div id="insightsContent" style="padding:16px;background:#fff;border-radius:10px;min-height:200px;line-height:1.7">
            <div style="text-align:center;padding:40px 0;color:var(--muted)">
              <div style="font-size:40px;margin-bottom:12px">🤖</div>
              <div>Analyzing data...</div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.close-insights').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      const analysis = await window.AIFeedback.analyzeCommonMistakes(state.academic.activeGrade);
      const contentDiv = modal.querySelector('#insightsContent');

      if (analysis) {
        if (window.markdownit) {
          const md = window.markdownit();
          contentDiv.innerHTML = md.render(analysis);
        } else {
          contentDiv.innerHTML = `<div style="white-space:pre-wrap">${analysis}</div>`;
        }
      } else {
        contentDiv.innerHTML = `
          <div style="text-align:center;padding:40px 0;color:var(--error)">
            ❌ Error generating analysis. Please try again.
          </div>
        `;
      }
    });

    analyticsControls.appendChild(btn);
  }

  // 6. Assignments Section
  function addAssignmentsSection() {
    const teacherSection = document.getElementById('teacherToolsSection');
    if (!teacherSection) return;

    if (document.getElementById('assignmentsSection')) return;

    const assignmentsHTML = `
      <div id="assignmentsSection" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 class="panel-title">📝 Assignments</h3>
          <button id="createAssignmentBtn" class="btn-primary" 
                  style="padding:6px 12px;font-size:12px;border-radius:6px">
            + Create
          </button>
        </div>
        <div id="assignmentsContainer" style="max-height:300px;overflow-y:auto"></div>
      </div>
    `;

    teacherSection.insertAdjacentHTML('beforeend', assignmentsHTML);

    document.getElementById('createAssignmentBtn').addEventListener('click', () => {
      if (window.Assignments && window.Assignments.openAssignmentCreator) {
        window.Assignments.openAssignmentCreator();
      }
    });

    if (window.Assignments && window.Assignments.renderAssignmentsList) {
      window.Assignments.renderAssignmentsList();
    }
  }

  // 8. Gamification Section
  function addGamificationSection() {
    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
      <h3 class="panel-title">🎮 Gamification</h3>
      <div class="quizControls">
        <button id="leaderboardBtn" class="quizBtn">🏆 Leaderboard</button>
      </div>
    `;

    document.getElementById('teacherFeatureButtons').appendChild(section);

    document.getElementById('leaderboardBtn').addEventListener('click', () => {
      if (window.Gamification && window.Gamification.showLeaderboard) {
        window.Gamification.showLeaderboard();
      }
    });
  }

  // Show feature status in console
  function showFeatureStatus() {
    console.log('📊 Feature Status:');
    console.log('  📅 Attendance:', loadedFeatures.attendance ? '✅' : '❌');
    console.log('  🎯 Behavior:', loadedFeatures.behavior ? '✅' : '❌');
    console.log('  📆 Calendar:', loadedFeatures.calendar ? '✅' : '❌');
    console.log('  📢 Communication:', loadedFeatures.communication ? '✅' : '❌');
    console.log('  📊 Analytics:', loadedFeatures.analytics ? '✅' : '❌');
    console.log('  📝 Assignments:', loadedFeatures.assignments ? '✅' : '❌');
    console.log('  📄 Reports:', loadedFeatures.reports ? '✅' : '❌');
    console.log('  🎮 Gamification:', loadedFeatures.gamification ? '✅' : '❌');
    console.log('  💡 AI Feedback:', loadedFeatures.aiFeedback ? '✅' : '❌');
  }

  // Listen for teacher mode unlock to initialize features
  window.addEventListener('teacherModeUnlocked', () => {
    // Add small delay to ensure DOM is ready
    setTimeout(initializeAllTeacherFeatures, 100);
  });

  console.log('✅ Feature Initializer loaded');
})();