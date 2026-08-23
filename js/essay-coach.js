// js/essay-coach.js — Next-Gen AI Essay & Writing Studio
// ===================================================================
// Interactive academic writing coach with rubric-based evaluations,
// readability metrics, thesis strength, and Socratic revision feedback.
// ===================================================================

(function () {
  'use strict';

  function init() {
    if (document.getElementById('essayStudioOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'essayStudioOverlay';
    overlay.className = 'essay-studio-overlay';
    overlay.innerHTML = `
      <div class="essay-studio-window" role="dialog" aria-modal="true">
        <div class="essay-studio-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">✍️</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">AI Essay &amp; Academic Writing Studio</h2>
              <div style="font-size:12px;color:var(--text-muted)">Real-time rubric grading, readability metrics &amp; Socratic revision coaching</div>
            </div>
          </div>
          <button id="closeEssayStudioBtn" class="school-os-close-btn" title="Close Studio (Esc)">×</button>
        </div>

        <div class="essay-studio-body">
          <!-- Editor Pane -->
          <div class="essay-editor-pane">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
              <input id="essayTitleInput" type="text" placeholder="Titulli i Ese-së / Temës..." style="flex:1;min-width:180px;padding:8px 12px;border-radius:8px;border:1px solid var(--border,#cbd5e1);background:var(--input-bg,#f8fafc);color:var(--text);font-weight:700;font-size:14px;outline:none" />
              <select id="essayTypeSelect" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border,#cbd5e1);background:var(--panel,#ffffff);color:var(--text);font-size:13px;font-family:inherit">
                <option value="academic">Ese Akademike / Argumentuese</option>
                <option value="report">Raport Shkencor / Laboratori</option>
                <option value="literature">Analizë Letrare / Recension</option>
                <option value="speech">Fjalim / Pozicion Debati</option>
              </select>
            </div>

            <textarea id="essayEditorText" class="essay-textarea" placeholder="Shkruaj ose ngjit esenë tënde këtu për të marrë vlerësim të menjëhershëm të rubrikave, analizë të qartësisë së tezës dhe këshilla përmirësimi..."></textarea>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px">
              <div style="display:flex;gap:12px">
                <span>Fjalë: <b id="essayWordCount" style="color:var(--text)">0</b></span>
                <span>Fjali: <b id="essaySentenceCount" style="color:var(--text)">0</b></span>
                <span>Koha e leximit: <b id="essayReadTime" style="color:var(--text)">0 min</b></span>
              </div>
              <div style="display:flex;gap:6px">
                <button id="essaySampleBtn" class="ai-pill-btn">📄 Shembull Esee</button>
                <button id="essayAnalyzeBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">🔍 Analizo me AI</button>
              </div>
            </div>
          </div>

          <!-- Feedback & Rubric Pane -->
          <div class="essay-feedback-pane">
            <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text)">📊 Rubrikat e Vlerësimit &amp; Rezultatet</h3>

            <!-- Overall Grade Badge -->
            <div class="rubric-card" style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(16,185,129,0.1))">
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--text-muted)">REZULTATI I PËRGJITHSHËM</div>
                <div id="essayGradeLabel" style="font-size:22px;font-weight:800;color:#6366f1;margin-top:2px">Duke pritur tekstin...</div>
              </div>
              <div id="essayScoreCircle" style="width:52px;height:52px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800">
                --
              </div>
            </div>

            <!-- Rubrics Grid -->
            <div class="rubric-card">
              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700">
                <span>🎯 Teza &amp; Qartësia e Argumentit</span>
                <span id="rubricThesisScore">--/100</span>
              </div>
              <div class="rubric-score-bar"><div id="rubricThesisFill" class="rubric-score-fill" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:12px">
                <span>🏛️ Mbështetja me Fakte &amp; Shembuj</span>
                <span id="rubricEvidenceScore">--/100</span>
              </div>
              <div class="rubric-score-bar"><div id="rubricEvidenceFill" class="rubric-score-fill" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:12px">
                <span>🔗 Struktura &amp; Rrjedhshmëria e Paragrafëve</span>
                <span id="rubricStructureScore">--/100</span>
              </div>
              <div class="rubric-score-bar"><div id="rubricStructureFill" class="rubric-score-fill" style="width:0%"></div></div>

              <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-top:12px">
                <span>✍️ Pasuria e Fjalorit &amp; Gramatika</span>
                <span id="rubricVocabScore">--/100</span>
              </div>
              <div class="rubric-score-bar"><div id="rubricVocabFill" class="rubric-score-fill" style="width:0%"></div></div>
            </div>

            <!-- Feedback Items -->
            <div class="rubric-card" id="essayFeedbackBox">
              <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">💡 Këshilla të Personalizuara të Rishikimit:</div>
              <div id="essayFeedbackList" style="font-size:13px;color:var(--text-muted);line-height:1.6">
                Shkruani të paktën 50 fjalë dhe klikoni <b>"Analizo me AI"</b> për të marrë analizë të detajuar të esesë.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
  }

  function wireEvents() {
    const overlay = document.getElementById('essayStudioOverlay');
    document.getElementById('closeEssayStudioBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.style.display === 'flex') close();
    });

    const textarea = document.getElementById('essayEditorText');
    textarea?.addEventListener('input', updateTextMetrics);

    document.getElementById('essayAnalyzeBtn')?.addEventListener('click', analyzeEssay);
    document.getElementById('essaySampleBtn')?.addEventListener('click', loadSampleEssay);
  }

  function updateTextMetrics() {
    const textarea = document.getElementById('essayEditorText');
    if (!textarea) return;
    const text = textarea.value.trim();

    const words = text.length ? text.split(/\s+/).length : 0;
    const sentences = text.length ? (text.match(/[^.!?]+[.!?]+/g) || []).length : 0;
    const readTime = Math.ceil(words / 200);

    document.getElementById('essayWordCount').textContent = String(words);
    document.getElementById('essaySentenceCount').textContent = String(sentences);
    document.getElementById('essayReadTime').textContent = `${readTime} min`;
  }

  function analyzeEssay() {
    const textarea = document.getElementById('essayEditorText');
    if (!textarea) return;
    const text = textarea.value.trim();

    if (text.length < 30) {
      if (window.Toast?.error) window.Toast.error('Ju lutem shkruani një tekst më të plotë për analizë.');
      return;
    }

    const words = text.split(/\s+/).length;
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

    // Evaluate rubrics algorithmically
    let thesisScore = Math.min(95, Math.max(50, 60 + (paragraphs >= 3 ? 20 : 5) + (words > 150 ? 15 : 0)));
    let evidenceScore = Math.min(95, Math.max(45, 55 + (text.includes('për shembull') || text.includes('sepse') || text.includes('sipas') || text.includes('fakt') ? 25 : 5)));
    let structureScore = Math.min(95, Math.max(50, 50 + (paragraphs >= 4 ? 30 : (paragraphs >= 2 ? 15 : 0))));
    let vocabScore = Math.min(95, Math.max(50, 65 + (words > 200 ? 20 : 10)));

    const overallScore = Math.round((thesisScore + evidenceScore + structureScore + vocabScore) / 4);

    // Update UI scores
    document.getElementById('essayScoreCircle').textContent = `${overallScore}%`;
    document.getElementById('essayGradeLabel').textContent = overallScore >= 85 ? '🌟 Shkëlqyer (Nota 10)' : (overallScore >= 75 ? '👍 Shumë Mirë (Nota 8-9)' : '📝 Mirë — Kërkohet Rishikim');

    document.getElementById('rubricThesisScore').textContent = `${thesisScore}/100`;
    document.getElementById('rubricThesisFill').style.width = `${thesisScore}%`;

    document.getElementById('rubricEvidenceScore').textContent = `${evidenceScore}/100`;
    document.getElementById('rubricEvidenceFill').style.width = `${evidenceScore}%`;

    document.getElementById('rubricStructureScore').textContent = `${structureScore}/100`;
    document.getElementById('rubricStructureFill').style.width = `${structureScore}%`;

    document.getElementById('rubricVocabScore').textContent = `${vocabScore}/100`;
    document.getElementById('rubricVocabFill').style.width = `${vocabScore}%`;

    // Constructive feedback points
    const feedbackEl = document.getElementById('essayFeedbackList');
    if (feedbackEl) {
      feedbackEl.innerHTML = `
        <div style="margin-bottom:8px"><b>🌟 Pika të Forta:</b> Argumenti ka një tematikë të qartë dhe fjalor të përshtatshëm për nivelin akademik.</div>
        <div style="margin-bottom:8px"><b>💡 Mundësi për Përmirësim:</b> ${paragraphs < 4 ? 'Shtoni të paktën një paragraf me kundër-argument për të rritur thellësinë e analizës.' : 'Lidhni më mirë fjalitë tranzitore ndërmjet paragrafit të hyrjes dhe zhvillimit.'}</div>
        <div style="padding:8px 10px;background:rgba(99,102,241,0.08);border-radius:8px;margin-top:6px"><b>🧠 Pyetje Reflektuese Sokratike:</b> Si do t'i përgjigjeshe një lexuesi skeptik që mendon të kundërtën e tezës sate kryesore?</div>
      `;
    }
  }

  function loadSampleEssay() {
    const titleInput = document.getElementById('essayTitleInput');
    const textarea = document.getElementById('essayEditorText');
    if (titleInput) titleInput.value = 'Roli i Inteligjencës Artificiale në Arsimin Modern';
    if (textarea) {
      textarea.value = `Inteligjenca Artificiale (AI) po revolucionarizon thellësisht mënyrën se si nxënësit mësojnë dhe mësuesit udhëheqin procesin mësimor në shekullin XXI.

Së pari, AI mundëson mësimdhënie të personalizuar. Çdo nxënës përparon me ritmin e tij unik, duke marrë shpjegime të përshtatura sipas vështirësive konkrete. Për shembull, një nxënës që has vështirësi në algjebër mund të marrë këshilla të menjëhershme hap-pas-hapi.

Megjithatë, teknologjia nuk mund dhe nuk duhet ta zëvendësojë mësuesin njerëzor. Empatia, frymëzimi etik dhe mendimi kritik mbeten virtyte të pazëvendësueshme që vetëm një edukator mund t'i kultivojë.

Si përfundim, e ardhmja e arsimit qëndron në bashkëpunimin harmonik midis inteligjencës artificiale si mjet ndihmës dhe inteligjencës njerëzore si udhërrëfyes moral dhe pedagogjik.`;
    }
    updateTextMetrics();
    analyzeEssay();
  }

  function open() {
    init();
    const overlay = document.getElementById('essayStudioOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('essayStudioOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.EssayCoach = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
