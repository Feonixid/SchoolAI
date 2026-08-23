// js/gamification.js
// ===================================================================
// GAMIFICATION SYSTEM
// Badges, achievements, points, and rewards for student motivation
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Initialize gamification in state
  if (!state.gamification) {
    state.gamification = {
      studentProgress: {}, // { studentId: { points, level, badges, achievements } }
      globalLeaderboard: []
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

  // Sync gamification data with backend
  async function syncGamificationWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/gamification`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      // Merge backend data into local state
      if (data.gamification) {
        Object.keys(data.gamification).forEach(studentId => {
          state.gamification.studentProgress[studentId] = data.gamification[studentId];
        });
      }
      
      updateLeaderboard();
      console.log(' Gamification synced from backend');
    } catch (err) {
      console.warn('Could not sync gamification:', err.message);
    }
  }

  // Save points to backend
  async function savePointsToBackend(studentId, points, reason) {
    if (!window.Accounts?.isLoggedIn()) return false;
    
    try {
      const res = await fetch(`${API_BASE}/api/gamification/points`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, points, reason })
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      return true;
    } catch (err) {
      console.warn('Could not save points:', err.message);
      return false;
    }
  }

  // Save achievement to backend
  async function saveAchievementToBackend(studentId, achievementId) {
    if (!window.Accounts?.isLoggedIn()) return false;
    
    try {
      const res = await fetch(`${API_BASE}/api/gamification/achievement`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, achievementId })
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      return true;
    } catch (err) {
      console.warn('Could not save achievement:', err.message);
      return false;
    }
  }

  // Achievement definitions
  const ACHIEVEMENTS = {
    first_perfect: {
      id: 'first_perfect',
      name: 'Perfeksion i Parë',
      description: 'Mori notën 10 për herë të parë',
      icon: '⭐',
      points: 50,
      color: '#f59e0b'
    },
    perfect_streak_3: {
      id: 'perfect_streak_3',
      name: 'Seri e Artë',
      description: 'Tre nota 10 me radhë',
      icon: '🏆',
      points: 100,
      color: '#f59e0b'
    },
    attendance_perfect: {
      id: 'attendance_perfect',
      name: 'Gjithmonë Prezent',
      description: 'Prezencë 100% për një muaj',
      icon: '📅',
      points: 75,
      color: '#3b82f6'
    },
    homework_master: {
      id: 'homework_master',
      name: 'Mjeshër i Detyrave',
      description: 'Dorëzoi 20 detyra',
      icon: '📚',
      points: 100,
      color: '#8b5cf6'
    },
    semester_excellent: {
      id: 'semester_excellent',
      name: 'Semestër i Shkëlqyer',
      description: 'Mesatare mbi 9.0 për semestër',
      icon: '💎',
      points: 150,
      color: '#10b981'
    },
    improvement_hero: {
      id: 'improvement_hero',
      name: 'Heroi i Përmirësimit',
      description: 'Përmirësoi mesataren me 2+ pikë',
      icon: '📈',
      points: 125,
      color: '#16a34a'
    },
    participation_champion: {
      id: 'participation_champion',
      name: 'Kampion i Pjesëmarrjes',
      description: '10+ shënime pozitive për pjesëmarrje',
      icon: '🙋',
      points: 80,
      color: '#0ea5e9'
    },
    project_excellence: {
      id: 'project_excellence',
      name: 'Projekt i Jashtëzakonshëm',
      description: 'Nota 10 në projekt',
      icon: '🎯',
      points: 100,
      color: '#8b5cf6'
    },
    consistent_performer: {
      id: 'consistent_performer',
      name: 'Performues i Qëndrueshëm',
      description: 'Mesatare mbi 8.0 për të tre semestrat',
      icon: '⚡',
      points: 200,
      color: '#eab308'
    },
    knowledge_seeker: {
      id: 'knowledge_seeker',
      name: 'Kërkues i Dijes',
      description: 'Pyeti AI 50 herë',
      icon: '🔍',
      points: 60,
      color: '#6366f1'
    },
    // NEW BADGES (Total ~25)
    early_bird: {
      id: 'early_bird',
      name: 'Zog i Hershëm',
      description: 'Dorëzoi detyrën 2 ditë para afatit',
      icon: '🌅',
      points: 40,
      color: '#f97316'
    },
    team_player: {
      id: 'team_player',
      name: 'Lojtar Skuadre',
      description: 'Ndihmoi një shok klase në projekt',
      icon: '🤝',
      points: 60,
      color: '#ec4899'
    },
    math_wizard: {
      id: 'math_wizard',
      name: 'Magjistar i Numrave',
      description: '5 nota 10 rresht në lëndë shkencore',
      icon: '🔢',
      points: 120,
      color: '#8b5cf6'
    },
    bookworm: {
      id: 'bookworm',
      name: 'Lexues i Pasur',
      description: 'Lexoi 5 libra jashtëshkollorë',
      icon: '📖',
      points: 80,
      color: '#14b8a6'
    },
    presentation_pro: {
      id: 'presentation_pro',
      name: 'Profesionist Prezantimi',
      description: 'Prezantim perfekt para klasës',
      icon: '📢',
      points: 90,
      color: '#f43f5e'
    },
    creative_mind: {
      id: 'creative_mind',
      name: 'Mendje Krijuese',
      description: 'Zgjidhje unike për një problem të vështirë',
      icon: '💡',
      points: 110,
      color: '#eab308'
    },
    helper_hero: {
      id: 'helper_hero',
      name: 'Ndihmës Hero',
      description: 'Vullnetar për pastrimin e klasës',
      icon: '🧹',
      points: 50,
      color: '#10b981'
    },
    tech_savvy: {
      id: 'tech_savvy',
      name: 'Ekspert Teknologjie',
      description: 'Përdori mjete dixhitale në detyrë',
      icon: '💻',
      points: 70,
      color: '#3b82f6'
    },
    language_master: {
      id: 'language_master',
      name: 'Mjeshtër i Gjuhës',
      description: 'Ese pa asnjë gabim drejtshkrimor',
      icon: '✍️',
      points: 100,
      color: '#6366f1'
    },
    history_buff: {
      id: 'history_buff',
      name: 'Adhurues i Historisë',
      description: 'Memorizoi datat kyçe të një kapitulli',
      icon: '🏛️',
      points: 60,
      color: '#d97706'
    },
    science_star: {
      id: 'science_star',
      name: 'Yll i Shkencës',
      description: 'Eksperiment i suksesshëm në laborator',
      icon: '🧪',
      points: 90,
      color: '#22c55e'
    },
    sports_mvp: {
      id: 'sports_mvp',
      name: 'MVP Sportiv',
      description: 'Kapiten ose performancë e lartë në fiskulturë',
      icon: '⚽',
      points: 80,
      color: '#ef4444'
    },
    artistic_soul: {
      id: 'artistic_soul',
      name: 'Shpirt Artistik',
      description: 'Krijoi një vepër arti për shkollën',
      icon: '🎨',
      points: 85,
      color: '#a855f7'
    },
    problem_solver: {
      id: 'problem_solver',
      name: 'Zgjidhës i Problemeve',
      description: 'Zgjodhi një konflikt në klasë me qetësi',
      icon: '🧩',
      points: 120,
      color: '#06b6d4'
    },
    super_focus: {
      id: 'super_focus',
      name: 'Super Fokus',
      description: 'Nuk u shpërqendrua gjatë gjithë orës',
      icon: '🧘',
      points: 50,
      color: '#8b5cf6'
    }
  };

  // Initialize student gamification data
  function initializeStudentGamification(studentId) {
    if (!state.gamification.studentProgress[studentId]) {
      state.gamification.studentProgress[studentId] = {
        points: 0,
        level: 1,
        badges: [],
        achievements: [],
        stats: {
          questionsAsked: 0,
          homeworkCompleted: 0,
          perfectScores: 0,
          consecutivePerfect: 0
        }
      };
    }
    return state.gamification.studentProgress[studentId];
  }

  // Award achievement
  function awardAchievement(studentId, achievementId) {
    const progress = initializeStudentGamification(studentId);

    // Check if already has this achievement
    if (progress.achievements.includes(achievementId)) {
      return false;
    }

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.error('Unknown achievement:', achievementId);
      return false;
    }

    // Award achievement
    progress.achievements.push(achievementId);
    progress.badges.push({
      id: achievementId,
      name: achievement.name,
      icon: achievement.icon,
      earnedAt: Date.now()
    });

    // Add points
    addPoints(studentId, achievement.points);

    // Save to backend
    saveAchievementToBackend(studentId, achievementId);

    console.log(`✅ Achievement awarded: ${achievement.name} to student ${studentId}`);

    // Show notification
    showAchievementNotification(achievement);

    return true;
  }

  // Add points
  function addPoints(studentId, points, reason = '') {
    const progress = initializeStudentGamification(studentId);
    progress.points += points;

    // Level up check
    const newLevel = calculateLevel(progress.points);
    if (newLevel > progress.level) {
      progress.level = newLevel;
      showLevelUpNotification(newLevel);
    }

    // Save to backend (async, non-blocking)
    savePointsToBackend(studentId, points, reason);

    updateLeaderboard();
  }

  // Calculate level from points
  function calculateLevel(points) {
    // Level formula: 100 points per level, with increasing requirements
    return Math.floor(Math.sqrt(points / 50)) + 1;
  }

  // Show achievement notification
  function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, ${achievement.color}, ${achievement.color}dd);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease, fadeOut 0.5s ease 2.5s;
      max-width: 350px;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px">
        <div style="font-size: 40px">${achievement.icon}</div>
        <div>
          <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px">
            Arritje e Re! 🎉
          </div>
          <div style="font-size: 14px; opacity: 0.95">${achievement.name}</div>
          <div style="font-size: 12px; opacity: 0.8">+${achievement.points} pikë</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Show level up notification
  function showLevelUpNotification(level) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease, fadeOut 0.5s ease 3s;
      text-align: center;
    `;

    notification.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 8px">⬆️</div>
      <div style="font-weight: 700; font-size: 18px; margin-bottom: 4px">
        Nivel i Ri!
      </div>
      <div style="font-size: 28px; font-weight: 700">
        Niveli ${level}
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3500);
  }

  // Check and award achievements automatically
  function checkAchievements(studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return;

    const progress = initializeStudentGamification(studentId);

    // Check first perfect score
    if (student.semesters) {
      Object.values(student.semesters).forEach(sem => {
        if (sem.detyra.some(grade => grade === 10) || sem.projekti === 10 || sem.testi === 10) {
          if (!progress.achievements.includes('first_perfect')) {
            awardAchievement(studentId, 'first_perfect');
          }
        }

        // Check semester excellence
        const semAvg = calculateSemesterAverage(sem);
        if (semAvg >= 9.0) {
          if (!progress.achievements.includes('semester_excellent')) {
            awardAchievement(studentId, 'semester_excellent');
          }
        }

        // Check project excellence
        if (sem.projekti === 10) {
          if (!progress.achievements.includes('project_excellence')) {
            awardAchievement(studentId, 'project_excellence');
          }
        }
      });

      // Check consistent performer
      const sem1 = calculateSemesterAverage(student.semesters.semester1);
      const sem2 = calculateSemesterAverage(student.semesters.semester2);
      const sem3 = calculateSemesterAverage(student.semesters.semester3);

      if (sem1 >= 8.0 && sem2 >= 8.0 && sem3 >= 8.0) {
        if (!progress.achievements.includes('consistent_performer')) {
          awardAchievement(studentId, 'consistent_performer');
        }
      }

      // Check improvement
      if (sem1 !== null && sem3 !== null && (sem3 - sem1) >= 2.0) {
        if (!progress.achievements.includes('improvement_hero')) {
          awardAchievement(studentId, 'improvement_hero');
        }
      }
    }

    // Check homework master
    const totalHomework = student.semesters ?
      Object.values(student.semesters).reduce((sum, sem) => sum + sem.detyra.length, 0) : 0;

    if (totalHomework >= 20) {
      if (!progress.achievements.includes('homework_master')) {
        awardAchievement(studentId, 'homework_master');
      }
    }

    // Check participation
    if (window.Behavior) {
      const behaviorSummary = window.Behavior.getBehaviorSummary(studentId);
      if (behaviorSummary.participation >= 10) {
        if (!progress.achievements.includes('participation_champion')) {
          awardAchievement(studentId, 'participation_champion');
        }
      }
    }

    // Check attendance
    if (window.Attendance) {
      const attendanceStats = window.Attendance.getAttendanceStats(studentId);
      if (attendanceStats.attendanceRate >= 100 && attendanceStats.total >= 20) {
        if (!progress.achievements.includes('attendance_perfect')) {
          awardAchievement(studentId, 'attendance_perfect');
        }
      }
    }
  }

  // Calculate semester average (helper)
  function calculateSemesterAverage(semester) {
    const grades = [...semester.detyra];
    if (semester.projekti !== null) grades.push(semester.projekti);
    if (semester.testi !== null) grades.push(semester.testi);
    if (grades.length === 0) return null;
    return grades.reduce((a, b) => a + b, 0) / grades.length;
  }

  // Update leaderboard
  function updateLeaderboard() {
    const leaderboard = [];

    Object.keys(state.gamification.studentProgress).forEach(studentId => {
      const student = state.students.list.find(s => s.id === parseInt(studentId));
      if (!student) return;

      const progress = state.gamification.studentProgress[studentId];
      leaderboard.push({
        studentId: parseInt(studentId),
        name: student.name,
        points: progress.points,
        level: progress.level,
        achievements: progress.achievements.length
      });
    });

    leaderboard.sort((a, b) => b.points - a.points);
    state.gamification.globalLeaderboard = leaderboard;
  }

  // Prompt student to identify themselves
  function promptStudentIdentity() {
    // If we have an active grade, filter list, otherwise show all
    let students = state.students.list;
    if (state.academic.activeGrade) {
      students = students.filter(s => s.gradeLevel === state.academic.activeGrade);
    }

    if (students.length === 0) {
      alert('⚠️ Nuk ka nxënës të regjistruar.');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:400px;max-width:95vw">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">Kush jeni ju?</h3>
          <button class="icon-btn close-identity" style="width:28px;height:28px;font-size:16px">×</button>
        </div>
        
        <input type="text" id="searchStudent" class="student-search-input" placeholder="Kërko emrin tënd..." autofocus>
        
        <div id="studentSelectionList" class="student-select-list">
          ${renderStudentOptions(students)}
        </div>
        
        <div style="margin-top:16px;text-align:right">
          <button class="btn-secondary close-identity">Anulo</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const filterList = (term) => {
      const filtered = students.filter(s => s.name.toLowerCase().includes(term.toLowerCase()));
      modal.querySelector('#studentSelectionList').innerHTML = renderStudentOptions(filtered);
      attachClickHandlers();
    };

    modal.querySelector('#searchStudent').addEventListener('input', (e) => {
      filterList(e.target.value);
    });

    // Close handlers
    modal.querySelectorAll('.close-identity').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    function attachClickHandlers() {
      modal.querySelectorAll('.student-select-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.id);
          modal.remove();
          showStudentProgress(id);
        });
      });
    }

    attachClickHandlers();
  }

  function renderStudentOptions(list) {
    if (list.length === 0) return '<div style="color:var(--muted);text-align:center;padding:12px;font-style:italic">Nuk u gjet asnjë nxënës</div>';
    return list.map(student => `
      <div class="student-select-item" data-id="${student.id}">
        <span style="font-weight:600">${student.name}</span>
        <span style="font-size:12px;color:var(--muted);background:rgba(127,127,127,0.1);padding:2px 6px;border-radius:4px">
          Kl. ${student.gradeLevel || '?'}
        </span>
      </div>
    `).join('');
  }

  // Show student progress
  function showStudentProgress(studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return;

    const progress = initializeStudentGamification(studentId);

    // Check for new achievements
    checkAchievements(studentId);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    const nextLevelPoints = Math.pow(progress.level, 2) * 50;
    const progressPercent = ((progress.points % nextLevelPoints) / nextLevelPoints * 100).toFixed(1);

    modal.innerHTML = `
      <div class="modal gamification-modal">
        <div class="gamification-header">
          <h3 style="margin:0;color:var(--accent)">🎮 Progresi i Lojës - ${student.name}</h3>
          <button class="icon-btn close-progress" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div class="level-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;position:relative;z-index:2">
            <div>
              <div style="font-size:14px;opacity:0.9">Niveli Aktual</div>
              <div style="font-size:36px;font-weight:700">Niveli ${progress.level}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:14px;opacity:0.9">Pikë Totale</div>
              <div style="font-size:28px;font-weight:700">${progress.points}</div>
            </div>
          </div>
          <div class="progress-track" style="position:relative;z-index:2">
            <div class="progress-fill" style="width:${progressPercent}%"></div>
          </div>
          <div style="font-size:12px;opacity:0.8;margin-top:6px;position:relative;z-index:2">
            ${progressPercent}% deri në Nivelin ${progress.level + 1}
          </div>
        </div>

        <div class="semester-tabs" style="margin-bottom:16px">
          <button class="semester-tab active" data-tab="earned">🏆 Të Fituara</button>
          <button class="semester-tab" data-tab="all">🎯 Të Gjitha Arritjet</button>
        </div>

        <div id="tab-earned" class="gamification-tab-content">
          <h4 style="margin:0 0 12px;color:var(--accent)">🏆 Arritjet (${progress.achievements.length})</h4>
          <div class="badges-grid">
            ${progress.badges.map(badge => {
      const achievement = ACHIEVEMENTS[badge.id];
      return `
                  <div class="badge-card">
                    <div class="badge-icon" style="color:${achievement.color}">${badge.icon}</div>
                    <div style="font-size:13px;font-weight:700;color:${achievement.color}">${badge.name}</div>
                    <div style="font-size:11px;color:var(--muted)">
                      ${new Date(badge.earnedAt).toLocaleDateString('sq-AL')}
                    </div>
                  </div>
                `;
    }).join('')}
          </div>
          ${progress.badges.length === 0 ? `
            <div style="padding:40px;text-align:center;color:var(--muted);background:var(--panel);border-radius:8px">
              Nuk ke fituar asnjë arritje ende. Vazhdo punën!
            </div>
          ` : ''}
        </div>

        <div id="tab-all" class="gamification-tab-content" style="display:none">
          <h4 style="margin:0 0 12px;color:var(--accent)">🎯 Të Gjitha Arritjet e Mundshme</h4>
          <div class="badges-grid">
            ${Object.values(ACHIEVEMENTS).map(achievement => {
      const isEarned = progress.achievements.includes(achievement.id);
      const cardClass = isEarned ? 'badge-card' : 'badge-card locked';

      return `
                <div class="${cardClass}">
                  <div class="badge-icon" style="color:${isEarned ? achievement.color : 'inherit'}">${achievement.icon}</div>
                  <div style="font-size:13px;font-weight:700;color:${isEarned ? achievement.color : 'inherit'}">
                    ${achievement.name}
                  </div>
                  <div style="font-size:11px;color:var(--muted);margin-bottom:4px">
                    ${achievement.description}
                  </div>
                  <div style="font-size:11px;font-weight:600;color:var(--accent);margin-top:auto">
                    ${isEarned ? '✅ Fituar' : `+${achievement.points} pikë`}
                  </div>
                  ${!isEarned && state.ui.teacherMode ? `
                    <button class="award-manual-btn gamify-btn" data-id="${achievement.id}" 
                            style="margin-top:8px;font-size:11px;padding:4px 8px;width:100%">
                      ➕ Jep
                    </button>
                  ` : ''}
                </div>
              `;
    }).join('')}
          </div>
        </div>

        <div style="text-align:center;margin-top:20px">
          <button class="btn-secondary close-progress">Mbyll</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Tab switching
    modal.querySelectorAll('.semester-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.semester-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        modal.querySelectorAll('.gamification-tab-content').forEach(c => c.style.display = 'none');
        modal.querySelector(`#tab-${tab.dataset.tab}`).style.display = 'block';
      });
    });

    modal.querySelectorAll('.close-progress').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Manual award handlers
    modal.querySelectorAll('.award-manual-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const achievementId = btn.dataset.id;
        if (confirm(`A jeni i sigurtë se doni t'i jepni arritjen "${ACHIEVEMENTS[achievementId].name}"?`)) {
          awardAchievement(studentId, achievementId);
          modal.remove();
          showStudentProgress(studentId); // Refresh and show updated
          // Re-open in "all" tab? simplified to just reopen for now, can improve
          setTimeout(() => {
            const tabs = document.querySelectorAll('.semester-tab');
            if (tabs[1]) tabs[1].click();
          }, 100);
        }
      });
    });
  }

  // Show leaderboard
  function showLeaderboard() {
    updateLeaderboard();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal gamification-modal">
        <div class="gamification-header">
          <h3 style="margin:0;color:var(--accent)">🏆 Tabela e Liderëve</h3>
          <button class="icon-btn close-leaderboard" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:4px">
          ${state.gamification.globalLeaderboard.slice(0, 50).map((entry, idx) => {
      const rankClass = idx < 3 ? `top-${idx + 1}` : '';
      return `
              <div class="leaderboard-item ${rankClass}">
                <div class="leaderboard-rank">${idx + 1}</div>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:15px">${entry.name}</div>
                  <div style="font-size:12px;color:var(--muted)">
                    Niveli ${entry.level} • ${entry.achievements} arritje
                  </div>
                </div>
                <div style="font-size:18px;font-weight:700;color:var(--accent)">
                  ${entry.points}
                </div>
              </div>
            `;
    }).join('')}
        </div>

        ${state.gamification.globalLeaderboard.length === 0 ? `
          <div style="padding:40px;text-align:center;color:var(--muted);background:var(--panel);border-radius:8px">
            Askush nuk ka pikë ende. Filloni të luani!
          </div>
        ` : ''}

        <div style="text-align:center;margin-top:20px">
          <button class="btn-secondary close-leaderboard">Mbyll</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.close-leaderboard').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Add gamification button to student modal
  function enhanceStudentModalWithGamification() {
    const originalOpenStudentModal = window.openStudentModal;
    if (!originalOpenStudentModal) return;

    window.openStudentModal = function (studentId) {
      originalOpenStudentModal(studentId);

      setTimeout(() => {
        const modal = document.getElementById('studentModal');
        if (!modal) return;

        if (modal.querySelector('#gamificationBtn')) return;

        const progress = initializeStudentGamification(studentId);

        const behaviorSummary = modal.querySelector('#behaviorSummary');
        if (!behaviorSummary) return;

        const gamificationHTML = `
          <div id="gamificationSummary" style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h4 class="panel-title" style="margin:0">🎮 Progresi i Lojës</h4>
              <button id="gamificationBtn" class="gamify-btn" 
                      style="padding:4px 12px;font-size:12px;border-radius:6px">
                🏆 Shfaq Arritjet
              </button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
              <div style="padding:12px 8px;background:var(--panel);border:1px solid rgba(127,127,127,0.1);
                   border-radius:8px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${progress.level}</div>
                <div style="font-size:11px;color:var(--muted)">Niveli</div>
              </div>
              <div style="padding:12px 8px;background:var(--panel);border:1px solid rgba(127,127,127,0.1);
                   border-radius:8px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${progress.points}</div>
                <div style="font-size:11px;color:var(--muted)">Pikë</div>
              </div>
              <div style="padding:12px 8px;background:var(--panel);border:1px solid rgba(127,127,127,0.1);
                   border-radius:8px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${progress.achievements.length}</div>
                <div style="font-size:11px;color:var(--muted)">Arritje</div>
              </div>
            </div>
          </div>
        `;

        behaviorSummary.insertAdjacentHTML('afterend', gamificationHTML);

        modal.querySelector('#gamificationBtn').addEventListener('click', () => {
          showStudentProgress(studentId);
        });
      }, 250);
    };
  }

  // Add leaderboard button to teacher panel
  function initializeGamificationUI() {
    const featureContainer = document.getElementById('teacherFeatureButtons');
    if (!featureContainer) return;

    let quizControls = featureContainer.querySelector('.quizControls');

    // Check if section exists (by checking for leaderboard button)
    if (!document.getElementById('leaderboardBtn')) {
      const section = document.createElement('div');
      section.style.marginTop = '16px';
      section.innerHTML = `
        <h3 class="panel-title">🎮 Gamifikimi</h3>
        <div class="quizControls">
          <button id="leaderboardBtn" class="quizBtn">🏆 Tabela e Liderëve</button>
        </div>
      `;
      featureContainer.appendChild(section);
      document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);

      // Update reference
      quizControls = section.querySelector('.quizControls');
    } else {
      // If it exists, finding the parent controls div
      quizControls = document.getElementById('leaderboardBtn').parentElement;
    }

    // Add Badge Gallery Button (Check to avoid duplicates)
    if (quizControls && !quizControls.querySelector('.gallery-btn')) {
      const galleryBtn = document.createElement('button');
      galleryBtn.className = 'quizBtn gallery-btn';
      galleryBtn.textContent = '🏅 Lista e Badges';
      galleryBtn.style.marginTop = '4px';
      galleryBtn.addEventListener('click', showTeacherBadgeGallery);
      quizControls.appendChild(galleryBtn);
    }
  }

  // Show Teacher Badge Gallery (Reference & Manual Award)
  function showTeacherBadgeGallery() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal badges-gallery-modal">
        <div class="gamification-header">
          <h3 style="margin:0;color:var(--accent)">🏅 Galeria e Badges (Mësuesi)</h3>
          <button class="icon-btn close-gallery" style="width:32px;height:32px;font-size:18px">×</button>
        </div>
        <p class="smallNote" style="margin-bottom:12px">Kliko një badge për t'ia dhënë manualisht një nxënësi.</p>

        <div class="badges-gallery-grid">
          ${Object.values(ACHIEVEMENTS).map(achievement => `
            <div class="badge-card gallery-item" data-id="${achievement.id}" style="cursor:pointer;border:1px solid ${achievement.color}40">
              <div class="badge-icon" style="color:${achievement.color}">${achievement.icon}</div>
              <div style="font-size:13px;font-weight:700;color:${achievement.color}">
                ${achievement.name}
              </div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px">
                ${achievement.description}
              </div>
              <div style="font-size:11px;font-weight:600;color:var(--accent);margin-top:auto">
                +${achievement.points} pikë
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align:center;margin-top:20px">
          <button class="btn-secondary close-gallery">Mbyll</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelectorAll('.close-gallery').forEach(btn => btn.addEventListener('click', () => modal.remove()));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Badge click handler - Select Student to Award
    modal.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const badgeId = item.dataset.id;
        modal.remove();
        promptStudentForAward(badgeId);
      });
    });
  }

  // Prompt to select a student for manual award
  function promptStudentForAward(badgeId) {
    const achievement = ACHIEVEMENTS[badgeId];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    // Filter students by active grade if set
    let students = state.students.list;
    if (state.academic.activeGrade) {
      students = students.filter(s => s.gradeLevel === state.academic.activeGrade);
    }

    modal.innerHTML = `
        <div class="modal" style="width:400px;max-width:95vw">
          <h3 style="margin:0 0 16px;color:var(--accent)">Jep: ${achievement.name} ${achievement.icon}</h3>
          <p class="smallNote">Zgjidhni nxënësin që do ta marrë këtë badge.</p>
          
          <input type="text" id="searchAwardStudent" class="student-search-input" placeholder="Kërko nxënësin..." autofocus>
          
          <div id="awardStudentList" class="student-select-list">
            ${renderStudentOptions(students)}
          </div>
          
          <div style="margin-top:16px;text-align:right">
            <button class="btn-secondary close-award">Anulo</button>
          </div>
        </div>
      `;

    document.body.appendChild(modal);

    const filterList = (term) => {
      const filtered = students.filter(s => s.name.toLowerCase().includes(term.toLowerCase()));
      modal.querySelector('#awardStudentList').innerHTML = renderStudentOptions(filtered);
      attachAwardHandlers();
    };

    modal.querySelector('#searchAwardStudent').addEventListener('input', (e) => filterList(e.target.value));
    modal.querySelector('.close-award').addEventListener('click', () => modal.remove());

    function attachAwardHandlers() {
      modal.querySelectorAll('.student-select-item').forEach(item => {
        item.addEventListener('click', () => {
          const studentId = parseInt(item.dataset.id);
          const selectedStudent = state.students.list.find(s => s.id === studentId);

          if (confirm(`T'i japësh "${achievement.name}" nxënësit ${selectedStudent.name}?`)) {
            awardAchievement(studentId, badgeId);
            modal.remove();
            showTeacherBadgeGallery(); // Return to gallery
          }
        });
      });
    }
    attachAwardHandlers();
  }

  // Auto-check achievements when saving student data
  const originalSaveStudent = window.saveStudent;
  if (originalSaveStudent) {
    window.saveStudent = function (student) {
      originalSaveStudent(student);
      checkAchievements(student.id);
    };
  }

  /* Inline styles moved to style.css */

  // Initialize teacher UI if in teacher mode
  const originalApplyModeUI = window.applyModeUI;
  if (originalApplyModeUI) {
    window.applyModeUI = function () {
      originalApplyModeUI();
      if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
        setTimeout(initializeGamificationUI, 100);
        syncGamificationWithBackend(); // Sync on teacher mode
      } else {
        // Initialize Student UI
        setTimeout(initializeStudentGamificationUI, 100);
      }
    };
  }

  // Sync on teacher mode unlocked event
  window.addEventListener('teacherModeUnlocked', () => {
    syncGamificationWithBackend();
  });

  // Also try to init student UI immediately
  setTimeout(initializeStudentGamificationUI, 100);

  // Add gamification button to student panel
  function initializeStudentGamificationUI() {
    const toolsPanel = document.getElementById('studentToolsSection');
    if (!toolsPanel) return;

    if (document.getElementById('studentGamificationBtn')) return;

    // Insert after tools
    const optionsSection = toolsPanel.querySelector('h2.panel-title:last-of-type'); // "Opsione"
    if (!optionsSection) return;

    const div = document.createElement('div');
    div.style.marginBottom = '12px';
    div.innerHTML = `
    <h2 class="panel-title">🏆 Arritjet</h2>
    <button id="studentGamificationBtn" style="width:100%;padding:10px;background:linear-gradient(135deg, #667eea, #764ba2);
              color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
      <span>⭐</span> Shiko Arritjet e Mia
    </button>
`;

    toolsPanel.insertBefore(div, optionsSection);

    document.getElementById('studentGamificationBtn').addEventListener('click', () => {
      promptStudentIdentity();
    });
  }

  // Prompt student to identify themselves
  function promptStudentIdentity() {
    // If we have an active grade, filter list, otherwise show all
    let students = state.students.list;
    if (state.academic.activeGrade) {
      students = students.filter(s => s.gradeLevel === state.academic.activeGrade);
    }

    if (students.length === 0) {
      alert('⚠️ Nuk ka nxënës të regjistruar.');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:400px;max-width:95vw">
        <h3 style="margin:0 0 16px;color:var(--accent)">Kush jeni ju?</h3>
        <input type="text" id="searchStudent" placeholder="Kërko emrin..." 
               style="width:100%;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #ddd">
        <div id="studentSelectionList" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
          ${renderStudentOptions(students)}
        </div>
        <button class="btn-secondary close-identity" style="margin-top:12px;width:100%">Anulo</button>
      </div>
`;

    document.body.appendChild(modal);

    const filterList = (term) => {
      const filtered = students.filter(s => s.name.toLowerCase().includes(term.toLowerCase()));
      modal.querySelector('#studentSelectionList').innerHTML = renderStudentOptions(filtered);
      attachClickHandlers();
    };

    modal.querySelector('#searchStudent').addEventListener('input', (e) => {
      filterList(e.target.value);
    });

    modal.querySelector('.close-identity').addEventListener('click', () => modal.remove());

    function attachClickHandlers() {
      modal.querySelectorAll('.student-select-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.id);
          modal.remove();
          // Persist login
          if (window.persistStudentLogin) {
            window.persistStudentLogin(id);
          }
          showStudentProgress(id);
        });
      });
    }

    attachClickHandlers();
  }

  function renderStudentOptions(list) {
    if (list.length === 0) return '<div style="color:gray;text-align:center;padding:10px">Nuk u gjet asnjë nxënës</div>';
    return list.map(student => `
      <div class="student-select-item" data-id="${student.id}"
           style="padding:10px;background:#f3f7ff;border-radius:6px;cursor:pointer;font-weight:500">
        ${student.name} <span style="font-size:12px;color:gray;margin-left:4px">(Kl. ${student.gradeLevel || '?'})</span>
      </div>
  `).join('');
  }

  // Render Badges in a specific container (for Student Modal Integration)
  function renderBadgesInContainer(studentId, container) {
    if (!container) return;
    const progress = initializeStudentGamification(studentId);

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:8px;background:var(--panel);border-radius:8px">
            <div>
                <div style="font-size:12px;color:var(--muted)">Niveli</div>
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${progress.level}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--muted)">Pikë</div>
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${progress.points}</div>
            </div>
            <div>
                <div style="font-size:12px;color:var(--muted)">Badges</div>
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${progress.achievements.length}</div>
            </div>
        </div>
        <div class="badges-gallery-grid" style="max-height:300px;grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));gap:8px;">
            ${progress.badges.map(badge => {
      const achievement = ACHIEVEMENTS[badge.id];
      return `
                  <div class="badge-card" style="padding:8px;">
                    <div class="badge-icon" style="font-size:24px;">${badge.icon}</div>
                    <div style="font-size:11px;font-weight:700;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${badge.name}</div>
                  </div>
                `;
    }).join('')}
            ${progress.badges.length === 0 ? '<div style="grid-column:1/-1;text-align:center;color:var(--muted);font-style:italic;padding:20px;">Ende asnjë badge</div>' : ''}
        </div>
      `;
  }

  // Export
  window.Gamification = {
    awardAchievement,
    addPoints,
    showStudentProgress,
    showLeaderboard,
    checkAchievements,
    initializeStudentGamificationUI,
    renderBadgesInContainer,
    syncGamificationWithBackend
  };

  console.log('✅ Gamification module initialized');
})();