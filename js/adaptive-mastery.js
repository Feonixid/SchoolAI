// js/adaptive-mastery.js
// ===================================================================
// ADAPTIVE KNOWLEDGE-GRAPH MASTERY ENGINE
// Models curriculum dependencies, computes Bayesian Knowledge Tracing (BKT)
// mastery probability, and dynamically fast-tracks or scaffolds learners.
// ===================================================================

(function () {
  'use strict';

  const KNOWLEDGE_GRAPH = {
    matematike: {
      'g10_algebra': { label: 'Shprehjet Algjebrike', prereqs: [], difficulty: 1 },
      'g10_quadratics': { label: 'Ekuacionet Kuadratike', prereqs: ['g10_algebra'], difficulty: 2 },
      'g10_functions': { label: 'Funksionet & Grafiku', prereqs: ['g10_quadratics'], difficulty: 3 },
      'g11_trigonometry': { label: 'Trigonometria', prereqs: ['g10_functions'], difficulty: 4 },
      'g12_calculus': { label: 'Analiza Matematike (Derivati & Integrali)', prereqs: ['g11_trigonometry'], difficulty: 5 }
    },
    fizike: {
      'g10_kinematics': { label: 'Kinematika & Shpejtësia', prereqs: [], difficulty: 1 },
      'g10_newton_laws': { label: 'Ligjet e Njutonit & Forca', prereqs: ['g10_kinematics'], difficulty: 2 },
      'g10_energy': { label: 'Puna, Fuqia & Energjia', prereqs: ['g10_newton_laws'], difficulty: 3 },
      'g11_circuits': { label: 'Rryma Elektrike & Qarqet DC', prereqs: ['g10_energy'], difficulty: 4 },
      'g12_optics_quantum': { label: 'Optika & Fizika Kuantike', prereqs: ['g11_circuits'], difficulty: 5 }
    }
  };

  const STORAGE_KEY = 'eduai_adaptive_mastery_state';

  function getMasteryState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveMasteryState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save mastery state:', e);
    }
  }

  /**
   * Updates skill mastery based on student performance (correct vs incorrect)
   * Using simplified Bayesian Knowledge Tracing:
   * P(L_t) = P(L_{t-1}) + alpha * (1 - P(L_{t-1})) [on success]
   */
  function recordPerformance(subjectId, skillId, isCorrect) {
    const state = getMasteryState();
    const subKey = `${subjectId}_${skillId}`;
    const currentP = state[subKey] !== undefined ? state[subKey] : 0.2; // initial prior

    let newP;
    if (isCorrect) {
      // Learning transition rate alpha = 0.35
      newP = Math.min(0.99, currentP + 0.35 * (1 - currentP));
    } else {
      // Slip / review adjustment
      newP = Math.max(0.05, currentP - 0.25 * currentP);
    }

    state[subKey] = parseFloat(newP.toFixed(3));
    saveMasteryState(state);

    return {
      skillId,
      probabilityOfMastery: state[subKey],
      mastered: state[subKey] >= 0.85,
      needsScaffolding: state[subKey] < 0.60
    };
  }

  /**
   * Evaluates the entire skill graph and recommends the next best learning step
   */
  function getNextRecommendation(subjectId = 'matematike') {
    const state = getMasteryState();
    const graph = KNOWLEDGE_GRAPH[subjectId] || KNOWLEDGE_GRAPH.matematike;

    for (const [skillId, meta] of Object.entries(graph)) {
      const subKey = `${subjectId}_${skillId}`;
      const mastery = state[subKey] || 0;

      // Check prerequisites
      const prereqsMet = meta.prereqs.every(p => (state[`${subjectId}_${p}`] || 0) >= 0.80);

      if (prereqsMet && mastery < 0.85) {
        return {
          status: 'ready_to_learn',
          subjectId,
          skillId,
          title: meta.label,
          difficulty: meta.difficulty,
          currentMasteryPct: Math.round(mastery * 100),
          action: mastery < 0.40 ? 'Start Interactive Visual Lab' : 'Take Practice Problem Set',
          scaffoldingRequired: mastery < 0.50
        };
      }
    }

    // All standard skills mastered -> Fast-track to Olympiad / Matura challenge
    return {
      status: 'fast_track_olympiad',
      subjectId,
      skillId: 'olympiad_ext',
      title: 'Sfida e Avancuar: Niveli i Maturës & Olimpiadës',
      difficulty: 6,
      currentMasteryPct: 100,
      action: 'Launch Deep Investigation Project',
      scaffoldingRequired: false
    };
  }

  // Export
  window.AdaptiveMastery = {
    KNOWLEDGE_GRAPH,
    recordPerformance,
    getNextRecommendation,
    getMasteryState
  };

  console.log('✅ Adaptive Knowledge-Graph Mastery Engine loaded');
})();
