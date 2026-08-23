// js/models.js
// ===================================================================
// DATA MODELS & HELPERS
// Most state is now in state.js - this file provides helper functions
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Backward compatibility: expose state variables globally
  // (Some old code might still reference these)
  window.API_KEY = state.api.key;
  window.MODEL = state.api.model;
  window.STUDENT_FILE = state.prompts.student;
  window.TEACHER_FILE = state.prompts.teacher;
  window.DEVELOPER_FILE = state.prompts.developer;

  // Expose state getters for backward compatibility
  Object.defineProperty(window, 'teacherMode', {
    get: () => state.ui.teacherMode,
    set: (v) => { state.ui.teacherMode = v; }
  });

  Object.defineProperty(window, 'activeTool', {
    get: () => state.ui.activeTool,
    set: (v) => { state.ui.activeTool = v; }
  });

  Object.defineProperty(window, 'difficulty', {
    get: () => state.ui.difficulty,
    set: (v) => { state.ui.difficulty = v; }
  });

  Object.defineProperty(window, 'activeGrade', {
    get: () => state.academic.activeGrade,
    set: (v) => { state.academic.activeGrade = v; }
  });

  Object.defineProperty(window, 'activeChapter', {
    get: () => state.academic.activeChapter,
    set: (v) => { state.academic.activeChapter = v; }
  });

  Object.defineProperty(window, 'includeDeveloper', {
    get: () => state.ui.includeDeveloper,
    set: (v) => { state.ui.includeDeveloper = v; }
  });

  Object.defineProperty(window, 'history', {
    get: () => state.chat.history,
    set: (v) => { state.chat.history = v; }
  });

  Object.defineProperty(window, 'focusInstruction', {
    get: () => state.academic.focusInstruction,
    set: (v) => { state.academic.focusInstruction = v; }
  });

  Object.defineProperty(window, 'students', {
    get: () => state.students.list,
    set: (v) => { state.students.list = v; }
  });

  Object.defineProperty(window, 'selectedStudentId', {
    get: () => state.students.selectedId,
    set: (v) => { state.students.selectedId = v; }
  });

  // Helper: Fetch prompt file with error handling
  async function fetchPrompt(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      return text;
    } catch (error) {
      console.warn('Prompt file missing:', path, error);
      return null;
    }
  }

  // Export helper
  window.fetchPrompt = fetchPrompt;

  console.log('✅ Models module initialized (lightweight mode)');
})();