// tests/unit/challenges.test.js
// Unit tests for Interactive Subject Challenges & Problem Sets

describe('Interactive Subject Challenges & Problem Sets', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openChallengesSidebarBtn"></div>
    `;
    require('../../js/challenges.js');
  });

  test('Challenges attaches to window and opens/closes correctly', () => {
    expect(window.Challenges).toBeDefined();
    expect(typeof window.Challenges.open).toBe('function');
    expect(typeof window.Challenges.close).toBe('function');

    window.Challenges.open();
    const overlay = document.getElementById('challengesOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const listEl = document.getElementById('challengesList');
    expect(listEl.children.length).toBeGreaterThan(0);

    window.Challenges.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Correct answer submission grants XP and marks challenge solved', () => {
    window.Challenges.open();
    const input = document.getElementById('input-math_1');
    expect(input).not.toBeNull();
    input.value = '5';

    const checkBtn = document.querySelector('.challenge-check-btn[data-id="math_1"]');
    expect(checkBtn).not.toBeNull();
    checkBtn.click();

    const resultEl = document.getElementById('result-math_1');
    expect(resultEl.classList.contains('correct')).toBe(true);
    expect(resultEl.textContent).toContain('Saktë');

    window.Challenges.close();
  });
});
