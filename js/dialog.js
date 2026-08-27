// js/dialog.js
// ===================================================================
// CUSTOM DIALOG SYSTEM
// Replaces window.prompt() and window.confirm() which are disabled
// in Electron. Works identically in both browser and desktop app.
// ===================================================================

(function () {
  'use strict';

  // Inject base styles once
  const style = document.createElement('style');
  style.id = 'EduAI-dialog-styles';
  style.textContent = `
    .sai-dialog-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(3px);
      z-index: 999999;
      display: flex; align-items: center; justify-content: center;
      animation: sai-fade-in 0.12s ease;
    }
    @keyframes sai-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .sai-dialog-box {
      background: var(--bg, #f7f5f2);
      border: 1px solid var(--border, rgba(0,0,0,0.1));
      border-radius: 12px;
      padding: 22px 24px;
      width: 360px;
      max-width: 92vw;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: sai-slide-up 0.15s ease;
    }
    @keyframes sai-slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sai-dialog-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text, #1c1b1a);
      margin: 0 0 10px;
    }
    .sai-dialog-msg {
      font-size: 13.5px;
      color: var(--muted, #7a7671);
      margin: 0 0 14px;
      line-height: 1.45;
    }
    .sai-dialog-input {
      width: 100%;
      padding: 9px 11px;
      border-radius: 8px;
      border: 1px solid var(--border, rgba(0,0,0,0.15));
      background: var(--input-bg, #fff);
      color: var(--text, #1c1b1a);
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      margin-bottom: 14px;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .sai-dialog-input:focus {
      border-color: var(--accent, #4a6cf7);
      box-shadow: 0 0 0 3px rgba(74,108,247,0.12);
    }
    .sai-dialog-btns {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .sai-btn {
      padding: 8px 16px;
      border-radius: 7px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: filter 0.12s;
    }
    .sai-btn:hover { filter: brightness(1.08); }
    .sai-btn-primary {
      background: var(--accent, #4a6cf7);
      color: #fff;
    }
    .sai-btn-secondary {
      background: var(--panel, #edeae4);
      color: var(--text, #1c1b1a);
    }
    .sai-btn-danger {
      background: #d93025;
      color: #fff;
    }
  `;
  if (!document.getElementById('EduAI-dialog-styles')) {
    document.head.appendChild(style);
  }

  // ----------------------------------------------------------------
  // showPrompt(message, defaultValue?) → Promise<string|null>
  // Drop-in replacement for window.prompt()
  // ----------------------------------------------------------------
  function showPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'sai-dialog-overlay';
      overlay.innerHTML = `
        <div class="sai-dialog-box">
          <div class="sai-dialog-title">EduAI</div>
          <div class="sai-dialog-msg">${message}</div>
          <input class="sai-dialog-input" type="text" value="${defaultValue.replace(/"/g, '&quot;')}" />
          <div class="sai-dialog-btns">
            <button class="sai-btn sai-btn-secondary" id="sai-cancel">Cancel</button>
            <button class="sai-btn sai-btn-primary" id="sai-ok">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const input = overlay.querySelector('.sai-dialog-input');
      input.focus();
      input.select();

      const ok = () => {
        const val = input.value.trim();
        overlay.remove();
        resolve(val || null);
      };

      const cancel = () => {
        overlay.remove();
        resolve(null);
      };

      overlay.querySelector('#sai-ok').addEventListener('click', ok);
      overlay.querySelector('#sai-cancel').addEventListener('click', cancel);

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  ok();
        if (e.key === 'Escape') cancel();
      });
    });
  }

  // ----------------------------------------------------------------
  // showConfirm(message) → Promise<boolean>
  // Drop-in replacement for window.confirm()
  // ----------------------------------------------------------------
  function showConfirm(message, dangerBtn = 'Delete') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'sai-dialog-overlay';
      overlay.innerHTML = `
        <div class="sai-dialog-box">
          <div class="sai-dialog-title">Confirm</div>
          <div class="sai-dialog-msg">${message}</div>
          <div class="sai-dialog-btns">
            <button class="sai-btn sai-btn-secondary" id="sai-cancel">Cancel</button>
            <button class="sai-btn sai-btn-danger" id="sai-ok">${dangerBtn}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const ok     = () => { overlay.remove(); resolve(true); };
      const cancel = () => { overlay.remove(); resolve(false); };

      overlay.querySelector('#sai-ok').addEventListener('click', ok);
      overlay.querySelector('#sai-cancel').addEventListener('click', cancel);

      overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter')  ok();
      });
      overlay.setAttribute('tabindex', '-1');
      overlay.focus();
    });
  }

  // ----------------------------------------------------------------
  // showAlert(message) → Promise<void>
  // ----------------------------------------------------------------
  function showAlert(message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'sai-dialog-overlay';
      overlay.innerHTML = `
        <div class="sai-dialog-box">
          <div class="sai-dialog-title">EduAI</div>
          <div class="sai-dialog-msg">${message}</div>
          <div class="sai-dialog-btns">
            <button class="sai-btn sai-btn-primary" id="sai-ok">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#sai-ok').addEventListener('click', () => {
        overlay.remove(); resolve();
      });
    });
  }

  // ----------------------------------------------------------------
  // Export globally
  // ----------------------------------------------------------------
  window.Dialog = { prompt: showPrompt, confirm: showConfirm, alert: showAlert };

  console.log('✅ Dialog system loaded (Electron-compatible)');
})();
