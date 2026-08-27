// js/students.js
// ===================================================================
// STUDENT & GRADE MANAGEMENT
// Grading system is fully wired — all averages display using
// whichever scale the teacher selected (Albanian/American/German/etc.)
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Default students if none exist
  const DEFAULT_STUDENTS = [
    {
      id: 1,
      name: 'Laerti Admin',
      firstName: 'Laerti',
      lastName: 'Admin',
      gradeLevel: 10,
      status: 'active',
      semesters: {
        semester1: { detyra: [10, 9, 10], projekti: 10, testi: 10 },
        semester2: { detyra: [], projekti: null, testi: null },
        semester3: { detyra: [], projekti: null, testi: null }
      }
    }
  ];

  // API Base URL for backend sync
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
    ? (window.location.protocol + '//' + window.location.hostname + ':3001')
    : window.location.origin;

  function getAuthHeaders() {
    const token = sessionStorage.getItem('EduAI_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async function syncStudentsWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;
    try {
      const res = await fetch(`${API_BASE}/api/students`, { headers: { ...getAuthHeaders() } });
      if (res.ok) {
        const data = await res.json();
        if (data.students && data.students.length > 0) {
          state.students.list = data.students;
          localStorage.setItem('EduAI_students', JSON.stringify(data.students));
        }
      }
    } catch (e) { console.warn('Could not sync students:', e.message); }
  }

  async function saveStudentToBackend(student) {
    if (!window.Accounts?.isLoggedIn()) { localStorage.setItem('EduAI_students', JSON.stringify(state.students.list)); return; }
    try {
      await fetch(`${API_BASE}/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ student })
      });
    } catch (e) { console.warn('Could not save student:', e.message); }
    localStorage.setItem('EduAI_students', JSON.stringify(state.students.list));
  }

  async function addStudentToBackend(student) {
    if (!window.Accounts?.isLoggedIn()) { localStorage.setItem('EduAI_students', JSON.stringify(state.students.list)); return; }
    try {
      await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ student })
      });
    } catch (e) { console.warn('Could not add student:', e.message); }
    localStorage.setItem('EduAI_students', JSON.stringify(state.students.list));
  }

  async function deleteStudentFromBackend(studentId) {
    if (!window.Accounts?.isLoggedIn()) { localStorage.setItem('EduAI_students', JSON.stringify(state.students.list)); return; }
    try {
      await fetch(`${API_BASE}/api/students/${studentId}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
    } catch (e) { console.warn('Could not delete student:', e.message); }
    localStorage.setItem('EduAI_students', JSON.stringify(state.students.list));
  }

  async function loadStudents() {
    const saved = localStorage.getItem('EduAI_students');
    if (saved) { state.students.list = JSON.parse(saved); }
    else { state.students.list = DEFAULT_STUDENTS; }
    if (window.Accounts?.isLoggedIn()) { await syncStudentsWithBackend(); }
    const loggedInId = localStorage.getItem('EduAI_logged_student');
    if (loggedInId) { state.students.selectedId = parseInt(loggedInId); }
  }

  function persistStudentLogin(id) {
    localStorage.setItem('EduAI_logged_student', id);
  }

  loadStudents();

  // DOM references
  const gradeSelect        = document.getElementById('gradeSelect');
  const chapterList        = document.getElementById('chapterList');
  const selectedFocus      = document.getElementById('selectedFocus');
  const studentNameInput   = document.getElementById('studentNameInput');
  const addStudentBtn      = document.getElementById('addStudentBtn');
  const studentListDiv     = document.getElementById('studentList');
  const studentModalOverlay = document.getElementById('studentModalOverlay');

  const schoolLogoDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
      <rect rx='6' ry='6' width='64' height='40' y='12' fill='%2300397a'/>
      <path d='M6 12 C20 4 44 4 58 12' fill='none' stroke='%23a7e0ff' stroke-width='2'/>
      <text x='32' y='36' font-size='14' font-family='Arial' fill='%23ffffff' text-anchor='middle' font-weight='700'>A</text>
    </svg>`
  );

  // ================================================================
  // GRADING DISPLAY HELPER
  // Raw scores are always stored 0–10 (Albanian internal scale).
  // displayGrade() converts to whatever system the teacher selected.
  // ================================================================
  function displayGrade(rawScore) {
    if (rawScore === null || rawScore === undefined || isNaN(rawScore)) {
      return { text: '-', label: '', color: '#6b7280', scaled: null };
    }

    const gs = window.getGradingSystem?.();
    if (!gs) return { text: rawScore.toFixed(1), label: '', color: '#6b7280', scaled: rawScore };

    // Normalise 0-10 → 0-1, then scale to target system's range
    const normalized = Math.max(0, Math.min(rawScore / 10, 1));
    let scaled;
    if (gs.reversed) {
      // German: 1 = best (normalized=1), 6 = worst (normalized=0)
      scaled = gs.max - normalized * (gs.max - gs.min);
    } else {
      scaled = gs.min + normalized * (gs.max - gs.min);
    }

    // Find the matching band
    const band = gs.scale.find(b => {
      if (gs.reversed) return scaled <= b.max && scaled >= b.min;
      return scaled >= b.min && scaled <= b.max;
    }) || gs.scale[gs.scale.length - 1];

    // Letter grade suffix for American
    let text = gs.format ? gs.format(scaled) : scaled.toFixed(1);
    if (gs.letterGrade) text += ' (' + gs.letterGrade(scaled) + ')';

    return { text, label: band?.label || '', color: band?.color || '#6b7280', scaled };
  }

  // Small coloured badge HTML for inline use
  function gradeBadgeHTML(rawScore) {
    const d = displayGrade(rawScore);
    if (d.scaled === null) return '<span style="color:var(--muted)">-</span>';
    return `<span style="font-weight:700;color:${d.color}">${d.text}</span>`
         + (d.label ? ` <span style="background:${d.color};color:#fff;font-size:10px;`
         + `padding:1px 6px;border-radius:8px;font-weight:600;margin-left:4px">${d.label}</span>` : '');
  }

  // ================================================================
  // GRADE BUTTONS
  // ================================================================
  function buildGradeButtons(showAll = false) {
    if (!gradeSelect) return;
    gradeSelect.innerHTML = '';

    const activeGrades = new Set(state.students.list.filter(s => s.status !== 'pending').map(s => s.gradeLevel || 9));
    activeGrades.add(9);
    const gradesToShow = showAll ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from(activeGrades).sort((a, b) => a - b);

    gradesToShow.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'gradeBtn' + (state.academic.activeGrade === g ? ' active' : '');
      btn.textContent = 'Klasa ' + g;
      btn.dataset.grade = g;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.gradeBtn').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        state.academic.activeGrade = g;
        buildChapterList(g);
        renderStudents();
      });
      gradeSelect.appendChild(btn);
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'gradeBtn';
    toggleBtn.style.background = showAll ? '#e0edff' : 'var(--bg)';
    toggleBtn.style.border = '1px dashed var(--accent)';
    toggleBtn.textContent = showAll ? '👁️ Fsheh Bosh' : '👁️ Të gjitha';
    toggleBtn.addEventListener('click', () => buildGradeButtons(!showAll));
    gradeSelect.appendChild(toggleBtn);

    if (!gradesToShow.includes(state.academic.activeGrade) && !showAll && gradesToShow.length > 0) {
      state.academic.activeGrade = gradesToShow[0];
    }
    buildChapterList(state.academic.activeGrade);
    renderStudents();
  }

  async function buildChapterList(grade) {
    if (!chapterList) return;
    chapterList.innerHTML = '';

    // Try to get chapters from Curriculum RAG for the active subject + curriculum
    const activeSubject = window.Subjects?.getActive();
    const subjectId = activeSubject?.id;
    const curriculum = window.CurriculumRAG?.activeCurriculum || 'albanian';

    // Map subject IDs to RAG subject keys
    const subjectMap = {
      'matematike': 'math', 'fizike': 'physics', 'ekonomi': 'economics',
      'biologji': 'biology', 'kimi': 'chemistry', 'histori': 'history'
    };
    const ragSubject = subjectMap[subjectId];

    let ragUnits = null;
    if (ragSubject && window.CurriculumRAG && grade >= 9 && grade <= 12) {
      try {
        const pack = await window.CurriculumRAG.loadPack(grade, ragSubject, curriculum);
        if (pack && pack.units && pack.units.length > 0) {
          ragUnits = pack.units;
        }
      } catch (e) { console.warn('Could not load RAG chapters:', e); }
    }

    if (ragUnits) {
      // Build chapter list from RAG data — units as sections, topics as clickable items
      ragUnits.forEach((unit, uIdx) => {
        // Unit header
        const unitHeader = document.createElement('div');
        unitHeader.className = 'chapterItem chapterUnit';
        unitHeader.style.cssText = 'font-weight:700;color:var(--accent);font-size:13px;margin-top:8px;padding:6px 10px;background:rgba(37,99,235,0.08);border-radius:8px;cursor:pointer;';
        unitHeader.textContent = `${uIdx + 1}. ${unit.title}`;
        unitHeader.setAttribute('role', 'button');

        // Click unit header → focus on entire unit
        unitHeader.addEventListener('click', () => {
          document.querySelectorAll('.chapterItem').forEach(x => x.classList.remove('active'));
          unitHeader.classList.add('active');

          // Build deep focus instruction from ALL topics in this unit
          let focusContent = `ACTIVE FOCUS — Unit: "${unit.title}"\n`;
          focusContent += `Grade: ${grade}, Subject: ${activeSubject?.label || ragSubject}, Curriculum: ${curriculum.toUpperCase()}\n\n`;
          focusContent += `GIVE EXTRA WEIGHT TO THIS UNIT. The teacher has selected this as the active lesson.\n\n`;

          if (unit.topics) {
            unit.topics.forEach(t => {
              focusContent += `### ${t.title}\n`;
              if (t.concepts) focusContent += `Concepts: ${t.concepts.join(', ')}\n`;
              if (t.keyFormulas) focusContent += `Key Formulas: ${t.keyFormulas.join(' | ')}\n`;
              if (t.keyFacts) focusContent += `Key Facts:\n${t.keyFacts.map(f => '- ' + f).join('\n')}\n`;
              if (t.procedures) focusContent += `Procedures:\n${t.procedures.map(p => '- ' + p).join('\n')}\n`;
              focusContent += '\n';
            });
          }
          if (unit.commonMisconceptions) {
            focusContent += `Common Misconceptions to Address:\n${unit.commonMisconceptions.map(m => '⚠️ ' + m).join('\n')}\n`;
          }

          state.academic.activeChapter = { grade, index: uIdx + 1, title: unit.title };
          state.academic.focusInstruction = focusContent;
          if (selectedFocus) selectedFocus.textContent = `Grade ${grade} — ${unit.title}`;
        });
        chapterList.appendChild(unitHeader);

        // Individual topics under each unit
        if (unit.topics) {
          unit.topics.forEach((topic, tIdx) => {
            const div = document.createElement('div');
            div.className = 'chapterItem chapterTopic';
            div.style.cssText = 'padding-left:20px;font-size:12px;border-left:2px solid rgba(37,99,235,0.2);margin-left:10px;';
            div.textContent = topic.title;
            div.setAttribute('role', 'button');
            div.addEventListener('click', () => {
              document.querySelectorAll('.chapterItem').forEach(x => x.classList.remove('active'));
              div.classList.add('active');

              // Deep focus on this specific topic
              let topicFocus = `ACTIVE FOCUS — Topic: "${topic.title}" (from unit "${unit.title}")\n`;
              topicFocus += `Grade: ${grade}, Subject: ${activeSubject?.label || ragSubject}, Curriculum: ${curriculum.toUpperCase()}\n\n`;
              topicFocus += `GIVE MAXIMUM WEIGHT TO THIS SPECIFIC TOPIC. All responses should relate to this content.\n\n`;
              if (topic.concepts) topicFocus += `Concepts: ${topic.concepts.join(', ')}\n`;
              if (topic.keyFormulas) topicFocus += `Key Formulas:\n${topic.keyFormulas.map(f => '• ' + f).join('\n')}\n\n`;
              if (topic.keyFacts) topicFocus += `Key Facts:\n${topic.keyFacts.map(f => '• ' + f).join('\n')}\n\n`;
              if (topic.procedures) topicFocus += `Step-by-step Procedures:\n${topic.procedures.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
              if (topic.definitions) {
                topicFocus += `Definitions:\n`;
                Object.entries(topic.definitions).forEach(([term, def]) => {
                  topicFocus += `• ${term}: ${def}\n`;
                });
                topicFocus += '\n';
              }
              if (topic.examples) topicFocus += `Examples:\n${topic.examples.map(e => '• ' + e).join('\n')}\n`;

              state.academic.activeChapter = { grade, index: uIdx + 1, title: topic.title };
              state.academic.focusInstruction = topicFocus;
              if (selectedFocus) selectedFocus.textContent = `Grade ${grade} — ${topic.title}`;
            });
            chapterList.appendChild(div);
          });
        }
      });
    } else {
      // Fallback: use hardcoded gradeChapters (for Albanian language subject or missing RAG data)
      const chapters = window.gradeChapters[grade] || ['Standard chapters'];
      chapters.forEach((ch, idx) => {
        const div = document.createElement('div');
        div.className = 'chapterItem';
        div.textContent = ch;
        div.dataset.ch = idx + 1;
        div.setAttribute('role', 'button');
        div.addEventListener('click', () => {
          document.querySelectorAll('.chapterItem').forEach(x => x.classList.remove('active'));
          div.classList.add('active');
          state.academic.activeChapter = { grade, index: idx + 1, title: ch };
          state.academic.focusInstruction =
            `ACTIVE FOCUS: Grade ${grade}. ` +
            `Chapter: "${ch}". Subject: ${activeSubject?.label || 'this subject'}.` +
            ` Do not include material outside this chapter.`;
          if (selectedFocus) selectedFocus.textContent = `Grade ${grade} — ${ch}`;
        });
        chapterList.appendChild(div);
      });
    }
  }

  // ================================================================
  // STUDENT STRUCTURE
  // ================================================================
  function initializeStudentStructure(student) {
    if (!student.semesters) {
      student.semesters = {
        semester1: { detyra: [], projekti: null, testi: null, mesatarja: null },
        semester2: { detyra: [], projekti: null, testi: null, mesatarja: null },
        semester3: { detyra: [], projekti: null, testi: null, mesatarja: null }
      };
    }
    if (!student.teacherNotes) student.teacherNotes = '';
    if (!student.aiNotes)      student.aiNotes      = '';
    if (!student.finalAverage) student.finalAverage = null;
  }

  // Weighted average: Homework 30%, Project 30%, Test 40%
  function calculateSemesterAverage(semester) {
    if (!semester) return null;
    const detyraAvg = semester.detyra.length
      ? semester.detyra.reduce((a, b) => a + b, 0) / semester.detyra.length
      : 0;
    if (semester.detyra.length === 0 && semester.projekti === null && semester.testi === null) return null;
    return (detyraAvg * 0.30) + ((semester.projekti || 0) * 0.30) + ((semester.testi || 0) * 0.40);
  }

  function calculateFinalAverage(semesters) {
    const avgs = Object.keys(semesters)
      .map(k => calculateSemesterAverage(semesters[k]))
      .filter(a => a !== null);
    return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  }

  // ================================================================
  // STUDENT LIST
  // ================================================================
  function formatStudentMeta(s) {
    initializeStudentStructure(s);
    const parts = [];
    if (s.gradeLevel) parts.push('Klasa ' + s.gradeLevel);
    if (s.teacherCode) parts.push('Kodi: ' + s.teacherCode);
    const finalAvg = calculateFinalAverage(s.semesters);
    if (finalAvg !== null && !isNaN(finalAvg)) {
      // ── GRADING SYSTEM WIRED HERE ──
      const gd = displayGrade(finalAvg);
      parts.push('Mesatarja ' + gd.text + (gd.label ? ' · ' + gd.label : ''));
    }
    return parts.join(' · ');
  }

  function renderStudents() {
    if (!studentListDiv) return;
    studentListDiv.innerHTML = '';

    const visibleGrade = state.ui.teacherMode ? state.academic.activeGrade : null;
    let list = state.students.list.filter(s => s.status !== 'pending');
    if (visibleGrade) list = list.filter(s => s.gradeLevel === visibleGrade);
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'sq', { sensitivity: 'base' }));

    list.forEach(s => {
      const div = document.createElement('div');
      div.className = 'studentItem';
      div.dataset.id = s.id;
      div.setAttribute('role', 'button');

      const left = document.createElement('div');
      left.className = 'studentItemLeft';

      const img = document.createElement('img');
      img.src = schoolLogoDataUrl;
      img.alt = 'Logo';

      const textWrap = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'studentName';
      nameEl.textContent = s.name || 'Nxënës pa emër';

      const meta = document.createElement('div');
      meta.className = 'studentMeta';
      meta.textContent = formatStudentMeta(s);

      textWrap.appendChild(nameEl);
      textWrap.appendChild(meta);
      left.appendChild(img);
      left.appendChild(textWrap);
      div.appendChild(left);
      div.addEventListener('click', () => openStudentModal(s.id));
      studentListDiv.appendChild(div);
    });
  }

  // Re-render student list whenever teacher changes grading system
  window.addEventListener('gradingSystemChanged', () => {
    renderStudents();
    // If modal is open, update the overall tag too
    const tag = document.getElementById('studentOverallTag');
    if (tag && state.students.selectedId) {
      const s = state.students.list.find(st => st.id === state.students.selectedId);
      if (s) {
        initializeStudentStructure(s);
        const avg = calculateFinalAverage(s.semesters);
        tag.innerHTML = buildFinalAverageHTML(avg);
      }
    }
  });

  // ================================================================
  // ADD STUDENT
  // ================================================================
  if (addStudentBtn && studentNameInput) {
    addStudentBtn.addEventListener('click', () => {
      const fullName = (studentNameInput.value || '').trim();
      if (!fullName) return;
      const parts = fullName.split(' ');
      const newStudent = {
        id: Date.now(),
        name: fullName,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        gradeLevel: state.academic.activeGrade || null,
        semesters: {
          semester1: { detyra: [], projekti: null, testi: null, mesatarja: null },
          semester2: { detyra: [], projekti: null, testi: null, mesatarja: null },
          semester3: { detyra: [], projekti: null, testi: null, mesatarja: null }
        },
        teacherNotes: '', aiNotes: '', finalAverage: null, status: 'active'
      };
      state.students.list.push(newStudent);
      addStudentToBackend(newStudent);
      studentNameInput.value = '';
      renderStudents();
    });
    studentNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addStudentBtn.click(); });
  }

  // ================================================================
  // DELETE STUDENT — uses Dialog for Electron compat
  // ================================================================
  async function deleteStudent(studentId) {
    const confirmed = window.Dialog
      ? await window.Dialog.confirm('A jeni i sigurtë se doni të fshini këtë nxënës?', 'Fshi')
      : confirm('A jeni i sigurtë se doni të fshini këtë nxënës?');
    if (!confirmed) return;
    state.students.list = state.students.list.filter(s => s.id !== studentId);
    await deleteStudentFromBackend(studentId);
    renderStudents();
    closeStudentModal();
  }

  // ================================================================
  // OPEN STUDENT MODAL
  // ================================================================
  function buildFinalAverageHTML(avg) {
    if (avg === null || isNaN(avg)) return 'Mesatarja: <strong>-</strong>';
    const gd = displayGrade(avg);
    return `Mesatarja: <strong style="color:${gd.color}">${gd.text}</strong>`
         + (gd.label ? ` <span style="background:${gd.color};color:#fff;font-size:10px;`
         + `padding:1px 6px;border-radius:8px;font-weight:600;margin-left:4px">${gd.label}</span>` : '');
  }

  function openStudentModal(id) {
    state.students.selectedId = id;
    const s = state.students.list.find(st => st.id === id);
    if (!s) return;
    initializeStudentStructure(s);

    const modal = document.getElementById('studentModal');

    modal.innerHTML = `
      <h3>Profili i nxënësit</h3>

      <div class="modalRow">
        <label>Emri
          <input type="text" id="studentFirstNameInput" value="${s.firstName || ''}" />
        </label>
        <label>Mbiemri
          <input type="text" id="studentLastNameInput" value="${s.lastName || ''}" />
        </label>
      </div>

      <div class="modalRow">
        <label>Klasa
          <select id="studentGradeLevelInput">
            <option value="">(pa specifikuar)</option>
            ${Array.from({ length: 12 }, (_, i) => i + 1).map(g =>
              `<option value="${g}" ${s.gradeLevel === g ? 'selected' : ''}>Klasa ${g}</option>`
            ).join('')}
          </select>
        </label>
        <label>Kodi i Mësuesit
          <input type="text" id="studentTeacherCode" value="${s.teacherCode || ''}" placeholder="Opsionale" />
        </label>
      </div>

      <div style="margin-top:16px">
        <div class="semester-tabs">
          <button class="semester-tab active" data-semester="semester1">Semestri 1</button>
          <button class="semester-tab" data-semester="semester2">Semestri 2</button>
          <button class="semester-tab" data-semester="semester3">Semestri 3</button>
          <button class="semester-tab" data-semester="badges" style="color:var(--accent);font-weight:700">🏆 Arritjet</button>
        </div>
        <div class="semester-content">
          ${renderSemesterContent('semester1', s.semesters.semester1)}
          ${renderSemesterContent('semester2', s.semesters.semester2)}
          ${renderSemesterContent('semester3', s.semesters.semester3)}
          <div class="semester-panel" data-semester="badges" style="display:none">
            <div id="student-modal-badges-container" style="padding:4px">
              <em style="color:var(--muted)">Duke ngarkuar arritjet...</em>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:16px">
        <h4 class="panel-title">Shënime të Mësuesit</h4>
        <textarea id="teacherNotesArea" placeholder="Shkruani shënime për këtë nxënës..."
          style="width:100%;min-height:80px;padding:8px;border-radius:8px;
          border:1px solid rgba(15,33,56,0.20);background:var(--input-bg);
          color:var(--text);font-family:inherit;font-size:13px;resize:vertical">${s.teacherNotes || ''}</textarea>
      </div>

      <div class="modalFooter" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
        <button id="studentModalDelete" class="btn-secondary" style="background:#ef4444;color:white;border:none">🗑️ Fshi Nxënësin</button>
        <div style="display:flex;gap:8px;align-items:center">
          <div class="overallTag" id="studentOverallTag">${buildFinalAverageHTML(calculateFinalAverage(s.semesters))}</div>
          <button id="studentModalCancel" class="btn-secondary">Anulo</button>
          <button id="studentModalSave" class="btn-primary">Ruaj</button>
        </div>
      </div>
    `;

    modal.style.maxHeight = '85vh';
    modal.style.overflowY = 'auto';
    studentModalOverlay.style.display = 'flex';

    setupSemesterTabs(s);
    setupAIGeneration(s);
    document.getElementById('studentModalSave').addEventListener('click',   () => saveStudent(s));
    document.getElementById('studentModalCancel').addEventListener('click', closeStudentModal);
    document.getElementById('studentModalDelete').addEventListener('click', () => deleteStudent(s.id));
  }

  // ================================================================
  // SEMESTER CONTENT — grade inputs always 0-10 (Albanian raw scale)
  // Display shows the converted label from selected grading system
  // ================================================================
  function renderSemesterContent(semesterKey, semester) {
    const semesterNum  = semesterKey.replace('semester', '');
    const mesatarja    = calculateSemesterAverage(semester);
    const detyraCount  = semester.detyra.length;
    // ── GRADING SYSTEM WIRED HERE ──
    const avgDisplay   = mesatarja !== null ? gradeBadgeHTML(mesatarja) : '<span style="color:var(--muted)">-</span>';

    return `
      <div class="semester-panel" data-semester="${semesterKey}" style="${semesterKey === 'semester1' ? '' : 'display:none'}">
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <label class="panel-title">Detyra (${detyraCount}) (30%)</label>
            <button class="collapse-toggle" data-semester="${semesterKey}"
              style="background:transparent;border:1px solid rgba(15,33,56,0.2);border-radius:6px;
              padding:4px 10px;font-size:12px;cursor:pointer;color:var(--accent);font-weight:600">
              ${detyraCount > 0 ? 'Shfaq' : 'Pa detyra'}
            </button>
          </div>

          <div class="detyra-list collapsed" id="detyraList${semesterNum}" style="display:none">
            ${semester.detyra.map((grade, idx) => `
              <div class="detyra-item">
                <span>Detyra ${idx + 1}: ${grade.toFixed(1)}</span>
                <button class="remove-detyra" data-semester="${semesterKey}" data-index="${idx}">×</button>
              </div>
            `).join('')}
          </div>

          <div style="display:flex;gap:8px;margin-top:8px">
            <input type="number" min="0" max="10" step="0.1"
              id="newDetyra${semesterNum}" placeholder="Shto notë (0-10)"
              style="flex:1;padding:6px 8px;border-radius:6px;
              border:1px solid rgba(15,33,56,0.20);background:var(--input-bg);font-size:13px" />
            <button class="btn-primary add-detyra" data-semester="${semesterKey}"
              style="padding:6px 12px;border-radius:6px;font-size:13px">Shto</button>
          </div>
        </div>

        <div class="modalRow">
          <label>Projekti (30%)
            <input type="number" min="0" max="10" step="0.1"
              class="projekti-input" data-semester="${semesterKey}"
              value="${semester.projekti !== null ? semester.projekti : ''}" />
          </label>
          <label>Testi (40%)
            <input type="number" min="0" max="10" step="0.1"
              class="testi-input" data-semester="${semesterKey}"
              value="${semester.testi !== null ? semester.testi : ''}" />
          </label>
        </div>

        <div style="margin-top:12px;padding:10px;background:rgba(39,95,207,0.1);border-radius:8px;display:flex;align-items:center;gap:8px">
          <strong style="color:var(--accent)">Mesatarja Semestri ${semesterNum}:</strong>
          <span class="semester-avg" data-semester="${semesterKey}">${avgDisplay}</span>
        </div>
      </div>
    `;
  }

  // ================================================================
  // SEMESTER TABS SETUP
  // ================================================================
  function setupSemesterTabs(student) {
    const tabs   = document.querySelectorAll('.semester-tab');
    const panels = document.querySelectorAll('.semester-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const semesterKey = tab.dataset.semester;
        panels.forEach(p => { p.style.display = p.dataset.semester === semesterKey ? 'block' : 'none'; });
        if (semesterKey === 'badges' && window.Gamification?.renderBadgesInContainer) {
          window.Gamification.renderBadgesInContainer(student.id, document.getElementById('student-modal-badges-container'));
        }
      });
    });

    // Collapse/expand
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('collapse-toggle')) {
        const semesterKey = e.target.dataset.semester;
        const semesterNum = semesterKey.replace('semester', '');
        const list = document.getElementById(`detyraList${semesterNum}`);
        if (student.semesters[semesterKey].detyra.length === 0) return;
        const isCollapsed = list.style.display === 'none';
        list.style.display = isCollapsed ? 'block' : 'none';
        e.target.textContent = isCollapsed ? 'Fsheh' : 'Shfaq';
      }
    });

    // Add detyra
    document.querySelectorAll('.add-detyra').forEach(btn => {
      btn.addEventListener('click', () => {
        const semesterKey = btn.dataset.semester;
        const semesterNum = semesterKey.replace('semester', '');
        const input = document.getElementById(`newDetyra${semesterNum}`);
        const value = parseFloat(input.value);
        if (!isNaN(value) && value >= 0 && value <= 10) {
          student.semesters[semesterKey].detyra.push(value);
          input.value = '';
          refreshSemesterDisplay(student, semesterKey);
          updateFinalAverage(student);
        }
      });
    });

    // Remove detyra
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-detyra')) {
        const semesterKey = e.target.dataset.semester;
        const index = parseInt(e.target.dataset.index);
        student.semesters[semesterKey].detyra.splice(index, 1);
        refreshSemesterDisplay(student, semesterKey);
        updateFinalAverage(student);
      }
    });

    // Projekti / testi
    document.querySelectorAll('.projekti-input, .testi-input').forEach(input => {
      input.addEventListener('input', () => {
        const semesterKey = input.dataset.semester;
        const value = parseFloat(input.value);
        const field = input.classList.contains('projekti-input') ? 'projekti' : 'testi';
        student.semesters[semesterKey][field] = !isNaN(value) ? value : null;
        updateSemesterAverage(student, semesterKey);
        updateFinalAverage(student);
      });
    });
  }

  function refreshSemesterDisplay(student, semesterKey) {
    const semesterNum = semesterKey.replace('semester', '');
    const listDiv = document.getElementById(`detyraList${semesterNum}`);
    const semester = student.semesters[semesterKey];
    const count = semester.detyra.length;

    const toggleBtn = document.querySelector(`.collapse-toggle[data-semester="${semesterKey}"]`);
    if (toggleBtn) {
      const parentLabel = toggleBtn.parentElement.querySelector('.panel-title');
      if (parentLabel) parentLabel.textContent = `Detyra (${count})`;
      toggleBtn.textContent = count > 0 ? 'Shfaq' : 'Pa detyra';
    }

    if (listDiv) {
      listDiv.innerHTML = semester.detyra.map((grade, idx) => `
        <div class="detyra-item">
          <span>Detyra ${idx + 1}: ${grade.toFixed(1)}</span>
          <button class="remove-detyra" data-semester="${semesterKey}" data-index="${idx}">×</button>
        </div>
      `).join('');
    }
    updateSemesterAverage(student, semesterKey);
  }

  // ── GRADING SYSTEM WIRED HERE ── (live update in modal)
  function updateSemesterAverage(student, semesterKey) {
    const avg     = calculateSemesterAverage(student.semesters[semesterKey]);
    const display = document.querySelector(`.semester-avg[data-semester="${semesterKey}"]`);
    if (display) {
      display.innerHTML = avg !== null ? gradeBadgeHTML(avg) : '<span style="color:var(--muted)">-</span>';
    }
  }

  // ── GRADING SYSTEM WIRED HERE ── (live update of final tag in modal)
  function updateFinalAverage(student) {
    const finalAvg = calculateFinalAverage(student.semesters);
    student.finalAverage = finalAvg;
    const tag = document.getElementById('studentOverallTag');
    if (tag) tag.innerHTML = buildFinalAverageHTML(finalAvg);
  }

  // ================================================================
  // AI GENERATION
  // ================================================================
  function setupAIGeneration(student) {
    const btn = document.getElementById('generateAiNotesBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Duke gjeneruar...';
      try {
        const aiNotes = await generateAINotes(student);
        student.aiNotes = aiNotes;
        const display = document.getElementById('aiNotesDisplay');
        if (display) display.innerHTML = aiNotes;
      } catch (error) {
        console.error('AI generation failed:', error);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Gjenero Vlerësim AI';
      }
    });
  }

  async function generateAINotes(student) {
    const prompt = buildAIPrompt(student);
    const systemPrompt = await window.Security.loadPromptSecure('teacher');
    if (!systemPrompt) throw new Error('Teacher prompt not available');
    const response = await fetch(state.api.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.api.key },
      body: JSON.stringify({
        model: state.api.model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        temperature: 0.3, max_tokens: 400
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices[0].message?.content || 'Nuk u gjet vlerësim.';
  }

  function buildAIPrompt(student) {
    const gs = window.getGradingSystem?.();
    const gsName = gs ? gs.name : 'Albanian 1-10';
    const sem1Avg = calculateSemesterAverage(student.semesters.semester1);
    const sem2Avg = calculateSemesterAverage(student.semesters.semester2);
    const sem3Avg = calculateSemesterAverage(student.semesters.semester3);
    const finalAvg = student.finalAverage;

    const fmtAvg = (raw) => {
      if (raw === null) return 'Pa nota';
      const gd = displayGrade(raw);
      return `${gd.text} (${gd.label || '-'})`;
    };

    let prompt = `Vlerëso nxënësin. Fillo DIREKT pa hyrje.\n\n`;
    prompt += `Emri: ${student.name}\nKlasa: ${student.gradeLevel || 'Pa specifikuar'}\n`;
    prompt += `Sistemi i notimit: ${gsName}\n\n`;
    prompt += `PERFORMANCA:\n`;
    prompt += `- Semestri 1: ${fmtAvg(sem1Avg)} (${student.semesters.semester1.detyra.length} detyra)\n`;
    prompt += `- Semestri 2: ${fmtAvg(sem2Avg)} (${student.semesters.semester2.detyra.length} detyra)\n`;
    prompt += `- Semestri 3: ${fmtAvg(sem3Avg)} (${student.semesters.semester3.detyra.length} detyra)\n`;
    prompt += `- Mesatarja Finale: ${fmtAvg(finalAvg)}\n\n`;
    if (student.teacherNotes?.trim()) prompt += `SHËNIME TË MËSUESIT:\n${student.teacherNotes}\n\n`;
    prompt += `Jep vlerësim të shkurtër (2-4 fjali): pikat e forta, zonat për përmirësim, sugjerime.`;
    return prompt;
  }

  // ================================================================
  // SAVE STUDENT
  // ================================================================
  async function saveStudent(student) {
    const fn = (document.getElementById('studentFirstNameInput').value || '').trim();
    const ln = (document.getElementById('studentLastNameInput').value || '').trim();
    student.firstName = fn;
    student.lastName  = ln;
    student.name      = (fn + ' ' + ln).trim() || student.name;
    const gl = document.getElementById('studentGradeLevelInput').value;
    student.gradeLevel   = gl ? parseInt(gl, 10) : null;
    student.teacherCode  = (document.getElementById('studentTeacherCode').value || '').trim();
    student.teacherNotes = document.getElementById('teacherNotesArea').value || '';
    await saveStudentToBackend(student);
    renderStudents();
    closeStudentModal();
  }

  function closeStudentModal() {
    studentModalOverlay.style.display = 'none';
    state.students.selectedId = null;
  }

  if (studentModalOverlay) {
    studentModalOverlay.addEventListener('click', e => {
      if (e.target === studentModalOverlay) closeStudentModal();
    });
  }

  // ================================================================
  // PENDING STUDENTS NOTIFICATIONS
  // ================================================================
  function renderTeacherNotifications() {
    if (!state.ui.teacherMode) return;
    const currentTeacherId = state.ui.teacherId;
    const pending = state.students.list.filter(s => {
      if (s.status !== 'pending') return false;
      if (currentTeacherId && s.teacherCode && s.teacherCode !== currentTeacherId) return false;
      return true;
    });
    const container = document.getElementById('teacherToolsSection');
    if (!container) return;
    let notifBtn = document.getElementById('pendingNotifBtn');
    if (pending.length === 0) { if (notifBtn) notifBtn.remove(); return; }
    if (!notifBtn) {
      notifBtn = document.createElement('div');
      notifBtn.id = 'pendingNotifBtn';
      notifBtn.style.cssText = 'padding:10px;text-align:center;cursor:pointer;margin-top:10px';
      const ref = container.querySelector('.gradeSelect');
      if (ref) ref.parentNode.insertBefore(notifBtn, ref);
      else container.appendChild(notifBtn);
      notifBtn.addEventListener('click', showPendingModal);
    }
    notifBtn.innerHTML = `<div style="background:var(--error);color:white;border-radius:8px;padding:8px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px"><span>🔔</span> ${pending.length} Kërkesa për Regjistrim</div>`;
  }

  function showPendingModal() {
    const currentTeacherId = state.ui.teacherId;
    const pending = state.students.list.filter(s => {
      if (s.status !== 'pending') return false;
      if (currentTeacherId && s.teacherCode && s.teacherCode !== currentTeacherId) return false;
      return true;
    });
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'z-index:1000;display:flex';
    modal.innerHTML = `
      <div class="modal gamification-modal" style="width:500px;max-width:98vw">
        <h3 style="color:var(--accent)">Kërkesa në Pritje</h3>
        <p class="smallNote">Nxënësit që presin miratimin.</p>
        <div style="max-height:400px;overflow-y:auto;border:1px solid rgba(0,0,0,0.1);border-radius:8px;margin:12px 0">
          ${pending.map(s => `
            <div style="padding:12px;border-bottom:1px solid rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center;background:var(--bg)">
              <div>
                <div style="font-weight:700">${s.name}</div>
                <div style="font-size:12px;color:var(--muted)">Kërkon: Klasa ${s.gradeLevel}</div>
                ${s.teacherCode ? `<div style="font-size:11px;color:var(--accent)">Kodi: ${s.teacherCode}</div>` : ''}
              </div>
              <div style="display:flex;gap:8px">
                <button class="approve-btn" data-id="${s.id}" style="padding:6px 12px;border-radius:6px;border:none;background:#10b981;color:white;cursor:pointer">✅ Prano</button>
                <button class="deny-btn"    data-id="${s.id}" style="padding:6px 12px;border-radius:6px;border:none;background:#ef4444;color:white;cursor:pointer">❌ Refuzo</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="text-align:right"><button id="closePending" class="btn-secondary">Mbyll</button></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#closePending').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = state.students.list.find(x => x.id === parseInt(btn.dataset.id));
        if (s) { s.status = 'active'; renderStudents(); buildGradeButtons(); renderTeacherNotifications(); modal.remove(); }
      });
    });
    modal.querySelectorAll('.deny-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.students.list = state.students.list.filter(x => x.id !== parseInt(btn.dataset.id));
        renderTeacherNotifications(); modal.remove();
      });
    });
  }

  setTimeout(renderTeacherNotifications, 1500);

  // ================================================================
  // STUDENT REGISTRATION (Join button)
  // ================================================================
  function promptStudentRegistration() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'z-index:1000;display:flex';
    modal.innerHTML = `
      <div class="modal gamification-modal" style="width:400px;max-width:95vw">
        <h3 style="margin:0 0 16px;color:var(--accent);text-align:center">🆔 Pasaporta e Studentit</h3>
        <div class="modalRow"><label>Emri<input type="text" id="regFirstName" placeholder="Emri yt..." /></label></div>
        <div class="modalRow"><label>Mbiemri<input type="text" id="regLastName" placeholder="Mbiemri..." /></label></div>
        <div class="modalRow"><label>Klasa
          <select id="regGrade">${Array.from({length:12},(_,i)=>`<option value="${i+1}">Klasa ${i+1}</option>`).join('')}</select>
        </label></div>
        <div class="modalRow"><label>Kodi i Mësuesit (Opsionale)<input type="text" id="regTeacherCode" placeholder="p.sh. MESUESI_1" />
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Kërkojini kodin mësuesit tuaj nëse jeni në klasë specifike.</div>
        </label></div>
        <div style="margin-top:20px;display:flex;gap:10px">
          <button id="cancelReg" class="btn-secondary" style="flex:1">Anulo</button>
          <button id="confirmReg" class="btn-primary" style="flex:1">Regjistrohu</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.querySelector('#regFirstName').focus(), 100);
    modal.querySelector('#cancelReg').addEventListener('click', () => modal.remove());
    modal.querySelector('#confirmReg').addEventListener('click', () => {
      const fn    = modal.querySelector('#regFirstName').value.trim();
      const ln    = modal.querySelector('#regLastName').value.trim();
      const grade = parseInt(modal.querySelector('#regGrade').value);
      const code  = modal.querySelector('#regTeacherCode').value.trim();
      if (!fn || !ln) { window.Dialog ? window.Dialog.alert('Ju lutem plotësoni emrin dhe mbiemrin.') : alert('Ju lutem plotësoni emrin dhe mbiemrin.'); return; }
      const newStudent = {
        id: Date.now(), name: `${fn} ${ln}`, firstName: fn, lastName: ln,
        gradeLevel: grade, teacherCode: code, status: 'pending',
        semesters: {
          semester1: { detyra: [], projekti: null, testi: null, mesatarja: null },
          semester2: { detyra: [], projekti: null, testi: null, mesatarja: null },
          semester3: { detyra: [], projekti: null, testi: null, mesatarja: null }
        },
        teacherNotes: '', aiNotes: '', finalAverage: null
      };
      state.students.list.push(newStudent);
      if (code && window.Connectivity) window.Connectivity.sendRegistration(code, newStudent);
      if (window.renderTeacherNotifications) window.renderTeacherNotifications();
      modal.remove();
      (window.Dialog ? window.Dialog.alert : alert)(`Kërkesa u dërgua! Prisni që mësuesi të pranojë regjistrimin tuaj në Klasën ${grade}.`);
    });
  }

  document.addEventListener('click', e => {
    if (e.target.closest('#joinClassBtn')) promptStudentRegistration();
  });

  // ================================================================
  // SUBJECT SWITCH HANDLER
  // ================================================================
  window.addEventListener('subjectSwitched', (e) => {
    const subjectId = e.detail;
    const subject   = window.Subjects ? window.Subjects.getActive() : null;
    if (!subject || !state.ui.teacherMode) return;

    // Rebuild chapter list from RAG for the new subject
    if (state.academic.activeGrade) {
      state.academic.activeChapter = null;
      state.academic.focusInstruction = null;
      if (selectedFocus) selectedFocus.textContent = '(select a topic)';
      buildChapterList(state.academic.activeGrade);
    }

    updateSubjectIndicator(subject);
  });

  // Also rebuild chapters when curriculum changes
  window.addEventListener('curriculumChanged', () => {
    if (state.ui.teacherMode && state.academic.activeGrade) {
      state.academic.activeChapter = null;
      state.academic.focusInstruction = null;
      if (selectedFocus) selectedFocus.textContent = '(select a topic)';
      buildChapterList(state.academic.activeGrade);
    }
  });

  function updateSubjectIndicator(subject) {
    let indicator = document.getElementById('currentSubjectIndicator');
    const panel   = document.getElementById('teacherToolsSection');
    if (!panel) return;
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'currentSubjectIndicator';
      indicator.style.cssText = 'padding:8px 12px;margin-bottom:8px;border-radius:8px;font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px;color:white';
      panel.insertBefore(indicator, panel.firstChild);
    }
    indicator.style.background = subject.color || 'var(--accent)';
    indicator.innerHTML = `<span style="font-size:18px">${subject.emoji || '📚'}</span><span>${subject.label}</span><span style="opacity:0.8;font-size:11px;margin-left:auto">${(subject.lang || 'SQ').toUpperCase()}</span>`;
  }

  window.addEventListener('teacherModeUnlocked', () => {
    const subject = window.Subjects ? window.Subjects.getActive() : null;
    if (subject) setTimeout(() => updateSubjectIndicator(subject), 100);
  });

  // ================================================================
  // EXPORTS
  // ================================================================
  window.buildGradeButtons         = buildGradeButtons;
  window.renderStudents            = renderStudents;
  window.openStudentModal          = openStudentModal;
  window.persistStudentLogin       = persistStudentLogin;
  window.promptStudentRegistration = promptStudentRegistration;
  window.renderTeacherNotifications = renderTeacherNotifications;

  window.getStudentContext = function (studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return null;
    initializeStudentStructure(student);
    return { name: student.name, grade: student.gradeLevel, semesters: student.semesters, teacherNotes: student.teacherNotes, aiNotes: student.aiNotes, finalAverage: student.finalAverage };
  };

  console.log('✅ Students module initialized — grading system wired');
})();
