(function () {
  'use strict';

  const BATTLE_QUESTIONS = [
    { q: 'Cili është ligji kryesor që shprehet me formulën V = I × R?', options: ['Ligji i Ohm-it', 'Ligji i Njutonit', 'Ligji i Kulonit', 'Ligji i Paskalit'], a: 0, subject: 'Fizikë' },
    { q: 'Cila bazë e azotuar në mRNA zëvendëson Timinën (T)?', options: ['Guanina', 'Uracili', 'Citozina', 'Adenina'], a: 1, subject: 'Biologji' },
    { q: 'Çfarë ndodh me çmimin e ekuilibrit kur kërkesa rritet dhe oferta mbetet konstante?', options: ['Bie', 'Rritet', 'Mbetet e pandryshuar', 'Bëhet zero'], a: 1, subject: 'Ekonomi' },
    { q: 'Cili është kompleksiteti mesatar kohor i Quick Sort?', options: ['O(n²)', 'O(n log n)', 'O(log n)', 'O(1)'], a: 1, subject: 'Informatikë' },
    { q: 'Cili gaz çlirohet gjatë fotosintezës?', options: ['Dioksidi i karbonit', 'Azoti', 'Oksigjeni', 'Metani'], a: 2, subject: 'Kimi' },
    { q: 'Kush udhëhoqi Kuvendin e Vlorës më 28 Nëntor 1912?', options: ['Ismail Qemali', 'Isa Boletini', 'Fan Noli', 'Hasan Prishtina'], a: 0, subject: 'Histori' },
    { q: 'Zgjidhe ekuacionin: 3x - 9 = 0. Sa është x?', options: ['x = 1', 'x = 2', 'x = 3', 'x = -3'], a: 2, subject: 'Matematikë' },
    { q: 'Cili funksion aktivizimi në Neural Networks jep max(0, x)?', options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'], a: 2, subject: 'AI' },
    { q: 'Cili është kryeqyteti i Gjermanisë?', options: ['Mynihu', 'Frankfurti', 'Berlini', 'Hamburgu'], a: 2, subject: 'Gjeografi' },
    { q: 'Sa kromozome ka qeliza trupore normale e njeriut?', options: ['23', '46', '48', '52'], a: 1, subject: 'Biologji' }
  ];

  let battleTimer = null;
  let timeLeft = 60;
  let playerScore = 0;
  let rivalScore = 0;
  let currentStreak = 0;
  let doubleXpActive = false;
  let shieldActive = false;
  let powerups = { shield: 1, freeze: 1, fiftyFifty: 1, double: 1 };
  let activeQuestionIndex = 0;
  let shuffledQuestions = [];

  function init() {
    if (document.getElementById('battleArenaOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'battleArenaOverlay';
    overlay.className = 'battle-arena-overlay';
    overlay.innerHTML = `
      <div class="battle-arena-window" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="battle-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">⚔️</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Arena e Betejës së Dijes (60s Quiz)</h2>
              <div style="font-size:12px;color:rgba(255,255,255,0.7)">Luaj në kohë reale kundër AI Rival &amp; fito pikë eksperience</div>
            </div>
          </div>
          <button id="closeBattleArenaBtn" class="school-os-close-btn" title="Mbyll Arenën">×</button>
        </div>

        <!-- Timer bar -->
        <div class="battle-timer-bar">
          <div id="battleTimerFill" class="battle-timer-fill"></div>
        </div>

        <!-- Fighter vs Fighter Header -->
        <div class="battle-versus-box">
          <div class="fighter-card">
            <div class="fighter-avatar player">👤</div>
            <div>
              <div style="font-size:13px;font-weight:700">Ti (Nxënës)</div>
              <div id="playerScoreDisplay" class="fighter-score" style="color:#38bdf8">0 pikë</div>
            </div>
          </div>

          <div style="text-align:center">
            <div id="battleTimeLeft" style="font-size:24px;font-weight:800;font-family:'Cascadia Code',monospace">60s</div>
            <div id="streakBadge" class="streak-multiplier-badge" style="display:none">🔥 1x Streak</div>
          </div>

          <div class="fighter-card" style="flex-direction:row-reverse;text-align:right">
            <div class="fighter-avatar rival">🤖</div>
            <div>
              <div style="font-size:13px;font-weight:700">AI Rival (Athena)</div>
              <div id="rivalScoreDisplay" class="fighter-score" style="color:#f87171">0 pikë</div>
            </div>
          </div>
        </div>

        <!-- Question Body -->
        <div class="battle-body" id="battleQuestionArea">
          <div id="battleSubjectTag" style="display:inline-block;margin:0 auto 12px;padding:4px 12px;border-radius:12px;background:rgba(99,102,241,0.2);color:#818cf8;font-size:12px;font-weight:700">LËNDA</div>
          <div id="battleQuestionText" class="battle-question-text">Po ngarkohet pyetja...</div>
          <div id="battleOptionsGrid" class="battle-options-grid"></div>
        </div>

        <!-- Power-ups Dock -->
        <div class="battle-powerups-dock">
          <button id="powerupShieldBtn" class="powerup-btn" title="Mbrojtje nga një përgjigje e gabuar">🛡️ Mburojë (1)</button>
          <button id="powerupFreezeBtn" class="powerup-btn" title="Ngrirje kohe për 5 sekonda">❄️ Ngrirje Kohe (1)</button>
          <button id="powerup5050Btn" class="powerup-btn" title="Elemino 2 alternativa të gabuara">💡 50 / 50 (1)</button>
          <button id="powerupDoubleBtn" class="powerup-btn" title="Dyfisho pikët e pyetjes">⚡ 2x Pikë (1)</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
  }

  function wireEvents() {
    const overlay = document.getElementById('battleArenaOverlay');
    document.getElementById('closeBattleArenaBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.getElementById('powerupShieldBtn')?.addEventListener('click', useShield);
    document.getElementById('powerupFreezeBtn')?.addEventListener('click', useFreeze);
    document.getElementById('powerup5050Btn')?.addEventListener('click', use5050);
    document.getElementById('powerupDoubleBtn')?.addEventListener('click', useDouble);
  }

  function startBattle() {
    init();
    timeLeft = 60;
    playerScore = 0;
    rivalScore = 0;
    currentStreak = 0;
    doubleXpActive = false;
    shieldActive = false;
    powerups = { shield: 1, freeze: 1, fiftyFifty: 1, double: 1 };
    shuffledQuestions = [...BATTLE_QUESTIONS].sort(() => 0.5 - Math.random());
    activeQuestionIndex = 0;

    updateScoreboard();
    updatePowerupButtons();

    const overlay = document.getElementById('battleArenaOverlay');
    if (overlay) overlay.style.display = 'flex';

    renderCurrentQuestion();

    if (battleTimer) clearInterval(battleTimer);
    battleTimer = setInterval(tick, 1000);
  }

  function tick() {
    timeLeft--;
    const timeEl = document.getElementById('battleTimeLeft');
    const fillEl = document.getElementById('battleTimerFill');

    if (timeEl) timeEl.textContent = `${timeLeft}s`;
    if (fillEl) fillEl.style.width = `${(timeLeft / 60) * 100}%`;

    // Rival AI answers randomly every 4-7 seconds
    if (timeLeft % 5 === 0 && Math.random() > 0.3) {
      rivalScore += 100;
      updateScoreboard();
    }

    if (timeLeft <= 0) {
      endBattle();
    }
  }

  function renderCurrentQuestion() {
    if (activeQuestionIndex >= shuffledQuestions.length) {
      shuffledQuestions = [...BATTLE_QUESTIONS].sort(() => 0.5 - Math.random());
      activeQuestionIndex = 0;
    }

    const q = shuffledQuestions[activeQuestionIndex];
    const subjEl = document.getElementById('battleSubjectTag');
    const qEl = document.getElementById('battleQuestionText');
    const grid = document.getElementById('battleOptionsGrid');

    if (subjEl) subjEl.textContent = `📚 ${q.subject.toUpperCase()}`;
    if (qEl) qEl.textContent = q.q;

    if (grid) {
      grid.innerHTML = q.options.map((opt, idx) => `
        <button class="battle-option-btn" data-idx="${idx}">
          <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);text-align:center;line-height:24px;font-size:12px">${['A', 'B', 'C', 'D'][idx]}</span>
          <span>${opt}</span>
        </button>
      `).join('');

      grid.querySelectorAll('.battle-option-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.idx, 10)));
      });
    }
  }

  function handleAnswer(selectedIdx) {
    const q = shuffledQuestions[activeQuestionIndex];
    const isCorrect = selectedIdx === q.a;
    const grid = document.getElementById('battleOptionsGrid');
    const btns = grid?.querySelectorAll('.battle-option-btn');

    if (btns) {
      btns.forEach(b => b.classList.add('disabled'));
      if (btns[selectedIdx]) {
        btns[selectedIdx].classList.add(isCorrect ? 'correct' : 'wrong');
      }
      if (!isCorrect && btns[q.a]) {
        btns[q.a].classList.add('correct');
      }
    }

    if (isCorrect) {
      currentStreak++;
      let pts = 100 * (1 + currentStreak * 0.2);
      if (doubleXpActive) {
        pts *= 2;
        doubleXpActive = false;
      }
      playerScore += Math.round(pts);
    } else {
      if (shieldActive) {
        shieldActive = false;
        if (window.Toast?.info) window.Toast.info('🛡️ Mburoja ju mbrojti nga humbja e serisë!');
      } else {
        currentStreak = 0;
      }
    }

    updateScoreboard();

    setTimeout(() => {
      activeQuestionIndex++;
      renderCurrentQuestion();
    }, 600);
  }

  function updateScoreboard() {
    const pEl = document.getElementById('playerScoreDisplay');
    const rEl = document.getElementById('rivalScoreDisplay');
    const sEl = document.getElementById('streakBadge');

    if (pEl) pEl.textContent = `${playerScore} pikë`;
    if (rEl) rEl.textContent = `${rivalScore} pikë`;

    if (sEl) {
      if (currentStreak >= 2) {
        sEl.style.display = 'inline-flex';
        sEl.textContent = `🔥 ${currentStreak}x Streak (+${currentStreak * 20}%)`;
      } else {
        sEl.style.display = 'none';
      }
    }
  }

  function useShield() {
    if (powerups.shield <= 0) return;
    powerups.shield--;
    shieldActive = true;
    updatePowerupButtons();
    if (window.Toast?.success) window.Toast.success('🛡️ Mburoja aktive!');
  }

  function useFreeze() {
    if (powerups.freeze <= 0) return;
    powerups.freeze--;
    timeLeft += 5;
    updatePowerupButtons();
    if (window.Toast?.info) window.Toast.info('❄️ Koha u zgjat me +5 sekonda!');
  }

  function use5050() {
    if (powerups.fiftyFifty <= 0) return;
    powerups.fiftyFifty--;
    updatePowerupButtons();

    const q = shuffledQuestions[activeQuestionIndex];
    const grid = document.getElementById('battleOptionsGrid');
    const btns = grid?.querySelectorAll('.battle-option-btn');

    if (btns) {
      let removed = 0;
      btns.forEach((btn, idx) => {
        if (idx !== q.a && removed < 2) {
          btn.style.visibility = 'hidden';
          removed++;
        }
      });
    }
  }

  function useDouble() {
    if (powerups.double <= 0) return;
    powerups.double--;
    doubleXpActive = true;
    updatePowerupButtons();
    if (window.Toast?.success) window.Toast.success('⚡ Pyetja e radhës jep 2x pikë!');
  }

  function updatePowerupButtons() {
    const sBtn = document.getElementById('powerupShieldBtn');
    const fBtn = document.getElementById('powerupFreezeBtn');
    const ffBtn = document.getElementById('powerup5050Btn');
    const dBtn = document.getElementById('powerupDoubleBtn');

    if (sBtn) { sBtn.textContent = `🛡️ Mburojë (${powerups.shield})`; sBtn.disabled = powerups.shield <= 0; }
    if (fBtn) { fBtn.textContent = `❄️ Ngrirje Kohe (${powerups.freeze})`; fBtn.disabled = powerups.freeze <= 0; }
    if (ffBtn) { ffBtn.textContent = `💡 50 / 50 (${powerups.fiftyFifty})`; ffBtn.disabled = powerups.fiftyFifty <= 0; }
    if (dBtn) { dBtn.textContent = `⚡ 2x Pikë (${powerups.double})`; dBtn.disabled = powerups.double <= 0; }
  }

  function endBattle() {
    if (battleTimer) clearInterval(battleTimer);
    battleTimer = null;

    const isWinner = playerScore >= rivalScore;
    const body = document.getElementById('battleQuestionArea');

    if (window.AppState?.gamification) {
      window.AppState.gamification.points = (window.AppState.gamification.points || 0) + playerScore;
    }

    if (body) {
      body.innerHTML = `
        <div style="text-align:center;padding:24px">
          <div style="font-size:54px;margin-bottom:12px">${isWinner ? '🏆' : '🥈'}</div>
          <h2 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${isWinner ? '#10b981' : '#f59e0b'}">
            ${isWinner ? 'FITORE SHKËLQYESE!' : 'Betejë e Fortë! Mirë u ndeshët!'}
          </h2>
          <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0 0 20px">
            Ti fitove <b>${playerScore} pikë</b> kundrejt <b>${rivalScore} pikëve</b> të AI Rival.
          </p>
          <div style="display:flex;justify-content:center;gap:12px">
            <button id="battlePlayAgainBtn" class="os-btn-primary" style="padding:10px 24px;font-size:14px">🔁 Luaj Përsëri</button>
            <button id="battleFinishBtn" class="ai-pill-btn" style="padding:10px 24px;font-size:14px">✅ Përfundo</button>
          </div>
        </div>
      `;

      document.getElementById('battlePlayAgainBtn')?.addEventListener('click', startBattle);
      document.getElementById('battleFinishBtn')?.addEventListener('click', close);
    }
  }

  function open() {
    startBattle();
  }

  function close() {
    if (battleTimer) clearInterval(battleTimer);
    battleTimer = null;
    const overlay = document.getElementById('battleArenaOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.QuizBattle = { open, close, startBattle };

  document.addEventListener('DOMContentLoaded', init);
})();
