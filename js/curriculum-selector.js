// js/curriculum-selector.js
// ===================================================================
// CURRICULUM SELECTOR UI
// Dropdown + badge for selecting active curriculum system
// ===================================================================

(function () {
  'use strict';

  let selectorCreated = false;

  function createSelector() {
    if (selectorCreated) return;
    selectorCreated = true;

    const rag = window.CurriculumRAG;
    if (!rag) return;

    // Add to sidebar (student section)
    const studentTools = document.getElementById('studentToolsSection');
    if (!studentTools) return;

    const section = document.createElement('div');
    section.style.cssText = 'margin-top:10px;';
    section.innerHTML = `
      <h2 class="panel-title">🎓 Curriculum</h2>
      <select id="curriculumSelect" style="
        width:100%; padding:9px 12px; border-radius:8px;
        border:1px solid var(--border); background:var(--input-bg);
        color:var(--text); font-family:inherit; font-size:13px;
        cursor:pointer;
      ">
        ${Object.entries(rag.CURRICULA).map(([id, c]) =>
          `<option value="${id}" ${id === rag.activeCurriculum ? 'selected' : ''}>
            ${c.flag} ${c.name}
          </option>`
        ).join('')}
      </select>
      <div id="curriculumBadge" style="
        margin-top:6px; font-size:11px; color:var(--muted);
        display:flex; align-items:center; gap:4px;
      ">
        <span id="curriculumFlag">${rag.getCurriculum().flag}</span>
        <span id="curriculumLabel">${rag.getCurriculum().name}</span>
      </div>
    `;

    // Insert after difficulty panel
    const diffPanel = document.getElementById('difficultyPanel');
    if (diffPanel && diffPanel.parentElement) {
      diffPanel.parentElement.insertAdjacentElement('afterend', section);
    } else {
      studentTools.appendChild(section);
    }

    // Event
    document.getElementById('curriculumSelect')?.addEventListener('change', (e) => {
      rag.setCurriculum(e.target.value);
      updateBadge();
      const curr = rag.getCurriculum();
      window.Toast?.success(`Curriculum & grading: ${curr.name}`);
    });
  }

  function updateBadge() {
    const rag = window.CurriculumRAG;
    if (!rag) return;
    const c = rag.getCurriculum();
    const flag = document.getElementById('curriculumFlag');
    const label = document.getElementById('curriculumLabel');
    if (flag) flag.textContent = c.flag;
    if (label) label.textContent = c.name;
  }

  // Also add to settings panel if it exists
  window.addEventListener('curriculumChanged', updateBadge);

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(createSelector, 500));
  } else {
    setTimeout(createSelector, 500);
  }

  window.CurriculumSelector = { createSelector, updateBadge };
  console.log('✅ Curriculum selector loaded');
})();
