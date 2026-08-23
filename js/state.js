// js/state.js
// ===================================================================
// CENTRALIZED STATE MANAGEMENT
// This file MUST load before all other JS files
// ===================================================================

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // GRADING SYSTEMS
  // ----------------------------------------------------------------
  const GRADING_SYSTEMS = {
    albanian: {
      name: 'Albanian (1–10)',
      flag: '🇦🇱',
      min: 1, max: 10, pass: 4,
      scale: [
        { min: 9,   max: 10,  label: 'Shkëlqyer',  en: 'Excellent',     color: '#16a34a' },
        { min: 7,   max: 8.9, label: 'Mirë',       en: 'Good',          color: '#65a30d' },
        { min: 5,   max: 6.9, label: 'Kënaqshëm',  en: 'Satisfactory',  color: '#ca8a04' },
        { min: 4,   max: 4.9, label: 'Mjaftueshëm',en: 'Sufficient',    color: '#d97706' },
        { min: 0,   max: 3.9, label: 'Pamjaftueshëm',en:'Insufficient', color: '#dc2626' }
      ],
      format: (n) => n.toFixed(1)
    },
    american: {
      name: 'American (A–F)',
      flag: '🇺🇸',
      min: 0, max: 100, pass: 60,
      scale: [
        { min: 90,  max: 100, label: 'A', en: 'Excellent',  color: '#16a34a' },
        { min: 80,  max: 89,  label: 'B', en: 'Good',       color: '#65a30d' },
        { min: 70,  max: 79,  label: 'C', en: 'Average',    color: '#ca8a04' },
        { min: 60,  max: 69,  label: 'D', en: 'Below Avg',  color: '#d97706' },
        { min: 0,   max: 59,  label: 'F', en: 'Fail',       color: '#dc2626' }
      ],
      format: (n) => n.toFixed(0) + '%',
      letterGrade: (n) => {
        if (n >= 90) return 'A';
        if (n >= 80) return 'B';
        if (n >= 70) return 'C';
        if (n >= 60) return 'D';
        return 'F';
      }
    },
    german: {
      name: 'German (1–6)',
      flag: '🇩🇪',
      min: 1, max: 6, pass: 4,
      note: 'Lower is better (1 = best, 6 = worst)',
      scale: [
        { min: 1,   max: 1.4, label: 'Sehr gut',       en: 'Very Good',   color: '#16a34a' },
        { min: 1.5, max: 2.4, label: 'Gut',            en: 'Good',        color: '#65a30d' },
        { min: 2.5, max: 3.4, label: 'Befriedigend',   en: 'Satisfactory',color: '#ca8a04' },
        { min: 3.5, max: 4.4, label: 'Ausreichend',    en: 'Sufficient',  color: '#d97706' },
        { min: 4.5, max: 5.4, label: 'Mangelhaft',     en: 'Deficient',   color: '#ea580c' },
        { min: 5.5, max: 6,   label: 'Ungenügend',     en: 'Insufficient',color: '#dc2626' }
      ],
      reversed: true,
      format: (n) => n.toFixed(1)
    },
    greek: {
      name: 'Greek (0–20)',
      flag: '🇬🇷',
      min: 0, max: 20, pass: 10,
      scale: [
        { min: 18,  max: 20,  label: 'Άριστα',    en: 'Excellent',    color: '#16a34a' },
        { min: 15,  max: 17,  label: 'Λίαν Καλώς',en: 'Very Good',    color: '#65a30d' },
        { min: 13,  max: 14,  label: 'Καλώς',     en: 'Good',         color: '#ca8a04' },
        { min: 10,  max: 12,  label: 'Μέτρια',    en: 'Fair',         color: '#d97706' },
        { min: 0,   max: 9,   label: 'Ανεπαρκώς', en: 'Fail',         color: '#dc2626' }
      ],
      format: (n) => n.toFixed(1) + '/20'
    },
    uk: {
      name: 'UK (Percentage + Degree)',
      flag: '🇬🇧',
      min: 0, max: 100, pass: 40,
      scale: [
        { min: 70,  max: 100, label: 'First (1st)',         en: 'First Class',       color: '#16a34a' },
        { min: 60,  max: 69,  label: 'Upper 2nd (2:1)',     en: 'Upper Second',      color: '#65a30d' },
        { min: 50,  max: 59,  label: 'Lower 2nd (2:2)',     en: 'Lower Second',      color: '#ca8a04' },
        { min: 40,  max: 49,  label: 'Third (3rd)',         en: 'Third Class',       color: '#d97706' },
        { min: 0,   max: 39,  label: 'Fail',                en: 'Fail',              color: '#dc2626' }
      ],
      format: (n) => n.toFixed(0) + '%'
    },
    french: {
      name: 'French (0–20)',
      flag: '🇫🇷',
      min: 0, max: 20, pass: 10,
      scale: [
        { min: 16,  max: 20,  label: 'Très Bien',   en: 'Very Good',   color: '#16a34a' },
        { min: 14,  max: 15,  label: 'Bien',        en: 'Good',        color: '#65a30d' },
        { min: 12,  max: 13,  label: 'Assez Bien',  en: 'Fairly Good', color: '#ca8a04' },
        { min: 10,  max: 11,  label: 'Passable',    en: 'Pass',        color: '#d97706' },
        { min: 0,   max: 9,   label: 'Insuffisant', en: 'Fail',        color: '#dc2626' }
      ],
      format: (n) => n.toFixed(1) + '/20'
    },
    ib: {
      name: 'IB (1–7)',
      flag: '🌐',
      min: 1, max: 7, pass: 3,
      scale: [
        { min: 7,   max: 7,   label: '7 – Excellent',        en: 'Excellent',  color: '#16a34a' },
        { min: 6,   max: 6,   label: '6 – Very Good',        en: 'Very Good',  color: '#65a30d' },
        { min: 5,   max: 5,   label: '5 – Good',             en: 'Good',       color: '#84cc16' },
        { min: 4,   max: 4,   label: '4 – Satisfactory',     en: 'Satisfactory',color: '#ca8a04' },
        { min: 3,   max: 3,   label: '3 – Mediocre',         en: 'Mediocre',   color: '#d97706' },
        { min: 2,   max: 2,   label: '2 – Poor',             en: 'Poor',       color: '#ea580c' },
        { min: 1,   max: 1,   label: '1 – Very Poor',        en: 'Very Poor',  color: '#dc2626' }
      ],
      format: (n) => Math.round(n) + '/7'
    }
  };

  // Active grading system (default: Albanian)
  let activeGradingSystemId = localStorage.getItem('shqipai_grading') || 'albanian';

  function getGradingSystem() {
    return GRADING_SYSTEMS[activeGradingSystemId] || GRADING_SYSTEMS.albanian;
  }

  let _syncingGrading = false;

  function setGradingSystem(id) {
    if (!GRADING_SYSTEMS[id]) return;
    activeGradingSystemId = id;
    localStorage.setItem('shqipai_grading', id);
    window.dispatchEvent(new CustomEvent('gradingSystemChanged', { detail: id }));

    // Reverse-sync curriculum if IDs match (avoid infinite loop)
    if (!_syncingGrading && window.CurriculumRAG?.setCurriculum && window.CurriculumRAG.CURRICULA?.[id]) {
      _syncingGrading = true;
      window.CurriculumRAG.setCurriculum(id);
      _syncingGrading = false;
    }
  }

  function getGradeLabel(score, systemId = null) {
    const gs = systemId ? (GRADING_SYSTEMS[systemId] || getGradingSystem()) : getGradingSystem();
    const band = gs.scale.find(b => score >= b.min && score <= b.max);
    return band ? { label: band.label, color: band.color, en: band.en } : { label: '-', color: '#6b7280', en: 'Unknown' };
  }

  function formatGrade(score, systemId = null) {
    const gs = systemId ? (GRADING_SYSTEMS[systemId] || getGradingSystem()) : getGradingSystem();
    return gs.format ? gs.format(score) : score.toString();
  }

  // Cross-system grade conversion
  function convertGrade(score, fromSystemId = 'percentage', toSystemId = 'albanian') {
    const fromSys = GRADING_SYSTEMS[fromSystemId] || { min: 0, max: 100, reversed: false };
    const toSys = GRADING_SYSTEMS[toSystemId] || GRADING_SYSTEMS.albanian;

    // 1. Normalize source score to 0.0 ... 1.0 ratio
    let ratio = 0;
    if (fromSys.reversed) {
      // e.g. German (1 = best, 6 = worst)
      ratio = Math.max(0, Math.min(1, (fromSys.max - score) / (fromSys.max - fromSys.min)));
    } else {
      ratio = Math.max(0, Math.min(1, (score - fromSys.min) / (fromSys.max - fromSys.min)));
    }

    // 2. Map ratio to destination system
    let converted = 0;
    if (toSys.reversed) {
      converted = toSys.max - ratio * (toSys.max - toSys.min);
    } else {
      converted = toSys.min + ratio * (toSys.max - toSys.min);
    }

    return {
      value: converted,
      formatted: formatGrade(converted, toSystemId),
      label: getGradeLabel(converted, toSystemId),
      ratio: ratio
    };
  }

  // Weighted Academic Grade Calculator
  function calculateWeightedGrade(components = {}, weights = { homework: 0.20, tests: 0.50, participation: 0.15, projects: 0.15 }, targetSystemId = null) {
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(components).forEach(([key, val]) => {
      const w = weights[key] || 0;
      if (typeof val === 'number' && !isNaN(val)) {
        weightedSum += val * w;
        totalWeight += w;
      }
    });

    const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    const sysId = targetSystemId || activeGradingSystemId;
    return {
      rawScore: finalScore,
      percentage: Math.round(finalScore) + '%',
      converted: convertGrade(finalScore, 'american', sysId),
      breakdown: components
    };
  }

  // Expose grading APIs globally
  window.GradingSystems         = GRADING_SYSTEMS;
  window.getGradingSystem        = getGradingSystem;
  window.setGradingSystem        = setGradingSystem;
  window.getGradeLabel           = getGradeLabel;
  window.formatGrade             = formatGrade;
  window.convertGrade            = convertGrade;
  window.calculateWeightedGrade  = calculateWeightedGrade;

  // ----------------------------------------------------------------
  // APP STATE
  // ----------------------------------------------------------------
  const AppState = {
    api: {
      key:      'ollama',
      model:    'gemma3:4b',
      endpoint: 'http://localhost:11434/v1/chat/completions'
    },

    account: {
      currentUser: null,
      isLoggedIn:  false,
      isAdmin:     false,
      accountType: null
    },

    prompts: {
      student:   'prompts/student_system.txt',
      teacher:   'prompts/teacher_system.txt',
      developer: 'prompts/developer_encyclopedia.txt'
    },

    ui: {
      sideOpen:            false,
      teacherMode:         false,
      teacherModeUnlocked: false,
      activeTool:          'normal',
      difficulty:          'fillor',
      includeDeveloper:    true
    },

    academic: {
      activeGrade:       null,
      activeChapter:     null,
      focusInstruction:  null
    },

    students: {
      list:       [],
      selectedId: null
    },

    chat: {
      history:      [],
      isProcessing: false
    },

    modes: {
      practice:   false,
      privacy:    false,
      pinProtect: false
    },

    security: {
      teacherPin:      null,
      isAuthenticated: false
    }
  };

  // Grade-to-Chapters mapping
  const gradeChapters = {
    1:  ['Abetare & Alfabeti', 'Fjalë të thjeshta dhe përshëndetje', 'Të dëgjuarit dhe të folurit', 'Fjalitë e thjeshta'],
    2:  ['Leximi i shkurtër', 'Shkrimi i fjalive', 'Numrat dhe emrat', 'Ushtrime shqiptimi'],
    3:  ['Fjala dhe emri', 'Mbiemrat bazë', 'Roli i fjalive', 'Dialogët e përditshëm'],
    4:  ['Fjalitë komplekse', 'Përdorimi i përemrave', 'Kohët bazë', 'Shkrimi i tregimeve të shkurtëra'],
    5:  ['Kohët e shkuara', 'Objektet dhe rrethanorët', 'Paragrafi i lidhur', 'Përshkrime'],
    6:  ['Pjesët e fjalisë dhe rolet', 'Relativet e thjeshta', 'Analiza morfologjike', 'Stilistika fillestare'],
    7:  ['Sintaksa dhe rendi i fjalive', 'Mënyrat dhe modaliteti', 'Negacioni dhe pyetjet', 'Ese e vogël'],
    8:  ['Analiza teksti', 'Perifrastet dhe auxiliarët', 'Stilistika dhe register', 'Analiza letrare'],
    9:  ['Letraria dhe interpretimi', 'Të gjitha kohët – ripërmbledhje', 'Argumentimi dhe retorika', 'Ese temë'],
    10: ['Strukturat komplekse', 'Aspekti dhe koha', 'Analizë letrare e avancuar', 'Tekstet publike'],
    11: ['Teori themelore gjuhësore', 'Historia e normës standarde', 'Përgatitje projektesh', 'Analizë kritike'],
    12: ['Përgatitje për provim', 'Ese gjithëpërfshirëse', 'Analizë sintetike', 'Projekt final letrar']
  };

  const grammarKeywords = [
    { word: 'përemër',    key: 'peremer',   color: '#e11d48', explanation: 'Përemri zëvendëson një emër, p.sh. "ai", "ajo", "ata".' },
    { word: 'përemrat',   key: 'peremer',   color: '#e11d48', explanation: 'Përemrat janë fjalë që zëvendësojnë emrat.' },
    { word: 'kryefjalën', key: 'kryefjale', color: '#0ea5e9', explanation: 'Kryefjala tregon kush vepron në fjali.' },
    { word: 'kallezuesi', key: 'kallezues', color: '#22c55e', explanation: 'Kallëzuesi tregon veprimin ose gjendjen në fjali.' },
    { word: 'objektin',   key: 'objekt',    color: '#a855f7', explanation: 'Objekti është fjala që pëson veprimin.' }
  ];

  function ordinalWord(n) {
    const ordinals = {
      1:'i parë',2:'i dytë',3:'i tretë',4:'i katërt',
      5:'i pesta',6:'i gjashtë',7:'i shtatë',8:'i tetë',
      9:'i nëntë',10:'i dhjetë',11:'i njëmbëdhjetë',12:'i dymbëdhjetë'
    };
    return ordinals[n] || '';
  }

  window.AppState       = AppState;
  window.gradeChapters  = gradeChapters;
  window.grammarKeywords = grammarKeywords;
  window.ordinalWord    = ordinalWord;

  window.getState = () => AppState;

  window.updateState = function(path, value) {
    const keys = path.split('.');
    let obj = AppState;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
  };

  window.ShqipAIModels = {
    getModeSnapshot: () => ({
      teacherMode:  AppState.ui.teacherMode,
      activeTool:   AppState.ui.activeTool,
      difficulty:   AppState.ui.difficulty,
      activeGrade:  AppState.academic.activeGrade,
      activeChapter:AppState.academic.activeChapter,
      practiceMode: AppState.modes.practice,
      privacyMode:  AppState.modes.privacy
    }),
    setPracticeMode: (on) => { AppState.modes.practice   = !!on; },
    setPrivacyMode:  (on) => { AppState.modes.privacy    = !!on; },
    setPinProtect:   (on) => { AppState.modes.pinProtect = !!on; },
    setTeacherPin:   (pin) => { AppState.security.teacherPin = pin ? String(pin).trim() : null; },
    checkTeacherPin: (pin) => {
      if (!AppState.security.teacherPin) return true;
      return String(pin).trim() === AppState.security.teacherPin;
    }
  };

  console.log('✅ AppState initialized · Grading:', activeGradingSystemId);
})();
