// tests/unit/autonomous-grading.test.js
// Unit tests for Autonomous Auto-Grading & Diagnostic Remediation Copilot

describe('Autonomous Auto-Grading & Remediation Copilot', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/autonomous-grading.js');
  });

  test('Attaches to window and evaluates submission against rubric', () => {
    expect(window.AutonomousGrading).toBeDefined();
    expect(typeof window.AutonomousGrading.evaluateSubmission).toBe('function');
    expect(typeof window.AutonomousGrading.generateRemedialDrill).toBe('function');

    const result = window.AutonomousGrading.evaluateSubmission(
      'x = 3 dhe x = -2 sepse faktoruam shprehjen x^2 - x - 6 = 0.',
      {
        subject: 'Matematikë',
        grade: 10,
        topic: 'Ekuacionet Kuadratike',
        curriculum: 'albanian',
        expectedAnswer: 'x = 3',
        keywords: ['faktoruam', 'ekuacionet']
      }
    );

    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.passed).toBe(true);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  test('Identifies failing submissions and automatically attaches remedial mini-drill', () => {
    const result = window.AutonomousGrading.evaluateSubmission('', {
      subject: 'Fizikë',
      grade: 10,
      topic: 'Ligji i Dytë i Njutonit',
      curriculum: 'albanian'
    });

    expect(result.passed).toBe(false);
    expect(result.remediation).toBeDefined();
    expect(result.remediation.questions.length).toBe(3);
  });
});
