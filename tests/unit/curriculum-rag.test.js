// tests/unit/curriculum-rag.test.js
// Unit tests for Curriculum RAG Engine, Grade Cognitive Pacing & Token-Efficient Knowledge Packs

describe('Curriculum RAG Engine & Grade Cognitive Pacing', () => {
  let CurriculumRAG;

  beforeEach(() => {
    localStorage.clear();
    window.AppState = {
      academic: { activeGrade: 10 },
      subject: { activeId: 'matematike' }
    };
    require('../../js/curriculum-rag.js');
    CurriculumRAG = window.CurriculumRAG;
  });

  test('Attaches to window with all grades 1 through 12 supported', () => {
    expect(CurriculumRAG).toBeDefined();
    expect(CurriculumRAG.GRADES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test('Returns accurate cognitive pacing & period duration for each grade tier', () => {
    // Primary (Grade 2) -> 25 min lesson, 3.0h max
    const primaryPacing = CurriculumRAG.getGradePacing(2);
    expect(primaryPacing.lessonDurationMin).toBe(25);
    expect(primaryPacing.dailyStudyLimitHours).toBe(3.0);
    expect(primaryPacing.cognitiveRule).toContain('shkurtra');

    // Middle (Grade 8) -> 45 min lesson, 5.5h max
    const middlePacing = CurriculumRAG.getGradePacing(8);
    expect(middlePacing.lessonDurationMin).toBe(45);
    expect(middlePacing.dailyStudyLimitHours).toBe(5.5);
    expect(middlePacing.cognitiveRule).toContain('Sokratike');

    // Senior / Matura (Grade 12) -> 60 min lesson, 7.5h max
    const seniorPacing = CurriculumRAG.getGradePacing(12);
    expect(seniorPacing.lessonDurationMin).toBe(60);
    expect(seniorPacing.dailyStudyLimitHours).toBe(7.5);
    expect(seniorPacing.cognitiveRule).toContain('Maturë');
  });

  test('buildContext returns structured, token-dense lesson knowledge for user queries', async () => {
    const mathContext = await CurriculumRAG.buildContext('ekuacione kuadratike dallori', {
      grade: 10,
      subjectId: 'matematike'
    });

    expect(mathContext).toContain('CURRICULUM KNOWLEDGE BASE');
    expect(mathContext).toContain('Algjebër');
    expect(mathContext).toContain('ax^2 + bx + c = 0');
    expect(mathContext).toContain('LESSON PACING');
  });

  test('buildContext handles physics formulas and misconceptions', async () => {
    const physicsContext = await CurriculumRAG.buildContext('ligji i njutonit forca dhe graviteti', {
      grade: 9,
      subjectId: 'fizike'
    });

    expect(physicsContext).toContain('Mekanikë');
    expect(physicsContext).toContain('F = m * a');
    expect(physicsContext).toContain('Misconceptions');
  });

  test('Switches active curriculum and persists to localStorage', () => {
    CurriculumRAG.setCurriculum('ib');
    expect(CurriculumRAG.activeCurriculum).toBe('ib');
    expect(localStorage.getItem('EduAI_curriculum')).toBe('ib');

    const curr = CurriculumRAG.getCurriculum();
    expect(curr.name).toBe('IB Diploma');
  });
});
