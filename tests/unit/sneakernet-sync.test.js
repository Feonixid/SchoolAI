// tests/unit/sneakernet-sync.test.js
// Unit tests for Air-Gapped Sneakernet USB Sync Ledger

describe('Air-Gapped Sneakernet USB Sync Ledger', () => {
  beforeEach(() => {
    localStorage.clear();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    require('../../js/sneakernet-sync.js');
  });

  test('Attaches to window and exports complete school ledger snapshot', () => {
    expect(window.SneakernetSync).toBeDefined();
    expect(typeof window.SneakernetSync.exportLedger).toBe('function');
    expect(typeof window.SneakernetSync.importLedger).toBe('function');

    localStorage.setItem('eduai_student_profile', JSON.stringify({ name: 'Test Student' }));
    const ledger = window.SneakernetSync.exportLedger();

    expect(ledger.version).toBe('2.0.0');
    expect(ledger.hostname).toBe('offline_teacher_node');
    expect(ledger.students.name).toBe('Test Student');
  });

  test('Imports and reconciles ledger data cleanly into localStorage', () => {
    const payload = JSON.stringify({
      version: '2.0.0',
      timestamp: Date.now(),
      chapterProgress: {
        'matematike_g10': [{ id: 'ch_1', title: 'Kapitulli 1', status: 'completed' }]
      },
      attendance: [
        { studentId: 'std_1', date: '2026-08-27', status: 'present' }
      ]
    });

    const res = window.SneakernetSync.importLedger(payload);
    expect(res.success).toBe(true);

    const savedProgress = JSON.parse(localStorage.getItem('eduai_chapter_progress'));
    expect(savedProgress['matematike_g10'][0].status).toBe('completed');

    const savedAttendance = JSON.parse(localStorage.getItem('eduai_attendance_records'));
    expect(savedAttendance.length).toBe(1);
    expect(savedAttendance[0].studentId).toBe('std_1');
  });

  test('Handles invalid or corrupted ledger gracefully', () => {
    const res = window.SneakernetSync.importLedger('invalid-json-structure');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
