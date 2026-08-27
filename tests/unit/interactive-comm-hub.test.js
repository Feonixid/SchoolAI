// tests/unit/interactive-comm-hub.test.js
// Unit tests for Interactive Student-Teacher Communication & Help Desk

describe('Interactive Student-Teacher Communication & Help Desk', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    require('../../js/interactive-comm-hub.js');
  });

  test('Attaches to window and allows students to submit questions', () => {
    expect(window.InteractiveCommHub).toBeDefined();
    expect(typeof window.InteractiveCommHub.submitQuestion).toBe('function');
    expect(typeof window.InteractiveCommHub.answerQuestion).toBe('function');

    const q = window.InteractiveCommHub.submitQuestion(
      'Arbër Kelmendi',
      10,
      'Matematikë',
      'Si e gjejmë diskriminantin e ekuacionit kuadratik?',
      'urgent'
    );

    expect(q.studentName).toBe('Arbër Kelmendi');
    expect(q.status).toBe('pending');
    expect(q.urgency).toBe('urgent');

    const all = window.InteractiveCommHub.getQuestions();
    expect(all.length).toBe(1);
  });

  test('Teacher answers student question and broadcasts if needed', () => {
    const q = window.InteractiveCommHub.submitQuestion('Bora', 10, 'Fizikë', 'Çfarë është forca e fërkimit?');
    const answered = window.InteractiveCommHub.answerQuestion(q.id, 'Forca e fërkimit kundërshton lëvizjen relative.', 'Prof. Gashi', true);

    expect(answered.status).toBe('answered');
    expect(answered.answeredBy).toBe('Prof. Gashi');
    expect(answered.broadcast).toBe(true);

    const saved = window.InteractiveCommHub.getQuestions();
    expect(saved[0].status).toBe('answered');
  });

  test('Generates AI draft answer for teacher review', () => {
    const draft = window.InteractiveCommHub.generateAIDraftAnswer('Si zgjidhet ky ushtrim?', 'Kimi');
    expect(draft).toContain('Kimi');
    expect(draft).toContain('Përshëndetje');
  });
});
