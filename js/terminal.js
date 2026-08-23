// js/terminal.js — complete rewrite with VS Code-style explorer
// dialog.js and projects.js must load before this file.

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  const DEV_SUBJECTS = new Set(['coding', 'cyber']);
  let currentMode   = null;
  let autoSaveTimer = null;
  let contextMenu   = null; // active right-click menu
  const selectedFiles = new Set(); // Multi-select support
  let lastSelectedFile = null; // For shift-select range

  // ----------------------------------------------------------------
  // CSS
  // ----------------------------------------------------------------
  function injectCSS() {
    if (document.getElementById('devCSS')) return;
    const s = document.createElement('style');
    s.id = 'devCSS';
    s.textContent = `
/* ── Panel shell ── */
#devPanel {
  position:relative; display:flex; width:0; flex-shrink:0;
  background:#0d1117; color:#c9d1d9;
  transition:width 0.2s ease; overflow:hidden;
  border-left:1px solid #21262d;
}
#devPanel.open { width:480px; }

/* Left edge drag handle */
.dp-edge {
  position:absolute; left:0; top:0; bottom:0; width:4px;
  cursor:ew-resize; z-index:20; background:transparent;
}
.dp-edge:hover { background:#58a6ff; }

#dpInner { display:flex; flex:1; height:100%; overflow:hidden; margin-left:4px; }

/* ── Explorer (left column) ── */
#dpExplorer {
  width:220px; min-width:100px; max-width:60%;
  background:#161b22; display:flex; flex-direction:column;
  border-right:1px solid #21262d; overflow:hidden;
}

/* Explorer header */
#dpExplorerHeader {
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 10px 6px;
  font-size:11px; font-weight:700; color:#8b949e;
  text-transform:uppercase; letter-spacing:0.08em;
  border-bottom:1px solid #21262d; flex-shrink:0;
}
.dp-hdr-btns { display:flex; gap:2px; }
.dp-hdr-btn {
  background:none; border:none; color:#6e7681; cursor:pointer;
  font-size:14px; width:22px; height:22px; border-radius:4px;
  display:flex; align-items:center; justify-content:center;
  transition:color .1s, background .1s;
}
.dp-hdr-btn:hover { color:#c9d1d9; background:rgba(255,255,255,0.07); }

/* Project selector row */
#dpProjectRow {
  display:flex; align-items:center; gap:4px;
  padding:4px 8px; border-bottom:1px solid #21262d; flex-shrink:0;
}
.dp-proj-sel {
  flex:1; background:#0d1117; color:#c9d1d9;
  border:1px solid #30363d; border-radius:4px;
  font-size:11px; padding:3px 6px; font-family:inherit;
}
.dp-proj-btn {
  background:none; border:none; color:#6e7681; cursor:pointer;
  font-size:13px; width:20px; height:20px; border-radius:3px;
  display:flex; align-items:center; justify-content:center;
}
.dp-proj-btn:hover { color:#c9d1d9; background:rgba(255,255,255,0.07); }

/* Tree */
#dpTree {
  flex:1; overflow-y:auto; overflow-x:hidden;
  padding:4px 0 8px; font-size:13px;
}
#dpTree::-webkit-scrollbar { width:4px; }
#dpTree::-webkit-scrollbar-thumb { background:#30363d; border-radius:4px; }

.dp-tree-row {
  display:flex; align-items:center; height:22px;
  padding-right:6px; cursor:pointer; user-select:none;
  position:relative; white-space:nowrap;
}
.dp-tree-row:hover { background:rgba(255,255,255,0.05); }
.dp-tree-row.active {
  background:#1f4068 !important;
  color:#58a6ff;
}
.dp-tree-row.selected {
  background:rgba(88,166,255,0.15);
  border-left:2px solid #58a6ff;
}
/* Indent guide line */
.dp-tree-row .dp-indent::before {
  content:'';
  position:absolute; top:0; bottom:0;
  width:1px; background:#30363d;
}

.dp-arrow {
  width:16px; flex-shrink:0; text-align:center;
  font-size:10px; color:#6e7681; transition:transform .12s;
}
.dp-arrow.open { transform:rotate(90deg); }
.dp-arrow.leaf { visibility:hidden; }

.dp-icon { flex-shrink:0; margin-right:5px; font-size:14px; line-height:1; }

.dp-name {
  flex:1; overflow:hidden; text-overflow:ellipsis;
  white-space:nowrap; color:#c9d1d9; font-size:13px;
}
.dp-tree-row.active .dp-name { color:#58a6ff; }

.dp-del {
  display:none; color:#6e7681; font-size:12px;
  padding:0 4px; border-radius:2px; flex-shrink:0;
}
.dp-tree-row:hover .dp-del { display:block; }
.dp-del:hover { color:#f85149; background:rgba(248,81,73,0.15); }

/* Add file button */
#dpAddFile {
  margin:6px 10px; padding:5px 10px;
  background:rgba(35,134,54,0.12); color:#3fb950;
  border:1px dashed #238636; border-radius:5px;
  font-size:11px; font-weight:600; cursor:pointer; text-align:center;
  transition:all .15s; flex-shrink:0;
}
#dpAddFile:hover { background:#238636; color:#fff; }

/* ── Explorer ↔ Editor drag handle ── */
.dp-col-drag {
  width:4px; background:#21262d; cursor:ew-resize; flex-shrink:0;
}
.dp-col-drag:hover { background:#58a6ff; }

/* ── Main workspace ── */
#dpWorkspace {
  flex:1; display:flex; flex-direction:column; min-width:0;
  background:#0d1117;
}

/* Toolbar */
#dpToolbar {
  display:flex; align-items:center; gap:8px;
  padding:6px 12px; background:#161b22;
  border-bottom:1px solid #21262d; flex-shrink:0; height:36px;
}
.dp-run-btn {
  background:#238636; color:#fff; border:none;
  padding:3px 10px; border-radius:4px; font-size:12px;
  font-weight:700; cursor:pointer; font-family:inherit;
  transition:filter .1s; display:flex; align-items:center; gap:4px;
}
.dp-run-btn:hover  { filter:brightness(1.15); }
.dp-run-btn:disabled { opacity:.45; cursor:not-allowed; }
.dp-ai-btn {
  background:#1f6feb; color:#fff; border:none;
  padding:3px 10px; border-radius:4px; font-size:12px;
  font-weight:600; cursor:pointer; font-family:inherit;
  transition:filter .1s; margin-left:auto;
}
.dp-ai-btn:hover { filter:brightness(1.15); }
#dpStatus { font-size:11px; color:#8b949e; }
.dp-lang-pill {
  font-size:10px; padding:2px 7px; border-radius:10px;
  border:1px solid #30363d; font-family:inherit; font-weight:600;
}

/* Editor */
#dpEditorWrap { flex:1; position:relative; overflow:hidden; display:flex; flex-direction:column; }
#dpEditor {
  flex:1;
  background:#0d1117; color:#e6edf3;
  font-family:"Cascadia Code","Fira Code","Consolas",monospace;
  font-size:13px; line-height:1.6; padding:12px 14px;
  border:none; outline:none; resize:none;
  white-space:pre; tab-size:4; overflow:auto;
}
#dpEditor::selection { background:rgba(88,166,255,0.2); }

/* Tabs */
#dpTabs {
  display:flex; align-items:center; background:#161b22;
  border-bottom:1px solid #21262d; overflow-x:auto; flex-shrink:0;
  height:34px; padding:0 4px;
}
#dpTabs::-webkit-scrollbar { height:2px; }
#dpTabs::-webkit-scrollbar-thumb { background:#30363d; }
.dp-tab {
  display:flex; align-items:center; gap:6px;
  padding:4px 12px; font-size:12px; color:#8b949e;
  background:transparent; border:none; border-right:1px solid #21262d;
  cursor:pointer; white-space:nowrap; min-width:80px; max-width:160px;
  transition:background .1s, color .1s;
}
.dp-tab:hover { background:#21262d; color:#c9d1d9; }
.dp-tab.active { background:#0d1117; color:#e6edf3; border-bottom:2px solid #58a6ff; }
.dp-tab-icon { font-size:11px; }
.dp-tab-name { flex:1; overflow:hidden; text-overflow:ellipsis; }
.dp-tab-close {
  width:16px; height:16px; border-radius:3px;
  display:flex; align-items:center; justify-content:center;
  font-size:10px; color:#6e7681; background:transparent;
  border:none; cursor:pointer; opacity:0;
  transition:opacity .1s, background .1s;
}
.dp-tab:hover .dp-tab-close { opacity:1; }
.dp-tab-close:hover { background:rgba(248,81,73,0.2); color:#f85149; }
.dp-tab.modified .dp-tab-name::after { content:'*'; color:#f0883e; margin-left:2px; }

/* Search bar */
#dpSearchBar {
  display:none; align-items:center; gap:6px;
  padding:4px 8px; background:#161b22; border-bottom:1px solid #21262d;
}
#dpSearchBar.open { display:flex; }
#dpSearchInput {
  flex:1; background:#0d1117; color:#c9d1d9;
  border:1px solid #30363d; border-radius:4px;
  font-size:11px; padding:4px 8px; font-family:inherit;
}
#dpSearchInput:focus { border-color:#58a6ff; outline:none; }
#dpSearchCount { font-size:10px; color:#8b949e; }
.dp-search-btn {
  background:none; border:none; color:#8b949e;
  font-size:11px; cursor:pointer; padding:2px 6px;
  border-radius:3px;
}
.dp-search-btn:hover { background:#21262d; color:#c9d1d9; }

/* Minimap */
#dpMinimapWrap {
  position:absolute; right:0; top:0; bottom:0; width:80px;
  background:#0d1117; border-left:1px solid #21262d;
  overflow:hidden; display:none;
}
#dpMinimapWrap.open { display:block; }
#dpMinimap {
  width:80px; height:100%;
  font-size:2px; line-height:1;
  overflow:hidden; pointer-events:none;
}
#dpMinimapViewport {
  position:absolute; left:0; right:0; height:30px;
  background:rgba(88,166,255,0.1); border:1px solid rgba(88,166,255,0.3);
  pointer-events:auto; cursor:pointer;
}

/* Split view */
#dpEditorSplit { flex:1; display:flex; overflow:hidden; }
#dpEditorSplit.split { }
.dp-editor-pane {
  flex:1; display:flex; flex-direction:column; min-width:0;
  border-right:1px solid #21262d;
}
.dp-editor-pane:last-child { border-right:none; }
.dp-editor-pane.collapsed { display:none; }
.dp-split-handle {
  width:4px; background:#21262d; cursor:ew-resize;
  display:none; flex-shrink:0;
}
.dp-split-handle.open { display:block; }
.dp-split-handle:hover { background:#58a6ff; }

/* Drop target */
.dp-drop-target { background:rgba(88,166,255,0.15) !important; }

/* Output drag handle */
.dp-out-drag {
  height:4px; background:#21262d; cursor:ns-resize; flex-shrink:0;
}
.dp-out-drag:hover { background:#58a6ff; }

/* Output */
#dpOutputBar {
  display:flex; justify-content:space-between; align-items:center;
  padding:3px 12px; background:#161b22;
  border-top:1px solid #21262d; flex-shrink:0;
  font-size:11px; font-weight:600; color:#8b949e;
}
.dp-clr-btn {
  background:none; border:none; color:#6e7681;
  font-size:11px; cursor:pointer; font-family:inherit;
  padding:0; transition:color .1s;
}
.dp-clr-btn:hover { color:#c9d1d9; }
#dpOutput {
  height:180px; overflow-y:auto; flex-shrink:0;
  padding:8px 14px; background:#010409;
  font-family:"Cascadia Code","Consolas",monospace;
  font-size:12px; color:#3fb950; white-space:pre-wrap;
  word-break:break-all;
}
#dpOutput::-webkit-scrollbar { width:4px; }
#dpOutput::-webkit-scrollbar-thumb { background:#30363d; }
.dp-err  { color:#ff7b72; }
.dp-warn { color:#d29922; }
.dp-sys  { color:#8b949e; font-style:italic; }

/* ── Context menu ── */
.dp-ctx {
  position:fixed; background:#1c2128; border:1px solid #30363d;
  border-radius:6px; padding:4px 0; z-index:99999;
  box-shadow:0 8px 24px rgba(0,0,0,0.4); min-width:150px;
  font-size:12px; font-family:system-ui,sans-serif;
}
.dp-ctx-item {
  padding:6px 14px; color:#c9d1d9; cursor:pointer;
  display:flex; align-items:center; gap:8px;
}
.dp-ctx-item:hover { background:rgba(88,166,255,0.12); color:#58a6ff; }
.dp-ctx-sep { border-top:1px solid #30363d; margin:3px 0; }
.dp-ctx-item.danger { color:#f85149; }
.dp-ctx-item.danger:hover { background:rgba(248,81,73,0.1); }

/* ── Cyber terminal ── */
#cyberTerminal {
  flex:1; display:flex; flex-direction:column;
  background:#010409; font-family:"Cascadia Code","Courier New",monospace;
  overflow:hidden;
}
#cyberHeader {
  padding:6px 14px; background:#161b22;
  border-bottom:1px solid #21262d; flex-shrink:0;
  font-size:11px; color:#8b949e; font-family:inherit;
  display:flex; align-items:center; gap:8px;
}
.cyber-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
#cyberHistory {
  flex:1; padding:10px 14px; overflow-y:auto;
  font-size:13px; line-height:1.5;
}
#cyberHistory::-webkit-scrollbar { width:4px; }
#cyberHistory::-webkit-scrollbar-thumb { background:#1a1a2e; }
#cyberInputRow {
  display:flex; align-items:center; padding:8px 14px;
  border-top:1px solid #1a1a2e; flex-shrink:0;
  background:#010409; gap:6px;
}
#cyberPrompt { color:#3fb950; font-size:13px; white-space:nowrap; }
#cyberInput {
  flex:1; background:transparent; border:none; outline:none;
  color:#e6edf3; font-family:inherit; font-size:13px;
  caret-color:#58a6ff;
}
.cy-cmd { color:#e6edf3; font-weight:600; }
.cy-out { color:#9ee09e; }
.cy-sys { color:#56b6c2; font-style:italic; }
.cy-err { color:#ff7b72; }
    `;
    document.head.appendChild(s);
  }

  // ----------------------------------------------------------------
  // PANEL HTML
  // ----------------------------------------------------------------
  function injectPanel() {
    if (document.getElementById('devPanel')) return;
    injectCSS();

    const panel = document.createElement('div');
    panel.id = 'devPanel';
    panel.innerHTML = `
      <div class="dp-edge" id="dpEdgeHandle"></div>
      <div id="dpInner">

        <!-- EXPLORER -->
        <div id="dpExplorer" style="display:none">
          <div id="dpExplorerHeader">
            <span>EXPLORER</span>
            <div class="dp-hdr-btns">
              <button class="dp-hdr-btn" id="dpNewFileBtn"    title="New File">📄</button>
              <button class="dp-hdr-btn" id="dpNewFolderBtn"  title="New Folder">📁</button>
              <button class="dp-hdr-btn" id="dpNewProjectBtn" title="New Project">＋</button>
            </div>
          </div>
          <div id="dpProjectRow">
            <select id="dpProjectSel" class="dp-proj-sel"></select>
            <button class="dp-proj-btn" id="dpDelProjectBtn" title="Delete project" style="color:#f85149">🗑</button>
          </div>
          <div id="dpTree"></div>
          <div id="dpAddFile">＋ New File</div>
        </div>

        <div class="dp-col-drag" id="dpColDrag" style="display:none"></div>

        <!-- WORKSPACE -->
        <div id="dpWorkspace">
          <!-- Tabs -->
          <div id="dpTabs" style="display:none"></div>
          
          <!-- Search bar -->
          <div id="dpSearchBar">
            <input type="text" id="dpSearchInput" placeholder="Search files (Ctrl+P)..." />
            <span id="dpSearchCount"></span>
            <button class="dp-search-btn" id="dpSearchPrev">&#9650;</button>
            <button class="dp-search-btn" id="dpSearchNext">&#9660;</button>
            <button class="dp-search-btn" id="dpSearchClose">&#10005;</button>
          </div>
          
          <div id="dpToolbar" style="display:none">
            <span id="dpLangPill" class="dp-lang-pill"></span>
            <button class="dp-run-btn" id="dpRunBtn" title="Run (Ctrl+Enter)">&#9658; Run</button>
            <span id="dpStatus"></span>
            <button class="dp-ai-btn" id="dpAiBtn">&#129302; Ask AI</button>
            <button class="dp-close-panel-btn" id="dpClosePanelBtn" title="Mbyll Panelën e Kodit">✕ Mbyll</button>
          </div>

          <div id="dpEditorWrap" style="display:none">
            <div id="dpEditorSplit">
              <div class="dp-editor-pane" id="dpEditorPane1">
                <div id="dpEditorContainer" style="width:100%;height:100%;"></div>
                <!-- Fallback textarea for when Monaco fails -->
                <textarea id="dpEditor" spellcheck="false" autocorrect="off" autocapitalize="off"
                  placeholder="// Start coding..." style="display:none;width:100%;height:100%;background:#0d1117;color:#c9d1d9;border:none;padding:12px;font-family:Consolas,monospace;font-size:13px;resize:none;"></textarea>
              </div>
              <div class="dp-split-handle" id="dpSplitHandle"></div>
              <div class="dp-editor-pane collapsed" id="dpEditorPane2">
                <div id="dpEditorContainer2" style="width:100%;height:100%;"></div>
              </div>
            </div>
          </div>

          <div class="dp-out-drag" id="dpOutDrag" style="display:none"></div>
          <div id="dpOutputBar" style="display:none">
            <span>OUTPUT</span>
            <button class="dp-clr-btn" id="dpClearBtn">clear</button>
          </div>
          <div id="dpOutput" style="display:none"></div>

          <!-- Cyber terminal -->
          <div id="cyberTerminal" style="display:none; flex-direction:column; background: #000; height:100%;">
            <div id="cyberHeader">
              <span class="cyber-dot" style="background:#3fb950"></span>
              <span>ShqipAI Cybersecurity Terminal</span>
              <span style="margin-left:auto;color:#3fb950;font-weight:700">LIVE</span>
              <button class="dp-close-panel-btn" id="cyberClosePanelBtn" title="Mbyll Terminalin" style="margin-left:8px">✕ Mbyll</button>
            </div>
            <div id="xtermContainer" style="flex:1; width:100%; overflow:hidden; padding-left:10px;"></div>
          </div>
        </div>
      </div>
    `;

    document.querySelector('.container')?.appendChild(panel);
    initCodingMode();
    initCyberMode();
    initAllDrags();
    console.log('✅ Dev panel (VS Code explorer) ready');
  }

  // ----------------------------------------------------------------
  // SHOW / HIDE
  // ----------------------------------------------------------------
  function show(id, d='block') { const e=document.getElementById(id); if(e) e.style.display=d; }
  function hide(id)            { const e=document.getElementById(id); if(e) e.style.display='none'; }

  function openPanel(mode) {
    document.getElementById('devPanel')?.classList.add('open');
    mode === 'coding' ? showCoding() : showCyber();
    currentMode = mode;
  }
  function closePanel() {
    document.getElementById('devPanel')?.classList.remove('open');
    currentMode = null;
  }

  function showCoding() {
    show('dpExplorer','flex'); show('dpColDrag');
    show('dpTabs','flex'); show('dpToolbar','flex'); show('dpEditorWrap','flex');
    show('dpOutDrag'); show('dpOutputBar','flex'); show('dpOutput');
    hide('cyberTerminal'); hide('dpSearchBar');
    window.Projects.init('coding');
    renderProjectSel(); renderTree(); renderTabs();
    
    // Initialize Monaco editor
    if (window.MonacoEditor) {
      window.MonacoEditor.init().then(() => {
        loadFile();
      });
    } else {
      loadFile();
    }
    
    initKeyboardShortcuts();
  }
  function showCyber() {
    hide('dpExplorer'); hide('dpColDrag');
    hide('dpToolbar'); hide('dpEditorWrap');
    hide('dpOutDrag'); hide('dpOutputBar'); hide('dpOutput');
    show('cyberTerminal','flex');
    setTimeout(() => document.getElementById('cyberInput')?.focus(), 80);
  }

  // ----------------------------------------------------------------
  // SUBJECT SWITCHING
  // ----------------------------------------------------------------
  window.addEventListener('subjectSwitched', e => {
    const id = e.detail;
    if (DEV_SUBJECTS.has(id)) { injectPanel(); openPanel(id); }
    else closePanel();
  });
  setTimeout(() => {
    const a = window.Subjects?.getActive();
    if (a && DEV_SUBJECTS.has(a.id)) { injectPanel(); openPanel(a.id); }
  }, 600);

  // ----------------------------------------------------------------
  // FILE TREE (VS Code style)
  // ----------------------------------------------------------------
  function renderProjectSel() {
    const sel = document.getElementById('dpProjectSel');
    if (!sel) return;
    const s = window.Projects.getStore();
    sel.innerHTML = s.projects.map(p =>
      `<option value="${p.id}"${p.id===s.activeProjectId?' selected':''}>${p.name}</option>`
    ).join('');
  }

  function renderTree() {
    const container = document.getElementById('dpTree');
    if (!container) return;
    container.innerHTML = '';

    const proj = window.Projects.getActiveProject();
    if (!proj) { container.innerHTML = '<div style="padding:12px 14px;color:#6e7681;font-size:12px">No project</div>'; return; }

    const s = window.Projects.getStore();

    // Build nested tree structure
    const root = {};
    proj.files.forEach(f => {
      const parts = f.name.split('/');
      let cur = root;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] || {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length-1]] = f; // leaf = file object
    });

    function makeRow(key, item, depth, isFile) {
      const row = document.createElement('div');
      row.className = 'dp-tree-row' + (isFile && item.id === s.activeFileId ? ' active' : '');
      row.style.paddingLeft = `${depth * 12 + 6}px`;
      
      // Add file ID for multi-select
      if (isFile) {
        row.dataset.fileId = item.id;
      }

      // Indent guide lines
      for (let d = 1; d <= depth; d++) {
        const guide = document.createElement('span');
        guide.className = 'dp-indent';
        guide.style.cssText = `position:absolute;left:${d*12+6}px;top:0;bottom:0;width:1px;background:#21262d`;
        row.appendChild(guide);
      }

      const arrow = document.createElement('span');
      arrow.className = 'dp-arrow ' + (isFile ? 'leaf' : '');
      arrow.textContent = '▶';
      row.appendChild(arrow);

      const icon = document.createElement('span');
      icon.className = 'dp-icon';
      icon.textContent = isFile ? window.Projects.langEmoji(item.lang) : '📁';
      row.appendChild(icon);

      const name = document.createElement('span');
      name.className = 'dp-name';
      name.textContent = key;
      row.appendChild(name);

      if (isFile) {
        const del = document.createElement('span');
        del.className = 'dp-del';
        del.textContent = '×';
        del.title = 'Delete';
        del.addEventListener('click', async e => {
          e.stopPropagation();
          if (proj.files.length <= 1) { window.Dialog.alert('Cannot delete the last file.'); return; }
          if (await window.Dialog.confirm(`Delete "${item.name}"?`)) {
            saveEditor();
            window.Projects.deleteFile(item.id);
            renderTree(); loadFile();
          }
        });
        row.appendChild(del);

        row.addEventListener('click', (e) => {
          // Multi-select support
          if (e.ctrlKey) {
            // Toggle selection
            if (selectedFiles.has(item.id)) {
              selectedFiles.delete(item.id);
            } else {
              selectedFiles.add(item.id);
            }
            lastSelectedFile = item.id;
            updateTreeSelection();
          } else if (e.shiftKey && lastSelectedFile) {
            // Range select
            const proj = window.Projects?.getActiveProject();
            if (proj) {
              const fileIds = proj.files.map(f => f.id);
              const startIdx = fileIds.indexOf(lastSelectedFile);
              const endIdx = fileIds.indexOf(item.id);
              if (startIdx !== -1 && endIdx !== -1) {
                const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
                for (let i = from; i <= to; i++) {
                  selectedFiles.add(fileIds[i]);
                }
                updateTreeSelection();
              }
            }
          } else {
            // Single select (normal behavior)
            selectedFiles.clear();
            selectedFiles.add(item.id);
            lastSelectedFile = item.id;
            saveEditor();
            window.Projects.setActiveFile(item.id);
            renderTree(); loadFile();
          }
        });

        // Right-click context menu
        row.addEventListener('contextmenu', e => {
          e.preventDefault();
          showCtxMenu(e.clientX, e.clientY, [
            { icon:'📋', label:'Rename', action: async () => {
              const newName = await window.Dialog.prompt('New file name:', item.name);
              if (!newName || newName === item.name) return;
              saveEditor();
              window.Projects.renameFile(item.id, newName.trim());
              renderTree(); loadFile();
            }},
            { sep: true },
            { icon:'🗑', label:'Delete', danger:true, action: async () => {
              if (proj.files.length <= 1) { window.Dialog.alert('Cannot delete the last file.'); return; }
              if (await window.Dialog.confirm(`Delete "${item.name}"?`)) {
                saveEditor();
                window.Projects.deleteFile(item.id);
                renderTree(); loadFile();
              }
            }}
          ]);
        });
      }

      return row;
    }

    function renderNode(node, depth) {
      const keys = Object.keys(node).sort((a,b) => {
        const af = node[a].id !== undefined, bf = node[b].id !== undefined;
        return af === bf ? a.localeCompare(b) : (af ? 1 : -1);
      });

      keys.forEach(key => {
        const item   = node[key];
        const isFile = item.id !== undefined;
        const row    = makeRow(key, item, depth, isFile);
        container.appendChild(row);

        if (!isFile) {
          // Folder row — toggle children
          let open = true;
          const arrow = row.querySelector('.dp-arrow');
          if (open) arrow.classList.add('open');

          // Render children immediately
          const childWrap = document.createElement('div');
          childWrap.className = 'dp-folder-children';
          container.appendChild(childWrap);

          (function fillChildren() {
            childWrap.innerHTML = '';
            renderNodeInto(item, depth + 1, childWrap);
          })();

          row.addEventListener('click', () => {
            open = !open;
            arrow.classList.toggle('open', open);
            childWrap.style.display = open ? '' : 'none';
          });
        }
      });
    }

    function renderNodeInto(node, depth, wrap) {
      const keys = Object.keys(node).sort((a,b) => {
        const af = node[a].id !== undefined, bf = node[b].id !== undefined;
        return af === bf ? a.localeCompare(b) : (af ? 1 : -1);
      });
      keys.forEach(key => {
        const item   = node[key];
        const isFile = item.id !== undefined;
        const row    = makeRow(key, item, depth, isFile);
        wrap.appendChild(row);
        if (!isFile) {
          let open = true;
          const arrow = row.querySelector('.dp-arrow');
          arrow.classList.add('open');
          const childWrap = document.createElement('div');
          wrap.appendChild(childWrap);
          renderNodeInto(item, depth+1, childWrap);
          row.addEventListener('click', () => {
            open = !open;
            arrow.classList.toggle('open', open);
            childWrap.style.display = open ? '' : 'none';
          });
        }
      });
    }

    renderNode(root, 0);
  }

  function updateTreeSelection() {
    // Update visual selection state
    const tree = document.getElementById('dpTree');
    if (!tree) return;
    
    tree.querySelectorAll('.dp-row').forEach(row => {
      const fileId = row.dataset?.fileId;
      if (fileId && selectedFiles.has(fileId)) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }

  function loadFile() {
    const file = window.Projects.getActiveFile();
    const pill = document.getElementById('dpLangPill');
    
    // Use Monaco if available, fallback to textarea
    const monacoContainer = document.getElementById('dpEditorContainer');
    const editorTextarea = document.getElementById('dpEditor');

    if (window.MonacoEditor?.isReady()) {
      if (monacoContainer) monacoContainer.style.display = 'block';
      if (editorTextarea) editorTextarea.style.display = 'none';
      window.MonacoEditor.loadFile(file);
    } else {
      if (monacoContainer) monacoContainer.style.display = 'none';
      if (editorTextarea) {
        editorTextarea.style.display = 'block';
        if (!file) { editorTextarea.value = ''; if (pill) pill.textContent = ''; return; }
        editorTextarea.value = file.content || '';
        editorTextarea.scrollTop = 0;
      }
    }
    
    // Update pill
    if (file && pill) {
      pill.textContent = file.lang.toUpperCase();
      pill.className = `dp-lang-pill ${window.Projects.langBadgeClass(file.lang)}`;
    }
  }

  function saveEditor() {
    const file = window.Projects.getActiveFile();
    if (!file) return;
    
    // Use Monaco if available, fallback to textarea
    if (window.MonacoEditor?.isReady()) {
      const content = window.MonacoEditor.getValue();
      window.Projects.saveFileContent(file.id, content);
    } else {
      const editor = document.getElementById('dpEditor');
      if (!editor) return;
      window.Projects.saveFileContent(file.id, editor.value);
    }
  }

  // ----------------------------------------------------------------
  // CONTEXT MENU
  // ----------------------------------------------------------------
  function showCtxMenu(x, y, items) {
    closeCtxMenu();
    const menu = document.createElement('div');
    menu.className = 'dp-ctx';
    contextMenu = menu;

    items.forEach(item => {
      if (item.sep) {
        const sep = document.createElement('div');
        sep.className = 'dp-ctx-sep';
        menu.appendChild(sep);
        return;
      }
      const el = document.createElement('div');
      el.className = 'dp-ctx-item' + (item.danger ? ' danger' : '');
      el.innerHTML = `<span>${item.icon||''}</span><span>${item.label}</span>`;
      el.addEventListener('click', () => { closeCtxMenu(); item.action?.(); });
      menu.appendChild(el);
    });

    // Position
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.min(x, window.innerWidth  - rect.width  - 8)}px`;
    menu.style.top  = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;

    setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 50);
  }

  function closeCtxMenu() {
    contextMenu?.remove();
    contextMenu = null;
  }

  // ----------------------------------------------------------------
  // PROJECT CONTROLS
  // ----------------------------------------------------------------
  function initProjectControls() {
    document.getElementById('dpProjectSel')?.addEventListener('change', e => {
      saveEditor();
      window.Projects.setActiveProject(e.target.value);
      renderTree(); loadFile();
    });

    document.getElementById('dpNewProjectBtn')?.addEventListener('click', async () => {
      const name = await window.Dialog.prompt('New project name:');
      if (!name) return;
      window.Projects.createProject(name.trim());
      renderProjectSel(); renderTree(); loadFile();
    });

    document.getElementById('dpDelProjectBtn')?.addEventListener('click', async () => {
      const proj = window.Projects.getActiveProject();
      if (!proj) return;
      if (await window.Dialog.confirm(`Delete project "${proj.name}" and all its files?`)) {
        window.Projects.deleteProject(proj.id);
        renderProjectSel(); renderTree(); loadFile();
      }
    });

    document.getElementById('dpNewFileBtn')?.addEventListener('click', async () => {
      const name = await window.Dialog.prompt('File name (e.g. utils.py or src/helper.py):');
      if (!name) return;
      saveEditor();
      window.Projects.createFile(name.trim());
      renderTree(); loadFile();
    });

    document.getElementById('dpNewFolderBtn')?.addEventListener('click', async () => {
      const folder = await window.Dialog.prompt('Folder name:');
      if (!folder) return;
      const file = await window.Dialog.prompt(`First file in "${folder.trim()}" (e.g. index.py):`);
      if (!file) return;
      saveEditor();
      window.Projects.createFile(`${folder.trim()}/${file.trim()}`);
      renderTree(); loadFile();
    });

    document.getElementById('dpAddFile')?.addEventListener('click', async () => {
      const name = await window.Dialog.prompt(
        'File name:\n(Use / for subfolders, e.g.  src/utils.py  or  pages/index.html)'
      );
      if (!name) return;
      saveEditor();
      window.Projects.createFile(name.trim());
      renderTree(); loadFile();
    });

    document.getElementById('dpClearBtn')?.addEventListener('click', () => {
      const o = document.getElementById('dpOutput');
      if (o) o.innerHTML = '';
    });
  }

  // ----------------------------------------------------------------
  // CODING MODE
  // ----------------------------------------------------------------
  function initCodingMode() {
    initProjectControls();

    const editor = document.getElementById('dpEditor');
    if (editor) {
      editor.addEventListener('input', () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(saveEditor, 1500);
      });

      editor.addEventListener('keydown', e => {
        const el = e.target;
        const s = el.selectionStart;
        const end = el.selectionEnd;
        const val = el.value;

        // 1. Tab / Shift+Tab handling
        if (e.key === 'Tab') {
          e.preventDefault();
          if (e.shiftKey) {
            // Unindent current line
            const lineStart = val.lastIndexOf('\n', s - 1) + 1;
            if (val.substring(lineStart, lineStart + 4) === '    ') {
              el.value = val.substring(0, lineStart) + val.substring(lineStart + 4);
              el.selectionStart = el.selectionEnd = Math.max(lineStart, s - 4);
            }
          } else {
            el.value = val.substring(0, s) + '    ' + val.substring(end);
            el.selectionStart = el.selectionEnd = s + 4;
          }
          return;
        }

        // 2. Smart Enter (Auto-Indent for Python : loops/functions & JS {})
        if (e.key === 'Enter') {
          e.preventDefault();
          const lineStart = val.lastIndexOf('\n', s - 1) + 1;
          const currentLine = val.substring(lineStart, s);
          const indentMatch = currentLine.match(/^(\s*)/);
          let indent = indentMatch ? indentMatch[1] : '';

          // If line ends with ':' or '{' or '(', add 4 extra spaces
          const trimmedLine = currentLine.trim();
          if (trimmedLine.endsWith(':') || trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || trimmedLine.endsWith('[')) {
            indent += '    ';
          }

          const insertText = '\n' + indent;
          el.value = val.substring(0, s) + insertText + val.substring(end);
          el.selectionStart = el.selectionEnd = s + insertText.length;
          return;
        }

        // 3. Auto-Closing Bracket & Quote Pairs: (), [], {}, "", ''
        const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
        if (pairs[e.key]) {
          const closeChar = pairs[e.key];
          const hasSelection = s !== end;

          if (hasSelection) {
            e.preventDefault();
            const selectedText = val.substring(s, end);
            el.value = val.substring(0, s) + e.key + selectedText + closeChar + val.substring(end);
            el.selectionStart = s + 1;
            el.selectionEnd = end + 1;
            return;
          } else {
            // If typing quote next to word character, don't auto-close single quote (contractions)
            if (e.key === "'" && s > 0 && /\w/.test(val.charAt(s - 1))) {
              return;
            }
            e.preventDefault();
            el.value = val.substring(0, s) + e.key + closeChar + val.substring(end);
            el.selectionStart = el.selectionEnd = s + 1;
            return;
          }
        }

        // 4. Step over closing bracket/quote
        const closers = [')', ']', '}', '"', "'"];
        if (closers.includes(e.key) && s === end && val.charAt(s) === e.key) {
          e.preventDefault();
          el.selectionStart = el.selectionEnd = s + 1;
          return;
        }

        // 5. Smart Backspace for paired brackets
        if (e.key === 'Backspace' && s === end && s > 0) {
          const prev = val.charAt(s - 1);
          const next = val.charAt(s);
          const pairPairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
          if (pairPairs[prev] === next) {
            e.preventDefault();
            el.value = val.substring(0, s - 1) + val.substring(s + 1);
            el.selectionStart = el.selectionEnd = s - 1;
            return;
          }
        }

        // 6. Ctrl+Enter to Run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('dpRunBtn')?.click();
        }
      });
    }

    document.getElementById('dpRunBtn')?.addEventListener('click', runCode);
    document.getElementById('dpAiBtn')?.addEventListener('click', sendToAI);
    
    // Wire up panel close buttons
    document.getElementById('dpClosePanelBtn')?.addEventListener('click', closePanel);
    document.getElementById('cyberClosePanelBtn')?.addEventListener('click', closePanel);
  }

  async function runCode() {
    saveEditor();
    const file = window.Projects.getActiveFile();
    if (!file || !file.content.trim()) return;

    const runBtn = document.getElementById('dpRunBtn');
    const status = document.getElementById('dpStatus');
    const output = document.getElementById('dpOutput');

    runBtn.disabled = true;
    runBtn.innerHTML = '⏳';
    if (status) { status.textContent = 'Running…'; status.style.color = '#d29922'; }
    output.innerHTML = '';

    const print = (text, cls='') => {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      span.textContent = text;
      output.appendChild(span);
      output.scrollTop = output.scrollHeight;
    };

    const done = (ok=true) => {
      runBtn.disabled = false;
      runBtn.innerHTML = '▶ Run';
      if (status) { status.textContent = ok ? '● done' : '● error'; status.style.color = ok ? '#3fb950' : '#f85149'; }
    };

    const { lang, content: code } = file;

    // JavaScript → Web Worker
    if (lang === 'javascript') {
      const worker = new Worker(URL.createObjectURL(new Blob([`
        console.log   = (...a) => postMessage({t:'log',  m:a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')});
        console.warn  = (...a) => postMessage({t:'warn', m:a.join(' ')});
        console.error = (...a) => postMessage({t:'err',  m:a.join(' ')});
        try { ${code}\n; postMessage({t:'done'}); }
        catch(e){ postMessage({t:'err', m:e.message}); }
      `], {type:'application/javascript'})));
      let buf = '';
      const timer = setTimeout(() => { worker.terminate(); print('\n⏱ Timed out (5s)\n','dp-err'); done(false); }, 5000);
      worker.onmessage = ({data}) => {
        if (data.t==='log')  buf += data.m + '\n';
        if (data.t==='warn') print(data.m+'\n','dp-warn');
        if (data.t==='err')  { print(data.m+'\n','dp-err'); clearTimeout(timer); worker.terminate(); done(false); }
        if (data.t==='done') { print(buf||'(no output)'); clearTimeout(timer); worker.terminate(); done(); }
      };
      return;
    }

    // HTML → iframe
    if (lang === 'html') {
      const iframe = document.createElement('iframe');
      iframe.srcdoc = code;
      iframe.style.cssText = 'width:100%;height:100%;border:none;background:#fff;display:block';
      output.style.height = '100%';
      output.appendChild(iframe);
      done(); return;
    }

    // Python → server
    try {
      const proj = window.Projects.getActiveProject();
      const resp = await fetch('/api/run-code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ language:lang, code, files: proj?.files || [{name:file.name,content:code,lang}], mainFile:file.name })
      });
      if (!resp.ok) throw new Error(`Server ${resp.status}`);
      const data = await resp.json();
      if (data.output) print(data.output);
      if (data.error)  print(data.error, 'dp-err');
      if (!data.output && !data.error) print('(no output)', 'dp-sys');
      done(!data.error);
    } catch(err) {
      print(`❌ ${err.message}\nRun: npm start\n`, 'dp-err');
      done(false);
    }
  }

  function sendToAI() {
    saveEditor();
    const file = window.Projects.getActiveFile();
    const out  = document.getElementById('dpOutput')?.innerText?.trim();
    if (!file) return;
    let msg = `Help with this ${file.lang} code (${file.name}):\n\n\`\`\`${file.lang}\n${file.content}\n\`\`\`\n`;
    if (out && out.length < 2000 && !out.includes('(no output)'))
      msg += `\nOutput/error:\n\`\`\`\n${out}\n\`\`\`\nWhat's wrong?`;
    else msg += '\nExplain and suggest improvements.';
    const input = document.getElementById('input');
    if (input) { input.value = msg; input.focus(); input.dispatchEvent(new Event('input')); }
  }

  // ----------------------------------------------------------------
  // CYBER TERMINAL
  // ----------------------------------------------------------------
  let cyberTerm = null;
  const cmdHist = []; 
  let histIdx = -1;

  function initCyberMode() {
    const container = document.getElementById('xtermContainer');
    if (!container) return;

    if (!window.Terminal) {
      setTimeout(initCyberMode, 100);
      return;
    }

    cyberTerm = new window.Terminal({
      cursorBlink: true,
      theme: { background: '#000' },
      fontFamily: 'monospace'
    });
    cyberTerm.open(container);

    cyberTerm.writeln('\x1b[1;32mShqipAI Cybersecurity Terminal\x1b[0m');
    cyberTerm.writeln('Type \'help\' for commands');
    cyberTerm.writeln('─'.repeat(36));
    cyberTerm.write('\x1b[1;34mshqipai@cyber:~$ \x1b[0m');

    let currentInput = '';
    
    cyberTerm.onData(async e => {
      switch (e) {
        case '\r': // Enter
          cyberTerm.writeln('');
          const cmd = currentInput.trim();
          if (cmd) {
            cmdHist.push(cmd);
            histIdx = -1;
            await runCyberCmd(cmd);
          }
          currentInput = '';
          cyberTerm.write('\x1b[1;34mshqipai@cyber:~$ \x1b[0m');
          break;
        case '\u007F': // Backspace
          if (currentInput.length > 0) {
            currentInput = currentInput.substring(0, currentInput.length - 1);
            cyberTerm.write('\b \b');
          }
          break;
        case '\u001b[A': // Up arrow
          if (histIdx < cmdHist.length - 1) {
            histIdx++;
            while (currentInput.length > 0) {
              cyberTerm.write('\b \b');
              currentInput = currentInput.substring(0, currentInput.length - 1);
            }
            currentInput = cmdHist[cmdHist.length - 1 - histIdx] || '';
            cyberTerm.write(currentInput);
          }
          break;
        case '\u001b[B': // Down arrow
          if (histIdx > 0) {
            histIdx--;
            while (currentInput.length > 0) {
              cyberTerm.write('\b \b');
              currentInput = currentInput.substring(0, currentInput.length - 1);
            }
            currentInput = cmdHist[cmdHist.length - 1 - histIdx] || '';
            cyberTerm.write(currentInput);
          } else if (histIdx === 0) {
            histIdx = -1;
            while (currentInput.length > 0) {
              cyberTerm.write('\b \b');
              currentInput = currentInput.substring(0, currentInput.length - 1);
            }
            currentInput = '';
          }
          break;
        default: // Normal char
          if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
            currentInput += e;
            cyberTerm.write(e);
          }
      }
    });
  }

  function cyberLine(text, cls) {
    if (cyberTerm) cyberTerm.writeln(text.replace(/\n/g, '\r\n'));
  }

  function cyberPre(text, cls) {
    if (cyberTerm) cyberTerm.writeln(text.replace(/\n/g, '\r\n'));
  }

  function cyberScroll() {
    // xterm handles scrolling automatically
  }

  async function runCyberCmd(raw) {
    const parts = raw.trim().split(/\s+/);
    const cmd   = parts[0].toLowerCase();

    if (cmd === 'clear')   { if (cyberTerm) cyberTerm.clear(); return; }
    if (cmd === 'help')    { 
      // Show simulated commands help
      if (window.CyberChallenges) {
        cyberPre(window.CyberChallenges.getHelp());
      } else {
        cyberPre('Commands:\n  help / clear / ls / cat <file>\n  python <file> / python3 -c "..."\n  echo <text>\n  nmap / whois / dig / ping / curl\n');
      }
      return; 
    }
    if (cmd === 'ls')      { const p=window.Projects?.getActiveProject(); cyberPre(p?p.files.map(f=>`  ${window.Projects.langEmoji(f.lang)}  ${f.name}`).join('\n'):'No project.'); return; }
    if (cmd === 'echo')    { cyberPre(parts.slice(1).join(' ')); return; }
    if (cmd === 'cat' && parts[1]) {
      const p=window.Projects?.getActiveProject();
      const f=p?.files.find(f=>f.name===parts[1]);
      if (!f) { cyberPre(`cat: ${parts[1]}: No such file`, 'cy-err'); return; }
      cyberPre(f.content||'(empty)'); return;
    }
    
    // Challenge command routing
    if (cmd === 'challenge') {
      if (parts[1]) {
        const challengeId = parseInt(parts[1]);
        const challenge = window.CyberChallenges?.getChallenge(challengeId);
        if (!challenge) {
          cyberPre(`Challenge ${challengeId} not found. Type "challenge" to list all challenges.`, 'cy-err');
          return;
        }
        cyberPre(`╔════════════════════════════════════════════════════════════════════════╗\n║ CTF CHALLENGE #${challenge.id}: ${challenge.title.padEnd(50)} ║\n╚════════════════════════════════════════════════════════════════════════╝\nDifficulty: ${challenge.difficulty.toUpperCase()} | Reward: ${challenge.points} Points\n\n${challenge.description}\n\n💡 Hint: ${challenge.hint}\n`);
        return;
      }

      const challenges = window.CyberChallenges?.getAllChallenges() || [];
      let output = '╔════════════════════════════════════════════════════════════════════════╗\n';
      output += '║               🛡️  EduAI Capture-The-Flag (CTF) Challenges              ║\n';
      output += '╚════════════════════════════════════════════════════════════════════════╝\n\n';
      challenges.forEach(c => {
        output += `  [#${c.id}] ${c.title} (${c.difficulty}) — ${c.points} pts\n`;
        output += `      ${c.description}\n\n`;
      });
      output += 'Type "challenge <id>" (e.g. challenge 1) to inspect a challenge.';
      cyberPre(output);
      return;
    }

    // Try simulated command first
    if (window.CyberChallenges) {
      const simulated = window.CyberChallenges.processSimulatedCommand(raw);
      if (simulated) {
        cyberPre(simulated.output);
        cyberScroll();
        return;
      }
    }

    // Try server endpoint if online
    try {
      const proj = window.Projects?.getActiveProject();
      const resp = await fetch('/api/run-cyber', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ command:raw.trim(), files: proj?.files||[] })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.output) cyberPre(data.output);
        if (data.error)  cyberPre(data.error, 'cy-err');
        if (!data.output && !data.error) cyberPre('(no output)', 'cy-sys');
        cyberScroll();
        return;
      }
    } catch(err) {
      // Server offline or not responding
    }

    // Clean Linux shell fallback for unrecognized commands
    cyberPre(`bash: ${parts[0]}: command not found. Type 'help' for available tools and commands.`, 'cy-err');
    cyberScroll();
  }

  // ----------------------------------------------------------------
  // DRAG RESIZE (three handles)
  // ----------------------------------------------------------------
  function initAllDrags() {
    // Panel width (left edge)
    drag('dpEdgeHandle', null, (delta, startW) => {
      const maxW = (document.querySelector('.container')?.offsetWidth||1000)*0.85;
      document.getElementById('devPanel').style.width = `${Math.max(300, Math.min(startW-delta, maxW))}px`;
    }, 'ew-resize', false, 'devPanel');

    // Explorer width
    drag('dpColDrag', null, (delta, startW) => {
      const panW = document.getElementById('devPanel')?.offsetWidth||480;
      document.getElementById('dpExplorer').style.width = `${Math.max(80, Math.min(startW+delta, panW*0.6))}px`;
    }, 'ew-resize', false, 'dpExplorer');

    // Output height
    drag('dpOutDrag', 'dpOutput', (delta, startH) => {
      const panH = document.getElementById('devPanel')?.offsetHeight||600;
      document.getElementById('dpOutput').style.height = `${Math.max(60, Math.min(startH-delta, panH*0.7))}px`;
    }, 'ns-resize', true);
  }

  function drag(handleId, targetId, onMove, cursor, useY, sizeId) {
    const handle = document.getElementById(handleId);
    if (!handle) return;
    let s0=0, sz0=0, active=false;
    handle.addEventListener('mousedown', e => {
      active=true; s0 = useY ? e.clientY : e.clientX;
      const el = document.getElementById(sizeId||targetId);
      sz0 = useY ? el?.offsetHeight : el?.offsetWidth;
      document.body.style.cursor = cursor;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!active) return;
      onMove((useY ? e.clientY : e.clientX) - s0, sz0);
    });
    document.addEventListener('mouseup', () => {
      if (!active) return;
      active = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }

  // ----------------------------------------------------------------
  // TAB SYSTEM
  // ----------------------------------------------------------------
  const TabManager = {
    openTabs: [],
    activeTabId: null,

    openFile(fileId, fileName, lang) {
      const existing = this.openTabs.find(t => t.fileId === fileId);
      if (existing) {
        this.switchTab(fileId);
        return;
      }

      this.openTabs.push({ fileId, fileName, lang, modified: false });
      this.switchTab(fileId);
      renderTabs();
    },

    async closeTab(fileId) {
      const idx = this.openTabs.findIndex(t => t.fileId === fileId);
      if (idx === -1) return;

      const tab = this.openTabs[idx];
      if (tab.modified) {
        const ok = window.Dialog 
          ? await window.Dialog.confirm(`Close ${tab.fileName} without saving?`)
          : confirm(`Close ${tab.fileName} without saving?`);
        if (!ok) return;
      }

      this.openTabs.splice(idx, 1);

      if (this.activeTabId === fileId) {
        const nextTab = this.openTabs[Math.min(idx, this.openTabs.length - 1)];
        if (nextTab) {
          this.switchTab(nextTab.fileId);
        } else {
          this.activeTabId = null;
        }
      }

      renderTabs();
    },

    switchTab(fileId) {
      saveEditor();
      this.activeTabId = fileId;
      window.Projects.setActiveFile(fileId);
      renderTabs();
      loadFile();
    },

    markModified(fileId, modified = true) {
      const tab = this.openTabs.find(t => t.fileId === fileId);
      if (tab) tab.modified = modified;
      renderTabs();
    }
  };

  function renderTabs() {
    const container = document.getElementById('dpTabs');
    if (!container) return;

    const proj = window.Projects.getActiveProject();
    if (!proj) {
      container.innerHTML = '';
      return;
    }

    // Ensure active file is in tabs
    const s = window.Projects.getStore();
    const activeFile = proj.files.find(f => f.id === s.activeFileId);
    if (activeFile && !TabManager.openTabs.find(t => t.fileId === activeFile.id)) {
      TabManager.openFile(activeFile.id, activeFile.name, activeFile.lang);
    }

    container.innerHTML = TabManager.openTabs.map(tab => `
      <div class="dp-tab ${tab.fileId === TabManager.activeTabId ? 'active' : ''} ${tab.modified ? 'modified' : ''}" 
           data-file-id="${tab.fileId}">
        <span class="dp-tab-icon">${window.Projects.langEmoji(tab.lang)}</span>
        <span class="dp-tab-name">${tab.fileName}</span>
        <button class="dp-tab-close" data-file-id="${tab.fileId}">×</button>
      </div>
    `).join('');

    // Tab click handlers
    container.querySelectorAll('.dp-tab').forEach(tabEl => {
      tabEl.addEventListener('click', e => {
        if (e.target.classList.contains('dp-tab-close')) return;
        const fileId = tabEl.dataset.fileId;
        TabManager.switchTab(fileId);
      });
      
      // Tab drag reordering
      tabEl.setAttribute('draggable', 'true');
      tabEl.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', tabEl.dataset.fileId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => tabEl.style.opacity = '0.5', 0);
      });
      tabEl.addEventListener('dragend', () => {
        tabEl.style.opacity = '';
      });
      tabEl.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      tabEl.addEventListener('drop', e => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = tabEl.dataset.fileId;
        if (draggedId !== targetId) {
          // Reorder tabs
          const draggedIdx = TabManager.openTabs.findIndex(t => t.fileId === draggedId);
          const targetIdx = TabManager.openTabs.findIndex(t => t.fileId === targetId);
          const [draggedTab] = TabManager.openTabs.splice(draggedIdx, 1);
          TabManager.openTabs.splice(targetIdx, 0, draggedTab);
          renderTabs();
        }
      });
    });

    // Close button handlers
    container.querySelectorAll('.dp-tab-close').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        TabManager.closeTab(btn.dataset.fileId);
      });
    });
  }

  // ----------------------------------------------------------------
  // DRAG AND DROP FILE MOVING
  // ----------------------------------------------------------------
  let draggedFileId = null;

  function initDragDrop() {
    document.addEventListener('dragstart', e => {
      const row = e.target.closest('.dp-tree-row');
      if (!row) return;
      draggedFileId = row.dataset?.fileId;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedFileId);
    });

    document.addEventListener('dragover', e => {
      const row = e.target.closest('.dp-tree-row');
      if (!row || row.dataset?.fileId === draggedFileId) return;
      e.preventDefault();
      row.classList.add('dp-drop-target');
    });

    document.addEventListener('dragleave', e => {
      const row = e.target.closest('.dp-tree-row');
      if (row) row.classList.remove('dp-drop-target');
    });

    document.addEventListener('drop', e => {
      const row = e.target.closest('.dp-tree-row');
      if (!row) return;
      row.classList.remove('dp-drop-target');

      const targetId = row.dataset?.fileId;
      if (!targetId || targetId === draggedFileId) return;

      // Move file to folder (if target is a folder)
      const targetFile = window.Projects.getFile?.(targetId);
      if (targetFile && !targetFile.lang) {
        // It's a folder, move file into it
        const draggedFile = window.Projects.getFile?.(draggedFileId);
        if (draggedFile) {
          const newName = targetFile.name + '/' + draggedFile.name.split('/').pop();
          window.Projects.renameFile(draggedFileId, newName);
          renderTree();
          renderTabs();
        }
      }

      draggedFileId = null;
    });
  }

  // ----------------------------------------------------------------
  // SEARCH BAR
  // ----------------------------------------------------------------
  let searchResults = [];
  let searchIndex = 0;

  function toggleSearch() {
    const bar = document.getElementById('dpSearchBar');
    if (!bar) return;
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) {
      document.getElementById('dpSearchInput')?.focus();
    }
  }

  function searchFiles(query) {
    if (!query) {
      searchResults = [];
      updateSearchCount();
      return;
    }

    const proj = window.Projects.getActiveProject();
    if (!proj) return;

    const q = query.toLowerCase();
    searchResults = proj.files.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.content || '').toLowerCase().includes(q)
    );
    searchIndex = 0;
    updateSearchCount();

    if (searchResults.length > 0) {
      showSearchResult(0);
    }
  }

  function showSearchResult(idx) {
    if (idx < 0 || idx >= searchResults.length) return;
    const file = searchResults[idx];
    TabManager.openFile(file.id, file.name, file.lang);
    searchIndex = idx;
    updateSearchCount();
  }

  function updateSearchCount() {
    const count = document.getElementById('dpSearchCount');
    if (count) {
      count.textContent = searchResults.length > 0 
        ? `${searchIndex + 1}/${searchResults.length}` 
        : '';
    }
  }

  function initSearchHandlers() {
    const input = document.getElementById('dpSearchInput');
    if (input) {
      input.addEventListener('input', e => searchFiles(e.target.value));
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            showSearchResult(searchIndex - 1);
          } else {
            showSearchResult(searchIndex + 1);
          }
        }
        if (e.key === 'Escape') {
          document.getElementById('dpSearchBar')?.classList.remove('open');
        }
      });
    }

    document.getElementById('dpSearchPrev')?.addEventListener('click', () => 
      showSearchResult(searchIndex - 1));
    document.getElementById('dpSearchNext')?.addEventListener('click', () => 
      showSearchResult(searchIndex + 1));
    document.getElementById('dpSearchClose')?.addEventListener('click', () => {
      document.getElementById('dpSearchBar')?.classList.remove('open');
    });
  }

  // ----------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ----------------------------------------------------------------
  let shortcutsInitialized = false;

  function initKeyboardShortcuts() {
    if (shortcutsInitialized) return;
    shortcutsInitialized = true;

    document.addEventListener('keydown', e => {
      if (currentMode !== 'coding') return;

      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveEditor();
        TabManager.markModified(TabManager.activeTabId, false);
        const status = document.getElementById('dpStatus');
        if (status) { status.textContent = 'Saved!'; setTimeout(() => status.textContent = '', 1500); }
      }

      // Ctrl+W - Close tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (TabManager.activeTabId) {
          TabManager.closeTab(TabManager.activeTabId);
        }
      }

      // Ctrl+P - Quick open / search
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        toggleSearch();
      }

      // Ctrl+F - Find in file
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
      }

      // Ctrl+/ - Toggle comment
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        toggleComment();
      }

      // Ctrl+D - Duplicate line
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateLine();
      }

      // F2 - Rename file
      if (e.key === 'F2') {
        e.preventDefault();
        renameCurrentFile();
      }

      // Ctrl+\ - Toggle split view
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        toggleSplitView();
      }

      // Ctrl+` - Toggle minimap
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleMinimap();
      }

      // Ctrl+G - Go to line
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        showGoToLine();
      }

      // Ctrl+M - Memory settings
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        window.MemoryUI?.toggle();
      }

      // Ctrl+Shift+F - Replace in files
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleReplace();
      }

      // Ctrl+H - Replace
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        toggleReplace();
      }
    });
  }

  async function showGoToLine() {
    const line = await window.Dialog?.prompt('Go to line:', '1');
    if (!line) return;
    
    const lineNum = parseInt(line);
    if (isNaN(lineNum) || lineNum < 1) return;
    
    if (window.MonacoEditor?.isReady()) {
      window.MonacoEditor.goToLine(lineNum);
    } else {
      const editor = document.getElementById('dpEditor');
      if (editor) {
        const lines = editor.value.split('\n');
        if (lineNum <= lines.length) {
          let pos = 0;
          for (let i = 0; i < lineNum - 1; i++) {
            pos += lines[i].length + 1;
          }
          editor.focus();
          editor.setSelectionRange(pos, pos);
          const lineHeight = 18;
          editor.scrollTop = (lineNum - 1) * lineHeight - editor.clientHeight / 2;
        }
      }
    }
  }

  function toggleReplace() {
    const bar = document.getElementById('dpSearchBar');
    if (!bar) return;
    
    // Toggle replace mode
    let replaceInput = document.getElementById('dpReplaceInput');
    if (!replaceInput) {
      replaceInput = document.createElement('input');
      replaceInput.type = 'text';
      replaceInput.id = 'dpReplaceInput';
      replaceInput.placeholder = 'Replace with...';
      replaceInput.style.cssText = 'margin-top:4px;width:100%;padding:6px 10px;background:#0d1117;border:1px solid #30363d;border-radius:4px;color:#c9d1d9;font-size:12px;';
      bar.appendChild(replaceInput);
      
      // Add replace buttons
      const btnWrap = document.createElement('div');
      btnWrap.style.cssText = 'display:flex;gap:4px;margin-top:4px;';
      btnWrap.innerHTML = `
        <button class="dp-search-btn" id="dpReplaceBtn" style="flex:1">Replace</button>
        <button class="dp-search-btn" id="dpReplaceAllBtn" style="flex:1">Replace All</button>
      `;
      bar.appendChild(btnWrap);
      
      // Replace handlers
      document.getElementById('dpReplaceBtn')?.addEventListener('click', replaceFirst);
      document.getElementById('dpReplaceAllBtn')?.addEventListener('click', replaceAll);
    }
    
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) {
      document.getElementById('dpSearchInput')?.focus();
    }
  }

  function replaceFirst() {
    const searchInput = document.getElementById('dpSearchInput');
    const replaceInput = document.getElementById('dpReplaceInput');
    if (!searchInput || !replaceInput) return;
    
    const search = searchInput.value;
    const replace = replaceInput.value;
    if (!search) return;
    
    if (window.MonacoEditor?.isReady()) {
      const editor = window.MonacoEditor.getEditor();
      const content = editor.getValue();
      const newContent = content.replace(search, replace);
      editor.setValue(newContent);
      TabManager.markModified(TabManager.activeTabId, true);
    } else {
      const editor = document.getElementById('dpEditor');
      if (editor) {
        editor.value = editor.value.replace(search, replace);
        TabManager.markModified(TabManager.activeTabId, true);
      }
    }
    
    window.Toast?.success('Replaced 1 occurrence');
  }

  function replaceAll() {
    const searchInput = document.getElementById('dpSearchInput');
    const replaceInput = document.getElementById('dpReplaceInput');
    if (!searchInput || !replaceInput) return;
    
    const search = searchInput.value;
    const replace = replaceInput.value;
    if (!search) return;
    
    let count = 0;
    
    if (window.MonacoEditor?.isReady()) {
      const editor = window.MonacoEditor.getEditor();
      const content = editor.getValue();
      count = (content.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const newContent = content.split(search).join(replace);
      editor.setValue(newContent);
      TabManager.markModified(TabManager.activeTabId, true);
    } else {
      const editor = document.getElementById('dpEditor');
      if (editor) {
        count = (editor.value.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        editor.value = editor.value.split(search).join(replace);
        TabManager.markModified(TabManager.activeTabId, true);
      }
    }
    
    window.Toast?.success(`Replaced ${count} occurrences`);
  }

  function toggleComment() {
    const editor = document.getElementById('dpEditor');
    if (!editor) return;
    const { selectionStart, selectionEnd, value } = editor;
    const lines = value.split('\n');
    const startLine = value.substring(0, selectionStart).split('\n').length - 1;
    const endLine = value.substring(0, selectionEnd).split('\n').length - 1;

    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].trimStart().startsWith('#')) {
        lines[i] = lines[i].replace(/^(\s*)#\s?/, '$1');
      } else if (lines[i].trim()) {
        lines[i] = lines[i].replace(/^(\s*)/, '$1# ');
      }
    }

    editor.value = lines.join('\n');
    TabManager.markModified(TabManager.activeTabId, true);
  }

  function duplicateLine() {
    const editor = document.getElementById('dpEditor');
    if (!editor) return;
    const { selectionStart, value } = editor;
    const lines = value.split('\n');
    const lineIdx = value.substring(0, selectionStart).split('\n').length - 1;
    lines.splice(lineIdx + 1, 0, lines[lineIdx]);
    editor.value = lines.join('\n');
    TabManager.markModified(TabManager.activeTabId, true);
  }

  async function renameCurrentFile() {
    const file = window.Projects.getActiveFile();
    if (!file) return;
    const newName = await window.Dialog.prompt('Rename file:', file.name);
    if (!newName || newName === file.name) return;
    saveEditor();
    window.Projects.renameFile(file.id, newName.trim());
    renderTree();
    renderTabs();
  }

  // ----------------------------------------------------------------
  // MINIMAP
  // ----------------------------------------------------------------
  let minimapEnabled = true;

  function toggleMinimap() {
    minimapEnabled = !minimapEnabled;
    const wrap = document.getElementById('dpMinimapWrap');
    if (wrap) wrap.classList.toggle('open', minimapEnabled);
    if (minimapEnabled) renderMinimap();
  }

  function renderMinimap() {
    const canvas = document.getElementById('dpMinimap');
    const editor = document.getElementById('dpEditor');
    if (!canvas || !editor) return;

    const ctx = canvas.getContext('2d');
    const content = editor.value;
    const lines = content.split('\n');

    // Set canvas size
    const wrap = document.getElementById('dpMinimapWrap');
    if (!wrap) return;
    canvas.width = 80;
    canvas.height = wrap.offsetHeight || 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8b949e';

    const lineHeight = 2;
    const maxChars = 40;

    lines.forEach((line, i) => {
      if (i * lineHeight > canvas.height) return;
      const width = Math.min(line.length, maxChars) * 2;
      ctx.fillRect(0, i * lineHeight, width, 1);
    });
  }

  // ----------------------------------------------------------------
  // SPLIT VIEW
  // ----------------------------------------------------------------
  let splitViewEnabled = false;

  function toggleSplitView() {
    splitViewEnabled = !splitViewEnabled;
    const pane2 = document.getElementById('dpEditorPane2');
    const handle = document.getElementById('dpSplitHandle');
    const split = document.getElementById('dpEditorSplit');

    if (pane2) pane2.classList.toggle('collapsed', !splitViewEnabled);
    if (handle) handle.classList.toggle('open', splitViewEnabled);
    if (split) split.classList.toggle('split', splitViewEnabled);

    if (splitViewEnabled) {
      // Copy content to second editor
      const editor1 = document.getElementById('dpEditor');
      const editor2 = document.getElementById('dpEditor2');
      if (editor1 && editor2) {
        editor2.value = editor1.value;
      }
    }
  }

  // ----------------------------------------------------------------
  // INIT ALL NEW FEATURES
  // ----------------------------------------------------------------
  function initNewFeatures() {
    initDragDrop();
    initSearchHandlers();
    
    // Show minimap by default
    const wrap = document.getElementById('dpMinimapWrap');
    if (wrap) wrap.classList.add('open');

    // Update minimap on editor change
    const editor = document.getElementById('dpEditor');
    if (editor) {
      editor.addEventListener('input', () => {
        TabManager.markModified(TabManager.activeTabId, true);
        if (minimapEnabled) renderMinimap();
      });
      editor.addEventListener('scroll', renderMinimap);
    }
  }

  // Call init after panel is created
  setTimeout(initNewFeatures, 100);

  // Expose API for external callers (subject-tools.js, etc.)
  window.TerminalUI = { openPanel, closePanel, injectPanel, showCoding, showCyber };

})();
