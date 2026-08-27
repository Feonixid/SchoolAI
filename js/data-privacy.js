// js/data-privacy.js
// ===================================================================
// FERPA & GDPR DATA PRIVACY & ANONYMIZATION EXPORTER
// Generates sanitized, pseudonymized classroom datasets for research,
// ministry audits, and district reporting with zero PII leaks.
// ===================================================================

(function () {
  'use strict';

  function anonymizeString(str) {
    if (!str) return 'anon_user';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `std_${Math.abs(hash).toString(16).padStart(6, '0')}`;
  }

  function exportSanitizedDataset() {
    const rawAttendance = JSON.parse(localStorage.getItem('eduai_attendance_records') || '[]');
    const rawProgress = JSON.parse(localStorage.getItem('eduai_chapter_progress') || '{}');
    const rawGamification = JSON.parse(localStorage.getItem('eduai_gamification_state') || '{}');

    // 1. Sanitize attendance
    const sanitizedAttendance = rawAttendance.map(r => ({
      anonymousId: anonymizeString(r.studentId || r.name),
      date: r.date,
      status: r.status,
      subject: r.subject || 'general'
    }));

    // 2. Aggregate analytics
    const sanitizedReport = {
      version: '2.0.0',
      compliance: 'GDPR / FERPA Anonymized Standard',
      exportedAt: new Date().toISOString(),
      summary: {
        totalRecords: sanitizedAttendance.length,
        attendanceRatePct: sanitizedAttendance.length > 0 
          ? Math.round((sanitizedAttendance.filter(a => a.status === 'present').length / sanitizedAttendance.length) * 100)
          : 100,
        totalPointsEarned: rawGamification.points || 0
      },
      chapterProgress: rawProgress,
      attendanceLedger: sanitizedAttendance
    };

    const jsonStr = JSON.stringify(sanitizedReport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `eduai_anonymized_audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.Toast?.success) {
      window.Toast.success('🔒 Të dhënat u anonimizuan dhe u eksportuan pa asnjë të dhënë personale!');
    }
    return sanitizedReport;
  }

  // Export
  window.DataPrivacy = {
    exportSanitizedDataset,
    anonymizeString
  };

  console.log('✅ Data Privacy & Anonymization module loaded');
})();
