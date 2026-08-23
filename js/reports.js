// js/reports.js
// ===================================================================
// PDF REPORT GENERATION SYSTEM
// Generate professional report cards and progress reports
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Generate individual student report card (HTML-based, ready for print/PDF)
  function generateStudentReport(studentId) {
    const student = state.students.list.find(s => s.id === studentId);
    if (!student) {
      alert('❌ Student not found');
      return;
    }

    // Initialize student structure
    if (!student.semesters) {
      student.semesters = {
        semester1: { detyra: [], projekti: null, testi: null },
        semester2: { detyra: [], projekti: null, testi: null },
        semester3: { detyra: [], projekti: null, testi: null }
      };
    }

    // Calculate averages
    const calculateSemAvg = (sem) => {
      const grades = [...sem.detyra];
      if (sem.projekti !== null) grades.push(sem.projekti);
      if (sem.testi !== null) grades.push(sem.testi);
      if (grades.length === 0) return null;
      return grades.reduce((a, b) => a + b, 0) / grades.length;
    };

    const sem1Avg = calculateSemAvg(student.semesters.semester1);
    const sem2Avg = calculateSemAvg(student.semesters.semester2);
    const sem3Avg = calculateSemAvg(student.semesters.semester3);

    // Get attendance stats
    const attendanceStats = window.Attendance ?
      window.Attendance.getAttendanceStats(studentId) :
      { present: 0, absent: 0, late: 0, attendanceRate: 0 };

    // Get behavior summary
    const behaviorSummary = window.Behavior ?
      window.Behavior.getBehaviorSummary(studentId) :
      { positive: 0, negative: 0, participation: 0 };

    // Get conduct scores
    const getConductScore = (semester) => {
      if (!window.Behavior) return null;
      return window.Behavior.getConductScore(studentId, semester);
    };

    const curr = window.CurriculumRAG ? window.CurriculumRAG.getCurriculum() : null;
    const currName = curr ? curr.name : 'Kurrikula Kombëtare (MAS)';
    const currScale = curr ? curr.gradingScale : '1-10';

    const formatGrade = (avg) => {
      if (avg === null || avg === undefined) return '-';
      const num = avg.toFixed(2);
      if (window.getGradeLabel) {
        const gl = window.getGradeLabel(avg);
        const label = gl.sq || gl.en || '';
        return `${num} <span style="font-size:11px;color:#6b7280;font-weight:500">(${label})</span>`;
      }
      return num;
    };

    // Open report in new window
    const reportWindow = window.open('', '_blank', 'width=800,height=1000');

    reportWindow.document.write(`
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="utf-8">
  <title>Raport i Nxënësit - ${student.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      max-width: 210mm;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 18px;
      margin-bottom: 20px;
      position: relative;
    }
    .school-name {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .report-title {
      font-size: 15px;
      font-weight: 600;
      color: #007aff;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .curriculum-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 10px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      font-size: 11.5px;
      color: #4b5563;
      font-weight: 500;
    }
    .student-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 14px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .info-item label {
      display: block;
      font-size: 10.5px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-item span {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 20px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .grades-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .grades-table th {
      background: #f3f4f6;
      color: #374151;
      font-size: 12px;
      font-weight: 600;
      padding: 10px 12px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .grades-table td {
      padding: 10px 12px;
      text-align: center;
      font-size: 13px;
      border-bottom: 1px solid #f3f4f6;
    }
    .grades-table tr:last-child td { border-bottom: none; }
    .grade-excellent { color: #16a34a; font-weight: 700; }
    .grade-good { color: #0284c7; font-weight: 700; }
    .grade-average { color: #d97706; font-weight: 700; }
    .grade-poor { color: #dc2626; font-weight: 700; }
    .final-row {
      background: #007aff !important;
      color: #ffffff !important;
    }
    .final-row td {
      font-weight: 800;
      font-size: 14px;
      color: #ffffff !important;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 12px;
      border-radius: 10px;
      text-align: center;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 11px;
      color: #6b7280;
      font-weight: 500;
      margin-top: 2px;
    }
    .notes-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 12.5px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 16px;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 16px;
    }
    .sig-box {
      width: 40%;
      text-align: center;
      border-top: 1.5px solid #9ca3af;
      padding-top: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
    }
    .footer {
      text-align: center;
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #f3f4f6;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">Arsakeio e Tiranës</div>
    <div class="report-title">Dëshmi e Përparimit Akademik</div>
    <div class="curriculum-badge">Sistemi: ${currName} · Shkalla: ${currScale}</div>
  </div>

  <div class="student-info-grid">
    <div class="info-item">
      <label>Nxënësi</label>
      <span>${student.name || 'N/A'}</span>
    </div>
    <div class="info-item">
      <label>Klasa</label>
      <span>${student.gradeLevel ? `Klasa ${student.gradeLevel}` : 'N/A'}</span>
    </div>
    <div class="info-item">
      <label>Data e Gjenerimit</label>
      <span>${new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
    </div>
  </div>

  <div class="section-title">📊 Vlerësimi Periodik & Notat</div>
  
  <table class="grades-table">
    <thead>
      <tr>
        <th style="text-align:left">Periudha</th>
        <th>Detyra Kursi</th>
        <th>Projekti</th>
        <th>Testi</th>
        <th>Mesatarja</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:left"><strong>Semestri 1</strong></td>
        <td>${student.semesters.semester1.detyra.length} detyra</td>
        <td>${student.semesters.semester1.projekti !== null ? student.semesters.semester1.projekti.toFixed(1) : '-'}</td>
        <td>${student.semesters.semester1.testi !== null ? student.semesters.semester1.testi.toFixed(1) : '-'}</td>
        <td class="${getGradeClass(sem1Avg)}">${formatGrade(sem1Avg)}</td>
      </tr>
      <tr>
        <td style="text-align:left"><strong>Semestri 2</strong></td>
        <td>${student.semesters.semester2.detyra.length} detyra</td>
        <td>${student.semesters.semester2.projekti !== null ? student.semesters.semester2.projekti.toFixed(1) : '-'}</td>
        <td>${student.semesters.semester2.testi !== null ? student.semesters.semester2.testi.toFixed(1) : '-'}</td>
        <td class="${getGradeClass(sem2Avg)}">${formatGrade(sem2Avg)}</td>
      </tr>
      <tr>
        <td style="text-align:left"><strong>Semestri 3</strong></td>
        <td>${student.semesters.semester3.detyra.length} detyra</td>
        <td>${student.semesters.semester3.projekti !== null ? student.semesters.semester3.projekti.toFixed(1) : '-'}</td>
        <td>${student.semesters.semester3.testi !== null ? student.semesters.semester3.testi.toFixed(1) : '-'}</td>
        <td class="${getGradeClass(sem3Avg)}">${formatGrade(sem3Avg)}</td>
      </tr>
      <tr class="final-row">
        <td colspan="4" style="text-align:left">MESATARJA PËRFUNDIMTARE</td>
        <td>${student.finalAverage !== null ? student.finalAverage.toFixed(2) : '-'}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">📅 Pjesëmarrja & Sjellja</div>
  
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value" style="color:#16a34a;">${attendanceStats.present}</div>
      <div class="stat-label">Ditë Prezent</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#dc2626;">${attendanceStats.absent}</div>
      <div class="stat-label">Mungesa</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#007aff;">${attendanceStats.attendanceRate}%</div>
      <div class="stat-label">Norma e Pjesëmarrjes</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value" style="color:#16a34a;">${behaviorSummary.positive}</div>
      <div class="stat-label">Shënime Pozitive</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#0284c7;">${behaviorSummary.participation}</div>
      <div class="stat-label">Pjesëmarrje Aktive</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#dc2626;">${behaviorSummary.negative}</div>
      <div class="stat-label">Vërejtje</div>
    </div>
  </div>

  ${student.teacherNotes ? `
  <div class="section-title">💬 Komenti i Mësuesit Kujdestar</div>
  <div class="notes-card">
    <p style="margin:0;white-space:pre-wrap;">${student.teacherNotes}</p>
  </div>
  ` : ''}

  ${student.aiNotes ? `
  <div class="section-title">🤖 Analiza Pedagogjike e Inteligjencës Artificiale</div>
  <div class="notes-card" style="background:#f0f9ff;border-color:#bae6fd;color:#0369a1">
    <p style="margin:0;">${student.aiNotes}</p>
  </div>
  ` : ''}

  <div class="signatures">
    <div class="sig-box">Mësuesi Kujdestar / Lëndor</div>
    <div class="sig-box">Drejtoria e Shkollës</div>
  </div>

  <div class="footer">
    EduAI Platform · Arsakeio e Tiranës · Raport i vlefshëm akademik
  </div>

  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:10px 22px;background:#007aff;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;box-shadow:0 2px 8px rgba(0,122,255,0.3)">
      🖨️ Printo / Shkarko PDF
    </button>
    <button onclick="window.close()" style="padding:10px 22px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;margin-left:8px">
      Mbyll
    </button>
  </div>
</body>
</html>
    `);

    reportWindow.document.close();

    // Helper function for grade coloring (dynamic to active grading system)
    function getGradeClass(avg) {
      if (avg === null) return '';
      if (window.getGradeLabel) {
        const gl = window.getGradeLabel(avg);
        if (gl.en === 'Excellent' || gl.en === 'Very Good' || gl.en === 'First Class') return 'grade-excellent';
        if (gl.en === 'Good' || gl.en === 'Upper Second') return 'grade-good';
        if (gl.en === 'Satisfactory' || gl.en === 'Average' || gl.en === 'Fairly Good' || gl.en === 'Lower Second' || gl.en === 'Fair' || gl.en === 'Pass') return 'grade-average';
        return 'grade-poor';
      }
      if (avg >= 9) return 'grade-excellent';
      if (avg >= 7) return 'grade-good';
      if (avg >= 5) return 'grade-average';
      return 'grade-poor';
    }
  }

  // Generate bulk report cards for all students in a class
  function generateBulkReports(gradeLevel) {
    if (!gradeLevel) {
      alert('WARNING: Ju lutem zgjidhni një klasë.');
      return;
    }

    const students = state.students.list.filter(s => s.gradeLevel === gradeLevel);

    if (students.length === 0) {
      alert('WARNING: Nuk ka nxënës në këtë klasë.');
      return;
    }

    // Create a combined report window with all student reports
    const reportWindow = window.open('', '_blank', 'width=800,height=1000');

    const calculateSemAvg = (sem) => {
      const grades = [...sem.detyra];
      if (sem.projekti !== null) grades.push(sem.projekti);
      if (sem.testi !== null) grades.push(sem.testi);
      if (grades.length === 0) return null;
      return grades.reduce((a, b) => a + b, 0) / grades.length;
    };

    const getGradeClass = (avg) => {
      if (avg === null) return '';
      if (window.getGradeLabel) {
        const gl = window.getGradeLabel(avg);
        if (gl.en === 'Excellent' || gl.en === 'Very Good' || gl.en === 'First Class') return 'grade-excellent';
        if (gl.en === 'Good' || gl.en === 'Upper Second') return 'grade-good';
        if (gl.en === 'Satisfactory' || gl.en === 'Average' || gl.en === 'Fairly Good' || gl.en === 'Lower Second' || gl.en === 'Fair' || gl.en === 'Pass') return 'grade-average';
        return 'grade-poor';
      }
      if (avg >= 9) return 'grade-excellent';
      if (avg >= 7) return 'grade-good';
      if (avg >= 5) return 'grade-average';
      return 'grade-poor';
    };

    // Generate all student reports in one document
    let allReportsHTML = `
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="utf-8">
  <title>Kartela të Nxënësve - Klasa ${gradeLevel}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Georgia', serif; line-height: 1.5; color: #2c3e50; background: white; }
    .report-card { page-break-after: always; padding: 20px; border-bottom: 3px solid #3498db; margin-bottom: 30px; }
    .report-card:last-child { page-break-after: auto; border-bottom: none; }
    .header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 15px; margin-bottom: 20px; }
    .school-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .report-title { font-size: 16px; color: #7f8c8d; }
    .student-info { background: #ecf0f1; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
    .student-name { font-size: 20px; font-weight: bold; color: #2c3e50; }
    .grades-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .grades-table th, .grades-table td { border: 1px solid #bdc3c7; padding: 8px; text-align: center; }
    .grades-table th { background: #3498db; color: white; }
    .grades-table tr:nth-child(even) { background: #ecf0f1; }
    .grade-excellent { color: #27ae60; font-weight: bold; }
    .grade-good { color: #2980b9; font-weight: bold; }
    .grade-average { color: #f39c12; font-weight: bold; }
    .grade-poor { color: #e74c3c; font-weight: bold; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
    .stat-box { background: #ecf0f1; padding: 10px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #3498db; }
    .stat-label { font-size: 10px; color: #7f8c8d; text-transform: uppercase; }
    .final-average { font-size: 28px; font-weight: bold; text-align: center; padding: 15px; background: #3498db; color: white; border-radius: 8px; margin-top: 15px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
`;

    students.forEach(student => {
      if (!student.semesters) {
        student.semesters = {
          semester1: { detyra: [], projekti: null, testi: null },
          semester2: { detyra: [], projekti: null, testi: null },
          semester3: { detyra: [], projekti: null, testi: null }
        };
      }

      const sem1Avg = calculateSemAvg(student.semesters.semester1);
      const sem2Avg = calculateSemAvg(student.semesters.semester2);
      const sem3Avg = calculateSemAvg(student.semesters.semester3);

      const attendanceStats = window.Attendance ? window.Attendance.getAttendanceStats(student.id) : { present: 0, absent: 0, late: 0, attendanceRate: 0 };
      const behaviorSummary = window.Behavior ? window.Behavior.getBehaviorSummary(student.id) : { positive: 0, negative: 0, participation: 0 };

      allReportsHTML += `
  <div class="report-card">
    <div class="header">
      <div class="school-name">Arsakeio e Tiranës</div>
      <div class="report-title">Kartelë Vlerësimi - Klasa ${gradeLevel}</div>
      <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
        ${new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>

    <div class="student-info">
      <div class="student-name">${student.name}</div>
      <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">Klasa: ${gradeLevel} | ID: ${student.id}</div>
    </div>

    <table class="grades-table">
      <thead>
        <tr>
          <th>Semestri</th>
          <th>Detyra (Nr)</th>
          <th>Projekti</th>
          <th>Testi</th>
          <th>Mesatarja</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Semestri 1</strong></td>
          <td>${student.semesters.semester1.detyra.length}</td>
          <td>${student.semesters.semester1.projekti ?? '-'}</td>
          <td>${student.semesters.semester1.testi ?? '-'}</td>
          <td class="${getGradeClass(sem1Avg)}">${sem1Avg !== null ? sem1Avg.toFixed(2) : '-'}</td>
        </tr>
        <tr>
          <td><strong>Semestri 2</strong></td>
          <td>${student.semesters.semester2.detyra.length}</td>
          <td>${student.semesters.semester2.projekti ?? '-'}</td>
          <td>${student.semesters.semester2.testi ?? '-'}</td>
          <td class="${getGradeClass(sem2Avg)}">${sem2Avg !== null ? sem2Avg.toFixed(2) : '-'}</td>
        </tr>
        <tr>
          <td><strong>Semestri 3</strong></td>
          <td>${student.semesters.semester3.detyra.length}</td>
          <td>${student.semesters.semester3.projekti ?? '-'}</td>
          <td>${student.semesters.semester3.testi ?? '-'}</td>
          <td class="${getGradeClass(sem3Avg)}">${sem3Avg !== null ? sem3Avg.toFixed(2) : '-'}</td>
        </tr>
      </tbody>
    </table>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value" style="color: #27ae60;">${attendanceStats.present}</div>
        <div class="stat-label">Prezent</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #e74c3c;">${attendanceStats.absent}</div>
        <div class="stat-label">Mungon</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #27ae60;">${behaviorSummary.positive}</div>
        <div class="stat-label">Pozitiv</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color: #e74c3c;">${behaviorSummary.negative}</div>
        <div class="stat-label">Negativ</div>
      </div>
    </div>

    <div class="final-average ${getGradeClass(student.finalAverage)}">
      Mesatarja Finale: ${student.finalAverage !== null ? student.finalAverage.toFixed(2) : '-'}
    </div>

    ${student.teacherNotes ? `<div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 6px;"><strong>Shënime Mësuesi:</strong> ${student.teacherNotes}</div>` : ''}
  </div>
`;
    });

    allReportsHTML += `
  <div class="no-print" style="text-align: center; padding: 20px;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
      PRINTO TË GJITHA
    </button>
    <button onclick="window.close()" style="padding: 12px 24px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
      Mbyll
    </button>
  </div>
</body>
</html>
`;

    reportWindow.document.write(allReportsHTML);
    reportWindow.document.close();

    console.log(`Generated bulk reports for ${students.length} students in class ${gradeLevel}`);
  }

  // Generate class summary report
  function generateClassReport(gradeLevel) {
    if (!gradeLevel) {
      alert('⚠️ Ju lutem zgjidhni një klasë.');
      return;
    }

    const students = state.students.list.filter(s => s.gradeLevel === gradeLevel);

    if (students.length === 0) {
      alert('⚠️ Nuk ka nxënës në këtë klasë.');
      return;
    }

    // Calculate class statistics
    const stats = {
      total: students.length,
      withGrades: 0,
      classAverage: 0,
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    };

    let totalAvg = 0;

    students.forEach(s => {
      if (s.finalAverage !== null) {
        stats.withGrades++;
        totalAvg += s.finalAverage;

        if (s.finalAverage >= 9) stats.excellent++;
        else if (s.finalAverage >= 7) stats.good++;
        else if (s.finalAverage >= 5) stats.average++;
        else stats.poor++;
      }
    });

    if (stats.withGrades > 0) {
      stats.classAverage = (totalAvg / stats.withGrades).toFixed(2);
    }

    // Open report in new window
    const reportWindow = window.open('', '_blank', 'width=900,height=1000');

    reportWindow.document.write(`
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="utf-8">
  <title>Raport i Klasës ${gradeLevel}</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #2c3e50;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #3498db;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .school-name {
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .stat-box {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
    }
    
    .students-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .students-table th,
    .students-table td {
      border: 1px solid #bdc3c7;
      padding: 10px;
      text-align: left;
    }
    
    .students-table th {
      background: #3498db;
      color: white;
      font-weight: bold;
    }
    
    .students-table tr:nth-child(even) {
      background: #ecf0f1;
    }
    
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">Arsakeio e Tiranës</div>
    <div style="font-size: 20px; color: #7f8c8d;">Raport i Klasës ${gradeLevel}</div>
    <div style="font-size: 14px; color: #7f8c8d; margin-top: 10px;">
      ${new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">Total Nxënës</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.classAverage}</div>
      <div class="stat-label">Mesatarja e Klasës</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: #27ae60;">${stats.excellent}</div>
      <div class="stat-label">Shkëlqyeshëm (9-10)</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color: #f39c12;">${stats.good}</div>
      <div class="stat-label">Mirë (7-8.9)</div>
    </div>
  </div>

  <table class="students-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Emri</th>
        <th>Sem 1</th>
        <th>Sem 2</th>
        <th>Sem 3</th>
        <th>Mesatarja Finale</th>
      </tr>
    </thead>
    <tbody>
      ${students.sort((a, b) => (b.finalAverage || 0) - (a.finalAverage || 0)).map((s, idx) => {
      const calcSemAvg = (sem) => {
        const grades = [...sem.detyra];
        if (sem.projekti !== null) grades.push(sem.projekti);
        if (sem.testi !== null) grades.push(sem.testi);
        if (grades.length === 0) return null;
        return grades.reduce((a, b) => a + b, 0) / grades.length;
      };

      const sem1 = s.semesters ? calcSemAvg(s.semesters.semester1) : null;
      const sem2 = s.semesters ? calcSemAvg(s.semesters.semester2) : null;
      const sem3 = s.semesters ? calcSemAvg(s.semesters.semester3) : null;

      return `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td>${sem1 !== null ? sem1.toFixed(2) : '-'}</td>
            <td>${sem2 !== null ? sem2.toFixed(2) : '-'}</td>
            <td>${sem3 !== null ? sem3.toFixed(2) : '-'}</td>
            <td><strong>${s.finalAverage !== null ? s.finalAverage.toFixed(2) : '-'}</strong></td>
          </tr>
        `;
    }).join('')}
    </tbody>
  </table>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
      🖨️ Printo Raportin
    </button>
    <button onclick="window.close()" style="padding: 12px 24px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
      Mbyll
    </button>
  </div>
</body>
</html>
    `);

    reportWindow.document.close();
  }

  // Add reports button to student modal
  function enhanceStudentModalWithReports() {
    const originalOpenStudentModal = window.openStudentModal;
    if (!originalOpenStudentModal) return;

    window.openStudentModal = function (studentId) {
      originalOpenStudentModal(studentId);

      setTimeout(() => {
        const modal = document.getElementById('studentModal');
        if (!modal) return;

        if (modal.querySelector('#generateReportBtn')) return;

        const modalFooter = modal.querySelector('.modalFooter');
        if (!modalFooter) return;

        const reportBtn = document.createElement('button');
        reportBtn.id = 'generateReportBtn';
        reportBtn.className = 'btn-primary';
        reportBtn.style.marginRight = '8px';
        reportBtn.textContent = '📄 Gjenero Raport PDF';

        reportBtn.addEventListener('click', () => {
          generateStudentReport(studentId);
        });

        const buttonsDiv = modalFooter.querySelector('.modalButtons');
        if (buttonsDiv) {
          buttonsDiv.insertBefore(reportBtn, buttonsDiv.firstChild);
        }
      }, 250);
    };
  }

  // Add reports button to teacher panel
  function initializeReportsUI() {
    const featureContainer = document.getElementById('teacherFeatureButtons');
    if (!featureContainer) return;

    if (document.getElementById('generateClassReportBtn')) return;

    const section = document.createElement('div');
    section.style.marginTop = '16px';
    section.innerHTML = `
    <h3 class="panel-title">📄 Raporte</h3>
    <div class="quizControls exportControls">
      <button id="generateClassReportBtn" class="quizBtn">📊 Raport Klase (PDF)</button>
      <button id="generateBulkReportsBtn" class="quizBtn">📑 Kartela për të Gjithë</button>
      <button id="exportStudentsBtn" class="quizBtn">💾 Eksporto CSV</button>
    </div>
  `;

    featureContainer.appendChild(section);

    // Wire buttons
    document.getElementById('generateClassReportBtn').addEventListener('click', () => {
      if (!state.academic.activeGrade) {
        alert('⚠️ Ju lutem zgjidhni një klasë.');
        return;
      }
      generateClassReport(state.academic.activeGrade);
    });

    document.getElementById('generateBulkReportsBtn').addEventListener('click', () => {
      if (!state.academic.activeGrade) {
        alert('⚠️ Ju lutem zgjidhni një klasë.');
        return;
      }
      generateBulkReports(state.academic.activeGrade);
    });

    document.getElementById('exportStudentsBtn').addEventListener('click', () => {
      // Export CSV logic from quiz.js
      if (!Array.isArray(state.students.list) || !state.students.list.length) {
        alert('Nuk ka nxënës për eksport.');
        return;
      }

      const calcSemAvg = (sem) => {
        const grades = [...sem.detyra];
        if (sem.projekti !== null) grades.push(sem.projekti);
        if (sem.testi !== null) grades.push(sem.testi);
        if (grades.length === 0) return '';
        return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
      };

      const rows = [];
      rows.push([
        'ID', 'Emri i plotë', 'Klasa',
        'Sem1 Detyra', 'Sem1 Projekti', 'Sem1 Testi', 'Sem1 Mesatarja',
        'Sem2 Detyra', 'Sem2 Projekti', 'Sem2 Testi', 'Sem2 Mesatarja',
        'Sem3 Detyra', 'Sem3 Projekti', 'Sem3 Testi', 'Sem3 Mesatarja',
        'Mesatarja Finale', 'Shënime Mësuesi', 'Vlerësim AI'
      ]);

      state.students.list.forEach(s => {
        if (!s.semesters) {
          s.semesters = {
            semester1: { detyra: [], projekti: null, testi: null },
            semester2: { detyra: [], projekti: null, testi: null },
            semester3: { detyra: [], projekti: null, testi: null }
          };
        }

        rows.push([
          s.id, s.name || '', s.gradeLevel || '',
          s.semesters.semester1.detyra.length,
          s.semesters.semester1.projekti ?? '',
          s.semesters.semester1.testi ?? '',
          calcSemAvg(s.semesters.semester1),
          s.semesters.semester2.detyra.length,
          s.semesters.semester2.projekti ?? '',
          s.semesters.semester2.testi ?? '',
          calcSemAvg(s.semesters.semester2),
          s.semesters.semester3.detyra.length,
          s.semesters.semester3.projekti ?? '',
          s.semesters.semester3.testi ?? '',
          calcSemAvg(s.semesters.semester3),
          s.finalAverage !== null ? s.finalAverage.toFixed(2) : '',
          s.teacherNotes || '',
          s.aiNotes || ''
        ]);
      });

      const csv = rows.map(r =>
        r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nxenesit_arsakeio.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Students exported to CSV');
    });
  }

  // Initialize when teacher mode is activated
  window.addEventListener('DOMContentLoaded', () => {
    enhanceStudentModalWithReports();

    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(initializeReportsUI, 100);
        }
      };
    }
  });

  // Export functions
  window.Reports = {
    generateStudentReport,
    generateClassReport,
    generateBulkReports
  };

  console.log('✅ Reports module initialized');
})();
