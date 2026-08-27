(function () {
  'use strict';

  let currentExpression = '';
  let currentResult = '0';

  const CONSTANTS = [
    { name: 'Shpejtësia e Dritës (c)', val: 299792458, unit: 'm/s', symbol: 'c' },
    { name: 'Konstanta e Gravitetit (G)', val: 6.6743e-11, unit: 'N·m²/kg²', symbol: 'G' },
    { name: 'Konstanta e Plankut (h)', val: 6.62607015e-34, unit: 'J·s', symbol: 'h' },
    { name: 'Numri i Avogadros (N_A)', val: 6.02214076e23, unit: 'mol⁻¹', symbol: 'N_A' },
    { name: 'Ngarkesa Elementare (e)', val: 1.602176634e-19, unit: 'C', symbol: 'e' },
    { name: 'Konstanta e Bolcmanit (k_B)', val: 1.380649e-23, unit: 'J/K', symbol: 'k_B' },
    { name: 'Nxitimi i Gravitetit (g)', val: 9.80665, unit: 'm/s²', symbol: 'g' }
  ];

  function init() {
    if (document.getElementById('scienceCalcOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'scienceCalcOverlay';
    overlay.className = 'science-calc-overlay';
    overlay.innerHTML = `
      <div class="science-calc-window" role="dialog" aria-modal="true">
        <div class="science-calc-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🧮</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Kalkulatori Shkencor &amp; Konstantet Fizike</h2>
              <div style="font-size:12px;color:var(--text-muted)">Llogaritje matematikore, funksione trigonometrike dhe konstante universale</div>
            </div>
          </div>
          <button id="closeScienceCalcBtn" class="school-os-close-btn" title="Mbyll Kalkulatorin">×</button>
        </div>

        <div class="science-calc-body">
          <!-- Left: Keypad Pane -->
          <div class="calc-keypad-pane">
            <div class="calc-display">
              <div class="calc-screen-expr" id="calcExprScreen"></div>
              <div class="calc-screen-val" id="calcValScreen">0</div>
            </div>

            <div class="calc-grid">
              <button class="calc-btn fn" data-fn="sin">sin</button>
              <button class="calc-btn fn" data-fn="cos">cos</button>
              <button class="calc-btn fn" data-fn="tan">tan</button>
              <button class="calc-btn fn" data-fn="sqrt">√</button>
              <button class="calc-btn op" id="calcClearBtn">C</button>

              <button class="calc-btn fn" data-fn="ln">ln</button>
              <button class="calc-btn fn" data-fn="log">log</button>
              <button class="calc-btn fn" data-fn="pi">π</button>
              <button class="calc-btn fn" data-fn="e_const">e</button>
              <button class="calc-btn op" data-val="/">÷</button>

              <button class="calc-btn" data-val="7">7</button>
              <button class="calc-btn" data-val="8">8</button>
              <button class="calc-btn" data-val="9">9</button>
              <button class="calc-btn fn" data-fn="pow">xʸ</button>
              <button class="calc-btn op" data-val="*">×</button>

              <button class="calc-btn" data-val="4">4</button>
              <button class="calc-btn" data-val="5">5</button>
              <button class="calc-btn" data-val="6">6</button>
              <button class="calc-btn op" data-val="(">(</button>
              <button class="calc-btn op" data-val="-">−</button>

              <button class="calc-btn" data-val="1">1</button>
              <button class="calc-btn" data-val="2">2</button>
              <button class="calc-btn" data-val="3">3</button>
              <button class="calc-btn op" data-val=")">)</button>
              <button class="calc-btn op" data-val="+">+</button>

              <button class="calc-btn" data-val="0" style="grid-column: span 2">0</button>
              <button class="calc-btn" data-val=".">.</button>
              <button class="calc-btn equals" id="calcEqualsBtn" style="grid-column: span 2">=</button>
            </div>
          </div>

          <!-- Right: Constants Explorer -->
          <div class="calc-constants-pane">
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">🔬 KONSTANTET UNIVERSALE:</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:12px">Kliko një konstante për ta futur në llogaritje:</div>
            <div id="calcConstantsList" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderConstants();
  }

  function wireEvents() {
    const overlay = document.getElementById('scienceCalcOverlay');
    document.getElementById('closeScienceCalcBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.querySelectorAll('.calc-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => appendToExpression(btn.dataset.val));
    });

    document.querySelectorAll('.calc-btn[data-fn]').forEach(btn => {
      btn.addEventListener('click', () => applyFunction(btn.dataset.fn));
    });

    document.getElementById('calcClearBtn')?.addEventListener('click', clearCalculator);
    document.getElementById('calcEqualsBtn')?.addEventListener('click', evaluateExpression);
  }

  function renderConstants() {
    const listEl = document.getElementById('calcConstantsList');
    if (!listEl) return;

    listEl.innerHTML = CONSTANTS.map(c => `
      <div class="const-card" data-val="${c.val}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:13px;color:var(--text)">${c.symbol}</strong>
          <span style="font-size:11px;color:#6366f1;font-weight:700">${c.val.toExponential ? c.val.toExponential(4) : c.val}</span>
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${c.name} (${c.unit})</div>
      </div>
    `).join('');

    listEl.querySelectorAll('.const-card').forEach(card => {
      card.addEventListener('click', () => {
        appendToExpression(card.dataset.val);
      });
    });
  }

  function appendToExpression(str) {
    currentExpression += str;
    updateDisplay();
  }

  function applyFunction(fn) {
    if (fn === 'sin') currentExpression += 'Math.sin(';
    else if (fn === 'cos') currentExpression += 'Math.cos(';
    else if (fn === 'tan') currentExpression += 'Math.tan(';
    else if (fn === 'sqrt') currentExpression += 'Math.sqrt(';
    else if (fn === 'ln') currentExpression += 'Math.log(';
    else if (fn === 'log') currentExpression += 'Math.log10(';
    else if (fn === 'pi') currentExpression += 'Math.PI';
    else if (fn === 'e_const') currentExpression += 'Math.E';
    else if (fn === 'pow') currentExpression += '**';
    updateDisplay();
  }

  function clearCalculator() {
    currentExpression = '';
    currentResult = '0';
    updateDisplay();
  }

  function evaluateExpression() {
    if (!currentExpression) return;
    try {
      // Safe sanitized arithmetic evaluation
      const sanitized = currentExpression
        .replace(/Math\.sin\(/g, 'Math.sin(')
        .replace(/Math\.cos\(/g, 'Math.cos(')
        .replace(/Math\.tan\(/g, 'Math.tan(')
        .replace(/Math\.sqrt\(/g, 'Math.sqrt(')
        .replace(/Math\.log\(/g, 'Math.log(')
        .replace(/Math\.log10\(/g, 'Math.log10(')
        .replace(/Math\.PI/g, String(Math.PI))
        .replace(/Math\.E/g, String(Math.E));

      // Validate allowed characters only
      if (!/^[0-9+\-*/()., eE*MathsincotaqrglPI]+$/.test(sanitized)) {
        throw new Error('Invalid characters');
      }

      const evalFn = new Function(`return (${sanitized});`);
      const val = evalFn();
      currentResult = Number.isFinite(val) ? (Number.isInteger(val) ? String(val) : parseFloat(val.toFixed(8)).toString()) : 'Error';
    } catch (e) {
      currentResult = 'Error';
    }
    updateDisplay();
  }

  function updateDisplay() {
    const exprEl = document.getElementById('calcExprScreen');
    const valEl = document.getElementById('calcValScreen');
    if (exprEl) exprEl.textContent = currentExpression;
    if (valEl) valEl.textContent = currentResult;
  }

  function open() {
    init();
    const overlay = document.getElementById('scienceCalcOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('scienceCalcOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.ScienceCalculator = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
