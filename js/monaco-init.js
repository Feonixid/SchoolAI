// js/monaco-init.js
// Monaco Editor initialization and integration
// ===================================================================

(function () {
  'use strict';

  let monacoEditor = null;
  let monacoEditor2 = null; // For split view
  let monacoReady = false;
  let pendingFile = null;

  // Language mapping from file extension to Monaco language
  const LANG_MAP = {
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'java': 'java',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'lua': 'lua',
    'pl': 'perl',
    'cs': 'csharp',
    'vb': 'vb',
    'fs': 'fsharp',
    'dart': 'dart',
    'vue': 'vue',
    'svelte': 'svelte'
  };

  // ----------------------------------------------------------------
  // INITIALIZE MONACO
  // ----------------------------------------------------------------
  function initMonaco() {
    if (monacoReady) return Promise.resolve(true);

    return new Promise((resolve) => {
      // Check if Monaco is already loaded globally
      if (typeof monaco !== 'undefined' && monaco.editor) {
        createEditor(resolve);
        return;
      }

      // Try local path first, fallback to CDN
      const localBase = 'node_modules/monaco-editor/min/vs';
      const cdnBase = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs';

      function loadViaAMD(basePath, isCdn = false) {
        const loaderScript = document.createElement('script');
        loaderScript.src = `${basePath}/loader.js`;
        
        loaderScript.onload = () => {
          try {
            window.require.config({
              paths: { vs: basePath },
              'vs/nls': { availableLanguages: { '*': 'en' } }
            });
            window.require(['vs/editor/editor.main'], function () {
              createEditor(resolve);
            });
          } catch (e) {
            console.warn('Monaco require failed:', e);
            if (!isCdn) {
              loadViaAMD(cdnBase, true);
            } else {
              enableFallbackTextarea(resolve);
            }
          }
        };

        loaderScript.onerror = () => {
          if (!isCdn) {
            console.log('Local Monaco loader not reachable, loading from CDN...');
            loadViaAMD(cdnBase, true);
          } else {
            console.warn('Monaco CDN loader failed, using fallback editor');
            enableFallbackTextarea(resolve);
          }
        };

        document.head.appendChild(loaderScript);
      }

      function enableFallbackTextarea(res) {
        const fallback = document.getElementById('dpEditor');
        if (fallback) {
          fallback.style.display = 'block';
        }
        res(false);
      }

      loadViaAMD(localBase, false);
    });
  }

  // ----------------------------------------------------------------
  // CREATE EDITOR INSTANCE
  // ----------------------------------------------------------------
  function createEditor(callback) {
    const container = document.getElementById('dpEditorContainer');
    if (!container) {
      console.warn('Monaco container not found');
      // Show fallback textarea
      const fallback = document.getElementById('dpEditor');
      if (fallback) fallback.style.display = '';
      callback(false);
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create editor
    monacoEditor = monaco.editor.create(container, {
      value: '',
      language: 'python',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { 
        enabled: true, 
        scale: 1,
        showSlider: 'mouseover'
      },
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      lineNumbersMinChars: 4,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      wrappingStrategy: 'advanced',
      tabSize: 4,
      insertSpaces: true,
      autoIndent: 'full',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoClosingDelete: 'always',
      autoClosingOvertype: 'always',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      bracketPairColorization: { enabled: true },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      snippetSuggestions: 'top',
      parameterHints: { enabled: true },
      lightbulb: { enabled: true },
      codeLens: true,
      folding: true,
      foldingHighlight: true,
      foldingStrategy: 'auto',
      showFoldingControls: 'mouseover',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      mouseWheelZoom: true,
      padding: { top: 12, bottom: 12 },
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      },
      overviewRulerLanes: 2,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      }
    });

    // Set up change listener
    monacoEditor.onDidChangeModelContent(() => {
      if (window.TabManager) {
        window.TabManager.markModified(window.TabManager.activeTabId, true);
      }
      // Auto-save debounce
      debouncedSave();
    });

    // Set up save shortcut (Ctrl+S)
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentFile();
    });

    // Hide old minimap since Monaco has its own
    const oldMinimap = document.getElementById('dpMinimapWrap');
    if (oldMinimap) oldMinimap.style.display = 'none';

    // Hide fallback textarea
    const fallback = document.getElementById('dpEditor');
    if (fallback) fallback.style.display = 'none';

    monacoReady = true;
    console.log('Monaco editor initialized');

    // Load pending file if any
    if (pendingFile) {
      loadFile(pendingFile);
      pendingFile = null;
    }

    callback(true);
  }

  // ----------------------------------------------------------------
  // SAVE HANDLING
  // ----------------------------------------------------------------
  let saveTimeout = null;

  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      // Auto-save logic (optional)
    }, 2000);
  }

  function saveCurrentFile() {
    if (!monacoEditor || !window.Projects) return;

    const content = monacoEditor.getValue();
    const file = window.Projects.getActiveFile();
    
    if (file) {
      window.Projects.saveFileContent(file.id, content);
      if (window.TabManager) {
        window.TabManager.markModified(file.id, false);
      }
      window.Toast?.success(`Saved ${file.name}`);
    }
  }

  // ----------------------------------------------------------------
  // FILE LOADING
  // ----------------------------------------------------------------
  function loadFile(file) {
    if (!monacoReady) {
      pendingFile = file;
      return;
    }

    if (!file) {
      monacoEditor.setValue('');
      monacoEditor.setModel(null);
      return;
    }

    // Set content
    monacoEditor.setValue(file.content || '');

    // Set language
    const lang = getLanguage(file.name, file.lang);
    monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);

    // Update language pill
    const pill = document.getElementById('dpLangPill');
    if (pill) {
      pill.textContent = lang.toUpperCase();
      pill.className = `dp-lang-pill ${window.Projects?.langBadgeClass?.(lang) || ''}`;
    }

    // Clear undo history
    monacoEditor.setScrollPosition({ scrollTop: 0 });
  }

  function getLanguage(filename, fallback = 'plaintext') {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return LANG_MAP[ext] || fallback || 'plaintext';
  }

  // ----------------------------------------------------------------
  // SPLIT VIEW
  // ----------------------------------------------------------------
  function initSplitEditor() {
    const container2 = document.getElementById('dpEditorContainer2');
    if (!container2 || !monacoReady) return;

    container2.innerHTML = '';

    monacoEditor2 = monaco.editor.create(container2, {
      value: monacoEditor?.getValue() || '',
      language: monacoEditor?.getModel()?.getLanguageId() || 'python',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      readOnly: true // Second pane is read-only by default
    });

    // Sync scroll
    monacoEditor?.onDidScrollChange(e => {
      monacoEditor2?.setScrollPosition({
        scrollTop: e.scrollTop,
        scrollLeft: e.scrollLeft
      });
    });
  }

  function toggleSplitView() {
    const pane2 = document.getElementById('dpEditorPane2');
    const handle = document.getElementById('dpSplitHandle');
    
    if (!pane2) return;

    const isCollapsed = pane2.classList.contains('collapsed');
    pane2.classList.toggle('collapsed', !isCollapsed);
    handle?.classList.toggle('open', isCollapsed);

    if (isCollapsed && !monacoEditor2) {
      initSplitEditor();
    }
  }

  // ----------------------------------------------------------------
  // EDITOR COMMANDS
  // ----------------------------------------------------------------
  function getEditor() {
    return monacoEditor;
  }

  function getValue() {
    return monacoEditor?.getValue() || '';
  }

  function setValue(content) {
    monacoEditor?.setValue(content);
  }

  function insertText(text) {
    const position = monacoEditor?.getPosition();
    if (position) {
      monacoEditor?.executeEdits('', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text
      }]);
    }
  }

  function goToLine(lineNumber) {
    monacoEditor?.revealLineInCenter(lineNumber);
    monacoEditor?.setPosition({ lineNumber, column: 1 });
    monacoEditor?.focus();
  }

  function format() {
    monacoEditor?.getAction('editor.action.formatDocument')?.run();
  }

  function toggleComment() {
    monacoEditor?.getAction('editor.action.commentLine')?.run();
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.MonacoEditor = {
    init: initMonaco,
    isReady: () => monacoReady,
    getEditor,
    getValue,
    setValue,
    loadFile,
    saveCurrentFile,
    insertText,
    goToLine,
    format,
    toggleComment,
    toggleSplitView,
    getLanguage
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initMonaco());
  } else {
    setTimeout(initMonaco, 100);
  }

  console.log('Monaco init module loaded');
})();
