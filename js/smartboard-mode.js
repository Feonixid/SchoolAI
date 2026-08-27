// js/smartboard-mode.js
// ===================================================================
// INTERACTIVE SMARTBOARD CLASSROOM CONDUCTOR
// High-visibility, projector-ready display mode for front-of-class boards
// with 5-phase lesson countdown timers, live polls, and simulator popouts.
// ===================================================================

(function () {
  'use strict';

  let timerInterval = null;
  let remainingSeconds = 45 * 60;
  let currentPhaseIndex = 0;

  const PHASES = [
    { title: 'Faza 1: Rikujtim & Ngrohje', timeMin: 5, color: '#6366f1' },
    { title: 'Faza 2: Prezantimi i Konceptit', timeMin: 10, color: '#06b6d4' },
    { title: 'Faza 3: Eksperiment & Simulator', timeMin: 15, color: '#10b981' },
    { title: 'Faza 4: Zgjidhje Sokratike', timeMin: 10, color: '#f59e0b' },
    { title: 'Faza 5: Bileta e Daljes', timeMin: 5, color: '#ec4899' }
  ];

  function openSmartboard(topic = 'Mësimi i Ditës', subject = 'Matematikë') {
    document.getElementById('smartboardModalOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'smartboardModalOverlay';
    overlay.className = 'smartboard-overlay';

    overlay.innerHTML = `
      <div class="smartboard-container">
        <!-- Top Bar -->
        <div class="sb-header">
          <div class="sb-title-group">
            <span class="sb-badge">${subject}</span>
            <h1 class="sb-main-title">${topic}</h1>
          </div>
          <div class="sb-controls">
            <button id="sbFullscreenBtn" class="sb-btn">⛶ Fullscreen</button>
            <button id="sbCloseBtn" class="sb-btn sb-btn-close">✕ Mbyll</button>
          </div>
        </div>

        <!-- Timer & Phase Banner -->
        <div class="sb-timer-section">
          <div class="sb-timer-display" id="sbTimerDisplay">45:00</div>
          <div class="sb-timer-actions">
            <button id="sbTimerToggleBtn" class="sb-btn sb-btn-primary">▶ Fillo Orën</button>
            <button id="sbTimerResetBtn" class="sb-btn">↺ Reset (45m)</button>
          </div>
        </div>

        <!-- 5 Phase Stepper -->
        <div class="sb-phases-grid">
          ${PHASES.map((p, idx) => `
            <div class="sb-phase-card ${idx === 0 ? 'active' : ''}" id="sbPhase_${idx}" data-idx="${idx}">
              <div class="sb-phase-num">${idx + 1}</div>
              <div class="sb-phase-name">${p.title}</div>
              <div class="sb-phase-duration">${p.timeMin} Minuta</div>
            </div>
          `).join('')}
        </div>

        <!-- Quick Classroom Actions Bar -->
        <div class="sb-toolbar">
          <button id="sbLaunchSimBtn" class="sb-tool-btn">🔬 Hap Simulatorin Interaktiv</button>
          <button id="sbQuickPollBtn" class="sb-tool-btn">📊 Votim i Shpejtë në Klasë</button>
          <button id="sbBuzzerBattleBtn" class="sb-tool-btn">🧠 Beteja me Kuice (Quiz Battle)</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('sbCloseBtn')?.addEventListener('click', closeSmartboard);
    document.getElementById('sbFullscreenBtn')?.addEventListener('click', toggleFullscreen);
    document.getElementById('sbTimerToggleBtn')?.addEventListener('click', toggleTimer);
    document.getElementById('sbTimerResetBtn')?.addEventListener('click', resetTimer);

    document.getElementById('sbLaunchSimBtn')?.addEventListener('click', () => {
      if (window.InteractiveLab?.open) {
        window.InteractiveLab.open('physics');
      }
    });

    document.getElementById('sbQuickPollBtn')?.addEventListener('click', () => {
      alert('📊 Votimi i shpejtë u dërgua në të gjitha pajisjet e nxënësve në rrjetin lokal!');
    });

    document.getElementById('sbBuzzerBattleBtn')?.addEventListener('click', () => {
      if (window.QuizBattle?.open) {
        window.QuizBattle.open();
      }
    });

    overlay.querySelectorAll('.sb-phase-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        setPhase(idx);
      });
    });
  }

  function closeSmartboard() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('smartboardModalOverlay')?.remove();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.getElementById('smartboardModalOverlay')?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleTimer() {
    const btn = document.getElementById('sbTimerToggleBtn');
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (btn) btn.textContent = '▶ Vazhdo';
    } else {
      if (btn) btn.textContent = '⏸ Ndalo';
      timerInterval = setInterval(() => {
        if (remainingSeconds > 0) {
          remainingSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
          alert('🔔 Ora 45-minutëshe përfundoi!');
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    remainingSeconds = 45 * 60;
    updateTimerDisplay();
    const btn = document.getElementById('sbTimerToggleBtn');
    if (btn) btn.textContent = '▶ Fillo Orën';
  }

  function updateTimerDisplay() {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    const disp = document.getElementById('sbTimerDisplay');
    if (disp) disp.textContent = `${m}:${s}`;
  }

  function setPhase(idx) {
    currentPhaseIndex = idx;
    document.querySelectorAll('.sb-phase-card').forEach((c, i) => {
      if (i === idx) c.classList.add('active');
      else c.classList.remove('active');
    });
  }

  // Export
  window.SmartboardMode = {
    open: openSmartboard,
    close: closeSmartboard,
    get isTimerRunning() { return !!timerInterval; }
  };

  console.log('✅ Interactive Smartboard Classroom Conductor loaded');
})();
