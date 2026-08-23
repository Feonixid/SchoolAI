// js/curriculum-rag.js
// ===================================================================
// ADVANCED CURRICULUM RAG ENGINE
// Grade-specific, subject-specific, curriculum-specific knowledge packs
// Supports: IB, Albanian (MAS), American, UK, German, Greek curricula
// Grades 9-12, 12 subjects = 288 possible packs
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------------
  const CURRICULA = {
    albanian: { id: 'albanian', name: 'Albanian (MAS)', flag: '🇦🇱', lang: 'sq' },
    ib:       { id: 'ib',       name: 'IB Diploma',     flag: '🌐', lang: 'en' },
    american: { id: 'american', name: 'American (AP)',   flag: '🇺🇸', lang: 'en' },
    uk:       { id: 'uk',       name: 'UK (GCSE/A-Level)', flag: '🇬🇧', lang: 'en' },
    german:   { id: 'german',   name: 'German (Abitur)', flag: '🇩🇪', lang: 'de' },
    greek:    { id: 'greek',    name: 'Greek (Lykeio)',  flag: '🇬🇷', lang: 'el' }
  };

  const GRADES = [9, 10, 11, 12];

  // Subject ID mapping to directory names
  const SUBJECT_MAP = {
    matematike: 'math',
    fizike: 'physics',
    ekonomi: 'economics',
    biologji: 'biology',
    kimia: 'chemistry',
    histori: 'history',
    anglisht: 'english',
    shqip: 'albanian-lang',
    coding: 'coding',
    cyber: 'cyber',
    german: 'german-lang',
    spanish: 'spanish',
    french: 'french'
  };

  // ----------------------------------------------------------------
  // STATE
  // ----------------------------------------------------------------
  let activeCurriculum = localStorage.getItem('shqipai_curriculum') || 'albanian';
  let packCache = {};  // key: "grade-subject-curriculum" -> pack data
  let registry = null;
  let registryLoaded = false;

  // ----------------------------------------------------------------
  // REGISTRY
  // ----------------------------------------------------------------
  async function loadRegistry() {
    if (registryLoaded) return registry;
    try {
      const res = await fetch('/data/curriculum/registry.json');
      if (res.ok) {
        registry = await res.json();
        registryLoaded = true;
        console.log(`📚 Curriculum registry loaded: ${registry.packs?.length || 0} packs available`);
      }
    } catch (e) {
      console.warn('Could not load curriculum registry:', e.message);
      registry = { packs: [] };
    }
    return registry;
  }

  // ----------------------------------------------------------------
  // PACK LOADING (lazy, cached)
  // ----------------------------------------------------------------
  function getCacheKey(grade, subjectId, curriculum) {
    const subjectDir = SUBJECT_MAP[subjectId] || subjectId;
    return `${grade}-${subjectDir}-${curriculum}`;
  }

  async function loadPack(grade, subjectId, curriculum) {
    const key = getCacheKey(grade, subjectId, curriculum);
    if (packCache[key]) return packCache[key];

    const subjectDir = SUBJECT_MAP[subjectId] || subjectId;
    const url = `/data/curriculum/grade-${grade}/${subjectDir}/${curriculum}.json`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        // Fallback: try Albanian curriculum
        if (curriculum !== 'albanian') {
          console.warn(`Pack not found: ${url}, falling back to Albanian`);
          return loadPack(grade, subjectId, 'albanian');
        }
        return null;
      }
      const pack = await res.json();
      packCache[key] = pack;
      console.log(`📖 Loaded curriculum pack: ${pack.meta?.curriculumName || curriculum} - Grade ${grade} ${subjectDir}`);
      return pack;
    } catch (e) {
      console.warn(`Failed to load curriculum pack ${url}:`, e.message);
      return null;
    }
  }

  // ----------------------------------------------------------------
  // CONTEXT BUILDING — the core RAG logic
  // ----------------------------------------------------------------
  async function buildContext(userMessage, options = {}) {
    const grade = options.grade || state.academic?.activeGrade || null;
    const subjectId = options.subjectId || state.subject?.activeId || null;
    const curriculum = options.curriculum || activeCurriculum;

    if (!grade || !subjectId || grade < 9) return '';

    const pack = await loadPack(grade, subjectId, curriculum);
    if (!pack || !pack.units) return '';

    // Find relevant units based on user query
    const relevantUnits = findRelevantUnits(pack, userMessage);
    if (relevantUnits.length === 0) return '';

    // Build context string
    let context = '\n\n═══════════════════════════════════════════════════\n';
    context += `CURRICULUM REFERENCE: ${pack.meta?.curriculumName || curriculum.toUpperCase()}\n`;
    context += `Grade ${grade} — ${pack.meta?.subject || subjectId}\n`;
    context += '═══════════════════════════════════════════════════\n\n';

    relevantUnits.forEach(unit => {
      context += `▸ ${unit.title.toUpperCase()}\n`;

      if (unit.topics) {
        unit.topics.forEach(topic => {
          context += `  • ${topic.title}\n`;
          if (topic.concepts?.length) {
            context += `    Concepts: ${topic.concepts.join(', ')}\n`;
          }
          if (topic.keyFormulas?.length) {
            context += `    Formulas: ${topic.keyFormulas.join(' | ')}\n`;
          }
          if (topic.keyFacts?.length) {
            context += `    Key facts:\n`;
            topic.keyFacts.forEach(f => {
              context += `      - ${f}\n`;
            });
          }
          if (topic.procedures?.length) {
            context += `    Procedures:\n`;
            topic.procedures.forEach((p, i) => {
              context += `      ${i + 1}. ${p}\n`;
            });
          }
          if (topic.definitions) {
            Object.entries(topic.definitions).forEach(([term, def]) => {
              context += `    ${term}: ${def}\n`;
            });
          }
          if (topic.examples?.length) {
            context += `    Examples: ${topic.examples.join('; ')}\n`;
          }
        });
      }

      if (unit.commonMisconceptions?.length) {
        context += `  ⚠ Common misconceptions:\n`;
        unit.commonMisconceptions.forEach(m => {
          context += `    - ${m}\n`;
        });
      }

      if (unit.practicalWork?.length) {
        context += `  🔬 Practical work: ${unit.practicalWork.join(', ')}\n`;
      }

      context += '\n';
    });

    // Add exam format info
    if (pack.examFormat) {
      context += '── EXAM FORMAT ──\n';
      if (pack.examFormat.papers) context += `Papers: ${pack.examFormat.papers.join(', ')}\n`;
      if (pack.examFormat.commandWords) context += `Command words: ${pack.examFormat.commandWords.join(', ')}\n`;
      if (pack.examFormat.tips) context += `Tips: ${pack.examFormat.tips.join('; ')}\n`;
    }

    context += '═══════════════════════════════════════════════════\n';
    context += 'Use the above curriculum reference to guide your response. Cite specific formulas and concepts.\n';

    return context;
  }

  // ----------------------------------------------------------------
  // SEMANTIC MATCHING
  // ----------------------------------------------------------------
  function findRelevantUnits(pack, query) {
    if (!pack.units || !query) return pack.units?.slice(0, 3) || [];

    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

    const scored = pack.units.map(unit => {
      let score = 0;

      // Match unit title
      if (unitMatchesQuery(unit.title, queryTerms)) score += 10;

      // Match topics
      if (unit.topics) {
        unit.topics.forEach(topic => {
          if (unitMatchesQuery(topic.title, queryTerms)) score += 8;

          // Match concepts
          if (topic.concepts) {
            topic.concepts.forEach(c => {
              if (unitMatchesQuery(c, queryTerms)) score += 5;
            });
          }

          // Match formulas
          if (topic.keyFormulas) {
            topic.keyFormulas.forEach(f => {
              if (unitMatchesQuery(f, queryTerms)) score += 3;
            });
          }

          // Match key facts
          if (topic.keyFacts) {
            topic.keyFacts.forEach(f => {
              if (unitMatchesQuery(f, queryTerms)) score += 2;
            });
          }

          // Match definitions
          if (topic.definitions) {
            Object.entries(topic.definitions).forEach(([term, def]) => {
              if (unitMatchesQuery(term, queryTerms)) score += 6;
              if (unitMatchesQuery(def, queryTerms)) score += 2;
            });
          }
        });
      }

      // Match misconceptions
      if (unit.commonMisconceptions) {
        unit.commonMisconceptions.forEach(m => {
          if (unitMatchesQuery(m, queryTerms)) score += 3;
        });
      }

      return { ...unit, _score: score };
    });

    // Return top 3 scoring units, minimum score 1
    const relevant = scored
      .filter(u => u._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);

    // If nothing matched, return first 2 units as general context
    return relevant.length > 0 ? relevant : pack.units.slice(0, 2);
  }

  function unitMatchesQuery(text, queryTerms) {
    if (!text) return false;
    const textLower = text.toLowerCase();
    return queryTerms.some(term => textLower.includes(term));
  }

  // ----------------------------------------------------------------
  // CURRICULUM MANAGEMENT
  // ----------------------------------------------------------------
  function setCurriculum(curriculumId) {
    if (!CURRICULA[curriculumId]) {
      console.warn(`Unknown curriculum: ${curriculumId}`);
      return;
    }
    activeCurriculum = curriculumId;
    localStorage.setItem('shqipai_curriculum', curriculumId);
    window.dispatchEvent(new CustomEvent('curriculumChanged', { detail: curriculumId }));

    // Auto-sync grading system — IDs match exactly (albanian, ib, american, uk, german, greek)
    if (window.setGradingSystem && window.GradingSystems?.[curriculumId]) {
      window.setGradingSystem(curriculumId);
    }

    console.log(`🎓 Curriculum set to: ${CURRICULA[curriculumId].name}`);
  }

  function getCurriculum() {
    return CURRICULA[activeCurriculum] || CURRICULA.albanian;
  }

  function getAllCurricula() {
    return CURRICULA;
  }

  // ----------------------------------------------------------------
  // CHECK PACK AVAILABILITY
  // ----------------------------------------------------------------
  async function isPackAvailable(grade, subjectId, curriculum) {
    const reg = await loadRegistry();
    if (!reg?.packs) return false;
    const subjectDir = SUBJECT_MAP[subjectId] || subjectId;
    return reg.packs.some(p =>
      p.grade === grade &&
      p.subject === subjectDir &&
      p.curriculum === curriculum &&
      p.status === 'available'
    );
  }

  async function getAvailablePacks(grade, subjectId) {
    const reg = await loadRegistry();
    if (!reg?.packs) return [];
    const subjectDir = SUBJECT_MAP[subjectId] || subjectId;
    return reg.packs.filter(p =>
      p.grade === grade &&
      p.subject === subjectDir &&
      p.status === 'available'
    );
  }

  // ----------------------------------------------------------------
  // CLEAR CACHE
  // ----------------------------------------------------------------
  function clearCache() {
    packCache = {};
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.CurriculumRAG = {
    buildContext,
    loadPack,
    loadRegistry,

    // Curriculum management
    setCurriculum,
    getCurriculum,
    getAllCurricula,
    CURRICULA,
    GRADES,
    SUBJECT_MAP,

    // Availability
    isPackAvailable,
    getAvailablePacks,

    // Cache
    clearCache,

    // Properties
    get activeCurriculum() { return activeCurriculum; }
  };

  // Load registry on init
  setTimeout(loadRegistry, 1000);

  console.log(`✅ Curriculum RAG engine loaded. Active curriculum: ${activeCurriculum}`);
})();
