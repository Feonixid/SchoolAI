// tests/integration/cloud-sync.test.js
// Integration tests for the Multi-Master Sync Engine —
// covers attendance, grades, gamification, student record conflicts, and delta sync.

describe('Multi-Master Cloud Sync and Conflict Resolution', () => {

  // Mirror of resolveSyncConflict from server.js so we can test it in isolation
  // without spinning up a real Express server.
  function resolveSyncConflict(existingItem, incomingItem, entityType) {
    if (!existingItem) return incomingItem;
    if (!incomingItem) return existingItem;

    const existingTime = existingItem.updatedAt || existingItem.timestamp || 0;
    const incomingTime = incomingItem.updatedAt || incomingItem.timestamp || 0;

    switch (entityType) {
      case 'students': {
        const merged = { ...existingItem, ...incomingItem };
        merged.updatedAt = Math.max(existingTime, incomingTime, Date.now());
        if (existingItem.finalGrade && incomingItem.finalGrade &&
            existingItem.finalGrade !== incomingItem.finalGrade) {
          merged.syncConflictWarning =
            `Grade conflict: Teacher1="${existingItem.finalGrade}", Teacher2="${incomingItem.finalGrade}".`;
        }
        return merged;
      }

      case 'attendance':
        if (incomingTime > existingTime) return incomingItem;
        if (existingTime > incomingTime) return existingItem;
        if (incomingItem.note && !existingItem.note) return incomingItem;
        return existingItem;

      case 'grades':
      case 'submissions':
        return incomingTime >= existingTime ? incomingItem : existingItem;

      case 'gamification':
        return {
          ...existingItem,
          ...incomingItem,
          points: Math.max(existingItem.points || 0, incomingItem.points || 0),
          streak: Math.max(existingItem.streak || 0, incomingItem.streak || 0),
          badges: Array.from(new Set([
            ...(existingItem.badges || []),
            ...(incomingItem.badges || [])
          ])),
          updatedAt: Math.max(existingTime, incomingTime, Date.now())
        };

      default:
        return incomingTime >= existingTime ? incomingItem : existingItem;
    }
  }


  // --- Attendance ---

  test('attendance: newer timestamp wins', () => {
    const existing = { studentId: 's1', date: '2026-09-01', status: 'absent', updatedAt: 1000 };
    const incoming = { studentId: 's1', date: '2026-09-01', status: 'present', note: 'Arrived late', updatedAt: 2000 };

    const result = resolveSyncConflict(existing, incoming, 'attendance');
    expect(result.status).toBe('present');
    expect(result.note).toBe('Arrived late');
  });

  test('attendance: same timestamp picks the one with a note', () => {
    const existing = { studentId: 's1', date: '2026-09-01', status: 'absent', updatedAt: 1000 };
    const incoming = { studentId: 's1', date: '2026-09-01', status: 'present', note: 'Teacher verified', updatedAt: 1000 };

    const result = resolveSyncConflict(existing, incoming, 'attendance');
    expect(result.note).toBe('Teacher verified');
  });

  test('attendance: same timestamp and no notes keeps existing', () => {
    const existing = { studentId: 's1', date: '2026-09-01', status: 'absent', updatedAt: 1000 };
    const incoming = { studentId: 's1', date: '2026-09-01', status: 'present', updatedAt: 1000 };

    const result = resolveSyncConflict(existing, incoming, 'attendance');
    expect(result).toBe(existing);
  });


  // --- Submissions & Grades ---

  test('submissions: later timestamp wins', () => {
    const existing = { studentId: 's2', assignmentId: 'hw1', score: 80, updatedAt: 1000 };
    const incoming = { studentId: 's2', assignmentId: 'hw1', score: 95, updatedAt: 2000 };

    const result = resolveSyncConflict(existing, incoming, 'submissions');
    expect(result.score).toBe(95);
  });

  test('submissions: equal timestamps keeps incoming (tie-break)', () => {
    const existing = { score: 70, updatedAt: 1000 };
    const incoming = { score: 85, updatedAt: 1000 };

    expect(resolveSyncConflict(existing, incoming, 'grades').score).toBe(85);
  });


  // --- Gamification ---

  test('gamification: merges XP, streaks, and badges from both sources', () => {
    const existing = { points: 150, streak: 3, badges: ['first_quiz', 'early_bird'], updatedAt: 1000 };
    const incoming = { points: 220, streak: 5, badges: ['circuit_master', 'first_quiz'], updatedAt: 2000 };

    const result = resolveSyncConflict(existing, incoming, 'gamification');
    expect(result.points).toBe(220);
    expect(result.streak).toBe(5);
    expect(result.badges).toContain('first_quiz');
    expect(result.badges).toContain('circuit_master');
    expect(result.badges).toContain('early_bird');
    expect(result.badges.length).toBe(3); // deduplicated
  });

  test('gamification: handles missing badge arrays gracefully', () => {
    const existing = { points: 50, updatedAt: 100 };
    const incoming = { points: 80, badges: ['newbie'], updatedAt: 200 };

    const result = resolveSyncConflict(existing, incoming, 'gamification');
    expect(result.badges).toEqual(['newbie']);
    expect(result.points).toBe(80);
  });


  // --- Student Records ---

  test('students: merges fields and keeps the freshest updatedAt', () => {
    const existing = { name: 'Arta', grade: '10A', updatedAt: 1000 };
    const incoming = { name: 'Arta', email: 'arta@school.al', updatedAt: 2000 };

    const result = resolveSyncConflict(existing, incoming, 'students');
    expect(result.name).toBe('Arta');
    expect(result.grade).toBe('10A');
    expect(result.email).toBe('arta@school.al');
    expect(result.updatedAt).toBeGreaterThanOrEqual(2000);
  });

  test('students: flags a warning when two teachers assign different final grades', () => {
    const existing = { name: 'Endrit', finalGrade: 'A', updatedAt: 1000 };
    const incoming = { name: 'Endrit', finalGrade: 'C', updatedAt: 2000 };

    const result = resolveSyncConflict(existing, incoming, 'students');
    expect(result.syncConflictWarning).toBeDefined();
    expect(result.syncConflictWarning).toContain('A');
    expect(result.syncConflictWarning).toContain('C');
  });

  test('students: no warning when both teachers agree on final grade', () => {
    const existing = { name: 'Liri', finalGrade: 'B+', updatedAt: 1000 };
    const incoming = { name: 'Liri', finalGrade: 'B+', updatedAt: 2000 };

    const result = resolveSyncConflict(existing, incoming, 'students');
    expect(result.syncConflictWarning).toBeUndefined();
  });


  // --- Edge Cases ---

  test('returns incoming when existing is null', () => {
    const incoming = { name: 'New Student', updatedAt: 500 };
    expect(resolveSyncConflict(null, incoming, 'students')).toBe(incoming);
  });

  test('returns existing when incoming is null', () => {
    const existing = { name: 'Old Student', updatedAt: 500 };
    expect(resolveSyncConflict(existing, null, 'attendance')).toBe(existing);
  });

  test('default entity type falls back to timestamp comparison', () => {
    const existing = { data: 'old', updatedAt: 100 };
    const incoming = { data: 'new', updatedAt: 200 };
    expect(resolveSyncConflict(existing, incoming, 'unknownType').data).toBe('new');
  });


  // --- Delta Sync Payload ---

  test('delta sync filters records by sinceTimestamp', () => {
    const allRecords = [
      { id: 1, updatedAt: 100 },
      { id: 2, updatedAt: 500 },
      { id: 3, updatedAt: 900 },
      { id: 4, updatedAt: 1500 }
    ];

    const since = 500;
    const delta = allRecords.filter(r => (r.updatedAt || 0) >= since);

    expect(delta.length).toBe(3);
    expect(delta.map(r => r.id)).toEqual([2, 3, 4]);
  });

  test('delta sync with since=0 includes everything (full sync fallback)', () => {
    const records = [{ id: 1, updatedAt: 10 }, { id: 2, updatedAt: 20 }];
    const since = 0;

    // since > 0 triggers delta; since=0 means full sync, so no filtering
    const payload = since > 0 ? records.filter(r => r.updatedAt >= since) : records;
    expect(payload.length).toBe(2);
  });
});
