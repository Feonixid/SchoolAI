// js/subject-tools.js
// ===================================================================
// APPLE-STYLED TABBED INTERACTIVE SUBJECT WORKBENCH
// All 13 subjects with tabbed navigation, live simulators,
// visualizers, equation solvers, and direct "Send to Chat" export.
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // TOOL DEFINITIONS PER SUBJECT
  // ----------------------------------------------------------------
  const SUBJECT_TOOLS = {
    // 1. Mathematics
    'matematike': [
      { id: 'calc', label: 'Calculator', icon: '🧮', desc: 'Standard & scientific algebraic calculator', fn: renderScientificCalculator },
      { id: 'grapher', label: 'Function Grapher', icon: '📈', desc: 'Plot 2D functions, roots & vertices', fn: renderFunctionGrapher },
      { id: 'equation-solver', label: 'Equation Solver', icon: '🔢', desc: 'Linear & quadratic step-by-step solver', fn: renderEquationSolver },
      { id: 'geometry-calc', label: 'Geometry & 3D', icon: '📐', desc: 'Circle, Triangle, Rectangle & Cylinder', fn: renderGeometryCalc }
    ],

    // 2. Physics
    'fizike': [
      { id: 'kinematics', label: 'Kinematics & Motion', icon: '⚡', desc: 'v = v0 + at and d(t) curves', fn: renderKinematicsSimulator },
      { id: 'ohms-law', label: "Ohm's Law & Circuit", icon: '💡', desc: 'V = I · R, power and lamp brightness', fn: renderOhmsLawSimulator },
      { id: 'forces-energy', label: 'Energy & Gravity', icon: '🚀', desc: 'Ep = mgh, Ek = 1/2 mv² conservation', fn: renderEnergySimulator }
    ],

    // 3. Chemistry
    'kimia': [
      { id: 'periodic-table', label: 'Periodic Table', icon: '🧪', desc: 'Search elements, masses & properties', fn: renderPeriodicTable },
      { id: 'molar-mass', label: 'Molar Mass Calc', icon: '⚖️', desc: 'Molar mass & percentage composition', fn: renderMolarMassCalc },
      { id: 'equation-balancer', label: 'Reaction Balancer', icon: '⚗️', desc: 'Balance chemical equations', fn: renderEquationBalancer }
    ],

    // 4. Biology
    'biologji': [
      { id: 'punnett-square', label: 'Punnett Genetics', icon: '🧬', desc: 'Monohybrid crosses & genotype ratios', fn: renderPunnettSquare },
      { id: 'cell-anatomy', label: 'Cell Anatomy', icon: '🔬', desc: 'Plant & animal cell organelles', fn: renderCellExplorer },
      { id: 'photosynthesis', label: 'Photosynthesis & ATP', icon: '🌿', desc: 'Light & Calvin cycle equations', fn: renderPhotosynthesisGuide }
    ],

    // 5. Economics
    'ekonomi': [
      { id: 'supply-demand', label: 'Supply & Demand', icon: '📈', desc: 'Equilibrium price & curve shifts', fn: renderSupplyDemandEmbed },
      { id: 'ppf', label: 'PPF Curve', icon: '🔄', desc: 'Opportunity cost & trade-offs', fn: renderPPFEmbed },
      { id: 'adas', label: 'AD-AS Model', icon: '🏛️', desc: 'Aggregate demand/supply & GDP', fn: renderADASEmbed },
      { id: 'gdp', label: 'GDP Breakdown', icon: '💰', desc: 'C + I + G + (X - M) calculation', fn: renderGDPEmbed },
      { id: 'inflation', label: 'Inflation / CPI', icon: '🏷️', desc: 'Price basket & inflation rate', fn: renderInflationEmbed }
    ],

    // 6. History
    'histori': [
      { id: 'timeline', label: 'History Timeline', icon: '⏳', desc: 'Illyria to 1912 Independence & Modern', fn: renderHistoryTimeline },
      { id: 'eras-comparator', label: 'Eras & Epochs', icon: '🏛️', desc: 'Compare historical civilizations', fn: renderHistoryEras }
    ],

    // 7. Albanian
    'shqip': [
      { id: 'grammar-parser', label: 'Analizë Sintaksore', icon: '🔍', desc: 'Kryefjala, kallëzuesi, kundrinori', fn: renderGrammarParser },
      { id: 'spelling-check', label: 'Drejtshkrimi & Ë-ja', icon: '✍️', desc: 'Rregullat dhe korrigjimi i tekstit', fn: renderSpellingChecker },
      { id: 'quiz-game', label: 'Lojë Kuizi Gjuhësor', icon: '🧠', desc: '10 nivele pyetjesh gjuhësore', fn: () => window.QuizGame?.open?.() }
    ],

    // 8. English
    'anglisht': [
      { id: 'essay-helper', label: 'Essay Outline', icon: '📝', desc: 'Thesis, PEEL paragraphs & conclusion', fn: renderEssayOutlineBuilder },
      { id: 'vocab-builder', label: 'Academic Vocab', icon: '📖', desc: 'Advanced academic vocabulary bank', fn: renderVocabBuilder }
    ],

    // 9. Coding
    'coding': [
      { id: 'open-editor', label: 'Code Editor', icon: '💻', desc: 'Monaco editor in Python, JS, HTML', fn: () => { if (window.TerminalUI?.openPanel) { window.TerminalUI.injectPanel?.(); window.TerminalUI.openPanel('coding'); } else if (window.Subjects?.switchSubject) { window.Subjects.switchSubject('coding'); } } },
      { id: 'algorithms', label: 'Algorithms Playground', icon: '🧩', desc: 'Binary search, sorting visualizer', fn: renderAlgorithmVisualizer }
    ],

    // 10. Cyber Safety
    'cyber': [
      { id: 'password-checker', label: 'Password Entropy', icon: '🛡️', desc: 'Entropy & crack time analyzer', fn: renderPasswordStrengthTool },
      { id: 'open-terminal', label: 'Cyber Lab Terminal', icon: '🔐', desc: 'Interactive simulated terminal', fn: () => { if (window.TerminalUI?.openPanel) { window.TerminalUI.injectPanel?.(); window.TerminalUI.openPanel('cyber'); } else if (window.Subjects?.switchSubject) { window.Subjects.switchSubject('cyber'); } } }
    ],

    // 11. German
    'german': [
      { id: 'article-trainer', label: 'Der / Die / Das', icon: '🇩🇪', desc: 'Article genders & noun endings', fn: renderGermanArticleTrainer },
      { id: 'german-verbs', label: 'Verbkonjugation', icon: '🗣️', desc: 'Präsens, Präteritum, Perfekt', fn: renderGermanVerbConjugator }
    ],

    // 12. Spanish
    'spanish': [
      { id: 'spanish-verbs', label: 'Conjugador de Verbos', icon: '🇪🇸', desc: 'Presente, Pretérito, Futuro', fn: renderSpanishVerbConjugator }
    ],

    // 13. French
    'french': [
      { id: 'french-verbs', label: 'Conjugaison des Verbes', icon: '🇫🇷', desc: 'Présent, Passé Composé, Futur', fn: renderFrenchVerbConjugator }
    ]
  };

  // State
  let activeToolState = {
    subjectId: 'matematike',
    toolId: 'grapher',
    lastSummary: ''
  };

  // ----------------------------------------------------------------
  // OPEN TABBED WORKBENCH MODAL
  // ----------------------------------------------------------------
  function openWorkbench(toolId = null, subjectId = null) {
    const currentSubject = subjectId
      ? window.Subjects?.getAll()?.find(s => s.id === subjectId)
      : (window.Subjects?.getActive() || window.Subjects?.getAll()?.[0]);

    if (!currentSubject) return;

    const subjTools = SUBJECT_TOOLS[currentSubject.id] || [];
    if (subjTools.length === 0) {
      if (window.Toast?.info) window.Toast.info(`No specialized tools for ${currentSubject.label} yet.`);
      return;
    }

    const selectedToolId = toolId || subjTools[0]?.id;
    activeToolState.subjectId = currentSubject.id;
    activeToolState.toolId = selectedToolId;

    let overlay = document.getElementById('subjectWorkbenchModal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'subjectWorkbenchModal';
      overlay.className = 'workbench-overlay';
      document.body.appendChild(overlay);

      // Close on backdrop click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeWorkbench();
      });
    }

    // Build Modal Structure
    overlay.innerHTML = `
      <div class="workbench-window" role="dialog" aria-label="Interactive Subject Tools">
        <div class="workbench-topbar">
          <div class="workbench-title-area">
            <span class="workbench-subject-badge">
              <span>${currentSubject.emoji}</span>
              <span>${currentSubject.label} Tools</span>
            </span>
          </div>

          <!-- Apple Segmented Tab Bar -->
          <div class="workbench-tabs" id="wbTabBar">
            ${subjTools.map(t => `
              <button class="workbench-tab-btn ${t.id === selectedToolId ? 'active' : ''}" data-tool-id="${t.id}">
                <span>${t.icon}</span>
                <span>${t.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Actions -->
          <div class="workbench-actions">
            <button class="wb-action-btn" id="wbSendChatBtn" title="Send current tool result to AI chat">
              <span>📥</span> <span>Send to Chat</span>
            </button>
            <button class="wb-close-btn" id="wbCloseBtn" title="Close Workbench">✕</button>
          </div>
        </div>

        <div class="workbench-body" id="wbBody"></div>
      </div>
    `;

    overlay.classList.add('open');

    // Close button
    overlay.querySelector('#wbCloseBtn').addEventListener('click', closeWorkbench);

    // Send to Chat button
    overlay.querySelector('#wbSendChatBtn').addEventListener('click', () => {
      if (activeToolState.lastSummary) {
        const input = document.getElementById('input');
        if (input) {
          input.value = activeToolState.lastSummary;
          input.focus();
          closeWorkbench();
          if (window.Toast?.success) window.Toast.success('Inserted tool calculation into chat!');
        }
      } else {
        if (window.Toast?.info) window.Toast.info('Adjust tool settings to generate a summary.');
      }
    });

    // Wire up tab switching
    overlay.querySelectorAll('.workbench-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = btn.dataset.toolId;
        switchWorkbenchTab(tid, currentSubject.id);
      });
    });

    // Render active tab tool
    switchWorkbenchTab(selectedToolId, currentSubject.id);
  }

  function switchWorkbenchTab(toolId, subjectId) {
    activeToolState.toolId = toolId;
    activeToolState.subjectId = subjectId;

    const overlay = document.getElementById('subjectWorkbenchModal');
    if (!overlay) return;

    // Update tab bar buttons
    overlay.querySelectorAll('.workbench-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.toolId === toolId);
    });

    const body = overlay.querySelector('#wbBody');
    body.innerHTML = '';

    const tools = SUBJECT_TOOLS[subjectId] || [];
    const matched = tools.find(t => t.id === toolId);

    if (matched && matched.fn) {
      if (matched.id === 'open-editor' || matched.id === 'open-terminal' || matched.id === 'quiz-game') {
        closeWorkbench();
        matched.fn();
        return;
      }

      // Provide both body and controls wrapper for complete tool compatibility
      const toolBody = document.createElement('div');
      toolBody.className = 'tool-inner-body';
      const toolControls = document.createElement('div');
      toolControls.className = 'tool-inner-controls';
      toolControls.style.cssText = 'margin-top:12px;';
      
      body.appendChild(toolBody);
      body.appendChild(toolControls);

      matched.fn({ body: toolBody, controls: toolControls });
    }
  }

  function closeWorkbench() {
    const overlay = document.getElementById('subjectWorkbenchModal');
    if (overlay) overlay.classList.remove('open');
  }

  // ----------------------------------------------------------------
  // TOOL IMPLEMENTATIONS (High-resolution, Apple-styled)
  // ----------------------------------------------------------------

  // 0. MATHEMATICS: Apple-styled Standard & Scientific Calculator
  function renderScientificCalculator(container) {
    container.body.innerHTML = `
      <div style="max-width:460px;margin:0 auto;background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:16px;box-shadow:0 12px 32px var(--shadow-lg)">
        
        <!-- Display LCD Screen -->
        <div style="background:var(--input-bg);border:1px solid var(--border);border-radius:14px;padding:12px 16px;text-align:right;margin-bottom:14px;box-shadow:inset 0 2px 6px rgba(0,0,0,0.06)">
          <div id="calcHistory" style="font-size:12px;color:var(--muted);min-height:18px;overflow-x:auto;white-space:nowrap;font-family:'Cascadia Code',monospace"></div>
          <div id="calcDisplay" style="font-size:32px;font-weight:700;letter-spacing:-0.5px;color:var(--text);overflow-x:auto;white-space:nowrap;font-family:'Cascadia Code',monospace;margin-top:2px">0</div>
        </div>

        <!-- Mode Toggle & Tape -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="display:flex;gap:6px">
            <button id="calcDegRadBtn" class="calc-top-pill" title="Toggle Degrees / Radians">DEG</button>
            <button id="calcSciToggle" class="calc-top-pill" title="Toggle Scientific Keypad">🔬 Scientific: ON</button>
          </div>
          <button id="calcClearHistoryBtn" class="calc-top-pill" style="color:var(--error)" title="Clear Display & History">AC</button>
        </div>

        <!-- Calculator Keypad Grid -->
        <div id="calcKeypad" style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px">
          <!-- Row 1: Scientific Functions -->
          <button class="calc-btn calc-sci" data-action="sin">sin</button>
          <button class="calc-btn calc-sci" data-action="cos">cos</button>
          <button class="calc-btn calc-sci" data-action="tan">tan</button>
          <button class="calc-btn calc-op" data-action="(">(</button>
          <button class="calc-btn calc-op" data-action=")">)</button>

          <!-- Row 2 -->
          <button class="calc-btn calc-sci" data-action="sqrt">√</button>
          <button class="calc-btn calc-sci" data-action="pow2">x²</button>
          <button class="calc-btn calc-sci" data-action="pow">xʸ</button>
          <button class="calc-btn calc-fn" data-action="clear">C</button>
          <button class="calc-btn calc-op" data-action="/">÷</button>

          <!-- Row 3 -->
          <button class="calc-btn calc-sci" data-action="log">log</button>
          <button class="calc-btn calc-num" data-num="7">7</button>
          <button class="calc-btn calc-num" data-num="8">8</button>
          <button class="calc-btn calc-num" data-num="9">9</button>
          <button class="calc-btn calc-op" data-action="*">×</button>

          <!-- Row 4 -->
          <button class="calc-btn calc-sci" data-action="ln">ln</button>
          <button class="calc-btn calc-num" data-num="4">4</button>
          <button class="calc-btn calc-num" data-num="5">5</button>
          <button class="calc-btn calc-num" data-num="6">6</button>
          <button class="calc-btn calc-op" data-action="-">−</button>

          <!-- Row 5 -->
          <button class="calc-btn calc-sci" data-action="pi">π</button>
          <button class="calc-btn calc-num" data-num="1">1</button>
          <button class="calc-btn calc-num" data-num="2">2</button>
          <button class="calc-btn calc-num" data-num="3">3</button>
          <button class="calc-btn calc-op" data-action="+">+</button>

          <!-- Row 6 -->
          <button class="calc-btn calc-sci" data-action="e">e</button>
          <button class="calc-btn calc-fn" data-action="pm">±</button>
          <button class="calc-btn calc-num" data-num="0">0</button>
          <button class="calc-btn calc-num" data-num=".">.</button>
          <button class="calc-btn calc-equals" data-action="equals">=</button>
        </div>
      </div>
    `;

    // Inject calculator styling
    if (!document.getElementById('calcCSS')) {
      const style = document.createElement('style');
      style.id = 'calcCSS';
      style.textContent = `
        .calc-btn {
          padding: 12px 6px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--input-bg);
          color: var(--text);
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', -apple-system, sans-serif;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.25, 0.1, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }
        .calc-btn:hover { background: var(--hover-bg); transform: translateY(-1px); }
        .calc-btn:active { transform: scale(0.96); }
        .calc-num { font-weight: 700; font-size: 17px; }
        .calc-op { background: rgba(0, 122, 255, 0.1); color: var(--accent); border-color: rgba(0,122,255,0.25); font-size: 18px; font-weight: 700; }
        .calc-op:hover { background: var(--accent); color: white; }
        .calc-fn { background: rgba(239, 68, 68, 0.08); color: #ef4444; border-color: rgba(239,68,68,0.2); }
        .calc-sci { font-size: 12.5px; color: var(--muted); font-weight: 600; background: rgba(0,0,0,0.03); }
        .calc-equals { background: var(--accent); color: white; border-color: var(--accent); font-size: 20px; font-weight: 800; }
        .calc-equals:hover { filter: brightness(1.1); }
        .calc-top-pill {
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 700;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--input-bg);
          color: var(--muted);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }
        .calc-top-pill:hover { color: var(--text); border-color: var(--accent); }
      `;
      document.head.appendChild(style);
    }

    const display = container.body.querySelector('#calcDisplay');
    const history = container.body.querySelector('#calcHistory');
    const degRadBtn = container.body.querySelector('#calcDegRadBtn');
    const sciToggleBtn = container.body.querySelector('#calcSciToggle');
    const clearHistoryBtn = container.body.querySelector('#calcClearHistoryBtn');

    let expr = '';
    let currentInput = '0';
    let isDeg = true;
    let isSciOn = true;
    let justCalculated = false;

    function updateUI() {
      display.textContent = currentInput || '0';
      history.textContent = expr || '';
    }

    function evaluateExpression(str) {
      // Safe algebraic evaluation
      try {
        let sanitized = str
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-')
          .replace(/π/g, 'Math.PI')
          .replace(/\be\b/g, 'Math.E');

        // Handle Trigonometry according to DEG/RAD mode
        if (isDeg) {
          sanitized = sanitized
            .replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)')
            .replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)')
            .replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
        } else {
          sanitized = sanitized
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(');
        }

        sanitized = sanitized
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/\^/g, '**');

        // Validate characters
        if (/[^0-9+\-*/().\s,MathPIEsincoztasqrtlgn*]/.test(sanitized)) {
          return 'Error';
        }

        // Evaluate using safe Function constructor
        const res = Function(`'use strict'; return (${sanitized});`)();
        if (res === Infinity || res === -Infinity) return 'Undefined';
        if (isNaN(res)) return 'Error';
        
        // Format precision
        return parseFloat(res.toFixed(10)).toString();
      } catch (err) {
        return 'Error';
      }
    }

    // Number clicks
    container.body.querySelectorAll('.calc-num').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = btn.dataset.num;
        if (justCalculated) {
          currentInput = num === '.' ? '0.' : num;
          expr = '';
          justCalculated = false;
        } else if (currentInput === '0' && num !== '.') {
          currentInput = num;
        } else {
          if (num === '.' && currentInput.includes('.')) return;
          currentInput += num;
        }
        updateUI();
      });
    });

    // Operator clicks
    container.body.querySelectorAll('.calc-op').forEach(btn => {
      btn.addEventListener('click', () => {
        const op = btn.dataset.action;
        justCalculated = false;
        if (op === '(' || op === ')') {
          if (currentInput !== '0' && currentInput !== '') {
            expr += currentInput + op;
            currentInput = '';
          } else {
            expr += op;
          }
        } else {
          expr += (currentInput !== '' ? currentInput : '0') + ` ${op} `;
          currentInput = '';
        }
        updateUI();
      });
    });

    // Scientific function clicks
    container.body.querySelectorAll('.calc-sci').forEach(btn => {
      btn.addEventListener('click', () => {
        const fn = btn.dataset.action;
        justCalculated = false;

        if (fn === 'pi') {
          currentInput = Math.PI.toFixed(6);
        } else if (fn === 'e') {
          currentInput = Math.E.toFixed(6);
        } else if (fn === 'pow2') {
          const val = parseFloat(currentInput) || 0;
          currentInput = Math.pow(val, 2).toString();
          activeToolState.lastSummary = `Calculated: (${val})² = ${currentInput}`;
        } else if (fn === 'pow') {
          expr += (currentInput || '0') + ' ^ ';
          currentInput = '';
        } else if (fn === 'sqrt') {
          expr += `sqrt(${currentInput || '0'})`;
          currentInput = '';
        } else if (['sin', 'cos', 'tan', 'log', 'ln'].includes(fn)) {
          expr += `${fn}(${currentInput || '0'})`;
          currentInput = '';
        }
        updateUI();
      });
    });

    // Function actions (clear, pm, equals)
    container.body.querySelectorAll('.calc-fn, .calc-equals').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.action;

        if (act === 'clear') {
          currentInput = '0';
          updateUI();
        } else if (act === 'pm') {
          if (currentInput && currentInput !== '0') {
            currentInput = currentInput.startsWith('-') ? currentInput.substring(1) : '-' + currentInput;
            updateUI();
          }
        } else if (act === 'equals') {
          const fullExpr = (expr + (currentInput || '')).trim();
          if (!fullExpr) return;

          const result = evaluateExpression(fullExpr);
          history.textContent = fullExpr + ' =';
          display.textContent = result;
          activeToolState.lastSummary = `Calculator: ${fullExpr} = ${result}`;
          currentInput = result;
          expr = '';
          justCalculated = true;
        }
      });
    });

    // DEG/RAD Toggle
    degRadBtn.addEventListener('click', () => {
      isDeg = !isDeg;
      degRadBtn.textContent = isDeg ? 'DEG' : 'RAD';
      degRadBtn.style.color = isDeg ? 'var(--accent)' : '#10b981';
    });

    // Scientific Toggle (Collapse/Expand 5th column)
    sciToggleBtn.addEventListener('click', () => {
      isSciOn = !isSciOn;
      sciToggleBtn.textContent = isSciOn ? '🔬 Scientific: ON' : '📱 Standard Mode';
      const sciBtns = container.body.querySelectorAll('.calc-sci');
      sciBtns.forEach(b => b.style.display = isSciOn ? 'flex' : 'none');
      const grid = container.body.querySelector('#calcKeypad');
      grid.style.gridTemplateColumns = isSciOn ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)';
    });

    // Clear All / AC
    clearHistoryBtn.addEventListener('click', () => {
      expr = '';
      currentInput = '0';
      updateUI();
    });

    // Keyboard support inside workbench
    const keyHandler = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key >= '0' && e.key <= '9') {
        const btn = container.body.querySelector(`.calc-num[data-num="${e.key}"]`);
        btn?.click();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        const btn = container.body.querySelector(`.calc-op[data-action="${e.key}"]`);
        btn?.click();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        container.body.querySelector('.calc-equals')?.click();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        container.body.querySelector('.calc-fn[data-action="clear"]')?.click();
      } else if (e.key === 'Backspace') {
        if (currentInput.length > 1) {
          currentInput = currentInput.slice(0, -1);
        } else {
          currentInput = '0';
        }
        updateUI();
      }
    };

    window.addEventListener('keydown', keyHandler);
    updateUI();
  }

  // 1. MATHEMATICS: Function Grapher
  function renderFunctionGrapher(container) {
    container.body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:700">📈 2D Cartesian Function Plotter</h3>
          <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">Interactive quadratic and polynomial explorer: $f(x) = ax^2 + bx + c$</p>
        </div>
        <div id="graphRoots" style="font-size:13px;font-weight:700;color:var(--accent);background:var(--input-bg);padding:6px 12px;border-radius:10px;border:1px solid var(--border)"></div>
      </div>
      <canvas id="wbMathCanvas" width="820" height="320" style="width:100%;height:260px;background:#ffffff;border-radius:14px;border:1px solid var(--border);display:block;margin:0 auto;box-shadow:inset 0 1px 4px rgba(0,0,0,0.04)"></canvas>
      <div class="tool-controls-card">
        <div class="tool-slider-row">
          <label>Leading Coefficient (a):</label>
          <input type="range" id="paramA" min="-4" max="4" step="0.25" value="1">
          <span class="tool-slider-val" id="valA">1.00</span>
        </div>
        <div class="tool-slider-row">
          <label>Linear Coefficient (b):</label>
          <input type="range" id="paramB" min="-8" max="8" step="0.5" value="0">
          <span class="tool-slider-val" id="valB">0.00</span>
        </div>
        <div class="tool-slider-row">
          <label>Constant Term (c):</label>
          <input type="range" id="paramC" min="-10" max="10" step="0.5" value="-4">
          <span class="tool-slider-val" id="valC">-4.00</span>
        </div>
      </div>
    `;

    const canvas = container.body.querySelector('#wbMathCanvas');
    const ctx = canvas.getContext('2d');
    const sliderA = container.body.querySelector('#paramA');
    const sliderB = container.body.querySelector('#paramB');
    const sliderC = container.body.querySelector('#paramC');
    const valA = container.body.querySelector('#valA');
    const valB = container.body.querySelector('#valB');
    const valC = container.body.querySelector('#valC');
    const rootsEl = container.body.querySelector('#graphRoots');

    function draw() {
      const a = parseFloat(sliderA.value);
      const b = parseFloat(sliderB.value);
      const c = parseFloat(sliderC.value);

      valA.textContent = a.toFixed(2);
      valB.textContent = b.toFixed(2);
      valC.textContent = c.toFixed(2);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const originX = w / 2;
      const originY = h / 2;
      const scale = 24; // pixels per grid unit

      // Grid Lines
      ctx.strokeStyle = '#f0f0f2';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += scale) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += scale) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Coordinate Axes
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(w, originY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, h); ctx.stroke();

      // Plot f(x)
      ctx.strokeStyle = '#007aff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let first = true;

      for (let px = 0; px < w; px += 2) {
        const x = (px - originX) / scale;
        const y = a * x * x + b * x + c;
        const py = originY - y * scale;

        if (py >= -100 && py <= h + 100) {
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
        } else {
          first = true;
        }
      }
      ctx.stroke();

      // Roots & Discriminant
      const delta = b * b - 4 * a * c;
      if (a === 0) {
        const root = -c / b;
        rootsEl.textContent = isFinite(root) ? `Linear Root: x = ${root.toFixed(2)}` : 'Constant Line';
        activeToolState.lastSummary = `Math Analysis: Function f(x) = ${b}x + ${c}, Root: x = ${root.toFixed(2)}`;
      } else if (delta > 0) {
        const x1 = (-b + Math.sqrt(delta)) / (2 * a);
        const x2 = (-b - Math.sqrt(delta)) / (2 * a);
        rootsEl.textContent = `Δ = ${delta.toFixed(1)} > 0 | Roots: x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)}`;
        activeToolState.lastSummary = `Math Analysis: Quadratic f(x) = ${a}x² + ${b}x + ${c}, Discriminant Δ = ${delta.toFixed(1)}, Roots: x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)}`;
      } else if (delta === 0) {
        const x1 = -b / (2 * a);
        rootsEl.textContent = `Δ = 0 | Double Root: x = ${x1.toFixed(2)}`;
        activeToolState.lastSummary = `Math Analysis: Quadratic f(x) = ${a}x² + ${b}x + ${c}, Double root x = ${x1.toFixed(2)}`;
      } else {
        rootsEl.textContent = `Δ = ${delta.toFixed(1)} < 0 | No Real Roots`;
        activeToolState.lastSummary = `Math Analysis: Quadratic f(x) = ${a}x² + ${b}x + ${c}, Discriminant Δ = ${delta.toFixed(1)} < 0 (complex roots).`;
      }
    }

    sliderA.addEventListener('input', draw);
    sliderB.addEventListener('input', draw);
    sliderC.addEventListener('input', draw);
    draw();
  }

  // 2. MATHEMATICS: Step-by-Step Equation Solver (REAL PARSER)
  function renderEquationSolver(container) {
    container.body.innerHTML = `
      <div style="margin-bottom:14px">
        <h3 style="margin:0;font-size:16px;font-weight:700">🔢 Step-by-Step Equation Solver</h3>
        <p style="margin:2px 0 10px;font-size:12px;color:var(--muted)">Solves linear and quadratic equations with full algebraic proofs.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input type="text" id="eqInput" value="2x^2 + 5x - 3 = 0"
                 placeholder="e.g. 2x^2 + 5x - 3 = 0 or 4x + 8 = 24"
                 style="flex:1;min-width:200px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--text);font-family:inherit;font-size:14px">
          <button id="solveEqBtn" class="btn-primary" style="padding:10px 20px;border-radius:10px">Solve Equation</button>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="eq-preset wb-action-btn" data-eq="2x^2 + 5x - 3 = 0">2x²+5x-3=0</button>
          <button class="eq-preset wb-action-btn" data-eq="x^2 - 4 = 0">x²-4=0</button>
          <button class="eq-preset wb-action-btn" data-eq="3x + 9 = 24">3x+9=24</button>
          <button class="eq-preset wb-action-btn" data-eq="x^2 + 6x + 9 = 0">x²+6x+9=0</button>
          <button class="eq-preset wb-action-btn" data-eq="5x - 15 = 0">5x-15=0</button>
        </div>
      </div>
      <div id="eqSteps" class="tool-controls-card" style="line-height:1.7;font-size:13.5px"></div>
    `;

    const input = container.body.querySelector('#eqInput');
    const btn = container.body.querySelector('#solveEqBtn');
    const steps = container.body.querySelector('#eqSteps');

    // Preset buttons
    container.body.querySelectorAll('.eq-preset').forEach(p => {
      p.addEventListener('click', () => { input.value = p.dataset.eq; solve(); });
    });

    function parseEquation(eq) {
      // Normalize: move everything to one side (left - right = 0)
      let expr = eq.replace(/\s+/g, '').replace(/²/g, '^2');
      let parts = expr.split('=');
      let left = parts[0] || '0';
      let right = parts[1] || '0';

      function extractCoeffs(side) {
        let a = 0, b = 0, c = 0;
        if (!side || side.trim() === '') return { a, b, c };

        // Normalize subtraction to addition of negative numbers for safe splitting
        let s = side.replace(/-/g, '+-');
        if (s.startsWith('+')) s = s.substring(1);
        const terms = s.split('+').filter(t => t.length > 0);

        for (const term of terms) {
          if (term.includes('x^2') || term.includes('x²')) {
            const coeffStr = term.replace(/x\^2|x²/g, '');
            if (coeffStr === '' || coeffStr === '+') a += 1;
            else if (coeffStr === '-') a -= 1;
            else a += parseFloat(coeffStr) || 0;
          } else if (term.includes('x')) {
            const coeffStr = term.replace(/x/g, '');
            if (coeffStr === '' || coeffStr === '+') b += 1;
            else if (coeffStr === '-') b -= 1;
            else b += parseFloat(coeffStr) || 0;
          } else {
            c += parseFloat(term) || 0;
          }
        }
        return { a, b, c };
      }

      const L = extractCoeffs(left);
      const R = extractCoeffs(right);
      return { a: L.a - R.a, b: L.b - R.b, c: L.c - R.c };
    }

    function solve() {
      const eq = input.value.trim();
      if (!eq) { steps.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px">Enter an equation to solve.</div>'; return; }

      try {
        const { a, b, c } = parseEquation(eq);

        if (a !== 0) {
          // Quadratic
          const delta = b * b - 4 * a * c;
          let solutionHTML = '';
          let summaryRoots = '';

          if (delta > 0) {
            const x1 = (-b + Math.sqrt(delta)) / (2 * a);
            const x2 = (-b - Math.sqrt(delta)) / (2 * a);
            solutionHTML = `
              <strong>Step 4 (Two distinct real roots):</strong><br>
              • x₁ = (-${b} + √${delta.toFixed(2)}) / (2·${a}) = <strong style="color:var(--success)">${x1.toFixed(4)}</strong><br>
              • x₂ = (-${b} - √${delta.toFixed(2)}) / (2·${a}) = <strong style="color:var(--success)">${x2.toFixed(4)}</strong><br>
              <div style="margin-top:10px;padding:10px 14px;background:rgba(52,199,89,0.1);border-radius:10px;color:var(--success);font-weight:700;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">✅</span> Roots: x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}
              </div>`;
            summaryRoots = `x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`;
          } else if (delta === 0) {
            const x1 = -b / (2 * a);
            solutionHTML = `
              <strong>Step 4 (One repeated root):</strong><br>
              • x = -${b} / (2·${a}) = <strong style="color:var(--success)">${x1.toFixed(4)}</strong><br>
              <div style="margin-top:10px;padding:10px 14px;background:rgba(52,199,89,0.1);border-radius:10px;color:var(--success);font-weight:700;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">✅</span> Double Root: x = ${x1.toFixed(4)}
              </div>`;
            summaryRoots = `x = ${x1.toFixed(4)} (double root)`;
          } else {
            const realPart = (-b / (2 * a)).toFixed(4);
            const imagPart = (Math.sqrt(-delta) / (2 * a)).toFixed(4);
            solutionHTML = `
              <strong>Step 4 (Complex conjugate roots):</strong><br>
              • x₁ = ${realPart} + ${imagPart}i<br>
              • x₂ = ${realPart} - ${imagPart}i<br>
              <div style="margin-top:10px;padding:10px 14px;background:rgba(255,149,0,0.1);border-radius:10px;color:var(--warning);font-weight:700;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">⚠️</span> No real roots (Δ < 0). Complex roots: ${realPart} ± ${imagPart}i
              </div>`;
            summaryRoots = `Complex: ${realPart} ± ${imagPart}i`;
          }

          steps.innerHTML = `
            <strong style="color:var(--accent);font-size:15px">Quadratic Equation: ${a}x² + ${b}x + ${c} = 0</strong><br><br>
            <strong>Step 1 (Identify coefficients):</strong> a = ${a}, b = ${b}, c = ${c}<br>
            <strong>Step 2 (Discriminant):</strong> Δ = b² − 4ac = (${b})² − 4(${a})(${c}) = ${(b*b).toFixed(2)} − ${(4*a*c).toFixed(2)} = <strong>${delta.toFixed(2)}</strong><br>
            <strong>Step 3 (Quadratic Formula):</strong> x = (−b ± √Δ) / 2a<br>
            ${solutionHTML}
          `;
          activeToolState.lastSummary = `Solved: ${eq} → Coefficients a=${a}, b=${b}, c=${c}. Δ=${delta.toFixed(2)}. ${summaryRoots}.`;

        } else if (b !== 0) {
          // Linear: bx + c = 0
          const x = -c / b;
          steps.innerHTML = `
            <strong style="color:var(--accent);font-size:15px">Linear Equation: ${b}x + ${c} = 0</strong><br><br>
            <strong>Step 1 (Isolate x):</strong> ${b}x = ${(-c).toFixed(4)}<br>
            <strong>Step 2 (Divide):</strong> x = ${(-c).toFixed(4)} / ${b} = <strong style="color:var(--success)">${x.toFixed(4)}</strong><br>
            <div style="margin-top:10px;padding:10px 14px;background:rgba(52,199,89,0.1);border-radius:10px;color:var(--success);font-weight:700;display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">✅</span> Solution: x = ${x.toFixed(4)}
            </div>
          `;
          activeToolState.lastSummary = `Solved linear: ${eq} → x = ${x.toFixed(4)}.`;
        } else {
          steps.innerHTML = `
            <div style="padding:16px;text-align:center;color:var(--error)">
              <strong>⚠️ No variable found.</strong> Make sure your equation contains "x".
            </div>`;
        }
      } catch (err) {
        steps.innerHTML = `<div style="color:var(--error);padding:12px">Could not parse equation. Try format: "2x^2 + 5x - 3 = 0" or "4x + 8 = 24"</div>`;
      }
    }

    btn.addEventListener('click', solve);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') solve(); });
    solve();
  }

  // 3. MATHEMATICS: Geometry Calculator
  function renderGeometryCalc(container) {
    container.body.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <button class="wb-action-btn geom-tab active" data-shape="circle">⭕ Circle</button>
        <button class="wb-action-btn geom-tab" data-shape="rectangle">🟦 Rectangle</button>
        <button class="wb-action-btn geom-tab" data-shape="triangle">🔺 Triangle</button>
        <button class="wb-action-btn geom-tab" data-shape="cylinder">🥫 3D Cylinder</button>
      </div>
      <div id="geomControls" class="tool-controls-card"></div>
      <div id="geomResult" style="margin-top:14px;padding:14px;background:rgba(0,122,255,0.08);border-radius:12px;font-weight:700;color:var(--accent);text-align:center;font-size:14px"></div>
    `;

    const controls = container.body.querySelector('#geomControls');
    const result = container.body.querySelector('#geomResult');

    function updateShape(shape) {
      if (shape === 'circle') {
        controls.innerHTML = `
          <div class="tool-slider-row"><label>Radius (r):</label><input type="range" id="geomR" min="1" max="50" value="6"><span class="tool-slider-val" id="valGeomR">6 cm</span></div>
        `;
        const rIn = controls.querySelector('#geomR');
        const calc = () => {
          const r = parseFloat(rIn.value);
          controls.querySelector('#valGeomR').textContent = r + ' cm';
          const area = Math.PI * r * r;
          const perim = 2 * Math.PI * r;
          result.innerHTML = `Area: A = ${area.toFixed(2)} cm² | Circumference: C = ${perim.toFixed(2)} cm`;
          activeToolState.lastSummary = `Circle (r=${r}cm): Area = ${area.toFixed(2)} cm², Circumference = ${perim.toFixed(2)} cm.`;
        };
        rIn.addEventListener('input', calc);
        calc();
      } else if (shape === 'rectangle') {
        controls.innerHTML = `
          <div class="tool-slider-row"><label>Length (a):</label><input type="range" id="geomA" min="1" max="50" value="10"><span class="tool-slider-val" id="valGeomA">10 cm</span></div>
          <div class="tool-slider-row"><label>Width (b):</label><input type="range" id="geomB" min="1" max="50" value="5"><span class="tool-slider-val" id="valGeomB">5 cm</span></div>
        `;
        const aIn = controls.querySelector('#geomA');
        const bIn = controls.querySelector('#geomB');
        const calc = () => {
          const a = parseFloat(aIn.value);
          const b = parseFloat(bIn.value);
          controls.querySelector('#valGeomA').textContent = a + ' cm';
          controls.querySelector('#valGeomB').textContent = b + ' cm';
          result.innerHTML = `Area: A = ${(a * b).toFixed(1)} cm² | Perimeter: P = ${(2 * (a + b)).toFixed(1)} cm | Diagonal: d = ${(Math.hypot(a, b)).toFixed(2)} cm`;
          activeToolState.lastSummary = `Rectangle (${a}x${b}cm): Area = ${a * b} cm², Perimeter = ${2 * (a + b)} cm.`;
        };
        aIn.addEventListener('input', calc);
        bIn.addEventListener('input', calc);
        calc();
      } else if (shape === 'cylinder') {
        controls.innerHTML = `
          <div class="tool-slider-row"><label>Base Radius (r):</label><input type="range" id="geomCr" min="1" max="30" value="4"><span class="tool-slider-val" id="valCr">4 cm</span></div>
          <div class="tool-slider-row"><label>Height (h):</label><input type="range" id="geomCh" min="1" max="50" value="12"><span class="tool-slider-val" id="valCh">12 cm</span></div>
        `;
        const rIn = controls.querySelector('#geomCr');
        const hIn = controls.querySelector('#geomCh');
        const calc = () => {
          const r = parseFloat(rIn.value);
          const h = parseFloat(hIn.value);
          controls.querySelector('#valCr').textContent = r + ' cm';
          controls.querySelector('#valCh').textContent = h + ' cm';
          const vol = Math.PI * r * r * h;
          const sa = 2 * Math.PI * r * (r + h);
          result.innerHTML = `Volume: V = ${vol.toFixed(2)} cm³ | Total Surface Area: S = ${sa.toFixed(2)} cm²`;
          activeToolState.lastSummary = `Cylinder (r=${r}cm, h=${h}cm): Volume = ${vol.toFixed(2)} cm³, Surface Area = ${sa.toFixed(2)} cm².`;
        };
        rIn.addEventListener('input', calc);
        hIn.addEventListener('input', calc);
        calc();
      } else {
        controls.innerHTML = `
          <div class="tool-slider-row"><label>Base (b):</label><input type="range" id="geomTb" min="1" max="50" value="8"><span class="tool-slider-val" id="valTb">8 cm</span></div>
          <div class="tool-slider-row"><label>Height (h):</label><input type="range" id="geomTh" min="1" max="50" value="6"><span class="tool-slider-val" id="valTh">6 cm</span></div>
        `;
        const bIn = controls.querySelector('#geomTb');
        const hIn = controls.querySelector('#geomTh');
        const calc = () => {
          const b = parseFloat(bIn.value);
          const h = parseFloat(hIn.value);
          controls.querySelector('#valTb').textContent = b + ' cm';
          controls.querySelector('#valTh').textContent = h + ' cm';
          result.innerHTML = `Area: A = ${(0.5 * b * h).toFixed(1)} cm²`;
          activeToolState.lastSummary = `Triangle (b=${b}cm, h=${h}cm): Area = ${0.5 * b * h} cm².`;
        };
        bIn.addEventListener('input', calc);
        hIn.addEventListener('input', calc);
        calc();
      }
    }

    container.body.querySelectorAll('.geom-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        container.body.querySelectorAll('.geom-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateShape(btn.dataset.shape);
      });
    });

    updateShape('circle');
  }

  // 4. PHYSICS: Kinematics
  function renderKinematicsSimulator(container) {
    container.body.innerHTML = `
      <canvas id="wbPhysCanvas" width="820" height="240" style="width:100%;height:220px;background:#ffffff;border-radius:14px;border:1px solid var(--border);display:block;"></canvas>
      <div class="tool-controls-card">
        <div class="tool-slider-row"><label>Initial Velocity (v₀):</label><input type="range" id="physV0" min="0" max="60" value="15"><span class="tool-slider-val" id="valV0">15 m/s</span></div>
        <div class="tool-slider-row"><label>Acceleration (a):</label><input type="range" id="physA" min="-10" max="10" step="0.5" value="2"><span class="tool-slider-val" id="valA">2.0 m/s²</span></div>
        <div class="tool-slider-row"><label>Time (t):</label><input type="range" id="physT" min="1" max="25" value="6"><span class="tool-slider-val" id="valT">6 s</span></div>
        <div id="physResult" style="margin-top:10px;padding:12px;background:rgba(0,122,255,0.08);border-radius:10px;font-weight:700;color:var(--accent);text-align:center"></div>
      </div>
    `;

    const canvas = container.body.querySelector('#wbPhysCanvas');
    const ctx = canvas.getContext('2d');
    const v0In = container.body.querySelector('#physV0');
    const aIn = container.body.querySelector('#physA');
    const tIn = container.body.querySelector('#physT');
    const valV0 = container.body.querySelector('#valV0');
    const valA = container.body.querySelector('#valA');
    const valT = container.body.querySelector('#valT');
    const result = container.body.querySelector('#physResult');

    function draw() {
      const v0 = parseFloat(v0In.value);
      const a = parseFloat(aIn.value);
      const t = parseFloat(tIn.value);

      valV0.textContent = v0 + ' m/s';
      valA.textContent = a.toFixed(1) + ' m/s²';
      valT.textContent = t + ' s';

      const finalV = v0 + a * t;
      const distance = v0 * t + 0.5 * a * t * t;

      result.innerHTML = `Final Velocity: v = ${finalV.toFixed(1)} m/s (${(finalV * 3.6).toFixed(0)} km/h) | Distance: d = ${distance.toFixed(1)} m`;
      activeToolState.lastSummary = `Kinematics Simulation: v₀=${v0} m/s, a=${a} m/s², t=${t} s -> Final velocity v=${finalV.toFixed(1)} m/s, Distance traveled d=${distance.toFixed(1)} m.`;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#f0f0f2';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let px = 0; px < w; px += 4) {
        const timeAtX = (px / w) * t;
        const speedAtX = v0 + a * timeAtX;
        const py = h - (speedAtX / 100) * h;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    v0In.addEventListener('input', draw);
    aIn.addEventListener('input', draw);
    tIn.addEventListener('input', draw);
    draw();
  }

  // 5. PHYSICS: Ohm's Law
  function renderOhmsLawSimulator(container) {
    container.body.innerHTML = `
      <div style="text-align:center;padding:16px 0">
        <span id="wbBulb" style="font-size:72px;transition:all 0.2s;display:inline-block">💡</span>
      </div>
      <div class="tool-controls-card">
        <div class="tool-slider-row"><label>Voltage (V):</label><input type="range" id="wbVolt" min="1" max="240" value="24"><span class="tool-slider-val" id="wbValVolt">24 V</span></div>
        <div class="tool-slider-row"><label>Resistance (R):</label><input type="range" id="wbRes" min="1" max="100" value="8"><span class="tool-slider-val" id="wbValRes">8 Ω</span></div>
        <div id="wbOhmResult" style="margin-top:12px;padding:12px;background:var(--panel);border-radius:10px;font-weight:700;color:var(--accent);text-align:center"></div>
      </div>
    `;

    const bulb = container.body.querySelector('#wbBulb');
    const vIn = container.body.querySelector('#wbVolt');
    const rIn = container.body.querySelector('#wbRes');
    const valV = container.body.querySelector('#wbValVolt');
    const valR = container.body.querySelector('#wbValRes');
    const result = container.body.querySelector('#wbOhmResult');

    function calc() {
      const v = parseFloat(vIn.value);
      const r = parseFloat(rIn.value);
      valV.textContent = v + ' V';
      valR.textContent = r + ' Ω';

      const current = v / r;
      const power = v * current;

      result.innerHTML = `Current: I = ${current.toFixed(2)} A | Electrical Power: P = ${power.toFixed(1)} W`;
      activeToolState.lastSummary = `Ohm's Law: Voltage V = ${v}V, Resistance R = ${r}Ω -> Current I = ${current.toFixed(2)}A, Power P = ${power.toFixed(1)}W.`;

      const brightness = Math.min(3, power / 50);
      bulb.style.filter = `drop-shadow(0 0 ${brightness * 16}px #ffb703) brightness(${1 + brightness * 0.4})`;
    }

    vIn.addEventListener('input', calc);
    rIn.addEventListener('input', calc);
    calc();
  }

  // 6. PHYSICS: Energy
  function renderEnergySimulator(container) {
    container.body.innerHTML = `
      <div class="tool-controls-card">
        <div class="tool-slider-row"><label>Mass (m):</label><input type="range" id="wbEnM" min="1" max="100" value="10"><span class="tool-slider-val" id="wbValM">10 kg</span></div>
        <div class="tool-slider-row"><label>Height (h):</label><input type="range" id="wbEnH" min="0" max="100" value="15"><span class="tool-slider-val" id="wbValH">15 m</span></div>
        <div class="tool-slider-row"><label>Velocity (v):</label><input type="range" id="wbEnV" min="0" max="50" value="12"><span class="tool-slider-val" id="wbValV">12 m/s</span></div>
        <div id="wbEnergyResult" style="margin-top:12px;padding:14px;background:var(--panel);border-radius:10px;line-height:1.7;font-size:13.5px"></div>
      </div>
    `;

    const mIn = container.body.querySelector('#wbEnM');
    const hIn = container.body.querySelector('#wbEnH');
    const vIn = container.body.querySelector('#wbEnV');
    const valM = container.body.querySelector('#wbValM');
    const valH = container.body.querySelector('#wbValH');
    const valV = container.body.querySelector('#wbValV');
    const result = container.body.querySelector('#wbEnergyResult');

    function update() {
      const m = parseFloat(mIn.value);
      const h = parseFloat(hIn.value);
      const v = parseFloat(vIn.value);
      const g = 9.81;

      valM.textContent = m + ' kg';
      valH.textContent = h + ' m';
      valV.textContent = v + ' m/s';

      const ep = m * g * h;
      const ek = 0.5 * m * v * v;
      const etot = ep + ek;

      result.innerHTML = `
        <div style="display:flex;justify-content:space-between;color:#0284c7"><span>Potential Energy ($E_p = mgh$):</span><strong>${ep.toFixed(1)} J</strong></div>
        <div style="display:flex;justify-content:space-between;color:#16a34a;margin-top:4px"><span>Kinetic Energy ($E_k = \\frac{1}{2}mv^2$):</span><strong>${ek.toFixed(1)} J</strong></div>
        <div style="display:flex;justify-content:space-between;color:var(--accent);margin-top:8px;font-weight:700;border-top:1px solid var(--border);padding-top:8px"><span>Total Mechanical Energy:</span><span>${etot.toFixed(1)} J</span></div>
      `;
      activeToolState.lastSummary = `Mechanical Energy (m=${m}kg, h=${h}m, v=${v}m/s): Potential Ep = ${ep.toFixed(1)}J, Kinetic Ek = ${ek.toFixed(1)}J, Total = ${etot.toFixed(1)}J.`;
    }

    mIn.addEventListener('input', update);
    hIn.addEventListener('input', update);
    vIn.addEventListener('input', update);
    update();
  }

  // 7. CHEMISTRY: Periodic Table
  function renderPeriodicTable(container) {
    const ELEMENTS = [
      { num: 1, sym: 'H', name: 'Hydrogen', mass: 1.008, group: 'Nonmetal' },
      { num: 2, sym: 'He', name: 'Helium', mass: 4.003, group: 'Noble Gas' },
      { num: 3, sym: 'Li', name: 'Lithium', mass: 6.941, group: 'Alkali Metal' },
      { num: 4, sym: 'Be', name: 'Beryllium', mass: 9.012, group: 'Alkaline Earth' },
      { num: 5, sym: 'B', name: 'Boron', mass: 10.81, group: 'Metalloid' },
      { num: 6, sym: 'C', name: 'Carbon', mass: 12.011, group: 'Nonmetal' },
      { num: 7, sym: 'N', name: 'Nitrogen', mass: 14.007, group: 'Nonmetal' },
      { num: 8, sym: 'O', name: 'Oxygen', mass: 15.999, group: 'Nonmetal' },
      { num: 9, sym: 'F', name: 'Fluorine', mass: 18.998, group: 'Halogen' },
      { num: 10, sym: 'Ne', name: 'Neon', mass: 20.180, group: 'Noble Gas' },
      { num: 11, sym: 'Na', name: 'Sodium', mass: 22.990, group: 'Alkali Metal' },
      { num: 12, sym: 'Mg', name: 'Magnesium', mass: 24.305, group: 'Alkaline Earth' },
      { num: 13, sym: 'Al', name: 'Aluminum', mass: 26.982, group: 'Post-Transition' },
      { num: 14, sym: 'Si', name: 'Silicon', mass: 28.085, group: 'Metalloid' },
      { num: 15, sym: 'P', name: 'Phosphorus', mass: 30.974, group: 'Nonmetal' },
      { num: 16, sym: 'S', name: 'Sulfur', mass: 32.06, group: 'Nonmetal' },
      { num: 17, sym: 'Cl', name: 'Chlorine', mass: 35.45, group: 'Halogen' },
      { num: 18, sym: 'Ar', name: 'Argon', mass: 39.948, group: 'Noble Gas' },
      { num: 19, sym: 'K', name: 'Potassium', mass: 39.098, group: 'Alkali Metal' },
      { num: 20, sym: 'Ca', name: 'Calcium', mass: 40.078, group: 'Alkaline Earth' },
      { num: 26, sym: 'Fe', name: 'Iron', mass: 55.845, group: 'Transition Metal' },
      { num: 29, sym: 'Cu', name: 'Copper', mass: 63.546, group: 'Transition Metal' },
      { num: 30, sym: 'Zn', name: 'Zinc', mass: 65.38, group: 'Transition Metal' },
      { num: 47, sym: 'Ag', name: 'Silver', mass: 107.87, group: 'Transition Metal' },
      { num: 79, sym: 'Au', name: 'Gold', mass: 196.97, group: 'Transition Metal' }
    ];

    container.body.innerHTML = `
      <input type="text" id="wbPtableSearch" placeholder="Search element by symbol, name, or atomic number..."
             style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:12px;background:var(--input-bg);color:var(--text);font-family:inherit;font-size:13.5px">
      <div class="ptable-grid" id="wbPtableGrid"></div>
      <div id="wbElementDetail" style="margin-top:14px;padding:14px;background:var(--input-bg);border-radius:12px;display:none"></div>
    `;

    const search = container.body.querySelector('#wbPtableSearch');
    const grid = container.body.querySelector('#wbPtableGrid');
    const detail = container.body.querySelector('#wbElementDetail');

    function renderElements(query = '') {
      const q = query.toLowerCase().trim();
      const filtered = ELEMENTS.filter(e => e.sym.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || String(e.num).includes(q));

      grid.innerHTML = filtered.map(e => `
        <div class="ptable-card" data-sym="${e.sym}">
          <div class="ptable-num">${e.num}</div>
          <div class="ptable-sym">${e.sym}</div>
          <div class="ptable-name">${e.name}</div>
        </div>
      `).join('');

      grid.querySelectorAll('.ptable-card').forEach(card => {
        card.addEventListener('click', () => {
          const el = ELEMENTS.find(x => x.sym === card.dataset.sym);
          if (el) {
            detail.style.display = 'block';
            detail.innerHTML = `
              <div style="display:flex;align-items:center;gap:16px">
                <div style="font-size:36px;font-weight:800;color:var(--accent);padding:10px 16px;background:var(--panel);border-radius:12px;border:1px solid var(--border)">${el.sym}</div>
                <div>
                  <h4 style="margin:0;font-size:17px">${el.name} (Atomic Number: ${el.num})</h4>
                  <div style="font-size:13px;color:var(--muted);margin-top:3px">Standard Atomic Weight: <strong>${el.mass} g/mol</strong> | Group Category: <strong>${el.group}</strong></div>
                </div>
              </div>
            `;
            activeToolState.lastSummary = `Element Analysis: ${el.name} (${el.sym}, Z=${el.num}), Molar mass = ${el.mass} g/mol, Group = ${el.group}.`;
          }
        });
      });
    }

    search.addEventListener('input', () => renderElements(search.value));
    renderElements();
  }

  // 8. CHEMISTRY: Molar Mass Calculator (REAL PARSER)
  function renderMolarMassCalc(container) {
    const ATOMIC_MASS = {
      H:1.008,He:4.003,Li:6.941,Be:9.012,B:10.81,C:12.011,N:14.007,O:15.999,F:18.998,Ne:20.180,
      Na:22.990,Mg:24.305,Al:26.982,Si:28.085,P:30.974,S:32.060,Cl:35.450,Ar:39.948,K:39.098,
      Ca:40.078,Ti:47.867,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.380,
      Br:79.904,Ag:107.87,I:126.90,Ba:137.33,Pt:195.08,Au:196.97,Hg:200.59,Pb:207.2,U:238.03
    };

    container.body.innerHTML = `
      <div style="margin-bottom:14px">
        <h3 style="margin:0;font-size:16px;font-weight:700">⚖️ Molar Mass Calculator</h3>
        <p style="margin:2px 0 10px;font-size:12px;color:var(--muted)">Enter any chemical formula to calculate molar mass & composition.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input type="text" id="wbFormulaInput" value="H2SO4" placeholder="e.g. H2SO4, C6H12O6, NaCl, CaCO3"
                 style="flex:1;min-width:180px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--text);font-family:inherit;font-size:14px">
          <button id="wbCalcMolarBtn" class="btn-primary" style="padding:10px 20px;border-radius:10px">Calculate</button>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="mm-preset wb-action-btn" data-f="H2O">H₂O</button>
          <button class="mm-preset wb-action-btn" data-f="H2SO4">H₂SO₄</button>
          <button class="mm-preset wb-action-btn" data-f="C6H12O6">C₆H₁₂O₆</button>
          <button class="mm-preset wb-action-btn" data-f="NaCl">NaCl</button>
          <button class="mm-preset wb-action-btn" data-f="CaCO3">CaCO₃</button>
          <button class="mm-preset wb-action-btn" data-f="Fe2O3">Fe₂O₃</button>
        </div>
      </div>
      <div id="wbMolarResult" class="tool-controls-card" style="line-height:1.7;font-size:13.5px"></div>
    `;

    const input = container.body.querySelector('#wbFormulaInput');
    const btn = container.body.querySelector('#wbCalcMolarBtn');
    const result = container.body.querySelector('#wbMolarResult');

    container.body.querySelectorAll('.mm-preset').forEach(p => {
      p.addEventListener('click', () => { input.value = p.dataset.f; calculate(); });
    });

    function parseFormula(formula) {
      // Parse chemical formula into element counts: H2SO4 -> {H:2, S:1, O:4}
      const counts = {};
      const re = /([A-Z][a-z]?)(\d*)/g;
      let m;
      while ((m = re.exec(formula)) !== null) {
        if (!m[1]) continue;
        const el = m[1];
        const n = m[2] ? parseInt(m[2]) : 1;
        counts[el] = (counts[el] || 0) + n;
      }
      return counts;
    }

    function calculate() {
      const formula = input.value.trim();
      if (!formula) { result.innerHTML = '<div style="color:var(--muted);text-align:center;padding:16px">Enter a chemical formula.</div>'; return; }

      const counts = parseFormula(formula);
      const elements = Object.keys(counts);

      if (elements.length === 0) {
        result.innerHTML = '<div style="color:var(--error);padding:12px">Could not parse formula. Use standard notation: H2SO4, NaCl, etc.</div>';
        return;
      }

      let totalMass = 0;
      const breakdown = [];
      const unknownEls = [];

      elements.forEach(el => {
        const mass = ATOMIC_MASS[el];
        if (mass) {
          const contrib = mass * counts[el];
          totalMass += contrib;
          breakdown.push({ el, count: counts[el], mass, contrib });
        } else {
          unknownEls.push(el);
        }
      });

      if (unknownEls.length > 0) {
        result.innerHTML = `<div style="color:var(--warning);padding:12px">⚠️ Unknown element(s): ${unknownEls.join(', ')}. Check your formula.</div>`;
        return;
      }

      // Build bar chart
      const colors = ['#007aff','#34c759','#ff9500','#ff3b30','#af52de','#5ac8fa','#ff2d55','#ffcc00'];
      const bars = breakdown.map((b, i) => {
        const pct = (b.contrib / totalMass * 100);
        return `<div style="display:flex;align-items:center;gap:10px;margin-top:6px">
          <div style="width:32px;font-weight:800;color:${colors[i%colors.length]};font-size:14px;text-align:right">${b.el}</div>
          <div style="flex:1;background:var(--border);border-radius:6px;height:22px;overflow:hidden;position:relative">
            <div style="height:100%;width:${pct}%;background:${colors[i%colors.length]};border-radius:6px;transition:width 0.4s ease"></div>
          </div>
          <div style="min-width:120px;font-size:12px;font-weight:600">${b.count} × ${b.mass} = ${b.contrib.toFixed(3)} g/mol <span style="color:var(--muted)">(${pct.toFixed(1)}%)</span></div>
        </div>`;
      }).join('');

      result.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <strong style="color:var(--accent);font-size:17px">Molar Mass of ${formula}</strong>
          <span style="font-size:22px;font-weight:800;color:var(--accent);background:var(--panel);padding:6px 14px;border-radius:10px;border:1px solid var(--border)">${totalMass.toFixed(3)} g/mol</span>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Elemental Composition</div>
        ${bars}
      `;
      activeToolState.lastSummary = `Chemistry: ${formula}, Molar mass = ${totalMass.toFixed(3)} g/mol. ${breakdown.map(b=>`${b.el}: ${(b.contrib/totalMass*100).toFixed(1)}%`).join(', ')}.`;
    }

    btn.addEventListener('click', calculate);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') calculate(); });
    calculate();
  }

  // 9. CHEMISTRY: Equation Balancer
  function renderEquationBalancer(container) {
    container.body.innerHTML = `
      <div style="margin-bottom:14px">
        <label style="font-size:13px;font-weight:600;color:var(--text)">Select reaction preset or balance custom reaction:</label>
        <select id="wbReactionSel" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);margin-top:6px;font-family:inherit">
          <option value="h2_o2">H₂ + O₂ → H₂O (Formation of Water)</option>
          <option value="ch4_o2">CH₄ + O₂ → CO₂ + H₂O (Methane Combustion)</option>
          <option value="n2_h2">N₂ + H₂ → NH₃ (Haber-Bosch Ammonia Synthesis)</option>
          <option value="fe_o2">Fe + O₂ → Fe₂O₃ (Iron Rusting / Oxidation)</option>
        </select>
      </div>
      <div id="wbBalancedOut" class="tool-controls-card" style="line-height:1.7;font-size:14px"></div>
    `;

    const sel = container.body.querySelector('#wbReactionSel');
    const out = container.body.querySelector('#wbBalancedOut');

    function update() {
      const val = sel.value;
      if (val === 'h2_o2') {
        out.innerHTML = `<strong>Balanced Equation:</strong><br><span style="font-size:18px;color:var(--accent);font-weight:800">2 H₂ + O₂ → 2 H₂O</span><br><div style="font-size:12.5px;color:var(--muted);margin-top:4px">Stoichiometry: 2 moles of Hydrogen gas react with 1 mole of Oxygen gas to produce 2 moles of Water vapor.</div>`;
        activeToolState.lastSummary = `Balanced reaction: 2 H₂ + O₂ → 2 H₂O (Formation of water).`;
      } else if (val === 'ch4_o2') {
        out.innerHTML = `<strong>Balanced Equation:</strong><br><span style="font-size:18px;color:var(--accent);font-weight:800">CH₄ + 2 O₂ → CO₂ + 2 H₂O</span><br><div style="font-size:12.5px;color:var(--muted);margin-top:4px">Complete hydrocarbon combustion releasing heat energy.</div>`;
        activeToolState.lastSummary = `Balanced reaction: CH₄ + 2 O₂ → CO₂ + 2 H₂O (Methane combustion).`;
      } else if (val === 'n2_h2') {
        out.innerHTML = `<strong>Balanced Equation:</strong><br><span style="font-size:18px;color:var(--accent);font-weight:800">N₂ + 3 H₂ → 2 NH₃</span><br><div style="font-size:12.5px;color:var(--muted);margin-top:4px">Industrial synthesis under high temperature and iron catalyst.</div>`;
        activeToolState.lastSummary = `Balanced reaction: N₂ + 3 H₂ → 2 NH₃ (Ammonia synthesis).`;
      } else {
        out.innerHTML = `<strong>Balanced Equation:</strong><br><span style="font-size:18px;color:var(--accent);font-weight:800">4 Fe + 3 O₂ → 2 Fe₂O₃</span><br><div style="font-size:12.5px;color:var(--muted);margin-top:4px">Oxidation of solid iron to Iron(III) oxide.</div>`;
        activeToolState.lastSummary = `Balanced reaction: 4 Fe + 3 O₂ → 2 Fe₂O₃ (Iron oxide).`;
      }
    }

    sel.addEventListener('change', update);
    update();
  }

  // 10. BIOLOGY: Punnett Square (Dynamic Ratios)
  function renderPunnettSquare(container) {
    container.body.innerHTML = `
      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:14px;flex-wrap:wrap">
        <div><label style="font-size:12px;font-weight:600">Parent 1 (Alleles):</label><br>
          <select id="wbP1" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:700;font-family:inherit">
            <option value="Aa">Aa (Heterozygous)</option>
            <option value="AA">AA (Homozygous Dominant)</option>
            <option value="aa">aa (Homozygous Recessive)</option>
          </select>
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:4px"><span style="font-size:20px;font-weight:700;color:var(--muted)">×</span></div>
        <div><label style="font-size:12px;font-weight:600">Parent 2 (Alleles):</label><br>
          <select id="wbP2" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:700;font-family:inherit">
            <option value="Aa" selected>Aa (Heterozygous)</option>
            <option value="AA">AA (Homozygous Dominant)</option>
            <option value="aa">aa (Homozygous Recessive)</option>
          </select>
        </div>
      </div>
      <div class="punnett-grid" id="wbPunnettGrid"></div>
      <div id="wbPunnettRatio" class="tool-controls-card" style="text-align:center;font-size:13.5px"></div>
    `;

    const p1 = container.body.querySelector('#wbP1');
    const p2 = container.body.querySelector('#wbP2');
    const grid = container.body.querySelector('#wbPunnettGrid');
    const ratio = container.body.querySelector('#wbPunnettRatio');

    function sortAllele(g) { return g[0] <= g[1] ? g : g[1] + g[0]; }

    function update() {
      const a1 = p1.value.split('');
      const a2 = p2.value.split('');

      const offspring = [
        sortAllele(a1[0] + a2[0]),
        sortAllele(a1[0] + a2[1]),
        sortAllele(a1[1] + a2[0]),
        sortAllele(a1[1] + a2[1])
      ];

      function cellColor(g) {
        if (g === 'AA') return 'background:rgba(0,122,255,0.12);color:#007aff;font-weight:800';
        if (g === 'Aa' || g === 'aA') return 'background:rgba(52,199,89,0.12);color:#16a34a;font-weight:800';
        return 'background:rgba(255,59,48,0.08);color:#ff3b30;font-weight:800';
      }

      grid.innerHTML = `
        <div class="punnett-cell punnett-header-cell">✕</div>
        <div class="punnett-cell punnett-header-cell">${a2[0]}</div>
        <div class="punnett-cell punnett-header-cell">${a2[1]}</div>
        <div class="punnett-cell punnett-header-cell">${a1[0]}</div>
        <div class="punnett-cell" style="${cellColor(offspring[0])}">${offspring[0]}</div>
        <div class="punnett-cell" style="${cellColor(offspring[1])}">${offspring[1]}</div>
        <div class="punnett-cell punnett-header-cell">${a1[1]}</div>
        <div class="punnett-cell" style="${cellColor(offspring[2])}">${offspring[2]}</div>
        <div class="punnett-cell" style="${cellColor(offspring[3])}">${offspring[3]}</div>
      `;

      // Dynamic ratio calculation
      const genoCounts = {};
      offspring.forEach(g => { genoCounts[g] = (genoCounts[g] || 0) + 1; });
      const genoStr = Object.entries(genoCounts).map(([g,n]) => `${(n/4*100).toFixed(0)}% ${g}`).join(' : ');

      const dominant = offspring.filter(g => g.includes('A')).length;
      const recessive = 4 - dominant;
      const phenoStr = dominant > 0 && recessive > 0
        ? `${dominant} Dominant : ${recessive} Recessive`
        : dominant === 4 ? '4 Dominant : 0 Recessive (100% Dominant)'
        : '0 Dominant : 4 Recessive (100% Recessive)';

      ratio.innerHTML = `
        <div style="margin-bottom:6px"><strong>Genotypic Ratio:</strong> ${genoStr}</div>
        <div><strong>Phenotypic Ratio:</strong> ${phenoStr}</div>
      `;
      activeToolState.lastSummary = `Genetics Punnett Cross (${p1.value} × ${p2.value}): Offspring = ${offspring.join(', ')}. Genotypic: ${genoStr}. Phenotypic: ${phenoStr}.`;
    }

    p1.addEventListener('change', update);
    p2.addEventListener('change', update);
    update();
  }

  // 11. BIOLOGY: Cell Explorer & Photosynthesis
  function renderCellExplorer(container) {
    const ORGANELLES = [
      { name: 'Nucleus (Bërthama)', desc: 'Stores genetic DNA and orchestrates cell division, transcription and metabolic control.' },
      { name: 'Mitochondria (Mitokondria)', desc: 'Cellular powerhouse generating ATP via oxidative phosphorylation and Krebs cycle.' },
      { name: 'Chloroplast (Kloroplasti)', desc: 'Carries out photosynthesis in plant cells, converting sunlight into chemical glucose.' },
      { name: 'Ribosomes (Ribozomet)', desc: 'Molecular machines translating mRNA transcripts into functional polypeptides and proteins.' },
      { name: 'Cell Membrane (Membrana)', desc: 'Selectively permeable lipid bilayer regulating ionic balance and cellular signaling.' }
    ];

    container.body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${ORGANELLES.map(o => `
          <div style="padding:12px 14px;background:var(--input-bg);border:1px solid var(--border);border-radius:10px">
            <strong style="color:var(--accent);font-size:14px">${o.name}</strong>
            <div style="font-size:12.5px;color:var(--text);margin-top:3px">${o.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
    activeToolState.lastSummary = `Cell Biology: Overview of Nucleus, Mitochondria, Chloroplasts, Ribosomes, and Cell Membrane functions.`;
  }

  function renderPhotosynthesisGuide(container) {
    container.body.innerHTML = `
      <div class="tool-controls-card" style="line-height:1.7;font-size:13.5px">
        <strong style="color:var(--success);font-size:16px">Photosynthesis Biochemical Equation:</strong><br>
        <span style="font-family:monospace;font-size:15px;font-weight:700">6 CO₂ + 6 H₂O + Light Energy → C₆H₁₂O₆ + 6 O₂</span><br><br>
        <strong>1. Light-Dependent Reactions (in Thylakoid Membranes):</strong><br>
        • Photolysis of water ($2\\text{H}_2\\text{O} \\rightarrow 4\\text{H}^+ + \\text{O}_2 + 4e^-$).<br>
        • Generates ATP and NADPH via electron transport chain.<br><br>
        <strong>2. Light-Independent Reactions / Calvin Cycle (in Stroma):</strong><br>
        • Carbon fixation via RuBisCO enzyme synthesizing Glyceraldehyde 3-phosphate (G3P) into Glucose.
      </div>
    `;
    activeToolState.lastSummary = `Photosynthesis Equation: 6 CO₂ + 6 H₂O + Light → C₆H₁₂O₆ + 6 O₂ (Thylakoid light reactions & Stroma Calvin cycle).`;
  }

  // 12. ECONOMICS: Embedded Tools
  function prepareEconContainer(container) {
    if (!container.controls) {
      const c = document.createElement('div');
      c.className = 'tool-controls-card';
      c.style.marginTop = '12px';
      container.body.appendChild(c);
      container.controls = c;
    }
    return container;
  }

  function renderSupplyDemandEmbed(container) {
    prepareEconContainer(container);
    if (window.EconTools?.renderSupplyDemand) {
      window.EconTools.renderSupplyDemand(container);
    }
  }
  function renderPPFEmbed(container) {
    prepareEconContainer(container);
    if (window.EconTools?.renderPPF) {
      window.EconTools.renderPPF(container);
    }
  }
  function renderADASEmbed(container) {
    prepareEconContainer(container);
    if (window.EconTools?.renderADAS) {
      window.EconTools.renderADAS(container);
    }
  }
  function renderGDPEmbed(container) {
    prepareEconContainer(container);
    if (window.EconTools?.renderGDP) {
      window.EconTools.renderGDP(container);
    }
  }
  function renderInflationEmbed(container) {
    prepareEconContainer(container);
    if (window.EconTools?.renderInflation) {
      window.EconTools.renderInflation(container);
    }
  }

  // 13. HISTORY: Timeline
  function renderHistoryTimeline(container) {
    const EVENTS = [
      { year: '4th Century BCE', title: 'Illyrian Kingdom', desc: 'King Bardylis, Queen Teuta, and prominent Adriatic trade civilizations.' },
      { year: '1443 – 1468', title: 'Era of Gjergj Kastrioti Skanderbeg', desc: 'Covenant of Lezha and 25-year European defense against Ottoman forces.' },
      { year: '1878', title: 'League of Prizren', desc: 'National Renaissance awakening and defense of territorial integrity.' },
      { year: 'November 28, 1912', title: 'Declaration of Independence in Vlora', desc: 'Ismail Qemali raises the national flag and establishes sovereign state.' },
      { year: '1991 – Present', title: 'Democratic Transition & Euro-Atlantic Integration', desc: 'Pluralism, NATO accession and ongoing European Union integration.' }
    ];

    container.body.innerHTML = `
      <div style="padding:10px 4px">
        ${EVENTS.map(e => `
          <div class="timeline-item">
            <strong style="color:var(--accent);font-size:14px">${e.year}</strong> — <span style="font-weight:700">${e.title}</span>
            <div style="font-size:12.5px;color:var(--muted);margin-top:3px">${e.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
    activeToolState.lastSummary = `History Timeline: Key eras from Illyrian Antiquity, 1443 Skanderbeg, 1878 League of Prizren, to 1912 Independence.`;
  }
  function renderHistoryEras(container) { renderHistoryTimeline(container); }

  // 14. ALBANIAN: Syntax Parser & Spellchecker
  function renderGrammarParser(container) {
    container.body.innerHTML = `
      <div style="margin-bottom:12px">
        <label style="font-size:13px;font-weight:600;color:var(--text)">Shkruani një fjali në gjuhën shqipe për analizë sintaksore:</label>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          <input type="text" id="wbSyntaxSent" value="Nxënësi i zellshëm lexon një libër interesant në bibliotekë."
                 style="flex:1;min-width:240px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--text);font-family:inherit;font-size:14px">
          <button id="wbAnalyzeSyntaxBtn" class="btn-primary" style="padding:10px 18px;border-radius:10px">Analizo</button>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="syn-preset wb-action-btn" data-s="Nxënësi i zellshëm lexon një libër interesant në bibliotekë.">Shembull 1</button>
          <button class="syn-preset wb-action-btn" data-s="Mësuesja shpjegon mësimin e ri me kujdes.">Shembull 2</button>
          <button class="syn-preset wb-action-btn" data-s="Dielli i ngrohtë ndriçon mbi malet e larta.">Shembull 3</button>
        </div>
      </div>
      <div id="wbSyntaxOutput" class="tool-controls-card" style="line-height:1.8;font-size:13.5px"></div>
    `;

    const input = container.body.querySelector('#wbSyntaxSent');
    const btn = container.body.querySelector('#wbAnalyzeSyntaxBtn');
    const output = container.body.querySelector('#wbSyntaxOutput');

    container.body.querySelectorAll('.syn-preset').forEach(p => {
      p.addEventListener('click', () => { input.value = p.dataset.s; analyze(); });
    });

    function analyze() {
      const sentence = input.value.trim();
      if (!sentence) { output.innerHTML = '<div style="color:var(--muted);text-align:center;padding:12px">Vendosni një fjali.</div>'; return; }

      // Tokenize and extract key grammatical patterns
      const words = sentence.replace(/[.,!?;:]/g, '').split(/\s+/);
      const wordCount = words.length;

      output.innerHTML = `
        <div style="font-size:15px;font-weight:700;color:var(--accent);margin-bottom:8px">Analiza e Fjalisë: "${sentence}"</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="padding:8px 12px;background:rgba(0,122,255,0.08);border-radius:8px;border-left:3px solid var(--accent)">
            <strong style="color:var(--accent)">1. Kryefjala (Grupi Emëror):</strong> <span style="font-weight:600">${words.slice(0, 2).join(' ')}</span>
            <div style="font-size:12px;color:var(--muted)">Kryen veprimin, rasa emërore e shquar.</div>
          </div>
          <div style="padding:8px 12px;background:rgba(52,199,89,0.08);border-radius:8px;border-left:3px solid var(--success)">
            <strong style="color:var(--success)">2. Kallëzuesi (Grupi Foljor):</strong> <span style="font-weight:600">${words[2] || words[1] || 'lexon'}</span>
            <div style="font-size:12px;color:var(--muted)">Kallëzues foljor i thjeshtë, koha e tashme, veta III njëjës.</div>
          </div>
          <div style="padding:8px 12px;background:rgba(175,82,222,0.08);border-radius:8px;border-left:3px solid #af52de">
            <strong style="color:#af52de">3. Gjymtyrët e Dytat (Plotësuesit):</strong>
            <div style="font-size:12.5px;margin-top:2px">• Kundrinor: <em>${words.slice(3, 5).join(' ') || 'një libër'}</em> (kallëzore)</div>
            <div style="font-size:12.5px">• Rrethanor: <em>${words.slice(5).join(' ') || 'në bibliotekë'}</em></div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--muted)">Struktura e përgjithshme: Fjali e thjeshtë e zgjeruar me ${wordCount} fjalë.</div>
      `;
      activeToolState.lastSummary = `Analizë Sintaksore për fjalinë: "${sentence}" (Kryefjala: ${words.slice(0, 2).join(' ')}, Kallëzuesi: ${words[2] || words[1]}).`;
    }

    btn.addEventListener('click', analyze);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') analyze(); });
    analyze();
  }

  function renderSpellingChecker(container) {
    container.body.innerHTML = `
      <div style="margin-bottom:12px">
        <label style="font-size:13px;font-weight:600;color:var(--text)">Kontrolloni drejtshkrimin dhe vendosjen automatike të Ë-së dhe Ç-së:</label>
        <textarea id="wbSpellText" rows="3" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;font-size:13.5px;margin-top:6px">Mesuesi na dha nje detyre shume te bukur ne shkolle.</textarea>
        <button id="wbFixSpellBtn" class="btn-primary" style="margin-top:8px;padding:8px 16px;border-radius:8px">Korrigjo Drejtshkrimin</button>
      </div>
      <div id="wbSpellResult" class="tool-controls-card" style="font-size:13.5px;line-height:1.7"></div>
    `;

    const txt = container.body.querySelector('#wbSpellText');
    const btn = container.body.querySelector('#wbFixSpellBtn');
    const res = container.body.querySelector('#wbSpellResult');

    const DICTIONARY_MAP = {
      'mesuesi': 'mësuesi', 'mesuese': 'mësuesja', 'nje': 'një', 'detyre': 'detyrë', 'shume': 'shumë',
      'te': 'të', 'ne': 'në', 'shkolle': 'shkollë', 'gjithe': 'gjithë', 'dite': 'ditë', 'fjale': 'fjalë',
      'mire': 'mirë', 'shqipe': 'shqipë', 'shqiperi': 'Shqipëri', 'keshtu': 'kështu', 'eshte': 'është',
      'gjate': 'gjatë', 'cene': 'çenë', 'cfare': 'çfarë', 'cdo': 'çdo', 'celes': 'çelës'
    };

    function fix() {
      const orig = txt.value;
      let corrected = orig;
      let count = 0;

      Object.entries(DICTIONARY_MAP).forEach(([wrong, right]) => {
        const re = new RegExp(`\\b${wrong}\\b`, 'gi');
        if (re.test(corrected)) {
          corrected = corrected.replace(re, right);
          count++;
        }
      });

      res.innerHTML = `
        <div style="font-weight:700;color:var(--success);margin-bottom:6px">
          ✅ Teksti i Korrigjuar (${count} rregullime të zbatuara):
        </div>
        <div style="padding:10px 14px;background:var(--panel);border-radius:8px;border:1px solid var(--border);font-size:14px">
          ${corrected}
        </div>
      `;
      activeToolState.lastSummary = `Korrigjim drejtshkrimor: "${orig}" → "${corrected}".`;
    }

    btn.addEventListener('click', fix);
    fix();
  }

  // 15. ENGLISH: Essay Outline Builder & Academic Vocab
  function renderEssayOutlineBuilder(container) {
    container.body.innerHTML = `
      <div style="margin-bottom:12px">
        <label style="font-size:13px;font-weight:600;color:var(--text)">Essay Topic / Working Thesis:</label>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          <input type="text" id="wbEssayTopic" value="Artificial Intelligence in Modern Education"
                 style="flex:1;min-width:220px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--text);font-family:inherit;font-size:14px">
          <select id="wbEssayType" style="padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;font-weight:600">
            <option value="arg">Argumentative (PEEL)</option>
            <option value="exp">Expository / Explanatory</option>
            <option value="comp">Compare & Contrast</option>
          </select>
          <button id="wbGenOutlineBtn" class="btn-primary" style="padding:10px 16px;border-radius:10px">Build Outline</button>
        </div>
      </div>
      <div id="wbOutlineResult" class="tool-controls-card" style="line-height:1.7;font-size:13.5px"></div>
    `;

    const topicIn = container.body.querySelector('#wbEssayTopic');
    const typeSel = container.body.querySelector('#wbEssayType');
    const btn = container.body.querySelector('#wbGenOutlineBtn');
    const res = container.body.querySelector('#wbOutlineResult');

    function build() {
      const topic = topicIn.value.trim() || 'Modern Technology';
      const type = typeSel.value;

      res.innerHTML = `
        <div style="font-size:15px;font-weight:700;color:var(--accent);margin-bottom:10px">📝 Structured Essay Blueprint: ${topic}</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="padding:10px 14px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">
            <strong style="color:var(--accent)">I. Introduction Paragraph:</strong><br>
            • <strong>Hook:</strong> An impactful statistic, rhetorical question, or real-world vignette regarding ${topic}.<br>
            • <strong>Context:</strong> Brief background of key stakeholders and historical trajectory.<br>
            • <strong>Thesis Statement:</strong> Clearly states main claim and 3 supporting pillars.
          </div>
          <div style="padding:10px 14px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">
            <strong style="color:var(--success)">II. Body Paragraphs (PEEL Framework):</strong><br>
            • <strong>Paragraph 1 (Primary Advantage):</strong> Point → Empirical Evidence → In-depth Explanation → Link back to thesis.<br>
            • <strong>Paragraph 2 (Systemic Impact):</strong> How ${topic} shifts accessibility, scalability, and efficiency.<br>
            • <strong>Paragraph 3 (Counter-Argument & Rebuttal):</strong> Address critics' concerns and refute with counter-evidence.
          </div>
          <div style="padding:10px 14px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">
            <strong style="color:#af52de">III. Conclusion Paragraph:</strong><br>
            • <strong>Restate Thesis:</strong> Rephrase core argument with synthesized insights.<br>
            • <strong>Synthesis:</strong> Connect all points into a cohesive takeaway.<br>
            • <strong>Call to Action / Final Thought:</strong> Forward-looking vision for future development.
          </div>
        </div>
      `;
      activeToolState.lastSummary = `Essay Outline for "${topic}" (${typeSel.options[typeSel.selectedIndex].text}) using PEEL format.`;
    }

    btn.addEventListener('click', build);
    topicIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') build(); });
    build();
  }

  function renderVocabBuilder(container) {
    const WORDS = [
      { w: 'Substantiate', pos: 'verb', def: 'To provide evidence to support or prove the truth of an assertion.', ex: 'The researcher substantiated her hypothesis with empirical field data.' },
      { w: 'Juxtapose', pos: 'verb', def: 'To place different things close together to highlight contrast or comparison.', ex: 'The essay juxtaposes traditional pedagogical methods with AI-driven adaptive tutors.' },
      { w: 'Eloquent', pos: 'adj', def: 'Fluent, persuasive, and beautifully articulated in speech or writing.', ex: 'His eloquent presentation convinced the panel to fund the initiative.' },
      { w: 'Pragmatic', pos: 'adj', def: 'Dealing with things sensibly and realistically based on practical outcomes.', ex: 'We must adopt a pragmatic framework to evaluate classroom technologies.' },
      { w: 'Ambiguous', pos: 'adj', def: 'Open to more than one interpretation; having a double meaning.', ex: 'The instructions were too ambiguous for the students to complete the assignment.' },
      { w: 'Catalyst', pos: 'noun', def: 'A person or thing that precipitates an event or accelerates change.', ex: 'Digital classrooms served as a catalyst for educational transformation.' }
    ];

    container.body.innerHTML = `
      <div style="margin-bottom:12px">
        <input type="text" id="wbVocabSearch" placeholder="Search academic vocabulary word or definition..."
               style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--text);font-family:inherit;font-size:13.5px">
      </div>
      <div id="wbVocabList" style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto"></div>
    `;

    const search = container.body.querySelector('#wbVocabSearch');
    const list = container.body.querySelector('#wbVocabList');

    function renderList(q = '') {
      const filtered = WORDS.filter(x => x.w.toLowerCase().includes(q.toLowerCase()) || x.def.toLowerCase().includes(q.toLowerCase()));
      list.innerHTML = filtered.map(item => `
        <div style="padding:10px 14px;background:var(--input-bg);border-radius:10px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px">
            <strong style="color:var(--accent);font-size:15px">${item.w}</strong>
            <span style="font-size:11px;padding:1px 6px;border-radius:6px;background:var(--panel);color:var(--muted)">${item.pos}</span>
          </div>
          <div style="font-size:13px;color:var(--text);margin-top:3px">${item.def}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;font-style:italic">"${item.ex}"</div>
        </div>
      `).join('');
    }

    search.addEventListener('input', () => renderList(search.value));
    renderList();
  }

  // 16. CYBER SAFETY: Password Entropy & Crack Time Analyzer
  function renderPasswordStrengthTool(container) {
    container.body.innerHTML = `
      <div style="margin-bottom:14px">
        <label style="font-size:13px;font-weight:600;color:var(--text)">Test password entropy, cryptographic keyspace & crack time:</label>
        <div style="display:flex;gap:8px;margin-top:6px">
          <input type="text" id="wbPwdIn" value="Correct-Horse-Battery-2026!"
                 style="flex:1;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--text);font-family:monospace;font-size:14px">
          <button id="wbGenSecurePwd" class="wb-action-btn">🎲 Generate</button>
        </div>
      </div>
      <div id="wbPwdMetrics" class="tool-controls-card" style="font-size:13.5px;line-height:1.8"></div>
    `;

    const input = container.body.querySelector('#wbPwdIn');
    const genBtn = container.body.querySelector('#wbGenSecurePwd');
    const metrics = container.body.querySelector('#wbPwdMetrics');

    function analyzePassword() {
      const pwd = input.value;
      if (!pwd) {
        metrics.innerHTML = '<div style="color:var(--muted);text-align:center;padding:12px">Type a password above to evaluate.</div>';
        return;
      }

      const len = pwd.length;
      let poolSize = 0;
      const hasLower = /[a-z]/.test(pwd);
      const hasUpper = /[A-Z]/.test(pwd);
      const hasNumbers = /[0-9]/.test(pwd);
      const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);

      if (hasLower) poolSize += 26;
      if (hasUpper) poolSize += 26;
      if (hasNumbers) poolSize += 10;
      if (hasSymbols) poolSize += 33;

      const entropy = poolSize > 0 ? (len * Math.log2(poolSize)) : 0;
      
      // Calculate crack time at 10 billion guesses/sec
      const combinations = Math.pow(2, entropy);
      const seconds = combinations / 10000000000;
      let crackTime = '';
      if (seconds < 1) crackTime = 'Instant (< 1 second)';
      else if (seconds < 60) crackTime = `${seconds.toFixed(1)} seconds`;
      else if (seconds < 3600) crackTime = `${(seconds/60).toFixed(1)} minutes`;
      else if (seconds < 86400) crackTime = `${(seconds/3600).toFixed(1)} hours`;
      else if (seconds < 31536000) crackTime = `${(seconds/86400).toFixed(0)} days`;
      else if (seconds < 31536000 * 1000) crackTime = `${(seconds/31536000).toFixed(0)} years`;
      else crackTime = `Over ${(seconds/31536000/1000).toFixed(0)} thousand years`;

      let rating = 'Weak';
      let color = '#ff3b30';
      let barPct = Math.min(100, (entropy / 80) * 100);

      if (entropy >= 75) { rating = 'Very Strong / Military Grade'; color = '#34c759'; }
      else if (entropy >= 55) { rating = 'Strong'; color = '#30d158'; }
      else if (entropy >= 38) { rating = 'Moderate'; color = '#ff9500'; }

      metrics.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-weight:700">Strength Rating:</span>
          <span style="font-weight:800;color:${color}">${rating}</span>
        </div>
        <div style="background:var(--border);height:8px;border-radius:4px;overflow:hidden;margin-bottom:12px">
          <div style="width:${barPct}%;height:100%;background:${color};border-radius:4px;transition:all 0.3s ease"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:12px">
          <div style="padding:8px 12px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--muted)">Entropy (Information Density)</div>
            <div style="font-size:16px;font-weight:800;color:var(--accent)">${entropy.toFixed(1)} bits</div>
          </div>
          <div style="padding:8px 12px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--muted)">Character Pool Size</div>
            <div style="font-size:16px;font-weight:800;color:var(--accent)">${poolSize} characters</div>
          </div>
          <div style="padding:8px 12px;background:var(--panel);border-radius:8px;border:1px solid var(--border);grid-column:1/-1">
            <div style="font-size:11px;color:var(--muted)">Estimated Brute Force Crack Time (10B guesses/sec)</div>
            <div style="font-size:16px;font-weight:800;color:${color}">${crackTime}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;font-size:12px;flex-wrap:wrap">
          <span style="padding:2px 8px;border-radius:6px;background:${hasLower?'rgba(52,199,89,0.15)':'var(--panel)'};color:${hasLower?'#16a34a':'var(--muted)'}">${hasLower?'✓':'✕'} a-z</span>
          <span style="padding:2px 8px;border-radius:6px;background:${hasUpper?'rgba(52,199,89,0.15)':'var(--panel)'};color:${hasUpper?'#16a34a':'var(--muted)'}">${hasUpper?'✓':'✕'} A-Z</span>
          <span style="padding:2px 8px;border-radius:6px;background:${hasNumbers?'rgba(52,199,89,0.15)':'var(--panel)'};color:${hasNumbers?'#16a34a':'var(--muted)'}">${hasNumbers?'✓':'✕'} 0-9</span>
          <span style="padding:2px 8px;border-radius:6px;background:${hasSymbols?'rgba(52,199,89,0.15)':'var(--panel)'};color:${hasSymbols?'#16a34a':'var(--muted)'}">${hasSymbols?'✓':'✕'} Special (!@#$)</span>
        </div>
      `;
      activeToolState.lastSummary = `Cyber Safety Password Entropy: Length=${len}, Entropy=${entropy.toFixed(1)} bits (${rating}), Crack time: ${crackTime}.`;
    }

    function generateSecurePassword() {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}';
      let res = '';
      for (let i = 0; i < 18; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      input.value = res;
      analyzePassword();
    }

    input.addEventListener('input', analyzePassword);
    genBtn.addEventListener('click', generateSecurePassword);
    analyzePassword();
  }

  // 17. CODING: Algorithm Visualizer (Interactive Live Step-through)
  function renderAlgorithmVisualizer(container) {
    container.body.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <button class="wb-action-btn algo-type-btn active" data-algo="binsearch">🔍 Binary Search</button>
        <button class="wb-action-btn algo-type-btn" data-algo="bubblesort">📊 Bubble Sort</button>
      </div>
      <div id="wbAlgoControls" class="tool-controls-card">
        <div style="display:flex;gap:8px;align-items:center">
          <label style="font-weight:600;font-size:13px">Search Target:</label>
          <input type="number" id="wbAlgoTarget" value="42" style="width:70px;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:700">
          <button id="wbAlgoStepBtn" class="btn-primary" style="padding:6px 14px;border-radius:8px">Next Step ▶</button>
          <button id="wbAlgoResetBtn" class="wb-action-btn">↺ Reset</button>
        </div>
      </div>
      <div id="wbAlgoCanvas" style="display:flex;gap:6px;justify-content:center;margin:16px 0;flex-wrap:wrap"></div>
      <div id="wbAlgoLogs" class="tool-controls-card" style="font-family:monospace;font-size:13px;line-height:1.6"></div>
    `;

    const targetIn = container.body.querySelector('#wbAlgoTarget');
    const stepBtn = container.body.querySelector('#wbAlgoStepBtn');
    const resetBtn = container.body.querySelector('#wbAlgoResetBtn');
    const canvas = container.body.querySelector('#wbAlgoCanvas');
    const logs = container.body.querySelector('#wbAlgoLogs');

    let arr = [3, 7, 12, 19, 25, 33, 42, 56, 68, 79, 88, 95];
    let low = 0;
    let high = arr.length - 1;
    let mid = -1;
    let finished = false;

    function renderArray() {
      canvas.innerHTML = arr.map((num, i) => {
        let bg = 'var(--input-bg)';
        let border = 'var(--border)';
        let color = 'var(--text)';

        if (i === mid) { bg = '#007aff'; color = '#fff'; }
        else if (i >= low && i <= high && !finished) { bg = 'rgba(0,122,255,0.12)'; border = 'var(--accent)'; }

        return `
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="width:40px;height:44px;display:flex;align-items:center;justify-content:center;background:${bg};color:${color};border:1px solid ${border};border-radius:8px;font-weight:700;font-size:15px;transition:all 0.2s">
              ${num}
            </div>
            <span style="font-size:10px;color:var(--muted)">[${i}]</span>
          </div>
        `;
      }).join('');
    }

    function step() {
      if (finished) return;
      const target = parseInt(targetIn.value);

      if (low <= high) {
        mid = Math.floor((low + high) / 2);
        renderArray();

        if (arr[mid] === target) {
          logs.innerHTML = `<span style="color:var(--success);font-weight:700">🎯 Match found at index [${mid}]! Target ${target} == arr[${mid}] (${arr[mid]}).</span>`;
          finished = true;
          activeToolState.lastSummary = `Binary Search: Found target ${target} at index ${mid} in O(log n) steps.`;
        } else if (arr[mid] < target) {
          logs.innerHTML = `arr[${mid}] = ${arr[mid]} < ${target}. Discarding left half. New low = ${mid + 1}.`;
          low = mid + 1;
        } else {
          logs.innerHTML = `arr[${mid}] = ${arr[mid]} > ${target}. Discarding right half. New high = ${mid - 1}.`;
          high = mid - 1;
        }
      } else {
        logs.innerHTML = `<span style="color:var(--error);font-weight:700">❌ Target ${target} not found in array.</span>`;
        finished = true;
      }
    }

    function reset() {
      low = 0;
      high = arr.length - 1;
      mid = -1;
      finished = false;
      logs.innerHTML = 'Click "Next Step" to start binary search.';
      renderArray();
    }

    stepBtn.addEventListener('click', step);
    resetBtn.addEventListener('click', reset);
    reset();
  }

  // 18. GERMAN: Article Trainer & Verb Conjugator
  function renderGermanArticleTrainer(container) {
    const NOUNS = [
      { noun: 'Tisch', art: 'der', meaning: 'Table', hint: 'Male gender nouns' },
      { noun: 'Sonne', art: 'die', meaning: 'Sun', hint: 'Words ending in -e' },
      { noun: 'Buch', art: 'das', meaning: 'Book', hint: 'Neutral object' },
      { noun: 'Schule', art: 'die', meaning: 'School', hint: 'Words ending in -e' },
      { noun: 'Lehrer', art: 'der', meaning: 'Teacher (m)', hint: 'Male profession ending in -er' },
      { noun: 'Auto', art: 'das', meaning: 'Car', hint: 'Foreign / modern nouns' },
      { noun: 'Zeitung', art: 'die', meaning: 'Newspaper', hint: 'Words ending in -ung' },
      { noun: 'Mädchen', art: 'das', meaning: 'Girl', hint: 'Diminutive ending in -chen' }
    ];

    let curIdx = 0;
    let score = 0;

    container.body.innerHTML = `
      <div style="text-align:center;padding:12px">
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">Wähle den richtigen Artikel (Der / Die / Das):</div>
        <div id="wbGermanNoun" style="font-size:32px;font-weight:800;color:var(--text);margin:8px 0">...</div>
        <div id="wbGermanMeaning" style="font-size:13px;color:var(--muted);margin-bottom:16px">...</div>
        <div style="display:flex;gap:12px;justify-content:center;max-width:320px;margin:0 auto">
          <button class="btn-primary ger-art-btn" data-art="der" style="flex:1;padding:12px;font-weight:800;background:#007aff">DER</button>
          <button class="btn-primary ger-art-btn" data-art="die" style="flex:1;padding:12px;font-weight:800;background:#e11d48">DIE</button>
          <button class="btn-primary ger-art-btn" data-art="das" style="flex:1;padding:12px;font-weight:800;background:#10b981">DAS</button>
        </div>
        <div id="wbGerFeedback" style="margin-top:14px;font-weight:700;font-size:14px;min-height:24px"></div>
        <div style="margin-top:10px;font-size:12px;color:var(--muted)">Score: <span id="wbGerScore">0</span> / ${NOUNS.length}</div>
      </div>
    `;

    const nounEl = container.body.querySelector('#wbGermanNoun');
    const meaningEl = container.body.querySelector('#wbGermanMeaning');
    const feedbackEl = container.body.querySelector('#wbGerFeedback');
    const scoreEl = container.body.querySelector('#wbGerScore');

    function loadNoun() {
      const item = NOUNS[curIdx % NOUNS.length];
      nounEl.textContent = item.noun;
      meaningEl.textContent = `Meaning: ${item.meaning}`;
      feedbackEl.textContent = '';
    }

    container.body.querySelectorAll('.ger-art-btn').forEach(b => {
      b.addEventListener('click', () => {
        const chosen = b.dataset.art;
        const item = NOUNS[curIdx % NOUNS.length];

        if (chosen === item.art) {
          score++;
          scoreEl.textContent = score;
          feedbackEl.innerHTML = `<span style="color:#10b981">✅ Richtig! ${item.art.toUpperCase()} ${item.noun} (${item.hint})</span>`;
        } else {
          feedbackEl.innerHTML = `<span style="color:#ff3b30">❌ Falsch! Es ist: <strong>${item.art.toUpperCase()} ${item.noun}</strong></span>`;
        }

        setTimeout(() => {
          curIdx++;
          loadNoun();
        }, 1200);
      });
    });

    loadNoun();
  }

  function renderGermanVerbConjugator(container) {
    const GER_VERBS = {
      'sein': {
        praesens: ['ich bin', 'du bist', 'er/sie/es ist', 'wir sind', 'ihr seid', 'sie/Sie sind'],
        praeteritum: ['ich war', 'du warst', 'er/sie/es war', 'wir waren', 'ihr wart', 'sie/Sie waren'],
        perfekt: ['ich bin gewesen', 'du bist gewesen', 'er ist gewesen', 'wir sind gewesen', 'ihr seid gewesen', 'sie sind gewesen']
      },
      'haben': {
        praesens: ['ich habe', 'du hast', 'er/sie/es hat', 'wir haben', 'ihr habt', 'sie/Sie haben'],
        praeteritum: ['ich hatte', 'du hattest', 'er/sie/es hatte', 'wir hatten', 'ihr hattet', 'sie/Sie hatten'],
        perfekt: ['ich habe gehabt', 'du hast gehabt', 'er hat gehabt', 'wir haben gehabt', 'ihr habt gehabt', 'sie haben gehabt']
      },
      'gehen': {
        praesens: ['ich gehe', 'du gehst', 'er/sie/es geht', 'wir gehen', 'ihr geht', 'sie/Sie gehen'],
        praeteritum: ['ich ging', 'du gingst', 'er/sie/es ging', 'wir gingen', 'ihr gingt', 'sie/Sie gingen'],
        perfekt: ['ich bin gegangen', 'du bist gegangen', 'er ist gegangen', 'wir sind gegangen', 'ihr seid gegangen', 'sie sind gegangen']
      },
      'sprechen': {
        praesens: ['ich spreche', 'du sprichst', 'er/sie/es spricht', 'wir sprechen', 'ihr sprecht', 'sie/Sie sprechen'],
        praeteritum: ['ich sprach', 'du sprachst', 'er/sie/es sprach', 'wir sprachen', 'ihr spracht', 'sie/Sie sprachen'],
        perfekt: ['ich habe gesprochen', 'du hast gesprochen', 'er hat gesprochen', 'wir haben gesprochen', 'ihr habt gesprochen', 'sie haben gesprochen']
      }
    };

    container.body.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <select id="wbGerVerbSel" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:700;font-family:inherit">
          <option value="sein">sein (to be)</option>
          <option value="haben">haben (to have)</option>
          <option value="gehen">gehen (to go)</option>
          <option value="sprechen">sprechen (to speak)</option>
        </select>
        <select id="wbGerTenseSel" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:600;font-family:inherit">
          <option value="praesens">Präsens (Present)</option>
          <option value="praeteritum">Präteritum (Simple Past)</option>
          <option value="perfekt">Perfekt (Present Perfect)</option>
        </select>
      </div>
      <div id="wbGerConjugation" class="tool-controls-card" style="font-size:14px;line-height:1.8"></div>
    `;

    const verbSel = container.body.querySelector('#wbGerVerbSel');
    const tenseSel = container.body.querySelector('#wbGerTenseSel');
    const out = container.body.querySelector('#wbGerConjugation');

    function update() {
      const v = verbSel.value;
      const t = tenseSel.value;
      const forms = GER_VERBS[v]?.[t] || [];

      out.innerHTML = `
        <div style="font-weight:700;color:var(--accent);margin-bottom:6px">Verb: ${v.toUpperCase()} (${t.toUpperCase()})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px">
          ${forms.map(f => `<div style="padding:8px 12px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">${f}</div>`).join('')}
        </div>
      `;
      activeToolState.lastSummary = `German Conjugation: ${v} in ${t}: ${forms.join(', ')}.`;
    }

    verbSel.addEventListener('change', update);
    tenseSel.addEventListener('change', update);
    update();
  }

  // 19. SPANISH: Verb Conjugator
  function renderSpanishVerbConjugator(container) {
    const ESP_VERBS = {
      'hablar': {
        presente: ['yo hablo', 'tú hablas', 'él/ella habla', 'nosotros hablamos', 'vosotros habláis', 'ellos hablan'],
        preterito: ['yo hablé', 'tú hablaste', 'él/ella habló', 'nosotros hablamos', 'vosotros hablasteis', 'ellos hablaron'],
        futuro: ['yo hablaré', 'tú hablarás', 'él/ella hablará', 'nosotros hablaremos', 'vosotros hablaréis', 'ellos hablarán']
      },
      'comer': {
        presente: ['yo como', 'tú comes', 'él/ella come', 'nosotros comemos', 'vosotros coméis', 'ellos comen'],
        preterito: ['yo comí', 'tú comiste', 'él/ella comió', 'nosotros comimos', 'vosotros comisteis', 'ellos comieron'],
        futuro: ['yo comeré', 'tú comerás', 'él/ella comerá', 'nosotros comeremos', 'vosotros comeréis', 'ellos comerán']
      },
      'vivir': {
        presente: ['yo vivo', 'tú vives', 'él/ella vive', 'nosotros vivimos', 'vosotros vivís', 'ellos viven'],
        preterito: ['yo viví', 'tú viviste', 'él/ella vivió', 'nosotros vivimos', 'vosotros vivisteis', 'ellos vivieron'],
        futuro: ['yo viviré', 'tú vivirás', 'él/ella vivirá', 'nosotros viviremos', 'vosotros viviréis', 'ellos vivirán']
      },
      'ser': {
        presente: ['yo soy', 'tú eres', 'él/ella es', 'nosotros somos', 'vosotros sois', 'ellos son'],
        preterito: ['yo fui', 'tú fuiste', 'él/ella fue', 'nosotros fuimos', 'vosotros fuisteis', 'ellos fueron'],
        futuro: ['yo seré', 'tú serás', 'él/ella será', 'nosotros seremos', 'vosotros seréis', 'ellos serán']
      },
      'estar': {
        presente: ['yo estoy', 'tú estás', 'él/ella está', 'nosotros estamos', 'vosotros estáis', 'ellos están'],
        preterito: ['yo estuve', 'tú estuviste', 'él/ella estuvo', 'nosotros estuvimos', 'vosotros estuvisteis', 'ellos estuvieron'],
        futuro: ['yo estaré', 'tú estarás', 'él/ella estará', 'nosotros estaremos', 'vosotros estaréis', 'ellos estarán']
      }
    };

    container.body.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <select id="wbEspVerbSel" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:700;font-family:inherit">
          <option value="hablar">hablar (to speak)</option>
          <option value="comer">comer (to eat)</option>
          <option value="vivir">vivir (to live)</option>
          <option value="ser">ser (to be - essential)</option>
          <option value="estar">estar (to be - state)</option>
        </select>
        <select id="wbEspTenseSel" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:600;font-family:inherit">
          <option value="presente">Presente</option>
          <option value="preterito">Pretérito Indefinido</option>
          <option value="futuro">Futuro Simple</option>
        </select>
      </div>
      <div id="wbEspConjugation" class="tool-controls-card" style="font-size:14px;line-height:1.8"></div>
    `;

    const verbSel = container.body.querySelector('#wbEspVerbSel');
    const tenseSel = container.body.querySelector('#wbEspTenseSel');
    const out = container.body.querySelector('#wbEspConjugation');

    function update() {
      const v = verbSel.value;
      const t = tenseSel.value;
      const forms = ESP_VERBS[v]?.[t] || [];

      out.innerHTML = `
        <div style="font-weight:700;color:var(--accent);margin-bottom:6px">Verbo: ${v.toUpperCase()} (${t.toUpperCase()})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px">
          ${forms.map(f => `<div style="padding:8px 12px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">${f}</div>`).join('')}
        </div>
      `;
      activeToolState.lastSummary = `Spanish Conjugation: ${v} in ${t}: ${forms.join(', ')}.`;
    }

    verbSel.addEventListener('change', update);
    tenseSel.addEventListener('change', update);
    update();
  }

  // 20. FRENCH: Verb Conjugator
  function renderFrenchVerbConjugator(container) {
    const FR_VERBS = {
      'être': {
        present: ['je suis', 'tu es', 'il/elle est', 'nous sommes', 'vous êtes', 'ils/elles sont'],
        passe: ['j\'ai été', 'tu as été', 'il a été', 'nous avons été', 'vous avez été', 'ils ont été'],
        futur: ['je serai', 'tu seras', 'il sera', 'nous serons', 'vous serez', 'ils seront']
      },
      'avoir': {
        present: ['j\'ai', 'tu as', 'il/elle a', 'nous avons', 'vous avez', 'ils/elles ont'],
        passe: ['j\'ai eu', 'tu as eu', 'il a eu', 'nous avons eu', 'vous avez eu', 'ils ont eu'],
        futur: ['j\'aurai', 'tu auras', 'il aura', 'nous aurons', 'vous aurez', 'ils auront']
      },
      'aller': {
        present: ['je vais', 'tu vas', 'il/elle va', 'nous allons', 'vous allez', 'ils/elles vont'],
        passe: ['je suis allé(e)', 'tu es allé(e)', 'il est allé', 'nous sommes allés', 'vous êtes allés', 'ils sont allés'],
        futur: ['j\'irai', 'tu iras', 'il ira', 'nous irons', 'vous irez', 'ils iront']
      },
      'faire': {
        present: ['je fais', 'tu fais', 'il/elle fait', 'nous faisons', 'vous faites', 'ils/elles font'],
        passe: ['j\'ai fait', 'tu as fait', 'il a fait', 'nous avons fait', 'vous avez fait', 'ils ont fait'],
        futur: ['je ferai', 'tu feras', 'il fera', 'nous ferons', 'vous ferez', 'ils feront']
      }
    };

    container.body.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <select id="wbFrVerbSel" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:700;font-family:inherit">
          <option value="être">être (to be)</option>
          <option value="avoir">avoir (to have)</option>
          <option value="aller">aller (to go)</option>
          <option value="faire">faire (to do/make)</option>
        </select>
        <select id="wbFrTenseSel" style="padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-weight:600;font-family:inherit">
          <option value="present">Présent</option>
          <option value="passe">Passé Composé</option>
          <option value="futur">Futur Simple</option>
        </select>
      </div>
      <div id="wbFrConjugation" class="tool-controls-card" style="font-size:14px;line-height:1.8"></div>
    `;

    const verbSel = container.body.querySelector('#wbFrVerbSel');
    const tenseSel = container.body.querySelector('#wbFrTenseSel');
    const out = container.body.querySelector('#wbFrConjugation');

    function update() {
      const v = verbSel.value;
      const t = tenseSel.value;
      const forms = FR_VERBS[v]?.[t] || [];

      out.innerHTML = `
        <div style="font-weight:700;color:var(--accent);margin-bottom:6px">Verbe: ${v.toUpperCase()} (${t.toUpperCase()})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px">
          ${forms.map(f => `<div style="padding:8px 12px;background:var(--panel);border-radius:8px;border:1px solid var(--border)">${f}</div>`).join('')}
        </div>
      `;
      activeToolState.lastSummary = `French Conjugation: ${v} in ${t}: ${forms.join(', ')}.`;
    }

    verbSel.addEventListener('change', update);
    tenseSel.addEventListener('change', update);
    update();
  }

  // ----------------------------------------------------------------
  // SIDEBAR TOOLS HUB (Compact, Apple-style segmented card)
  // ----------------------------------------------------------------
  function renderSidebarTools() {
    const existing = document.getElementById('subjectToolsHub');
    if (existing) existing.remove();

    const activeSubject = window.Subjects?.getActive();
    if (!activeSubject) return;

    const tools = SUBJECT_TOOLS[activeSubject.id] || [];
    if (tools.length === 0) return;

    const hub = document.createElement('div');
    hub.id = 'subjectToolsHub';
    hub.className = 'sidebar-tools-hub';

    hub.innerHTML = `
      <div class="sidebar-tools-hub-header">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:16px">${activeSubject.emoji}</span>
          <h2 class="panel-title" style="margin:0;font-size:12.5px;font-weight:700;color:var(--text)">${activeSubject.label} Tools</h2>
        </div>
        <button id="hubOpenAllBtn" style="background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;color:var(--accent);cursor:pointer">
          Open Tabs ↗
        </button>
      </div>
      <div class="sidebar-tools-grid">
        ${tools.map(t => `
          <button class="sidebar-tool-card" data-tool-id="${t.id}" data-subject-id="${activeSubject.id}">
            <span class="tool-icon">${t.icon}</span>
            <div style="flex:1;min-width:0">
              <div class="tool-title">${t.label}</div>
              <div class="tool-sub">${t.desc || ''}</div>
            </div>
          </button>
        `).join('')}
      </div>
    `;

    // Insert into sidebar
    const isTeacher = window.AppState?.ui?.teacherMode && window.AppState?.ui?.teacherModeUnlocked;
    const targetSection = isTeacher ? document.getElementById('teacherToolsSection') : document.getElementById('studentToolsSection');

    if (targetSection) {
      const difficultyPanel = targetSection.querySelector('#difficultyPanel')?.parentElement;
      if (difficultyPanel) {
        targetSection.insertBefore(hub, difficultyPanel);
      } else {
        targetSection.appendChild(hub);
      }
    }

    // Wire buttons
    hub.querySelector('#hubOpenAllBtn')?.addEventListener('click', () => {
      openWorkbench(tools[0]?.id, activeSubject.id);
    });

    hub.querySelectorAll('.sidebar-tool-card').forEach(card => {
      card.addEventListener('click', () => {
        const tid = card.dataset.toolId;
        const sid = card.dataset.subjectId;
        openWorkbench(tid, sid);
      });
    });
  }

  // ----------------------------------------------------------------
  // EVENT LISTENERS & INIT
  // ----------------------------------------------------------------
  window.addEventListener('subjectSwitched', () => {
    renderSidebarTools();
  });

  window.addEventListener('teacherModeUnlocked', () => {
    renderSidebarTools();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(renderSidebarTools, 800));
  } else {
    setTimeout(renderSidebarTools, 800);
  }

  // Export
  window.SubjectTools = {
    SUBJECT_TOOLS,
    openWorkbench,
    closeWorkbench,
    renderSidebarTools
  };

  console.log('✅ Tabbed Subject Workbench Engine loaded for all 13 subjects');
})();
