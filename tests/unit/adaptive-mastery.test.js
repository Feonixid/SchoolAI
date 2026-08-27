// tests/unit/adaptive-mastery.test.js
// Unit tests for Adaptive Knowledge-Graph Mastery Engine

describe('Adaptive Knowledge-Graph Mastery Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/adaptive-mastery.js');
  });

  test('Attaches to window and computes Bayesian Knowledge Tracing updates', () => {
    expect(window.AdaptiveMastery).toBeDefined();
    expect(typeof window.AdaptiveMastery.recordPerformance).toBe('function');
    expect(typeof window.AdaptiveMastery.getNextRecommendation).toBe('function');

    // Initial success updates probability
    const update1 = window.AdaptiveMastery.recordPerformance('matematike', 'g10_algebra', true);
    expect(update1.probabilityOfMastery).toBeGreaterThan(0.2);

    // Repeated successes achieve mastery (>= 0.85)
    window.AdaptiveMastery.recordPerformance('matematike', 'g10_algebra', true);
    window.AdaptiveMastery.recordPerformance('matematike', 'g10_algebra', true);
    window.AdaptiveMastery.recordPerformance('matematike', 'g10_algebra', true);

    const updateFinal = window.AdaptiveMastery.recordPerformance('matematike', 'g10_algebra', true);
    expect(updateFinal.mastered).toBe(true);
  });

  test('Recommends next unmastered prerequisite concept', () => {
    const next = window.AdaptiveMastery.getNextRecommendation('matematike');
    expect(next).toBeDefined();
    expect(next.subjectId).toBe('matematike');
    expect(next.title).toBeDefined();
    expect(next.action).toBeDefined();
  });
});
