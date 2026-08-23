// js/voice.js
// ===================================================================
// VOICE INPUT - Web Speech API
// Supports Albanian (sq-AL) and English (en-US) depending on subject
// Works in Chrome and Edge.
// ===================================================================

(function () {
  'use strict';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('⚠️ Voice input not supported. Use Chrome or Edge.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let isListening = false;
  let micBtn = null;

  // Pick recognition language based on active subject
  function getRecognitionLang() {
    if (!window.Subjects) return 'sq-AL';
    const active = window.Subjects.getActive();
    return active.id === 'anglisht' ? 'en-US' : 'sq-AL';
  }

  function injectMicButton() {
    const buttonRow = document.querySelector('.buttonRow');
    if (!buttonRow || document.getElementById('micBtn')) return;

    micBtn = document.createElement('button');
    micBtn.id = 'micBtn';
    micBtn.className = 'mic-btn';
    micBtn.title = 'Voice input (Albanian / English)';
    micBtn.setAttribute('aria-label', 'Start voice input');
    micBtn.innerHTML = '🎙️';
    buttonRow.insertBefore(micBtn, buttonRow.firstChild);
    micBtn.addEventListener('click', toggleListening);
  }

  function toggleListening() {
    if (isListening) { recognition.stop(); return; }
    recognition.lang = getRecognitionLang();
    try { recognition.start(); } catch (e) { console.error('Recognition start error:', e); }
  }

  function setListeningState(on) {
    isListening = on;
    if (!micBtn) return;
    micBtn.classList.toggle('listening', on);
    micBtn.innerHTML = on ? '🔴' : '🎙️';
    micBtn.title = on ? 'Listening… (click to stop)' : 'Voice input';
  }

  recognition.onresult = function (event) {
    const input = document.getElementById('input');
    if (!input) return;
    let interim = '', final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      event.results[i].isFinal ? (final += t) : (interim += t);
    }
    input.value = final || interim;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  };

  recognition.onstart = () => { setListeningState(true); console.log('🎙️ Voice started:', recognition.lang); };

  recognition.onend = () => {
    setListeningState(false);
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');
    if (input && input.value.trim() && sendBtn && !sendBtn.disabled) {
      setTimeout(() => { if (input.value.trim()) sendBtn.click(); }, 800);
    }
  };

  recognition.onerror = function (event) {
    setListeningState(false);
    const msgs = {
      'not-allowed':   '⚠️ Please allow microphone access in your browser settings.',
      'no-speech':     'No speech detected. Please try again.',
      'audio-capture': '⚠️ No microphone found.',
      'network':       '⚠️ Internet connection required for speech recognition.',
    };
    console.warn('Voice error:', event.error);
    const input = document.getElementById('input');
    if (input && !input.value) {
      const orig = input.placeholder;
      input.placeholder = msgs[event.error] || `Error: ${event.error}`;
      setTimeout(() => { input.placeholder = orig; }, 3500);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMicButton);
  } else {
    setTimeout(injectMicButton, 600);
  }

  console.log('✅ Voice input module loaded');
})();
