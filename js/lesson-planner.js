// js/lesson-planner.js
// ===================================================================
// TEACHER 45-MIN LESSON PLANNER & 1-CLICK EXAM GENERATOR STUDIO
// Standardized 5-phase lesson plans + Rubric-aligned exam generators
// ===================================================================

(function () {
  'use strict';

  function generateLessonPlan(subject, grade, topic) {
    const s = subject || 'Matematikë';
    const g = grade || 10;
    const t = topic || 'Ekuacionet Kuadratike';

    return {
      title: `Plan Mësimor 45-Minuta: ${t}`,
      meta: { subject: s, grade: g, topic: t, durationMin: 45 },
      phases: [
        {
          phase: '1. Rikujtimi & Nxemja e Kujtesës',
          time: '00 - 05 min',
          goal: 'Aktivizimi i njohurive nga kapitulli i mëparshëm.',
          activities: [
            '2 pyetje të shpejta nga mësimi i kaluar.',
            'Nxënësit shkruajnë përgjigjen në fletore pa ndihmë.'
          ]
        },
        {
          phase: '2. Prezantimi & Demonstrimi Konceptual',
          time: '05 - 15 min',
          goal: 'Shpjegimi i parimit kryesor dhe formulës themelore.',
          activities: [
            `Shpjegimi i konceptit qendror për ${t}.`,
            'Zgjidhja e një shembulli model në tabelë me demonstrim hap pas hapi.'
          ]
        },
        {
          phase: '3. Eksperimentimi & Hetimi i Udhëhequr',
          time: '15 - 30 min',
          goal: 'Zbatimi i koncepteve në simulatorët interaktivë të EduAI.',
          activities: [
            'Nxënësit hapin laboratorin përkatës në EduAI (Circuit Lab / Grapher / Chemistry Balancer).',
            'Ndryshimi i parametrave dhe vëzhgimi i rezultateve në çift.'
          ]
        },
        {
          phase: '4. Praktika e Pavarur & Pyetjet Sokratike',
          time: '30 - 40 min',
          goal: 'Zgjidhje problemash dhe zbulim keqkuptimesh.',
          activities: [
            'Punë individuale me 2 ushtrime të niveleve të ndryshme vështirësie.',
            'Mësuesi kalon pranë nxënësve duke bërë pyetje Sokratike pa dhënë përgjigjen gati.'
          ]
        },
        {
          phase: '5. Bileta e Daljes (Exit Ticket) & Detyra',
          time: '40 - 45 min',
          goal: 'Vlerësim formues i menjëhershëm para përfundimit të orës.',
          activities: [
            'Nxënësit dorëzojnë 1 ushtrim përmbledhës 2-minutësh.',
            'Caktimi i detyrës së shtëpisë në portalin e EduAI.'
          ]
        }
      ]
    };
  }

  function generateExam(subject, grade, topic) {
    const s = subject || 'Fizikë';
    const g = grade || 10;
    const t = topic || 'Ligjet e Njutonit dhe Qarqet';

    return {
      title: `Provim / Test Kontrolli: ${t}`,
      meta: { subject: s, grade: g, topic: t, totalPoints: 100 },
      sections: [
        {
          name: 'Pjesa I: Pyetje me Zgjedhje të Shumëfishtë (20 Pikë)',
          questions: [
            { num: 1, text: `Cila është njësia matëse standarde e forcës në SI?`, options: ['A) Xhul (J)', 'B) Njuton (N)', 'C) Vat (W)', 'D) Paskal (Pa)'], correct: 'B) Njuton (N)' },
            { num: 2, text: `Sipas Ligjit të Ohmit (V = I · R), nëse rezistenca dyfishohet dhe tensioni mbetet i pandryshuar, rryma elektrike:`, options: ['A) Dyfishohet', 'B) Katërfishohet', 'C) Përgjysmohet', 'D) Mbetet e njëjtë'], correct: 'C) Përgjysmohet' }
          ]
        },
        {
          name: 'Pjesa II: Përgjigje të Shkurtra & Koncepte (40 Pikë)',
          questions: [
            { num: 3, text: 'Përkufizoni Ligjin e Dytë të Njutonit dhe shkruani formulën e tij matematike.', answer: 'Nxitimi i trupit është në përpjesëtim të drejtë me forcën rezultante (F = m · a).' },
            { num: 4, text: 'Shpjegoni dallimin themelor midis masës (kg) dhe peshës (N) të një trupi.', answer: 'Masa është sasia e lëndës (e pandryshueshme), ndërsa pesha është forca me të cilën Toka e tërheq trupin (P = m · g).' }
          ]
        },
        {
          name: 'Pjesa III: Zgjidhje Problemi me Hapa Formalë (40 Pikë)',
          questions: [
            { num: 5, text: 'Një trup me masë m = 5 kg lëviz me nxitim a = 3 m/s². Llogaritni forcën rezultante dhe distancën e përshkuar pas t = 4 sekondash duke nisur nga prehja.', answer: '1) F = m · a = 5 · 3 = 15 N.\n2) s = 0.5 · a · t² = 0.5 · 3 · 16 = 24 metra.' }
          ]
        }
      ]
    };
  }

  // ----------------------------------------------------------------
  // UI MODAL
  // ----------------------------------------------------------------
  function openStudio() {
    document.getElementById('lessonPlannerOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lessonPlannerOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);align-items:center;justify-content:center;z-index:5500;';

    overlay.innerHTML = `
      <div class="modal" style="width:900px;max-width:96vw;max-height:92vh;background:var(--card-bg, #1e293b);border-radius:18px;border:1px solid var(--border);box-shadow:0 28px 64px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:18px 24px;background:var(--nav-bg, #0f172a);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">📋</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:700;color:var(--text)">Studio e Mësimdhënies & Gjeneratori i Testeve</h3>
              <div style="font-size:12px;color:var(--text-muted)">Plani mësimor 45-minutësh dhe teste kontrolli me çelës përgjigjesh</div>
            </div>
          </div>
          <button id="closePlannerModalBtn" class="school-os-close-btn" style="cursor:pointer;background:none;border:none;color:var(--text);font-size:22px">&times;</button>
        </div>

        <div style="padding:18px 24px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <input type="text" id="plannerTopicInput" placeholder="Tema e mësimit (p.sh. Ligji i Ohmit, Qelizat)..." style="flex:1;min-width:200px;padding:9px 14px;border-radius:8px;border:1px solid var(--border);background:rgba(0,0,0,0.2);color:var(--text);font-size:13px" value="Ligjet e Njutonit dhe Dinamika" />
          <select id="plannerGradeSelect" style="padding:9px 12px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg, #1e293b);color:var(--text);font-size:13px">
            <option value="9">Klasa 9</option>
            <option value="10" selected>Klasa 10</option>
            <option value="11">Klasa 11</option>
            <option value="12">Klasa 12 (Maturë)</option>
          </select>
          <button id="btnGenPlan" class="os-btn-primary" style="padding:9px 16px;font-size:13px;font-weight:700">⚡ Gjenero Plan 45-Min</button>
          <button id="btnGenExam" class="os-btn-secondary" style="padding:9px 16px;font-size:13px;font-weight:700">📝 Gjenero Test Kontrolli</button>
        </div>

        <div style="padding:24px;flex:1;overflow-y:auto" id="plannerOutputArea"></div>

        <div style="padding:14px 24px;background:var(--nav-bg, #0f172a);border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <button id="plannerPushToCalendarBtn" class="os-btn-secondary" style="font-size:12.5px;padding:7px 14px">📅 Shto në Kalendarin e Studimit</button>
          <button id="plannerPrintBtn" class="os-btn-primary" style="font-size:12.5px;padding:7px 18px;font-weight:700">🖨️ Printo / Eksporto</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let currentOutput = null;

    function renderPlan() {
      const topic = document.getElementById('plannerTopicInput')?.value || 'Mësimi';
      const grade = document.getElementById('plannerGradeSelect')?.value || 10;
      const plan = generateLessonPlan('Fizikë', grade, topic);
      currentOutput = { type: 'plan', data: plan };

      const outEl = document.getElementById('plannerOutputArea');
      if (!outEl) return;

      outEl.innerHTML = `
        <div style="padding:20px;border-radius:14px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2)">
          <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:var(--text)">${plan.title}</h2>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:18px">Struktura zyrtare 45-minutëshe me faza pedagogjike dhe vlerësim formues.</div>

          <div style="display:flex;flex-direction:column;gap:12px">
            ${plan.phases.map(p => `
              <div style="padding:14px;border-radius:10px;background:rgba(0,0,0,0.25);border-left:4px solid #6366f1">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-weight:800;font-size:14px;color:var(--text)">${p.phase}</span>
                  <span style="font-size:12px;font-weight:700;color:#6366f1;background:rgba(99,102,241,0.15);padding:3px 8px;border-radius:6px">${p.time}</span>
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin:6px 0">${p.goal}</div>
                <ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--text)">
                  ${p.activities.map(a => `<li style="margin-bottom:3px">${a}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function renderExam() {
      const topic = document.getElementById('plannerTopicInput')?.value || 'Testi';
      const grade = document.getElementById('plannerGradeSelect')?.value || 10;
      const exam = generateExam('Fizikë', grade, topic);
      currentOutput = { type: 'exam', data: exam };

      const outEl = document.getElementById('plannerOutputArea');
      if (!outEl) return;

      outEl.innerHTML = `
        <div style="padding:20px;border-radius:14px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:800;color:var(--text)">${exam.title}</h2>
              <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Klasa ${exam.meta.grade} · Totali: ${exam.meta.totalPoints} Pikë</div>
            </div>
            <span style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;background:rgba(16,185,129,0.15);color:#10b981">Gati për Printim</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px">
            ${exam.sections.map(sec => `
              <div>
                <h4 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#10b981">${sec.name}</h4>
                <div style="display:flex;flex-direction:column;gap:10px">
                  ${sec.questions.map(q => `
                    <div style="padding:12px 14px;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05)">
                      <div style="font-weight:600;font-size:13px;color:var(--text);margin-bottom:6px">${q.num}. ${q.text}</div>
                      ${q.options ? `
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
                          ${q.options.map(opt => `<div style="font-size:12px;color:var(--text-muted);padding:4px 8px;border-radius:4px;background:rgba(255,255,255,0.04)">${opt}</div>`).join('')}
                        </div>
                      ` : ''}
                      <div style="font-size:11.5px;color:#10b981;background:rgba(16,185,129,0.1);padding:4px 8px;border-radius:4px;margin-top:6px">
                        <strong>Çelësi i Përgjigjes:</strong> ${q.correct || q.answer}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    renderPlan();

    document.getElementById('btnGenPlan')?.addEventListener('click', renderPlan);
    document.getElementById('btnGenExam')?.addEventListener('click', renderExam);
    document.getElementById('closePlannerModalBtn')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('plannerPushToCalendarBtn')?.addEventListener('click', () => {
      if (window.StudyCalendar) {
        const title = currentOutput?.data?.title || 'Mësimi';
        const now = new Date();
        const events = window.StudyCalendar.getEvents ? window.StudyCalendar.getEvents() : [];
        events.push({
          date: now,
          title,
          type: currentOutput?.type === 'exam' ? 'exam' : 'class',
          time: '09:00',
          desc: 'Plani i gjeneruar nga Studio e Mësimdhënies'
        });
        if (window.StudyCalendar.setEvents) window.StudyCalendar.setEvents(events);
        if (window.Toast?.success) window.Toast.success('📅 Plani u shtua në Kalendarin e Studimit!');
      }
    });

    document.getElementById('plannerPrintBtn')?.addEventListener('click', () => {
      window.print();
    });
  }

  // Export
  window.LessonPlanner = {
    generateLessonPlan,
    generateExam,
    openStudio
  };

  console.log('✅ Teacher Lesson Planner & Exam Studio loaded');
})();
