(function () {
  'use strict';

  const DECKS = {
    biology: [
      { q: 'Cili është funksioni kryesor i Mitokondrive në qelizë?', a: 'Prodhimi i energjisë qelizore në formën e molekulave ATP përmes frymëmarrjes qelizore.', box: 1 },
      { q: 'Cilat janë 4 bazat e azotuara që ndërtojnë molekulën e DNA-së?', a: 'Adenina (A), Timina (T), Citozina (C), dhe Guanina (G).', box: 1 },
      { q: 'Cili është dallimi kryesor midis Mitozës dhe Mejozës?', a: 'Mitoza prodhon 2 qeliza bija diploide identike; Mejoza prodhon 4 gametë haploide gjenetikisht të ndryshme.', box: 1 }
    ],
    chemistry: [
      { q: 'Çfarë thotë Ligji i Ruajtjes së Masës (Lavoazie)?', a: 'Në një reaksion kimik, masa e përgjithshme e reaktantëve është e barabartë me masën e produkteve.', box: 1 },
      { q: 'Sa është vlera e Numrit të Avogadros (N_A)?', a: '6.022 × 10²³ grimca/mol.', box: 1 },
      { q: 'Cili është pH i një tretësire neutrale në 25°C?', a: 'pH = 7 (Përqendrimi [H+] = [OH-] = 10^-7 M).', box: 1 }
    ],
    physics: [
      { q: 'Cila është formula e Ligjit të Dytë të Njutonit?', a: 'F = m × a (Forca = Masa × Nxitimi).', box: 1 },
      { q: 'Cila është formula e Ligjit të Ohm-it për qarqet elektrike?', a: 'V = I × R (Tensioni = Rryma × Rezistenca).', box: 1 },
      { q: 'Sa është shpejtësia e dritës në vakum (c)?', a: 'Përafërsisht 3.00 × 10⁸ m/s (300,000 km/s).', box: 1 }
    ],
    history: [
      { q: 'Në cilin vit u mbajt Kuvendi i Vlorës dhe u shpall Pavarësia?', a: 'Më 28 Nëntor 1912, udhëhequr nga Ismail Qemali.', box: 1 },
      { q: 'Kur u themelua Lidhja Shqiptare e Prizrenit?', a: 'Më 10 Qershor 1878.', box: 1 }
    ],
    english: [
      { q: 'Çfarë do të thotë fjala akademike "Hypothesis"?', a: 'Një supozim ose shpjegim i propozuar i testueshëm shkencërisht.', box: 1 },
      { q: 'Çfarë do të thotë "Empirical Evidence"?', a: 'Fakte dhe të dhëna të mbledhura përmes vëzhgimit të drejtpërdrejtë ose eksperimentimit.', box: 1 }
    ]
  };

  let currentDeckKey = 'biology';
  let currentCardIndex = 0;
  let isCardFlipped = false;

  function init() {
    if (document.getElementById('flashcardsOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'flashcardsOverlay';
    overlay.className = 'flashcards-overlay';
    overlay.innerHTML = `
      <div class="flashcards-window" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="flashcards-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🗂️</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Kartat e Dijes (Spaced Repetition Flashcards)</h2>
              <div style="font-size:12px;color:var(--text-muted)">Algoritmi Leitner me 5 Kuti për memorizim afatgjatë</div>
            </div>
          </div>
          <button id="closeFlashcardsBtn" class="school-os-close-btn" title="Mbyll Kartat">×</button>
        </div>

        <div class="flashcards-body">
          <!-- Deck Selector -->
          <div style="display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap;justify-content:center">
            <button class="ai-pill-btn deck-btn active" data-deck="biology">🧬 Biologji</button>
            <button class="ai-pill-btn deck-btn" data-deck="chemistry">⚗️ Kimi</button>
            <button class="ai-pill-btn deck-btn" data-deck="physics">🚀 Fizikë</button>
            <button class="ai-pill-btn deck-btn" data-deck="history">🏛️ Histori</button>
            <button class="ai-pill-btn deck-btn" data-deck="english">🇬🇧 Anglisht</button>
          </div>

          <!-- 3D Flippable Flashcard -->
          <div class="flashcard-scene" id="flashcardScene">
            <div class="flashcard-inner" id="flashcardInner">
              <!-- Front -->
              <div class="flashcard-face flashcard-front">
                <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:1px;margin-bottom:12px">PYETJA (KLIKO PËR TË KTHYER)</div>
                <div id="cardQuestionText" style="font-size:18px;font-weight:700;line-height:1.5;color:var(--text)">--</div>
                <div style="margin-top:20px;font-size:12px;color:var(--text-muted)">💡 Kliko kartën ose shtyp Space për përgjigjen</div>
              </div>
              <!-- Back -->
              <div class="flashcard-face flashcard-back">
                <div style="font-size:11px;font-weight:700;color:#10b981;letter-spacing:1px;margin-bottom:12px">PËRGJIGJA E SAKTË</div>
                <div id="cardAnswerText" style="font-size:16px;font-weight:600;line-height:1.6;color:var(--text)">--</div>
              </div>
            </div>
          </div>

          <!-- Leitner Boxes Progress -->
          <div class="leitner-boxes-bar" id="leitnerBoxesBar">
            <div class="leitner-box-slot active">Kutia 1</div>
            <div class="leitner-box-slot">Kutia 2</div>
            <div class="leitner-box-slot">Kutia 3</div>
            <div class="leitner-box-slot">Kutia 4</div>
            <div class="leitner-box-slot">Kutia 5 (E zotëruar)</div>
          </div>

          <!-- Spaced Repetition Rating Buttons -->
          <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;justify-content:center">
            <button id="cardAgainBtn" class="ai-pill-btn" style="background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3)">
              🔴 Përsërit (Kutia 1)
            </button>
            <button id="cardHardBtn" class="ai-pill-btn" style="background:rgba(245,158,11,0.15);color:#f59e0b;border-color:rgba(245,158,11,0.3)">
              🟠 E Vështirë
            </button>
            <button id="cardGoodBtn" class="ai-pill-btn" style="background:rgba(16,185,129,0.15);color:#10b981;border-color:rgba(16,185,129,0.3)">
              🟢 E Mirë (+1 Kuti)
            </button>
            <button id="cardEasyBtn" class="ai-pill-btn" style="background:rgba(59,130,246,0.15);color:#3b82f6;border-color:rgba(59,130,246,0.3)">
              🔵 E Lehtë (Zotëruar)
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderCurrentCard();
  }

  function wireEvents() {
    const overlay = document.getElementById('flashcardsOverlay');
    document.getElementById('closeFlashcardsBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.querySelectorAll('.deck-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.deck-btn').forEach(b => b.classList.toggle('active', b === btn));
        currentDeckKey = btn.dataset.deck;
        currentCardIndex = 0;
        isCardFlipped = false;
        renderCurrentCard();
      });
    });

    document.getElementById('flashcardScene')?.addEventListener('click', toggleCardFlip);

    document.getElementById('cardAgainBtn')?.addEventListener('click', () => rateCard(1));
    document.getElementById('cardHardBtn')?.addEventListener('click', () => rateCard(2));
    document.getElementById('cardGoodBtn')?.addEventListener('click', () => rateCard(3));
    document.getElementById('cardEasyBtn')?.addEventListener('click', () => rateCard(5));
  }

  function toggleCardFlip() {
    isCardFlipped = !isCardFlipped;
    const inner = document.getElementById('flashcardInner');
    if (inner) inner.classList.toggle('is-flipped', isCardFlipped);
  }

  function renderCurrentCard() {
    const deck = DECKS[currentDeckKey] || [];
    const card = deck[currentCardIndex] || deck[0];
    if (!card) return;

    isCardFlipped = false;
    const inner = document.getElementById('flashcardInner');
    if (inner) inner.classList.remove('is-flipped');

    const qEl = document.getElementById('cardQuestionText');
    const aEl = document.getElementById('cardAnswerText');

    if (qEl) qEl.textContent = card.q;
    if (aEl) aEl.textContent = card.a;

    updateLeitnerBoxUI(card.box || 1);
  }

  function rateCard(newBox) {
    const deck = DECKS[currentDeckKey] || [];
    if (deck[currentCardIndex]) {
      deck[currentCardIndex].box = newBox;
    }

    if (window.AppState?.gamification) {
      window.AppState.gamification.points = (window.AppState.gamification.points || 0) + (newBox * 5);
    }

    currentCardIndex = (currentCardIndex + 1) % deck.length;
    renderCurrentCard();
  }

  function updateLeitnerBoxUI(boxNum) {
    const slots = document.querySelectorAll('.leitner-box-slot');
    slots.forEach((slot, idx) => {
      slot.classList.toggle('active', idx + 1 === boxNum);
    });
  }

  function open() {
    init();
    const overlay = document.getElementById('flashcardsOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('flashcardsOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.Flashcards = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
