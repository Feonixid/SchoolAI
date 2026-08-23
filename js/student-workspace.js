// js/student-workspace.js
// ===================================================================
// STUDENT ASSIGNMENT WORKSPACE
// Launches Office Online (Word/PowerPoint) in a locked iframe overlay
// Teacher can enable "hard lock" mode to prevent students from leaving
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // OFFICE TOOL TYPES
  // ----------------------------------------------------------------
  const TOOLS = {
    word: {
      id: 'word',
      name: 'Word Online',
      icon: '📝',
      color: '#2b579a',
      url: 'https://www.office.com/launch/word',
      fallbackUrl: 'https://docs.google.com/document/create',
      description: 'Write essays and reports (needs internet)'
    },
    powerpoint: {
      id: 'powerpoint',
      name: 'PowerPoint Online',
      icon: '📊',
      color: '#b7472a',
      url: 'https://www.office.com/launch/powerpoint',
      fallbackUrl: 'https://docs.google.com/presentation/create',
      description: 'Create presentations (needs internet)'
    },
    slides: {
      id: 'slides',
      name: 'Slide Builder',
      icon: '🎨',
      color: '#7c3aed',
      url: null,
      description: 'Build presentations offline — 6 themes'
    },
    excel: {
      id: 'excel',
      name: 'Excel Online',
      icon: '📈',
      color: '#217346',
      url: 'https://www.office.com/launch/excel',
      fallbackUrl: 'https://docs.google.com/spreadsheets/create',
      description: 'Data and charts (needs internet)'
    },
    editor: {
      id: 'editor',
      name: 'Text Editor',
      icon: '✏️',
      color: '#6366f1',
      url: null,
      description: 'Rich text editor — works offline'
    }
  };

  let activeWorkspace = null;  // { assignmentId, tool, locked, overlay }
  let autosaveTimer = null;

  // ----------------------------------------------------------------
  // OPEN WORKSPACE — main entry point
  // ----------------------------------------------------------------
  function openWorkspace(assignment, toolId = 'word', hardLock = false) {
    if (activeWorkspace) {
      console.warn('Workspace already open');
      return;
    }

    const tool = TOOLS[toolId] || TOOLS.word;

    // Special: Slide Builder opens its own module
    if (toolId === 'slides' && window.SlideBuilder) {
      window.SlideBuilder.openBuilder(assignment);
      return;
    }

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'workspaceOverlay';
    overlay.className = 'workspace-overlay';

    // Build header
    const header = document.createElement('div');
    header.className = 'workspace-header';

    const titleSection = document.createElement('div');
    titleSection.className = 'workspace-title-section';
    titleSection.innerHTML = `
      <span class="workspace-tool-icon" style="background:${tool.color}">${tool.icon}</span>
      <div>
        <div class="workspace-title">${assignment.title || 'Assignment'}</div>
        <div class="workspace-subtitle">
          ${tool.name} · ${assignment.dueDate ? 'Due: ' + new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
        </div>
      </div>
    `;

    const actionsSection = document.createElement('div');
    actionsSection.className = 'workspace-actions';

    // Save draft button
    const saveDraftBtn = document.createElement('button');
    saveDraftBtn.className = 'workspace-btn workspace-btn-secondary';
    saveDraftBtn.innerHTML = '💾 Save Draft';
    saveDraftBtn.addEventListener('click', () => saveDraft(assignment.id));

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'workspace-btn workspace-btn-primary';
    submitBtn.innerHTML = '📤 Submit Assignment';
    submitBtn.addEventListener('click', () => submitWork(assignment));

    // Close button (hidden in hard lock mode)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'workspace-btn workspace-btn-close';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Close workspace';
    if (hardLock) {
      closeBtn.style.display = 'none';  // Hidden in hard lock
    }
    closeBtn.addEventListener('click', () => closeWorkspace(assignment.id));

    actionsSection.appendChild(saveDraftBtn);
    actionsSection.appendChild(submitBtn);
    actionsSection.appendChild(closeBtn);

    header.appendChild(titleSection);
    header.appendChild(actionsSection);
    overlay.appendChild(header);

    // Assignment instructions panel (collapsible)
    if (assignment.description) {
      const instrPanel = document.createElement('div');
      instrPanel.className = 'workspace-instructions';
      instrPanel.innerHTML = `
        <div class="workspace-instructions-toggle" id="instrToggle">
          📋 Assignment Instructions <span class="toggle-arrow">▼</span>
        </div>
        <div class="workspace-instructions-body" id="instrBody" style="display:none;">
          <p>${assignment.description}</p>
          ${assignment.questions && assignment.questions.length > 0 ? `
            <div class="workspace-questions">
              <strong>Questions:</strong>
              <ol>${assignment.questions.map(q => `<li>${q.text}</li>`).join('')}</ol>
            </div>
          ` : ''}
        </div>
      `;
      overlay.appendChild(instrPanel);

      // Toggle instructions
      setTimeout(() => {
        const toggle = document.getElementById('instrToggle');
        const body = document.getElementById('instrBody');
        if (toggle && body) {
          toggle.addEventListener('click', () => {
            const showing = body.style.display !== 'none';
            body.style.display = showing ? 'none' : 'block';
            toggle.querySelector('.toggle-arrow').textContent = showing ? '▼' : '▲';
          });
        }
      }, 100);
    }

    // Content area — either iframe or built-in editor
    const content = document.createElement('div');
    content.className = 'workspace-content';

    if (tool.url) {
      // Office Online iframe
      const iframe = document.createElement('iframe');
      iframe.className = 'workspace-iframe';
      iframe.src = tool.url;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      iframe.setAttribute('allow', 'clipboard-read; clipboard-write');

      // Fallback notice
      const fallbackNotice = document.createElement('div');
      fallbackNotice.className = 'workspace-fallback';
      fallbackNotice.innerHTML = `
        <p>If ${tool.name} doesn't load, <a href="#" id="tryFallback">try Google Docs</a> or 
        <a href="#" id="useBuiltin">use the built-in editor</a></p>
      `;

      content.appendChild(iframe);
      content.appendChild(fallbackNotice);

      setTimeout(() => {
        document.getElementById('tryFallback')?.addEventListener('click', (e) => {
          e.preventDefault();
          iframe.src = tool.fallbackUrl;
        });
        document.getElementById('useBuiltin')?.addEventListener('click', (e) => {
          e.preventDefault();
          switchToBuiltinEditor(content, assignment);
        });
      }, 100);
    } else {
      // Built-in rich text editor
      buildRichTextEditor(content, assignment);
    }

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Store active workspace state
    activeWorkspace = {
      assignmentId: assignment.id,
      tool: tool,
      locked: hardLock,
      overlay: overlay
    };

    // Hard lock: block keyboard shortcuts
    if (hardLock) {
      document.addEventListener('keydown', hardLockKeyHandler, true);
      overlay.addEventListener('contextmenu', e => e.preventDefault());
    }

    // Auto-save every 30 seconds
    autosaveTimer = setInterval(() => saveDraft(assignment.id, true), 30000);

    // Restore draft if exists
    restoreDraft(assignment.id);

    console.log(`📝 Workspace opened: ${tool.name} for "${assignment.title}" ${hardLock ? '(LOCKED)' : ''}`);
  }

  // ----------------------------------------------------------------
  // HARD LOCK KEY HANDLER
  // ----------------------------------------------------------------
  function hardLockKeyHandler(e) {
    // Block Alt+Tab, Alt+F4, Ctrl+W, Win key, Escape
    if (
      (e.altKey && e.key === 'Tab') ||
      (e.altKey && e.key === 'F4') ||
      (e.ctrlKey && e.key === 'w') ||
      (e.ctrlKey && e.key === 'W') ||
      e.key === 'Meta' ||
      e.key === 'Escape'
    ) {
      e.preventDefault();
      e.stopPropagation();
      showLockNotice();
      return false;
    }
  }

  function showLockNotice() {
    let notice = document.getElementById('lockNotice');
    if (notice) return; // already showing
    notice = document.createElement('div');
    notice.id = 'lockNotice';
    notice.className = 'workspace-lock-notice';
    notice.innerHTML = `
      <div class="lock-notice-content">
        <span style="font-size:24px">🔒</span>
        <div>
          <strong>Workspace is locked</strong>
          <p>Submit your assignment or save a draft to exit.</p>
        </div>
      </div>
    `;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 3000);
  }

  // ----------------------------------------------------------------
  // BUILT-IN RICH TEXT EDITOR
  // ----------------------------------------------------------------
  function buildRichTextEditor(container, assignment) {
    container.innerHTML = `
      <div class="workspace-editor-wrap">
        <div class="workspace-toolbar">
          <button class="toolbar-btn" data-cmd="bold" title="Bold"><b>B</b></button>
          <button class="toolbar-btn" data-cmd="italic" title="Italic"><i>I</i></button>
          <button class="toolbar-btn" data-cmd="underline" title="Underline"><u>U</u></button>
          <span class="toolbar-sep"></span>
          <button class="toolbar-btn" data-cmd="formatBlock" data-val="H2" title="Heading">H</button>
          <button class="toolbar-btn" data-cmd="formatBlock" data-val="P" title="Paragraph">¶</button>
          <span class="toolbar-sep"></span>
          <button class="toolbar-btn" data-cmd="insertUnorderedList" title="Bullet list">•</button>
          <button class="toolbar-btn" data-cmd="insertOrderedList" title="Numbered list">1.</button>
          <span class="toolbar-sep"></span>
          <button class="toolbar-btn" data-cmd="justifyLeft" title="Align left">⫷</button>
          <button class="toolbar-btn" data-cmd="justifyCenter" title="Align center">⫿</button>
          <button class="toolbar-btn" data-cmd="justifyRight" title="Align right">⫸</button>
          <span class="toolbar-sep"></span>
          <button class="toolbar-btn" data-cmd="undo" title="Undo">↶</button>
          <button class="toolbar-btn" data-cmd="redo" title="Redo">↷</button>
        </div>
        <div class="workspace-editor" contenteditable="true" id="workspaceEditor"
             data-placeholder="Start writing your assignment here..."></div>
        <div class="workspace-editor-footer">
          <span id="workspaceWordCount">0 words</span>
          <span id="workspaceAutoSave" style="color:var(--muted)">Auto-save enabled</span>
        </div>
      </div>
    `;

    // Wire toolbar
    setTimeout(() => {
      container.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cmd = btn.dataset.cmd;
          const val = btn.dataset.val || null;
          document.execCommand(cmd, false, val);
          document.getElementById('workspaceEditor')?.focus();
        });
      });

      // Word count
      const editor = document.getElementById('workspaceEditor');
      if (editor) {
        editor.addEventListener('input', () => {
          const text = editor.innerText.trim();
          const words = text ? text.split(/\s+/).length : 0;
          const counter = document.getElementById('workspaceWordCount');
          if (counter) counter.textContent = `${words} words`;
        });
      }
    }, 100);
  }

  function switchToBuiltinEditor(container, assignment) {
    buildRichTextEditor(container, assignment);
    restoreDraft(assignment.id);
  }

  // ----------------------------------------------------------------
  // DRAFT SAVE / RESTORE
  // ----------------------------------------------------------------
  function saveDraft(assignmentId, silent = false) {
    const editor = document.getElementById('workspaceEditor');
    if (!editor) return;

    const draft = {
      content: editor.innerHTML,
      savedAt: Date.now()
    };
    localStorage.setItem(`shqipai_draft_${assignmentId}`, JSON.stringify(draft));

    if (!silent) {
      const indicator = document.getElementById('workspaceAutoSave');
      if (indicator) {
        indicator.textContent = '✅ Draft saved';
        indicator.style.color = '#16a34a';
        setTimeout(() => {
          indicator.textContent = 'Auto-save enabled';
          indicator.style.color = 'var(--muted)';
        }, 2000);
      }
    }
  }

  function restoreDraft(assignmentId) {
    const editor = document.getElementById('workspaceEditor');
    if (!editor) return;

    const saved = localStorage.getItem(`shqipai_draft_${assignmentId}`);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        editor.innerHTML = draft.content || '';
        const time = new Date(draft.savedAt).toLocaleTimeString();
        const indicator = document.getElementById('workspaceAutoSave');
        if (indicator) indicator.textContent = `Draft restored from ${time}`;
      } catch (e) { /* ignore parse errors */ }
    }
  }

  // ----------------------------------------------------------------
  // SUBMIT WORK
  // ----------------------------------------------------------------
  async function submitWork(assignment) {
    const editor = document.getElementById('workspaceEditor');
    const content = editor ? editor.innerHTML : '';

    if (!content.trim() && !activeWorkspace?.tool?.url) {
      alert('⚠️ Please write something before submitting.');
      return;
    }

    // Get student ID (fallback to active student in list or default)
    let studentId = state.students?.selectedId ||
                    parseInt(localStorage.getItem('shqipai_logged_student')) ||
                    (state.students?.list?.[0]?.id) ||
                    1;

    if (!state.students?.list || state.students.list.length === 0) {
      if (state.students) {
        state.students.list = [{
          id: 1,
          name: 'Student Demo',
          firstName: 'Student',
          lastName: 'Demo',
          gradeLevel: 10,
          semesters: {
            semester1: { detyra: [], projekti: null, testi: null, mesatarja: null },
            semester2: { detyra: [], projekti: null, testi: null, mesatarja: null },
            semester3: { detyra: [], projekti: null, testi: null, mesatarja: null }
          }
        }];
      }
    }

    // Submit via Assignments module
    if (window.Assignments?.submitAssignment) {
      await window.Assignments.submitAssignment(assignment.id, studentId, content);
    }

    // Clear draft
    localStorage.removeItem(`shqipai_draft_${assignment.id}`);

    // Show success message
    if (window.Toast?.success) {
      window.Toast.success('Assignment submitted successfully!');
    } else {
      alert('✅ Assignment submitted successfully!');
    }

    // Close workspace
    closeWorkspace(assignment.id, true);
  }

  // ----------------------------------------------------------------
  // CLOSE WORKSPACE
  // ----------------------------------------------------------------
  function closeWorkspace(assignmentId, forceClose = false) {
    if (!activeWorkspace) return;

    if (activeWorkspace.locked && !forceClose) {
      showLockNotice();
      return;
    }

    // Save draft before closing
    if (!forceClose) {
      const editor = document.getElementById('workspaceEditor');
      if (editor && editor.innerHTML.trim()) {
        saveDraft(assignmentId);
      }
    }

    // Cleanup
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
      autosaveTimer = null;
    }
    document.removeEventListener('keydown', hardLockKeyHandler, true);

    activeWorkspace.overlay?.remove();
    activeWorkspace = null;

    console.log('📝 Workspace closed');
  }

  // ----------------------------------------------------------------
  // TOOL PICKER MODAL — lets student (or teacher) choose tool
  // ----------------------------------------------------------------
  function openToolPicker(assignment, hardLock = false) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '500';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:500px;max-width:95vw">
        <h3 style="margin:0 0 8px;color:var(--accent)">📝 Choose Your Tool</h3>
        <p style="margin:0 0 16px;font-size:13px;color:var(--muted)">
          Select how you want to work on: <strong>${assignment.title}</strong>
        </p>
        <div class="workspace-tool-grid">
          ${Object.values(TOOLS).map(tool => `
            <button class="workspace-tool-card" data-tool="${tool.id}" style="--tool-color:${tool.color}">
              <span class="tool-card-icon">${tool.icon}</span>
              <strong>${tool.name}</strong>
              <span class="tool-card-desc">${tool.description}</span>
            </button>
          `).join('')}
        </div>
        <div style="text-align:right;margin-top:16px">
          <button class="btn-secondary" id="closeToolPicker">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#closeToolPicker').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.workspace-tool-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.remove();
        openWorkspace(assignment, card.dataset.tool, hardLock);
      });
    });
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.StudentWorkspace = {
    openWorkspace,
    openToolPicker,
    closeWorkspace,
    saveDraft,
    isOpen: () => !!activeWorkspace,
    TOOLS
  };

  console.log('✅ Student Workspace module loaded');
})();
