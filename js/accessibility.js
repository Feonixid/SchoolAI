// js/accessibility.js
// ===================================================================
// ACCESSIBILITY MODULE
// High contrast, dyslexia font, keyboard navigation, screen reader
// ===================================================================

(function () {
  'use strict';

  // Apply all saved accessibility settings
  function applySettings() {
    const root = document.documentElement;

    // High Contrast Mode
    if (localStorage.getItem('shqipai_highContrast') === 'true') {
      root.classList.add('high-contrast');
      console.log('High contrast mode enabled');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dyslexia Font
    if (localStorage.getItem('shqipai_dyslexiaFont') === 'true') {
      root.classList.add('dyslexia-font');
      loadDyslexiaFont();
      console.log('Dyslexia font enabled');
    } else {
      root.classList.remove('dyslexia-font');
    }

    // Font Size
    const fontSize = localStorage.getItem('shqipai_fontSize') || '16';
    root.style.fontSize = `${fontSize}px`;

    // Screen Reader Mode
    if (localStorage.getItem('shqipai_screenReader') === 'true') {
      root.classList.add('screen-reader-mode');
      enhanceARIA();
      console.log('Screen reader mode enabled');
    } else {
      root.classList.remove('screen-reader-mode');
    }

    // Reduce Motion
    if (localStorage.getItem('shqipai_reduceMotion') === 'true') {
      root.classList.add('reduce-motion');
      console.log('Reduced motion enabled');
    } else {
      root.classList.remove('reduce-motion');
    }
  }

  // Load OpenDyslexic font
  function loadDyslexiaFont() {
    if (document.getElementById('dyslexia-font-link')) return;

    const link = document.createElement('link');
    link.id = 'dyslexia-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/opendyslexic@3.0.0/lib/stylesheets/opendyslexic.css';
    document.head.appendChild(link);
  }

  // Enhance ARIA labels for screen readers
  function enhanceARIA() {
    // Add landmarks
    const main = document.querySelector('main') || document.querySelector('#main');
    if (main) {
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', 'Main content');
    }

    // Add navigation landmarks
    document.querySelectorAll('nav, .nav, .sidebar').forEach((nav, i) => {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', `Navigation ${i + 1}`);
    });

    // Add button labels
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });

    // Add input labels
    document.querySelectorAll('input:not([aria-label]):not([id])').forEach((input, i) => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder) {
        input.setAttribute('aria-label', placeholder);
      }
    });

    // Live regions for dynamic content
    const chatContainer = document.querySelector('#chat, .chat-container');
    if (chatContainer) {
      chatContainer.setAttribute('aria-live', 'polite');
      chatContainer.setAttribute('aria-label', 'Chat messages');
    }
  }

  // Keyboard navigation
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Skip if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Settings: Ctrl/Cmd + ,
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        window.Settings?.open();
      }

      // Focus chat input: /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const input = document.querySelector('#input, .chat-input textarea');
        if (input) input.focus();
      }

      // Toggle high contrast: Ctrl/Cmd + Shift + H
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        toggleHighContrast();
      }

      // Stop TTS: Escape
      if (e.key === 'Escape') {
        window.TTS?.stop();
        window.Settings?.close();
      }

      // Navigate tabs: Ctrl/Cmd + 1-9
      if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const tabs = document.querySelectorAll('.tab-btn, [role="tab"]');
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          tabs[index].click();
        }
      }
    });

    console.log('Keyboard navigation setup complete');
  }

  // Toggle high contrast
  function toggleHighContrast() {
    const current = localStorage.getItem('shqipai_highContrast') === 'true';
    localStorage.setItem('shqipai_highContrast', (!current).toString());
    applySettings();
    window.Toast?.info(current ? 'High contrast disabled' : 'High contrast enabled');
  }

  // Toggle dyslexia font
  function toggleDyslexiaFont() {
    const current = localStorage.getItem('shqipai_dyslexiaFont') === 'true';
    localStorage.setItem('shqipai_dyslexiaFont', (!current).toString());
    applySettings();
    window.Toast?.info(current ? 'Dyslexia font disabled' : 'Dyslexia font enabled');
  }

  // Set font size
  function setFontSize(size) {
    const sizeNum = Math.max(12, Math.min(24, parseInt(size) || 16));
    localStorage.setItem('shqipai_fontSize', sizeNum.toString());
    applySettings();
  }

  // Increase font size
  function increaseFontSize() {
    const current = parseInt(localStorage.getItem('shqipai_fontSize') || '16');
    setFontSize(current + 2);
  }

  // Decrease font size
  function decreaseFontSize() {
    const current = parseInt(localStorage.getItem('shqipai_fontSize') || '16');
    setFontSize(current - 2);
  }

  // Get current settings
  function getSettings() {
    return {
      highContrast: localStorage.getItem('shqipai_highContrast') === 'true',
      dyslexiaFont: localStorage.getItem('shqipai_dyslexiaFont') === 'true',
      fontSize: parseInt(localStorage.getItem('shqipai_fontSize') || '16'),
      screenReader: localStorage.getItem('shqipai_screenReader') === 'true',
      reduceMotion: localStorage.getItem('shqipai_reduceMotion') === 'true',
      readAloud: localStorage.getItem('shqipai_readAloud') === 'true'
    };
  }

  // Announce message for screen readers
  function announce(message) {
    const announcer = document.getElementById('sr-announcer') || createAnnouncer();
    announcer.textContent = message;
  }

  function createAnnouncer() {
    const div = document.createElement('div');
    div.id = 'sr-announcer';
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(div);
    return div;
  }

  // Initialize
  function init() {
    applySettings();
    setupKeyboardNavigation();
    createAnnouncer();

    // Re-apply on storage change (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('shqipai_')) {
        applySettings();
      }
    });

    console.log('Accessibility module loaded');
  }

  // Export
  window.Accessibility = {
    applySettings,
    toggleHighContrast,
    toggleDyslexiaFont,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    getSettings,
    announce
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
