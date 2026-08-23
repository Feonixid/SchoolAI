// js/quiz.js
// ===================================================================
// QUIZ & PRACTICE MODE - Enhanced with better prompts
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Build quiz prompt with anti-verbosity instructions
  function buildQuizPrompt(type) {
    const gradeText = state.academic.activeGrade
      ? `klasa ${state.academic.activeGrade}`
      : 'klasa e pa specifikuar';

    const chapterTitle = state.academic.activeChapter?.title || 'kapitull i pa specifikuar';

    if (type === 'three') {
      return `Krijo VETËM 3 pyetje për ${gradeText}, kapitulli "${chapterTitle}". MOS përdor hyrje si "Sigurisht!", "Këtu janë", ose shpjegime të gjata. Shkruaj VETËM pyetjet e numëruara 1, 2, 3. Asgjë tjetër. Pyetje të shkurtra dhe të qarta.`;
    }

    if (type === 'quick') {
      return `Jep 1-2 pyetje SHUMË të shpejta për kapitullin "${chapterTitle}", ${gradeText}. MOS përdor hyrje. Shkruaj VETËM pyetjet. Asgjë më shumë.`;
    }

    return '';
  }

  // Wire buttons
  window.addEventListener('DOMContentLoaded', () => {
    const generateQuizBtn = document.getElementById('generateQuizBtn');
    const quizHintBtn = document.getElementById('quizHintBtn');
    const practiceModeToggle = document.getElementById('practiceModeToggle');
    const privacyModeToggle = document.getElementById('privacyModeToggle');

    // Generate 3 questions
    if (generateQuizBtn) {
      generateQuizBtn.addEventListener('click', () => {
        if (!state.ui.teacherModeUnlocked) {
          alert('⚠️ Kjo veçori kërkon Teacher Mode.');
          return;
        }

        const metaPrompt = buildQuizPrompt('three');
        if (!metaPrompt) return;

        const input = document.getElementById('input');
        if (input) {
          input.value = metaPrompt;
          const sendBtn = document.getElementById('sendBtn');
          if (sendBtn) sendBtn.click();
        }
      });
    }

    // Quick quiz hint
    if (quizHintBtn) {
      quizHintBtn.addEventListener('click', () => {
        if (!state.ui.teacherModeUnlocked) {
          alert('⚠️ Kjo veçori kërkon Teacher Mode.');
          return;
        }

        const metaPrompt = buildQuizPrompt('quick');
        if (!metaPrompt) return;

        const input = document.getElementById('input');
        if (input) {
          input.value = metaPrompt;
          const sendBtn = document.getElementById('sendBtn');
          if (sendBtn) sendBtn.click();
        }
      });
    }

    // Practice mode toggle
    if (practiceModeToggle) {
      practiceModeToggle.addEventListener('change', (e) => {
        state.modes.practice = e.target.checked;
        console.log('Practice mode:', state.modes.practice);
      });
    }

    // Privacy mode toggle
    if (privacyModeToggle) {
      privacyModeToggle.addEventListener('change', (e) => {
        state.modes.privacy = e.target.checked;
        console.log('Privacy mode:', state.modes.privacy);

        if (state.modes.privacy) {
          console.warn('⚠️ Privacy mode active: history will not be kept');
        }
      });
    }
  });

  console.log('Quiz module initialized (enhanced)');
})();