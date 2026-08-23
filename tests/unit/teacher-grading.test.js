// tests/unit/teacher-grading.test.js
// Unit tests for Teacher Assignment Grading & Rubric Studio
// ===================================================================

describe('Teacher Assignment Grading & Rubric Studio', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openTeacherGradingSidebarBtn"></div>
    `;
    require('../../js/teacher-grading.js');
  });

  test('TeacherGrading is exposed and opens/closes modal correctly', () => {
    expect(window.TeacherGrading).toBeDefined();
    expect(typeof window.TeacherGrading.open).toBe('function');
    expect(typeof window.TeacherGrading.close).toBe('function');

    window.TeacherGrading.open();
    const overlay = document.getElementById('teacherGradingOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const nameEl = document.getElementById('viewingStudentName');
    expect(nameEl.textContent).not.toBe('--');

    window.TeacherGrading.close();
    expect(overlay.style.display).toBe('none');
  });

  test('AI Assist populates feedback and updates scores', () => {
    window.TeacherGrading.open();
    const aiBtn = document.getElementById('gradingAiAssistBtn');
    expect(aiBtn).not.toBeNull();
    aiBtn.click();

    const commBox = document.getElementById('gradingTeacherComment');
    expect(commBox.value).toContain('Punë e plotë');

    const scoreBadge = document.getElementById('gradingScoreBadge');
    expect(parseInt(scoreBadge.textContent, 10)).toBeGreaterThan(80);

    const saveBtn = document.getElementById('gradingSaveBtn');
    saveBtn.click();
    window.TeacherGrading.close();
  });
});
