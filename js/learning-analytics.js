// js/learning-analytics.js
// ===================================================================
// LEARNING ANALYTICS DASHBOARD
// Track student progress, visualize strengths/weaknesses
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // Analytics data
  let analytics = {
    sessions: [],
    questions: [],
    subjects: {},
    dailyProgress: [],
    streakDays: 0,
    lastActive: null
  };

  // Initialize
  function init() {
    loadAnalytics();
    createDashboardButton();
    console.log('Learning Analytics module loaded');
  }

  // Create dashboard button
  function createDashboardButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const btn = document.createElement('button');
    btn.id = 'analyticsBtn';
    btn.className = 'icon-btn';
    btn.title = 'Learning Analytics';
    btn.innerHTML = '📈';
    btn.addEventListener('click', openDashboard);
    
    // Insert at the start of header-actions
    headerActions.insertBefore(btn, headerActions.firstChild);
  }

  // Track a question/answer
  function trackQuestion(subject, question, response, duration) {
    const entry = {
      timestamp: Date.now(),
      subject,
      question: question.substring(0, 200), // Truncate
      responseLength: response.length,
      duration,
      date: new Date().toISOString().split('T')[0]
    };

    analytics.questions.push(entry);

    // Update subject stats
    if (!analytics.subjects[subject]) {
      analytics.subjects[subject] = { count: 0, totalTime: 0 };
    }
    analytics.subjects[subject].count++;
    analytics.subjects[subject].totalTime += duration || 0;

    // Update daily progress
    updateDailyProgress(entry.date);

    // Update streak
    updateStreak();

    saveAnalytics();
  }

  // Update daily progress
  function updateDailyProgress(date) {
    const existing = analytics.dailyProgress.find(d => d.date === date);
    if (existing) {
      existing.questions++;
    } else {
      analytics.dailyProgress.push({ date, questions: 1 });
    }

    // Keep last 30 days
    analytics.dailyProgress = analytics.dailyProgress.slice(-30);
  }

  // Update streak
  function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (analytics.lastActive === today) {
      // Same day, streak unchanged
    } else if (analytics.lastActive === yesterday) {
      analytics.streakDays++;
    } else {
      analytics.streakDays = 1;
    }

    analytics.lastActive = today;
  }

  // Open analytics dashboard
  function openDashboard() {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'analyticsModal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--panel);
      border-radius: 16px;
      width: 800px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
    `;

    content.innerHTML = renderDashboard();
    modal.appendChild(content);

    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  // Render dashboard content
  function renderDashboard() {
    const stats = getStats();
    const topSubjects = getTopSubjects(5);

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: var(--text);">Learning Analytics</h2>
        <button onclick="document.getElementById('analyticsModal').remove()" style="
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
        ">×</button>
      </div>

      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
        <div class="stat-card" style="
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 20px;
          border-radius: 12px;
        ">
          <div style="font-size: 32px; font-weight: 700;">${stats.totalQuestions}</div>
          <div style="font-size: 13px; opacity: 0.9;">Total Questions</div>
        </div>
        <div class="stat-card" style="
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 20px;
          border-radius: 12px;
        ">
          <div style="font-size: 32px; font-weight: 700;">${analytics.streakDays}</div>
          <div style="font-size: 13px; opacity: 0.9;">Day Streak</div>
        </div>
        <div class="stat-card" style="
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 20px;
          border-radius: 12px;
        ">
          <div style="font-size: 32px; font-weight: 700;">${stats.subjectsCount}</div>
          <div style="font-size: 13px; opacity: 0.9;">Subjects Studied</div>
        </div>
        <div class="stat-card" style="
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          padding: 20px;
          border-radius: 12px;
        ">
          <div style="font-size: 32px; font-weight: 700;">${Math.round(stats.avgPerDay * 10) / 10}</div>
          <div style="font-size: 13px; opacity: 0.9;">Avg Questions/Day</div>
        </div>
      </div>

      <!-- Progress Chart -->
      <div style="background: var(--bg); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px; color: var(--text);">Daily Progress (Last 14 Days)</h3>
        <div style="display: flex; align-items: flex-end; gap: 8px; height: 120px;">
          ${renderProgressChart()}
        </div>
      </div>

      <!-- Subject Breakdown -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: var(--bg); border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 16px; color: var(--text);">Top Subjects</h3>
          ${topSubjects.map((s, i) => `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i]};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 14px;
              ">${i + 1}</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text);">${s.subject}</div>
                <div style="font-size: 12px; color: var(--muted);">${s.count} questions</div>
              </div>
              <div style="
                height: 6px;
                width: ${Math.min(100, (s.count / Math.max(...topSubjects.map(x => x.count))) * 100)}px;
                background: ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i]};
                border-radius: 3px;
              "></div>
            </div>
          `).join('')}
        </div>

        <div style="background: var(--bg); border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 16px; color: var(--text);">Learning Insights</h3>
          ${renderInsights()}
        </div>
      </div>

      <!-- Export Button -->
      <div style="margin-top: 24px; text-align: center;">
        <button onclick="window.LearningAnalytics.exportReport()" style="
          background: var(--accent);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Export Report</button>
      </div>
    `;
  }

  // Render progress chart
  function renderProgressChart() {
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const dayData = analytics.dailyProgress.find(d => d.date === date);
      last14Days.push({
        date,
        questions: dayData?.questions || 0
      });
    }

    const maxQ = Math.max(...last14Days.map(d => d.questions), 1);

    return last14Days.map(d => {
      const height = (d.questions / maxQ) * 100;
      const day = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
      return `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
          <div style="
            width: 100%;
            height: ${height}%;
            min-height: 4px;
            background: var(--accent);
            border-radius: 4px 4px 0 0;
          "></div>
          <div style="font-size: 10px; color: var(--muted);">${day}</div>
        </div>
      `;
    }).join('');
  }

  // Render insights
  function renderInsights() {
    const stats = getStats();
    const insights = [];

    if (analytics.streakDays >= 7) {
      insights.push({ icon: 'local_fire_department', text: `${analytics.streakDays} day streak! Keep it up!`, color: '#ef4444' });
    }

    if (stats.totalQuestions >= 100) {
      insights.push({ icon: 'emoji_events', text: 'Century club! 100+ questions asked', color: '#f59e0b' });
    }

    const topSubject = getTopSubjects(1)[0];
    if (topSubject) {
      insights.push({ icon: 'school', text: `Strongest subject: ${topSubject.subject}`, color: '#3b82f6' });
    }

    if (insights.length === 0) {
      insights.push({ icon: 'lightbulb', text: 'Keep asking questions to unlock insights!', color: '#8b5cf6' });
    }

    return insights.map(i => `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span style="font-size: 24px; color: ${i.color};">${i.icon}</span>
        <span style="color: var(--text);">${i.text}</span>
      </div>
    `).join('');
  }

  // Get stats
  function getStats() {
    return {
      totalQuestions: analytics.questions.length,
      subjectsCount: Object.keys(analytics.subjects).length,
      avgPerDay: analytics.questions.length / Math.max(analytics.dailyProgress.length, 1),
      totalTime: Object.values(analytics.subjects).reduce((sum, s) => sum + s.totalTime, 0)
    };
  }

  // Get top subjects
  function getTopSubjects(limit = 5) {
    return Object.entries(analytics.subjects)
      .map(([subject, data]) => ({ subject, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Export report
  function exportReport() {
    const stats = getStats();
    const report = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      subjects: analytics.subjects,
      recentQuestions: analytics.questions.slice(-50)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shqipai-learning-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.Toast?.success('Report exported');
  }

  // Save analytics
  function saveAnalytics() {
    try {
      localStorage.setItem('shqipai_analytics', JSON.stringify(analytics));
    } catch (e) {
      // Trim old data if storage full
      analytics.questions = analytics.questions.slice(-500);
      saveAnalytics();
    }
  }

  // Load analytics
  function loadAnalytics() {
    try {
      const saved = localStorage.getItem('shqipai_analytics');
      if (saved) analytics = JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load analytics');
    }
  }

  // Export
  window.LearningAnalytics = {
    init,
    trackQuestion,
    openDashboard,
    getStats,
    getTopSubjects,
    exportReport
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
  }
})();
