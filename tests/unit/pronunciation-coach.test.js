// tests/unit/pronunciation-coach.test.js
// Unit tests for Multi-Language Speech & Pronunciation Coach
// ===================================================================

describe('Multi-Language Speech & Pronunciation Coach', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openSpeechCoachSidebarBtn"></div>
    `;
    require('../../js/pronunciation-coach.js');
  });

  test('PronunciationCoach attaches to window and opens/closes correctly', () => {
    expect(window.PronunciationCoach).toBeDefined();
    expect(typeof window.PronunciationCoach.open).toBe('function');
    expect(typeof window.PronunciationCoach.close).toBe('function');

    window.PronunciationCoach.open();
    const overlay = document.getElementById('speechCoachOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const sent = document.getElementById('speechTargetSentence');
    expect(sent.children.length).toBeGreaterThan(2);

    window.PronunciationCoach.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Language switching updates target sentence', () => {
    window.PronunciationCoach.open();
    const enBtn = document.querySelector('.speech-lang-btn[data-lang="en"]');
    expect(enBtn).not.toBeNull();
    enBtn.click();

    const sent = document.getElementById('speechTargetSentence');
    expect(sent.textContent).toContain('Curiosity');
    window.PronunciationCoach.close();
  });
});
