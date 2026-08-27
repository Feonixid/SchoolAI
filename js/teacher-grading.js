(function () {
  'use strict';

  const SAMPLE_SUBMISSIONS = [
    {
      id: 'sub_1',
      studentName: 'Arben Krasniqi',
      assignmentTitle: 'Ese: Roli i Energjisë së Rinovueshme',
      subject: 'Fizikë',
      submittedAt: '16 Gusht 2026, 14:30',
      content: `Energjia diellore dhe e erës përfaqësojnë kolonat kryesore të tranzicionit energjetik në Shqipëri dhe rajon.

Nëpërmjet paneleve fotovoltaike, energjia e fotoneve shndërrohet direkt në rrymë elektrike të vazhduar (DC) sipas efektit fotoelektrik të përshkruar nga Ajnshtajni. Duke përdorur invertorë, kjo energji konvertohet në rrymë alternative (AC) për rrjetin kombëtar.

Përfitimet kryesore përfshijnë reduktimin e emetimeve të karbonit dhe pavarësinë energjetike, ndonëse ruajtja e energjisë me bateri litiumi kërkon investime fillestare të larta.`,
      rubrics: { concept: 28, analysis: 27, calc: 18, structure: 19 },
      feedback: 'Punë e shkëlqyer me shpjegim të saktë të efektit fotoelektrik!',
      grade: '10 (92%)',
      status: 'graded'
    },
    {
      id: 'sub_2',
      studentName: 'Elira Hoxha',
      assignmentTitle: 'Raport Laboratori: Ligji i Ohm-it',
      subject: 'Fizikë',
      submittedAt: '17 Gusht 2026, 10:15',
      content: `Gjatë eksperimentit me tension 12V dhe rezistencë 24Ω, matëm rrymën elektrike prej 0.5A.

Formula V = I * R u vërtetua saktësisht:
I = V / R = 12V / 24Ω = 0.5A (500mA).
Fuqia e shpenzuar në llambë ishte P = V * I = 12 * 0.5 = 6W.

Llamba ndriçoi me intensitet të lartë dhe grafiku i tensionit kundrejt rrymës tregoi një varësi lineare.`,
      rubrics: { concept: 30, analysis: 28, calc: 20, structure: 19 },
      feedback: '',
      grade: '',
      status: 'pending'
    },
    {
      id: 'sub_3',
      studentName: 'Dardan Berisha',
      assignmentTitle: 'Analizë: Ekuilibri i Tregut',
      subject: 'Ekonomi',
      submittedAt: '17 Gusht 2026, 11:45',
      content: `Kur çmimi është mbi ekuilibër, kemi tepricë oferte pasi prodhuesit ofrojnë më shumë mall sesa kërkojnë blerësit. Për të shitur mallin, çmimi do të bjerë drejt pikës së ekuilibrit P*.`,
      rubrics: { concept: 24, analysis: 22, calc: 15, structure: 16 },
      feedback: '',
      grade: '',
      status: 'pending'
    }
  ];

  let selectedSubId = 'sub_2';

  function init() {
    if (document.getElementById('teacherGradingOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'teacherGradingOverlay';
    overlay.className = 'teacher-grading-overlay';
    overlay.innerHTML = `
      <div class="teacher-grading-window" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="teacher-grading-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📝</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Studio e Vlerësimit &amp; Rubrikave të Mësuesit</h2>
              <div style="font-size:12px;color:var(--text-muted)">Vlerëso dorëzimet e nxënësve me rubrika interaktive dhe ndihmë nga AI</div>
            </div>
          </div>
          <button id="closeTeacherGradingBtn" class="school-os-close-btn" title="Mbyll Studion">×</button>
        </div>

        <div class="teacher-grading-body">
          <!-- Left: Submissions List -->
          <div class="grading-students-sidebar">
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">DORËZIMET E NXËNËSVE:</div>
            <div id="gradingSubmissionsList" style="display:flex;flex-direction:column;gap:8px"></div>
          </div>

          <!-- Middle: Submission Viewer -->
          <div class="grading-submission-viewer">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div>
                <h3 id="viewingStudentName" style="margin:0;font-size:17px;font-weight:700;color:var(--text)">--</h3>
                <div id="viewingAssignmentTitle" style="font-size:13px;color:var(--text-muted);margin-top:2px">--</div>
              </div>
              <span id="viewingSubmitTime" style="font-size:11.5px;color:var(--text-muted)">--</span>
            </div>

            <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">PËRMBAJTJA E DORËZIMIT:</div>
            <div id="viewingContentBox" style="padding:16px;border-radius:12px;background:var(--input-bg,#f8fafc);border:1px solid var(--border,#cbd5e1);font-size:14px;line-height:1.7;white-space:pre-wrap;margin-bottom:16px"></div>
          </div>

          <!-- Right: Interactive Rubric Scoring Pane -->
          <div class="grading-rubric-pane">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <h3 style="margin:0;font-size:15px;font-weight:700;color:var(--text)">📊 Rubrika e Notimit</h3>
              <button id="gradingAiAssistBtn" class="ai-pill-btn" style="font-size:12px">🤖 AI Sugjerim</button>
            </div>

            <div class="rubric-card">
              <div class="sim-control-group">
                <label style="display:flex;justify-content:space-between">
                  <span>🎯 Saktësia &amp; Koncepti (0-30)</span>
                  <b id="rubricConceptScore" style="color:#6366f1">25/30</b>
                </label>
                <input type="range" id="rubricConceptSlider" min="0" max="30" step="1" value="25" />
              </div>

              <div class="sim-control-group" style="margin-top:10px">
                <label style="display:flex;justify-content:space-between">
                  <span>🔬 Analiza &amp; Arsyetimi (0-30)</span>
                  <b id="rubricAnalysisScore" style="color:#6366f1">25/30</b>
                </label>
                <input type="range" id="rubricAnalysisSlider" min="0" max="30" step="1" value="25" />
              </div>

              <div class="sim-control-group" style="margin-top:10px">
                <label style="display:flex;justify-content:space-between">
                  <span>📊 Llogaritjet &amp; Të Dhënat (0-20)</span>
                  <b id="rubricCalcScore" style="color:#6366f1">18/20</b>
                </label>
                <input type="range" id="rubricCalcSlider" min="0" max="20" step="1" value="18" />
              </div>

              <div class="sim-control-group" style="margin-top:10px">
                <label style="display:flex;justify-content:space-between">
                  <span>✍️ Struktura &amp; Qartësia (0-20)</span>
                  <b id="rubricStructureScore" style="color:#6366f1">18/20</b>
                </label>
                <input type="range" id="rubricStructureSlider" min="0" max="20" step="1" value="18" />
              </div>
            </div>

            <!-- Total Score Display -->
            <div class="rubric-card" style="display:flex;justify-content:space-between;align-items:center;background:rgba(99,102,241,0.08)">
              <div>
                <div style="font-size:11.5px;font-weight:700;color:var(--text-muted)">NOTA PËRFUNDIMTARE:</div>
                <div id="gradingFinalGradeLabel" style="font-size:20px;font-weight:800;color:#6366f1">Nota 9 (86%)</div>
              </div>
              <div id="gradingScoreBadge" style="width:48px;height:48px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">
                86
              </div>
            </div>

            <!-- Teacher Feedback Box -->
            <div class="sim-control-group">
              <label>Komenti &amp; Këshilla për Nxënësin</label>
              <textarea id="gradingTeacherComment" rows="3" placeholder="Shkruaj një koment inkurajues dhe këshilla përmirësimi..." style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border,#cbd5e1);background:var(--input-bg,#ffffff);color:var(--text);font-family:inherit;font-size:13px;resize:none;outline:none"></textarea>
            </div>

            <button id="gradingSaveBtn" class="os-btn-primary" style="padding:10px;font-size:13.5px;font-weight:700;width:100%">
              💾 Ruaj Vlerësimin &amp; Njofto Nxënësin
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderSubmissionsList();
    loadSelectedSubmission(selectedSubId);
  }

  function wireEvents() {
    const overlay = document.getElementById('teacherGradingOverlay');
    document.getElementById('closeTeacherGradingBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    ['rubricConceptSlider', 'rubricAnalysisSlider', 'rubricCalcSlider', 'rubricStructureSlider'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateScoreCalculations);
    });

    document.getElementById('gradingAiAssistBtn')?.addEventListener('click', applyAiGradingSuggestion);
    document.getElementById('gradingSaveBtn')?.addEventListener('click', saveGradingResults);
  }

  function renderSubmissionsList() {
    const listEl = document.getElementById('gradingSubmissionsList');
    if (!listEl) return;

    listEl.innerHTML = SAMPLE_SUBMISSIONS.map(sub => `
      <div class="student-submission-item ${sub.id === selectedSubId ? 'active' : ''}" data-id="${sub.id}">
        <div style="font-weight:700;font-size:13.5px;color:var(--text)">${sub.studentName}</div>
        <div style="font-size:12px;color:var(--text-muted);margin:2px 0">${sub.assignmentTitle}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
          <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${sub.status === 'graded' ? '#10b98120' : '#f59e0b20'};color:${sub.status === 'graded' ? '#10b981' : '#f59e0b'};font-weight:700">
            ${sub.status === 'graded' ? '✅ E Vlerësuar' : '⏳ Në Pritje'}
          </span>
          ${sub.grade ? `<strong style="font-size:12px;color:#6366f1">${sub.grade}</strong>` : ''}
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.student-submission-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedSubId = item.dataset.id;
        renderSubmissionsList();
        loadSelectedSubmission(selectedSubId);
      });
    });
  }

  function loadSelectedSubmission(id) {
    const sub = SAMPLE_SUBMISSIONS.find(s => s.id === id) || SAMPLE_SUBMISSIONS[0];
    if (!sub) return;

    document.getElementById('viewingStudentName') && (document.getElementById('viewingStudentName').textContent = sub.studentName);
    document.getElementById('viewingAssignmentTitle') && (document.getElementById('viewingAssignmentTitle').textContent = `Lënda: ${sub.subject} — ${sub.assignmentTitle}`);
    document.getElementById('viewingSubmitTime') && (document.getElementById('viewingSubmitTime').textContent = `Dorëzuar: ${sub.submittedAt}`);
    document.getElementById('viewingContentBox') && (document.getElementById('viewingContentBox').textContent = sub.content);

    const cSlider = document.getElementById('rubricConceptSlider');
    const aSlider = document.getElementById('rubricAnalysisSlider');
    const clkSlider = document.getElementById('rubricCalcSlider');
    const sSlider = document.getElementById('rubricStructureSlider');
    const commBox = document.getElementById('gradingTeacherComment');

    if (cSlider) cSlider.value = sub.rubrics.concept;
    if (aSlider) aSlider.value = sub.rubrics.analysis;
    if (clkSlider) clkSlider.value = sub.rubrics.calc;
    if (sSlider) sSlider.value = sub.rubrics.structure;
    if (commBox) commBox.value = sub.feedback || '';

    updateScoreCalculations();
  }

  function updateScoreCalculations() {
    const c = parseInt(document.getElementById('rubricConceptSlider')?.value || 0, 10);
    const a = parseInt(document.getElementById('rubricAnalysisSlider')?.value || 0, 10);
    const cl = parseInt(document.getElementById('rubricCalcSlider')?.value || 0, 10);
    const s = parseInt(document.getElementById('rubricStructureSlider')?.value || 0, 10);

    document.getElementById('rubricConceptScore') && (document.getElementById('rubricConceptScore').textContent = `${c}/30`);
    document.getElementById('rubricAnalysisScore') && (document.getElementById('rubricAnalysisScore').textContent = `${a}/30`);
    document.getElementById('rubricCalcScore') && (document.getElementById('rubricCalcScore').textContent = `${cl}/20`);
    document.getElementById('rubricStructureScore') && (document.getElementById('rubricStructureScore').textContent = `${s}/20`);

    const total = c + a + cl + s;
    let letterGrade = 'Nota 5 (E pamjaftueshme)';
    if (total >= 90) letterGrade = 'Nota 10 (Shkëlqyer)';
    else if (total >= 80) letterGrade = 'Nota 9 (Shumë Mirë)';
    else if (total >= 70) letterGrade = 'Nota 8 (Mirë)';
    else if (total >= 60) letterGrade = 'Nota 7 (Mesatare)';
    else if (total >= 50) letterGrade = 'Nota 6 (Mjaftueshëm)';

    document.getElementById('gradingFinalGradeLabel') && (document.getElementById('gradingFinalGradeLabel').textContent = `${letterGrade} (${total}%)`);
    document.getElementById('gradingScoreBadge') && (document.getElementById('gradingScoreBadge').textContent = String(total));
  }

  function applyAiGradingSuggestion() {
    const sub = SAMPLE_SUBMISSIONS.find(s => s.id === selectedSubId);
    if (!sub) return;

    const cSlider = document.getElementById('rubricConceptSlider');
    const aSlider = document.getElementById('rubricAnalysisSlider');
    const clkSlider = document.getElementById('rubricCalcSlider');
    const sSlider = document.getElementById('rubricStructureSlider');
    const commBox = document.getElementById('gradingTeacherComment');

    if (cSlider) cSlider.value = 29;
    if (aSlider) aSlider.value = 28;
    if (clkSlider) clkSlider.value = 19;
    if (sSlider) sSlider.value = 19;
    if (commBox) {
      commBox.value = `Punë e plotë dhe e strukturuar qartë. Zgjidhja konceptuale është e saktë dhe llogaritjet matematiko-shkencore janë kryer pa gabime. Vazhdo me këtë nivel!`;
    }

    updateScoreCalculations();
    if (window.Toast?.success) window.Toast.success('🤖 AI gjeneroi sugjerimin e notës dhe komentin!');
  }

  function saveGradingResults() {
    const sub = SAMPLE_SUBMISSIONS.find(s => s.id === selectedSubId);
    if (!sub) return;

    const total = parseInt(document.getElementById('gradingScoreBadge')?.textContent || 85, 10);
    const comment = document.getElementById('gradingTeacherComment')?.value || '';

    sub.status = 'graded';
    sub.grade = `${total}%`;
    sub.feedback = comment;

    renderSubmissionsList();
    if (window.Toast?.success) window.Toast.success(`✅ Vlerësimi për ${sub.studentName} u ruajt me sukses!`);
  }

  function open() {
    init();
    const overlay = document.getElementById('teacherGradingOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('teacherGradingOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.TeacherGrading = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
