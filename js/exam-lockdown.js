// js/exam-lockdown.js
// ===================================================================
// EXAM LOCKDOWN & ANTI-CHEATING INTEGRITY ENGINE
// Fullscreen enforcement, tab-switch / blur logging, clipboard blocking,
// and automated anti-cheat violation reporting to the teacher gradebook.
// ===================================================================

(function () {
  'use strict';

  let isLockdownActive = false;
  let violationCount = 0;
  let violationLog = [];
  let examSessionName = '';

  function startLockdown(examName = 'Provim Zyrtar') {
    isLockdownActive = true;
    violationCount = 0;
    violationLog = [];
    examSessionName = examName;

    // 1. Request Fullscreen if supported
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // 2. Attach Anti-Cheat Event Listeners
    window.addEventListener('blur', handleBlurEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', preventClipboard);
    document.addEventListener('cut', preventClipboard);
    document.addEventListener('paste', preventClipboard);
    document.addEventListener('contextmenu', preventContextMenu);

    // 3. Render Status Banner
    renderBanner();

    if (window.Toast?.warning) {
      window.Toast.warning('🔒 Modaliteti i Provimit Aktiv! Mos ndërroni dritare ose skeda.');
    }
  }

  function stopLockdown() {
    isLockdownActive = false;

    // Remove event listeners
    window.removeEventListener('blur', handleBlurEvent);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('copy', preventClipboard);
    document.removeEventListener('cut', preventClipboard);
    document.removeEventListener('paste', preventClipboard);
    document.removeEventListener('contextmenu', preventContextMenu);

    // Remove banner
    document.getElementById('examLockdownBanner')?.remove();

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // Persist final audit log
    const auditRecord = {
      examName: examSessionName,
      timestamp: Date.now(),
      violations: violationCount,
      log: violationLog
    };
    const pastAudits = JSON.parse(localStorage.getItem('eduai_exam_audits') || '[]');
    pastAudits.push(auditRecord);
    localStorage.setItem('eduai_exam_audits', JSON.stringify(pastAudits));

    return auditRecord;
  }

  function handleBlurEvent() {
    if (!isLockdownActive) return;
    recordViolation('Humbje e fokusit të dritares (Window Blur)');
  }

  function handleVisibilityChange() {
    if (!isLockdownActive) return;
    if (document.hidden) {
      recordViolation('Ndërrim skede ose minimizim (Tab Switch)');
    }
  }

  function preventClipboard(e) {
    if (!isLockdownActive) return;
    e.preventDefault();
    recordViolation('Përpjekje për Kopjim / Ngjitje (Copy/Paste blocked)');
  }

  function preventContextMenu(e) {
    if (!isLockdownActive) return;
    e.preventDefault();
  }

  function recordViolation(type) {
    violationCount++;
    const now = new Date().toLocaleTimeString();
    const entry = `[${now}] ${type}`;
    violationLog.push(entry);

    renderBanner();

    if (window.Toast?.error) {
      window.Toast.error(`⚠️ Paralajmërim Integriteti: ${type}! (Totali: ${violationCount})`);
    }
  }

  function renderBanner() {
    let banner = document.getElementById('examLockdownBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'examLockdownBanner';
      banner.className = 'exam-lockdown-banner';
      document.body.appendChild(banner);
    }

    const hasViolations = violationCount > 0;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:16px">🔒</span>
        <span style="font-weight:700;font-size:12.5px">${examSessionName}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px;background:${hasViolations ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'};color:${hasViolations ? '#ef4444' : '#10b981'}">
          ${hasViolations ? `🔴 ${violationCount} Shkelje të Regjistruara` : '🟢 Integritet i Pastër'}
        </span>
        <button id="btnEndExamLockdown" style="padding:4px 10px;font-size:11.5px;border-radius:6px;background:rgba(255,255,255,0.1);color:white;border:none;cursor:pointer">Dorëzo Provimin</button>
      </div>
    `;

    document.getElementById('btnEndExamLockdown')?.addEventListener('click', () => {
      if (confirm('A jeni të sigurt që dëshironi të dorëzoni provimin dhe të përfundoni seancën?')) {
        const audit = stopLockdown();
        if (window.Toast?.success) {
          window.Toast.success(`Provimi u dorëzua. Shkelje: ${audit.violations}.`);
        }
      }
    });
  }

  // Export
  window.ExamLockdown = {
    start: startLockdown,
    stop: stopLockdown,
    get isActive() { return isLockdownActive; },
    get violations() { return violationCount; },
    get log() { return [...violationLog]; }
  };

  console.log('✅ Exam Lockdown & Anti-Cheat Engine loaded');
})();
