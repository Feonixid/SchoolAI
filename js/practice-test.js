// js/practice-test.js
// ===================================================================
// AI-GENERATED PRACTICE TESTS
// Uses curriculum RAG data to generate quizzes from the active chapter
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // GENERATE TEST FROM RAG DATA
  // ----------------------------------------------------------------
  async function generateFromRAG(options = {}) {
    const grade = options.grade || state.academic?.activeGrade;
    const subjectId = options.subjectId || state.subject?.activeId;
    const curriculum = options.curriculum || window.CurriculumRAG?.activeCurriculum || 'albanian';
    const questionCount = options.count || 10;
    const difficulty = options.difficulty || state.ui?.difficulty || 'intermediate';

    if (!grade || !subjectId) {
      window.Toast?.error('Select a grade and subject first.');
      return null;
    }

    // Map subject IDs to RAG keys
    const subjectMap = {
      'matematike': 'math',
      'fizike': 'physics',
      'ekonomi': 'economics',
      'biologji': 'biology',
      'kimia': 'chemistry',
      'kimi': 'chemistry',
      'histori': 'history',
      'shqip': 'albanian',
      'anglisht': 'english',
      'coding': 'coding',
      'cyber': 'cyber',
      'german': 'german',
      'french': 'french',
      'spanish': 'spanish'
    };
    const ragSubject = subjectMap[subjectId] || subjectId;

    // Try to load RAG pack
    let pack = null;
    if (window.CurriculumRAG && grade >= 9 && grade <= 12) {
      try {
        pack = await window.CurriculumRAG.loadPack(grade, ragSubject, curriculum);
      } catch (e) { console.warn('Could not load RAG for test generation:', e); }
    }

    // Build test questions from RAG data
    const questions = [];

    if (pack && pack.units) {
      // Focus on active chapter if set
      const focusUnit = state.academic?.activeChapter?.title;
      const units = focusUnit
        ? pack.units.filter(u => u.title === focusUnit || u.topics?.some(t => t.title === focusUnit))
        : pack.units;

      const allTopics = [];
      units.forEach(unit => {
        if (unit.topics) {
          unit.topics.forEach(topic => {
            allTopics.push({ unit: unit.title, ...topic });
          });
        }
      });

      // Shuffle topics
      const shuffled = allTopics.sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(questionCount, shuffled.length * 2); i++) {
        const topic = shuffled[i % shuffled.length];
        const qType = pickQuestionType(topic, difficulty);
        const question = generateQuestion(topic, qType, difficulty);
        if (question) questions.push(question);
      }
    }

    // Fallback: generate generic questions if RAG not available
    if (questions.length === 0) {
      for (let i = 0; i < questionCount; i++) {
        questions.push({
          type: 'open',
          text: `Question ${i + 1}: Write about a key concept from this subject at grade ${grade} level.`,
          options: null,
          correctAnswer: null,
          topic: 'General',
          difficulty: difficulty
        });
      }
    }

    return {
      title: `Practice Test — ${ragSubject} Grade ${grade}`,
      subject: ragSubject,
      grade: grade,
      curriculum: curriculum,
      difficulty: difficulty,
      questions: questions.slice(0, questionCount),
      generatedAt: Date.now()
    };
  }

  // ----------------------------------------------------------------
  // QUESTION GENERATORS
  // ----------------------------------------------------------------
  function pickQuestionType(topic, difficulty) {
    const types = [];

    if (topic.concepts?.length) types.push('define', 'define', 'mcq_concept');
    if (topic.keyFormulas?.length) types.push('formula', 'formula', 'apply_formula');
    if (topic.keyFacts?.length) types.push('true_false', 'mcq_fact', 'fill_blank');
    if (topic.procedures?.length) types.push('sequence', 'explain_procedure');
    if (topic.definitions) types.push('define', 'mcq_definition');

    if (types.length === 0) types.push('open');

    return types[Math.floor(Math.random() * types.length)];
  }

  function generateQuestion(topic, type, difficulty) {
    switch (type) {
      case 'define': {
        if (topic.concepts?.length) {
          const concept = topic.concepts[Math.floor(Math.random() * topic.concepts.length)];
          return {
            type: 'open',
            text: `Define "${concept}" and explain its significance in ${topic.title}.`,
            options: null,
            correctAnswer: null,
            topic: topic.title,
            difficulty
          };
        }
        if (topic.definitions) {
          const terms = Object.keys(topic.definitions);
          const term = terms[Math.floor(Math.random() * terms.length)];
          return {
            type: 'open',
            text: `Define "${term}".`,
            options: null,
            correctAnswer: topic.definitions[term],
            topic: topic.title,
            difficulty
          };
        }
        return null;
      }

      case 'mcq_concept': {
        if (!topic.concepts || topic.concepts.length < 2) return null;
        const correct = topic.concepts[Math.floor(Math.random() * topic.concepts.length)];
        const distractors = topic.concepts.filter(c => c !== correct).slice(0, 3);
        while (distractors.length < 3) distractors.push('None of the above');

        const options = [...distractors, correct].sort(() => Math.random() - 0.5);
        return {
          type: 'mcq',
          text: `Which of the following is a key concept in ${topic.title}?`,
          options: options,
          correctAnswer: correct,
          topic: topic.title,
          difficulty
        };
      }

      case 'mcq_fact': {
        if (!topic.keyFacts || topic.keyFacts.length < 1) return null;
        const fact = topic.keyFacts[Math.floor(Math.random() * topic.keyFacts.length)];
        return {
          type: 'open',
          text: `Explain: ${fact}`,
          options: null,
          correctAnswer: null,
          topic: topic.title,
          difficulty
        };
      }

      case 'mcq_definition': {
        if (!topic.definitions) return null;
        const terms = Object.entries(topic.definitions);
        if (terms.length < 2) return null;

        const [correctTerm, correctDef] = terms[Math.floor(Math.random() * terms.length)];
        const wrongDefs = terms.filter(([t]) => t !== correctTerm).map(([, d]) => d).slice(0, 3);
        while (wrongDefs.length < 3) wrongDefs.push('Not defined in this unit');

        const options = [...wrongDefs, correctDef].sort(() => Math.random() - 0.5);
        return {
          type: 'mcq',
          text: `What is the correct definition of "${correctTerm}"?`,
          options: options,
          correctAnswer: correctDef,
          topic: topic.title,
          difficulty
        };
      }

      case 'formula': {
        if (!topic.keyFormulas?.length) return null;
        const formula = topic.keyFormulas[Math.floor(Math.random() * topic.keyFormulas.length)];
        return {
          type: 'open',
          text: `Write the formula for: ${formula.split('=')[0] || formula}. Then solve a sample problem using it.`,
          options: null,
          correctAnswer: formula,
          topic: topic.title,
          difficulty
        };
      }

      case 'apply_formula': {
        if (!topic.keyFormulas?.length) return null;
        const formula = topic.keyFormulas[Math.floor(Math.random() * topic.keyFormulas.length)];
        return {
          type: 'open',
          text: `Using the formula ${formula}, solve: Show your working step by step.`,
          options: null,
          correctAnswer: null,
          topic: topic.title,
          difficulty
        };
      }

      case 'true_false': {
        if (!topic.keyFacts?.length) return null;
        const fact = topic.keyFacts[Math.floor(Math.random() * topic.keyFacts.length)];
        const isTrue = Math.random() > 0.3;
        return {
          type: 'mcq',
          text: isTrue ? `True or False: ${fact}` : `True or False: ${fact} (This statement may be modified — verify carefully)`,
          options: ['True', 'False'],
          correctAnswer: isTrue ? 'True' : 'False',
          topic: topic.title,
          difficulty
        };
      }

      case 'fill_blank': {
        if (!topic.keyFacts?.length) return null;
        const fact = topic.keyFacts[Math.floor(Math.random() * topic.keyFacts.length)];
        const words = fact.split(' ');
        if (words.length < 4) return null;
        const blankIdx = Math.floor(Math.random() * (words.length - 2)) + 1;
        const answer = words[blankIdx];
        words[blankIdx] = '________';
        return {
          type: 'fill_blank',
          text: `Fill in the blank: ${words.join(' ')}`,
          options: null,
          correctAnswer: answer,
          topic: topic.title,
          difficulty
        };
      }

      case 'sequence': {
        if (!topic.procedures?.length) return null;
        return {
          type: 'open',
          text: `Describe the steps involved in: ${topic.title}. List them in the correct order.`,
          options: null,
          correctAnswer: topic.procedures.map((p, i) => `${i + 1}. ${p}`).join('\n'),
          topic: topic.title,
          difficulty
        };
      }

      case 'explain_procedure': {
        if (!topic.procedures?.length) return null;
        const step = topic.procedures[Math.floor(Math.random() * topic.procedures.length)];
        return {
          type: 'open',
          text: `Explain why the following step is important: "${step}"`,
          options: null,
          correctAnswer: null,
          topic: topic.title,
          difficulty
        };
      }

      default:
        return {
          type: 'open',
          text: `Explain a key concept from ${topic.title}.`,
          options: null,
          correctAnswer: null,
          topic: topic.title,
          difficulty
        };
    }
  }

  // ----------------------------------------------------------------
  // TEST UI
  // ----------------------------------------------------------------
  async function openTestGenerator() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:6000;';

    // Options
    overlay.innerHTML = `
      <div class="modal" style="width:500px;max-width:95vw">
        <h3 style="margin:0 0 16px;color:var(--accent)">🧪 Generate Practice Test</h3>
        <div style="display:grid;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Number of Questions</label>
            <input type="number" id="testCount" value="10" min="3" max="30"
              style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:13px">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Difficulty</label>
            <select id="testDifficulty" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:13px">
              <option value="easy">Easy</option>
              <option value="intermediate" selected>Intermediate</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <p style="font-size:11px;color:var(--muted);margin:0">
            Test will be generated from the active subject, grade, and curriculum RAG data.
            ${state.academic?.activeChapter ? `Focused on: <strong>${state.academic.activeChapter.title}</strong>` : 'No active focus — all topics will be used.'}
          </p>
        </div>
        <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-secondary" id="cancelTest">Cancel</button>
          <button class="btn-primary" id="generateTest">🧪 Generate</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#cancelTest').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#generateTest').addEventListener('click', async () => {
      const count = parseInt(overlay.querySelector('#testCount').value) || 10;
      const difficulty = overlay.querySelector('#testDifficulty').value;

      overlay.querySelector('#generateTest').textContent = '⏳ Generating...';
      overlay.querySelector('#generateTest').disabled = true;

      const test = await generateFromRAG({ count, difficulty });
      overlay.remove();

      if (test) {
        showTest(test);
      }
    });
  }

  function showTest(test) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:6000;';

    overlay.innerHTML = `
      <div class="modal" style="width:800px;max-width:95vw;max-height:92vh;overflow-y:auto;padding:0;border-radius:14px">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:20px 24px;color:white">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h2 style="margin:0;font-size:18px">🧪 ${test.title}</h2>
              <p style="margin:4px 0 0;font-size:12px;opacity:0.85">${test.questions.length} questions · ${test.difficulty} · ${test.curriculum}</p>
            </div>
            <button id="closeTest" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px">×</button>
          </div>
        </div>
        <div style="padding:20px 24px">
          ${test.questions.map((q, idx) => `
            <div style="padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:10px">
              <div style="display:flex;gap:8px;align-items:start">
                <span style="background:var(--accent);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${idx + 1}</span>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600;margin-bottom:6px">${q.text}</div>
                  <div style="font-size:10px;color:var(--muted);margin-bottom:6px">Topic: ${q.topic} · Type: ${q.type}</div>
                  ${q.type === 'mcq' && q.options ? `
                    <div style="display:grid;gap:4px">
                      ${q.options.map((opt, oi) => `
                        <label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px">
                          <input type="radio" name="q${idx}" value="${opt}" style="accent-color:var(--accent)">
                          <span>${String.fromCharCode(65 + oi)}) ${opt}</span>
                        </label>
                      `).join('')}
                    </div>
                  ` : q.type === 'fill_blank' ? `
                    <input type="text" class="test-answer" data-q="${idx}" placeholder="Your answer..."
                      style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--input-bg);color:var(--text)">
                  ` : `
                    <textarea class="test-answer" data-q="${idx}" rows="2" placeholder="Your answer..."
                      style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--input-bg);color:var(--text);resize:none"></textarea>
                  `}
                </div>
              </div>
            </div>
          `).join('')}

          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
            <button class="btn-secondary" id="showAnswersBtn">👁️ Show Answers</button>
            <button class="btn-primary" id="createFromTest">📝 Create as Assignment</button>
          </div>

          <div id="answerKey" style="display:none;margin-top:20px;padding:16px;background:#f0fdf4;border-radius:10px">
            <h4 style="margin:0 0 8px;color:#065f46">Answer Key</h4>
            ${test.questions.map((q, idx) => `
              <div style="font-size:12px;margin-bottom:4px">
                <strong>Q${idx + 1}:</strong> ${q.correctAnswer || '<em>Open-ended (no fixed answer)</em>'}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#closeTest')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#showAnswersBtn')?.addEventListener('click', () => {
      const key = overlay.querySelector('#answerKey');
      key.style.display = key.style.display === 'none' ? 'block' : 'none';
    });

    overlay.querySelector('#createFromTest')?.addEventListener('click', () => {
      if (window.Assignments?.createAssignment) {
        const assignment = window.Assignments.createAssignment({
          title: test.title,
          description: `Auto-generated practice test. ${test.questions.length} questions, ${test.difficulty} difficulty.`,
          type: 'quiz',
          gradeLevel: test.grade,
          maxPoints: test.questions.length,
          questions: test.questions.map(q => ({
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer
          }))
        });
        window.Toast?.success('Assignment created from practice test!');
        overlay.remove();
      }
    });
  }

  // ----------------------------------------------------------------
  // ADD BUTTON TO SIDEBAR (Student & Teacher)
  // ----------------------------------------------------------------
  function addTestButton() {
    // Teacher Sidebar
    const teacherTools = document.getElementById('teacherToolsSection');
    if (teacherTools && !document.getElementById('practiceTestBtnTeacher')) {
      const btn = document.createElement('button');
      btn.id = 'practiceTestBtnTeacher';
      btn.style.cssText = 'width:100%;padding:9px 12px;background:linear-gradient(135deg,#059669,#34d399);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;margin-top:6px;box-shadow:0 2px 6px rgba(5,150,105,0.25);';
      btn.innerHTML = '<span>🧪</span> Generate Practice Test';
      btn.addEventListener('click', openTestGenerator);
      teacherTools.appendChild(btn);
    }

    // Student Sidebar
    const studentTools = document.getElementById('studentToolsSection');
    if (studentTools && !document.getElementById('practiceTestBtnStudent')) {
      const btn = document.createElement('button');
      btn.id = 'practiceTestBtnStudent';
      btn.className = 'tool-btn';
      btn.style.cssText = 'width:100%;margin-top:6px;display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--panel);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;color:var(--text);font-family:inherit;';
      btn.innerHTML = '<span>🧪</span> <span>Practice Test &amp; Quiz</span>';
      btn.addEventListener('click', openTestGenerator);
      studentTools.appendChild(btn);
    }
  }

  window.addEventListener('teacherModeUnlocked', () => setTimeout(addTestButton, 400));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addTestButton, 600));
  } else {
    setTimeout(addTestButton, 600);
  }

  window.PracticeTest = {
    generateFromRAG,
    openTestGenerator,
    showTest
  };

  console.log('✅ Practice Test Generator loaded for Students & Teachers');
})();
