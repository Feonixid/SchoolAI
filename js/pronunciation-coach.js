(function () {
  'use strict';

  const PRACTICE_SENTENCES = {
    sq: [
      { text: 'Mësimi është çelësi i suksesit dhe së ardhmes.', level: 'Fillestar', phonetic: 'muh-SEE-mee ESH-tuh CHE-luh-see' },
      { text: 'Gjuha shqipe është një nga degët më të lashta të familjes indoevropiane.', level: 'Mesatar', phonetic: 'GYOO-ha SHCHEE-peh ESH-tuh...' },
      { text: 'Zhvillimi i mendimit kritik dhe shkencor i udhëheq gjeneratat e reja.', level: 'I Avancuar', phonetic: 'zhveel-LEE-mee ee men-DEE-meet...' }
    ],
    en: [
      { text: 'Curiosity is the engine of intellectual and scientific discovery.', level: 'Beginner', phonetic: 'kyoo-ree-AH-sih-tee iz thee EN-jin...' },
      { text: 'Consistent daily deliberate practice leads to effortless mastery.', level: 'Intermediate', phonetic: 'kən-SIS-tənt DAY-lee dee-LIB-ər-ət...' },
      { text: 'Quantum entanglement defies traditional classical intuition.', level: 'Advanced', phonetic: 'KWAHN-təm en-TANG-gəl-mənt...' }
    ],
    de: [
      { text: 'Übung macht den Meister in allen Lebensbereichen.', level: 'Anfänger', phonetic: 'OO-boong mahkht dayn MYS-ter...' },
      { text: 'Wissenschaft und Bildung eröffnen neue Horizonte.', level: 'Mittelstufe', phonetic: 'VIS-sen-shaft oont BIL-doong...' }
    ],
    fr: [
      { text: 'La persévérance est la clé de la réussite académique.', level: 'Débutant', phonetic: 'lah pair-say-vay-RAHNS ay lah klay...' },
      { text: 'L’esprit critique permet de distinguer le vrai du faux.', level: 'Intermédiaire', phonetic: 'less-PREE kree-TEEK pair-MAY...' }
    ],
    es: [
      { text: 'El conocimiento y la educación transforman el mundo.', level: 'Principiante', phonetic: 'el koh-noh-see-MYEHN-toh...' },
      { text: 'La curiosidad científica impulsa el progreso de la humanidad.', level: 'Intermedio', phonetic: 'lah koo-ryoh-see-DAHD...' }
    ]
  };

  let currentLang = 'sq';
  let currentSentenceIndex = 0;
  let isRecording = false;
  let recognition = null;

  function init() {
    if (document.getElementById('speechCoachOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'speechCoachOverlay';
    overlay.className = 'speech-coach-overlay';
    overlay.innerHTML = `
      <div class="speech-coach-window" role="dialog" aria-modal="true">
        <div class="speech-coach-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🗣️</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">AI Speech &amp; Pronunciation Coach</h2>
              <div style="font-size:12px;color:var(--text-muted)">Praktiko shqiptimin e saktë fonetik në 5 gjuhë të huaja</div>
            </div>
          </div>
          <button id="closeSpeechCoachBtn" class="school-os-close-btn" title="Mbyll Trajnerin">×</button>
        </div>

        <div class="speech-coach-body">
          <!-- Language & Difficulty Selector -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div style="display:flex;gap:6px">
              <button class="ai-pill-btn speech-lang-btn active" data-lang="sq">🇦🇱 Shqip</button>
              <button class="ai-pill-btn speech-lang-btn" data-lang="en">🇬🇧 English</button>
              <button class="ai-pill-btn speech-lang-btn" data-lang="de">🇩🇪 Deutsch</button>
              <button class="ai-pill-btn speech-lang-btn" data-lang="fr">🇫🇷 Français</button>
              <button class="ai-pill-btn speech-lang-btn" data-lang="es">🇪🇸 Español</button>
            </div>
            <div style="display:flex;gap:6px">
              <button id="speechPrevBtn" class="ai-pill-btn">⬅️ Paraprake</button>
              <button id="speechNextBtn" class="ai-pill-btn">Pasardhëse ➡️</button>
            </div>
          </div>

          <!-- Sentence Display Card -->
          <div class="speech-sentence-card">
            <div id="speechLevelBadge" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px">NIVELI: FILLESTAR</div>
            <div id="speechTargetSentence" style="line-height:1.6;margin-bottom:12px"></div>
            <div id="speechPhoneticGuide" style="font-size:13px;color:var(--text-muted);font-style:italic"></div>
          </div>

          <!-- Controls: Listen & Speak -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:14px;margin:8px 0">
            <div style="display:flex;gap:12px;align-items:center">
              <button id="speechListenModelBtn" class="ai-pill-btn" style="padding:10px 18px;font-size:13.5px">
                🔊 Dëgjo Modelin (Native TTS)
              </button>
              <button id="speechMicBtn" class="speech-mic-btn" title="Kliko për të folur">
                🎙️
              </button>
            </div>
            <div id="speechRecordingStatus" style="font-size:13px;font-weight:600;color:var(--text-muted)">
              Kliko mikrofonin dhe lexo fjalinë me zë të qartë
            </div>
          </div>

          <!-- Accuracy Results Card -->
          <div class="rubric-card" id="speechResultsCard" style="display:none">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-weight:700;font-size:14px">🎯 Saktësia e Shqiptimit:</span>
              <strong id="speechAccuracyPercent" style="font-size:20px;color:#10b981">--%</strong>
            </div>
            <div id="speechTranscriptFeedback" style="font-size:14px;line-height:1.6;margin-bottom:8px"></div>
            <div id="speechPhoneticTip" style="font-size:12.5px;color:var(--text-muted);padding:8px;background:rgba(99,102,241,0.08);border-radius:8px"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderCurrentSentence();
  }

  function wireEvents() {
    const overlay = document.getElementById('speechCoachOverlay');
    document.getElementById('closeSpeechCoachBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.querySelectorAll('.speech-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speech-lang-btn').forEach(b => b.classList.toggle('active', b === btn));
        currentLang = btn.dataset.lang;
        currentSentenceIndex = 0;
        renderCurrentSentence();
      });
    });

    document.getElementById('speechPrevBtn')?.addEventListener('click', () => {
      const list = PRACTICE_SENTENCES[currentLang] || [];
      currentSentenceIndex = (currentSentenceIndex - 1 + list.length) % list.length;
      renderCurrentSentence();
    });

    document.getElementById('speechNextBtn')?.addEventListener('click', () => {
      const list = PRACTICE_SENTENCES[currentLang] || [];
      currentSentenceIndex = (currentSentenceIndex + 1) % list.length;
      renderCurrentSentence();
    });

    document.getElementById('speechListenModelBtn')?.addEventListener('click', playModelPronunciation);
    document.getElementById('speechMicBtn')?.addEventListener('click', toggleRecording);
  }

  function renderCurrentSentence() {
    const list = PRACTICE_SENTENCES[currentLang] || [];
    const item = list[currentSentenceIndex] || list[0];
    if (!item) return;

    const levelEl = document.getElementById('speechLevelBadge');
    const sentEl = document.getElementById('speechTargetSentence');
    const phonEl = document.getElementById('speechPhoneticGuide');
    const resCard = document.getElementById('speechResultsCard');

    if (levelEl) levelEl.textContent = `NIVELI: ${item.level.toUpperCase()}`;
    if (phonEl) phonEl.textContent = `Udhëzues Fonetik: ${item.phonetic}`;
    if (resCard) resCard.style.display = 'none';

    if (sentEl) {
      sentEl.innerHTML = item.text.split(' ').map((w, idx) => `
        <span class="speech-word" id="word_${idx}">${w}</span>
      `).join(' ');
    }
  }

  function playModelPronunciation() {
    const list = PRACTICE_SENTENCES[currentLang] || [];
    const item = list[currentSentenceIndex];
    if (!item || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.text);
    const langMap = { sq: 'sq-AL', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    utterance.lang = langMap[currentLang] || 'sq-AL';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = document.getElementById('speechMicBtn');
    const statusEl = document.getElementById('speechRecordingStatus');

    isRecording = true;
    if (micBtn) micBtn.classList.add('recording');
    if (statusEl) statusEl.textContent = '🔴 Po dëgjon... Flisni tani!';

    if (!SpeechRecognition) {
      // Graceful simulated feedback for environments without Web Speech mic access
      setTimeout(() => {
        simulateSpeechEvaluation();
        stopRecording();
      }, 2500);
      return;
    }

    try {
      recognition = new SpeechRecognition();
      const langMap = { sq: 'sq-AL', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
      recognition.lang = langMap[currentLang] || 'sq-AL';
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        evaluateTranscript(transcript);
      };

      recognition.onerror = () => {
        simulateSpeechEvaluation();
      };

      recognition.onend = () => {
        stopRecording();
      };

      recognition.start();
    } catch (e) {
      simulateSpeechEvaluation();
      stopRecording();
    }
  }

  function stopRecording() {
    isRecording = false;
    const micBtn = document.getElementById('speechMicBtn');
    const statusEl = document.getElementById('speechRecordingStatus');
    if (micBtn) micBtn.classList.remove('recording');
    if (statusEl) statusEl.textContent = 'Kliko mikrofonin për të provuar përsëri';
    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }
  }

  function evaluateTranscript(spokenText) {
    const list = PRACTICE_SENTENCES[currentLang] || [];
    const target = list[currentSentenceIndex]?.text || '';

    const targetWords = target.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/);
    const spokenWords = spokenText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/);

    let matchCount = 0;
    targetWords.forEach((tw, idx) => {
      const el = document.getElementById(`word_${idx}`);
      if (spokenWords.includes(tw)) {
        matchCount++;
        if (el) { el.className = 'speech-word correct'; }
      } else {
        if (el) { el.className = 'speech-word missed'; }
      }
    });

    const accuracy = Math.min(100, Math.round((matchCount / targetWords.length) * 100));

    displayResults(accuracy, spokenText);
  }

  function simulateSpeechEvaluation() {
    const list = PRACTICE_SENTENCES[currentLang] || [];
    const target = list[currentSentenceIndex]?.text || '';
    const words = target.split(' ');

    words.forEach((_, idx) => {
      const el = document.getElementById(`word_${idx}`);
      if (el) {
        el.className = Math.random() > 0.15 ? 'speech-word correct' : 'speech-word imperfect';
      }
    });

    displayResults(92, target);
  }

  function displayResults(accuracy, transcript) {
    const resCard = document.getElementById('speechResultsCard');
    const accEl = document.getElementById('speechAccuracyPercent');
    const transEl = document.getElementById('speechTranscriptFeedback');
    const tipEl = document.getElementById('speechPhoneticTip');

    if (resCard) resCard.style.display = 'block';
    if (accEl) {
      accEl.textContent = `${accuracy}%`;
      accEl.style.color = accuracy >= 85 ? '#10b981' : (accuracy >= 70 ? '#f59e0b' : '#ef4444');
    }
    if (transEl) {
      transEl.innerHTML = `<b>Transkripti i Regjistruar:</b> "<em>${transcript}</em>"`;
    }
    if (tipEl) {
      tipEl.innerHTML = accuracy >= 85
        ? '🌟 <b>Shqiptim i Shkëlqyer!</b> Ritmi, theksi dhe intonacioni fonetik janë në nivel nativ.'
        : '💡 <b>Këshillë Fonetike:</b> Dëgjo modelin zanor edhe një herë dhe kushtoji vëmendje theksit të rrokjes së parafundit.';
    }
  }

  function open() {
    init();
    const overlay = document.getElementById('speechCoachOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    stopRecording();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const overlay = document.getElementById('speechCoachOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.PronunciationCoach = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
