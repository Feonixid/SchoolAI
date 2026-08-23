// js/econ-tools.js
// ===================================================================
// INTERACTIVE ECONOMICS TOOLS
// Canvas-based graphing: Supply/Demand, PPF, AD-AS, GDP Calculator
// Activated by /graph commands or AI suggestions
// ===================================================================

(function () {
  'use strict';

  const TOOLS = {
    'supply-demand': { label: 'Supply & Demand', fn: renderSupplyDemand },
    'ppf':           { label: 'Production Possibility Frontier', fn: renderPPF },
    'gdp':           { label: 'GDP Components Calculator', fn: renderGDP },
    'adas':          { label: 'AD-AS Model', fn: renderADAS },
    'inflation':     { label: 'Inflation / CPI Calculator', fn: renderInflation }
  };

  // ----------------------------------------------------------------
  // COMMAND INTERCEPTOR
  // ----------------------------------------------------------------
  function interceptGraphCommand(message) {
    const match = message.trim().match(/^\/graph\s+(\S+)/i);
    if (!match) return false;

    const toolId = match[1].toLowerCase();
    const tool = TOOLS[toolId];
    if (!tool) {
      // List available tools
      const chatDiv = document.getElementById('chat');
      if (chatDiv) {
        addGraphMessage(chatDiv, `Available graph tools: ${Object.entries(TOOLS).map(([id, t]) => `<code>/graph ${id}</code> — ${t.label}`).join('<br>')}`);
      }
      return true;
    }

    const chatDiv = document.getElementById('chat');
    if (chatDiv) {
      const container = createGraphContainer(chatDiv, tool.label);
      tool.fn(container);
    }
    return true;
  }

  function createGraphContainer(chatDiv, title) {
    const row = document.createElement('div');
    row.className = 'row assistant';
    row.innerHTML = `
      <div class="bubble econ-graph-bubble" style="width:100%;max-width:600px;padding:0;overflow:hidden">
        <div class="econ-graph-header">
          <span>📊 ${title}</span>
          <button class="econ-graph-close" onclick="this.closest('.row').remove()">×</button>
        </div>
        <div class="econ-graph-body"></div>
        <div class="econ-graph-controls"></div>
      </div>
    `;
    chatDiv.appendChild(row);
    chatDiv.scrollTop = chatDiv.scrollHeight;
    return {
      body: row.querySelector('.econ-graph-body'),
      controls: row.querySelector('.econ-graph-controls'),
      row
    };
  }

  function addGraphMessage(chatDiv, html) {
    const row = document.createElement('div');
    row.className = 'row assistant';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = html;
    row.appendChild(bubble);
    chatDiv.appendChild(row);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }

  // ----------------------------------------------------------------
  // CANVAS HELPERS
  // ----------------------------------------------------------------
  function createCanvas(container, width = 500, height = 360) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.cssText = 'width:100%;height:auto;display:block;cursor:crosshair;';
    container.appendChild(canvas);
    return canvas;
  }

  function drawAxes(ctx, w, h, opts = {}) {
    const m = opts.margin || 50;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m, m);
    ctx.lineTo(m, h - m);
    ctx.lineTo(w - m, h - m);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.xLabel || 'Quantity', w / 2, h - 10);

    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(opts.yLabel || 'Price', 0, 0);
    ctx.restore();

    return m;
  }

  // ----------------------------------------------------------------
  // 1. SUPPLY & DEMAND
  // ----------------------------------------------------------------
  function renderSupplyDemand(container) {
    const canvas = createCanvas(container.body);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    let demandShift = 0;
    let supplyShift = 0;

    function draw() {
      const m = drawAxes(ctx, w, h, { xLabel: 'Quantity (Q)', yLabel: 'Price (P)' });
      const gw = w - 2 * m, gh = h - 2 * m;

      // Demand curve (downward sloping)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= gw; x++) {
        const px = m + x;
        const py = m + (x / gw) * gh + demandShift * 30;
        if (x === 0) ctx.moveTo(px, Math.max(m, Math.min(h - m, py)));
        else ctx.lineTo(px, Math.max(m, Math.min(h - m, py)));
      }
      ctx.stroke();
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(`D${demandShift !== 0 ? "'" : ''}`, w - m + 15, m + demandShift * 30 + 20);

      // Supply curve (upward sloping)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= gw; x++) {
        const px = m + x;
        const py = h - m - (x / gw) * gh + supplyShift * 30;
        if (x === 0) ctx.moveTo(px, Math.max(m, Math.min(h - m, py)));
        else ctx.lineTo(px, Math.max(m, Math.min(h - m, py)));
      }
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`S${supplyShift !== 0 ? "'" : ''}`, w - m + 15, h - m + supplyShift * 30 - 20);

      // Equilibrium point
      const eqX = gw / 2 + (supplyShift - demandShift) * 15;
      const eqY = gh / 2 + (demandShift + supplyShift) * 15;
      const epx = m + Math.max(0, Math.min(gw, eqX));
      const epy = m + Math.max(0, Math.min(gh, eqY));

      // Dotted lines to axes
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(epx, epy); ctx.lineTo(epx, h - m);
      ctx.moveTo(epx, epy); ctx.lineTo(m, epy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Equilibrium dot
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(epx, epy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.fillText('E', epx + 10, epy - 8);

      // Axis labels at equilibrium
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Q*', epx, h - m + 14);
      ctx.textAlign = 'right';
      ctx.fillText('P*', m - 8, epy + 4);
      ctx.textAlign = 'center';

      // Legend
      ctx.font = '11px Inter';
      ctx.fillStyle = '#2563eb';
      ctx.fillText('● Demand', m + 40, m - 8);
      ctx.fillStyle = '#dc2626';
      ctx.fillText('● Supply', m + 110, m - 8);
      ctx.fillStyle = '#059669';
      ctx.fillText('● Equilibrium', m + 200, m - 8);
    }

    draw();

    // Controls
    container.controls.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#2563eb">Demand Shift</label>
          <input type="range" id="demandSlider" min="-4" max="4" value="0" step="1" style="width:100%">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#dc2626">Supply Shift</label>
          <input type="range" id="supplySlider" min="-4" max="4" value="0" step="1" style="width:100%">
        </div>
        <button id="resetSD" style="grid-column:span 2;padding:6px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:12px">Reset</button>
      </div>
      <div id="sdExplanation" style="padding:0 12px 12px;font-size:12px;color:#374151"></div>
    `;

    const dSlider = container.controls.querySelector('#demandSlider');
    const sSlider = container.controls.querySelector('#supplySlider');
    const explDiv = container.controls.querySelector('#sdExplanation');

    function update() {
      demandShift = parseInt(dSlider.value);
      supplyShift = parseInt(sSlider.value);
      draw();

      let explanation = '';
      if (demandShift > 0) explanation += '⬆ Demand increased → higher equilibrium price and quantity. ';
      if (demandShift < 0) explanation += '⬇ Demand decreased → lower equilibrium price and quantity. ';
      if (supplyShift > 0) explanation += '⬆ Supply increased → lower equilibrium price, higher quantity. ';
      if (supplyShift < 0) explanation += '⬇ Supply decreased → higher equilibrium price, lower quantity. ';
      if (!explanation) explanation = 'Move the sliders to shift curves and see how equilibrium changes.';
      explDiv.textContent = explanation;
    }

    dSlider.addEventListener('input', update);
    sSlider.addEventListener('input', update);
    container.controls.querySelector('#resetSD').addEventListener('click', () => {
      dSlider.value = 0; sSlider.value = 0; update();
    });
    update();
  }

  // ----------------------------------------------------------------
  // 2. PRODUCTION POSSIBILITY FRONTIER
  // ----------------------------------------------------------------
  function renderPPF(container) {
    const canvas = createCanvas(container.body);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    let efficiency = 1.0;
    let growth = 0;
    let pointX = 0.5, pointY = 0.5;
    let dragging = false;

    function draw() {
      const m = drawAxes(ctx, w, h, { xLabel: 'Good A (units)', yLabel: 'Good B (units)' });
      const gw = w - 2 * m, gh = h - 2 * m;
      const scale = 1 + growth * 0.3;

      // PPF curve (concave from origin)
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.01) {
        const x = t * gw * scale * efficiency;
        const y = (1 - t * t) * gh * scale * efficiency;
        const px = m + Math.min(gw, x);
        const py = h - m - Math.min(gh, y);
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Original PPF (if shifted)
      if (growth !== 0) {
        ctx.strokeStyle = 'rgba(124,58,237,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.01) {
          const x = t * gw * efficiency;
          const y = (1 - t * t) * gh * efficiency;
          if (t === 0) ctx.moveTo(m + x, h - m - y);
          else ctx.lineTo(m + x, h - m - y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // User's selected point
      const ppfY = (1 - pointX * pointX) * scale * efficiency;
      const maxY = Math.min(1, ppfY);
      const isEfficient = Math.abs(pointY - ppfY) < 0.05;
      const isInside = pointY < ppfY - 0.05;

      const dotX = m + pointX * gw;
      const dotY = h - m - pointY * gh;

      ctx.fillStyle = isEfficient ? '#059669' : (isInside ? '#d97706' : '#dc2626');
      ctx.beginPath();
      ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.font = '11px Inter';
      const label = isEfficient ? 'Efficient' : (isInside ? 'Underutilized' : 'Unattainable');
      ctx.fillText(label, dotX + 10, dotY - 10);

      // Opportunity cost annotation
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('PPF', m + gw * scale * efficiency * 0.5 + 10, h - m - gh * 0.3 * scale * efficiency);
    }

    draw();

    // Drag interaction
    const canvas_ = container.body.querySelector('canvas');
    canvas_.addEventListener('mousedown', (e) => { dragging = true; updatePoint(e); });
    canvas_.addEventListener('mousemove', (e) => { if (dragging) updatePoint(e); });
    canvas_.addEventListener('mouseup', () => dragging = false);
    canvas_.addEventListener('mouseleave', () => dragging = false);

    function updatePoint(e) {
      const rect = canvas_.getBoundingClientRect();
      const scaleX = canvas_.width / rect.width;
      const scaleY = canvas_.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const m = 50;
      pointX = Math.max(0, Math.min(1, (mx - m) / (w - 2 * m)));
      pointY = Math.max(0, Math.min(1, ((h - m) - my) / (h - 2 * m)));
      draw();
    }

    // Controls
    container.controls.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#7c3aed">Economic Growth</label>
          <input type="range" id="growthSlider" min="-2" max="3" value="0" step="1" style="width:100%">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#059669">Efficiency</label>
          <input type="range" id="effSlider" min="0.3" max="1" value="1" step="0.1" style="width:100%">
        </div>
      </div>
      <div style="padding:0 12px 8px;font-size:11px;color:#6b7280">Click and drag to place a production point. Points ON the curve are efficient.</div>
    `;

    container.controls.querySelector('#growthSlider').addEventListener('input', (e) => { growth = parseInt(e.target.value); draw(); });
    container.controls.querySelector('#effSlider').addEventListener('input', (e) => { efficiency = parseFloat(e.target.value); draw(); });
  }

  // ----------------------------------------------------------------
  // 3. GDP CALCULATOR
  // ----------------------------------------------------------------
  function renderGDP(container) {
    container.body.innerHTML = `
      <div style="padding:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;color:#059669">C — Consumption</label>
            <input type="number" id="gdpC" value="3500" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#2563eb">I — Investment</label>
            <input type="number" id="gdpI" value="1200" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#7c3aed">G — Government Spending</label>
            <input type="number" id="gdpG" value="900" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#dc2626">NX — Net Exports (X-M)</label>
            <input type="number" id="gdpNX" value="-200" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px">
          </div>
        </div>
        <div style="text-align:center;margin-top:16px">
          <div style="font-size:13px;color:#6b7280">GDP = C + I + G + NX</div>
          <div id="gdpResult" style="font-size:36px;font-weight:800;color:var(--accent);margin-top:4px">$5,400B</div>
        </div>
        <canvas id="gdpPie" width="300" height="200" style="display:block;margin:12px auto;width:250px"></canvas>
        <div id="gdpBreakdown" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:11px;text-align:center"></div>
      </div>
    `;

    const fields = ['gdpC', 'gdpI', 'gdpG', 'gdpNX'];
    const colors = ['#059669', '#2563eb', '#7c3aed', '#dc2626'];
    const labels = ['C', 'I', 'G', 'NX'];

    function updateGDP() {
      const values = fields.map(id => parseFloat(container.body.querySelector(`#${id}`).value) || 0);
      const total = values.reduce((s, v) => s + v, 0);

      container.body.querySelector('#gdpResult').textContent =
        `$${total.toLocaleString()}B`;

      // Pie chart
      const canvas = container.body.querySelector('#gdpPie');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 300, 200);

      const absValues = values.map(Math.abs);
      const absTotal = absValues.reduce((s, v) => s + v, 0);
      let startAngle = -Math.PI / 2;

      absValues.forEach((v, i) => {
        const sliceAngle = (v / absTotal) * Math.PI * 2;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(150, 100);
        ctx.arc(150, 100, 80, startAngle, startAngle + sliceAngle);
        ctx.fill();

        // Label
        const midAngle = startAngle + sliceAngle / 2;
        const lx = 150 + Math.cos(midAngle) * 55;
        const ly = 100 + Math.sin(midAngle) * 55;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], lx, ly + 4);

        startAngle += sliceAngle;
      });

      // Breakdown
      const breakdown = container.body.querySelector('#gdpBreakdown');
      breakdown.innerHTML = values.map((v, i) =>
        `<div style="color:${colors[i]}"><strong>${labels[i]}</strong><br>${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%</div>`
      ).join('');
    }

    fields.forEach(id => {
      container.body.querySelector(`#${id}`).addEventListener('input', updateGDP);
    });
    updateGDP();
  }

  // ----------------------------------------------------------------
  // 4. AD-AS MODEL
  // ----------------------------------------------------------------
  function renderADAS(container) {
    const canvas = createCanvas(container.body);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    let adShift = 0;
    let srasShift = 0;

    function draw() {
      const m = drawAxes(ctx, w, h, { xLabel: 'Real GDP (Y)', yLabel: 'Price Level (P)' });
      const gw = w - 2 * m, gh = h - 2 * m;

      // LRAS (vertical line at potential output)
      const lrasX = m + gw * 0.55;
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(lrasX, m);
      ctx.lineTo(lrasX, h - m);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('LRAS', lrasX, m - 8);

      // AD curve (downward sloping)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= gw; x++) {
        const px = m + x;
        const py = m + (x / gw) * gh + adShift * 25;
        if (x === 0) ctx.moveTo(px, Math.max(m, Math.min(h - m, py)));
        else ctx.lineTo(px, Math.max(m, Math.min(h - m, py)));
      }
      ctx.stroke();
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 13px Inter';
      ctx.fillText(`AD${adShift ? "'" : ''}`, w - m + 15, m + adShift * 25 + gh * 0.2);

      // SRAS curve (upward sloping, flatter than supply)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= gw; x++) {
        const px = m + x;
        const t = x / gw;
        const py = h - m - t * gh * 0.7 - gh * 0.15 + srasShift * 25;
        if (x === 0) ctx.moveTo(px, Math.max(m, Math.min(h - m, py)));
        else ctx.lineTo(px, Math.max(m, Math.min(h - m, py)));
      }
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillText(`SRAS${srasShift ? "'" : ''}`, w - m + 10, h - m - gh * 0.6 + srasShift * 25);

      // Equilibrium
      const eqT = 0.5 + adShift * 0.05 - srasShift * 0.05;
      const eqX = m + Math.max(0, Math.min(gw, eqT * gw));
      const eqP = m + eqT * gh + adShift * 25;
      const eqPy = Math.max(m, Math.min(h - m, eqP));

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(eqX, eqPy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Gap annotation
      if (eqX < lrasX - 15) {
        ctx.fillStyle = '#d97706';
        ctx.font = '11px Inter';
        ctx.fillText('Recessionary Gap', (eqX + lrasX) / 2, eqPy + 20);
      } else if (eqX > lrasX + 15) {
        ctx.fillStyle = '#dc2626';
        ctx.font = '11px Inter';
        ctx.fillText('Inflationary Gap', (eqX + lrasX) / 2, eqPy + 20);
      }
    }

    draw();

    container.controls.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px">
        <div>
          <label style="font-size:11px;font-weight:600;color:#2563eb">AD Shift (Fiscal/Monetary Policy)</label>
          <input type="range" id="adSlider" min="-4" max="4" value="0" step="1" style="width:100%">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#6b7280"><span>Contractionary</span><span>Expansionary</span></div>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#dc2626">SRAS Shift (Supply Shock)</label>
          <input type="range" id="srasSlider" min="-4" max="4" value="0" step="1" style="width:100%">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#6b7280"><span>Negative shock</span><span>Positive shock</span></div>
        </div>
        <button id="resetADAS" style="grid-column:span 2;padding:6px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:12px">Reset</button>
      </div>
      <div id="adasExpl" style="padding:0 12px 12px;font-size:12px;color:#374151"></div>
    `;

    const adS = container.controls.querySelector('#adSlider');
    const srasS = container.controls.querySelector('#srasSlider');
    const expl = container.controls.querySelector('#adasExpl');

    function update() {
      adShift = parseInt(adS.value);
      srasShift = parseInt(srasS.value);
      draw();

      let text = '';
      if (adShift > 0) text += '📈 Expansionary policy shifts AD right → higher GDP & prices. ';
      if (adShift < 0) text += '📉 Contractionary policy shifts AD left → lower GDP & prices. ';
      if (srasShift > 0) text += '⬆ Positive supply shock shifts SRAS right → higher GDP, lower prices. ';
      if (srasShift < 0) text += '⬇ Negative supply shock (e.g., oil crisis) shifts SRAS left → stagflation risk. ';
      if (!text) text = 'Adjust sliders to simulate policy changes and supply shocks.';
      expl.textContent = text;
    }

    adS.addEventListener('input', update);
    srasS.addEventListener('input', update);
    container.controls.querySelector('#resetADAS').addEventListener('click', () => { adS.value = 0; srasS.value = 0; update(); });
    update();
  }

  // ----------------------------------------------------------------
  // 5. INFLATION / CPI CALCULATOR
  // ----------------------------------------------------------------
  function renderInflation(container) {
    container.body.innerHTML = `
      <div style="padding:16px">
        <h4 style="margin:0 0 12px;font-size:14px;color:var(--accent)">CPI Basket Comparison</h4>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f3f4f6"><th style="padding:6px;text-align:left">Item</th><th style="padding:6px">Base Year (₺)</th><th style="padding:6px">Current Year (₺)</th></tr>
          </thead>
          <tbody id="cpiRows">
            <tr><td style="padding:4px">🍞 Bread</td><td><input type="number" value="100" class="cpi-base" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td><td><input type="number" value="115" class="cpi-curr" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td></tr>
            <tr><td style="padding:4px">🏠 Housing</td><td><input type="number" value="500" class="cpi-base" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td><td><input type="number" value="560" class="cpi-curr" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td></tr>
            <tr><td style="padding:4px">🚗 Transport</td><td><input type="number" value="200" class="cpi-base" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td><td><input type="number" value="230" class="cpi-curr" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td></tr>
            <tr><td style="padding:4px">👔 Clothing</td><td><input type="number" value="150" class="cpi-base" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td><td><input type="number" value="155" class="cpi-curr" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td></tr>
            <tr><td style="padding:4px">🎭 Entertainment</td><td><input type="number" value="50" class="cpi-base" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td><td><input type="number" value="55" class="cpi-curr" style="width:80px;padding:4px;border:1px solid #d1d5db;border-radius:4px"></td></tr>
          </tbody>
        </table>
        <div style="text-align:center;margin-top:16px">
          <div style="font-size:13px;color:#6b7280">CPI = (Current ÷ Base) × 100</div>
          <div id="cpiResult" style="font-size:32px;font-weight:800;color:var(--accent);margin-top:4px">111.5</div>
          <div id="inflRate" style="font-size:16px;color:#dc2626;font-weight:600">Inflation: 11.5%</div>
        </div>
      </div>
    `;

    function updateCPI() {
      const bases = container.body.querySelectorAll('.cpi-base');
      const currs = container.body.querySelectorAll('.cpi-curr');
      let baseTotal = 0, currTotal = 0;
      bases.forEach((b, i) => { baseTotal += parseFloat(b.value) || 0; currTotal += parseFloat(currs[i].value) || 0; });
      const cpi = baseTotal > 0 ? (currTotal / baseTotal * 100) : 100;
      const rate = cpi - 100;
      container.body.querySelector('#cpiResult').textContent = cpi.toFixed(1);
      const rateEl = container.body.querySelector('#inflRate');
      rateEl.textContent = `Inflation: ${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
      rateEl.style.color = rate > 5 ? '#dc2626' : rate > 2 ? '#d97706' : '#059669';
    }

    container.body.querySelectorAll('.cpi-base, .cpi-curr').forEach(input => {
      input.addEventListener('input', updateCPI);
    });
    updateCPI();
  }

  // ----------------------------------------------------------------
  // ECONOMICS TOOLS PANEL — auto-shows in sidebar for Economics subject
  // ----------------------------------------------------------------
  function renderToolsPanel() {
    const existing = document.getElementById('econToolsPanel');
    if (existing) existing.remove();

    const activeSubject = window.Subjects?.getActive();
    if (!activeSubject || activeSubject.id !== 'ekonomi') return;

    const panel = document.createElement('div');
    panel.id = 'econToolsPanel';
    panel.className = 'econ-sidebar-section';
    panel.style.cssText = 'margin-top:14px;padding:12px;background:var(--input-bg);border:1px solid var(--border);border-radius:var(--radius-sm, 10px);';

    const toolDescriptions = {
      'supply-demand': 'Equilibrium & curve shifts',
      'ppf': 'Opportunity cost & trade-offs',
      'adas': 'Macro AD-AS & real GDP',
      'gdp': 'C + I + G + (X-M) calculation',
      'inflation': 'CPI basket & inflation rate'
    };

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <h2 class="panel-title" style="margin:0;font-size:12px;color:var(--accent);font-weight:700">📊 Economics Tools</h2>
        <span style="font-size:10px;color:var(--muted);background:var(--panel);padding:2px 6px;border-radius:6px;border:1px solid var(--border)">Interactive</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${Object.entries(TOOLS).map(([id, tool]) => `
          <button class="econ-panel-btn" data-tool="${id}" style="
            display:flex;align-items:center;gap:10px;padding:9px 12px;
            background:var(--panel);border:1px solid var(--border);
            border-radius:var(--radius-sm, 8px);cursor:pointer;font-family:inherit;
            font-size:12.5px;text-align:left;transition:all 0.2s ease;color:var(--text)">
            <span style="font-size:18px;width:24px;text-align:center">${
              id === 'supply-demand' ? '📈' :
              id === 'ppf' ? '🔄' :
              id === 'gdp' ? '💰' :
              id === 'adas' ? '🏛️' : '🏷️'
            }</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:13px">${tool.label}</div>
              <div style="font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${toolDescriptions[id] || ''}</div>
            </div>
          </button>
        `).join('')}
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--muted);text-align:center">
        Click to open simulator or type <code>/graph [tool]</code>
      </div>
    `;

    // Target the appropriate sidebar section (student or teacher)
    const isTeacher = window.AppState?.ui?.teacherMode && window.AppState?.ui?.teacherModeUnlocked;
    const targetSection = isTeacher ? document.getElementById('teacherToolsSection') : document.getElementById('studentToolsSection');

    if (targetSection) {
      const difficultyPanel = targetSection.querySelector('#difficultyPanel')?.parentElement;
      if (difficultyPanel) {
        targetSection.insertBefore(panel, difficultyPanel);
      } else {
        targetSection.appendChild(panel);
      }
    }

    // Wire buttons
    panel.querySelectorAll('.econ-panel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        interceptGraphCommand(`/graph ${btn.dataset.tool}`);
      });
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'var(--hover-bg)';
        btn.style.transform = 'translateX(2px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = 'var(--border)';
        btn.style.background = 'var(--panel)';
        btn.style.transform = 'none';
      });
    });
  }

  // Auto-show/hide when subject changes or mode switches
  window.addEventListener('subjectSwitched', renderToolsPanel);
  window.addEventListener('teacherModeUnlocked', renderToolsPanel);

  // ----------------------------------------------------------------
  // INTERCEPT INPUT
  // ----------------------------------------------------------------
  function hookInput() {
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');
    if (!input || !sendBtn) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const msg = input.value.trim();
        if (msg.startsWith('/graph')) {
          e.preventDefault();
          e.stopImmediatePropagation();
          interceptGraphCommand(msg);
          input.value = '';
          input.style.height = 'auto';
        }
      }
    }, true);

    sendBtn.addEventListener('click', (e) => {
      const msg = input.value.trim();
      if (msg.startsWith('/graph')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        interceptGraphCommand(msg);
        input.value = '';
        input.style.height = 'auto';
      }
    }, true);
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(hookInput, 800);
      setTimeout(renderToolsPanel, 1000);
    });
  } else {
    setTimeout(hookInput, 800);
    setTimeout(renderToolsPanel, 1000);
  }

  window.EconTools = {
    interceptGraphCommand,
    renderToolsPanel,
    renderSupplyDemand,
    renderPPF,
    renderGDP,
    renderADAS,
    renderInflation,
    TOOLS
  };

  console.log('✅ Economics tools loaded. Commands: /graph supply-demand, /graph ppf, /graph gdp, /graph adas, /graph inflation');
})();
