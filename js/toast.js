// js/toast.js
// Toast notification system for user feedback
// ===================================================================

(function () {
  'use strict';

  // Create toast container if not exists
  function ensureContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  // Toast types with colors
  const TYPES = {
    success: { bg: '#238636', icon: 'check-circle' },
    error: { bg: '#da3633', icon: 'x-circle' },
    warning: { bg: '#9e6a03', icon: 'alert-triangle' },
    info: { bg: '#1f6feb', icon: 'info' }
  };

  // Create a toast notification
  function show(message, type = 'info', duration = 3000) {
    const container = ensureContainer();
    const config = TYPES[type] || TYPES.info;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${config.bg};
      color: #fff;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 350px;
      pointer-events: auto;
      animation: toast-slide-in 0.3s ease;
      cursor: pointer;
    `;

    // Icon
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = getIcon(config.icon);
    iconSpan.style.cssText = 'flex-shrink: 0; width: 16px; height: 16px;';
    
    // Message
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    msgSpan.style.cssText = 'flex: 1; line-height: 1.4;';

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    container.appendChild(toast);

    // Click to dismiss
    toast.addEventListener('click', () => dismissToast(toast));

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => dismissToast(toast), duration);
    }

    return toast;
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'toast-slide-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }

  function getIcon(name) {
    const icons = {
      'check-circle': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.78 5.28-4.5 6a.75.75 0 0 1-1.18.02l-2.25-2.5a.75.75 0 1 1 1.12-1l1.66 1.84 3.94-5.25a.75.75 0 1 1 1.2.9z"/>
      </svg>`,
      'x-circle': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm2.28 5.28a.75.75 0 0 1 0 1.06L9.06 7.5l1.22 1.16a.75.75 0 1 1-1.04 1.1L8 8.6l-1.24 1.16a.75.75 0 1 1-1.04-1.1L6.94 7.5 5.72 6.34a.75.75 0 0 1 1.06-1.06L8 6.4l1.22-1.12a.75.75 0 0 1 1.06 0z"/>
      </svg>`,
      'alert-triangle': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8.893 1.5a1.5 1.5 0 0 0-1.786 0L.75 5.66a1.5 1.5 0 0 0-.5 1.17v6.17a1.5 1.5 0 0 0 1.5 1.5h12.5a1.5 1.5 0 0 0 1.5-1.5V6.83a1.5 1.5 0 0 0-.5-1.17l-6.357-4.16zM8 4.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
      </svg>`,
      'info': `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm1 12H7v-5h2v5zm0-7H7V3h2v2z"/>
      </svg>`
    };
    return icons[name] || icons.info;
  }

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toast-slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toast-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Export
  window.Toast = {
    show,
    success: (msg, duration) => show(msg, 'success', duration),
    error: (msg, duration = 5000) => show(msg, 'error', duration),
    warning: (msg, duration = 4000) => show(msg, 'warning', duration),
    info: (msg, duration) => show(msg, 'info', duration),
    dismiss: dismissToast
  };

  console.log('Toast notification system initialized');
})();
