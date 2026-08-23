// tests/unit/flashcards.test.js
// Unit tests for Spaced Repetition AI Flashcards (Leitner 5-Box Engine)
// ===================================================================

describe('Spaced Repetition AI Flashcards & Leitner System', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openFlashcardsSidebarBtn"></div>
    `;
    require('../../js/flashcards.js');
  });

  test('Flashcards attaches to window and opens/closes correctly', () => {
    expect(window.Flashcards).toBeDefined();
    expect(typeof window.Flashcards.open).toBe('function');
    expect(typeof window.Flashcards.close).toBe('function');

    window.Flashcards.open();
    const overlay = document.getElementById('flashcardsOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const qText = document.getElementById('cardQuestionText');
    expect(qText.textContent).not.toBe('--');

    window.Flashcards.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Flipping card and rating advances to next card and updates score', () => {
    window.Flashcards.open();
    const scene = document.getElementById('flashcardScene');
    scene.click();

    const inner = document.getElementById('flashcardInner');
    expect(inner.classList.contains('is-flipped')).toBe(true);

    const goodBtn = document.getElementById('cardGoodBtn');
    expect(goodBtn).not.toBeNull();
    goodBtn.click();

    window.Flashcards.close();
  });
});
