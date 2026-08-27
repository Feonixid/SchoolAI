// tests/unit/chapter-progress.test.js
// Unit tests for Teacher Syllabus & Chapter Progress Tracker

describe('Teacher Syllabus & Chapter Progress Tracker', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/chapter-progress.js');
  });

  test('Attaches to window and retrieves default syllabus', () => {
    expect(window.ChapterProgress).toBeDefined();
    const chapters = window.ChapterProgress.getChapters('matematike', 10);
    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters.length).toBeGreaterThanOrEqual(3);
  });

  test('Updates chapter status and shifts active focus', () => {
    window.ChapterProgress.updateChapterStatus('fizike', 10, 'ch_3', 'current');
    const chapters = window.ChapterProgress.getChapters('fizike', 10);
    const active = chapters.find(c => c.id === 'ch_3');
    expect(active.status).toBe('current');
  });

  test('Generates structured syllabus context for AI system prompt', () => {
    const ctx = window.ChapterProgress.getSyllabusAIContext('matematike', 10);
    expect(ctx).toContain('SYLLABUS PROGRESS CONTEXT');
    expect(ctx).toContain('KAPITUJT E PËRFUNDUAR');
    expect(ctx).toContain('KAPITULLI AKTIV');
  });
});
