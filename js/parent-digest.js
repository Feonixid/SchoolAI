// js/parent-digest.js
// ===================================================================
// PARENT OFFLINE PROGRESS CARD & SMS / WHATSAPP EXPORTER
// Generates clean, concise, formatted progress cards for parents
// without requiring parents to connect to the school network.
// ===================================================================

(function () {
  'use strict';

  function generateParentDigest(student, stats = {}) {
    const s = student || { firstName: 'Nxënës', lastName: '', gradeLevel: 10 };
    const name = `${s.firstName || 'Nxënës'} ${s.lastName || ''}`.trim();
    const grade = s.gradeLevel || 10;
    const attendance = stats.attendancePct || 96;
    const points = stats.points || 340;
    const completedChapters = stats.completedChapters || ['Ekuacionet Lineare', 'Ligjet e Njutonit'];
    const activeChapter = stats.activeChapter || 'Funksionet Kuadratike';
    const note = stats.teacherNote || 'Tregon vëmendje të shkëlqyer dhe pjesëmarrje aktive në simulimet laboratorike.';

    const textSms = 
`🏫 EduAI — Raporti Javor i Nxënësit
👤 Nxënësi: ${name} (Klasa ${grade})
📊 Pjesëmarrja: ${attendance}%
⚡ Pikë Përparimi: ${points} XP
✅ Kapituj të Përvetësuar: ${completedChapters.join(', ')}
📖 Mësimi Aktual: ${activeChapter}
📝 Shënimi i Mësuesit: "${note}"
Faleminderit për bashkëpunimin!`;

    return {
      name,
      grade,
      attendance,
      points,
      completedChapters,
      activeChapter,
      note,
      textSms
    };
  }

  function openDigestModal(student) {
    document.getElementById('parentDigestOverlay')?.remove();

    const digest = generateParentDigest(student);

    const overlay = document.createElement('div');
    overlay.id = 'parentDigestOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);align-items:center;justify-content:center;z-index:5500;';

    overlay.innerHTML = `
      <div class="modal" style="width:580px;max-width:94vw;background:var(--card-bg, #1e293b);border-radius:16px;border:1px solid var(--border);box-shadow:0 24px 60px rgba(0,0,0,0.4);overflow:hidden;display:flex;flex-direction:column">
        <div style="padding:18px 24px;background:var(--nav-bg, #0f172a);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">📱</span>
            <div>
              <h3 style="margin:0;font-size:16.5px;font-weight:700;color:var(--text)">Karta e Progresit për Prindërit</h3>
              <div style="font-size:12px;color:var(--text-muted)">Gati për dërgim me SMS, WhatsApp ose Printim</div>
            </div>
          </div>
          <button id="closeDigestModalBtn" class="school-os-close-btn" style="cursor:pointer;background:none;border:none;color:var(--text);font-size:20px">&times;</button>
        </div>

        <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div style="padding:14px;border-radius:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);font-family:monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;color:var(--text)" id="digestTextPreview">${digest.textSms}</div>

          <div style="display:flex;gap:10px">
            <button id="digestCopyBtn" class="os-btn-primary" style="flex:1;padding:10px;font-weight:700;font-size:13px">📋 Kopjo Tekstin (SMS / WhatsApp)</button>
            <button id="digestPrintBtn" class="os-btn-secondary" style="padding:10px 16px;font-weight:600;font-size:13px">🖨️ Printo</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('digestCopyBtn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(digest.textSms);
      if (window.Toast?.success) {
        window.Toast.success('📋 Teksti i raportit u kopjua në memorje!');
      }
    });

    document.getElementById('digestPrintBtn')?.addEventListener('click', () => window.print());
    document.getElementById('closeDigestModalBtn')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  // Export
  window.ParentDigest = {
    generateParentDigest,
    openModal: openDigestModal
  };

  console.log('✅ Parent Progress Digest module loaded');
})();
