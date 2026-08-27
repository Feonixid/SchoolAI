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
  // CONFIG & GRADE COGNITIVE PACING
  // ----------------------------------------------------------------
  const CURRICULA = {
    albanian: { id: 'albanian', name: 'Albanian (MAS)', flag: '🇦🇱', lang: 'sq' },
    ib:       { id: 'ib',       name: 'IB Diploma',     flag: '🌐', lang: 'en' },
    american: { id: 'american', name: 'American (AP)',   flag: '🇺🇸', lang: 'en' },
    uk:       { id: 'uk',       name: 'UK (GCSE/A-Level)', flag: '🇬🇧', lang: 'en' },
    german:   { id: 'german',   name: 'German (Abitur)', flag: '🇩🇪', lang: 'de' },
    greek:    { id: 'greek',    name: 'Greek (Lykeio)',  flag: '🇬🇷', lang: 'el' }
  };

  const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Grade Pacing & Timing Allocations
  const GRADE_TIMINGS = {
    primary_early: {
      grades: [1, 2, 3],
      tierName: 'Fillore Fillestare (Klasat 1-3)',
      lessonDurationMin: 25,
      recessDurationMin: 15,
      maxPeriodsPerDay: 4,
      dailyStudyLimitHours: 3.0,
      recommendedFocus: 'Fonetikë, Lexim fillestar, Numërim & Aritmetikë bazë, Natyrë & Shqisa',
      cognitiveRule: 'Përdor fjali të shkurtra, shpjegime vizuale, lojëra didaktike dhe inkurajim të vazhdueshëm.'
    },
    primary_late: {
      grades: [4, 5],
      tierName: 'Fillore e Mesme (Klasat 4-5)',
      lessonDurationMin: 35,
      recessDurationMin: 10,
      maxPeriodsPerDay: 5,
      dailyStudyLimitHours: 4.0,
      recommendedFocus: 'Thyesa, Përqindje, Kuptim leximi, Shkrim tregimesh, Shkenca natyrore',
      cognitiveRule: 'Inkurajo nxënësin të shpjegojë pse-në; ofro shembuj konkretë nga jeta e përditshme.'
    },
    middle: {
      grades: [6, 7, 8, 9],
      tierName: 'Arsimi Bazë i Mesëm (Klasat 6-9)',
      lessonDurationMin: 45,
      recessDurationMin: 10,
      maxPeriodsPerDay: 6,
      dailyStudyLimitHours: 5.5,
      recommendedFocus: 'Algjebër, Gjeometri, Qeliza & Gjenetikë, Forca & Lëvizje, Kimi, Histori & Qytetari, Programim',
      cognitiveRule: 'Zbato pyetje Sokratike, korrigjo keqkuptimet konceptuale dhe lidhi mësimet me laboratorin.'
    },
    high_early: {
      grades: [10, 11],
      tierName: 'Gjimnaz (Klasat 10-11)',
      lessonDurationMin: 50,
      recessDurationMin: 10,
      maxPeriodsPerDay: 6,
      dailyStudyLimitHours: 6.5,
      recommendedFocus: 'Trigonometri, Funksione Kuadratike, Ligjet e Njutonit, Elektricitet, Kimi Organike, Ese Argumentuese',
      cognitiveRule: 'Kërko saktësi rigoroze shkencore, zgjidhje me demonstrim dhe mendim kritik.'
    },
    senior_matura: {
      grades: [12],
      tierName: 'Maturë Shtetërore / Provime Ndërkombëtare (Klasa 12)',
      lessonDurationMin: 60,
      recessDurationMin: 10,
      maxPeriodsPerDay: 7,
      dailyStudyLimitHours: 7.5,
      recommendedFocus: 'Kalkulus (Derivate & Integrale), Fizikë Kuantike & Relativitet, Bioteknologji, Reaksione Redoks, Ekonomi, Përgatitje Mature',
      cognitiveRule: 'Simulo skemat zyrtare të provimeve të Maturës, arsyetim formal hap pas hapi dhe optimizim kohe.'
    }
  };

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

  // Built-in Comprehensive Offline Lesson Knowledge Packs
  const BUILTIN_LESSON_PACKS = {
    math: {
      units: [
        {
          title: 'Algjebër & Ekuacione',
          topics: [
            {
              title: 'Ekuacionet Lineare dhe Kuadratike',
              concepts: ['Zgjidhja e ekuacioneve', 'Dallori (Discriminant)', 'Formula e rrënjëve', 'Vetitë e barazimeve'],
              keyFormulas: ['ax^2 + bx + c = 0', 'D = b^2 - 4ac', 'x = (-b ± √D) / (2a)', 'y - y1 = m(x - x1)'],
              definitions: { 'Dallori': 'Shprehja D = b² - 4ac që përcakton natyrën e rrënjëve reale.' },
              keyFacts: ['Nëse D > 0, ekuacioni ka dy rrënjë reale të ndryshme.', 'Nëse D = 0, ka një rrënjë të dyfishtë.', 'Nëse D < 0, nuk ka rrënjë reale.']
            }
          ],
          commonMisconceptions: ['Harresa e shenjës negative te -b.', 'Pjestimi gabim me 2 në vend të 2a.']
        },
        {
          title: 'Trigonometri & Gjeometri',
          topics: [
            {
              title: 'Funksionet Trigonometrike & Teorema e Pitagorës',
              concepts: ['Sinus', 'Kosinus', 'Tangjent', 'Rrethi Trigonometrik', 'Teorema e Pitagorës'],
              keyFormulas: ['sin²(x) + cos²(x) = 1', 'tan(x) = sin(x)/cos(x)', 'a² + b² = c²'],
              definitions: { 'Sinus': 'Raporti i katetit përballë me hipotenuzën në trekëndëshin kënddrejtë.' }
            }
          ]
        },
        {
          title: 'Kalkulus & Analizë Matematike',
          topics: [
            {
              title: 'Derivati & Integrali',
              concepts: ['Shpejtësia e ndryshimit', 'Rregullat e derivimit', 'Integrali i pacaktuar', 'Syprina nën lakore'],
              keyFormulas: ["(x^n)' = n * x^(n-1)", '(u*v)\' = u\'v + uv\'', '∫ x^n dx = (x^(n+1))/(n+1) + C'],
              definitions: { 'Derivati': 'Limiti i raportit rritës kur shtesa e argumentit tenton drejt zeros.' }
            }
          ]
        }
      ]
    },
    physics: {
      units: [
        {
          title: 'Mekanikë & Ligjet e Njutonit',
          topics: [
            {
              title: 'Kinematikë & Dinamikë',
              concepts: ['Shpejtësia', 'Nxitimi', 'Ligji I, II, III i Njutonit', 'Fërkimi', 'Graviteti'],
              keyFormulas: ['F = m * a', 'v = v0 + a*t', 's = v0*t + 0.5*a*t^2', 'p = m * v', 'F_g = G*(m1*m2)/r^2'],
              definitions: { 'Ligji II i Njutonit': 'Nxitimi i një trupi është në përpjesëtim të drejtë me forcën rezultante dhe të zhdrejtë me masën.' }
            }
          ],
          commonMisconceptions: ['Masa dhe pesha janë e njëjta gjë (gabim: masa matet në kg, pesha në N).']
        },
        {
          title: 'Elektricitet & Qarqet Elektrike',
          topics: [
            {
              title: "Ligji i Ohmit & Fuqia Elektrike",
              concepts: ['Tensioni (V)', 'Rryma (I)', 'Rezistenca (R)', 'Lidhja në seri/paralele', 'Fuqia (P)'],
              keyFormulas: ['V = I * R', 'P = V * I = I^2 * R = V^2 / R', 'R_seri = R1 + R2', '1/R_paralele = 1/R1 + 1/R2'],
              definitions: { "Ligji i Ohmit": "Intensiteti i rrymës elektrike është në përpjesëtim të drejtë me tensionin dhe të zhdrejtë me rezistencën." }
            }
          ]
        }
      ]
    },
    biology: {
      units: [
        {
          title: 'Biologjia Qelizore & Gjenetika',
          topics: [
            {
              title: 'Struktura e Qelizës & Sinteza e Proteinave',
              concepts: ['Bërthama', 'Mitokondria', 'Ribozomi', 'Transkriptimi DNA->mRNA', 'Translatimi mRNA->Proteina', 'Kodi Gjenetik'],
              keyFormulas: ['A ↔ T (DNA), A ↔ U (RNA), C ↔ G'],
              definitions: { 'Transkriptimi': 'Procesi i kopjimit të informacionit gjenetik nga një varg i ADN-së në ARN-mesazhere.' }
            }
          ]
        }
      ]
    },
    chemistry: {
      units: [
        {
          title: 'Struktura Atomike & Lidhjet Kimike',
          topics: [
            {
              title: 'Tabela Periodike & Stekiometria',
              concepts: ['Numri atomik Z', 'Masa molare M', 'Moli n', 'Lidhja kovalente/jonike', 'Barazimi i reaksioneve'],
              keyFormulas: ['n = m / M', 'C = n / V', 'PV = nRT'],
              definitions: { 'Moli': 'Sasia e lëndës që përmban aq grimca elementare sa ka atome në 12g Karbon-12 (Numri i Avogadros NA = 6.022×10²³).' }
            }
          ]
        }
      ]
    }
  };

  // ----------------------------------------------------------------
  // STATE
  // ----------------------------------------------------------------
  let activeCurriculum = localStorage.getItem('EduAI_curriculum') || 'albanian';
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
  // PACK LOADING (lazy, cached, offline-fallback)
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
      if (res.ok) {
        const pack = await res.json();
        if (pack && Array.isArray(pack.units) && pack.units.length > 0) {
          packCache[key] = pack;
          return pack;
        }
      }
    } catch (e) {
      // Offline fallback
    }

    // Return built-in lesson pack if available
    if (BUILTIN_LESSON_PACKS[subjectDir]) {
      const fallbackPack = {
        meta: {
          curriculumName: CURRICULA[curriculum]?.name || 'Standard Curriculum',
          subject: subjectDir,
          grade: grade
        },
        units: BUILTIN_LESSON_PACKS[subjectDir].units
      };
      packCache[key] = fallbackPack;
      return fallbackPack;
    }

    return null;
  }

  // ----------------------------------------------------------------
  // GET GRADE PACING / TIMETABLE HELPER
  // ----------------------------------------------------------------
  function getGradePacing(grade) {
    const g = parseInt(grade || 9, 10);
    for (const key of Object.keys(GRADE_TIMINGS)) {
      if (GRADE_TIMINGS[key].grades.includes(g)) {
        return { grade: g, ...GRADE_TIMINGS[key] };
      }
    }
    return { grade: g, ...GRADE_TIMINGS.middle };
  }

  // ----------------------------------------------------------------
  // CONTEXT BUILDING — the core RAG logic (Token-Efficient)
  // ----------------------------------------------------------------
  async function buildContext(userMessage, options = {}) {
    const grade = options.grade || state.academic?.activeGrade || 9;
    const subjectId = options.subjectId || state.subject?.activeId || 'matematike';
    const curriculum = options.curriculum || activeCurriculum;

    const pacing = getGradePacing(grade);
    const pack = await loadPack(grade, subjectId, curriculum);
    if (!pack || !pack.units) return '';

    // Find relevant units based on user query
    const relevantUnits = findRelevantUnits(pack, userMessage);
    if (relevantUnits.length === 0) return '';

    // Build ultra-dense, token-efficient context string
    let context = '\n\n[CURRICULUM KNOWLEDGE BASE: Grade ' + grade + ' | ' + (pack.meta?.subject || subjectId) + ' | ' + pacing.tierName + ']\n';
    context += 'COGNITIVE RULE: ' + pacing.cognitiveRule + '\n';
    context += 'LESSON PACING: ' + pacing.lessonDurationMin + ' min blocks (Max ' + pacing.dailyStudyLimitHours + 'h daily)\n\n';

    relevantUnits.forEach(unit => {
      context += '• UNIT: ' + unit.title + '\n';
      if (unit.topics) {
        unit.topics.forEach(topic => {
          context += '  - ' + topic.title + '\n';
          if (topic.concepts?.length) context += '    Concepts: ' + topic.concepts.join(', ') + '\n';
          if (topic.keyFormulas?.length) context += '    Formulas: ' + topic.keyFormulas.join(' | ') + '\n';
          if (topic.keyFacts?.length) context += '    Facts: ' + topic.keyFacts.join('; ') + '\n';
          if (topic.definitions) {
            Object.entries(topic.definitions).forEach(([term, def]) => {
              context += '    ' + term + ': ' + def + '\n';
            });
          }
        });
      }
      if (unit.commonMisconceptions?.length) {
        context += '  ⚠ Misconceptions: ' + unit.commonMisconceptions.join('; ') + '\n';
      }
    });

    context += '[END CURRICULUM BASE — Use concise, step-by-step Socratic pedagogy; no conversational filler.]\n';
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
    localStorage.setItem('EduAI_curriculum', curriculumId);
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

    // Grade Timings & Cognitive Pacing
    getGradePacing,
    GRADE_TIMINGS,

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
