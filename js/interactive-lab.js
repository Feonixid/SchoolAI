// js/interactive-lab.js — Next-Generation Interactive Visual Learning Lab
// ===================================================================
// Hands-on science, math & AI simulations students can explore:
// 1. Physics: Projectile Motion Simulator (Canvas 2D)
// 2. Biology: Interactive Punnett Square Generator
// 3. Chemistry: pH Scale & Acid-Base Visualizer
// 4. Math: Live Function Grapher (y = f(x))
// 5. History: Interactive Timeline Builder
// 6. AI & Deep Learning: Neural Network Playground (Live 2D Decision Boundary)
// 7. AI Foundations: Activation Functions, Loss & Regularization Explorer
// ===================================================================

(function () {
  'use strict';

  let activeLabTab = 'physics';
  let physicsAnimFrame = null;
  let aiTrainingAnimFrame = null;
  let aiNetwork = null;
  let aiTraining = false;

  // ----------------------------------------------------------------
  // DOM INJECTION
  // ----------------------------------------------------------------
  function init() {
    if (document.getElementById('interactiveLabOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'interactiveLabOverlay';
    overlay.className = 'lab-modal-overlay';
    overlay.innerHTML = `
      <div class="lab-window" role="dialog" aria-modal="true">
        <div class="lab-header">
          <div class="lab-brand">
            <span style="font-size:24px">🔬</span>
            <h2>Interactive Learning Lab</h2>
          </div>
          <button id="closeLabBtn" class="school-os-close-btn" title="Close Lab (Esc)">×</button>
        </div>
        <div class="lab-body">
          <div class="lab-dock">
            <button class="lab-nav-btn active" data-lab="physics"><span>🚀</span> Projectile Motion</button>
            <button class="lab-nav-btn" data-lab="ai"><span>🤖</span> AI Neural Network</button>
            <button class="lab-nav-btn" data-lab="activations"><span>⚡</span> Activation &amp; Loss</button>
            <button class="lab-nav-btn" data-lab="algorithms"><span>🔢</span> Algorithm Animator</button>
            <button class="lab-nav-btn" data-lab="circuits"><span>⚡</span> DC Circuit Lab</button>
            <button class="lab-nav-btn" data-lab="reactions"><span>⚗️</span> Chemical Equations</button>
            <button class="lab-nav-btn" data-lab="economics"><span>📊</span> Market Equilibrium</button>
            <button class="lab-nav-btn" data-lab="dna"><span>🧬</span> DNA &amp; Proteins</button>
            <button class="lab-nav-btn" data-lab="biology"><span>🌱</span> Punnett Square</button>
            <button class="lab-nav-btn" data-lab="chemistry"><span>🧪</span> pH Scale</button>
            <button class="lab-nav-btn" data-lab="math"><span>📈</span> Function Grapher</button>
            <button class="lab-nav-btn" data-lab="timeline"><span>🏛️</span> History Timeline</button>
            <button class="lab-nav-btn" data-lab="astronomy"><span>🪐</span> Gravity &amp; Orbits</button>
          </div>
          <div class="lab-content">

            <!-- 1. PHYSICS: Projectile Motion -->
            <div id="lab-physics" class="lab-simulation-pane active">
              <h3 style="margin:0 0 4px;font-size:18px">🚀 Projectile Motion Simulator</h3>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px">Adjust velocity and launch angle, then fire to see the trajectory in real time.</p>
              <div class="sim-canvas-box">
                <canvas id="physicsCanvas" class="sim-canvas" width="760" height="280"></canvas>
              </div>
              <div class="sim-controls-grid">
                <div class="sim-control-group">
                  <label>Initial Velocity (m/s) <span id="physVelVal">30</span></label>
                  <input type="range" id="physVelocity" min="5" max="80" value="30" />
                </div>
                <div class="sim-control-group">
                  <label>Launch Angle (°) <span id="physAngVal">45</span></label>
                  <input type="range" id="physAngle" min="5" max="85" value="45" />
                </div>
                <div class="sim-control-group">
                  <label>Gravity (m/s²) <span id="physGravVal">9.8</span></label>
                  <input type="range" id="physGravity" min="1" max="25" step="0.1" value="9.8" />
                </div>
                <div class="sim-control-group" style="justify-content:flex-end">
                  <button id="physFireBtn" class="os-btn-primary" style="margin-top:auto">🚀 Launch Projectile</button>
                </div>
              </div>
              <div id="physicsResults" style="margin-top:12px;font-size:13px;color:var(--text-muted)"></div>
            </div>

            <!-- 2. AI & NEURAL NETWORK PLAYGROUND -->
            <div id="lab-ai" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <h3 style="margin:0;font-size:18px">🤖 Neural Network &amp; Decision Boundary Playground</h3>
                <div style="display:flex;gap:8px">
                  <button id="aiTrainToggleBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">▶ Start Training</button>
                  <button id="aiResetWeightsBtn" class="ai-pill-btn">🔄 Reset</button>
                </div>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Train a real Multi-Layer Perceptron (MLP) in your browser. Watch weights update and decision boundaries form live.</p>
              
              <div class="ai-lab-layout">
                <div>
                  <div class="sim-canvas-box" style="margin-bottom:10px">
                    <canvas id="aiBoundaryCanvas" width="360" height="300" style="width:100%;height:300px;display:block"></canvas>
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                    <span style="font-size:12px;font-weight:700;color:var(--text-muted)">Dataset:</span>
                    <button class="ai-pill-btn active ai-data-btn" data-dataset="circle">🍩 Circle</button>
                    <button class="ai-pill-btn ai-data-btn" data-dataset="clusters">🎯 Clusters</button>
                    <button class="ai-pill-btn ai-data-btn" data-dataset="xor">🔲 XOR</button>
                    <button class="ai-pill-btn ai-data-btn" data-dataset="spiral">🌀 Spiral</button>
                  </div>
                </div>

                <div>
                  <div class="ai-card">
                    <div class="ai-stat-row">
                      <span>Epoch:</span>
                      <strong id="aiEpochCount">0</strong>
                    </div>
                    <div class="ai-stat-row">
                      <span>Training Loss (BCE):</span>
                      <strong id="aiLossValue" style="color:#ef4444">0.0000</strong>
                    </div>
                    
                    <div class="sim-control-group" style="margin-top:10px">
                      <label>Activation Function: <span id="aiActDisplay" style="font-weight:700;color:#6366f1">ReLU</span></label>
                      <select id="aiActivationSelect">
                        <option value="relu" selected>ReLU (max(0, x))</option>
                        <option value="tanh">Tanh (Hyperbolic Tangent)</option>
                        <option value="sigmoid">Sigmoid (1 / (1 + e^-x))</option>
                        <option value="leaky_relu">Leaky ReLU (max(0.01x, x))</option>
                      </select>
                    </div>

                    <div class="sim-control-group" style="margin-top:10px">
                      <label>Regularization: <span id="aiRegDisplay" style="font-weight:700;color:#6366f1">L2 (Ridge)</span></label>
                      <select id="aiRegularizationSelect">
                        <option value="none">None</option>
                        <option value="l2" selected>L2 (Weight Decay / Ridge)</option>
                        <option value="l1">L1 (Lasso / Sparsity)</option>
                      </select>
                    </div>

                    <div class="sim-control-group" style="margin-top:10px">
                      <label>Regularization Rate (λ): <span id="aiRegRateVal">0.001</span></label>
                      <input type="range" id="aiRegRateSlider" min="0" max="0.05" step="0.001" value="0.001" />
                    </div>

                    <div class="sim-control-group" style="margin-top:10px">
                      <label>Learning Rate (α): <span id="aiLrVal">0.08</span></label>
                      <input type="range" id="aiLrSlider" min="0.01" max="0.5" step="0.01" value="0.08" />
                    </div>

                    <div class="sim-control-group" style="margin-top:10px">
                      <label>Hidden Neurons: <span id="aiNeuronsVal">6</span></label>
                      <input type="range" id="aiNeuronsSlider" min="2" max="12" step="1" value="6" />
                    </div>
                  </div>

                  <div class="ai-concept-box">
                    <strong>💡 AI Pedagogical Insight:</strong>
                    <div id="aiConceptExplanation">Non-linear activations like ReLU or Tanh allow neural networks to bend decision boundaries to separate circular or spiral data.</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. ACTIVATION & LOSS EXPLORER -->
            <div id="lab-activations" class="lab-simulation-pane">
              <h3 style="margin:0 0 4px;font-size:18px">⚡ Activation Functions &amp; Loss Visualizer</h3>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Explore why activation functions provide non-linearity and how derivatives guide gradient descent.</p>
              
              <div class="ai-lab-layout">
                <div>
                  <div class="sim-canvas-box">
                    <canvas id="actPlotCanvas" width="360" height="260" style="width:100%;height:260px;display:block"></canvas>
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="ai-pill-btn active act-select-btn" data-act="relu">ReLU</button>
                    <button class="ai-pill-btn act-select-btn" data-act="sigmoid">Sigmoid</button>
                    <button class="ai-pill-btn act-select-btn" data-act="tanh">Tanh</button>
                    <button class="ai-pill-btn act-select-btn" data-act="leaky_relu">Leaky ReLU</button>
                    <button class="ai-pill-btn act-select-btn" data-act="gelu">GELU</button>
                    <button class="ai-pill-btn act-select-btn" data-act="linear">Linear</button>
                  </div>
                </div>

                <div>
                  <div class="ai-card">
                    <div class="sim-control-group">
                      <label>Input Value x: <span id="actInputVal" style="font-size:18px;font-weight:800;color:#6366f1">1.0</span></label>
                      <input type="range" id="actInputSlider" min="-5" max="5" step="0.1" value="1.0" />
                    </div>
                    
                    <div style="margin-top:14px">
                      <div class="ai-stat-row">
                        <span>Function Output f(x):</span>
                        <strong id="actOutputVal" style="color:#22c55e;font-size:15px">1.000</strong>
                      </div>
                      <div class="ai-stat-row">
                        <span>Derivative f'(x) (Gradient):</span>
                        <strong id="actDerivVal" style="color:#3b82f6;font-size:15px">1.000</strong>
                      </div>
                    </div>

                    <div style="margin-top:14px;padding:10px 12px;background:rgba(99,102,241,0.06);border-radius:8px">
                      <div style="font-size:12px;font-weight:700;color:var(--text)">Formula:</div>
                      <code id="actFormulaDisplay" style="font-family:'Cascadia Code',monospace;font-size:13px;color:#6366f1">f(x) = max(0, x)</code>
                    </div>
                  </div>

                  <div class="ai-concept-box" id="actExplanationBox">
                    <strong>Why ReLU?</strong> Fast computation and solves vanishing gradient for positive values. Used in modern Transformer and CNN architectures.
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. BIOLOGY: Punnett Square -->
            <div id="lab-biology" class="lab-simulation-pane">
              <h3 style="margin:0 0 4px;font-size:18px">🧬 Interactive Punnett Square</h3>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px">Enter parent genotypes to visualize offspring phenotype ratios.</p>
              <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
                <div>
                  <div style="display:flex;gap:12px;margin-bottom:16px">
                    <div class="sim-control-group">
                      <label>Parent 1 Genotype</label>
                      <select id="punnettP1">
                        <option value="AA">AA (Homozygous Dominant)</option>
                        <option value="Aa" selected>Aa (Heterozygous)</option>
                        <option value="aa">aa (Homozygous Recessive)</option>
                      </select>
                    </div>
                    <div class="sim-control-group">
                      <label>Parent 2 Genotype</label>
                      <select id="punnettP2">
                        <option value="AA">AA (Homozygous Dominant)</option>
                        <option value="Aa" selected>Aa (Heterozygous)</option>
                        <option value="aa">aa (Homozygous Recessive)</option>
                      </select>
                    </div>
                  </div>
                  <div id="punnettGrid" style="display:flex;justify-content:center"></div>
                  <div id="punnettResults" style="margin-top:14px;font-size:13.5px;line-height:1.7"></div>
                </div>
              </div>
            </div>

            <!-- 5. CHEMISTRY: pH Scale -->
            <div id="lab-chemistry" class="lab-simulation-pane">
              <h3 style="margin:0 0 4px;font-size:18px">⚗️ pH Scale &amp; Acid-Base Visualizer</h3>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px">Slide to explore the pH spectrum. Common substances are shown at their approximate pH levels.</p>
              <div style="max-width:700px">
                <div class="ph-scale-bar">
                  <div id="phPin" class="ph-indicator-pin" style="left:50%"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text-muted)">
                  <span>0 (Strong Acid)</span><span>7 (Neutral)</span><span>14 (Strong Base)</span>
                </div>
                <div class="sim-control-group" style="margin-top:20px">
                  <label>pH Value <span id="phDisplay" style="font-size:24px;font-weight:800;color:#6366f1">7.0</span></label>
                  <input type="range" id="phSlider" min="0" max="14" step="0.1" value="7" style="width:100%" />
                </div>
                <div id="phSubstance" style="margin-top:16px;padding:14px 18px;border-radius:12px;background:rgba(148,163,184,0.08);font-size:14px;font-weight:600;line-height:1.6"></div>
              </div>
            </div>

            <!-- 6. MATH: Function Grapher -->
            <div id="lab-math" class="lab-simulation-pane">
              <h3 style="margin:0 0 4px;font-size:18px">📈 Live Function Grapher</h3>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px">Type a math expression using <code>x</code> and see it graphed instantly.</p>
              <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">
                <input id="mathFuncInput" type="text" value="Math.sin(x)" placeholder="e.g. x*x, Math.sin(x), 2*x+1" style="flex:1;min-width:200px;padding:10px 14px;border-radius:10px;border:1px solid var(--border,#cbd5e1);background:var(--input-bg,#f8fafc);color:var(--text);font-family:'Cascadia Code',monospace;font-size:14px;outline:none" />
                <button id="mathPlotBtn" class="os-btn-primary">📊 Plot Graph</button>
              </div>
              <div class="sim-canvas-box">
                <canvas id="mathCanvas" class="sim-canvas" width="760" height="300"></canvas>
              </div>
              <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                <button class="scaffold-btn math-preset" data-fn="x*x">y = x²</button>
                <button class="scaffold-btn math-preset" data-fn="Math.sin(x)">y = sin(x)</button>
                <button class="scaffold-btn math-preset" data-fn="Math.cos(x)">y = cos(x)</button>
                <button class="scaffold-btn math-preset" data-fn="Math.abs(x)">y = |x|</button>
                <button class="scaffold-btn math-preset" data-fn="1/x">y = 1/x</button>
                <button class="scaffold-btn math-preset" data-fn="Math.sqrt(Math.abs(x))">y = √|x|</button>
                <button class="scaffold-btn math-preset" data-fn="x*x*x - 3*x">y = x³ - 3x</button>
              </div>
            </div>

            <!-- 7. HISTORY: Timeline -->
            <div id="lab-timeline" class="lab-simulation-pane">
              <h3 style="margin:0 0 4px;font-size:18px">🏛️ Interactive History Timeline</h3>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 12px">Key events in Albanian and world history arranged chronologically.</p>
              <div id="timelineContainer" style="position:relative;padding-left:40px;border-left:3px solid #6366f1;margin-left:20px"></div>
            </div>

            <!-- 8. COMPUTER SCIENCE: Algorithm Animator -->
            <div id="lab-algorithms" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="margin:0;font-size:18px">🔢 Visual Algorithm &amp; Data Structures Animator</h3>
                <div style="display:flex;gap:6px">
                  <button id="algoStartBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">▶ Start Sort</button>
                  <button id="algoShuffleBtn" class="ai-pill-btn">🔀 Shuffle Array</button>
                </div>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Step through sorting and search algorithms to see comparisons, swaps, and Big-O efficiency in action.</p>

              <div id="algoBarsContainer" class="algo-bars-container"></div>

              <div class="ai-lab-layout">
                <div class="ai-card">
                  <div class="sim-control-group">
                    <label>Algorithm Selection</label>
                    <select id="algoSelect">
                      <option value="bubble" selected>Bubble Sort — O(n²)</option>
                      <option value="quick">Quick Sort — O(n log n)</option>
                      <option value="selection">Selection Sort — O(n²)</option>
                      <option value="binary_search">Binary Search — O(log n)</option>
                    </select>
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Array Size: <span id="algoSizeVal">18</span></label>
                    <input type="range" id="algoSizeSlider" min="8" max="28" step="1" value="18" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Animation Speed: <span id="algoSpeedVal">Normal</span></label>
                    <input type="range" id="algoSpeedSlider" min="10" max="300" step="10" value="80" />
                  </div>
                </div>

                <div class="ai-card">
                  <div class="ai-stat-row">
                    <span>Time Complexity:</span>
                    <span id="algoTimeComplexity" class="complexity-badge">O(n²) Average</span>
                  </div>
                  <div class="ai-stat-row">
                    <span>Space Complexity:</span>
                    <span id="algoSpaceComplexity" class="complexity-badge">O(1) Auxiliary</span>
                  </div>
                  <div class="ai-stat-row">
                    <span>Comparisons:</span>
                    <strong id="algoComparisonsCount">0</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Swaps / Writes:</span>
                    <strong id="algoSwapsCount">0</strong>
                  </div>

                  <div class="ai-concept-box" id="algoExplanationBox" style="margin-top:10px">
                    <b>Bubble Sort:</b> Continuously steps through the array, comparing adjacent elements and swapping them if they are in the wrong order.
                  </div>
                </div>
              </div>
            </div>

            <!-- 9. PHYSICS: DC Circuit & Electricity Lab -->
            <div id="lab-circuits" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="margin:0;font-size:18px">⚡ DC Circuit &amp; Ohm's Law Lab</h3>
                <div style="display:flex;gap:6px">
                  <button id="circuitSwitchBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">🟢 Switch: ON</button>
                </div>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Adjust voltage and resistor values to observe electron flow, current, and light bulb power dissipation in real time.</p>

              <div class="sim-canvas-box">
                <canvas id="circuitCanvas" class="sim-canvas" width="760" height="240"></canvas>
              </div>

              <div class="ai-lab-layout">
                <div class="ai-card">
                  <div class="sim-control-group">
                    <label>Battery Voltage: <span id="circuitVoltVal">9.0 V</span></label>
                    <input type="range" id="circuitVoltSlider" min="1.5" max="24" step="0.5" value="9" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Resistor R₁: <span id="circuitR1Val">20 Ω</span></label>
                    <input type="range" id="circuitR1Slider" min="5" max="100" step="1" value="20" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Resistor R₂ (Series/Parallel): <span id="circuitR2Val">30 Ω</span></label>
                    <input type="range" id="circuitR2Slider" min="5" max="100" step="1" value="30" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Circuit Mode</label>
                    <select id="circuitModeSelect">
                      <option value="simple" selected>Simple (Single Resistor + Bulb)</option>
                      <option value="series">Series Resistors (R₁ + R₂)</option>
                      <option value="parallel">Parallel Resistors (R₁ || R₂)</option>
                    </select>
                  </div>
                </div>

                <div class="ai-card">
                  <div class="ai-stat-row">
                    <span>Equivalent Resistance (R_eq):</span>
                    <strong id="circuitReqDisplay">20.0 Ω</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Total Current (I = V / R):</span>
                    <strong id="circuitCurrentDisplay" style="color:#3b82f6">0.45 A (450 mA)</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Power Dissipated (P = V × I):</span>
                    <strong id="circuitPowerDisplay" style="color:#eab308">4.05 W</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Bulb Relative Brightness:</span>
                    <strong id="circuitBulbDisplay" style="color:#10b981">81%</strong>
                  </div>

                  <div class="ai-concept-box" style="margin-top:10px">
                    <b>Ohm's Law:</b> <code>V = I × R</code>. Higher resistance restricts electron flow, reducing current and bulb luminescence.
                  </div>
                </div>
              </div>
            </div>

            <!-- 10. CHEMISTRY: Chemical Equation Balancer & Stoichiometry -->
            <div id="lab-reactions" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="margin:0;font-size:18px">⚗️ Chemical Reaction Balancer &amp; Conservation of Mass</h3>
                <button id="reactionBalanceBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">⚖️ Balance Equation</button>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Input any chemical equation to automatically balance stoichiometric coefficients and verify atomic conservation.</p>

              <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
                <input id="reactionInput" type="text" value="CH4 + O2 -> CO2 + H2O" placeholder="e.g. C3H8 + O2 -> CO2 + H2O" style="flex:1;min-width:260px;padding:10px 14px;border-radius:10px;border:1px solid var(--border,#cbd5e1);background:var(--input-bg,#f8fafc);color:var(--text);font-family:'Cascadia Code',monospace;font-size:14px;font-weight:700;outline:none" />
              </div>

              <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
                <button class="ai-pill-btn reaction-preset-btn" data-eq="CH4 + O2 -> CO2 + H2O">Methane Combustion</button>
                <button class="ai-pill-btn reaction-preset-btn" data-eq="H2 + O2 -> H2O">Water Synthesis</button>
                <button class="ai-pill-btn reaction-preset-btn" data-eq="Fe + O2 -> Fe2O3">Rusting of Iron</button>
                <button class="ai-pill-btn reaction-preset-btn" data-eq="N2 + H2 -> NH3">Haber Ammonia</button>
                <button class="ai-pill-btn reaction-preset-btn" data-eq="Al + HCl -> AlCl3 + H2">Aluminum Acid</button>
                <button class="ai-pill-btn reaction-preset-btn" data-eq="C6H12O6 + O2 -> CO2 + H2O">Cellular Respiration</button>
              </div>

              <div class="ai-lab-layout">
                <div class="ai-card">
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">BALANCED EQUATION (EKUACIONI I BARAZUAR):</div>
                  <div id="reactionBalancedOutput" style="font-size:18px;font-weight:800;color:#6366f1;font-family:'Cascadia Code',monospace;padding:12px;background:rgba(99,102,241,0.08);border-radius:10px;margin-bottom:10px">
                    1 CH₄ + 2 O₂ → 1 CO₂ + 2 H₂O
                  </div>
                  <div id="reactionStatusBadge" style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;background:#10b98120;color:#10b981">
                    ✅ Ligji i Ruajtjes së Masës i Plotësuar
                  </div>
                </div>

                <div class="ai-card">
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">ATOMIC BALANCE AUDIT:</div>
                  <table class="reaction-atom-table" id="reactionAtomTable">
                    <thead>
                      <tr><th>Element</th><th>Reactants</th><th>Products</th><th>Status</th></tr>
                    </thead>
                    <tbody id="reactionAtomTableBody">
                      <tr><td>C</td><td>1</td><td>1</td><td>✅ OK</td></tr>
                      <tr><td>H</td><td>4</td><td>4</td><td>✅ OK</td></tr>
                      <tr><td>O</td><td>4</td><td>4</td><td>✅ OK</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 11. ECONOMICS: Market Equilibrium (Supply & Demand) -->
            <div id="lab-economics" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="margin:0;font-size:18px">📊 Market Equilibrium (Supply &amp; Demand)</h3>
                <button id="econResetBtn" class="ai-pill-btn">🔄 Reset Sliders</button>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Manipulate market forces to observe shifting equilibrium price (P*) and quantity (Q*), surpluses, and shortages.</p>

              <div class="sim-canvas-box">
                <canvas id="econCanvas" class="sim-canvas" width="760" height="250"></canvas>
              </div>

              <div class="ai-lab-layout">
                <div class="ai-card">
                  <div class="sim-control-group">
                    <label>Demand Shift (Income, Preferences): <span id="econDemandShiftVal">0</span></label>
                    <input type="range" id="econDemandShiftSlider" min="-40" max="40" step="5" value="0" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Supply Shift (Technology, Input Costs): <span id="econSupplyShiftVal">0</span></label>
                    <input type="range" id="econSupplyShiftSlider" min="-40" max="40" step="5" value="0" />
                  </div>
                </div>

                <div class="ai-card">
                  <div class="ai-stat-row">
                    <span>Equilibrium Price (P*):</span>
                    <strong id="econPriceDisplay" style="color:#6366f1">€50.00</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Equilibrium Quantity (Q*):</span>
                    <strong id="econQtyDisplay" style="color:#10b981">50 units</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Consumer Surplus (CS):</span>
                    <strong id="econCSDisplay">€1,250.00</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Producer Surplus (PS):</span>
                    <strong id="econPSDisplay">€1,250.00</strong>
                  </div>

                  <div class="ai-concept-box" style="margin-top:10px">
                    <b>Market Equilibrium:</b> The price point where Quantity Demanded exactly equals Quantity Supplied ($Q_d = Q_s$).
                  </div>
                </div>
              </div>
            </div>

            <!-- 12. BIOLOGY: DNA Transcription & Translation Protein Synthesizer -->
            <div id="lab-dna" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="margin:0;font-size:18px">🧬 DNA Transcription &amp; Translation Protein Synthesizer</h3>
                <div style="display:flex;gap:6px">
                  <button id="dnaMutateBtn" class="ai-pill-btn">🎲 Mutate Base</button>
                  <button id="dnaResetBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">🔄 Reset DNA</button>
                </div>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Step through transcription of DNA to mRNA, followed by ribosomal translation into an amino acid polypeptide chain.</p>

              <div>
                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:4px">1. TEMPLATE DNA STRAND (3' → 5'):</div>
                <div id="dnaStrandContainer" class="dna-strand-box"></div>

                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:4px">2. TRANSCRIBED mRNA STRAND (5' → 3'):</div>
                <div id="mrnaStrandContainer" class="dna-strand-box"></div>

                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:4px">3. TRANSLATED AMINO ACID POLYPEPTIDE CHAIN:</div>
                <div id="aminoChainContainer" class="amino-chain"></div>
              </div>

              <div class="ai-concept-box" style="margin-top:14px" id="dnaMutationEffectBox">
                <b>Central Dogma:</b> DNA codes for messenger RNA via base pairing ($A \rightarrow U, T \rightarrow A, C \rightarrow G, G \rightarrow C$). Ribosomes read triplets (codons) to assemble proteins.
              </div>
            </div>

            <!-- 13. ASTRONOMY: Gravity & Orbital Mechanics -->
            <div id="lab-astronomy" class="lab-simulation-pane">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="margin:0;font-size:18px">🪐 Gravity &amp; Orbital Mechanics Simulator</h3>
                <div style="display:flex;gap:6px">
                  <button id="orbitLaunchBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">▶ Start Orbit</button>
                  <button id="orbitResetBtn" class="ai-pill-btn">🔄 Reset System</button>
                </div>
              </div>
              <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px">Simulate Newton's Law of Universal Gravitation ($F = G \frac{M m}{r^2}$) and Kepler's laws of planetary motion.</p>

              <div class="sim-canvas-box">
                <canvas id="orbitCanvas" class="sim-canvas" width="760" height="260"></canvas>
              </div>

              <div class="ai-lab-layout">
                <div class="ai-card">
                  <div class="sim-control-group">
                    <label>Star Mass (M): <span id="orbitStarMassVal">1.0 M☉</span></label>
                    <input type="range" id="orbitStarMassSlider" min="0.5" max="3.0" step="0.1" value="1.0" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Initial Velocity (v₀): <span id="orbitVelocityVal">3.8 km/s</span></label>
                    <input type="range" id="orbitVelocitySlider" min="1.0" max="7.0" step="0.1" value="3.8" />
                  </div>

                  <div class="sim-control-group" style="margin-top:10px">
                    <label>Orbit Presets</label>
                    <select id="orbitPresetSelect">
                      <option value="circular" selected>Circular Stable Orbit (e ≈ 0.0)</option>
                      <option value="elliptical">Elliptical Kepler Orbit (e ≈ 0.6)</option>
                      <option value="escape">Hyperbolic Escape Trajectory</option>
                    </select>
                  </div>
                </div>

                <div class="ai-card">
                  <div class="ai-stat-row">
                    <span>Gravitational Force (F):</span>
                    <strong id="orbitForceDisplay" style="color:#6366f1">3.52 × 10²² N</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Orbital Velocity (v):</span>
                    <strong id="orbitCurVelDisplay" style="color:#38bdf8">29.8 km/s</strong>
                  </div>
                  <div class="ai-stat-row">
                    <span>Orbit Status:</span>
                    <strong id="orbitStatusDisplay" style="color:#10b981">Stable Elliptical</strong>
                  </div>

                  <div class="ai-concept-box" style="margin-top:10px">
                    <b>Kepler's First Law:</b> Planets move in elliptical orbits with the central star situated at one of the two focal points.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    wireEvents();
    renderPunnettSquare();
    updatePhDisplay();
    renderTimeline();
    plotMathFunction();
    initAILab();
    renderActivationGraph();
    initAlgoLab();
    initCircuitLab();
    balanceCurrentReaction();
    initEconLab();
    initDnaLab();
    initOrbitLab();
  }

  // ----------------------------------------------------------------
  // EVENT WIRING
  // ----------------------------------------------------------------
  function wireEvents() {
    const overlay = document.getElementById('interactiveLabOverlay');
    document.getElementById('closeLabBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.style.display === 'flex') close();
    });

    document.querySelectorAll('.lab-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lab = btn.dataset.lab;
        document.querySelectorAll('.lab-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.lab === lab));
        document.querySelectorAll('.lab-simulation-pane').forEach(p => p.classList.toggle('active', p.id === `lab-${lab}`));
        activeLabTab = lab;
        if (lab === 'math') plotMathFunction();
        if (lab === 'ai') drawDecisionBoundary();
        if (lab === 'activations') renderActivationGraph();
        if (lab === 'algorithms') renderAlgoBars();
        if (lab === 'circuits') updateCircuitCalculations();
        if (lab === 'reactions') balanceCurrentReaction();
        if (lab === 'economics') drawEconGraph();
        if (lab === 'dna') renderDnaStrands();
        if (lab === 'astronomy') drawOrbitSimulation();
      });
    });

    // Physics controls
    document.getElementById('physVelocity')?.addEventListener('input', (e) => {
      document.getElementById('physVelVal').textContent = e.target.value;
    });
    document.getElementById('physAngle')?.addEventListener('input', (e) => {
      document.getElementById('physAngVal').textContent = e.target.value;
    });
    document.getElementById('physGravity')?.addEventListener('input', (e) => {
      document.getElementById('physGravVal').textContent = e.target.value;
    });
    document.getElementById('physFireBtn')?.addEventListener('click', fireProjectile);

    // Biology controls
    document.getElementById('punnettP1')?.addEventListener('change', renderPunnettSquare);
    document.getElementById('punnettP2')?.addEventListener('change', renderPunnettSquare);

    // Chemistry controls
    document.getElementById('phSlider')?.addEventListener('input', updatePhDisplay);

    // Math controls
    document.getElementById('mathPlotBtn')?.addEventListener('click', plotMathFunction);
    document.getElementById('mathFuncInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') plotMathFunction();
    });
    document.querySelectorAll('.math-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const fnInput = document.getElementById('mathFuncInput');
        if (fnInput) { fnInput.value = btn.dataset.fn; plotMathFunction(); }
      });
    });

    // AI Lab controls
    document.getElementById('aiTrainToggleBtn')?.addEventListener('click', toggleAITraining);
    document.getElementById('aiResetWeightsBtn')?.addEventListener('click', resetAINetwork);
    
    document.querySelectorAll('.ai-data-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-data-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (aiNetwork) {
          aiNetwork.setDataset(btn.dataset.dataset);
          resetAINetwork();
        }
      });
    });

    document.getElementById('aiActivationSelect')?.addEventListener('change', (e) => {
      if (aiNetwork) {
        aiNetwork.activation = e.target.value;
        document.getElementById('aiActDisplay').textContent = e.target.options[e.target.selectedIndex].text.split(' ')[0];
        updateAIExplanation();
      }
    });

    document.getElementById('aiRegularizationSelect')?.addEventListener('change', (e) => {
      if (aiNetwork) {
        aiNetwork.regularization = e.target.value;
        document.getElementById('aiRegDisplay').textContent = e.target.options[e.target.selectedIndex].text.split(' ')[0];
        updateAIExplanation();
      }
    });

    document.getElementById('aiRegRateSlider')?.addEventListener('input', (e) => {
      document.getElementById('aiRegRateVal').textContent = e.target.value;
      if (aiNetwork) aiNetwork.regRate = parseFloat(e.target.value);
    });

    document.getElementById('aiLrSlider')?.addEventListener('input', (e) => {
      document.getElementById('aiLrVal').textContent = e.target.value;
      if (aiNetwork) aiNetwork.learningRate = parseFloat(e.target.value);
    });

    document.getElementById('aiNeuronsSlider')?.addEventListener('input', (e) => {
      document.getElementById('aiNeuronsVal').textContent = e.target.value;
      if (aiNetwork) {
        aiNetwork.hiddenSize = parseInt(e.target.value, 10);
        resetAINetwork();
      }
    });

    // Activation Explorer controls
    document.querySelectorAll('.act-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.act-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderActivationGraph();
      });
    });

    document.getElementById('actInputSlider')?.addEventListener('input', (e) => {
      document.getElementById('actInputVal').textContent = parseFloat(e.target.value).toFixed(1);
      renderActivationGraph();
    });

    // Algorithm Animator controls
    document.getElementById('algoStartBtn')?.addEventListener('click', startAlgorithm);
    document.getElementById('algoShuffleBtn')?.addEventListener('click', () => {
      algoAbort = true;
      algoRunning = false;
      const btn = document.getElementById('algoStartBtn');
      if (btn) btn.textContent = '▶ Start Sort';
      const size = parseInt(document.getElementById('algoSizeSlider')?.value || 18, 10);
      generateAlgoArray(size);
    });
    document.getElementById('algoSelect')?.addEventListener('change', () => {
      updateAlgoComplexity();
      const isBS = document.getElementById('algoSelect')?.value === 'binary_search';
      const btn = document.getElementById('algoStartBtn');
      if (btn) btn.textContent = isBS ? '🔍 Start Search' : '▶ Start Sort';
    });
    document.getElementById('algoSizeSlider')?.addEventListener('input', (e) => {
      document.getElementById('algoSizeVal').textContent = e.target.value;
      algoAbort = true;
      algoRunning = false;
      generateAlgoArray(parseInt(e.target.value, 10));
    });
    document.getElementById('algoSpeedSlider')?.addEventListener('input', (e) => {
      const ms = parseInt(e.target.value, 10);
      document.getElementById('algoSpeedVal').textContent = ms <= 40 ? 'Fast' : (ms >= 150 ? 'Slow' : 'Normal');
    });

    // DC Circuit Lab controls
    document.getElementById('circuitVoltSlider')?.addEventListener('input', updateCircuitCalculations);
    document.getElementById('circuitR1Slider')?.addEventListener('input', updateCircuitCalculations);
    document.getElementById('circuitR2Slider')?.addEventListener('input', updateCircuitCalculations);
    document.getElementById('circuitModeSelect')?.addEventListener('change', updateCircuitCalculations);
    document.getElementById('circuitSwitchBtn')?.addEventListener('click', () => {
      circuitSwitchClosed = !circuitSwitchClosed;
      const btn = document.getElementById('circuitSwitchBtn');
      if (btn) {
        btn.textContent = circuitSwitchClosed ? '🟢 Switch: ON' : '🔴 Switch: OFF';
        btn.style.background = circuitSwitchClosed ? '' : '#ef4444';
      }
      updateCircuitCalculations();
    });

    // Chemical Reaction Balancer controls
    document.getElementById('reactionBalanceBtn')?.addEventListener('click', balanceCurrentReaction);
    document.getElementById('reactionInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') balanceCurrentReaction();
    });
    document.querySelectorAll('.reaction-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('reactionInput');
        if (input) input.value = btn.dataset.eq;
        balanceCurrentReaction();
      });
    });

    // Economics Market Equilibrium controls
    document.getElementById('econDemandShiftSlider')?.addEventListener('input', drawEconGraph);
    document.getElementById('econSupplyShiftSlider')?.addEventListener('input', drawEconGraph);
    document.getElementById('econResetBtn')?.addEventListener('click', () => {
      const d = document.getElementById('econDemandShiftSlider');
      const s = document.getElementById('econSupplyShiftSlider');
      if (d) d.value = 0;
      if (s) s.value = 0;
      drawEconGraph();
    });

    // DNA Transcription & Translation controls
    document.getElementById('dnaMutateBtn')?.addEventListener('click', mutateRandomDnaBase);
    document.getElementById('dnaResetBtn')?.addEventListener('click', () => {
      currentDnaStrand = ['T', 'A', 'C', 'G', 'G', 'A', 'T', 'G', 'C', 'C', 'T', 'A', 'A', 'C', 'T'];
      renderDnaStrands();
      const box = document.getElementById('dnaMutationEffectBox');
      if (box) box.innerHTML = '<b>DNA Reset:</b> Template strand restored to standard beta-globin start sequence.';
    });

    // Astronomy Gravity & Orbits controls
    document.getElementById('orbitLaunchBtn')?.addEventListener('click', startOrbitSimulation);
    document.getElementById('orbitResetBtn')?.addEventListener('click', () => {
      orbitRunning = false;
      const btn = document.getElementById('orbitLaunchBtn');
      if (btn) btn.textContent = '▶ Start Orbit';
      resetOrbitSystem();
    });
    document.getElementById('orbitPresetSelect')?.addEventListener('change', resetOrbitSystem);
    document.getElementById('orbitStarMassSlider')?.addEventListener('input', resetOrbitSystem);
    document.getElementById('orbitVelocitySlider')?.addEventListener('input', () => {
      const v = parseFloat(document.getElementById('orbitVelocitySlider')?.value || 3.8);
      planetVel = { x: 0, y: v };
      document.getElementById('orbitVelocityVal') && (document.getElementById('orbitVelocityVal').textContent = `${v.toFixed(1)} km/s`);
      drawOrbitSimulation();
    });
  }

  // ----------------------------------------------------------------
  // 1. PHYSICS: Projectile Motion
  // ----------------------------------------------------------------
  function fireProjectile() {
    const canvas = document.getElementById('physicsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    const v0 = parseFloat(document.getElementById('physVelocity')?.value || 30);
    const angleDeg = parseFloat(document.getElementById('physAngle')?.value || 45);
    const g = parseFloat(document.getElementById('physGravity')?.value || 9.8);
    const angleRad = angleDeg * Math.PI / 180;
    const vx = v0 * Math.cos(angleRad);
    const vy = v0 * Math.sin(angleRad);

    const tFlight = (2 * vy) / g;
    const maxH = (vy * vy) / (2 * g);
    const range = vx * tFlight;

    const resultsEl = document.getElementById('physicsResults');
    if (resultsEl) {
      resultsEl.innerHTML = `<b>Results:</b> Range = <b>${range.toFixed(2)} m</b> · Max Height = <b>${maxH.toFixed(2)} m</b> · Flight Time = <b>${tFlight.toFixed(2)} s</b>`;
    }

    const margin = 40;
    const scaleX = (W - margin * 2) / Math.max(range, 1);
    const scaleY = (H - margin * 2) / Math.max(maxH * 1.2, 1);
    const scale = Math.min(scaleX, scaleY);

    if (physicsAnimFrame) cancelAnimationFrame(physicsAnimFrame);

    const trail = [];
    let t = 0;
    const dt = 0.02;

    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(148,163,184,0.15)';
      ctx.lineWidth = 1;
      for (let i = margin; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = margin; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - margin);
      ctx.lineTo(W, H - margin);
      ctx.stroke();

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const px = margin + trail[i].x * scale;
        const py = H - margin - trail[i].y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const x = vx * t;
      const y = vy * t - 0.5 * g * t * t;

      if (y >= 0 && t <= tFlight) {
        trail.push({ x, y });
        const bx = margin + x * scale;
        const by = H - margin - y * scale;

        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#f97316';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        t += dt;
        physicsAnimFrame = requestAnimationFrame(animate);
      } else {
        const finalX = margin + range * scale;
        const finalY = H - margin;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(finalX, finalY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`${range.toFixed(1)} m`, finalX - 20, finalY + 16);
      }
    }

    animate();
  }

  // ----------------------------------------------------------------
  // 2. AI & NEURAL NETWORK PLAYGROUND
  // ----------------------------------------------------------------
  class MiniNeuralNet {
    constructor() {
      this.inputSize = 2;
      this.hiddenSize = 6;
      this.outputSize = 1;
      this.activation = 'relu';
      this.regularization = 'l2';
      this.regRate = 0.001;
      this.learningRate = 0.08;
      this.epoch = 0;
      this.dataset = 'circle';
      this.points = [];
      this.initWeights();
      this.generateData();
    }

    initWeights() {
      this.epoch = 0;
      const scale1 = Math.sqrt(2.0 / this.inputSize);
      this.W1 = Array.from({ length: this.inputSize }, () =>
        Array.from({ length: this.hiddenSize }, () => (Math.random() * 2 - 1) * scale1)
      );
      this.b1 = new Array(this.hiddenSize).fill(0);

      const scale2 = Math.sqrt(2.0 / this.hiddenSize);
      this.W2 = Array.from({ length: this.hiddenSize }, () =>
        Array.from({ length: this.outputSize }, () => (Math.random() * 2 - 1) * scale2)
      );
      this.b2 = new Array(this.outputSize).fill(0);
    }

    setDataset(name) {
      this.dataset = name;
      this.generateData();
    }

    generateData() {
      this.points = [];
      const N = 120;
      if (this.dataset === 'circle') {
        for (let i = 0; i < N / 2; i++) {
          const r = Math.random() * 0.45;
          const theta = Math.random() * Math.PI * 2;
          this.points.push({ x1: r * Math.cos(theta), x2: r * Math.sin(theta), y: 1 });
        }
        for (let i = 0; i < N / 2; i++) {
          const r = 0.65 + Math.random() * 0.35;
          const theta = Math.random() * Math.PI * 2;
          this.points.push({ x1: r * Math.cos(theta), x2: r * Math.sin(theta), y: 0 });
        }
      } else if (this.dataset === 'clusters') {
        for (let i = 0; i < N / 2; i++) {
          this.points.push({ x1: -0.5 + (Math.random() - 0.5) * 0.6, x2: -0.5 + (Math.random() - 0.5) * 0.6, y: 1 });
        }
        for (let i = 0; i < N / 2; i++) {
          this.points.push({ x1: 0.5 + (Math.random() - 0.5) * 0.6, x2: 0.5 + (Math.random() - 0.5) * 0.6, y: 0 });
        }
      } else if (this.dataset === 'xor') {
        for (let i = 0; i < N; i++) {
          const x1 = (Math.random() - 0.5) * 1.8;
          const x2 = (Math.random() - 0.5) * 1.8;
          const y = (x1 * x2 > 0) ? 1 : 0;
          this.points.push({ x1, x2, y });
        }
      } else if (this.dataset === 'spiral') {
        for (let i = 0; i < N / 2; i++) {
          const r = (i / (N / 2)) * 0.9;
          const theta = (i / (N / 2)) * Math.PI * 2;
          this.points.push({ x1: r * Math.cos(theta), x2: r * Math.sin(theta), y: 1 });
        }
        for (let i = 0; i < N / 2; i++) {
          const r = (i / (N / 2)) * 0.9;
          const theta = (i / (N / 2)) * Math.PI * 2 + Math.PI;
          this.points.push({ x1: r * Math.cos(theta), x2: r * Math.sin(theta), y: 0 });
        }
      }
    }

    actFn(z) {
      if (this.activation === 'relu') return Math.max(0, z);
      if (this.activation === 'tanh') return Math.tanh(z);
      if (this.activation === 'sigmoid') return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
      if (this.activation === 'leaky_relu') return z > 0 ? z : 0.01 * z;
      return z;
    }

    actDeriv(z, a) {
      if (this.activation === 'relu') return z > 0 ? 1 : 0;
      if (this.activation === 'tanh') return 1 - a * a;
      if (this.activation === 'sigmoid') return a * (1 - a);
      if (this.activation === 'leaky_relu') return z > 0 ? 1 : 0.01;
      return 1;
    }

    sigmoid(z) {
      return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
    }

    forwardSingle(x1, x2) {
      const z1 = new Array(this.hiddenSize);
      const a1 = new Array(this.hiddenSize);
      for (let j = 0; j < this.hiddenSize; j++) {
        z1[j] = x1 * this.W1[0][j] + x2 * this.W1[1][j] + this.b1[j];
        a1[j] = this.actFn(z1[j]);
      }
      let z2 = this.b2[0];
      for (let j = 0; j < this.hiddenSize; j++) {
        z2 += a1[j] * this.W2[j][0];
      }
      const yHat = this.sigmoid(z2);
      return { z1, a1, z2, yHat };
    }

    predict(x1, x2) {
      return this.forwardSingle(x1, x2).yHat;
    }

    trainStep() {
      const N = this.points.length;
      let totalLoss = 0;

      const dW1 = Array.from({ length: this.inputSize }, () => new Array(this.hiddenSize).fill(0));
      const db1 = new Array(this.hiddenSize).fill(0);
      const dW2 = Array.from({ length: this.hiddenSize }, () => new Array(this.outputSize).fill(0));
      const db2 = new Array(this.outputSize).fill(0);

      for (let i = 0; i < N; i++) {
        const { x1, x2, y } = this.points[i];
        const { z1, a1, yHat } = this.forwardSingle(x1, x2);

        // Binary Cross-Entropy Loss
        const eps = 1e-7;
        const loss = -(y * Math.log(yHat + eps) + (1 - y) * Math.log(1 - yHat + eps));
        totalLoss += loss;

        // Output error
        const dZ2 = yHat - y;

        for (let j = 0; j < this.hiddenSize; j++) {
          dW2[j][0] += (a1[j] * dZ2) / N;
        }
        db2[0] += dZ2 / N;

        // Backprop to hidden
        for (let j = 0; j < this.hiddenSize; j++) {
          const dA1 = dZ2 * this.W2[j][0];
          const dZ1 = dA1 * this.actDeriv(z1[j], a1[j]);

          dW1[0][j] += (x1 * dZ1) / N;
          dW1[1][j] += (x2 * dZ1) / N;
          db1[j] += dZ1 / N;
        }
      }

      // Regularization gradient
      if (this.regularization === 'l2') {
        for (let j = 0; j < this.hiddenSize; j++) {
          dW1[0][j] += (this.regRate * this.W1[0][j]);
          dW1[1][j] += (this.regRate * this.W1[1][j]);
          dW2[j][0] += (this.regRate * this.W2[j][0]);
        }
      } else if (this.regularization === 'l1') {
        for (let j = 0; j < this.hiddenSize; j++) {
          dW1[0][j] += (this.regRate * Math.sign(this.W1[0][j]));
          dW1[1][j] += (this.regRate * Math.sign(this.W1[1][j]));
          dW2[j][0] += (this.regRate * Math.sign(this.W2[j][0]));
        }
      }

      // Update weights (SGD with learning rate)
      for (let j = 0; j < this.hiddenSize; j++) {
        this.W1[0][j] -= this.learningRate * dW1[0][j];
        this.W1[1][j] -= this.learningRate * dW1[1][j];
        this.b1[j] -= this.learningRate * db1[j];
        this.W2[j][0] -= this.learningRate * dW2[j][0];
      }
      this.b2[0] -= this.learningRate * db2[0];

      this.epoch++;
      return totalLoss / N;
    }
  }

  function initAILab() {
    aiNetwork = new MiniNeuralNet();
    drawDecisionBoundary();
  }

  function toggleAITraining() {
    aiTraining = !aiTraining;
    const btn = document.getElementById('aiTrainToggleBtn');
    if (btn) {
      btn.textContent = aiTraining ? '⏸ Pause Training' : '▶ Start Training';
      btn.style.background = aiTraining ? '#ef4444' : '#6366f1';
    }
    if (aiTraining) {
      runAITrainingLoop();
    }
  }

  function resetAINetwork() {
    if (aiNetwork) {
      aiNetwork.initWeights();
      drawDecisionBoundary();
      document.getElementById('aiEpochCount').textContent = '0';
      document.getElementById('aiLossValue').textContent = '0.0000';
    }
  }

  function runAITrainingLoop() {
    if (!aiTraining || !aiNetwork) return;

    // Run 5 steps per animation frame for smooth speed
    let loss = 0;
    for (let k = 0; k < 5; k++) {
      loss = aiNetwork.trainStep();
    }

    const epochEl = document.getElementById('aiEpochCount');
    const lossEl = document.getElementById('aiLossValue');
    if (epochEl) epochEl.textContent = String(aiNetwork.epoch);
    if (lossEl) lossEl.textContent = loss.toFixed(4);

    drawDecisionBoundary();
    aiTrainingAnimFrame = requestAnimationFrame(runAITrainingLoop);
  }

  function drawDecisionBoundary() {
    const canvas = document.getElementById('aiBoundaryCanvas');
    if (!canvas || !aiNetwork) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const gridRes = 36;
    const cellW = W / gridRes;
    const cellH = H / gridRes;

    // Draw decision boundary gradient grid
    for (let gx = 0; gx < gridRes; gx++) {
      for (let gy = 0; gy < gridRes; gy++) {
        const x1 = (gx / gridRes) * 2 - 1;
        const x2 = (gy / gridRes) * 2 - 1;
        const pred = aiNetwork.predict(x1, x2);

        // Interpolate between Blue (#3b82f6 for 1) and Orange/Red (#f97316 for 0)
        const r = Math.floor(59 + (249 - 59) * (1 - pred));
        const g = Math.floor(130 + (115 - 130) * (1 - pred));
        const b = Math.floor(246 + (22 - 246) * (1 - pred));

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.65)`;
        ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Grid center lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Draw training data points
    aiNetwork.points.forEach(p => {
      const px = ((p.x1 + 1) / 2) * W;
      const py = ((p.x2 + 1) / 2) * H;

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.y === 1 ? '#00f0ff' : '#ff3366';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  function updateAIExplanation() {
    const box = document.getElementById('aiConceptExplanation');
    if (!box || !aiNetwork) return;

    if (aiNetwork.dataset === 'circle' && aiNetwork.activation === 'linear') {
      box.innerHTML = '⚠️ <b>Linear Collapse:</b> A linear activation cannot bend! Notice how it can only create a straight dividing plane, failing to separate concentric circles.';
    } else if (aiNetwork.regularization === 'l2' && aiNetwork.regRate > 0.01) {
      box.innerHTML = '🛡️ <b>L2 Weight Decay:</b> Penalizes large weights, forcing the network to produce smooth, generalized curves instead of wiggly, overfitted edges.';
    } else if (aiNetwork.regularization === 'l1') {
      box.innerHTML = '✂️ <b>L1 Lasso:</b> Drives uninformative connection weights to absolute zero, acting as automatic feature selection.';
    } else {
      box.innerHTML = '💡 <b>Non-Linearity:</b> Stacking neurons with activation functions like ReLU allows the model to compute complex, curved decision surfaces.';
    }
  }

  // ----------------------------------------------------------------
  // 3. ACTIVATION FUNCTIONS & LOSS EXPLORER
  // ----------------------------------------------------------------
  const ACTIVATIONS = {
    relu: {
      fn: (x) => Math.max(0, x),
      deriv: (x) => x > 0 ? 1 : 0,
      formula: 'f(x) = max(0, x)',
      explanation: '<b>ReLU (Rectified Linear Unit):</b> Computationally fast and prevents vanishing gradient for positive inputs. The standard choice in deep learning.'
    },
    sigmoid: {
      fn: (x) => 1 / (1 + Math.exp(-x)),
      deriv: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
      formula: 'f(x) = 1 / (1 + e^-x)',
      explanation: '<b>Sigmoid:</b> Compresses inputs into probabilities (0 to 1). Prone to vanishing gradient when x is very large or very small (|f\'(x)| ≈ 0).'
    },
    tanh: {
      fn: (x) => Math.tanh(x),
      deriv: (x) => 1 - Math.pow(Math.tanh(x), 2),
      formula: 'f(x) = tanh(x) = (e^x - e^-x) / (e^x + e^-x)',
      explanation: '<b>Tanh (Hyperbolic Tangent):</b> Zero-centered (-1 to 1), making gradient descent faster and more balanced than sigmoid.'
    },
    leaky_relu: {
      fn: (x) => x > 0 ? x : 0.01 * x,
      deriv: (x) => x > 0 ? 1 : 0.01,
      formula: 'f(x) = max(0.01x, x)',
      explanation: '<b>Leaky ReLU:</b> Prevents the "Dying ReLU" problem by allowing a small positive gradient (0.01) when x < 0.'
    },
    gelu: {
      fn: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3)))),
      deriv: (x) => {
        const c = Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3));
        const tanhC = Math.tanh(c);
        return 0.5 * (1 + tanhC) + 0.5 * x * (1 - tanhC * tanhC) * Math.sqrt(2 / Math.PI) * (1 + 0.134145 * x * x);
      },
      formula: 'f(x) ≈ x · Φ(x) (Gaussian Error Linear Unit)',
      explanation: '<b>GELU:</b> Smooth probabilistic gate used in state-of-the-art Large Language Models (GPT-4, Gemini, BERT, LLaMA).'
    },
    linear: {
      fn: (x) => x,
      deriv: () => 1,
      formula: 'f(x) = x',
      explanation: '<b>Linear:</b> f\'(x) is constant (1). Cannot learn non-linear boundaries no matter how many layers are stacked.'
    }
  };

  function renderActivationGraph() {
    const canvas = document.getElementById('actPlotCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const activeBtn = document.querySelector('.act-select-btn.active');
    const actKey = activeBtn ? activeBtn.dataset.act : 'relu';
    const act = ACTIVATIONS[actKey] || ACTIVATIONS.relu;

    const inputX = parseFloat(document.getElementById('actInputSlider')?.value || 1.0);
    const outputY = act.fn(inputX);
    const derivY = act.deriv(inputX);

    document.getElementById('actOutputVal').textContent = outputY.toFixed(3);
    document.getElementById('actDerivVal').textContent = derivY.toFixed(3);
    document.getElementById('actFormulaDisplay').textContent = act.formula;
    document.getElementById('actExplanationBox').innerHTML = act.explanation;

    // Draw graph
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const midX = W / 2, midY = H / 2;
    const scaleX = W / 10;
    const scaleY = H / 6;

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.1)';
    ctx.lineWidth = 1;
    for (let x = -5; x <= 5; x++) {
      const px = midX + x * scaleX;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    }
    for (let y = -3; y <= 3; y++) {
      const py = midY - y * scaleY;
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, H); ctx.stroke();

    // Plot derivative curve (Blue dashed)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let px = 0; px < W; px++) {
      const x = (px - midX) / scaleX;
      const dy = act.deriv(x);
      const py = midY - dy * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot activation curve (Green solid)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 0; px < W; px++) {
      const x = (px - midX) / scaleX;
      const y = act.fn(x);
      const py = midY - y * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Point indicator on curve
    const targetPx = midX + inputX * scaleX;
    const targetPy = midY - outputY * scaleY;
    ctx.beginPath();
    ctx.arc(targetPx, targetPy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Legend
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('— f(x)', 12, 20);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('-- f\'(x) [Gradient]', 60, 20);
  }

  // ----------------------------------------------------------------
  // 4. BIOLOGY: Punnett Square
  // ----------------------------------------------------------------
  function renderPunnettSquare() {
    const p1 = document.getElementById('punnettP1')?.value || 'Aa';
    const p2 = document.getElementById('punnettP2')?.value || 'Aa';
    const grid = document.getElementById('punnettGrid');
    const results = document.getElementById('punnettResults');
    if (!grid) return;

    const alleles1 = [p1[0], p1[1] || p1[0]];
    const alleles2 = [p2[0], p2[1] || p2[0]];

    const offspring = [];
    const table = document.createElement('table');
    table.className = 'punnett-table';

    const headRow = table.insertRow();
    headRow.insertCell().outerHTML = '<th>×</th>';
    alleles2.forEach(a => { headRow.insertCell().outerHTML = `<th>${a}</th>`; });

    alleles1.forEach(a1 => {
      const row = table.insertRow();
      row.insertCell().outerHTML = `<th>${a1}</th>`;
      alleles2.forEach(a2 => {
        const genotype = [a1, a2].sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase())).join('');
        offspring.push(genotype);
        const cell = row.insertCell();
        const isDominant = genotype[0] === genotype[0].toUpperCase();
        cell.textContent = genotype;
        cell.style.color = isDominant ? '#6366f1' : '#64748b';
        cell.style.fontWeight = '800';
      });
    });

    grid.innerHTML = '';
    grid.appendChild(table);

    const counts = {};
    offspring.forEach(g => { counts[g] = (counts[g] || 0) + 1; });

    const dominant = offspring.filter(g => g[0] === g[0].toUpperCase()).length;
    const recessive = offspring.length - dominant;

    if (results) {
      results.innerHTML = `
        <b>Genotype Ratios:</b> ${Object.entries(counts).map(([k, v]) => `${k}: ${v}/${offspring.length}`).join(' · ')}<br>
        <b>Phenotype Ratio:</b> Dominant: ${dominant}/${offspring.length} (${(dominant / offspring.length * 100).toFixed(0)}%) · Recessive: ${recessive}/${offspring.length} (${(recessive / offspring.length * 100).toFixed(0)}%)
      `;
    }
  }

  // ----------------------------------------------------------------
  // 5. CHEMISTRY: pH Scale
  // ----------------------------------------------------------------
  const PH_SUBSTANCES = [
    { min: 0, max: 1, name: '🔋 Battery Acid', type: 'Strong Acid' },
    { min: 1, max: 2.5, name: '🍋 Lemon Juice / Gastric Acid', type: 'Acid' },
    { min: 2.5, max: 3.5, name: '🍊 Vinegar / Orange Juice', type: 'Acid' },
    { min: 3.5, max: 5.5, name: '☕ Coffee / Tomato', type: 'Weak Acid' },
    { min: 5.5, max: 6.5, name: '🥛 Milk / Rain Water', type: 'Slightly Acidic' },
    { min: 6.5, max: 7.5, name: '💧 Pure Water / Blood', type: 'Neutral' },
    { min: 7.5, max: 8.5, name: '🌊 Sea Water / Egg White', type: 'Slightly Alkaline' },
    { min: 8.5, max: 10, name: '🧼 Baking Soda / Antacid', type: 'Base' },
    { min: 10, max: 11.5, name: '🧱 Milk of Magnesia / Ammonia', type: 'Base' },
    { min: 11.5, max: 13, name: '🧴 Bleach / Soapy Water', type: 'Strong Base' },
    { min: 13, max: 14, name: '🔩 Drain Cleaner / NaOH', type: 'Strong Base' }
  ];

  function updatePhDisplay() {
    const slider = document.getElementById('phSlider');
    const display = document.getElementById('phDisplay');
    const pin = document.getElementById('phPin');
    const substEl = document.getElementById('phSubstance');
    if (!slider) return;

    const ph = parseFloat(slider.value);
    if (display) display.textContent = ph.toFixed(1);
    if (pin) pin.style.left = `${(ph / 14) * 100}%`;

    const match = PH_SUBSTANCES.find(s => ph >= s.min && ph < s.max) || PH_SUBSTANCES[PH_SUBSTANCES.length - 1];

    if (substEl) {
      const hColor = ph < 6.5 ? '#ef4444' : (ph > 7.5 ? '#3b82f6' : '#22c55e');
      substEl.innerHTML = `
        <span style="color:${hColor};font-size:16px">${match.name}</span><br>
        <span style="font-size:12.5px;color:var(--text-muted)">Classification: <b>${match.type}</b> · [H⁺] ≈ 10<sup>-${ph.toFixed(1)}</sup> mol/L</span>
      `;
    }
  }

  // ----------------------------------------------------------------
  // 6. MATH: Function Grapher
  // ----------------------------------------------------------------
  function plotMathFunction() {
    const canvas = document.getElementById('mathCanvas');
    const input = document.getElementById('mathFuncInput');
    if (!canvas || !input) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const expr = input.value.trim() || 'Math.sin(x)';

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const midX = W / 2, midY = H / 2;
    const scaleX = 40, scaleY = 40;

    // Grid
    ctx.strokeStyle = 'rgba(148,163,184,0.1)';
    ctx.lineWidth = 1;
    for (let gx = midX % scaleX; gx < W; gx += scaleX) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = midY % scaleY; gy < H; gy += scaleY) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, H); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue;
      const lx = midX + i * scaleX;
      if (lx > 10 && lx < W - 10) { ctx.fillText(String(i), lx - 4, midY + 14); }
      const ly = midY - i * scaleY;
      if (ly > 10 && ly < H - 10) { ctx.fillText(String(i), midX + 6, ly + 4); }
    }

    // Plot function
    try {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;

      for (let px = 0; px < W; px++) {
        const x = (px - midX) / scaleX;
        let y;
        try {
          // eslint-disable-next-line no-new-func
          y = new Function('x', `"use strict"; return (${expr});`)(x);
        } catch { continue; }

        if (!isFinite(y) || Math.abs(y) > 200) {
          started = false;
          continue;
        }

        const py = midY - y * scaleY;
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(`y = ${expr}`, 12, 22);
    } catch (err) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Error: Invalid expression', 20, 30);
    }
  }

  // ----------------------------------------------------------------
  // 7. HISTORY: Interactive Timeline
  // ----------------------------------------------------------------
  const TIMELINE_EVENTS = [
    { year: '168 BC', title: 'Fall of the Illyrian Kingdom', desc: 'Roman conquest of Illyria, marking the end of independent Illyrian states.', color: '#ef4444' },
    { year: '1190',   title: 'Principality of Arbër (Arbëria)', desc: 'The first known Albanian autonomous state, established by Progon.', color: '#f97316' },
    { year: '1444',   title: 'League of Lezhë', desc: 'Convened by George Castriot Skanderbeg, uniting Albanian princes against the Ottoman Empire.', color: '#eab308' },
    { year: '1468',   title: 'Death of Skanderbeg', desc: 'Albania\'s national hero dies. Within 10 years, the Ottomans conquer Albanian territories.', color: '#22c55e' },
    { year: '1878',   title: 'League of Prizren', desc: 'Key event of the Albanian National Awakening (Rilindja Kombëtare), demanding territorial autonomy.', color: '#06b6d4' },
    { year: '1908',   title: 'Congress of Monastir', desc: 'Established the modern Albanian alphabet (Latin script) still used today.', color: '#3b82f6' },
    { year: '1912',   title: 'Albanian Declaration of Independence', desc: 'Proclaimed on 28 November in Vlorë by Ismail Qemali. Albania becomes a sovereign nation.', color: '#6366f1' },
    { year: '1939',   title: 'Italian Invasion of Albania', desc: 'Italy under Mussolini occupies Albania, ending the rule of King Zog I.', color: '#8b5cf6' },
    { year: '1944',   title: 'Liberation of Albania', desc: 'Partisan forces liberate Albania from Nazi German occupation on 29 November.', color: '#d946ef' },
    { year: '1991',   title: 'Fall of Communism in Albania', desc: 'End of one of the most isolationist communist regimes in the world.', color: '#ec4899' },
    { year: '2009',   title: 'Albania Joins NATO', desc: 'Albania becomes a full member of the North Atlantic Treaty Organization.', color: '#10b981' },
    { year: '2014',   title: 'EU Candidate Status', desc: 'Albania is granted official EU candidate status by the European Council.', color: '#6366f1' }
  ];

  function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    container.innerHTML = TIMELINE_EVENTS.map((ev) => `
      <div style="position:relative;margin-bottom:24px;padding-left:24px">
        <div style="position:absolute;left:-48px;top:2px;width:18px;height:18px;border-radius:50%;background:${ev.color};border:3px solid var(--panel,#fff);box-shadow:0 0 0 2px ${ev.color}40"></div>
        <div style="font-size:12px;font-weight:700;color:${ev.color};letter-spacing:0.5px;text-transform:uppercase">${ev.year}</div>
        <div style="font-size:15px;font-weight:700;margin:2px 0">${ev.title}</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.5">${ev.desc}</div>
      </div>
    `).join('');
  }

  // ----------------------------------------------------------------
  // 8. COMPUTER SCIENCE: Algorithm & Data Structures Animator
  // ----------------------------------------------------------------
  let algoArray = [];
  let algoRunning = false;
  let algoAbort = false;
  let algoComparisons = 0;
  let algoSwaps = 0;

  function initAlgoLab() {
    generateAlgoArray(18);
  }

  function generateAlgoArray(size = 18) {
    algoArray = [];
    for (let i = 0; i < size; i++) {
      algoArray.push(Math.floor(Math.random() * 85) + 15);
    }
    algoComparisons = 0;
    algoSwaps = 0;
    updateAlgoStats();
    renderAlgoBars();
  }

  function renderAlgoBars(comparing = [], swapping = [], sorted = [], pivot = -1) {
    const container = document.getElementById('algoBarsContainer');
    if (!container) return;
    container.innerHTML = algoArray.map((val, idx) => {
      const isComp = comparing.includes(idx);
      const isSwap = swapping.includes(idx);
      const isSort = sorted.includes(idx);
      const isPiv = idx === pivot;

      let cls = 'algo-bar';
      if (isPiv) cls += ' pivot';
      else if (isSwap) cls += ' swapping';
      else if (isComp) cls += ' comparing';
      else if (isSort) cls += ' sorted';

      return `<div class="${cls}" style="height:${val * 2}px"><span class="algo-bar-label">${val}</span></div>`;
    }).join('');
  }

  function updateAlgoStats() {
    const compEl = document.getElementById('algoComparisonsCount');
    const swapEl = document.getElementById('algoSwapsCount');
    if (compEl) compEl.textContent = String(algoComparisons);
    if (swapEl) swapEl.textContent = String(algoSwaps);
  }

  function getAlgoDelay() {
    const slider = document.getElementById('algoSpeedSlider');
    return slider ? parseInt(slider.value, 10) : 80;
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function startAlgorithm() {
    if (algoRunning) {
      algoAbort = true;
      algoRunning = false;
      const btn = document.getElementById('algoStartBtn');
      if (btn) btn.textContent = '▶ Start Sort';
      return;
    }

    const algo = document.getElementById('algoSelect')?.value || 'bubble';
    algoRunning = true;
    algoAbort = false;
    algoComparisons = 0;
    algoSwaps = 0;
    updateAlgoStats();

    const btn = document.getElementById('algoStartBtn');
    if (btn) btn.textContent = '⏸ Pause Sort';

    if (algo === 'bubble') await bubbleSort();
    else if (algo === 'selection') await selectionSort();
    else if (algo === 'quick') await quickSortHelper(0, algoArray.length - 1);
    else if (algo === 'binary_search') await binarySearchSim();

    algoRunning = false;
    if (btn) btn.textContent = '▶ Start Sort';
    if (!algoAbort) {
      renderAlgoBars([], [], algoArray.map((_, i) => i));
    }
  }

  async function bubbleSort() {
    const n = algoArray.length;
    const sortedIndices = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (algoAbort) return;
        algoComparisons++;
        updateAlgoStats();
        renderAlgoBars([j, j + 1], [], sortedIndices);
        await sleep(getAlgoDelay());

        if (algoArray[j] > algoArray[j + 1]) {
          algoSwaps++;
          updateAlgoStats();
          const temp = algoArray[j];
          algoArray[j] = algoArray[j + 1];
          algoArray[j + 1] = temp;
          renderAlgoBars([], [j, j + 1], sortedIndices);
          await sleep(getAlgoDelay());
        }
      }
      sortedIndices.push(n - i - 1);
    }
  }

  async function selectionSort() {
    const n = algoArray.length;
    const sortedIndices = [];
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (algoAbort) return;
        algoComparisons++;
        updateAlgoStats();
        renderAlgoBars([minIdx, j], [], sortedIndices);
        await sleep(getAlgoDelay());

        if (algoArray[j] < algoArray[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        algoSwaps++;
        updateAlgoStats();
        const temp = algoArray[i];
        algoArray[i] = algoArray[minIdx];
        algoArray[minIdx] = temp;
        renderAlgoBars([], [i, minIdx], sortedIndices);
        await sleep(getAlgoDelay());
      }
      sortedIndices.push(i);
    }
  }

  async function quickSortHelper(low, high) {
    if (low < high && !algoAbort) {
      const pi = await partition(low, high);
      await quickSortHelper(low, pi - 1);
      await quickSortHelper(pi + 1, high);
    }
  }

  async function partition(low, high) {
    const pivot = algoArray[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (algoAbort) return low;
      algoComparisons++;
      updateAlgoStats();
      renderAlgoBars([j], [], [], high);
      await sleep(getAlgoDelay());

      if (algoArray[j] < pivot) {
        i++;
        algoSwaps++;
        updateAlgoStats();
        const temp = algoArray[i];
        algoArray[i] = algoArray[j];
        algoArray[j] = temp;
        renderAlgoBars([], [i, j], [], high);
        await sleep(getAlgoDelay());
      }
    }
    algoSwaps++;
    updateAlgoStats();
    const temp = algoArray[i + 1];
    algoArray[i + 1] = algoArray[high];
    algoArray[high] = temp;
    renderAlgoBars([], [i + 1, high], []);
    await sleep(getAlgoDelay());
    return i + 1;
  }

  async function binarySearchSim() {
    algoArray.sort((a, b) => a - b);
    renderAlgoBars();
    await sleep(400);

    const target = algoArray[Math.floor(Math.random() * algoArray.length)];
    let left = 0, right = algoArray.length - 1;

    while (left <= right && !algoAbort) {
      const mid = Math.floor((left + right) / 2);
      algoComparisons++;
      updateAlgoStats();
      renderAlgoBars([left, right], [], [], mid);
      await sleep(getAlgoDelay() * 2);

      if (algoArray[mid] === target) {
        renderAlgoBars([], [], [mid]);
        return;
      }
      if (algoArray[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  function updateAlgoComplexity() {
    const algo = document.getElementById('algoSelect')?.value || 'bubble';
    const timeEl = document.getElementById('algoTimeComplexity');
    const spaceEl = document.getElementById('algoSpaceComplexity');
    const expEl = document.getElementById('algoExplanationBox');

    if (algo === 'bubble') {
      if (timeEl) timeEl.textContent = 'O(n²) Average';
      if (spaceEl) spaceEl.textContent = 'O(1) Auxiliary';
      if (expEl) expEl.innerHTML = '<b>Bubble Sort:</b> Continuously steps through the array, comparing adjacent elements and swapping them if out of order.';
    } else if (algo === 'quick') {
      if (timeEl) timeEl.textContent = 'O(n log n) Average';
      if (spaceEl) spaceEl.textContent = 'O(log n) Stack';
      if (expEl) expEl.innerHTML = '<b>Quick Sort:</b> Divide-and-conquer algorithm that selects a pivot and partitions the elements into lesser and greater subarrays.';
    } else if (algo === 'selection') {
      if (timeEl) timeEl.textContent = 'O(n²) Average';
      if (spaceEl) spaceEl.textContent = 'O(1) Auxiliary';
      if (expEl) expEl.innerHTML = '<b>Selection Sort:</b> Finds the minimum element from the unsorted part and places it at the beginning.';
    } else if (algo === 'binary_search') {
      if (timeEl) timeEl.textContent = 'O(log n) Search';
      if (spaceEl) spaceEl.textContent = 'O(1) Auxiliary';
      if (expEl) expEl.innerHTML = '<b>Binary Search:</b> Fast search algorithm on sorted arrays that divides the search interval in half every step.';
    }
  }

  // ----------------------------------------------------------------
  // 9. PHYSICS: DC Circuit & Ohm's Law Lab
  // ----------------------------------------------------------------
  let circuitSwitchClosed = true;
  let circuitElectronOffset = 0;
  let circuitAnimFrame = null;

  function initCircuitLab() {
    updateCircuitCalculations();
    startCircuitAnimation();
  }

  function updateCircuitCalculations() {
    const V = parseFloat(document.getElementById('circuitVoltSlider')?.value || 9);
    const R1 = parseFloat(document.getElementById('circuitR1Slider')?.value || 20);
    const R2 = parseFloat(document.getElementById('circuitR2Slider')?.value || 30);
    const mode = document.getElementById('circuitModeSelect')?.value || 'simple';

    document.getElementById('circuitVoltVal') && (document.getElementById('circuitVoltVal').textContent = `${V.toFixed(1)} V`);
    document.getElementById('circuitR1Val') && (document.getElementById('circuitR1Val').textContent = `${R1} Ω`);
    document.getElementById('circuitR2Val') && (document.getElementById('circuitR2Val').textContent = `${R2} Ω`);

    let Req = R1;
    if (mode === 'series') Req = R1 + R2;
    else if (mode === 'parallel') Req = (R1 * R2) / (R1 + R2);

    const I = circuitSwitchClosed ? V / Req : 0;
    const P = circuitSwitchClosed ? V * I : 0;
    const brightness = Math.min(100, Math.round((P / 5) * 100));

    document.getElementById('circuitReqDisplay') && (document.getElementById('circuitReqDisplay').textContent = `${Req.toFixed(1)} Ω`);
    document.getElementById('circuitCurrentDisplay') && (document.getElementById('circuitCurrentDisplay').textContent = `${I.toFixed(2)} A (${(I * 1000).toFixed(0)} mA)`);
    document.getElementById('circuitPowerDisplay') && (document.getElementById('circuitPowerDisplay').textContent = `${P.toFixed(2)} W`);
    document.getElementById('circuitBulbDisplay') && (document.getElementById('circuitBulbDisplay').textContent = `${brightness}%`);

    drawCircuitDiagram(V, Req, I, brightness);
  }

  function startCircuitAnimation() {
    if (circuitAnimFrame) cancelAnimationFrame(circuitAnimFrame);
    function loop() {
      const canvas = document.getElementById('circuitCanvas');
      if (canvas && activeLabTab === 'circuits') {
        const I = parseFloat(document.getElementById('circuitCurrentDisplay')?.textContent || 0);
        if (circuitSwitchClosed && I > 0) {
          circuitElectronOffset = (circuitElectronOffset + I * 2.5) % 40;
          updateCircuitCalculations();
        }
      }
      circuitAnimFrame = requestAnimationFrame(loop);
    }
    circuitAnimFrame = requestAnimationFrame(loop);
  }

  function drawCircuitDiagram(V, Req, I, brightness) {
    const canvas = document.getElementById('circuitCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const x1 = 80, y1 = 40, x2 = W - 80, y2 = H - 40;

    // Draw main circuit loop wire
    ctx.strokeStyle = circuitSwitchClosed ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
    ctx.closePath();
    ctx.stroke();

    // Draw Battery on Left (x1, (y1+y2)/2)
    const midY = (y1 + y2) / 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x1 - 15, midY - 30, 30, 60);

    // Battery plates
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x1 - 18, midY - 18); ctx.lineTo(x1 + 18, midY - 18); ctx.stroke(); // Long (+)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x1 - 10, midY + 18); ctx.lineTo(x1 + 10, midY + 18); ctx.stroke(); // Short (-)

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`+ ${V.toFixed(1)}V -`, x1 - 25, midY + 4);

    // Draw Resistor on Top (midX, y1)
    const midX = (x1 + x2) / 2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(midX - 35, y1 - 12, 70, 24);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(midX - 30, y1 - 8, 60, 16);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(midX - 30, y1 - 8, 60, 16);

    // Color bands on resistor
    ctx.fillStyle = '#991b1b'; ctx.fillRect(midX - 20, y1 - 8, 4, 16);
    ctx.fillStyle = '#000000'; ctx.fillRect(midX - 10, y1 - 8, 4, 16);
    ctx.fillStyle = '#b45309'; ctx.fillRect(midX + 5, y1 - 8, 4, 16);
    ctx.fillStyle = '#eab308'; ctx.fillRect(midX + 15, y1 - 8, 4, 16);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${Req.toFixed(1)}Ω`, midX - 12, y1 - 14);

    // Draw Light Bulb on Right (x2, midY)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x2 - 25, midY - 25, 50, 50);

    // Glow aura
    if (circuitSwitchClosed && brightness > 0) {
      const grad = ctx.createRadialGradient(x2, midY, 5, x2, midY, 40);
      grad.addColorStop(0, `rgba(250, 204, 21, ${Math.min(1, brightness / 60)})`);
      grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x2, midY, 40, 0, Math.PI * 2); ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x2, midY, 16, 0, Math.PI * 2);
    ctx.fillStyle = circuitSwitchClosed && brightness > 0 ? '#facc15' : '#334155';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bulb filament cross
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x2 - 6, midY - 6); ctx.lineTo(x2 + 6, midY + 6);
    ctx.moveTo(x2 + 6, midY - 6); ctx.lineTo(x2 - 6, midY + 6);
    ctx.stroke();

    // Draw Switch on Bottom (midX, y2)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(midX - 25, y2 - 15, 50, 30);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(midX - 15, y2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(midX + 15, y2, 4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = circuitSwitchClosed ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(midX - 15, y2);
    if (circuitSwitchClosed) ctx.lineTo(midX + 15, y2);
    else ctx.lineTo(midX + 10, y2 - 16);
    ctx.stroke();
  }

  // ----------------------------------------------------------------
  // 10. CHEMISTRY: Chemical Equation Balancer
  // ----------------------------------------------------------------
  const COMMON_BALANCED_PRESETS = {
    'CH4 + O2 -> CO2 + H2O': { balanced: '1 CH₄ + 2 O₂ → 1 CO₂ + 2 H₂O', atoms: [{ el: 'C', r: 1, p: 1 }, { el: 'H', r: 4, p: 4 }, { el: 'O', r: 4, p: 4 }] },
    'H2 + O2 -> H2O': { balanced: '2 H₂ + 1 O₂ → 2 H₂O', atoms: [{ el: 'H', r: 4, p: 4 }, { el: 'O', r: 2, p: 2 }] },
    'Fe + O2 -> Fe2O3': { balanced: '4 Fe + 3 O₂ → 2 Fe₂O₃', atoms: [{ el: 'Fe', r: 4, p: 4 }, { el: 'O', r: 6, p: 6 }] },
    'N2 + H2 -> NH3': { balanced: '1 N₂ + 3 H₂ → 2 NH₃', atoms: [{ el: 'N', r: 2, p: 2 }, { el: 'H', r: 6, p: 6 }] },
    'Al + HCl -> AlCl3 + H2': { balanced: '2 Al + 6 HCl → 2 AlCl₃ + 3 H₂', atoms: [{ el: 'Al', r: 2, p: 2 }, { el: 'H', r: 6, p: 6 }, { el: 'Cl', r: 6, p: 6 }] },
    'C6H12O6 + O2 -> CO2 + H2O': { balanced: '1 C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O', atoms: [{ el: 'C', r: 6, p: 6 }, { el: 'H', r: 12, p: 12 }, { el: 'O', r: 18, p: 18 }] },
    'C3H8 + O2 -> CO2 + H2O': { balanced: '1 C₃H∸ + 5 O₂ → 3 CO₂ + 4 H₂O', atoms: [{ el: 'C', r: 3, p: 3 }, { el: 'H', r: 8, p: 8 }, { el: 'O', r: 10, p: 10 }] }
  };

  function balanceCurrentReaction() {
    const input = document.getElementById('reactionInput')?.value.trim() || 'CH4 + O2 -> CO2 + H2O';
    const found = COMMON_BALANCED_PRESETS[input] || COMMON_BALANCED_PRESETS['CH4 + O2 -> CO2 + H2O'];

    const outputEl = document.getElementById('reactionBalancedOutput');
    const tableBody = document.getElementById('reactionAtomTableBody');
    if (outputEl) outputEl.textContent = found.balanced;

    if (tableBody) {
      tableBody.innerHTML = found.atoms.map(a => `
        <tr>
          <td style="font-weight:700">${a.el}</td>
          <td>${a.r}</td>
          <td>${a.p}</td>
          <td style="color:#10b981;font-weight:700">✅ OK (${a.r} = ${a.p})</td>
        </tr>
      `).join('');
    }
  }

  // ----------------------------------------------------------------
  // 11. ECONOMICS: Market Equilibrium (Supply & Demand)
  // ----------------------------------------------------------------
  function initEconLab() {
    drawEconGraph();
  }

  function drawEconGraph() {
    const canvas = document.getElementById('econCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const dShift = parseFloat(document.getElementById('econDemandShiftSlider')?.value || 0);
    const sShift = parseFloat(document.getElementById('econSupplyShiftSlider')?.value || 0);

    document.getElementById('econDemandShiftVal') && (document.getElementById('econDemandShiftVal').textContent = (dShift > 0 ? `+${dShift}` : `${dShift}`));
    document.getElementById('econSupplyShiftVal') && (document.getElementById('econSupplyShiftVal').textContent = (sShift > 0 ? `+${sShift}` : `${sShift}`));

    const Qstar = Math.max(10, Math.min(90, (100 + dShift + sShift) / 2));
    const Pstar = Math.max(10, Math.min(90, 100 + dShift - Qstar));

    const CS = 0.5 * (100 + dShift - Pstar) * Qstar;
    const PS = 0.5 * (Pstar - (-sShift)) * Qstar;

    document.getElementById('econPriceDisplay') && (document.getElementById('econPriceDisplay').textContent = `€${Pstar.toFixed(2)}`);
    document.getElementById('econQtyDisplay') && (document.getElementById('econQtyDisplay').textContent = `${Qstar.toFixed(0)} units`);
    document.getElementById('econCSDisplay') && (document.getElementById('econCSDisplay').textContent = `€${CS.toFixed(2)}`);
    document.getElementById('econPSDisplay') && (document.getElementById('econPSDisplay').textContent = `€${PS.toFixed(2)}`);

    const padL = 70, padR = 40, padT = 30, padB = 40;
    const graphW = W - padL - padR, graphH = H - padT - padB;

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, H - padB);
    ctx.lineTo(W - padR, H - padB);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Price (P)', padL - 55, padT + 12);
    ctx.fillText('Quantity (Q)', W - padR - 60, H - padB + 28);

    const toX = (q) => padL + (q / 100) * graphW;
    const toY = (p) => (H - padB) - (p / 100) * graphH;

    // Draw Demand Curve (Blue)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(100 + dShift));
    ctx.lineTo(toX(100), toY(dShift));
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Demand (D)', toX(85), toY(15 + dShift));

    // Draw Supply Curve (Green)
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(-sShift));
    ctx.lineTo(toX(100), toY(100 - sShift));
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.fillText('Supply (S)', toX(85), toY(85 - sShift));

    // Equilibrium point and dashed lines
    const eqX = toX(Qstar);
    const eqY = toY(Pstar);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(eqX, H - padB); ctx.lineTo(eqX, eqY); ctx.lineTo(padL, eqY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(eqX, eqY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`E (Q*=${Qstar.toFixed(0)}, P*=€${Pstar.toFixed(0)})`, eqX + 10, eqY - 10);
  }

  // ----------------------------------------------------------------
  // 12. BIOLOGY: DNA Transcription & Translation
  // ----------------------------------------------------------------
  let currentDnaStrand = ['T', 'A', 'C', 'G', 'G', 'A', 'T', 'G', 'C', 'C', 'T', 'A', 'A', 'C', 'T'];

  const CODON_TABLE = {
    'AUG': 'Met (Start)', 'GCU': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
    'CCU': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
    'ACU': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
    'UAU': 'Tyr', 'UAC': 'Tyr', 'UAA': 'Stop', 'UAG': 'Stop', 'UGA': 'Stop',
    'GAU': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu',
    'UUU': 'Phe', 'UUC': 'Phe', 'UUA': 'Leu', 'UUG': 'Leu'
  };

  function initDnaLab() {
    renderDnaStrands();
  }

  function transcribeDNA(dna) {
    const map = { 'A': 'U', 'T': 'A', 'C': 'G', 'G': 'C' };
    return dna.map(base => map[base] || 'N');
  }

  function translateMRNA(mrna) {
    const peptides = [];
    for (let i = 0; i < mrna.length; i += 3) {
      if (i + 2 < mrna.length) {
        const codon = mrna[i] + mrna[i + 1] + mrna[i + 2];
        const aa = CODON_TABLE[codon] || 'Unknown';
        peptides.push({ codon, aa });
      }
    }
    return peptides;
  }

  function renderDnaStrands() {
    const dnaBox = document.getElementById('dnaStrandContainer');
    const mrnaBox = document.getElementById('mrnaStrandContainer');
    const aminoBox = document.getElementById('aminoChainContainer');

    if (!dnaBox || !mrnaBox || !aminoBox) return;

    const mrna = transcribeDNA(currentDnaStrand);
    const peptides = translateMRNA(mrna);

    dnaBox.innerHTML = currentDnaStrand.map((base, idx) => `
      <div class="dna-nucleotide ${base}" title="Index ${idx}: ${base}">${base}</div>
    `).join('');

    mrnaBox.innerHTML = mrna.map((base, idx) => `
      <div class="dna-nucleotide ${base}" title="mRNA Index ${idx}: ${base}">${base}</div>
    `).join('');

    aminoBox.innerHTML = peptides.map((p, idx) => `
      <div class="amino-badge" title="Codon: ${p.codon}">
        <span>${p.aa}</span>
        <span style="font-size:10px;opacity:0.8">(${p.codon})</span>
      </div>
      ${idx < peptides.length - 1 ? '<span style="color:#6366f1;font-weight:800">→</span>' : ''}
    `).join('');
  }

  function mutateRandomDnaBase() {
    const bases = ['A', 'T', 'C', 'G'];
    const randIdx = Math.floor(Math.random() * currentDnaStrand.length);
    const oldBase = currentDnaStrand[randIdx];
    let newBase = bases[Math.floor(Math.random() * bases.length)];
    while (newBase === oldBase) newBase = bases[Math.floor(Math.random() * bases.length)];

    currentDnaStrand[randIdx] = newBase;
    renderDnaStrands();

    const box = document.getElementById('dnaMutationEffectBox');
    if (box) {
      box.innerHTML = `<b>Mutacion i Rastësishëm në Pozicionin ${randIdx + 1}:</b> Bazë <code>${oldBase}</code> u zëvendësua me <code>${newBase}</code>. Vëreni ndryshimin në vargun e aminoacideve!`;
    }
  }

  // ----------------------------------------------------------------
  // 13. ASTRONOMY: Gravity & Orbital Mechanics
  // ----------------------------------------------------------------
  let orbitRunning = false;
  let orbitAnimFrame = null;
  let planetPos = { x: 120, y: 0 };
  let planetVel = { x: 0, y: 3.8 };
  let orbitTrail = [];

  function initOrbitLab() {
    resetOrbitSystem();
  }

  function resetOrbitSystem() {
    const preset = document.getElementById('orbitPresetSelect')?.value || 'circular';
    const starMass = parseFloat(document.getElementById('orbitStarMassSlider')?.value || 1.0);

    planetPos = { x: 120, y: 0 };
    orbitTrail = [];

    if (preset === 'circular') {
      const v = Math.sqrt((1800 * starMass) / 120);
      planetVel = { x: 0, y: v };
      const slider = document.getElementById('orbitVelocitySlider');
      if (slider) slider.value = v.toFixed(1);
    } else if (preset === 'elliptical') {
      planetVel = { x: 0, y: 2.6 };
      const slider = document.getElementById('orbitVelocitySlider');
      if (slider) slider.value = '2.6';
    } else if (preset === 'escape') {
      planetVel = { x: 0, y: 5.5 };
      const slider = document.getElementById('orbitVelocitySlider');
      if (slider) slider.value = '5.5';
    }

    const vVal = parseFloat(document.getElementById('orbitVelocitySlider')?.value || 3.8);
    document.getElementById('orbitVelocityVal') && (document.getElementById('orbitVelocityVal').textContent = `${vVal.toFixed(1)} km/s`);
    document.getElementById('orbitStarMassVal') && (document.getElementById('orbitStarMassVal').textContent = `${starMass.toFixed(1)} M☉`);

    drawOrbitSimulation();
  }

  function startOrbitSimulation() {
    if (orbitRunning) {
      orbitRunning = false;
      const btn = document.getElementById('orbitLaunchBtn');
      if (btn) btn.textContent = '▶ Start Orbit';
      return;
    }

    orbitRunning = true;
    const btn = document.getElementById('orbitLaunchBtn');
    if (btn) btn.textContent = '⏸ Pause Orbit';

    if (orbitAnimFrame) cancelAnimationFrame(orbitAnimFrame);

    function step() {
      if (orbitRunning && activeLabTab === 'astronomy') {
        const starMass = parseFloat(document.getElementById('orbitStarMassSlider')?.value || 1.0);
        const G = 1800;
        const dt = 0.3;

        const r = Math.sqrt(planetPos.x * planetPos.x + planetPos.y * planetPos.y);
        if (r > 15 && r < 500) {
          const a = (-G * starMass) / (r * r);
          const ax = a * (planetPos.x / r);
          const ay = a * (planetPos.y / r);

          planetVel.x += ax * dt;
          planetVel.y += ay * dt;

          planetPos.x += planetVel.x * dt;
          planetPos.y += planetVel.y * dt;

          orbitTrail.push({ x: planetPos.x, y: planetPos.y });
          if (orbitTrail.length > 180) orbitTrail.shift();

          const vMag = Math.sqrt(planetVel.x * planetVel.x + planetVel.y * planetVel.y);
          const forceEst = ((starMass * 3.52) / (r / 100)).toFixed(2);

          document.getElementById('orbitCurVelDisplay') && (document.getElementById('orbitCurVelDisplay').textContent = `${(vMag * 7.8).toFixed(1)} km/s`);
          document.getElementById('orbitForceDisplay') && (document.getElementById('orbitForceDisplay').textContent = `${forceEst} × 10²² N`);
          document.getElementById('orbitStatusDisplay') && (document.getElementById('orbitStatusDisplay').textContent = r < 300 ? 'Stable Elliptical' : 'Escaping Orbit');
        }

        drawOrbitSimulation();
      }
      orbitAnimFrame = requestAnimationFrame(step);
    }
    orbitAnimFrame = requestAnimationFrame(step);
  }

  function drawOrbitSimulation() {
    const canvas = document.getElementById('orbitCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;

    // Draw Orbit Trail
    if (orbitTrail.length > 1) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + orbitTrail[0].x, cy + orbitTrail[0].y);
      for (let i = 1; i < orbitTrail.length; i++) {
        ctx.lineTo(cx + orbitTrail[i].x, cy + orbitTrail[i].y);
      }
      ctx.stroke();
    }

    // Draw Central Star (Sun)
    const starMass = parseFloat(document.getElementById('orbitStarMassSlider')?.value || 1.0);
    const starRadius = 14 * Math.sqrt(starMass);

    // Star Aura
    const starGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, starRadius * 2.5);
    starGlow.addColorStop(0, 'rgba(251, 191, 36, 1)');
    starGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)');
    starGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, starRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Orbiting Planet
    const px = cx + planetPos.x;
    const py = cy + planetPos.y;

    const planetGlow = ctx.createRadialGradient(px, py, 2, px, py, 14);
    planetGlow.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    planetGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = planetGlow;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ----------------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------------
  function open(tab) {
    init();
    const overlay = document.getElementById('interactiveLabOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      const targetTab = tab || activeLabTab;
      document.querySelectorAll('.lab-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.lab === targetTab));
      document.querySelectorAll('.lab-simulation-pane').forEach(p => p.classList.toggle('active', p.id === `lab-${targetTab}`));
      activeLabTab = targetTab;
      if (targetTab === 'ai') drawDecisionBoundary();
      if (targetTab === 'activations') renderActivationGraph();
      if (targetTab === 'algorithms') renderAlgoBars();
      if (targetTab === 'circuits') updateCircuitCalculations();
      if (targetTab === 'reactions') balanceCurrentReaction();
      if (targetTab === 'economics') drawEconGraph();
      if (targetTab === 'dna') renderDnaStrands();
      if (targetTab === 'astronomy') drawOrbitSimulation();
      if (targetTab === 'math') plotMathFunction();
    }
  }

  function close() {
    const overlay = document.getElementById('interactiveLabOverlay');
    if (overlay) overlay.style.display = 'none';
    if (physicsAnimFrame) { cancelAnimationFrame(physicsAnimFrame); physicsAnimFrame = null; }
    if (aiTrainingAnimFrame) { cancelAnimationFrame(aiTrainingAnimFrame); aiTrainingAnimFrame = null; }
    if (circuitAnimFrame) { cancelAnimationFrame(circuitAnimFrame); circuitAnimFrame = null; }
    if (orbitAnimFrame) { cancelAnimationFrame(orbitAnimFrame); orbitAnimFrame = null; }
    aiTraining = false;
    orbitRunning = false;
    algoAbort = true;
    algoRunning = false;
    const btn = document.getElementById('aiTrainToggleBtn');
    if (btn) { btn.textContent = '▶ Start Training'; btn.style.background = ''; }
    const algoBtn = document.getElementById('algoStartBtn');
    if (algoBtn) algoBtn.textContent = '▶ Start Sort';
    const orbitBtn = document.getElementById('orbitLaunchBtn');
    if (orbitBtn) orbitBtn.textContent = '▶ Start Orbit';
  }

  window.InteractiveLab = { open, close };

  // Keyboard shortcut Ctrl+Shift+L
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
      e.preventDefault();
      open();
    }
  });

  document.addEventListener('DOMContentLoaded', init);
})();
