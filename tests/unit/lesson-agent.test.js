// tests/unit/lesson-agent.test.js
// Unit tests for Lesson-Specific Isolated AI Agent

describe('Lesson-Specific Isolated AI Agent', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/lesson-agent.js');
  });

  test('Attaches to window and provides isolated session manager', () => {
    expect(window.LessonAgent).toBeDefined();
    expect(typeof window.LessonAgent.open).toBe('function');
    expect(typeof window.LessonAgent.getLessonChat).toBe('function');
    expect(typeof window.LessonAgent.addMessageToLesson).toBe('function');
  });

  test('Isolates messages per chapter without cross-contamination', () => {
    // Add messages to Chapter 1
    window.LessonAgent.addMessageToLesson('fizike', 10, 'ch_1', 'user', 'What is speed?');
    window.LessonAgent.addMessageToLesson('fizike', 10, 'ch_1', 'assistant', 'Speed is distance over time.');

    // Add message to Chapter 2
    window.LessonAgent.addMessageToLesson('fizike', 10, 'ch_2', 'user', 'Explain Newton second law.');

    const ch1Chat = window.LessonAgent.getLessonChat('fizike', 10, 'ch_1');
    const ch2Chat = window.LessonAgent.getLessonChat('fizike', 10, 'ch_2');

    expect(ch1Chat.messages.length).toBe(2);
    expect(ch1Chat.messages[0].content).toBe('What is speed?');

    expect(ch2Chat.messages.length).toBe(1);
    expect(ch2Chat.messages[0].content).toBe('Explain Newton second law.');
  });

  test('Clears chat for specific lesson only', () => {
    window.LessonAgent.addMessageToLesson('matematike', 10, 'ch_1', 'user', 'Fractions help');
    window.LessonAgent.addMessageToLesson('matematike', 10, 'ch_2', 'user', 'Calculus help');

    window.LessonAgent.clearLessonChat('matematike', 10, 'ch_1');

    const ch1 = window.LessonAgent.getLessonChat('matematike', 10, 'ch_1');
    const ch2 = window.LessonAgent.getLessonChat('matematike', 10, 'ch_2');

    expect(ch1.messages.length).toBe(0);
    expect(ch2.messages.length).toBe(1);
  });
});
