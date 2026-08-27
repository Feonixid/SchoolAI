// tests/unit/exam-lockdown.test.js
// Unit tests for Exam Lockdown & Anti-Cheat Integrity Engine

describe('Exam Lockdown & Anti-Cheat Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    require('../../js/exam-lockdown.js');
  });

  test('Attaches to window and starts/stops lockdown cleanly', () => {
    expect(window.ExamLockdown).toBeDefined();
    expect(typeof window.ExamLockdown.start).toBe('function');
    expect(typeof window.ExamLockdown.stop).toBe('function');

    window.ExamLockdown.start('Test Matematike');
    expect(window.ExamLockdown.isActive).toBe(true);

    const audit = window.ExamLockdown.stop();
    expect(window.ExamLockdown.isActive).toBe(false);
    expect(audit.examName).toBe('Test Matematike');
  });

  test('Tracks and logs window blur and tab switch violations', () => {
    window.ExamLockdown.start('Fizikë Provim');

    // Simulate window blur
    window.dispatchEvent(new Event('blur'));

    expect(window.ExamLockdown.violations).toBeGreaterThan(0);
    expect(window.ExamLockdown.log.length).toBeGreaterThan(0);
    expect(window.ExamLockdown.log[0]).toContain('Window Blur');

    const audit = window.ExamLockdown.stop();
    expect(audit.violations).toBeGreaterThan(0);

    const savedAudits = JSON.parse(localStorage.getItem('eduai_exam_audits'));
    expect(savedAudits.length).toBe(1);
  });
});
