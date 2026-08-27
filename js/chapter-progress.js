// js/chapter-progress.js
// ===================================================================
// TEACHER SYLLABUS & CHAPTER PROGRESS TRACKER
// Tracks which chapters are completed, currently active, or upcoming.
// Allows the AI to know what the class has mastered and what comes next.
// ===================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'eduai_chapter_progress';

  // Default syllabus structures by subject & grade
  const DEFAULT_SYLLABUS = {
    'matematike_g10': [
      { id: 'ch_1', title: 'Kapitulli 1: Bashkësitë & Numrat Realë', status: 'completed' },
      { id: 'ch_2', title: 'Kapitulli 2: Ekuacionet & Inekuacionet Lineare', status: 'completed' },
      { id: 'ch_3', title: 'Kapitulli 3: Funksioni dhe Ekuacioni Kuadratik', status: 'current' },
      { id: 'ch_4', title: 'Kapitulli 4: Trigonometria në Trekëndësh', status: 'upcoming' },
      { id: 'ch_5', title: 'Kapitulli 5: Vektorët dhe Gjeometria Analitike', status: 'upcoming' }
    ],
    'fizike_g10': [
      { id: 'ch_1', title: 'Kapitulli 1: Kinematika & Lëvizja Njëtrajtshme', status: 'completed' },
      { id: 'ch_2', title: 'Kapitulli 2: Ligjet e Njutonit & Forcat', status: 'current' },
      { id: 'ch_3', title: 'Kapitulli 3: Puna, Energjia & Fuqia', status: 'upcoming' },
      { id: 'ch_4', title: 'Kapitulli 4: Graviteti & Lëvizja Rrethore', status: 'upcoming' }
    ],
    'biologji_g10': [
      { id: 'ch_1', title: 'Kapitulli 1: Qeliza dhe Organelet Qelizore', status: 'completed' },
      { id: 'ch_2', title: 'Kapitulli 2: Transkriptimi & Sinteza e Proteinave', status: 'current' },
      { id: 'ch_3', title: 'Kapitulli 3: Trashëgimia & Ligjet e Mendelit', status: 'upcoming' }
    ],
    'kimia_g10': [
      { id: 'ch_1', title: 'Kapitulli 1: Struktura Atomike & Tabela Periodike', status: 'completed' },
      { id: 'ch_2', title: 'Kapitulli 2: Lidhjet Kimike (Kovalente & Jonike)', status: 'current' },
      { id: 'ch_3', title: 'Kapitulli 3: Stekiometria & Barazimi i Reaksioneve', status: 'upcoming' }
    ]
  };

  function loadProgressStore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { ...DEFAULT_SYLLABUS };
    } catch {
      return { ...DEFAULT_SYLLABUS };
    }
  }

  function saveProgressStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getSyllabusKey(subjectId, grade) {
    return `${subjectId || 'matematike'}_g${grade || 10}`;
  }

  function getChapters(subjectId, grade) {
    const key = getSyllabusKey(subjectId, grade);
    const store = loadProgressStore();
    return store[key] || [
      { id: 'ch_1', title: 'Kapitulli 1: Hyrje & Konceptet Themelore', status: 'completed' },
      { id: 'ch_2', title: 'Kapitulli 2: Aplikimi Praktik & Ushtrime', status: 'current' },
      { id: 'ch_3', title: 'Kapitulli 3: Temat e Avancuara & Provimi', status: 'upcoming' }
    ];
  }

  function updateChapterStatus(subjectId, grade, chapterId, newStatus) {
    const key = getSyllabusKey(subjectId, grade);
    const store = loadProgressStore();
    let list = store[key] || getChapters(subjectId, grade);

    list = list.map(ch => {
      if (ch.id === chapterId) {
        return { ...ch, status: newStatus };
      }
      // If setting a chapter as 'current', other current chapters become completed
      if (newStatus === 'current' && ch.status === 'current') {
        return { ...ch, status: 'completed' };
      }
      return ch;
    });

    store[key] = list;
    saveProgressStore(store);

    if (window.Toast?.success) {
      window.Toast.success('📘 Progresi i kapitujve u përditësua!');
    }
    return list;
  }

  // ----------------------------------------------------------------
  // AI CONTEXT INJECTION HELPER
  // ----------------------------------------------------------------
  function getSyllabusAIContext(subjectId, grade) {
    const chapters = getChapters(subjectId, grade);
    const completed = chapters.filter(c => c.status === 'completed').map(c => c.title);
    const current = chapters.find(c => c.status === 'current');
    const upcoming = chapters.find(c => c.status === 'upcoming');

    let ctx = '\n[SYLLABUS PROGRESS CONTEXT]\n';
    if (completed.length > 0) {
      ctx += `• KAPITUJT E PËRFUNDUAR (Nxënësit i njohin këto koncepte): ${completed.join('; ')}\n`;
    }
    if (current) {
      ctx += `• KAPITULLI AKTIV NË KLASË: ${current.title} (Fokusohu këtu)\n`;
    }
    if (upcoming) {
      ctx += `• KAPITULLI I ARDHSHËM: ${upcoming.title}\n`;
    }
    ctx += '[END SYLLABUS CONTEXT]\n';
    return ctx;
  }

  // ----------------------------------------------------------------
  // TEACHER SYLLABUS MODAL UI
  // ----------------------------------------------------------------
  function openSyllabusManager(subjectId = 'matematike', grade = 10) {
    document.getElementById('syllabusManagerOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'syllabusManagerOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);align-items:center;justify-content:center;z-index:5500;';

    overlay.innerHTML = `
      <div class="modal" style="width:680px;max-width:94vw;background:var(--card-bg, #1e293b);border-radius:16px;border:1px solid var(--border);box-shadow:0 24px 60px rgba(0,0,0,0.4);overflow:hidden;display:flex;flex-direction:column">
        <div style="padding:18px 24px;background:var(--nav-bg, #0f172a);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">📋</span>
            <div>
              <h3 style="margin:0;font-size:16.5px;font-weight:700;color:var(--text)">Menaxheri i Progresit të Kapitujve</h3>
              <div style="font-size:12px;color:var(--text-muted)">Përcakto çfarë është përfunduar që AI të dijë nivelin e klasës</div>
            </div>
          </div>
          <button id="closeSyllabusModalBtn" class="school-os-close-btn" style="cursor:pointer;background:none;border:none;color:var(--text);font-size:20px">&times;</button>
        </div>

        <div style="padding:20px;display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto" id="syllabusChaptersList"></div>

        <div style="padding:14px 20px;background:var(--nav-bg, #0f172a);border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:12px;color:var(--text-muted)">Ndyshimet reflektohen menjëherë në përgjigjet e AI.</div>
          <button id="syllabusSaveDoneBtn" class="os-btn-primary" style="padding:8px 18px;font-weight:700;font-size:13px">Përfundo</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    function render() {
      const listEl = document.getElementById('syllabusChaptersList');
      if (!listEl) return;
      const chapters = getChapters(subjectId, grade);

      listEl.innerHTML = chapters.map(ch => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:12px;background:${
          ch.status === 'completed' ? 'rgba(16,185,129,0.08)' : ch.status === 'current' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)'
        };border:1px solid ${
          ch.status === 'completed' ? 'rgba(16,185,129,0.3)' : ch.status === 'current' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'
        }">
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--text)">${ch.title}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">
              ${ch.status === 'completed' ? '✅ Përfunduar (Nxënësit e dinë)' : ch.status === 'current' ? '⚡ Aktiv (Po mësohet tani)' : '⏳ I Ardhshëm'}
            </div>
          </div>

          <div style="display:flex;gap:6px">
            <button class="status-btn ${ch.status === 'completed' ? 'active' : ''}" data-id="${ch.id}" data-status="completed" style="padding:4px 10px;font-size:11.5px;border-radius:6px;cursor:pointer;background:${ch.status === 'completed' ? '#10b981' : 'rgba(255,255,255,0.08)'};color:white;border:none">Përfunduar</button>
            <button class="status-btn ${ch.status === 'current' ? 'active' : ''}" data-id="${ch.id}" data-status="current" style="padding:4px 10px;font-size:11.5px;border-radius:6px;cursor:pointer;background:${ch.status === 'current' ? '#6366f1' : 'rgba(255,255,255,0.08)'};color:white;border:none">Aktiv</button>
            <button class="status-btn ${ch.status === 'upcoming' ? 'active' : ''}" data-id="${ch.id}" data-status="upcoming" style="padding:4px 10px;font-size:11.5px;border-radius:6px;cursor:pointer;background:${ch.status === 'upcoming' ? '#f59e0b' : 'rgba(255,255,255,0.08)'};color:white;border:none">I Ardhshëm</button>
          </div>
        </div>
      `).join('');

      listEl.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          updateChapterStatus(subjectId, grade, btn.dataset.id, btn.dataset.status);
          render();
        });
      });
    }

    render();

    document.getElementById('closeSyllabusModalBtn')?.addEventListener('click', () => overlay.remove());
    document.getElementById('syllabusSaveDoneBtn')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // Export
  window.ChapterProgress = {
    getChapters,
    updateChapterStatus,
    getSyllabusAIContext,
    openSyllabusManager
  };

  console.log('✅ Teacher Syllabus & Chapter Progress module loaded');
})();
