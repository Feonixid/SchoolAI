// tests/unit/quiz-battle.test.js
// Unit tests for Gamified Live Quiz Battle Arena
// ===================================================================

describe('Gamified Live Quiz Battle Arena', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openQuizBattleSidebarBtn"></div>
    `;
    require('../../js/quiz-battle.js');
  });

  test('QuizBattle attaches to window and opens/closes correctly', () => {
    expect(window.QuizBattle).toBeDefined();
    expect(typeof window.QuizBattle.open).toBe('function');
    expect(typeof window.QuizBattle.close).toBe('function');

    window.QuizBattle.open();
    const overlay = document.getElementById('battleArenaOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const qText = document.getElementById('battleQuestionText');
    expect(qText.textContent).not.toBe('Po ngarkohet pyetja...');

    window.QuizBattle.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Power-ups dock buttons exist and trigger correctly', () => {
    window.QuizBattle.open();
    const shieldBtn = document.getElementById('powerupShieldBtn');
    expect(shieldBtn).not.toBeNull();
    shieldBtn.click();
    expect(shieldBtn.disabled).toBe(true);

    const freezeBtn = document.getElementById('powerupFreezeBtn');
    expect(freezeBtn).not.toBeNull();
    freezeBtn.click();
    expect(freezeBtn.disabled).toBe(true);
    window.QuizBattle.close();
  });
});
