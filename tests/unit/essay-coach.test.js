// tests/unit/essay-coach.test.js
// Unit tests for AI Essay & Academic Writing Studio
// ===================================================================

describe('AI Essay & Academic Writing Studio', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openEssayStudioSidebarBtn"></div>
    `;
    require('../../js/essay-coach.js');
  });

  test('EssayCoach attaches to window and opens/closes correctly', () => {
    expect(window.EssayCoach).toBeDefined();
    expect(typeof window.EssayCoach.open).toBe('function');
    expect(typeof window.EssayCoach.close).toBe('function');

    window.EssayCoach.open();
    const overlay = document.getElementById('essayStudioOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    window.EssayCoach.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Sample essay loads and updates word/sentence metrics', () => {
    window.EssayCoach.open();
    const sampleBtn = document.getElementById('essaySampleBtn');
    expect(sampleBtn).not.toBeNull();

    sampleBtn.click();

    const textarea = document.getElementById('essayEditorText');
    expect(textarea.value.length).toBeGreaterThan(50);

    const wordCount = document.getElementById('essayWordCount');
    expect(parseInt(wordCount.textContent, 10)).toBeGreaterThan(20);

    const scoreCircle = document.getElementById('essayScoreCircle');
    expect(scoreCircle.textContent).not.toBe('--');
  });
});
