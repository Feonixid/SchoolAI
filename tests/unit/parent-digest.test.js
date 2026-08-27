// tests/unit/parent-digest.test.js
// Unit tests for Parent Offline Progress Card & SMS Exporter

describe('Parent Offline Progress Card & SMS Exporter', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/parent-digest.js');
  });

  test('Generates structured parent progress digest formatted for SMS/WhatsApp', () => {
    expect(window.ParentDigest).toBeDefined();
    const digest = window.ParentDigest.generateParentDigest(
      { firstName: 'Arbër', lastName: 'Kelmendi', gradeLevel: 10 },
      { attendancePct: 98, points: 520, activeChapter: 'Ekuacionet Kuadratike' }
    );

    expect(digest.name).toBe('Arbër Kelmendi');
    expect(digest.attendance).toBe(98);
    expect(digest.textSms).toContain('Raporti Javor');
    expect(digest.textSms).toContain('98%');
    expect(digest.textSms).toContain('Ekuacionet Kuadratike');
  });
});
