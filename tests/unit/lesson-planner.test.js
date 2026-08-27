// tests/unit/lesson-planner.test.js
// Unit tests for Teacher 45-Min Lesson Planner & Exam Generator

describe('Teacher 45-Min Lesson Planner & Exam Generator', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/lesson-planner.js');
  });

  test('Generates standard 5-phase 45-minute lesson plan', () => {
    expect(window.LessonPlanner).toBeDefined();
    const plan = window.LessonPlanner.generateLessonPlan('Fizikë', 10, 'Ligji i Ohmit');
    expect(plan.phases.length).toBe(5);
    expect(plan.phases[0].time).toBe('00 - 05 min');
    expect(plan.phases[4].time).toBe('40 - 45 min');
  });

  test('Generates rubric-aligned 3-section exam with answer keys', () => {
    const exam = window.LessonPlanner.generateExam('Kimi', 10, 'Lidhjet Kimike');
    expect(exam.meta.totalPoints).toBe(100);
    expect(exam.sections.length).toBe(3);
    expect(exam.sections[0].questions[0].correct).toBeDefined();
    expect(exam.sections[1].questions[0].answer).toBeDefined();
  });
});
