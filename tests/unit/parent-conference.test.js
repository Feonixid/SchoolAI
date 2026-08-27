// tests/unit/parent-conference.test.js
// Unit tests for Autonomous Parent Conference & Matura Predictor

describe('Autonomous Parent Conference & Matura Predictor', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/parent-conference.js');
  });

  test('Generates comprehensive term narrative and predicted Matura score', () => {
    expect(window.ParentConference).toBeDefined();
    expect(typeof window.ParentConference.generateTermReport).toBe('function');

    const report = window.ParentConference.generateTermReport(
      { firstName: 'Arbër', lastName: 'Kelmendi', gradeLevel: 12 },
      { attendancePct: 98, gpa: 9.4, points: 880, strongestSubject: 'Matematikë', growthSubject: 'Fizikë' }
    );

    expect(report.studentName).toBe('Arbër Kelmendi');
    expect(report.predictedMatura).toBeGreaterThanOrEqual(85);
    expect(report.narrative).toContain('Arbër');
    expect(report.narrative).toContain('Matematikë');
    expect(report.talkingPoints.length).toBeGreaterThanOrEqual(4);
  });
});
