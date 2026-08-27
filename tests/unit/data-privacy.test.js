// tests/unit/data-privacy.test.js
// Unit tests for FERPA & GDPR Data Privacy & Anonymization Exporter

describe('FERPA & GDPR Data Privacy Exporter', () => {
  beforeEach(() => {
    localStorage.clear();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-privacy-url');
    global.URL.revokeObjectURL = jest.fn();
    require('../../js/data-privacy.js');
  });

  test('Attaches to window and pseudonimizes identifiers', () => {
    expect(window.DataPrivacy).toBeDefined();
    expect(typeof window.DataPrivacy.anonymizeString).toBe('function');

    const anon = window.DataPrivacy.anonymizeString('arber.kelmendi@school.al');
    expect(anon).toMatch(/^std_[0-9a-f]+/);
    expect(anon).not.toContain('arber');
    expect(anon).not.toContain('kelmendi');
  });

  test('Exports sanitized dataset without PII', () => {
    localStorage.setItem('eduai_attendance_records', JSON.stringify([
      { studentId: 'student_john_doe', name: 'John Doe', date: '2026-08-27', status: 'present' }
    ]));

    const report = window.DataPrivacy.exportSanitizedDataset();

    expect(report.compliance).toContain('GDPR / FERPA');
    expect(report.attendanceLedger.length).toBe(1);
    expect(report.attendanceLedger[0].name).toBeUndefined();
    expect(report.attendanceLedger[0].anonymousId).toMatch(/^std_/);
  });
});
