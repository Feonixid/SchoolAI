// js/ai-context.js
// ===================================================================
// SMART CONTEXT AGGREGATOR
// ===================================================================
// Modular context injection for the AI — only sends what's relevant
// to the current subject tab, keeping prompts lean.
//
// The AI can "see" everything the student sees, but we only inject
// context that matches the active subject to avoid tanking
// performance and wasting context window tokens.
//
// Architecture:
//   ai-core.js  →  calls  window.AIContext.build()
//   ai-context.js →  checks active subject tab
//                →  injects ONLY relevant context:
//                     • Student profile (always, ~100 tokens)
//                     • Curriculum RAG for grade+subject (always)
//                     • Per-subject context (modular):
//                         - Coding:      file tree, workspace files
//                         - Cyber:       terminal history
//                         - All:         assignments, grades, teacher notes
//                     • Career path from My Path
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // Token budget per section (approximate word counts)
  const BUDGET = {
    profile:      80,    // Name, grade, curriculum, career
    curriculum:   400,   // RAG content for grade+subject
    assignments:  150,   // Pending/recent assignments for this subject
    grades:       100,   // Recent grades + teacher feedback
    workspace:    200,   // File tree (coding) or terminal (cyber)
    analytics:    80,    // Learning stats for this subject
    career:       100,   // My Path career context
  };

  // ----------------------------------------------------------------
  // MAIN BUILD — called from ai-core.js
  // Returns a single string to append to system prompt
  // ----------------------------------------------------------------
  async function build() {
    const parts = [];
    const activeSubject = window.Subjects?.getActive();
    const subjectId = activeSubject?.id || 'general';
    const subjectLabel = activeSubject?.label || 'General';

    // 1. STUDENT PROFILE (always — lightweight)
    const profile = buildProfileContext();
    if (profile) parts.push(profile);

    // 2. STUDENT ACADEMIC STATE (grade, enrolled class)
    const academic = buildAcademicContext(subjectLabel);
    if (academic) parts.push(academic);

    // 3. ASSIGNMENTS for current subject (lightweight summary)
    const assignments = buildAssignmentsContext(subjectLabel);
    if (assignments) parts.push(assignments);

    // 4. GRADES & TEACHER FEEDBACK for this subject
    const grades = buildGradesContext(subjectLabel);
    if (grades) parts.push(grades);

    // 5. SUBJECT-SPECIFIC CONTEXT (modular — only for the active tab)
    const subjectCtx = buildSubjectSpecificContext(subjectId);
    if (subjectCtx) parts.push(subjectCtx);

    // 6. LEARNING ANALYTICS (brief stats)
    const analytics = buildAnalyticsContext(subjectLabel);
    if (analytics) parts.push(analytics);

    if (parts.length === 0) return null;

    return '\n\n--- STUDENT CONTEXT (auto-injected, adapt your teaching accordingly) ---\n' +
           parts.join('\n') +
           '\n--- END STUDENT CONTEXT ---';
  }

  // ----------------------------------------------------------------
  // 1. STUDENT PROFILE
  // ----------------------------------------------------------------
  function buildProfileContext() {
    // Use My Path profile if available
    if (window.getStudentProfileContext) {
      return window.getStudentProfileContext();
    }

    // Fallback to basic info
    const enrolled = state.classroom?.enrolledClass;
    const studentId = localStorage.getItem('EduAI_logged_student');
    const studentName = localStorage.getItem('EduAI_student_name');

    if (!studentName && !enrolled) return null;

    let ctx = '📋 STUDENT PROFILE:';
    if (studentName) ctx += ` Name: ${studentName}.`;
    if (enrolled) {
      ctx += ` Grade: ${enrolled.gradeLevel || 'unknown'}.`;
      ctx += ` Subject: ${enrolled.subject || 'General'}.`;
    }
    return ctx;
  }

  // ----------------------------------------------------------------
  // 2. ACADEMIC STATE
  // ----------------------------------------------------------------
  function buildAcademicContext(subjectLabel) {
    const parts = [];

    // Current grade level
    const grade = state.academic?.activeGrade;
    if (grade) parts.push(`Grade: ${grade}`);

    // Active chapter/focus
    const chapter = state.academic?.activeChapter;
    if (chapter) parts.push(`Current Chapter: ${chapter.title}`);

    // Active focus instruction
    if (state.academic?.focusInstruction) {
      parts.push(`Teacher Focus: ${state.academic.focusInstruction.substring(0, 150)}`);
    }

    // Enrolled class info
    const enrolled = state.classroom?.enrolledClass;
    if (enrolled) {
      parts.push(`Class: ${enrolled.name || enrolled.subject || subjectLabel}`);
      if (enrolled.teacherName) parts.push(`Teacher: ${enrolled.teacherName}`);
    }

    // Curriculum
    const curriculum = window.CurriculumRAG?.activeCurriculum;
    if (curriculum) parts.push(`Curriculum: ${curriculum}`);

    if (parts.length === 0) return null;
    return '🏫 ACADEMIC STATE: ' + parts.join(' | ');
  }

  // ----------------------------------------------------------------
  // 3. ASSIGNMENTS for this subject
  // ----------------------------------------------------------------
  function buildAssignmentsContext(subjectLabel) {
    if (!state.assignments?.list || state.assignments.list.length === 0) return null;

    const grade = state.academic?.activeGrade;
    const studentId = parseInt(localStorage.getItem('EduAI_logged_student'));

    // Filter assignments relevant to current grade
    const relevant = state.assignments.list.filter(a => {
      if (grade && a.gradeLevel && a.gradeLevel !== grade) return false;
      return true;
    }).slice(0, 5); // Max 5 most recent

    if (relevant.length === 0) return null;

    let ctx = `📝 ASSIGNMENTS (${subjectLabel}):`;
    relevant.forEach(a => {
      const dueStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'no deadline';
      const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();

      // Check if student submitted
      let statusStr = '';
      if (studentId) {
        const sub = state.assignments.submissions.find(
          s => s.assignmentId === a.id && s.studentId === studentId
        );
        if (sub) {
          if (sub.status === 'graded') {
            statusStr = ` [GRADED: ${sub.grade}/${a.maxPoints}]`;
            if (sub.feedback) statusStr += ` Feedback: "${sub.feedback.substring(0, 80)}"`;
          } else {
            statusStr = ' [SUBMITTED, awaiting grade]';
          }
        } else {
          statusStr = isPastDue ? ' [NOT SUBMITTED — OVERDUE]' : ' [not yet submitted]';
        }
      }

      ctx += `\n  • "${a.title}" (${a.type}, due: ${dueStr})${statusStr}`;
    });

    return ctx;
  }

  // ----------------------------------------------------------------
  // 4. GRADES & TEACHER FEEDBACK
  // ----------------------------------------------------------------
  function buildGradesContext(subjectLabel) {
    const studentId = parseInt(localStorage.getItem('EduAI_logged_student'));
    if (!studentId || !state.assignments?.submissions) return null;

    const graded = state.assignments.submissions.filter(
      s => s.studentId === studentId && s.status === 'graded'
    ).slice(-5); // Last 5 graded

    if (graded.length === 0) return null;

    let ctx = `📊 RECENT GRADES:`;
    graded.forEach(s => {
      const assignment = state.assignments.list.find(a => a.id === s.assignmentId);
      const name = assignment?.title || 'Assignment';
      ctx += `\n  • ${name}: ${s.grade}/${assignment?.maxPoints || '?'}`;
      if (s.feedback) ctx += ` — "${s.feedback.substring(0, 60)}"`;
    });

    // Average
    const numericGrades = graded
      .map(s => {
        const a = state.assignments.list.find(a2 => a2.id === s.assignmentId);
        return a?.maxPoints ? (s.grade / a.maxPoints) * 100 : null;
      })
      .filter(g => g !== null);

    if (numericGrades.length > 0) {
      const avg = Math.round(numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length);
      ctx += `\n  Average: ${avg}%`;
    }

    return ctx;
  }

  // ----------------------------------------------------------------
  // 5. SUBJECT-SPECIFIC CONTEXT (the modular part)
  // ----------------------------------------------------------------
  function buildSubjectSpecificContext(subjectId) {
    switch (subjectId) {
      case 'coding':
        return buildCodingContext();
      case 'cybersecurity':
        return buildCyberContext();
      default:
        return null; // Other subjects don't need extra workspace context
    }
  }

  // --- CODING: File tree + open editor content ---
  function buildCodingContext() {
    const parts = [];

    // Monaco editor content (if coding tab has files open)
    if (window.monacoEditor) {
      const model = window.monacoEditor.getModel();
      if (model) {
        const content = model.getValue();
        if (content && content.trim().length > 0) {
          const lang = model.getLanguageId?.() || 'unknown';
          // Truncate to budget
          const truncated = content.length > 1500
            ? content.substring(0, 1500) + '\n... (truncated)'
            : content;
          parts.push(`💻 CURRENT CODE (${lang}):\n\`\`\`${lang}\n${truncated}\n\`\`\``);
        }
      }
    }

    // File tree from projects module
    if (window.Projects?.getFileTree) {
      try {
        const tree = window.Projects.getFileTree();
        if (tree && tree.length > 0) {
          const treeStr = tree.slice(0, 20).map(f =>
            `  ${f.type === 'dir' ? '📁' : '📄'} ${f.name}`
          ).join('\n');
          parts.push(`📂 FILE TREE:\n${treeStr}`);
        }
      } catch (e) { /* ignore */ }
    }

    // LocalStorage drafts for coding
    const draftKey = Object.keys(localStorage).find(k => k.startsWith('EduAI_code_'));
    if (draftKey) {
      const code = localStorage.getItem(draftKey);
      if (code && code.length > 10 && !parts.some(p => p.includes('CURRENT CODE'))) {
        const truncated = code.length > 800
          ? code.substring(0, 800) + '\n... (truncated)'
          : code;
        parts.push(`💻 SAVED CODE DRAFT:\n\`\`\`\n${truncated}\n\`\`\``);
      }
    }

    if (parts.length === 0) return null;
    return parts.join('\n');
  }

  // --- CYBERSECURITY: Terminal history ---
  function buildCyberContext() {
    // Get terminal history from the terminal module
    const terminalOutput = document.getElementById('terminalOutput');
    if (!terminalOutput) return null;

    const lines = terminalOutput.innerText || terminalOutput.textContent || '';
    if (!lines.trim()) return null;

    // Get last 30 lines of terminal
    const recentLines = lines.split('\n').slice(-30).join('\n');
    if (recentLines.length < 5) return null;

    return `🖥️ TERMINAL HISTORY (last 30 lines):\n\`\`\`\n${recentLines.substring(0, 1200)}\n\`\`\`\nThe student can see this terminal. You can reference commands and output shown above.`;
  }

  // ----------------------------------------------------------------
  // 6. LEARNING ANALYTICS (brief)
  // ----------------------------------------------------------------
  function buildAnalyticsContext(subjectLabel) {
    if (!window.LearningAnalytics?.getStats || !window.LearningAnalytics?.getTopSubjects) {
      return null;
    }

    const stats = window.LearningAnalytics.getStats();
    if (stats.totalQuestions < 3) return null; // Not enough data

    const topSubjects = window.LearningAnalytics.getTopSubjects(3);
    const thisSubject = topSubjects.find(
      s => s.subject.toLowerCase() === subjectLabel.toLowerCase()
    );

    let ctx = `📈 LEARNING STATS: ${stats.totalQuestions} total questions asked`;
    ctx += ` | ${stats.subjectsCount} subjects studied`;
    ctx += ` | ${Math.round(stats.avgPerDay * 10) / 10} questions/day`;

    if (thisSubject) {
      ctx += ` | ${subjectLabel}: ${thisSubject.count} questions asked`;
    } else {
      ctx += ` | ${subjectLabel}: new subject (first time)`;
    }

    // Gamification data
    if (window.Gamification?.getProgress) {
      try {
        const progress = window.Gamification.getProgress();
        if (progress?.points) ctx += ` | Points: ${progress.points}`;
        if (progress?.level) ctx += ` | Level: ${progress.level}`;
      } catch (e) { /* ignore */ }
    }

    return ctx;
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.AIContext = {
    build,
    // Exposed for debugging
    buildProfileContext,
    buildAcademicContext,
    buildAssignmentsContext,
    buildGradesContext,
    buildSubjectSpecificContext,
    buildAnalyticsContext,
  };

  console.log('✅ AI Context Aggregator loaded — modular context injection ready');
})();
