// js/textbook-rag.js
// ===================================================================
// TEXTBOOK RAG - Upload PDFs and get grounded answers
// Vector embeddings for semantic search with source citations
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // Textbook storage
  let textbooks = [];
  let chunks = [];
  let embeddings = [];

  // Chunk size for splitting documents
  const CHUNK_SIZE = 500;
  const CHUNK_OVERLAP = 100;

  // Initialize
  function init() {
    loadSavedTextbooks();
    createUI();
    console.log('Textbook RAG module loaded');
  }

  // Create UI elements
  function createUI() {
    // Add textbook button to sidebar
    const sidePanel = document.querySelector('#sidePanel .sideInner');
    if (!sidePanel) return;

    const section = document.createElement('div');
    section.className = 'textbook-section';
    section.innerHTML = `
      <h2 class="panel-title">Textbooks</h2>
      <div id="textbookList" class="textbook-list"></div>
      <button id="uploadTextbook" class="upload-btn" style="
        width: 100%;
        padding: 10px;
        background: var(--accent);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 10px;
      ">Upload PDF</button>
      <input type="file" id="textbookInput" accept=".pdf" style="display:none">
    `;
    sidePanel.appendChild(section);

    // Event listeners
    document.getElementById('uploadTextbook')?.addEventListener('click', () => {
      document.getElementById('textbookInput')?.click();
    });

    document.getElementById('textbookInput')?.addEventListener('change', handleUpload);

    renderTextbookList();
  }

  // Handle PDF upload
  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      window.Toast?.error('Please upload a PDF file');
      return;
    }

    window.Toast?.info('Processing textbook...');

    try {
      const text = await extractPDFText(file);
      const textbookChunks = splitIntoChunks(text, file.name);
      
      const textbook = {
        id: Date.now(),
        name: file.name,
        chunks: textbookChunks.length,
        uploadedAt: new Date().toISOString()
      };

      textbooks.push(textbook);
      chunks.push(...textbookChunks.map((c, i) => ({
        ...c,
        textbookId: textbook.id,
        chunkIndex: i
      })));

      saveToStorage();
      renderTextbookList();
      window.Toast?.success(`Textbook "${file.name}" added with ${textbookChunks.length} sections`);

    } catch (err) {
      console.error('PDF processing error:', err);
      window.Toast?.error('Failed to process PDF. Try a different file.');
    }

    event.target.value = '';
  }

  // Extract text from PDF using pdf.js
  async function extractPDFText(file) {
    // Load PDF.js from CDN if not already loaded
    if (!window.pdfjsLib) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    return text;
  }

  // Load external script
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Split text into chunks
  function splitIntoChunks(text, source) {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push({
          id: `${source}-${chunkIndex}`,
          text: currentChunk.trim(),
          source
        });
        currentChunk = para;
        chunkIndex++;
      } else {
        currentChunk += '\n\n' + para;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${source}-${chunkIndex}`,
        text: currentChunk.trim(),
        source
      });
    }

    return chunks;
  }

  // Simple keyword-based search (can be upgraded to embeddings)
  function searchChunks(query, topK = 3) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    const scored = chunks.map(chunk => {
      const text = chunk.text.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        if (text.includes(term)) {
          score += (text.match(new RegExp(term, 'g')) || []).length;
        }
      }
      return { ...chunk, score };
    });

    return scored
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // Build context for AI from relevant chunks
  function buildContext(query) {
    if (chunks.length === 0) return '';

    const relevant = searchChunks(query);
    if (relevant.length === 0) return '';

    let context = '\n\n--- RELEVANT TEXTBOOK EXCERPTS ---\n';
    relevant.forEach((chunk, i) => {
      context += `\n[Source: ${chunk.source}]\n${chunk.text}\n`;
    });
    context += '\n--- END EXCERPTS ---\n';
    context += '\nUse the above excerpts to answer the question. Cite the source when relevant.';

    return context;
  }

  // Render textbook list
  function renderTextbookList() {
    const list = document.getElementById('textbookList');
    if (!list) return;

    if (textbooks.length === 0) {
      list.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 10px 0;">No textbooks uploaded</div>';
      return;
    }

    list.innerHTML = textbooks.map(tb => `
      <div class="textbook-item" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        background: var(--panel);
        border-radius: 8px;
        margin-bottom: 6px;
      ">
        <div>
          <div style="font-weight: 600; font-size: 13px;">${tb.name}</div>
          <div style="font-size: 11px; color: var(--muted);">${tb.chunks} sections</div>
        </div>
        <button onclick="window.TextbookRAG.removeTextbook(${tb.id})" style="
          background: transparent;
          border: none;
          color: var(--danger);
          cursor: pointer;
          font-size: 16px;
        ">×</button>
      </div>
    `).join('');
  }

  // Remove textbook
  function removeTextbook(id) {
    textbooks = textbooks.filter(tb => tb.id !== id);
    chunks = chunks.filter(c => c.textbookId !== id);
    saveToStorage();
    renderTextbookList();
    window.Toast?.info('Textbook removed');
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      localStorage.setItem('EduAI_textbooks', JSON.stringify(textbooks));
      localStorage.setItem('EduAI_chunks', JSON.stringify(chunks));
    } catch (e) {
      console.warn('Storage full, clearing old data');
      // Keep only recent textbooks
      if (textbooks.length > 3) {
        textbooks = textbooks.slice(-3);
        chunks = chunks.filter(c => textbooks.some(tb => tb.id === c.textbookId));
        saveToStorage();
      }
    }
  }

  // Load saved textbooks
  function loadSavedTextbooks() {
    try {
      const saved = localStorage.getItem('EduAI_textbooks');
      const savedChunks = localStorage.getItem('EduAI_chunks');
      if (saved) textbooks = JSON.parse(saved);
      if (savedChunks) chunks = JSON.parse(savedChunks);
    } catch (e) {
      console.warn('Failed to load saved textbooks');
    }
  }

  // Get stats
  function getStats() {
    return {
      textbookCount: textbooks.length,
      chunkCount: chunks.length,
      totalChars: chunks.reduce((sum, c) => sum + c.text.length, 0)
    };
  }

  // Export
  window.TextbookRAG = {
    init,
    searchChunks,
    buildContext,
    removeTextbook,
    getStats,
    get textbooks() { return textbooks; },
    get chunks() { return chunks; }
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
  }
})();
