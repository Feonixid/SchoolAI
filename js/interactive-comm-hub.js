// js/interactive-comm-hub.js
// ===================================================================
// INTERACTIVE STUDENT-TEACHER COMMUNICATION & LIVE HELP DESK
// Real-time student question queue, teacher direct answers, AI-assisted
// response drafting, class-wide broadcasts, and "Raise Hand" support.
// ===================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'eduai_classroom_questions';

  function getQuestions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveQuestions(questions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    } catch (e) {
      console.warn('Could not persist questions:', e);
    }
  }

  /**
   * Student asks a question or raises hand
   */
  function submitQuestion(studentName, grade, subject, questionText, urgency = 'normal') {
    const questions = getQuestions();
    const newQ = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentName: studentName || 'Nxënës',
      grade: grade || 10,
      subject: subject || 'Matematikë',
      questionText: questionText.trim(),
      urgency,
      status: 'pending', // 'pending', 'answered', 'resolved'
      answer: null,
      answeredBy: null,
      answeredAt: null,
      createdAt: Date.now()
    };

    questions.unshift(newQ);
    saveQuestions(questions);

    // Notify teacher via peer broadcast / custom event
    window.dispatchEvent(new CustomEvent('newStudentQuestion', { detail: newQ }));

    if (window.Toast?.success) {
      window.Toast.success('🙋‍♂️ Pyetja jote u dërgua te mësuesi!');
    }

    return newQ;
  }

  /**
   * Teacher answers student question
   */
  function answerQuestion(questionId, answerText, teacherName = 'Mësuesi', broadcastToClass = false) {
    const questions = getQuestions();
    const q = questions.find(item => item.id === questionId);
    if (!q) return null;

    q.status = 'answered';
    q.answer = answerText.trim();
    q.answeredBy = teacherName;
    q.answeredAt = Date.now();
    q.broadcast = broadcastToClass;

    saveQuestions(questions);

    window.dispatchEvent(new CustomEvent('questionAnswered', { detail: q }));

    if (broadcastToClass && window.Toast?.info) {
      window.Toast.info(`📢 Përgjigja për pyetjen e ${q.studentName} iu transmetua të gjithë klasës!`);
    }

    return q;
  }

  /**
   * AI Pre-drafts a pedagogical response for the teacher
   */
  function generateAIDraftAnswer(questionText, subject = 'Matematikë') {
    return `Përshëndetje! Në lidhje me pyetjen tënde mbi "${subject}":
Kujto konceptin bazë: kur kemi një problem të tillë, fillimisht ndajmë të dhënat e njohura dhe zbatojmë formulën përkatëse. Provo të rishikosh shembullin 2 në libër dhe më njofto nëse dëshiron ta zgjidhim së bashku në tabelë!`;
  }

  /**
   * Open Teacher Help Desk Panel
   */
  function openTeacherHelpDesk() {
    document.getElementById('teacherHelpDeskModal')?.remove();

    const questions = getQuestions();
    const pendingCount = questions.filter(q => q.status === 'pending').length;

    const modal = document.createElement('div');
    modal.id = 'teacherHelpDeskModal';
    modal.className = 'comm-modal-overlay';

    modal.innerHTML = `
      <div class="comm-modal-container">
        <div class="comm-header">
          <div>
            <h2 style="margin:0;font-size:20px;font-weight:800;color:var(--accent)">💬 Paneli i Komunikimit & Pyetjeve nga Nxënësit</h2>
            <div style="font-size:12.5px;color:var(--muted);margin-top:2px">
              ${pendingCount} pyetje në pritje të përgjigjes
            </div>
          </div>
          <button id="closeHelpDeskBtn" class="comm-close-btn">✕</button>
        </div>

        <div class="comm-body" id="helpDeskQuestionsList">
          ${renderQuestionsList(questions)}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeHelpDeskBtn')?.addEventListener('click', () => modal.remove());
    attachTeacherListEvents(modal);
  }

  function renderQuestionsList(questions) {
    if (questions.length === 0) {
      return `
        <div style="padding:40px;text-align:center;color:var(--muted)">
          <div style="font-size:36px;margin-bottom:10px">✨</div>
          <div style="font-weight:700">Nuk ka pyetje aktive nga nxënësit në këtë moment.</div>
          <div style="font-size:12px;margin-top:4px">Kur nxënësit ngrenë dorën ose pyesin, pyetjet do të shfaqen këtu menjëherë.</div>
        </div>
      `;
    }

    return questions.map(q => `
      <div class="comm-question-card ${q.status === 'pending' ? 'pending' : 'resolved'}" id="card_${q.id}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span class="comm-student-badge">👨‍🎓 ${q.studentName} (Klasa ${q.grade})</span>
            <span class="comm-subject-badge">${q.subject}</span>
            ${q.urgency === 'urgent' ? '<span class="comm-urgent-badge">🔴 Urgjente</span>' : ''}
          </div>
          <span style="font-size:11px;color:var(--muted)">${new Date(q.createdAt).toLocaleTimeString()}</span>
        </div>

        <div style="margin:10px 0;font-size:14px;font-weight:600;color:var(--text);line-height:1.5">
          ${q.questionText}
        </div>

        ${q.answer ? `
          <div class="comm-answer-box">
            <div style="font-size:11.5px;font-weight:700;color:#10b981;margin-bottom:4px">
              ✅ Përgjigjur nga ${q.answeredBy} ${q.broadcast ? '• 📢 Transmetuar klasës' : ''}
            </div>
            <div style="font-size:13px;color:var(--text)">${q.answer}</div>
          </div>
        ` : `
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <textarea id="replyText_${q.id}" class="comm-reply-input" placeholder="Shkruaj përgjigjen për ${q.studentName}..."></textarea>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="comm-btn comm-btn-ai" data-id="${q.id}" data-text="${encodeURIComponent(q.questionText)}" data-subject="${q.subject}">✨ Sugjero me AI</button>
              <button class="comm-btn comm-btn-broadcast" data-id="${q.id}">📢 Përgjigju & Transmeto Klasës</button>
              <button class="comm-btn comm-btn-send" data-id="${q.id}">✉️ Dërgo Përgjigjen</button>
            </div>
          </div>
        `}
      </div>
    `).join('');
  }

  function attachTeacherListEvents(modal) {
    modal.querySelectorAll('.comm-btn-ai').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const qText = decodeURIComponent(btn.dataset.text);
        const subj = btn.dataset.subject;
        const draft = generateAIDraftAnswer(qText, subj);
        const input = document.getElementById(`replyText_${id}`);
        if (input) input.value = draft;
      });
    });

    modal.querySelectorAll('.comm-btn-send').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const input = document.getElementById(`replyText_${id}`);
        if (!input || !input.value.trim()) return alert('Ju lutem shkruani një përgjigje.');
        answerQuestion(id, input.value, 'Mësuesi', false);
        openTeacherHelpDesk(); // refresh
      });
    });

    modal.querySelectorAll('.comm-btn-broadcast').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const input = document.getElementById(`replyText_${id}`);
        if (!input || !input.value.trim()) return alert('Ju lutem shkruani një përgjigje.');
        answerQuestion(id, input.value, 'Mësuesi', true);
        openTeacherHelpDesk(); // refresh
      });
    });
  }

  /**
   * Open Student Question Form ("Ask Teacher / Raise Hand")
   */
  function openStudentAskModal() {
    document.getElementById('studentAskModal')?.remove();

    const studentName = localStorage.getItem('EduAI_student_name') || 'Nxënës';
    const activeGrade = window.AppState?.academic?.activeGrade || 10;
    const activeSubj = window.Subjects?.getActive()?.label || 'Matematikë';

    const modal = document.createElement('div');
    modal.id = 'studentAskModal';
    modal.className = 'comm-modal-overlay';

    modal.innerHTML = `
      <div class="comm-modal-container" style="max-width:540px">
        <div class="comm-header">
          <h2 style="margin:0;font-size:18px;font-weight:800;color:var(--accent)">🙋‍♂️ Pyet Mësuesin / Ngre Dorën</h2>
          <button id="closeAskModalBtn" class="comm-close-btn">✕</button>
        </div>

        <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="font-size:12px;color:var(--muted);font-weight:700;display:block;margin-bottom:4px">Lënda</label>
            <input type="text" id="askSubject" value="${activeSubj}" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit" />
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted);font-weight:700;display:block;margin-bottom:4px">Pyetja ose vështirësia jote:</label>
            <textarea id="askQuestionText" rows="4" placeholder="Përshkruaj ku po has vështirësi ose çfarë pyetje ke..." style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;resize:vertical"></textarea>
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted);font-weight:700;display:block;margin-bottom:4px">Niveli i Urgjencës:</label>
            <select id="askUrgency" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit">
              <option value="normal">🟢 Pyetje e zakonshme</option>
              <option value="urgent">🔴 Kam mbetur i bllokuar në ushtrim</option>
            </select>
          </div>

          <button id="btnSubmitStudentQuestion" class="comm-btn comm-btn-send" style="padding:12px;font-size:14px;font-weight:700;margin-top:6px">
            🚀 Dërgo Pyetjen te Mësuesi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeAskModalBtn')?.addEventListener('click', () => modal.remove());
    document.getElementById('btnSubmitStudentQuestion')?.addEventListener('click', () => {
      const subj = document.getElementById('askSubject')?.value || 'Matematikë';
      const text = document.getElementById('askQuestionText')?.value || '';
      const urgency = document.getElementById('askUrgency')?.value || 'normal';

      if (!text.trim()) return alert('Ju lutem shkruani pyetjen tuaj.');

      submitQuestion(studentName, activeGrade, subj, text, urgency);
      modal.remove();
    });
  }

  // Export
  window.InteractiveCommHub = {
    getQuestions,
    submitQuestion,
    answerQuestion,
    generateAIDraftAnswer,
    openTeacherHelpDesk,
    openStudentAskModal
  };

  console.log('✅ Interactive Student-Teacher Communication Hub loaded');
})();
