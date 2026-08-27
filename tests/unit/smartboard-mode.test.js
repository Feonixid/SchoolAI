// tests/unit/smartboard-mode.test.js
// Unit tests for Interactive Smartboard Classroom Conductor

describe('Interactive Smartboard Classroom Conductor', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    require('../../js/smartboard-mode.js');
  });

  test('Attaches to window and renders presentation overlay', () => {
    expect(window.SmartboardMode).toBeDefined();
    expect(typeof window.SmartboardMode.open).toBe('function');
    expect(typeof window.SmartboardMode.close).toBe('function');

    window.SmartboardMode.open('Optika Gjeometrike', 'Fizikë');

    const overlay = document.getElementById('smartboardModalOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('Optika Gjeometrike');
    expect(overlay.textContent).toContain('Fizikë');

    window.SmartboardMode.close();
    expect(document.getElementById('smartboardModalOverlay')).toBeNull();
  });
});
