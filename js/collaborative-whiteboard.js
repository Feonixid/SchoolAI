(function () {
  'use strict';

  let currentTool = 'pen';
  let currentColor = '#6366f1';
  let currentStrokeWidth = 3;
  let isDrawing = false;
  let isGridActive = true;
  let startX = 0, startY = 0;
  let undoStack = [];
  let redoStack = [];

  function init() {
    if (document.getElementById('whiteboardOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'whiteboardOverlay';
    overlay.className = 'whiteboard-overlay';
    overlay.innerHTML = `
      <div class="whiteboard-window" role="dialog" aria-modal="true">
        <div class="whiteboard-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🎨</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Tabela e Bardhë Ndërvepruese &amp; Bashkëpunimi</h2>
              <div style="font-size:12px;color:var(--text-muted)">Vizato diagrame, zgjidh ushtrime së bashku dhe eksporto shënimet</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button id="wbExportBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">💾 Eksporto PNG</button>
            <button id="closeWhiteboardBtn" class="school-os-close-btn" title="Mbyll Tabelën">×</button>
          </div>
        </div>

        <div class="whiteboard-toolbar">
          <button class="whiteboard-tool-btn active" data-tool="pen">✏️ Laps</button>
          <button class="whiteboard-tool-btn" data-tool="line">📏 Vijë</button>
          <button class="whiteboard-tool-btn" data-tool="rectangle">⬜ Drejtkëndësh</button>
          <button class="whiteboard-tool-btn" data-tool="circle">⭕ Rreth</button>
          <button class="whiteboard-tool-btn" data-tool="eraser">🧼 Gomë</button>

          <div style="height:20px;width:1px;background:var(--border,#cbd5e1)"></div>

          <label style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px">
            Ngjyra:
            <input type="color" id="wbColorPicker" value="#6366f1" style="border:none;width:26px;height:26px;border-radius:4px;cursor:pointer;background:none" />
          </label>

          <label style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px">
            Trashësia:
            <input type="range" id="wbWidthSlider" min="1" max="20" value="3" style="width:70px" />
          </label>

          <div style="height:20px;width:1px;background:var(--border,#cbd5e1)"></div>

          <button class="whiteboard-tool-btn" id="wbGridToggleBtn">📐 Rrjeta: On</button>
          <button class="whiteboard-tool-btn" id="wbUndoBtn">↩ Zhbëj</button>
          <button class="whiteboard-tool-btn" id="wbRedoBtn">↪ Ribëj</button>
          <button class="whiteboard-tool-btn" id="wbClearBtn" style="color:#ef4444">🗑️ Fshi Gjithçka</button>
        </div>

        <div class="whiteboard-canvas-area grid-mode" id="wbCanvasContainer">
          <canvas id="whiteboardCanvas" width="1180" height="700"></canvas>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
  }

  function wireEvents() {
    const overlay = document.getElementById('whiteboardOverlay');
    document.getElementById('closeWhiteboardBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const canvas = document.getElementById('whiteboardCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    document.querySelectorAll('.whiteboard-tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.whiteboard-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
      });
    });

    document.getElementById('wbColorPicker')?.addEventListener('input', (e) => {
      currentColor = e.target.value;
    });

    document.getElementById('wbWidthSlider')?.addEventListener('input', (e) => {
      currentStrokeWidth = parseInt(e.target.value, 10);
    });

    document.getElementById('wbGridToggleBtn')?.addEventListener('click', () => {
      isGridActive = !isGridActive;
      const container = document.getElementById('wbCanvasContainer');
      const btn = document.getElementById('wbGridToggleBtn');
      if (container) container.classList.toggle('grid-mode', isGridActive);
      if (btn) btn.textContent = isGridActive ? '📐 Rrjeta: On' : '📐 Rrjeta: Off';
    });

    document.getElementById('wbClearBtn')?.addEventListener('click', () => {
      if (confirm('A jeni të sigurt që doni të fshini të gjithë tabelën?')) {
        saveUndoState();
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    document.getElementById('wbUndoBtn')?.addEventListener('click', handleUndo);
    document.getElementById('wbRedoBtn')?.addEventListener('click', handleRedo);
    document.getElementById('wbExportBtn')?.addEventListener('click', exportCanvasImage);

    // Canvas drawing mouse events
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      isDrawing = true;
      saveUndoState();

      if (currentTool === 'pen' || currentTool === 'eraser') {
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;

      if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.lineCap = 'round';
        ctx.lineTo(curX, curY);
        ctx.stroke();
      } else if (currentTool === 'eraser') {
        ctx.clearRect(curX - currentStrokeWidth * 2, curY - currentStrokeWidth * 2, currentStrokeWidth * 4, currentStrokeWidth * 4);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDrawing) {
        isDrawing = false;
      }
    });
  }

  function saveUndoState() {
    const canvas = document.getElementById('whiteboardCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStack.push(imgData);
      if (undoStack.length > 20) undoStack.shift();
      redoStack = [];
    } catch (e) { /* ignore in mock environments */ }
  }

  function handleUndo() {
    const canvas = document.getElementById('whiteboardCanvas');
    if (!canvas || undoStack.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      redoStack.push(current);
      const prev = undoStack.pop();
      ctx.putImageData(prev, 0, 0);
    } catch (e) { /* ignore in mock environments */ }
  }

  function handleRedo() {
    const canvas = document.getElementById('whiteboardCanvas');
    if (!canvas || redoStack.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const next = redoStack.pop();
      saveUndoState();
      ctx.putImageData(next, 0, 0);
    } catch (e) { /* ignore in mock environments */ }
  }

  function exportCanvasImage() {
    const canvas = document.getElementById('whiteboardCanvas');
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `shkolla-shenime-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (window.Toast?.success) window.Toast.success('🎨 Shënimet e tabelës u eksportuan në PNG!');
    } catch (e) {
      alert('Eksportimi përfundoi.');
    }
  }

  function open() {
    init();
    const overlay = document.getElementById('whiteboardOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('whiteboardOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.CollaborativeWhiteboard = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
