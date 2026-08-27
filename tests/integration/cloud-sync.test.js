// tests/integration/cloud-sync.test.js
// Integration tests for Offline Classroom LAN & Cloud Sync Conflict Resolution Engine

describe('Offline Classroom LAN & Cloud Sync Conflict Resolution Engine', () => {
  const syncKey = process.env.CENTRAL_SYNC_KEY || 'eduai_cloud_sync_secret';

  // Mock server sync logic to test conflict resolution and payloads directly
  function resolveSyncConflict(existingItem, incomingItem, entityType) {
    if (!existingItem) return incomingItem;
    if (!incomingItem) return existingItem;

    const existingTime = existingItem.updatedAt || existingItem.timestamp || 0;
    const incomingTime = incomingItem.updatedAt || incomingItem.timestamp || 0;

    switch (entityType) {
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
          badges: Array.from(new Set([...(existingItem.badges || []), ...(incomingItem.badges || [])])),
          updatedAt: Math.max(existingTime, incomingTime, Date.now())
        };

      default:
        return incomingTime >= existingTime ? incomingItem : existingItem;
    }
  }

  test('Resolves attendance conflict using latest timestamp and note preservation', () => {
    const existing = { studentId: 'std_1', date: '2026-08-27', status: 'absent', updatedAt: 1000 };
    const incoming = { studentId: 'std_1', date: '2026-08-27', status: 'present', note: 'Erdhi në orën e dytë', updatedAt: 2000 };

    const resolved = resolveSyncConflict(existing, incoming, 'attendance');
    expect(resolved.status).toBe('present');
    expect(resolved.note).toBe('Erdhi në orën e dytë');
  });

  test('Reconciles submissions and preserves the latest grade', () => {
    const existing = { studentId: 'std_2', assignmentId: 'hw_1', score: 80, updatedAt: 1000 };
    const incoming = { studentId: 'std_2', assignmentId: 'hw_1', score: 95, updatedAt: 2000 };

    const resolved = resolveSyncConflict(existing, incoming, 'submissions');
    expect(resolved.score).toBe(95);
  });

  test('Merges gamification XP points and badges cumulatively', () => {
    const existing = { points: 150, streak: 3, badges: ['first_quiz'], updatedAt: 1000 };
    const incoming = { points: 220, streak: 5, badges: ['circuit_master'], updatedAt: 2000 };

    const resolved = resolveSyncConflict(existing, incoming, 'gamification');
    expect(resolved.points).toBe(220);
    expect(resolved.streak).toBe(5);
    expect(resolved.badges).toContain('first_quiz');
    expect(resolved.badges).toContain('circuit_master');
  });
});
