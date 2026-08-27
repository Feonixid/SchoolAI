// js/tts.js
// ===================================================================
// TEXT-TO-SPEECH MODULE
// Browser TTS with Piper WASM support for offline synthesis
// ===================================================================

(function () {
  'use strict';

  let isSpeaking = false;
  let utterance = null;
  let piperLoaded = false;
  let piperWorker = null;

  // Browser's built-in TTS (fallback)
  const browserTTS = {
    speak: function (text, lang = 'en-US') {
      return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
          reject(new Error('Speech synthesis not supported'));
          return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = parseFloat(localStorage.getItem('EduAI_tts_rate') || '1.0');
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to find a voice for the language
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onend = () => {
          isSpeaking = false;
          resolve();
        };

        utterance.onerror = (e) => {
          isSpeaking = false;
          reject(e);
        };

        isSpeaking = true;
        speechSynthesis.speak(utterance);
      });
    },

    stop: function () {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        isSpeaking = false;
      }
    },

    isSpeaking: function () {
      return isSpeaking;
    },

    getVoices: function () {
      return speechSynthesis?.getVoices() || [];
    }
  };

  // Language code mapping for TTS
  const langMap = {
    'en': 'en-US',
    'sq': 'sq-AL',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'el': 'el-GR',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ar': 'ar-SA',
    'ru': 'ru-RU'
  };

  // Get TTS language from active subject or current app language
  function getTTSLanguage() {
    const activeSubj = window.Subjects?.getActive();
    if (activeSubj?.lang && langMap[activeSubj.lang]) {
      return langMap[activeSubj.lang];
    }
    const appLang = window.I18n?.current || 'en';
    return langMap[appLang] || 'en-US';
  }

  // Speak text
  async function speak(text) {
    if (!text || typeof text !== 'string') return;

    // Clean text for TTS
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2') // Clean fractions
      .replace(/\\Delta/g, 'delta')
      .replace(/\\times/g, 'times')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      .replace(/\$\$([\s\S]+?)\$\$/g, '$1') // Strip block math tags
      .replace(/\$([^$]+)\$/g, '$1') // Strip inline math tags
      .replace(/[#*_~`]/g, '') // Remove markdown
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const lang = getTTSLanguage();
    const rate = parseFloat(localStorage.getItem('EduAI_tts_rate') || '1.0');

    console.log(`TTS: Speaking in ${lang} at rate ${rate}`);

    try {
      await browserTTS.speak(cleanText, lang);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  }

  // Stop speaking
  function stop() {
    browserTTS.stop();
  }

  // Toggle speaking
  function toggle(text) {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  }

  // Check if TTS is available
  function isAvailable() {
    return 'speechSynthesis' in window;
  }

  // Get available voices
  function getVoices() {
    return browserTTS.getVoices();
  }

  // Set speech rate
  function setRate(rate) {
    localStorage.setItem('EduAI_tts_rate', rate.toString());
  }

  // Get speech rate
  function getRate() {
    return parseFloat(localStorage.getItem('EduAI_tts_rate') || '1.0');
  }

  // Add "Read Aloud" button to messages
  function addReadAloudButtons() {
    document.querySelectorAll('.message.assistant').forEach(msg => {
      if (msg.querySelector('.read-aloud-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'read-aloud-btn';
      btn.innerHTML = ' speaker';
      btn.title = 'Read aloud';
      btn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255,255,255,0.8);
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s;
      `;

      btn.addEventListener('click', () => {
        const text = msg.querySelector('.message-content')?.textContent || msg.textContent;
        toggle(text);
      });

      msg.style.position = 'relative';
      msg.appendChild(btn);

      msg.addEventListener('mouseenter', () => btn.style.opacity = '1');
      msg.addEventListener('mouseleave', () => btn.style.opacity = '0');
    });
  }

  // Auto-read if enabled
  function autoRead(text) {
    if (localStorage.getItem('EduAI_readAloud') === 'true') {
      speak(text);
    }
  }

  // Initialize
  function init() {
    // Load voices (they load asynchronously)
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => {
        console.log('TTS voices loaded:', speechSynthesis.getVoices().length);
      };
    }

    // Add read-aloud buttons to existing messages
    setTimeout(addReadAloudButtons, 1000);

    // Observe for new messages
    const observer = new MutationObserver(() => {
      addReadAloudButtons();
    });

    const chatContainer = document.querySelector('#chat, .chat-container');
    if (chatContainer) {
      observer.observe(chatContainer, { childList: true, subtree: true });
    }

    console.log('TTS module loaded');
  }

  // Export
  window.TTS = {
    speak,
    stop,
    toggle,
    isAvailable,
    getVoices,
    setRate,
    getRate,
    autoRead,
    addReadAloudButtons,
    get isSpeaking() { return isSpeaking; }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500);
  }
})();
