// js/plagiarism.js
// ===================================================================
// PLAGIARISM DETECTION ENGINE
// Cosine similarity comparison between student submissions
// TF-IDF based — no external dependencies
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // TEXT PREPROCESSING
  // ----------------------------------------------------------------
  function preprocess(text) {
    if (!text) return [];
    // Strip HTML tags, normalize whitespace, lowercase, split into words
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  // ----------------------------------------------------------------
  // TF-IDF COMPUTATION
  // ----------------------------------------------------------------
  function buildTFIDF(documents) {
    const N = documents.length;
    const df = {};  // document frequency

    // Count document frequency for each term
    const docTermSets = documents.map(doc => {
      const words = preprocess(doc);
      const termSet = new Set(words);
      termSet.forEach(term => {
        df[term] = (df[term] || 0) + 1;
      });
      return words;
    });

    // Build TF-IDF vectors
    return docTermSets.map(words => {
      const tf = {};
      words.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
      const total = words.length || 1;

      const vector = {};
      Object.entries(tf).forEach(([term, count]) => {
        const tfVal = count / total;
        const idf = Math.log(N / (df[term] || 1));
        vector[term] = tfVal * idf;
      });
      return vector;
    });
  }

  // ----------------------------------------------------------------
  // COSINE SIMILARITY
  // ----------------------------------------------------------------
  function cosineSimilarity(vecA, vecB) {
    const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    allTerms.forEach(term => {
      const a = vecA[term] || 0;
      const b = vecB[term] || 0;
      dotProduct += a * b;
      magA += a * a;
      magB += b * b;
    });

    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // ----------------------------------------------------------------
  // N-GRAM SIMILARITY (catches paraphrasing)
  // ----------------------------------------------------------------
  function ngramSimilarity(textA, textB, n = 3) {
    const wordsA = preprocess(textA);
    const wordsB = preprocess(textB);

    if (wordsA.length < n || wordsB.length < n) return 0;

    const ngramsA = new Set();
    for (let i = 0; i <= wordsA.length - n; i++) {
      ngramsA.add(wordsA.slice(i, i + n).join(' '));
    }

    const ngramsB = new Set();
    for (let i = 0; i <= wordsB.length - n; i++) {
      ngramsB.add(wordsB.slice(i, i + n).join(' '));
    }

    let overlap = 0;
    ngramsA.forEach(ng => { if (ngramsB.has(ng)) overlap++; });

    const total = Math.max(ngramsA.size, ngramsB.size);
    return total === 0 ? 0 : overlap / total;
  }

  // ----------------------------------------------------------------
  // COMPARE ALL SUBMISSIONS FOR AN ASSIGNMENT
  // ----------------------------------------------------------------
  function checkAssignment(assignmentId) {
    const td = window.getTeacherData?.();
    if (!td) return [];

    const assignment = td.assignments?.find(a => a.id === assignmentId);
    if (!assignment) return [];

    const submissions = (td.submissions || []).filter(s => s.assignmentId === assignmentId && s.content);

    if (submissions.length < 2) return [];

    // Build TF-IDF vectors
    const texts = submissions.map(s => s.content);
    const vectors = buildTFIDF(texts);

    const results = [];

    // Compare every pair
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const cosSim = cosineSimilarity(vectors[i], vectors[j]);
        const ngramSim = ngramSimilarity(texts[i], texts[j]);

        // Weighted similarity score
        const score = cosSim * 0.6 + ngramSim * 0.4;

        if (score > 0.3) {  // 30% threshold
          const studentA = state.students?.list?.find(s => s.id === submissions[i].studentId);
          const studentB = state.students?.list?.find(s => s.id === submissions[j].studentId);

          results.push({
            studentA: studentA?.name || `Student ${submissions[i].studentId}`,
            studentB: studentB?.name || `Student ${submissions[j].studentId}`,
            studentAId: submissions[i].studentId,
            studentBId: submissions[j].studentId,
            similarity: Math.round(score * 100),
            cosineSim: Math.round(cosSim * 100),
            ngramSim: Math.round(ngramSim * 100),
            flag: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low'
          });
        }
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // ----------------------------------------------------------------
  // PLAGIARISM REPORT UI
  // ----------------------------------------------------------------
  function showReport(assignmentId) {
    const results = checkAssignment(assignmentId);
    const td = window.getTeacherData?.();
    const assignment = td?.assignments?.find(a => a.id === assignmentId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:6000;';

    overlay.innerHTML = `
      <div class="modal" style="width:700px;max-width:95vw;max-height:90vh;overflow-y:auto;padding:0;border-radius:14px">
        <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:20px 24px;color:white">
          <h2 style="margin:0;font-size:18px">🔍 Plagiarism Report</h2>
          <p style="margin:4px 0 0;font-size:12px;opacity:0.85">${assignment?.title || 'Assignment'}</p>
        </div>
        <div style="padding:20px 24px">
          ${results.length === 0 ? `
            <div style="text-align:center;padding:40px">
              <div style="font-size:48px;margin-bottom:12px">✅</div>
              <h3 style="margin:0;color:#059669">No Plagiarism Detected</h3>
              <p style="color:var(--muted);font-size:13px;margin-top:4px">All submissions appear to be original work.</p>
            </div>
          ` : `
            <div style="margin-bottom:16px;padding:12px;background:#fef2f2;border-radius:8px;font-size:12px;color:#991b1b">
              ⚠️ Found ${results.length} suspicious pair(s). Review the matches below.
            </div>
            ${results.map(r => `
              <div style="padding:14px;border:2px solid ${r.flag === 'high' ? '#ef4444' : r.flag === 'medium' ? '#f59e0b' : '#d1d5db'};
                border-radius:10px;margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div style="font-weight:700;font-size:14px">
                    ${r.studentA} ↔ ${r.studentB}
                  </div>
                  <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;
                    background:${r.flag === 'high' ? '#fee2e2' : r.flag === 'medium' ? '#fef3c7' : '#f1f5f9'};
                    color:${r.flag === 'high' ? '#dc2626' : r.flag === 'medium' ? '#d97706' : '#6b7280'}">
                    ${r.similarity}% Match
                  </span>
                </div>
                <div style="display:flex;gap:16px;font-size:11px;color:var(--muted)">
                  <span>Content overlap: ${r.cosineSim}%</span>
                  <span>Phrase match: ${r.ngramSim}%</span>
                </div>
              </div>
            `).join('')}
          `}
          <div style="text-align:right;margin-top:16px">
            <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.PlagiarismCheck = {
    checkAssignment,
    showReport,
    cosineSimilarity,
    ngramSimilarity,
    preprocess,
    buildTFIDF
  };

  console.log('✅ Plagiarism detection module loaded');
})();
