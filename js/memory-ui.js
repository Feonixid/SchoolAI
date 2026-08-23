// js/memory-ui.js
// Memory Settings UI Panel for viewing and editing AI memory
// ===================================================================

(function () {
  'use strict';

  let panelVisible = false;

  // ----------------------------------------------------------------
  // CREATE PANEL HTML
  // ----------------------------------------------------------------
  function createPanel() {
    if (document.getElementById('memoryPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'memoryPanel';
    panel.className = 'memory-panel hidden';
    panel.innerHTML = `
      <div class="memory-overlay" onclick="window.MemoryUI?.hide()"></div>
      <div class="memory-content">
        <div class="memory-header">
          <h3>AI Memory Settings</h3>
          <button class="memory-close" onclick="window.MemoryUI?.hide()">&times;</button>
        </div>
        
        <div class="memory-tabs">
          <button class="memory-tab active" data-tab="identity">Identity</button>
          <button class="memory-tab" data-tab="subjects">Subjects</button>
          <button class="memory-tab" data-tab="data">My Data</button>
        </div>
        
        <div class="memory-body">
          <!-- Identity Tab -->
          <div class="memory-pane active" id="memoryIdentity">
            <div class="memory-field">
              <label>Name</label>
              <input type="text" id="memoryName" placeholder="Your name">
            </div>
            <div class="memory-field">
              <label>Grade Level</label>
              <select id="memoryGrade">
                <option value="">Select grade</option>
                <option value="9">9th Grade</option>
                <option value="10">10th Grade</option>
                <option value="11">11th Grade</option>
                <option value="12">12th Grade</option>
              </select>
            </div>
            <div class="memory-field">
              <label>Learning Style</label>
              <select id="memoryStyle">
                <option value="">Select style</option>
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading">Reading/Writing</option>
                <option value="kinesthetic">Kinesthetic</option>
              </select>
            </div>
            <div class="memory-field">
              <label>Difficulty Preference</label>
              <select id="memoryDifficulty">
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div class="memory-field">
              <label>Goals (one per line)</label>
              <textarea id="memoryGoals" placeholder="Learn Python&#10;Master algebra"></textarea>
            </div>
            <button class="memory-save" onclick="window.MemoryUI?.saveIdentity()">Save Identity</button>
          </div>
          
          <!-- Subjects Tab -->
          <div class="memory-pane" id="memorySubjects">
            <div class="memory-subject-list" id="memorySubjectList">
              <!-- Populated dynamically -->
            </div>
            <div id="memorySubjectDetail" style="display:none">
              <h4 id="memorySubjectTitle"></h4>
              <div class="memory-field">
                <label>Learned Concepts</label>
                <div id="memoryConcepts" class="memory-tags"></div>
              </div>
              <div class="memory-field">
                <label>Struggling Areas</label>
                <div id="memoryStruggles" class="memory-tags"></div>
              </div>
              <button class="memory-back" onclick="window.MemoryUI?.showSubjectList()">Back to Subjects</button>
            </div>
          </div>
          
          <!-- Data Tab -->
          <div class="memory-pane" id="memoryData">
            <p class="memory-info">View your stored data and export options.</p>
            <div class="memory-stats" id="memoryStats">
              <!-- Populated dynamically -->
            </div>
            <div class="memory-actions">
              <button onclick="window.MemoryUI?.exportData()">Export Data</button>
              <button onclick="window.MemoryUI?.clearSubjectMemory()" class="danger">Clear Subject Memory</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    addStyles();
    initTabHandlers();
  }

  // ----------------------------------------------------------------
  // STYLES
  // ----------------------------------------------------------------
  function addStyles() {
    if (document.getElementById('memoryUIStyles')) return;

    const style = document.createElement('style');
    style.id = 'memoryUIStyles';
    style.textContent = `
      .memory-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .memory-panel.hidden { display: none; }
      .memory-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
      }
      .memory-content {
        position: relative;
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 48px rgba(0,0,0,0.4);
      }
      .memory-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #21262d;
        background: #0d1117;
      }
      .memory-header h3 {
        margin: 0;
        font-size: 16px;
        color: #e6edf3;
      }
      .memory-close {
        background: none;
        border: none;
        color: #8b949e;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      .memory-close:hover { color: #f85149; }
      .memory-tabs {
        display: flex;
        border-bottom: 1px solid #21262d;
        background: #161b22;
      }
      .memory-tab {
        flex: 1;
        padding: 12px;
        background: none;
        border: none;
        color: #8b949e;
        font-size: 13px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }
      .memory-tab:hover { color: #c9d1d9; background: #21262d; }
      .memory-tab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
      .memory-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }
      .memory-pane { display: none; }
      .memory-pane.active { display: block; }
      .memory-field {
        margin-bottom: 16px;
      }
      .memory-field label {
        display: block;
        font-size: 12px;
        color: #8b949e;
        margin-bottom: 6px;
        font-weight: 600;
      }
      .memory-field input,
      .memory-field select,
      .memory-field textarea {
        width: 100%;
        padding: 10px 12px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 6px;
        color: #c9d1d9;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
      }
      .memory-field input:focus,
      .memory-field select:focus,
      .memory-field textarea:focus {
        border-color: #58a6ff;
        outline: none;
      }
      .memory-field textarea {
        min-height: 80px;
        resize: vertical;
      }
      .memory-save {
        width: 100%;
        padding: 12px;
        background: #238636;
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.2s;
      }
      .memory-save:hover { filter: brightness(1.15); }
      .memory-info {
        color: #8b949e;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .memory-stats {
        background: #0d1117;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .memory-stats-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #21262d;
      }
      .memory-stats-item:last-child { border-bottom: none; }
      .memory-stats-label { color: #8b949e; }
      .memory-stats-value { color: #e6edf3; font-weight: 600; }
      .memory-actions {
        display: flex;
        gap: 12px;
      }
      .memory-actions button {
        flex: 1;
        padding: 10px;
        border: 1px solid #30363d;
        border-radius: 6px;
        background: #21262d;
        color: #c9d1d9;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .memory-actions button:hover { background: #30363d; }
      .memory-actions button.danger { color: #f85149; border-color: #f85149; }
      .memory-actions button.danger:hover { background: rgba(248,81,73,0.1); }
      .memory-subject-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .memory-subject-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .memory-subject-item:hover { border-color: #58a6ff; }
      .memory-subject-name { color: #e6edf3; font-weight: 500; }
      .memory-subject-count { color: #8b949e; font-size: 12px; }
      .memory-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .memory-tag {
        padding: 4px 10px;
        background: #21262d;
        border-radius: 12px;
        font-size: 12px;
        color: #c9d1d9;
      }
      .memory-back {
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 10px 16px;
        color: #c9d1d9;
        cursor: pointer;
        margin-top: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------------------
  // TAB HANDLERS
  // ----------------------------------------------------------------
  function initTabHandlers() {
    document.querySelectorAll('.memory-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.memory-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.memory-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`memory${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`)?.classList.add('active');
        
        // Load data for the tab
        if (tab.dataset.tab === 'identity') loadIdentityData();
        if (tab.dataset.tab === 'subjects') loadSubjectsData();
        if (tab.dataset.tab === 'data') loadStatsData();
      });
    });
  }

  // ----------------------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------------------
  async function loadIdentityData() {
    if (!window.Memory) return;
    
    const identity = await window.Memory.getIdentity();
    if (!identity) return;

    document.getElementById('memoryName').value = identity.name || '';
    document.getElementById('memoryGrade').value = identity.gradeLevel || '';
    document.getElementById('memoryStyle').value = identity.learningStyle || '';
    document.getElementById('memoryDifficulty').value = identity.preferences?.difficulty || 'medium';
    document.getElementById('memoryGoals').value = (identity.goals || []).join('\n');
  }

  async function loadSubjectsData() {
    if (!window.Memory || !window.Subjects) return;

    const subjects = window.Subjects.getAll() || [];
    const list = document.getElementById('memorySubjectList');
    if (!list) return;

    list.innerHTML = '';

    for (const subject of subjects) {
      const mem = await window.Memory.getSubjectMemory(subject.id);
      const conceptCount = mem?.learnedConcepts?.length || 0;
      const historyCount = mem?.conversationHistory?.length || 0;

      const item = document.createElement('div');
      item.className = 'memory-subject-item';
      item.innerHTML = `
        <span class="memory-subject-name">${subject.name}</span>
        <span class="memory-subject-count">${conceptCount} concepts · ${historyCount} messages</span>
      `;
      item.addEventListener('click', () => showSubjectDetail(subject, mem));
      list.appendChild(item);
    }
  }

  function showSubjectDetail(subject, mem) {
    document.getElementById('memorySubjectList').style.display = 'none';
    const detail = document.getElementById('memorySubjectDetail');
    detail.style.display = 'block';

    document.getElementById('memorySubjectTitle').textContent = subject.name;

    const concepts = document.getElementById('memoryConcepts');
    concepts.innerHTML = (mem?.learnedConcepts || []).map(c => 
      `<span class="memory-tag">${c}</span>`
    ).join('') || '<span style="color:#8b949e">No concepts recorded yet</span>';

    const struggles = document.getElementById('memoryStruggles');
    struggles.innerHTML = (mem?.strugglingAreas || []).map(s => 
      `<span class="memory-tag" style="background:rgba(248,81,73,0.15);color:#f85149">${s}</span>`
    ).join('') || '<span style="color:#8b949e">No struggling areas identified</span>';
  }

  function showSubjectList() {
    document.getElementById('memorySubjectList').style.display = '';
    document.getElementById('memorySubjectDetail').style.display = 'none';
  }

  async function loadStatsData() {
    if (!window.Memory) return;

    const identity = await window.Memory.getIdentity();
    const stats = document.getElementById('memoryStats');
    if (!stats) return;

    stats.innerHTML = `
      <div class="memory-stats-item">
        <span class="memory-stats-label">Total Sessions</span>
        <span class="memory-stats-value">${identity?.totalSessions || 0}</span>
      </div>
      <div class="memory-stats-item">
        <span class="memory-stats-label">Last Active</span>
        <span class="memory-stats-value">${identity?.lastActive ? new Date(identity.lastActive).toLocaleDateString() : 'Never'}</span>
      </div>
      <div class="memory-stats-item">
        <span class="memory-stats-label">Theme Preference</span>
        <span class="memory-stats-value">${identity?.preferences?.theme || 'auto'}</span>
      </div>
      <div class="memory-stats-item">
        <span class="memory-stats-label">Language</span>
        <span class="memory-stats-value">${identity?.preferences?.language || 'sq'}</span>
      </div>
    `;
  }

  // ----------------------------------------------------------------
  // SAVE DATA
  // ----------------------------------------------------------------
  async function saveIdentity() {
    if (!window.Memory) return;

    const name = document.getElementById('memoryName').value;
    const gradeLevel = document.getElementById('memoryGrade').value;
    const learningStyle = document.getElementById('memoryStyle').value;
    const difficulty = document.getElementById('memoryDifficulty').value;
    const goalsText = document.getElementById('memoryGoals').value;
    const goals = goalsText.split('\n').map(g => g.trim()).filter(g => g);

    const success = await window.Memory.setIdentity({
      name,
      gradeLevel: gradeLevel ? parseInt(gradeLevel) : null,
      learningStyle,
      preferences: { difficulty },
      goals
    });

    if (success) {
      window.Toast?.success('Identity saved!');
    } else {
      window.Toast?.error('Failed to save identity');
    }
  }

  // ----------------------------------------------------------------
  // EXPORT / CLEAR
  // ----------------------------------------------------------------
  async function exportData() {
    if (!window.Memory) return;

    const identity = await window.Memory.getIdentity();
    const data = { identity, subjects: {} };

    // Get all subject memories
    if (window.Subjects) {
      const subjects = window.Subjects.getAll() || [];
      for (const subject of subjects) {
        data.subjects[subject.id] = await window.Memory.getSubjectMemory(subject.id);
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shqipai-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.Toast?.success('Memory data exported!');
  }

  async function clearSubjectMemory() {
    if (!confirm('Clear all subject memories? This cannot be undone.')) return;
    if (!window.Memory) return;

    window.Memory.clearCache();
    window.Toast?.success('Subject memory cleared');
    loadSubjectsData();
  }

  // ----------------------------------------------------------------
  // SHOW / HIDE
  // ----------------------------------------------------------------
  function show() {
    createPanel();
    document.getElementById('memoryPanel')?.classList.remove('hidden');
    panelVisible = true;
    loadIdentityData();
  }

  function hide() {
    document.getElementById('memoryPanel')?.classList.add('hidden');
    panelVisible = false;
  }

  function toggle() {
    panelVisible ? hide() : show();
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.MemoryUI = {
    show,
    hide,
    toggle,
    saveIdentity,
    exportData,
    clearSubjectMemory,
    showSubjectList
  };

  console.log('Memory UI module loaded');
})();
