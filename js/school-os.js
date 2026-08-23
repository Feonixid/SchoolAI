// js/school-os.js — School Mini OS Feature Suite
// ===================================================================
// Complete Student Productivity Cockpit:
// 1. Pomodoro Focus Timer
// 2. Smart Quick Notes & Scratchpad
// 3. Spaced-Repetition Interactive Flashcards
// 4. Procedural Ambient Focus Soundscapes (Web Audio API)
// 5. Scientific & Academic Unit Converter
// 6. Interactive Class Timetable
// 7. Homework & Task Planner
// ===================================================================

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // STATE & STORAGE
  // ----------------------------------------------------------------
  const OS_STORAGE_KEYS = {
    SCRATCHPAD: 'schoolos_scratchpad_v1',
    TASKS: 'schoolos_tasks_v1',
    CUSTOM_FLASHCARDS: 'schoolos_flashcards_v1',
    TIMETABLE: 'schoolos_timetable_v1'
  };

  let activeTab = 'pomodoro';
  let pomodoroTimer = null;
  let pomodoroSeconds = 25 * 60;
  let pomodoroRunning = false;
  let pomodoroMode = 'work'; // 'work', 'shortBreak', 'longBreak'

  // Web Audio Context for Procedural Sounds
  let audioCtx = null;
  let activeSoundNode = null;
  let activeSoundType = null;
  let audioGainNode = null;

  // Flashcards Database
  const BUILTIN_DECKS = {
    math: [
      { q: 'Quadratic Formula', a: 'x = (-b ± √(b² - 4ac)) / (2a)', tag: 'Math' },
      { q: 'Pythagorean Theorem', a: 'a² + b² = c² (for right triangles)', tag: 'Math' },
      { q: 'Area of a Circle', a: 'A = π · r²', tag: 'Math' },
      { q: 'Slope of a Line', a: 'm = (y₂ - y₁) / (x₂ - x₁)', tag: 'Math' }
    ],
    biology: [
      { q: 'Mitochondria function?', a: 'Powerhouse of the cell: produces ATP via aerobic respiration.', tag: 'Biology' },
      { q: 'Photosynthesis Equation', a: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', tag: 'Biology' },
      { q: 'Difference: Mitosis vs Meiosis', a: 'Mitosis: 2 identical diploid cells. Meiosis: 4 unique haploid gametes.', tag: 'Biology' },
      { q: 'DNA base pairing rule', a: 'Adenine (A) pairs with Thymine (T); Cytosine (C) pairs with Guanine (G).', tag: 'Biology' }
    ],
    chemistry: [
      { q: 'Avogadro’s Number', a: '6.022 × 10²³ particles per mole', tag: 'Chemistry' },
      { q: 'pH of pure water at 25°C', a: 'pH = 7 (Neutral, [H⁺] = 10⁻⁷ M)', tag: 'Chemistry' },
      { q: "Ohm's Law Equation", a: 'V = I · R (Voltage = Current × Resistance)', tag: 'Physics' },
      { q: 'Kinetic Energy Formula', a: 'Ek = 1/2 · m · v²', tag: 'Physics' }
    ],
    history: [
      { q: 'League of Lezhë (Lidhja e Lezhës)', a: '2 March 1444 — Convened by George Castriot Skanderbeg.', tag: 'History' },
      { q: 'Albanian Declaration of Independence', a: '28 November 1912 in Vlorë by Ismail Qemali.', tag: 'History' },
      { q: 'League of Prizren', a: '10 June 1878 — Key event of the National Awakening (Rilindja Kombëtare).', tag: 'History' }
    ]
  };

  let currentDeckKey = 'math';
  let currentCardIndex = 0;

  // ----------------------------------------------------------------
  // INITIALIZATION & DOM INJECTION
  // ----------------------------------------------------------------
  function init() {
    if (document.getElementById('schoolOsModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'schoolOsModalOverlay';
    overlay.className = 'school-os-overlay';
    overlay.innerHTML = `
      <div class="school-os-window" role="dialog" aria-modal="true">
        <!-- Titlebar -->
        <div class="school-os-titlebar">
          <div class="school-os-brand">
            <span style="font-size:22px">🚀</span>
            <h2>School Mini OS <span class="badge">Student Hub</span></h2>
          </div>
          <div class="school-os-controls">
            <button id="closeSchoolOsBtn" class="school-os-close-btn" title="Close School OS (Esc)">×</button>
          </div>
        </div>

        <!-- Body -->
        <div class="school-os-body">
          <!-- Dock Sidebar -->
          <div class="school-os-dock">
            <button class="school-os-nav-item active" data-tab="pomodoro">
              <span class="icon">⏱️</span> <span>Focus Timer</span>
            </button>
            <button class="school-os-nav-item" data-tab="scratchpad">
              <span class="icon">📝</span> <span>Quick Notes</span>
            </button>
            <button class="school-os-nav-item" data-tab="flashcards">
              <span class="icon">🗂️</span> <span>Flashcards</span>
            </button>
            <button class="school-os-nav-item" data-tab="soundscapes">
              <span class="icon">🎵</span> <span>Soundscapes</span>
            </button>
            <button class="school-os-nav-item" data-tab="converter">
              <span class="icon">⚖️</span> <span>Unit Converter</span>
            </button>
            <button class="school-os-nav-item" data-tab="planner">
              <span class="icon">🎒</span> <span>Homework Hub</span>
            </button>
          </div>

          <!-- Main Content -->
          <div class="school-os-content">
            <!-- 1. POMODORO -->
            <div id="os-app-pomodoro" class="os-app-view active">
              <div class="os-app-header">
                <div>
                  <h3>⏱️ Pomodoro Focus Timer</h3>
                  <p>Study in disciplined bursts with timed rest intervals.</p>
                </div>
              </div>
              <div class="pomodoro-container">
                <div class="pomodoro-modes">
                  <button class="pomodoro-mode-btn active" data-pmode="work">Focus (25m)</button>
                  <button class="pomodoro-mode-btn" data-pmode="shortBreak">Short Break (5m)</button>
                  <button class="pomodoro-mode-btn" data-pmode="longBreak">Long Break (15m)</button>
                </div>
                <input id="pomodoroTaskInput" class="pomodoro-task-input" placeholder="What are you studying right now?" />
                <div id="pomodoroClock" class="pomodoro-clock">25:00</div>
                <div class="pomodoro-controls">
                  <button id="pomodoroToggleBtn" class="os-btn-primary">▶ Start Focus</button>
                  <button id="pomodoroResetBtn" class="os-btn-secondary">↺ Reset</button>
                </div>
              </div>
            </div>

            <!-- 2. SCRATCHPAD -->
            <div id="os-app-scratchpad" class="os-app-view">
              <div class="os-app-header">
                <div>
                  <h3>📝 Smart Scratchpad & Study Notes</h3>
                  <p>Notes auto-save locally. Ask the AI Tutor about any concept with one click.</p>
                </div>
                <div class="scratchpad-toolbar">
                  <button id="osAskAiNotesBtn" class="os-btn-primary" style="padding:6px 12px;font-size:12.5px">🧠 Ask AI Tutor</button>
                  <button id="osCopyNotesBtn" class="os-btn-secondary" style="padding:6px 12px;font-size:12.5px">📋 Copy</button>
                  <button id="osClearNotesBtn" class="os-btn-secondary" style="padding:6px 12px;font-size:12.5px">🗑️ Clear</button>
                </div>
              </div>
              <div class="scratchpad-container">
                <textarea id="osScratchpadText" class="scratchpad-textarea" placeholder="Type quick formulas, notes, questions, or lecture summaries here..."></textarea>
              </div>
            </div>

            <!-- 3. FLASHCARDS -->
            <div id="os-app-flashcards" class="os-app-view">
              <div class="os-app-header">
                <div>
                  <h3>🗂️ Interactive Study Flashcards</h3>
                  <p>Master key formulas, definitions, and concepts with spaced repetition.</p>
                </div>
                <div>
                  <select id="osDeckSelector" class="deck-selector">
                    <option value="math">📐 Mathematics</option>
                    <option value="biology">🌿 Biology</option>
                    <option value="chemistry">🧪 Chemistry & Physics</option>
                    <option value="history">🏛️ History</option>
                  </select>
                </div>
              </div>
              <div class="flashcards-container">
                <div id="osFlashcardCard" class="flashcard-card">
                  <div class="flashcard-inner">
                    <div class="flashcard-front">
                      <span id="osCardTag" class="flashcard-tag">MATHEMATICS</span>
                      <div id="osCardQ" class="flashcard-text">Loading question...</div>
                      <div class="flashcard-hint">💡 Click card to flip & reveal answer</div>
                    </div>
                    <div class="flashcard-back">
                      <span class="flashcard-tag" style="color:#10b981">ANSWER</span>
                      <div id="osCardA" class="flashcard-text">Loading answer...</div>
                      <div class="flashcard-hint">💡 Click card to flip back</div>
                    </div>
                  </div>
                </div>
                <div class="flashcard-actions">
                  <button id="osCardPrevBtn" class="os-btn-secondary">◀ Prev</button>
                  <button id="osCardFlipBtn" class="os-btn-primary">🔄 Flip Card</button>
                  <button id="osCardNextBtn" class="os-btn-secondary">Next ▶</button>
                </div>
              </div>
            </div>

            <!-- 4. SOUNDSCAPES -->
            <div id="os-app-soundscapes" class="os-app-view">
              <div class="os-app-header">
                <div>
                  <h3>🎵 Ambient Study Soundscapes</h3>
                  <p>100% offline procedural audio synthesizer for maximum concentration.</p>
                </div>
              </div>
              <div class="soundscapes-grid">
                <div class="soundscape-card" data-sound="rain">
                  <div class="soundscape-icon">🌧️</div>
                  <div class="soundscape-title">Gentle Rain</div>
                  <div class="soundscape-desc">Calming rainfall and soft thunder</div>
                </div>
                <div class="soundscape-card" data-sound="whitenoise">
                  <div class="soundscape-icon">📚</div>
                  <div class="soundscape-title">Library Noise</div>
                  <div class="soundscape-desc">Soft filtered pink noise for focus</div>
                </div>
                <div class="soundscape-card" data-sound="binaural">
                  <div class="soundscape-icon">🧘</div>
                  <div class="soundscape-title">432Hz Alpha Wave</div>
                  <div class="soundscape-desc">Pure acoustic binaural focus tone</div>
                </div>
                <div class="soundscape-card" data-sound="cafe">
                  <div class="soundscape-icon">☕</div>
                  <div class="soundscape-title">Cozy Cafe</div>
                  <div class="soundscape-desc">Subtle warm ambient background</div>
                </div>
              </div>
              <div class="soundscape-controls">
                <div style="font-weight:600;font-size:13.5px" id="osActiveSoundLabel">Status: Stopped</div>
                <div style="display:flex;align-items:center;gap:12px">
                  <label style="font-size:12px;color:var(--text-muted)">Volume</label>
                  <input type="range" id="osSoundVolume" min="0" max="1" step="0.05" value="0.5" style="width:100px" />
                  <button id="osStopSoundBtn" class="os-btn-secondary" style="padding:6px 12px;font-size:12.5px">⏹ Stop Audio</button>
                </div>
              </div>
            </div>

            <!-- 5. UNIT CONVERTER -->
            <div id="os-app-converter" class="os-app-view">
              <div class="os-app-header">
                <div>
                  <h3>⚖️ Academic Unit Converter</h3>
                  <p>Instant conversions for science, physics, math, and computer science.</p>
                </div>
              </div>
              <div class="converter-container">
                <div class="converter-type-chips" id="osConvTypeChips">
                  <button class="converter-chip active" data-ctype="length">Length</button>
                  <button class="converter-chip" data-ctype="mass">Mass / Weight</button>
                  <button class="converter-chip" data-ctype="temp">Temperature</button>
                  <button class="converter-chip" data-ctype="speed">Speed</button>
                  <button class="converter-chip" data-ctype="data">Data / Bytes</button>
                </div>
                <div class="converter-row">
                  <div class="converter-input-box">
                    <label style="font-size:12px;font-weight:600">From Value</label>
                    <input type="number" id="osConvFromVal" value="1" />
                    <select id="osConvFromUnit"></select>
                  </div>
                  <div style="font-size:24px;font-weight:700;color:var(--text-muted);padding-top:20px">=</div>
                  <div class="converter-input-box">
                    <label style="font-size:12px;font-weight:600">Converted Result</label>
                    <input type="number" id="osConvToVal" readonly style="background:rgba(99,102,241,0.06);font-weight:700;color:#6366f1" />
                    <select id="osConvToUnit"></select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 6. HOMEWORK PLANNER -->
            <div id="os-app-planner" class="os-app-view">
              <div class="os-app-header">
                <div>
                  <h3>🎒 Homework & Assignment Task Planner</h3>
                  <p>Track assignments, priorities, and deadlines. Send tasks to AI Tutor for help.</p>
                </div>
              </div>
              <div class="planner-input-row">
                <input id="osTaskTitleInput" style="flex:2" placeholder="Assignment or task description..." />
                <select id="osTaskSubjectInput" style="flex:1">
                  <option value="Mathematics">📐 Math</option>
                  <option value="Physics">⚡ Physics</option>
                  <option value="Chemistry">🧪 Chemistry</option>
                  <option value="Biology">🌿 Biology</option>
                  <option value="Albanian">📖 Albanian</option>
                  <option value="English">🇬🇧 English</option>
                  <option value="History">🏛️ History</option>
                  <option value="Coding">💻 Coding</option>
                </select>
                <select id="osTaskPriorityInput">
                  <option value="high">🔴 Urgent</option>
                  <option value="med" selected>🟡 Normal</option>
                  <option value="low">🟢 Low</option>
                </select>
                <button id="osAddTaskBtn" class="os-btn-primary" style="padding:8px 16px">+ Add Task</button>
              </div>
              <div class="planner-list" id="osPlannerTaskList"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEventListeners();
    loadSavedData();
  }

  // ----------------------------------------------------------------
  // EVENT LISTENERS & TAB NAVIGATION
  // ----------------------------------------------------------------
  function wireEventListeners() {
    const overlay = document.getElementById('schoolOsModalOverlay');
    const closeBtn = document.getElementById('closeSchoolOsBtn');

    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Escape key to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.style.display === 'flex') {
        close();
      }
    });

    // Navigation items
    document.querySelectorAll('.school-os-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    // 1. Pomodoro wiring
    document.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pomodoro-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setPomodoroMode(btn.dataset.pmode);
      });
    });

    document.getElementById('pomodoroToggleBtn')?.addEventListener('click', togglePomodoro);
    document.getElementById('pomodoroResetBtn')?.addEventListener('click', resetPomodoro);

    // 2. Scratchpad wiring
    const scratch = document.getElementById('osScratchpadText');
    scratch?.addEventListener('input', () => {
      localStorage.setItem(OS_STORAGE_KEYS.SCRATCHPAD, scratch.value);
    });

    document.getElementById('osAskAiNotesBtn')?.addEventListener('click', () => {
      const note = scratch.value.trim();
      if (!note) {
        window.Toast?.info('Type some notes in the scratchpad first.');
        return;
      }
      close();
      const input = document.getElementById('input');
      if (input) {
        input.value = `Please explain and review these notes for me:\n\n${note}`;
        input.focus();
      }
    });

    document.getElementById('osCopyNotesBtn')?.addEventListener('click', () => {
      if (scratch.value) {
        navigator.clipboard.writeText(scratch.value);
        window.Toast?.success('Notes copied to clipboard! 📋');
      }
    });

    document.getElementById('osClearNotesBtn')?.addEventListener('click', () => {
      if (confirm('Clear scratchpad?')) {
        scratch.value = '';
        localStorage.removeItem(OS_STORAGE_KEYS.SCRATCHPAD);
      }
    });

    // 3. Flashcards wiring
    const cardEl = document.getElementById('osFlashcardCard');
    cardEl?.addEventListener('click', () => {
      cardEl.classList.toggle('flipped');
    });

    document.getElementById('osCardFlipBtn')?.addEventListener('click', () => {
      cardEl?.classList.toggle('flipped');
    });

    document.getElementById('osCardNextBtn')?.addEventListener('click', () => nextFlashcard(1));
    document.getElementById('osCardPrevBtn')?.addEventListener('click', () => nextFlashcard(-1));

    document.getElementById('osDeckSelector')?.addEventListener('change', (e) => {
      currentDeckKey = e.target.value;
      currentCardIndex = 0;
      renderFlashcard();
    });

    // 4. Soundscapes wiring
    document.querySelectorAll('.soundscape-card').forEach(card => {
      card.addEventListener('click', () => {
        const sound = card.dataset.sound;
        playSoundscape(sound);
      });
    });

    document.getElementById('osStopSoundBtn')?.addEventListener('click', stopSoundscape);
    document.getElementById('osSoundVolume')?.addEventListener('input', (e) => {
      if (audioGainNode) audioGainNode.gain.value = parseFloat(e.target.value);
    });

    // 5. Unit Converter wiring
    document.querySelectorAll('.converter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.converter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        setupConverterUnits(chip.dataset.ctype);
      });
    });

    document.getElementById('osConvFromVal')?.addEventListener('input', calculateConversion);
    document.getElementById('osConvFromUnit')?.addEventListener('change', calculateConversion);
    document.getElementById('osConvToUnit')?.addEventListener('change', calculateConversion);

    // 6. Planner wiring
    document.getElementById('osAddTaskBtn')?.addEventListener('click', addPlannerTask);
    document.getElementById('osTaskTitleInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addPlannerTask();
    });
  }

  // ----------------------------------------------------------------
  // TAB SWITCHING
  // ----------------------------------------------------------------
  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.school-os-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.os-app-view').forEach(view => {
      view.classList.toggle('active', view.id === `os-app-${tabId}`);
    });

    if (tabId === 'flashcards') renderFlashcard();
    if (tabId === 'converter') setupConverterUnits('length');
    if (tabId === 'planner') renderPlannerTasks();
  }

  // ----------------------------------------------------------------
  // 1. POMODORO IMPLEMENTATION
  // ----------------------------------------------------------------
  function setPomodoroMode(mode) {
    pomodoroMode = mode;
    clearInterval(pomodoroTimer);
    pomodoroRunning = false;
    document.getElementById('pomodoroToggleBtn').textContent = '▶ Start Focus';

    if (mode === 'work') pomodoroSeconds = 25 * 60;
    else if (mode === 'shortBreak') pomodoroSeconds = 5 * 60;
    else if (mode === 'longBreak') pomodoroSeconds = 15 * 60;

    updatePomodoroDisplay();
  }

  function updatePomodoroDisplay() {
    const mins = Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0');
    const secs = (pomodoroSeconds % 60).toString().padStart(2, '0');
    const clock = document.getElementById('pomodoroClock');
    if (clock) clock.textContent = `${mins}:${secs}`;
  }

  function togglePomodoro() {
    const btn = document.getElementById('pomodoroToggleBtn');
    if (pomodoroRunning) {
      clearInterval(pomodoroTimer);
      pomodoroRunning = false;
      if (btn) btn.textContent = '▶ Resume Focus';
    } else {
      pomodoroRunning = true;
      if (btn) btn.textContent = '⏸ Pause Focus';
      pomodoroTimer = setInterval(() => {
        if (pomodoroSeconds > 0) {
          pomodoroSeconds--;
          updatePomodoroDisplay();
        } else {
          clearInterval(pomodoroTimer);
          pomodoroRunning = false;
          playChime();
          window.Toast?.success(pomodoroMode === 'work' ? '🎉 Focus session finished! Take a break.' : '⏰ Break finished! Ready to focus?');
          if (btn) btn.textContent = '▶ Start Focus';
        }
      }, 1000);
    }
  }

  function resetPomodoro() {
    clearInterval(pomodoroTimer);
    pomodoroRunning = false;
    setPomodoroMode(pomodoroMode);
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }

  // ----------------------------------------------------------------
  // 3. FLASHCARDS IMPLEMENTATION
  // ----------------------------------------------------------------
  function renderFlashcard() {
    const deck = BUILTIN_DECKS[currentDeckKey] || BUILTIN_DECKS.math;
    if (currentCardIndex >= deck.length) currentCardIndex = 0;
    if (currentCardIndex < 0) currentCardIndex = deck.length - 1;

    const card = deck[currentCardIndex];
    const cardEl = document.getElementById('osFlashcardCard');
    if (cardEl) cardEl.classList.remove('flipped');

    const tag = document.getElementById('osCardTag');
    const q = document.getElementById('osCardQ');
    const a = document.getElementById('osCardA');

    if (tag) tag.textContent = `${card.tag} (${currentCardIndex + 1}/${deck.length})`;
    if (q) q.textContent = card.q;
    if (a) a.textContent = card.a;
  }

  function nextFlashcard(delta) {
    const deck = BUILTIN_DECKS[currentDeckKey] || BUILTIN_DECKS.math;
    currentCardIndex = (currentCardIndex + delta + deck.length) % deck.length;
    renderFlashcard();
  }

  // ----------------------------------------------------------------
  // 4. SOUNDSCAPES IMPLEMENTATION (Web Audio API Synthesizer)
  // ----------------------------------------------------------------
  function playSoundscape(type) {
    stopSoundscape();
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioGainNode = audioCtx.createGain();
      const vol = parseFloat(document.getElementById('osSoundVolume')?.value || 0.5);
      audioGainNode.gain.value = vol;
      audioGainNode.connect(audioCtx.destination);

      if (type === 'rain' || type === 'whitenoise' || type === 'cafe') {
        // Noise buffer
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise filter
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
          b6 = white * 0.115926;
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : (type === 'cafe' ? 'bandpass' : 'lowpass');
        filter.frequency.value = type === 'rain' ? 800 : (type === 'cafe' ? 600 : 1200);

        whiteNoise.connect(filter);
        filter.connect(audioGainNode);
        whiteNoise.start();
        activeSoundNode = whiteNoise;
      } else if (type === 'binaural') {
        // 432Hz sine tone
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 432;
        osc.connect(audioGainNode);
        osc.start();
        activeSoundNode = osc;
      }

      activeSoundType = type;
      document.querySelectorAll('.soundscape-card').forEach(c => {
        c.classList.toggle('active', c.dataset.sound === type);
      });
      const lbl = document.getElementById('osActiveSoundLabel');
      if (lbl) lbl.textContent = `Playing: ${type.toUpperCase()}`;
    } catch (e) {
      console.warn('Audio synth error:', e);
    }
  }

  function stopSoundscape() {
    if (activeSoundNode) {
      try { activeSoundNode.stop(); } catch {}
      activeSoundNode = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch {}
      audioCtx = null;
    }
    activeSoundType = null;
    document.querySelectorAll('.soundscape-card').forEach(c => c.classList.remove('active'));
    const lbl = document.getElementById('osActiveSoundLabel');
    if (lbl) lbl.textContent = 'Status: Stopped';
  }

  // ----------------------------------------------------------------
  // 5. UNIT CONVERTER
  // ----------------------------------------------------------------
  const UNITS = {
    length: [
      { id: 'm', label: 'Meters (m)', factor: 1 },
      { id: 'km', label: 'Kilometers (km)', factor: 1000 },
      { id: 'cm', label: 'Centimeters (cm)', factor: 0.01 },
      { id: 'mm', label: 'Millimeters (mm)', factor: 0.001 },
      { id: 'in', label: 'Inches (in)', factor: 0.0254 },
      { id: 'ft', label: 'Feet (ft)', factor: 0.3048 },
      { id: 'mi', label: 'Miles (mi)', factor: 1609.34 }
    ],
    mass: [
      { id: 'kg', label: 'Kilograms (kg)', factor: 1 },
      { id: 'g', label: 'Grams (g)', factor: 0.001 },
      { id: 'mg', label: 'Milligrams (mg)', factor: 0.000001 },
      { id: 'lb', label: 'Pounds (lbs)', factor: 0.453592 },
      { id: 'oz', label: 'Ounces (oz)', factor: 0.0283495 }
    ],
    temp: [
      { id: 'c', label: 'Celsius (°C)' },
      { id: 'f', label: 'Fahrenheit (°F)' },
      { id: 'k', label: 'Kelvin (K)' }
    ],
    speed: [
      { id: 'ms', label: 'Meters/sec (m/s)', factor: 1 },
      { id: 'kmh', label: 'Kilometers/hour (km/h)', factor: 0.277778 },
      { id: 'mph', label: 'Miles/hour (mph)', factor: 0.44704 }
    ],
    data: [
      { id: 'b', label: 'Bytes (B)', factor: 1 },
      { id: 'kb', label: 'Kilobytes (KB)', factor: 1024 },
      { id: 'mb', label: 'Megabytes (MB)', factor: 1024 * 1024 },
      { id: 'gb', label: 'Gigabytes (GB)', factor: 1024 * 1024 * 1024 },
      { id: 'tb', label: 'Terabytes (TB)', factor: 1024 * 1024 * 1024 * 1024 }
    ]
  };

  let currentConvCategory = 'length';

  function setupConverterUnits(cat) {
    currentConvCategory = cat;
    const units = UNITS[cat] || UNITS.length;
    const fromSel = document.getElementById('osConvFromUnit');
    const toSel = document.getElementById('osConvToUnit');

    if (!fromSel || !toSel) return;

    fromSel.innerHTML = units.map(u => `<option value="${u.id}">${u.label}</option>`).join('');
    toSel.innerHTML = units.map((u, i) => `<option value="${u.id}" ${i === 1 ? 'selected' : ''}>${u.label}</option>`).join('');

    calculateConversion();
  }

  function calculateConversion() {
    const val = parseFloat(document.getElementById('osConvFromVal')?.value || 0);
    const from = document.getElementById('osConvFromUnit')?.value;
    const to = document.getElementById('osConvToUnit')?.value;
    const toInput = document.getElementById('osConvToVal');

    if (!toInput || isNaN(val)) return;

    if (currentConvCategory === 'temp') {
      let celsius = val;
      if (from === 'f') celsius = (val - 32) * (5 / 9);
      if (from === 'k') celsius = val - 273.15;

      let result = celsius;
      if (to === 'f') result = (celsius * 9 / 5) + 32;
      if (to === 'k') result = celsius + 273.15;

      toInput.value = result.toFixed(2);
      return;
    }

    const units = UNITS[currentConvCategory] || [];
    const fromUnit = units.find(u => u.id === from);
    const toUnit = units.find(u => u.id === to);

    if (fromUnit && toUnit) {
      const inBase = val * fromUnit.factor;
      const result = inBase / toUnit.factor;
      toInput.value = parseFloat(result.toFixed(6));
    }
  }

  // ----------------------------------------------------------------
  // 6. HOMEWORK PLANNER
  // ----------------------------------------------------------------
  function getPlannerTasks() {
    try {
      const raw = localStorage.getItem(OS_STORAGE_KEYS.TASKS);
      return raw ? JSON.parse(raw) : [
        { id: '1', title: 'Solve Quadratic Equations (Ex 1-5)', subject: 'Mathematics', priority: 'high', done: false },
        { id: '2', title: 'Read Biology Chapter on Cellular Respiration', subject: 'Biology', priority: 'med', done: false }
      ];
    } catch {
      return [];
    }
  }

  function savePlannerTasks(tasks) {
    localStorage.setItem(OS_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  function addPlannerTask() {
    const titleInput = document.getElementById('osTaskTitleInput');
    const subjInput = document.getElementById('osTaskSubjectInput');
    const prioInput = document.getElementById('osTaskPriorityInput');

    const title = titleInput?.value.trim();
    if (!title) return;

    const tasks = getPlannerTasks();
    tasks.unshift({
      id: Date.now().toString(),
      title,
      subject: subjInput?.value || 'General',
      priority: prioInput?.value || 'med',
      done: false
    });

    savePlannerTasks(tasks);
    titleInput.value = '';
    renderPlannerTasks();
    window.Toast?.success('Task added to Homework Planner! 🎒');
  }

  function renderPlannerTasks() {
    const list = document.getElementById('osPlannerTaskList');
    if (!list) return;

    const tasks = getPlannerTasks();
    if (tasks.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted)">No active homework tasks. Add one above! ✨</div>`;
      return;
    }

    list.innerHTML = tasks.map(t => `
      <div class="planner-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="planner-item-left">
          <input type="checkbox" ${t.done ? 'checked' : ''} class="task-check" data-id="${t.id}" />
          <div>
            <div style="font-weight:600;font-size:14px">${t.title}</div>
            <div style="font-size:12px;color:var(--text-muted);display:flex;gap:8px;margin-top:2px">
              <span>📚 ${t.subject}</span>
              <span class="priority-badge priority-${t.priority}">${t.priority}</span>
            </div>
          </div>
        </div>
        <div class="planner-item-actions">
          <button class="os-btn-secondary ask-ai-task-btn" data-id="${t.id}" style="padding:4px 8px;font-size:12px" title="Ask AI for tutoring on this task">🧠 Ask AI</button>
          <button class="os-btn-secondary del-task-btn" data-id="${t.id}" style="padding:4px 8px;font-size:12px">🗑️</button>
        </div>
      </div>
    `).join('');

    // Checkbox toggles
    list.querySelectorAll('.task-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const all = getPlannerTasks();
        const found = all.find(t => t.id === id);
        if (found) {
          found.done = e.target.checked;
          savePlannerTasks(all);
          renderPlannerTasks();
          if (found.done) {
            window.Toast?.success('Task Completed! +15 Study XP 🌟');
            if (window.Gamification?.addPoints) window.Gamification.addPoints(15, 'Completed Task');
          }
        }
      });
    });

    // Ask AI buttons
    list.querySelectorAll('.ask-ai-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const task = getPlannerTasks().find(t => t.id === id);
        if (task) {
          close();
          const input = document.getElementById('input');
          if (input) {
            input.value = `Can you guide me step-by-step on my ${task.subject} assignment: "${task.title}"? Please do not just give the final answer right away, help me learn how to solve it.`;
            input.focus();
          }
        }
      });
    });

    // Delete buttons
    list.querySelectorAll('.del-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const all = getPlannerTasks().filter(t => t.id !== id);
        savePlannerTasks(all);
        renderPlannerTasks();
      });
    });
  }

  // ----------------------------------------------------------------
  // DATA LOAD & API EXPORT
  // ----------------------------------------------------------------
  function loadSavedData() {
    const scratch = document.getElementById('osScratchpadText');
    if (scratch) {
      scratch.value = localStorage.getItem(OS_STORAGE_KEYS.SCRATCHPAD) || '';
    }
  }

  function open(tab) {
    init();
    const overlay = document.getElementById('schoolOsModalOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      if (tab) switchTab(tab);
    }
  }

  function close() {
    const overlay = document.getElementById('schoolOsModalOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  // Export to window
  window.SchoolOS = {
    open,
    close,
    switchTab
  };

  // Keyboard shortcut Ctrl+Shift+O / Cmd+Shift+O
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
      e.preventDefault();
      open();
    }
  });

  document.addEventListener('DOMContentLoaded', init);
})();
