// js/analytics.js
// ===================================================================
// STUDENT PERFORMANCE ANALYTICS DASHBOARD - ENHANCED
// Visual charts and comprehensive insights
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Calculate semester average helper
  function calculateSemesterAverage(semester) {
    const grades = [...semester.detyra];
    if (semester.projekti !== null && !isNaN(semester.projekti)) grades.push(semester.projekti);
    if (semester.testi !== null && !isNaN(semester.testi)) grades.push(semester.testi);

    if (grades.length === 0) return null;

    return grades.reduce((a, b) => a + b, 0) / grades.length;
  }

  // Calculate variance helper
  function calculateVariance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
  }

  // Calculate analytics for a student
  function calculateStudentAnalytics(student) {
    if (!student.semesters) return null;

    const analytics = {
      studentId: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      trends: [],
      strengths: [],
      weaknesses: [],
      predictions: {},
      semesterData: []
    };

    // Analyze each semester
    Object.keys(student.semesters).forEach((semKey, idx) => {
      const sem = student.semesters[semKey];
      const semNum = idx + 1;

      const detyraAvg = sem.detyra.length > 0
        ? sem.detyra.reduce((a, b) => a + b, 0) / sem.detyra.length
        : null;

      const semData = {
        semester: semNum,
        detyraAverage: detyraAvg,
        projekti: sem.projekti,
        testi: sem.testi,
        overall: calculateSemesterAverage(sem),
        detyraCount: sem.detyra.length
      };

      analytics.semesterData.push(semData);

      // Identify trends
      if (idx > 0 && semData.overall !== null && analytics.semesterData[idx - 1].overall !== null) {
        const diff = semData.overall - analytics.semesterData[idx - 1].overall;
        if (Math.abs(diff) > 0.5) {
          analytics.trends.push({
            semester: semNum,
            direction: diff > 0 ? 'improving' : 'declining',
            magnitude: Math.abs(diff).toFixed(2)
          });
        }
      }

      // Identify strengths and weaknesses
      if (semData.overall !== null) {
        if (semData.overall >= 8.5) {
          analytics.strengths.push(`Semestri ${semNum}: Performancë e shkëlqyer`);
        } else if (semData.overall < 6.0) {
          analytics.weaknesses.push(`Semestri ${semNum}: Nevojitet përmirësim`);
        }
      }

      // Check consistency in detyra
      if (sem.detyra.length >= 3) {
        const variance = calculateVariance(sem.detyra);
        if (variance < 0.5) {
          analytics.strengths.push(`Semestri ${semNum}: Konsistencë e lartë në detyra`);
        } else if (variance > 2.0) {
          analytics.weaknesses.push(`Semestri ${semNum}: Performancë jo e qëndrueshme`);
        }
      }
    });

    // Predict final grade
    const validSemesters = analytics.semesterData.filter(s => s.overall !== null);
    if (validSemesters.length >= 2) {
      const trend = (validSemesters[validSemesters.length - 1].overall - validSemesters[0].overall) / (validSemesters.length - 1);
      const lastAvg = validSemesters[validSemesters.length - 1].overall;
      const predicted = Math.max(0, Math.min(10, lastAvg + trend));

      analytics.predictions.finalGrade = predicted.toFixed(2);
      analytics.predictions.confidence = validSemesters.length >= 3 ? 'high' : 'medium';
      analytics.predictions.trend = trend > 0.2 ? 'ascending' : trend < -0.2 ? 'descending' : 'stable';
    }

    return analytics;
  }

  // Calculate class analytics
  function calculateClassAnalytics(gradeLevel) {
    const students = state.students.list.filter(s =>
      gradeLevel ? s.gradeLevel === gradeLevel : true
    );

    if (students.length === 0) return null;

    const classAnalytics = {
      totalStudents: students.length,
      gradeLevel: gradeLevel,
      averages: {
        semester1: null,
        semester2: null,
        semester3: null,
        overall: null
      },
      distribution: {
        excellent: 0,  // 9-10
        good: 0,       // 7-8.9
        average: 0,    // 5-6.9
        poor: 0        // 0-4.9
      },
      topPerformers: [],
      needsAttention: []
    };

    const sem1Avgs = [];
    const sem2Avgs = [];
    const sem3Avgs = [];
    const overallAvgs = [];

    students.forEach(student => {
      if (!student.semesters) return;

      const s1 = calculateSemesterAverage(student.semesters.semester1);
      const s2 = calculateSemesterAverage(student.semesters.semester2);
      const s3 = calculateSemesterAverage(student.semesters.semester3);

      if (s1 !== null) sem1Avgs.push(s1);
      if (s2 !== null) sem2Avgs.push(s2);
      if (s3 !== null) sem3Avgs.push(s3);

      if (student.finalAverage !== null) {
        overallAvgs.push(student.finalAverage);

        if (student.finalAverage >= 9) {
          classAnalytics.distribution.excellent++;
        } else if (student.finalAverage >= 7) {
          classAnalytics.distribution.good++;
        } else if (student.finalAverage >= 5) {
          classAnalytics.distribution.average++;
        } else {
          classAnalytics.distribution.poor++;
        }

        if (student.finalAverage >= 9) {
          classAnalytics.topPerformers.push({
            name: student.name,
            average: student.finalAverage.toFixed(2)
          });
        }

        if (student.finalAverage < 6) {
          classAnalytics.needsAttention.push({
            name: student.name,
            average: student.finalAverage.toFixed(2)
          });
        }
      }
    });

    if (sem1Avgs.length > 0) {
      classAnalytics.averages.semester1 = (sem1Avgs.reduce((a, b) => a + b, 0) / sem1Avgs.length).toFixed(2);
    }
    if (sem2Avgs.length > 0) {
      classAnalytics.averages.semester2 = (sem2Avgs.reduce((a, b) => a + b, 0) / sem2Avgs.length).toFixed(2);
    }
    if (sem3Avgs.length > 0) {
      classAnalytics.averages.semester3 = (sem3Avgs.reduce((a, b) => a + b, 0) / sem3Avgs.length).toFixed(2);
    }
    if (overallAvgs.length > 0) {
      classAnalytics.averages.overall = (overallAvgs.reduce((a, b) => a + b, 0) / overallAvgs.length).toFixed(2);
    }

    classAnalytics.topPerformers.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
    classAnalytics.topPerformers = classAnalytics.topPerformers.slice(0, 5);

    classAnalytics.needsAttention.sort((a, b) => parseFloat(a.average) - parseFloat(b.average));
    classAnalytics.needsAttention = classAnalytics.needsAttention.slice(0, 5);

    return classAnalytics;
  }

  // Render analytics dashboard
  function renderAnalyticsDashboard(studentId = null) {
    const modal = createAnalyticsModal();
    document.body.appendChild(modal);

    if (studentId) {
      const student = state.students.list.find(s => s.id === studentId);
      if (student) {
        renderStudentAnalytics(student);
      }
    } else if (state.academic.activeGrade) {
      renderClassAnalytics(state.academic.activeGrade);
    }

    modal.style.display = 'flex';
  }

  // Create analytics modal
  function createAnalyticsModal() {
    const overlay = document.createElement('div');
    overlay.id = 'analyticsModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '200';

    overlay.innerHTML = `
      <div class="modal" id="analyticsModal" style="width:800px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">📊 Analiza e Performancës</h3>
          <button id="closeAnalytics" class="icon-btn" style="width:32px;height:32px;font-size:18px">×</button>
        </div>
        <div id="analyticsContent"></div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.id === 'closeAnalytics') {
        overlay.remove();
      }
    });

    return overlay;
  }

  // Render student analytics with visual charts
  function renderStudentAnalytics(student) {
    const analytics = calculateStudentAnalytics(student);
    if (!analytics) return;

    const content = document.getElementById('analyticsContent');
    if (!content) return;

    let html = `
      <div style="margin-bottom:20px;padding:16px;background:var(--assistant);border-radius:12px">
        <h4 style="margin:0 0 8px;color:var(--accent)">Nxënës: ${analytics.name}</h4>
        <p style="margin:0;font-size:14px;color:var(--muted)">Klasa ${analytics.gradeLevel || '-'}</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px">
    `;

    // Semester cards
    analytics.semesterData.forEach(sem => {
      const color = sem.overall >= 8 ? '#16a34a' : sem.overall >= 6 ? '#f59e0b' : '#dc2626';
      html += `
        <div style="padding:12px;background:#fff;border-radius:10px;border-left:4px solid ${color}">
          <div style="font-size:12px;color:var(--muted);margin-bottom:4px">Semestri ${sem.semester}</div>
          <div style="font-size:24px;font-weight:700;color:${color}">
            ${sem.overall !== null ? sem.overall.toFixed(1) : '-'}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">
            ${sem.detyraCount} detyra
          </div>
        </div>
      `;
    });

    html += `</div>`;

    // Progress chart (ASCII-style bar chart)
    html += `
      <div style="margin-bottom:20px;padding:16px;background:#fff;border-radius:10px">
        <h5 style="margin:0 0 12px;color:var(--accent)">📈 Grafiku i Progresit</h5>
        <div style="display:flex;align-items:flex-end;gap:8px;height:150px">
    `;

    analytics.semesterData.forEach((sem) => {
      if (sem.overall === null) return;
      const height = (sem.overall / 10) * 100;
      const color = sem.overall >= 8 ? '#16a34a' : sem.overall >= 6 ? '#f59e0b' : '#dc2626';

      html += `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end">
          <div style="font-size:11px;font-weight:600;margin-bottom:4px">${sem.overall.toFixed(1)}</div>
          <div style="width:100%;background:${color};border-radius:4px 4px 0 0;height:${height}%;min-height:10px"></div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">S${sem.semester}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // Trends
    if (analytics.trends.length > 0) {
      html += `
        <div style="margin-bottom:20px;padding:16px;background:#fff;border-radius:10px">
          <h5 style="margin:0 0 12px;color:var(--accent)">📊 Tendencat</h5>
      `;

      analytics.trends.forEach(trend => {
        const icon = trend.direction === 'improving' ? '📈' : '📉';
        const color = trend.direction === 'improving' ? '#16a34a' : '#dc2626';
        html += `
          <div style="padding:8px;margin-bottom:6px;background:var(--bg);border-radius:6px;border-left:3px solid ${color}">
            ${icon} Semestri ${trend.semester}: 
            <strong style="color:${color}">
              ${trend.direction === 'improving' ? 'Përmirësim' : 'Rënie'}
            </strong>
            (+/- ${trend.magnitude} pikë)
          </div>
        `;
      });

      html += `</div>`;
    }

    // Strengths & Weaknesses
    html += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="padding:16px;background:#d1fae5;border-radius:10px">
          <h5 style="margin:0 0 12px;color:#065f46">✅ Pikat e Forta</h5>
    `;

    if (analytics.strengths.length > 0) {
      analytics.strengths.forEach(strength => {
        html += `<div style="font-size:13px;margin-bottom:6px;color:#065f46">• ${strength}</div>`;
      });
    } else {
      html += `<div style="font-size:13px;color:#065f46;font-style:italic">Vazhdoni punën e mirë!</div>`;
    }

    html += `</div>`;

    html += `
        <div style="padding:16px;background:#fee2e2;border-radius:10px">
          <h5 style="margin:0 0 12px;color:#991b1b">⚠️ Zona për Përmirësim</h5>
    `;

    if (analytics.weaknesses.length > 0) {
      analytics.weaknesses.forEach(weakness => {
        html += `<div style="font-size:13px;margin-bottom:6px;color:#991b1b">• ${weakness}</div>`;
      });
    } else {
      html += `<div style="font-size:13px;color:#991b1b;font-style:italic">Nuk ka zona shqetësuese!</div>`;
    }

    html += `</div></div>`;

    // Predictions
    if (analytics.predictions.finalGrade) {
      const predColor = parseFloat(analytics.predictions.finalGrade) >= 8 ? '#16a34a' :
        parseFloat(analytics.predictions.finalGrade) >= 6 ? '#f59e0b' : '#dc2626';

      html += `
        <div style="padding:16px;background:var(--assistant);border-radius:10px;border:2px solid ${predColor}">
          <h5 style="margin:0 0 8px;color:var(--accent)">🔮 Parashikim</h5>
          <div style="font-size:14px;margin-bottom:8px">
            Nota e parashikuar finale: 
            <strong style="font-size:20px;color:${predColor}">${analytics.predictions.finalGrade}</strong>
          </div>
          <div style="font-size:12px;color:var(--muted)">
            Besueshmëri: ${analytics.predictions.confidence === 'high' ? 'E lartë' : 'Mesatare'} • 
            Tendenca: ${analytics.predictions.trend === 'ascending' ? '📈 Në rritje' :
          analytics.predictions.trend === 'descending' ? '📉 Në rënie' :
            '➡️ E qëndrueshme'
        }
          </div>
        </div>
      `;
    }

    content.innerHTML = html;
  }

  // Render class analytics
  function renderClassAnalytics(gradeLevel) {
    const analytics = calculateClassAnalytics(gradeLevel);
    if (!analytics) return;

    const content = document.getElementById('analyticsContent');
    if (!content) return;

    let html = `
      <div style="margin-bottom:20px;padding:16px;background:var(--assistant);border-radius:12px">
        <h4 style="margin:0 0 8px;color:var(--accent)">Klasa ${gradeLevel}</h4>
        <p style="margin:0;font-size:14px;color:var(--muted)">${analytics.totalStudents} nxënës gjithsej</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">
    `;

    // Semester averages
    ['semester1', 'semester2', 'semester3', 'overall'].forEach((key, idx) => {
      const label = key === 'overall' ? 'Mesatarja' : `Semestri ${idx + 1}`;
      const avg = analytics.averages[key];
      const color = avg >= 8 ? '#16a34a' : avg >= 6 ? '#f59e0b' : '#dc2626';

      html += `
        <div style="padding:12px;background:#fff;border-radius:10px;text-align:center">
          <div style="font-size:12px;color:var(--muted);margin-bottom:4px">${label}</div>
          <div style="font-size:24px;font-weight:700;color:${avg ? color : 'var(--muted)'}">
            ${avg || '-'}
          </div>
        </div>
      `;
    });

    html += `</div>`;

    // Distribution chart
    html += `
      <div style="margin-bottom:20px;padding:16px;background:#fff;border-radius:10px">
        <h5 style="margin:0 0 12px;color:var(--accent)">📊 Shpërndarja e Notave</h5>
        <div style="display:flex;flex-direction:column;gap:8px">
    `;

    const distData = [
      { label: 'Shkëlqyeshëm (9-10)', count: analytics.distribution.excellent, color: '#16a34a' },
      { label: 'Mirë (7-8.9)', count: analytics.distribution.good, color: '#3b82f6' },
      { label: 'Mesatare (5-6.9)', count: analytics.distribution.average, color: '#f59e0b' },
      { label: 'Dobët (0-4.9)', count: analytics.distribution.poor, color: '#dc2626' }
    ];

    const total = analytics.totalStudents;

    distData.forEach(item => {
      const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
      html += `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span>${item.label}</span>
            <span style="font-weight:600">${item.count} (${percentage}%)</span>
          </div>
          <div style="width:100%;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
            <div style="width:${percentage}%;height:100%;background:${item.color}"></div>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;

    // Top performers
    if (analytics.topPerformers.length > 0) {
      html += `
        <div style="margin-bottom:20px;padding:16px;background:#d1fae5;border-radius:10px">
          <h5 style="margin:0 0 12px;color:#065f46">🏆 Performuesit më të Mirë</h5>
      `;

      analytics.topPerformers.forEach((student, idx) => {
        html += `
          <div style="padding:8px;margin-bottom:4px;background:#fff;border-radius:6px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px">${idx + 1}. ${student.name}</span>
            <span style="font-weight:700;color:#065f46">${student.average}</span>
          </div>
        `;
      });

      html += `</div>`;
    }

    // Needs attention
    if (analytics.needsAttention.length > 0) {
      html += `
        <div style="padding:16px;background:#fee2e2;border-radius:10px">
          <h5 style="margin:0 0 12px;color:#991b1b">⚠️ Nevojitet Vëmendje</h5>
      `;

      analytics.needsAttention.forEach((student, idx) => {
        html += `
          <div style="padding:8px;margin-bottom:4px;background:#fff;border-radius:6px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px">${idx + 1}. ${student.name}</span>
            <span style="font-weight:700;color:#991b1b">${student.average}</span>
          </div>
        `;
      });

      html += `</div>`;
    }

    content.innerHTML = html;
  }

  // Add analytics button to student modal
  function enhanceStudentModalWithAnalytics() {
    const originalOpenStudentModal = window.openStudentModal;
    if (!originalOpenStudentModal) return;

    window.openStudentModal = function (studentId) {
      originalOpenStudentModal(studentId);

      setTimeout(() => {
        const modal = document.getElementById('studentModal');
        if (!modal) return;

        if (modal.querySelector('#viewAnalyticsBtn')) return;

        const modalFooter = modal.querySelector('.modalFooter');
        if (!modalFooter) return;

        const analyticsBtn = document.createElement('button');
        analyticsBtn.id = 'viewAnalyticsBtn';
        analyticsBtn.className = 'btn-secondary';
        analyticsBtn.style.marginRight = '8px';
        analyticsBtn.textContent = '📊 Shfaq Analitikën';

        analyticsBtn.addEventListener('click', () => {
          renderAnalyticsDashboard(studentId);
        });

        const buttonsDiv = modalFooter.querySelector('.modalButtons');
        if (buttonsDiv) {
          buttonsDiv.insertBefore(analyticsBtn, buttonsDiv.firstChild);
        }
      }, 300);
    };
  }

  // Add class analytics button to teacher panel
  function initializeAnalyticsUI() {
    const teacherSection = document.getElementById('teacherToolsSection');
    if (!teacherSection) return;

    if (document.getElementById('classAnalyticsBtn')) return;

    const exportControls = teacherSection.querySelector('.exportControls');
    if (!exportControls) return;

    const btn = document.createElement('button');
    btn.id = 'classAnalyticsBtn';
    btn.className = 'quizBtn';
    btn.textContent = '📊 Analitika e Klasës';

    btn.addEventListener('click', () => {
      if (!state.academic.activeGrade) {
        alert('⚠️ Ju lutem zgjidhni një klasë.');
        return;
      }
      renderAnalyticsDashboard();
    });

    exportControls.appendChild(btn);
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    enhanceStudentModalWithAnalytics();

    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(initializeAnalyticsUI, 100);
        }
      };
    }
  });

  // Export
  window.Analytics = {
    renderAnalyticsDashboard,
    calculateStudentAnalytics,
    calculateClassAnalytics
  };

  console.log('✅ Analytics module initialized (enhanced)');
})();