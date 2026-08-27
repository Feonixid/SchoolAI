// tests/unit/onboarding.test.js
// Unit tests for First-Time Onboarding Wizard

describe('First-Time Onboarding Wizard', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    require('../../js/onboarding.js');
  });

  test('Attaches to window and detects onboarding completion status', () => {
    expect(window.Onboarding).toBeDefined();
    expect(typeof window.Onboarding.isCompleted).toBe('function');
    expect(typeof window.Onboarding.launch).toBe('function');

    expect(window.Onboarding.isCompleted()).toBe(false);
    localStorage.setItem('eduai_onboarding_completed', 'true');
    expect(window.Onboarding.isCompleted()).toBe(true);
  });
});
