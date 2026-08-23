// js/socratic-tutor.js — Socratic Pedagogy & Critical Thinking Engine
// ===================================================================
// Cultivates deep conceptual mastery through progressive scaffolding,
// guiding questions, and metacognitive reflection.
// ===================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'schoolai_socratic_mode';

  let socraticEnabled = localStorage.getItem(STORAGE_KEY) !== 'false';

  // Socratic System Guidance to encourage deep thinking
  const SOCRATIC_INSTRUCTIONS = `
--- SOCRATIC & CRITICAL THINKING MODE ACTIVE ---
You are a world-class master educator and Socratic mentor. Your highest mission is to empower the student's intellect, curiosity, and critical thinking:
1. NEVER just dump the final answer or solve homework entirely for the student in one step unless they specifically ask for a finished review.
2. GUIDE the student using scaffolding:
   - Ask clarifying diagnostic questions.
   - Point out key concepts, definitions, and underlying principles.
   - Give progressive hints rather than spoon-feeding solutions.
3. PRAISE genuine effort, curiosity, and perseverance (Growth Mindset).
4. Point out any common pitfalls or misconceptions gently, explaining WHY they occur.
5. End complex explanations with a quick "Reflection Question" to test their comprehension.
`;

  // ----------------------------------------------------------------
  // COMMON MISCONCEPTION RECOGNITION
  // ----------------------------------------------------------------
  const MISCONCEPTIONS = [
    {
      pattern: /\(a\s*\+\s*b\)\s*(\^2|²)/i,
      concept: 'Algebraic Binomial Expansion',
      explanation: 'Remember: (a + b)² = a² + 2ab + b², NOT a² + b²! Don\'t forget the middle term (2ab).'
    },
    {
      pattern: /divide\s+by\s+0|\/\s*0/i,
      concept: 'Division by Zero',
      explanation: 'Division by zero is undefined in arithmetic because no number multiplied by 0 can equal a non-zero numerator.'
    },
    {
      pattern: /heavier.*fall.*faster|mass.*fall.*faster/i,
      concept: 'Galilean Gravity & Free Fall',
      explanation: 'In a vacuum, all objects fall with the exact same gravitational acceleration (g ≈ 9.8 m/s²), regardless of mass!'
    },
    {
      pattern: /arteries.*oxygen.*veins.*deoxygenated/i,
      concept: 'Circulatory System Nuance',
      explanation: 'General rule: Arteries carry blood away from the heart, veins toward it. Note: Pulmonary arteries carry deoxygenated blood to the lungs!'
    }
  ];

  function detectMisconception(text) {
    if (!text) return null;
    for (const m of MISCONCEPTIONS) {
      if (m.pattern.test(text)) {
        return m;
      }
    }
    return null;
  }

  // ----------------------------------------------------------------
  // SCAFFOLDING LADDER GENERATOR
  // ----------------------------------------------------------------
  function generateScaffoldingUI(problemContext) {
    const container = document.createElement('div');
    container.className = 'scaffolding-ladder';
    container.innerHTML = `
      <div class="scaffolding-header">
        <span>🪜 Socratic Scaffolding Ladder</span>
        <span style="font-size:11px;color:var(--text-muted)">Choose your level of guidance:</span>
      </div>
      <div class="scaffolding-steps">
        <button class="scaffold-btn" data-level="1">🔍 1. Guiding Question</button>
        <button class="scaffold-btn" data-level="2">💡 2. Concept Hint</button>
        <button class="scaffold-btn" data-level="3">🪜 3. Next Step</button>
        <button class="scaffold-btn" data-level="4">🏆 4. Full Solution</button>
      </div>
    `;

    container.querySelectorAll('.scaffold-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = btn.dataset.level;
        container.querySelectorAll('.scaffold-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const input = document.getElementById('input');
        if (!input) return;

        let prompt = '';
        if (level === '1') {
          prompt = `I am working on this problem: "${problemContext}". Please ask me a guiding Socratic question to help me figure out the first step on my own.`;
        } else if (level === '2') {
          prompt = `I am working on: "${problemContext}". Give me a conceptual hint or formula to remember, without solving it yet.`;
        } else if (level === '3') {
          prompt = `For this problem: "${problemContext}", what is the immediate next mathematical or logical step I should take?`;
        } else if (level === '4') {
          prompt = `Please provide the complete step-by-step master solution for: "${problemContext}", and explain the key insight behind the method.`;
        }

        input.value = prompt;
        const form = document.getElementById('chatForm');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });
    });

    return container;
  }

  // ----------------------------------------------------------------
  // UI INITIALIZATION
  // ----------------------------------------------------------------
  function initUI() {
    // Add Socratic toggle pill to chat controls if present
    const chatControls = document.querySelector('.chat-input-toolbar, .inputControls, #toolsPanel');
    if (chatControls && !document.getElementById('socraticTogglePill')) {
      const pill = document.createElement('button');
      pill.id = 'socraticTogglePill';
      pill.className = `socratic-toggle-pill ${socraticEnabled ? 'active' : ''}`;
      pill.innerHTML = `<span>🧠</span> <span>Socratic Mode</span>`;
      pill.title = 'When active, AI acts as a master Socratic tutor guiding your learning with progressive hints.';
      
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        socraticEnabled = !socraticEnabled;
        localStorage.setItem(STORAGE_KEY, socraticEnabled ? 'true' : 'false');
        pill.classList.toggle('active', socraticEnabled);
        window.Toast?.info(socraticEnabled ? '🧠 Socratic Mode Enabled: AI will guide you step-by-step.' : 'Direct Answers Mode Enabled.');
      });

      chatControls.appendChild(pill);
    }
  }

  // Hook into AI system instructions
  function getSocraticPrompt() {
    return socraticEnabled ? SOCRATIC_INSTRUCTIONS : '';
  }

  function isEnabled() {
    return socraticEnabled;
  }

  function toggle(enable) {
    socraticEnabled = enable !== undefined ? enable : !socraticEnabled;
    localStorage.setItem(STORAGE_KEY, socraticEnabled ? 'true' : 'false');
    const pill = document.getElementById('socraticTogglePill');
    if (pill) pill.classList.toggle('active', socraticEnabled);
    return socraticEnabled;
  }

  // Export
  window.SocraticTutor = {
    isEnabled,
    toggle,
    getSocraticPrompt,
    detectMisconception,
    generateScaffoldingUI
  };

  document.addEventListener('DOMContentLoaded', initUI);
})();
