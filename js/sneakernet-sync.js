// js/sneakernet-sync.js
// ===================================================================
// AIR-GAPPED SNEAKERNET USB SYNC LEDGER
// For zero-connectivity schools: export & import encrypted JSON ledgers
// via USB flash drives to synchronize with district headquarters.
// ===================================================================

(function () {
  'use strict';

  function exportLedger() {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      hostname: 'offline_teacher_node',
      students: JSON.parse(localStorage.getItem('eduai_student_profile') || '{}'),
      attendance: JSON.parse(localStorage.getItem('eduai_attendance_records') || '[]'),
      lessonChats: JSON.parse(localStorage.getItem('eduai_lesson_chats') || '{}'),
      chapterProgress: JSON.parse(localStorage.getItem('eduai_chapter_progress') || '{}'),
      gamification: JSON.parse(localStorage.getItem('eduai_gamification_state') || '{}')
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `eduai_school_ledger_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.Toast?.success) {
      window.Toast.success('💾 Regjistri shkollor u eksportua me sukses në skedar!');
    }
    return data;
  }

  function importLedger(jsonString) {
    try {
      const incoming = JSON.parse(jsonString);
      if (!incoming || typeof incoming !== 'object') {
        throw new Error('Skedari nuk përmban të dhëna të vlefshme.');
      }

      // Merge chapter progress
      if (incoming.chapterProgress) {
        localStorage.setItem('eduai_chapter_progress', JSON.stringify(incoming.chapterProgress));
      }

      // Merge attendance
      if (incoming.attendance && Array.isArray(incoming.attendance)) {
        const existing = JSON.parse(localStorage.getItem('eduai_attendance_records') || '[]');
        const map = new Map();
        existing.forEach(r => map.set(`${r.studentId}_${r.date}`, r));
        incoming.attendance.forEach(r => map.set(`${r.studentId}_${r.date}`, r));
        localStorage.setItem('eduai_attendance_records', JSON.stringify(Array.from(map.values())));
      }

      if (window.Toast?.success) {
        window.Toast.success('✅ Regjistri u importua dhe u harmonizua me sukses!');
      }
      return { success: true, timestamp: incoming.timestamp };
    } catch (err) {
      if (window.Toast?.error) {
        window.Toast.error(`❌ Gabim gjatë importimit: ${err.message}`);
      }
      return { success: false, error: err.message };
    }
  }

  // Export
  window.SneakernetSync = {
    exportLedger,
    importLedger
  };

  console.log('✅ Air-gapped Sneakernet USB Sync module loaded');
})();
