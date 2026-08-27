// js/voice-dialogue.js
// ===================================================================
// EARLY PRIMARY (GRADES 1-3) & ACCESSIBILITY HANDS-FREE VOICE LOOP
// Listens via Speech Recognition -> Generates Socratic response ->
// Speaks back via TTS. Hands-free interactive learning loop.
// ===================================================================

(function () {
  'use strict';

  let recognition = null;
  let isListening = false;
  let isSpeaking = false;
  let currentSubject = 'Gjuhë Shqipe';
  let activeGrade = 2;

  function initRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition not supported in this browser.');
      return null;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'sq-AL';

    rec.onstart = () => {
      isListening = true;
      updateUIState('listening');
    };

    rec.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('🗣️ User speech recognized:', transcript);
      updateUIState('thinking');

      // Process with AI or local pedagogical rule
      await handleVoiceQuery(transcript);
    };

    rec.onerror = (err) => {
      console.warn('SpeechRecognition error:', err.error);
      isListening = false;
      updateUIState('idle');
    };

    rec.onend = () => {
      isListening = false;
      if (!isSpeaking) {
        updateUIState('idle');
      }
    };

    return rec;
  }

  async function handleVoiceQuery(query) {
    let responseText = '';
    const systemPrompt = `Ti je EduAI, mësues miqësor me zë për fëmijë të vegjël (Klasa ${activeGrade}, ${currentSubject}).\n` +
      `Përgjigju me 1 ose 2 fjali të thjeshta, të ëmbla e inkurajuese. Mos përdor fjalë të vështira.`;

    try {
      const endpoint = window.AppState?.api?.endpoint || 'http://localhost:11434/v1/chat/completions';
      const model = window.HardwareProfile?.getProfileSettings()?.model || 'gemma3:4b';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 150,
          temperature: 0.6
        })
      });

      if (res.ok) {
        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || 'Bravo! Pyetje shumë e bukur. Le të zbulojmë më shumë së bashku.';
      } else {
        responseText = `Të lumtë! Kjo është një pyetje e mrekullueshme. E provojmë edhe një herë së bashku?`;
      }
    } catch {
      responseText = `Të lumtë! Kjo është një pyetje e mrekullueshme. E provojmë edhe një herë së bashku?`;
    }

    speakResponse(responseText);
  }

  function speakResponse(text) {
    isSpeaking = true;
    updateUIState('speaking', text);

    if (window.TTS && window.TTS.speak) {
      window.TTS.speak(text);
      // Estimate speak duration based on words
      const words = text.split(/\s+/).length;
      const durationMs = Math.max(2500, (words / 2.5) * 1000);
      setTimeout(() => {
        isSpeaking = false;
        updateUIState('idle');
      }, durationMs);
    } else {
      setTimeout(() => {
        isSpeaking = false;
        updateUIState('idle');
      }, 3000);
    }
  }

  function toggleVoiceLoop() {
    if (isListening || isSpeaking) {
      if (recognition) recognition.stop();
      isListening = false;
      isSpeaking = false;
      updateUIState('idle');
    } else {
      if (!recognition) recognition = initRecognition();
      if (recognition) {
        try { recognition.start(); } catch (e) { console.warn(e); }
      } else {
        alert('Ky shfletues nuk mbështet regjistrimin me mikrofon. Ju lutem përdorni tastierën.');
      }
    }
  }

  function updateUIState(state, text = '') {
    const btn = document.getElementById('voiceLoopBtn');
    const bubble = document.getElementById('voiceLoopSubtitle');
    if (!btn) return;

    if (state === 'listening') {
      btn.textContent = '🛑 Po Dëgjoj...';
      btn.style.background = '#ef4444';
      if (bubble) bubble.textContent = '🎙️ Po dëgjoj fjalët e tua, fol qartë...';
    } else if (state === 'thinking') {
      btn.textContent = '⏳ Po mendoj...';
      btn.style.background = '#f59e0b';
      if (bubble) bubble.textContent = '💡 EduAI po mendon përgjigjen...';
    } else if (state === 'speaking') {
      btn.textContent = '🔊 Po flas...';
      btn.style.background = '#10b981';
      if (bubble) bubble.textContent = `🗣️ "${text}"`;
    } else {
      btn.textContent = '🎙️ Fillo Bisedën me Zë';
      btn.style.background = '#6366f1';
      if (bubble) bubble.textContent = 'Shtyp butonin dhe fol lirshëm me EduAI!';
    }
  }

  // Export
  window.VoiceDialogue = {
    toggle: toggleVoiceLoop,
    speakResponse,
    get isListening() { return isListening; },
    get isSpeaking() { return isSpeaking; }
  };

  console.log('✅ Hands-Free Voice Dialogue Loop module loaded');
})();
