// js/ai-feedback.js
// ===================================================================
// ENHANCED AI FEEDBACK SYSTEM
// Provides detailed, personalized feedback and suggestions
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Generate personalized feedback for student
  async function generatePersonalizedFeedback(studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return null;

    const analytics = window.Analytics ? window.Analytics.calculateStudentAnalytics(student) : null;
    if (!analytics) return null;

    const prompt = buildFeedbackPrompt(student, analytics);

    try {
      const systemPrompt = await window.Security.loadPromptSecure('teacher');
      if (!systemPrompt) {
        throw new Error('Teacher prompt not available');
      }

      const response = await fetch(state.api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.api.key
        },
        body: JSON.stringify({
          model: state.api.model,
          messages: [
            { role: 'system', content: systemPrompt + '\n\nTi je një mësues ekspert që jep feedback konstruktiv dhe të personalizuar. Fokusohuni në pikat e forta, zonat për përmirësim, dhe sugjerime specifike për sukses.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message?.content || 'Nuk u gjet feedback.';

    } catch (error) {
      console.error('AI feedback generation failed:', error);
      return null;
    }
  }

  // Build feedback prompt
  function buildFeedbackPrompt(student, analytics) {
    let prompt = `Jep feedback të personalizuar për nxënësin e mëposhtëm:\n\n`;
    prompt += `NXËNËS: ${student.name}\n`;
    prompt += `KLASA: ${student.gradeLevel || 'Pa specifikuar'}\n\n`;

    prompt += `PERFORMANCA:\n`;
    analytics.semesterData.forEach(sem => {
      if (sem.overall !== null) {
        prompt += `- Semestri ${sem.semester}: ${sem.overall.toFixed(2)} (${sem.detyraCount} detyra)\n`;
      }
    });

    if (student.finalAverage !== null) {
      prompt += `- Mesatarja Finale: ${student.finalAverage.toFixed(2)}\n\n`;
    }

    prompt += `TENDENCAT:\n`;
    if (analytics.trends.length > 0) {
      analytics.trends.forEach(trend => {
        prompt += `- Semestri ${trend.semester}: ${trend.direction === 'improving' ? 'Përmirësim' : 'Rënie'} (${trend.magnitude} pikë)\n`;
      });
    } else {
      prompt += `- Performancë e qëndrueshme\n`;
    }
    prompt += '\n';

    if (student.teacherNotes && student.teacherNotes.trim()) {
      prompt += `SHËNIME TË MËSUESIT:\n${student.teacherNotes}\n\n`;
    }

    prompt += `Jep një feedback të shkurtër (3-5 paragrafe) që përfshin:\n`;
    prompt += `1. Vlerësim të përgjithshëm të performancës\n`;
    prompt += `2. Pikat e forta specifike\n`;
    prompt += `3. Zona që kanë nevojë për përmirësim\n`;
    prompt += `4. Sugjerime konkrete për sukses të vazhdueshëm\n\n`;
    prompt += `Përdor ton pozitiv, mbështetës dhe motivues. Feedback duhet të jetë konstruktiv dhe i orientuar drejt veprimit.`;

    return prompt;
  }

  // Generate study recommendations
  async function generateStudyRecommendations(studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return null;

    const analytics = window.Analytics ? window.Analytics.calculateStudentAnalytics(student) : null;

    const prompt = `
Bazuar në performancën e nxënësit ${student.name} (Klasa ${student.gradeLevel || '-'}), 
sugjero një plan studimi të personalizuar.

PERFORMANCA AKTUALE:
${analytics ? analytics.semesterData.map(s =>
      `Semestri ${s.semester}: ${s.overall !== null ? s.overall.toFixed(1) : 'Pa nota'}`
    ).join('\n') : 'Pa të dhëna'}

${analytics && analytics.weaknesses.length > 0 ?
        `ZONA PËR PËRMIRËSIM:\n${analytics.weaknesses.join('\n')}` : ''}

Jep 5-7 sugjerime specifike për studim, duke përfshirë:
- Tema për të fokusuar
- Metoda studimi të rekomanduara
- Frekuenca e ushtrimit
- Burime të dobishme

Përdor format të qartë dhe konciz.
    `;

    try {
      const systemPrompt = await window.Security.loadPromptSecure('student');
      if (!systemPrompt) {
        throw new Error('Student prompt not available');
      }

      const response = await fetch(state.api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.api.key
        },
        body: JSON.stringify({
          model: state.api.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message?.content || 'Nuk u gjeten rekomandime.';

    } catch (error) {
      console.error('Recommendations generation failed:', error);
      return null;
    }
  }

  // Generate common mistakes analysis
  async function analyzeCommonMistakes(gradeLevel) {
    const students = state.students.list.filter(s => s.gradeLevel === gradeLevel);

    if (students.length === 0) return null;

    // Collect low-performing areas
    const lowPerformers = students.filter(s =>
      s.finalAverage !== null && s.finalAverage < 7
    );

    const prompt = `
Analizo gabimet e zakonshme për klasën ${gradeLevel}.

STATISTIKA:
- Numri total i nxënësve: ${students.length}
- Nxënës me performancë nën 7: ${lowPerformers.length}

${lowPerformers.length > 0 ?
        `Disa nxënës po hasin vështirësi. Identifiko:\n
1. Gabimet më të zakonshme në gjuhën shqipe për këtë nivel
2. Konceptet që zakonisht janë të vështira
3. Strategji për t'i adresuar këto vështirësi
4. Aktivitete të rekomanduara për klasë

Jep përgjigje të strukturuar dhe praktike.`
        :
        `Klasa po performon mirë. Sugjero aktivitete sfidues për t'i mbajtur të angazhuar dhe për të thelluar njohuritë.`}
    `;

    try {
      const systemPrompt = await window.Security.loadPromptSecure('teacher');
      if (!systemPrompt) {
        throw new Error('Teacher prompt not available');
      }

      const response = await fetch(state.api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.api.key
        },
        body: JSON.stringify({
          model: state.api.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 700
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message?.content || 'Nuk u gjet analizë.';

    } catch (error) {
      console.error('Common mistakes analysis failed:', error);
      return null;
    }
  }

  // Show feedback modal
  function showFeedbackModal(studentId, feedbackType = 'general') {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:650px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">💡 Feedback i Personalizuar</h3>
          <button class="icon-btn close-feedback" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div style="padding:12px;background:var(--assistant);border-radius:8px;margin-bottom:16px">
          <h4 style="margin:0 0 4px;color:var(--accent)">${student.name}</h4>
          <p style="margin:0;font-size:13px;color:var(--muted)">Klasa ${student.gradeLevel || '-'}</p>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:16px">
          <button class="feedback-tab ${feedbackType === 'general' ? 'active' : ''}" data-type="general"
                  style="flex:1;padding:8px;border:1px solid var(--accent);border-radius:6px;
                  background:${feedbackType === 'general' ? 'var(--accent)' : 'transparent'};
                  color:${feedbackType === 'general' ? '#fff' : 'var(--accent)'};
                  font-weight:600;cursor:pointer;transition:all 0.2s">
            Feedback i Përgjithshëm
          </button>
          <button class="feedback-tab ${feedbackType === 'study' ? 'active' : ''}" data-type="study"
                  style="flex:1;padding:8px;border:1px solid var(--accent);border-radius:6px;
                  background:${feedbackType === 'study' ? 'var(--accent)' : 'transparent'};
                  color:${feedbackType === 'study' ? '#fff' : 'var(--accent)'};
                  font-weight:600;cursor:pointer;transition:all 0.2s">
            Plan Studimi
          </button>
        </div>

        <div id="feedbackContent" style="padding:16px;background:#fff;border-radius:10px;
             min-height:200px;line-height:1.7">
          <div style="text-align:center;padding:40px 0;color:var(--muted)">
            <div style="font-size:40px;margin-bottom:12px">🤖</div>
            <div>Duke gjeneruar feedback...</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.close-feedback').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Tab switcher
    modal.querySelectorAll('.feedback-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        const type = tab.dataset.type;

        // Update active tab
        modal.querySelectorAll('.feedback-tab').forEach(t => {
          const isActive = t.dataset.type === type;
          t.classList.toggle('active', isActive);
          t.style.background = isActive ? 'var(--accent)' : 'transparent';
          t.style.color = isActive ? '#fff' : 'var(--accent)';
        });

        // Load content
        const contentDiv = modal.querySelector('#feedbackContent');
        contentDiv.innerHTML = `
          <div style="text-align:center;padding:40px 0;color:var(--muted)">
            <div style="font-size:40px;margin-bottom:12px">🤖</div>
            <div>Duke gjeneruar feedback...</div>
          </div>
        `;

        let feedback = null;
        if (type === 'general') {
          feedback = await generatePersonalizedFeedback(studentId);
        } else if (type === 'study') {
          feedback = await generateStudyRecommendations(studentId);
        }

        if (feedback) {
          // Render markdown if available
          if (window.markdownit) {
            const md = window.markdownit();
            contentDiv.innerHTML = md.render(feedback);
          } else {
            contentDiv.innerHTML = `<div style="white-space:pre-wrap">${feedback}</div>`;
          }
        } else {
          contentDiv.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:var(--error)">
              ❌ Gabim në gjenerimin e feedback. Ju lutem provoni përsëri.
            </div>
          `;
        }
      });
    });

    // Load initial content
    const initialTab = modal.querySelector(`.feedback-tab[data-type="${feedbackType}"]`);
    if (initialTab) {
      initialTab.click();
    }
  }

  // Add feedback button to student modal
  function enhanceStudentModal() {
    // This will be called when student modal opens
    // We'll add feedback button to student modal
    const originalOpenStudentModal = window.openStudentModal;
    if (!originalOpenStudentModal) return;

    window.openStudentModal = function (studentId) {
      originalOpenStudentModal(studentId);

      setTimeout(() => {
        const modal = document.getElementById('studentModal');
        if (!modal) return;

        // Check if button already exists
        if (modal.querySelector('#aiFeedbackBtn')) return;

        // Find AI notes section
        const aiSection = modal.querySelector('#aiNotesDisplay');
        if (!aiSection || !aiSection.parentElement) return;

        // Add feedback button
        const feedbackBtn = document.createElement('button');
        feedbackBtn.id = 'aiFeedbackBtn';
        feedbackBtn.className = 'quizBtn';
        feedbackBtn.style.marginTop = '8px';
        feedbackBtn.style.width = '100%';
        feedbackBtn.textContent = '💡 Gjenero Feedback të Personalizuar';

        feedbackBtn.addEventListener('click', () => {
          showFeedbackModal(studentId, 'general');
        });

        aiSection.parentElement.appendChild(feedbackBtn);
      }, 100);
    };
  }

  // Add class insights button
  function addClassInsightsButton() {
    const teacherSection = document.getElementById('teacherToolsSection');
    if (!teacherSection) return;

    // Check if already exists
    if (document.getElementById('classInsightsBtn')) return;

    const quizControls = teacherSection.querySelector('.quizControls');
    if (!quizControls) return;

    const btn = document.createElement('button');
    btn.id = 'classInsightsBtn';
    btn.className = 'quizBtn';
    btn.textContent = '🔍 Analizo Gabimet e Zakonshme';

    btn.addEventListener('click', async () => {
      if (!state.academic.activeGrade) {
        alert('⚠️ Ju lutem zgjidhni një klasë.');
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.style.zIndex = '300';
      modal.style.display = 'flex';

      modal.innerHTML = `
        <div class="modal" style="width:650px;max-width:95vw;max-height:90vh;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0;color:var(--accent)">🔍 Analiza e Klasës ${state.academic.activeGrade}</h3>
            <button class="icon-btn close-insights" style="width:32px;height:32px;font-size:18px">×</button>
          </div>

          <div id="insightsContent" style="padding:16px;background:#fff;border-radius:10px;
               min-height:200px;line-height:1.7">
            <div style="text-align:center;padding:40px 0;color:var(--muted)">
              <div style="font-size:40px;margin-bottom:12px">🤖</div>
              <div>Duke analizuar të dhënat...</div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.close-insights').addEventListener('click', () => {
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // Generate analysis
      const analysis = await analyzeCommonMistakes(state.academic.activeGrade);
      const contentDiv = modal.querySelector('#insightsContent');

      if (analysis) {
        if (window.markdownit) {
          const md = window.markdownit();
          contentDiv.innerHTML = md.render(analysis);
        } else {
          contentDiv.innerHTML = `<div style="white-space:pre-wrap">${analysis}</div>`;
        }
      } else {
        contentDiv.innerHTML = `
          <div style="text-align:center;padding:40px 0;color:var(--error)">
            ❌ Gabim në gjenerimin e analizës. Ju lutem provoni përsëri.
          </div>
        `;
      }
    });

    quizControls.appendChild(btn);
  }

  // Initialize when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    enhanceStudentModal();

    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(addClassInsightsButton, 100);
        }
      };
    }
  });

  // Export functions
  window.AIFeedback = {
    generatePersonalizedFeedback,
    generateStudyRecommendations,
    analyzeCommonMistakes,
    showFeedbackModal
  };

  console.log('✅ AI Feedback module initialized');
})();