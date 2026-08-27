// js/onboarding.js
// ===================================================================
// FIRST-TIME ONBOARDING & SETUP WIZARD
// Guides new students and teachers on first launch (Grade, Curriculum, Role)
// ===================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'eduai_onboarding_completed';

  function isCompleted() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function launchWizard(force = false) {
    if (isCompleted() && !force) return;
    document.getElementById('onboardingOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.85);backdrop-filter:blur(10px);align-items:center;justify-content:center;z-index:9000;';

    overlay.innerHTML = `
      <div class="modal" style="width:560px;max-width:94vw;background:var(--card-bg, #1e293b);border-radius:20px;border:1px solid var(--border);box-shadow:0 30px 70px rgba(0,0,0,0.5);overflow:hidden;display:flex;flex-direction:column">
        <div style="padding:24px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;text-align:center">
          <div style="font-size:36px;margin-bottom:8px">🎓</div>
          <h2 style="margin:0;font-size:22px;font-weight:800">Mirësevini në EduAI</h2>
          <div style="font-size:13px;opacity:0.9;margin-top:4px">Platforma Inteligjente Edukative Offline për Çdo Shkollë</div>
        </div>

        <div style="padding:24px;display:flex;flex-direction:column;gap:18px">
          <!-- Step 1: Role -->
          <div>
            <label style="font-size:13px;font-weight:700;color:var(--text);display:block;margin-bottom:6px">1. Zgjidh Rolin tënd:</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <button class="onboard-role-btn active" data-role="student" style="padding:12px;border-radius:10px;border:2px solid #6366f1;background:rgba(99,102,241,0.1);color:var(--text);font-weight:700;cursor:pointer">👨‍🎓 Nxënës</button>
              <button class="onboard-role-btn" data-role="teacher" style="padding:12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,0.03);color:var(--text);font-weight:700;cursor:pointer">👩‍🏫 Mësues</button>
            </div>
          </div>

          <!-- Step 2: Grade -->
          <div>
            <label style="font-size:13px;font-weight:700;color:var(--text);display:block;margin-bottom:6px">2. Zgjidh Klasën tënde:</label>
            <select id="onboardGrade" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(0,0,0,0.2);color:var(--text);font-size:13.5px">
              <option value="1">Klasa 1 (Fillore)</option>
              <option value="2">Klasa 2 (Fillore)</option>
              <option value="3">Klasa 3 (Fillore)</option>
              <option value="4">Klasa 4 (Fillore)</option>
              <option value="5">Klasa 5 (Fillore)</option>
              <option value="6">Klasa 6 (9-Vjeçare)</option>
              <option value="7">Klasa 7 (9-Vjeçare)</option>
              <option value="8">Klasa 8 (9-Vjeçare)</option>
              <option value="9">Klasa 9 (9-Vjeçare)</option>
              <option value="10" selected>Klasa 10 (Gjimnaz)</option>
              <option value="11">Klasa 11 (Gjimnaz)</option>
              <option value="12">Klasa 12 (Maturë Shtetërore)</option>
            </select>
          </div>

          <!-- Step 3: Curriculum -->
          <div>
            <label style="font-size:13px;font-weight:700;color:var(--text);display:block;margin-bottom:6px">3. Zgjidh Kurrikulën Mësimore:</label>
            <select id="onboardCurriculum" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(0,0,0,0.2);color:var(--text);font-size:13.5px">
              <option value="albanian" selected>🇦🇱 Shqipëri & Kosovë (MAS)</option>
              <option value="ib">🌐 IB Diploma Programme</option>
              <option value="american">🇺🇸 American (AP / High School)</option>
              <option value="uk">🇬🇧 UK (GCSE & A-Levels)</option>
              <option value="german">🇩🇪 German (Abitur)</option>
              <option value="greek">🇬🇷 Greek (Lykeio)</option>
            </select>
          </div>

          <button id="btnCompleteOnboard" class="os-btn-primary" style="padding:12px;font-size:14px;font-weight:800;border-radius:10px;margin-top:6px">🚀 Fillo Mësimin me EduAI</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let selectedRole = 'student';
    overlay.querySelectorAll('.onboard-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.onboard-role-btn').forEach(b => {
          b.style.border = '1px solid var(--border)';
          b.style.background = 'rgba(255,255,255,0.03)';
        });
        btn.style.border = '2px solid #6366f1';
        btn.style.background = 'rgba(99,102,241,0.1)';
        selectedRole = btn.dataset.role;
      });
    });

    document.getElementById('btnCompleteOnboard')?.addEventListener('click', () => {
      const grade = parseInt(document.getElementById('onboardGrade')?.value || '10', 10);
      const curriculum = document.getElementById('onboardCurriculum')?.value || 'albanian';

      if (window.AppState?.academic) {
        window.AppState.academic.activeGrade = grade;
      }
      if (window.CurriculumRAG?.setCurriculum) {
        window.CurriculumRAG.setCurriculum(curriculum);
      }

      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem('eduai_user_role', selectedRole);

      overlay.remove();

      if (window.Toast?.success) {
        window.Toast.success(`Mirësevini! Klasa ${grade} u konfigurua me sukses.`);
      }
    });
  }

  // Export
  window.Onboarding = {
    isCompleted,
    launch: () => launchWizard(true)
  };

  // Auto-launch on first visit
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!isCompleted()) launchWizard(false);
    }, 1200);
  });

  console.log('✅ Onboarding module loaded');
})();
