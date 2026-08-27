// js/school-scheduler.js
// ===================================================================
// AUTONOMOUS PRINCIPAL, TIMETABLE SCHEDULER & AT-RISK DETECTOR
// Builds conflict-free master school timetables, handles automated substitute
// teacher emergency lessons, and computes early dropout risk warnings.
// ===================================================================

(function () {
  'use strict';

  const DAYS = ['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte'];
  const PERIODS = [
    { period: 1, time: '08:00 - 08:45' },
    { period: 2, time: '08:50 - 09:35' },
    { period: 3, time: '09:50 - 10:35' },
    { period: 4, time: '10:40 - 11:25' },
    { period: 5, time: '11:40 - 12:25' },
    { period: 6, time: '12:30 - 13:15' }
  ];

  /**
   * Generates an autonomous, conflict-free weekly timetable for a given grade
   */
  function generateMasterTimetable(grade = 10, subjects = ['Matematikë', 'Fizikë', 'Kimi', 'Biologji', 'Gjuhë Shqipe', 'Histori', 'Informatikë']) {
    const timetable = {};

    DAYS.forEach((day, dIdx) => {
      timetable[day] = [];
      PERIODS.forEach((p, pIdx) => {
        const subjIndex = (dIdx * 2 + pIdx) % subjects.length;
        timetable[day].push({
          period: p.period,
          time: p.time,
          subject: subjects[subjIndex],
          room: `Klasa ${grade}A (Dhoma ${100 + grade})`,
          teacher: `Prof. ${subjects[subjIndex].slice(0, 3)}. Auto-Assigned`
        });
      });
    });

    return {
      grade,
      generatedAt: new Date().toISOString(),
      schedule: timetable
    };
  }

  /**
   * Generates a self-running substitute lesson when a teacher is unexpectedly absent
   */
  function generateEmergencySubstitutePlan(subject = 'Fizikë', grade = 10, topic = 'Ligjet e Njutonit') {
    return {
      type: 'AUTONOMOUS_SUBSTITUTE_SESSION',
      subject,
      grade,
      topic,
      durationMin: 45,
      instructionForClassLeader: 'Projektoni këtë plan në ekranin kryesor dhe filloni me Fazën 1.',
      phases: [
        {
          phase: '1. Hyrje & Video/Tekst (0-10m)',
          instructions: `Lexoni Kapitullin "${topic}" nga biblioteka digjitale e librit.`
        },
        {
          phase: '2. Laboratori Interaktiv (10-25m)',
          instructions: 'Hapni simulatorin e fizikës në tabletat tuaja dhe kryeni 3 eksperimente me forca të ndryshme.'
        },
        {
          phase: '3. Kuici në Çifte (25-35m)',
          instructions: 'Filloni një seancë Quiz Battle në modalitetin me 2 lojtarë.'
        },
        {
          phase: '4. Bileta e Daljes (35-45m)',
          instructions: 'Dorëzoni zgjidhjen e 2 ushtrimeve tek Asistenti i Mësimit Aktiv për vlerësim automatik.'
        }
      ]
    };
  }

  /**
   * Evaluates student metrics and flags at-risk students for academic or dropout danger
   */
  function computeAtRiskIndex(studentMetrics = {}) {
    const {
      attendancePct = 95,
      averageGrade = 8.5,
      missedAssignments = 0,
      daysInactive = 0
    } = studentMetrics;

    let riskScore = 0; // 0 to 100

    // Attendance weighting (40%)
    if (attendancePct < 75) riskScore += 40;
    else if (attendancePct < 85) riskScore += 20;

    // Academic grade weighting (30%)
    if (averageGrade < 5.0) riskScore += 30;
    else if (averageGrade < 6.0) riskScore += 15;

    // Missed assignments (20%)
    if (missedAssignments >= 3) riskScore += 20;
    else if (missedAssignments >= 1) riskScore += 10;

    // Inactivity (10%)
    if (daysInactive >= 5) riskScore += 10;

    let status = 'Low Risk (Normale)';
    let level = 'green';
    if (riskScore >= 60) {
      status = 'High Risk (Rrezik i Lartë Shkëputjeje)';
      level = 'red';
    } else if (riskScore >= 30) {
      status = 'Moderate Risk (Kërkohet Monitorim)';
      level = 'yellow';
    }

    return {
      riskScore,
      level,
      status,
      recommendations: riskScore >= 30 ? [
        'Organizo një takim të menjëhershëm me prindërit përmes Karta e Prindërve.',
        'Cakto detyra rikuperuese përmes Asistentit të Mësimit.',
        'Monitoro pjesëmarrjen ditore në 5 ditët e ardhshme.'
      ] : ['Progresi është i kënaqshëm. Vazhdo me ritmin aktual.']
    };
  }

  // Export
  window.SchoolScheduler = {
    DAYS,
    PERIODS,
    generateMasterTimetable,
    generateEmergencySubstitutePlan,
    computeAtRiskIndex
  };

  console.log('✅ Autonomous Principal, Timetable & Risk Scheduler loaded');
})();
