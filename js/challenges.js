(function () {
  'use strict';

  const CHALLENGES = {
    math: [
      { id: 'math_1', title: 'Ekuacioni Linear', difficulty: 'easy', xp: 15, question: 'Gjej vlerën e x: 3x + 7 = 22', answer: '5', hint: 'Zbrit 7 nga të dyja anët, pastaj pjesëto me 3.', explanation: '3x + 7 = 22 → 3x = 15 → x = 5' },
      { id: 'math_2', title: 'Sipërfaqja e Trekëndëshit', difficulty: 'easy', xp: 15, question: 'Llogarit sipërfaqen e trekëndëshit me bazë 10 cm dhe lartësi 6 cm.', answer: '30', hint: 'S = (baza × lartësia) / 2', explanation: 'S = (10 × 6) / 2 = 30 cm²' },
      { id: 'math_3', title: 'Ekuacioni Kuadratik', difficulty: 'medium', xp: 30, question: 'Gjej rrënjët e ekuacionit: x² - 5x + 6 = 0 (shkruaj si "2,3")', answer: '2,3', hint: 'Faktorizimi: (x-a)(x-b) = 0 ku a+b=5 dhe a·b=6', explanation: 'x² - 5x + 6 = (x-2)(x-3) = 0 → x₁=2, x₂=3' },
      { id: 'math_4', title: 'Teorema e Pitagorës', difficulty: 'medium', xp: 30, question: 'Trekëndësh kënddrejtë ka katete a=3 dhe b=4. Sa është hipotenuza c?', answer: '5', hint: 'c² = a² + b²', explanation: 'c² = 9 + 16 = 25 → c = √25 = 5' },
      { id: 'math_5', title: 'Derivati i Funksionit', difficulty: 'hard', xp: 50, question: 'Gjej derivatin e f(x) = 3x⁴ - 2x² + 7x. Sa është f\'(1)?', answer: '15', hint: 'f\'(x) = 12x³ - 4x + 7', explanation: 'f\'(x) = 12x³ - 4x + 7 → f\'(1) = 12 - 4 + 7 = 15' }
    ],
    physics: [
      { id: 'phys_1', title: 'Ligji i Ohm-it', difficulty: 'easy', xp: 15, question: 'Llogarit rrymën elektrike kur V = 12V dhe R = 4Ω.', answer: '3', hint: 'I = V / R', explanation: 'I = 12V / 4Ω = 3A' },
      { id: 'phys_2', title: 'Shpejtësia Mesatare', difficulty: 'easy', xp: 15, question: 'Makina udhëton 150 km në 2.5 orë. Sa është shpejtësia mesatare (km/h)?', answer: '60', hint: 'v = d / t', explanation: 'v = 150 / 2.5 = 60 km/h' },
      { id: 'phys_3', title: 'Energjia Kinetike', difficulty: 'medium', xp: 30, question: 'Topi me masë 2 kg lëviz me shpejtësi 10 m/s. Sa është Ek (Joule)?', answer: '100', hint: 'Ek = ½mv²', explanation: 'Ek = ½ × 2 × 10² = ½ × 2 × 100 = 100 J' },
      { id: 'phys_4', title: 'Fuqia Elektrike', difficulty: 'medium', xp: 30, question: 'Llogarit fuqinë kur V = 220V dhe I = 0.5A (në Watt).', answer: '110', hint: 'P = V × I', explanation: 'P = 220 × 0.5 = 110 W' },
      { id: 'phys_5', title: 'Shpejtësia Kozmike', difficulty: 'hard', xp: 50, question: 'Sa është shpejtësia e parë kozmike e Tokës (km/s, e rrumbullakosur)?', answer: '8', hint: 'v₁ ≈ √(gR) ku g=9.8, R=6371km', explanation: 'v₁ = √(9.8 × 6371000) ≈ 7.9 km/s ≈ 8 km/s' }
    ],
    biology: [
      { id: 'bio_1', title: 'Organela Energjetike', difficulty: 'easy', xp: 15, question: 'Cila organelë quhet "centrali energjetik i qelizës"?', answer: 'mitokondria', hint: 'Prodhon ATP përmes frymëmarrjes qelizore.', explanation: 'Mitokondria — prodhon ATP përmes frymëmarrjes qelizore aerobike.' },
      { id: 'bio_2', title: 'Bazat e DNA-së', difficulty: 'easy', xp: 15, question: 'Adenina (A) çiftohet me cilën bazë në DNA?', answer: 'timina', hint: 'Rregulla: A-T dhe C-G', explanation: 'Adenina çiftohet me Timinën (A-T) dhe Citozina me Guaninën (C-G).' },
      { id: 'bio_3', title: 'Ndarjet Qelizore', difficulty: 'medium', xp: 30, question: 'Sa qeliza bija prodhohen në fund të Mejozës?', answer: '4', hint: 'Mejoza ka dy ndarje: Mejoza I dhe Mejoza II.', explanation: 'Mejoza prodhon 4 qeliza haploide bija (gamete).' },
      { id: 'bio_4', title: 'Gjenetika e Mendelit', difficulty: 'hard', xp: 50, question: 'Dy prindër heterozigotë Aa kryqëzohen. Sa % e pasardhësve priten të jenë homozigotë recessivë (aa)?', answer: '25', hint: 'Përdor Katrorin Punnett: Aa × Aa', explanation: 'Aa × Aa → AA(25%), Aa(50%), aa(25%). Homozigotë recessivë = 25%.' }
    ],
    chemistry: [
      { id: 'chem_1', title: 'Numri Atomik', difficulty: 'easy', xp: 15, question: 'Sa protone ka atomi i Karbonit (C)?', answer: '6', hint: 'Numri atomik i C në tabelën periodike.', explanation: 'Karboni ka numër atomik Z = 6, pra 6 protone.' },
      { id: 'chem_2', title: 'Barazimi i Reaksionit', difficulty: 'medium', xp: 30, question: 'Barazo: __ H₂ + __ O₂ → __ H₂O. Sa koeficientë ka H₂?', answer: '2', hint: 'Numëro atomet H dhe O në të dyja anët.', explanation: '2H₂ + O₂ → 2H₂O. Koeficienti i H₂ = 2.' },
      { id: 'chem_3', title: 'Llogaritje Molare', difficulty: 'hard', xp: 50, question: 'Sa mol janë 44g CO₂? (masa molare CO₂ = 44 g/mol)', answer: '1', hint: 'n = m / M', explanation: 'n = 44g / 44g·mol⁻¹ = 1 mol.' }
    ],
    cs: [
      { id: 'cs_1', title: 'Binary → Decimal', difficulty: 'easy', xp: 15, question: 'Konverto numrin binar 1010 në dhjetor.', answer: '10', hint: '1×2³ + 0×2² + 1×2¹ + 0×2⁰', explanation: '1×8 + 0×4 + 1×2 + 0×1 = 10' },
      { id: 'cs_2', title: 'Kompleksiteti Big-O', difficulty: 'medium', xp: 30, question: 'Cili është kompleksiteti kohor i Binary Search? (shkruaj si "O(log n)")', answer: 'O(log n)', hint: 'Halfon hapësirën e kërkimit në çdo hap.', explanation: 'Binary Search ka kohë O(log n) sepse ndanë listën përgjysmë.' },
      { id: 'cs_3', title: 'Rekursioni: Faktoriali', difficulty: 'hard', xp: 50, question: 'Sa është 6! (faktoriali i 6)?', answer: '720', hint: '6! = 6 × 5 × 4 × 3 × 2 × 1', explanation: '6! = 6×5×4×3×2×1 = 720' }
    ]
  };

  let activeCategory = 'math';
  let solvedSet = new Set();
  let totalXp = 0;
  let currentStreak = 0;

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem('challengeProgress') || '{}');
      solvedSet = new Set(saved.solved || []);
      totalXp = saved.totalXp || 0;
      currentStreak = saved.streak || 0;
    } catch (e) { /* ignore */ }
  }

  function saveProgress() {
    try {
      localStorage.setItem('challengeProgress', JSON.stringify({
        solved: Array.from(solvedSet),
        totalXp: totalXp,
        streak: currentStreak
      }));
    } catch (e) { /* ignore */ }
  }

  function init() {
    if (document.getElementById('challengesOverlay')) return;
    loadProgress();

    const overlay = document.createElement('div');
    overlay.id = 'challengesOverlay';
    overlay.className = 'challenges-overlay';
    overlay.innerHTML = `
      <div class="challenges-window" role="dialog" aria-modal="true">
        <div class="challenges-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🏆</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Sfidat & Ushtrimet Ndërvepruese</h2>
              <div style="font-size:12px;color:var(--text-muted)">Zgjidh probleme, fito XP, ndërto serinë tënde</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="text-align:right">
              <div style="font-size:11px;color:var(--text-muted)">TOTAL XP</div>
              <div id="challengeTotalXp" style="font-size:16px;font-weight:800;color:#f59e0b">${totalXp}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:11px;color:var(--text-muted)">SERIA</div>
              <div id="challengeStreak" style="font-size:16px;font-weight:800;color:#ef4444">🔥 ${currentStreak}</div>
            </div>
            <button id="closeChallengesBtn" class="school-os-close-btn" title="Mbyll Sfidat">×</button>
          </div>
        </div>

        <div class="challenges-body">
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            <button class="ai-pill-btn challenge-cat-btn active" data-cat="math">📐 Matematikë</button>
            <button class="ai-pill-btn challenge-cat-btn" data-cat="physics">🚀 Fizikë</button>
            <button class="ai-pill-btn challenge-cat-btn" data-cat="biology">🧬 Biologji</button>
            <button class="ai-pill-btn challenge-cat-btn" data-cat="chemistry">⚗️ Kimi</button>
            <button class="ai-pill-btn challenge-cat-btn" data-cat="cs">💻 Shkenca Kompjuterike</button>
          </div>
          <div id="challengesList"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderChallenges();
  }

  function wireEvents() {
    const overlay = document.getElementById('challengesOverlay');
    document.getElementById('closeChallengesBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.style.display === 'flex') close();
    });

    document.querySelectorAll('.challenge-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-cat-btn').forEach(b => b.classList.toggle('active', b === btn));
        activeCategory = btn.dataset.cat;
        renderChallenges();
      });
    });
  }

  function renderChallenges() {
    const listEl = document.getElementById('challengesList');
    if (!listEl) return;

    const challenges = CHALLENGES[activeCategory] || [];

    listEl.innerHTML = challenges.map(ch => {
      const isSolved = solvedSet.has(ch.id);
      return `
        <div class="challenge-card ${isSolved ? 'solved' : ''}" id="card-${ch.id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px">
            <div>
              <div style="font-weight:700;font-size:14.5px;color:var(--text)">${isSolved ? '✅ ' : ''}${ch.title}</div>
              <span class="challenge-difficulty-badge ${ch.difficulty}">${ch.difficulty === 'easy' ? 'E Lehtë' : (ch.difficulty === 'medium' ? 'Mesatare' : 'E Vështirë')}</span>
              <span style="font-size:11.5px;color:#f59e0b;font-weight:700;margin-left:8px">+${ch.xp} XP</span>
            </div>
            ${isSolved ? '<span style="font-size:12px;color:#10b981;font-weight:700">E Zgjidhur ✓</span>' : ''}
          </div>

          <div style="font-size:14px;line-height:1.6;color:var(--text);font-weight:500;margin-bottom:4px">${ch.question}</div>

          ${!isSolved ? `
            <input class="challenge-answer-input" id="input-${ch.id}" placeholder="Shkruaj përgjigjen tënde këtu..." />
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="challenge-check-btn" data-id="${ch.id}">✓ Kontrollo</button>
              <button class="ai-pill-btn challenge-hint-btn" data-id="${ch.id}" style="font-size:12px">💡 Ndihmë</button>
            </div>
            <div class="challenge-hint-box" id="hint-${ch.id}">💡 ${ch.hint}</div>
            <div class="challenge-result-box" id="result-${ch.id}"></div>
          ` : `
            <div style="padding:10px;border-radius:8px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);font-size:13px;color:var(--text);margin-top:8px">
              <b>Shpjegimi:</b> ${ch.explanation}
            </div>
          `}
        </div>
      `;
    }).join('');

    // Wire answer check buttons
    listEl.querySelectorAll('.challenge-check-btn').forEach(btn => {
      btn.addEventListener('click', () => checkAnswer(btn.dataset.id));
    });

    listEl.querySelectorAll('.challenge-hint-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hintEl = document.getElementById(`hint-${btn.dataset.id}`);
        if (hintEl) hintEl.style.display = hintEl.style.display === 'none' ? 'block' : (hintEl.style.display === 'block' ? 'none' : 'block');
      });
    });
  }

  function checkAnswer(challengeId) {
    const ch = Object.values(CHALLENGES).flat().find(c => c.id === challengeId);
    if (!ch) return;

    const input = document.getElementById(`input-${challengeId}`);
    const resultEl = document.getElementById(`result-${challengeId}`);
    if (!input || !resultEl) return;

    const userAnswer = input.value.trim().toLowerCase().replace(/\s+/g, '');
    const correctAnswer = ch.answer.toLowerCase().replace(/\s+/g, '');

    if (userAnswer === correctAnswer) {
      resultEl.className = 'challenge-result-box correct';
      resultEl.style.display = 'block';
      resultEl.innerHTML = `✅ Saktë! ${ch.explanation} <b>(+${ch.xp} XP)</b>`;
      solvedSet.add(ch.id);
      totalXp += ch.xp;
      currentStreak++;

      if (window.AppState?.gamification) {
        window.AppState.gamification.points = (window.AppState.gamification.points || 0) + ch.xp;
      }

      saveProgress();
      updateHeaderStats();
      setTimeout(() => renderChallenges(), 1200);
    } else {
      resultEl.className = 'challenge-result-box wrong';
      resultEl.style.display = 'block';
      resultEl.textContent = `❌ Jo e saktë. Provo përsëri! Ndihma: ${ch.hint}`;
      currentStreak = 0;
      saveProgress();
      updateHeaderStats();
    }
  }

  function updateHeaderStats() {
    const xpEl = document.getElementById('challengeTotalXp');
    const streakEl = document.getElementById('challengeStreak');
    if (xpEl) xpEl.textContent = String(totalXp);
    if (streakEl) streakEl.textContent = `🔥 ${currentStreak}`;
  }

  function open() {
    init();
    const overlay = document.getElementById('challengesOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('challengesOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.Challenges = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
