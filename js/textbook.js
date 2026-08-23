// js/textbook.js
// ===================================================================
// TEXTBOOK RAG SYSTEM
// Upload textbook pages (PDF/image/text), store with metadata,
// retrieve relevant pages and inject into AI context automatically.
// Works fully offline — no external vector DB needed.
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) { console.error('❌ AppState not loaded'); return; }

  // ----------------------------------------------------------------
  // STORAGE — localStorage with structured index
  // Key: textbook_pages  → array of page objects
  // Key: textbook_index  → { subject → [ pageIds ] }
  // ----------------------------------------------------------------
  const STORAGE_KEY   = 'eduai_textbook_pages';
  const INDEX_KEY     = 'eduai_textbook_index';
  const MAX_PAGES     = 2000; // per student install

  function loadPages() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function savePages(pages) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }

  function loadIndex() {
    try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveIndex(index) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  // ----------------------------------------------------------------
  // ADD PAGE
  // ----------------------------------------------------------------
  function addPage({ subject, grade, bookTitle, chapter, pageNumber, pageText, imageDataUrl }) {
    const pages = loadPages();
    if (pages.length >= MAX_PAGES) {
      console.warn('📚 Textbook storage full. Remove old books first.');
      return null;
    }

    const existing = pages.findIndex(p =>
      p.bookTitle === bookTitle && p.pageNumber === pageNumber
    );

    const page = {
      id:           existing >= 0 ? pages[existing].id : `pg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      subject:      subject      || 'general',
      grade:        grade        || null,
      bookTitle:    bookTitle    || 'Untitled Book',
      chapter:      chapter      || null,
      pageNumber:   pageNumber   || 1,
      pageText:     (pageText    || '').slice(0, 8000), // cap per page
      imageDataUrl: imageDataUrl || null,               // base64 for scanned pages
      addedAt:      Date.now(),
      wordCount:    (pageText || '').split(/\s+/).length
    };

    if (existing >= 0) {
      pages[existing] = page;
    } else {
      pages.push(page);
    }

    savePages(pages);
    rebuildIndex(pages);
    console.log(`📖 Page saved: ${bookTitle} p.${pageNumber}`);
    return page;
  }

  // ----------------------------------------------------------------
  // REBUILD INDEX
  // ----------------------------------------------------------------
  function rebuildIndex(pages) {
    const index = {};
    pages.forEach(p => {
      if (!index[p.subject]) index[p.subject] = [];
      if (!index[p.subject].includes(p.id)) index[p.subject].push(p.id);
    });
    saveIndex(index);
  }

  // ----------------------------------------------------------------
  // RETRIEVE RELEVANT PAGES  (keyword search — simple but effective)
  // Returns top N pages most relevant to a query within a subject
  // ----------------------------------------------------------------
  function retrieveRelevantPages(query, subject, topN = 3) {
    const pages = loadPages();

    // Filter by subject (also include 'general')
    const candidates = pages.filter(p =>
      p.subject === subject || p.subject === 'general' || !subject
    );

    if (candidates.length === 0) return [];

    // Tokenize query
    const queryWords = query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (queryWords.length === 0) return candidates.slice(0, topN);

    // Score each page by keyword matches + position bonus
    const scored = candidates.map(page => {
      const text = (page.pageText + ' ' + (page.chapter || '') + ' ' + page.bookTitle).toLowerCase();
      let score = 0;

      queryWords.forEach(word => {
        // Exact word match
        const matches = (text.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        score += matches * 2;

        // Partial match (stemming approximation)
        if (text.includes(word)) score += 1;
      });

      return { page, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(s => s.page);
  }

  // ----------------------------------------------------------------
  // BUILD CONTEXT BLOCK  (injected into system prompt)
  // ----------------------------------------------------------------
  function buildTextbookContext(query, subject, currentPage = null) {
    const pages = [];

    // 1. If a specific page is set (teacher told student "open page 47")
    if (currentPage) {
      const allPages = loadPages();
      const exact = allPages.find(p =>
        p.pageNumber === currentPage &&
        (p.subject === subject || p.subject === 'general')
      );
      if (exact) pages.push(exact);
    }

    // 2. Semantic search for relevant pages
    const relevant = retrieveRelevantPages(query, subject, currentPage ? 2 : 3);
    relevant.forEach(p => {
      if (!pages.find(existing => existing.id === p.id)) pages.push(p);
    });

    if (pages.length === 0) return null;

    let context = `\n\n--- TEXTBOOK CONTEXT ---\n`;
    context += `The following pages from the student's actual textbook are relevant to this question.\n`;
    context += `Use this content as your primary source. Always reference the book and page number.\n\n`;

    pages.forEach((p, i) => {
      context += `[Source ${i + 1}] "${p.bookTitle}"`;
      if (p.chapter)     context += ` — ${p.chapter}`;
      context += ` — Page ${p.pageNumber}\n`;
      context += `${p.pageText}\n\n`;
    });

    context += `--- END TEXTBOOK CONTEXT ---\n`;
    return context;
  }

  // ----------------------------------------------------------------
  // LIST ALL BOOKS
  // ----------------------------------------------------------------
  function listBooks() {
    const pages = loadPages();
    const books = {};
    pages.forEach(p => {
      if (!books[p.bookTitle]) {
        books[p.bookTitle] = {
          title:   p.bookTitle,
          subject: p.subject,
          grade:   p.grade,
          pages:   0,
          addedAt: p.addedAt
        };
      }
      books[p.bookTitle].pages++;
    });
    return Object.values(books);
  }

  // ----------------------------------------------------------------
  // DELETE BOOK
  // ----------------------------------------------------------------
  function deleteBook(bookTitle) {
    let pages = loadPages();
    pages = pages.filter(p => p.bookTitle !== bookTitle);
    savePages(pages);
    rebuildIndex(pages);
    console.log(`🗑️ Book deleted: ${bookTitle}`);
  }

  // ----------------------------------------------------------------
  // PDF IMPORT — reads a PDF file page by page using pdf.js (CDN)
  // Falls back to text extraction if pdf.js not available
  // ----------------------------------------------------------------
  async function importPDFFile(file, { subject, grade, bookTitle, startPage = 1 } = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;

        // Try pdf.js
        if (window.pdfjsLib) {
          try {
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;
            let imported = 0;

            for (let i = 1; i <= totalPages; i++) {
              const pdfPage = await pdf.getPage(i);
              const textContent = await pdfPage.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');

              addPage({
                subject,
                grade,
                bookTitle: bookTitle || file.name.replace('.pdf', ''),
                chapter:    null,
                pageNumber: startPage + i - 1,
                pageText
              });
              imported++;

              // Progress callback
              if (window.onTextbookImportProgress) {
                window.onTextbookImportProgress(i, totalPages);
              }
            }

            resolve({ imported, total: totalPages });
          } catch (err) {
            reject(err);
          }
        } else {
          // Fallback: treat as text
          const text = new TextDecoder().decode(arrayBuffer);
          addPage({
            subject, grade,
            bookTitle: bookTitle || file.name,
            pageNumber: startPage,
            pageText: text.slice(0, 8000)
          });
          resolve({ imported: 1, total: 1 });
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // ----------------------------------------------------------------
  // IMPORT IMAGE PAGE (scanned textbook photo)
  // ----------------------------------------------------------------
  async function importImagePage(file, { subject, grade, bookTitle, pageNumber, chapter } = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;

        // If Tesseract.js is available, run OCR
        if (window.Tesseract) {
          window.Tesseract.recognize(imageDataUrl, 'eng', {
            logger: m => console.log(`OCR: ${m.status} ${Math.round((m.progress||0)*100)}%`)
          }).then(({ data: { text } }) => {
            const page = addPage({
              subject, grade, bookTitle, chapter, pageNumber,
              pageText: text,
              imageDataUrl
            });
            resolve(page);
          }).catch(reject);
        } else {
          // Store image without OCR text
          const page = addPage({
            subject, grade, bookTitle, chapter, pageNumber,
            pageText: `[Scanned page — image stored, no OCR text available]`,
            imageDataUrl
          });
          resolve(page);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ----------------------------------------------------------------
  // UI — TEXTBOOK MANAGER MODAL
  // ----------------------------------------------------------------
  function openTextbookManager() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:3000';

    const books = listBooks();
    const pages = loadPages();
    const subjects = window.Subjects ? window.Subjects.getAll().map(s =>
      `<option value="${s.id}">${s.emoji} ${s.label}</option>`
    ).join('') : '';

    overlay.innerHTML = `
      <div class="modal" style="width:600px;max-height:85vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h3 style="margin:0;color:var(--accent)">📚 Textbook Library</h3>
          <button id="closeTbManager" class="icon-btn" style="width:28px;height:28px;font-size:18px">×</button>
        </div>

        <div style="padding:16px;background:var(--assistant);border-radius:12px;margin-bottom:20px">
          <h4 style="margin:0 0 12px;color:var(--accent)">📤 Import Textbook</h4>

          <div class="modalRow" style="flex-direction:column;gap:8px">
            <label style="font-size:13px;color:var(--muted)">Book Title</label>
            <input type="text" id="tbBookTitle" class="modal-input" placeholder="e.g. Algebra 1 — McDougal Littell" />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
            <div>
              <label style="font-size:13px;color:var(--muted)">Subject</label>
              <select id="tbSubject" class="modal-input" style="margin-top:4px">${subjects}</select>
            </div>
            <div>
              <label style="font-size:13px;color:var(--muted)">Grade Level</label>
              <select id="tbGrade" class="modal-input" style="margin-top:4px">
                ${Array.from({length:12},(_,i)=>`<option value="${i+1}">Grade ${i+1}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="margin-top:10px">
            <label style="font-size:13px;color:var(--muted)">Start from page number</label>
            <input type="number" id="tbStartPage" class="modal-input" value="1" min="1" style="margin-top:4px;width:100px" />
          </div>

          <div style="margin-top:14px;display:flex;gap:10px">
            <label style="flex:1;cursor:pointer;padding:12px;background:var(--user);color:white;
                   border-radius:10px;text-align:center;font-weight:600;font-size:14px">
              📄 Import PDF
              <input type="file" id="tbPdfInput" accept=".pdf" style="display:none" />
            </label>
            <label style="flex:1;cursor:pointer;padding:12px;background:#7c3aed;color:white;
                   border-radius:10px;text-align:center;font-weight:600;font-size:14px">
              📸 Import Image Page
              <input type="file" id="tbImageInput" accept="image/*" style="display:none" />
            </label>
            <label style="flex:1;cursor:pointer;padding:12px;background:#059669;color:white;
                   border-radius:10px;text-align:center;font-weight:600;font-size:14px">
              ✏️ Paste Text
              <input type="button" id="tbPasteBtn" style="display:none" />
            </label>
          </div>

          <div id="tbProgress" style="display:none;margin-top:12px;padding:10px;
               background:#dbeafe;border-radius:8px;font-size:13px;text-align:center">
            Importing...
          </div>
        </div>

        <!-- Paste text panel -->
        <div id="tbPastePanel" style="display:none;padding:16px;background:var(--assistant);
             border-radius:12px;margin-bottom:20px">
          <h4 style="margin:0 0 10px;color:var(--accent)">✏️ Paste Page Text</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div>
              <label style="font-size:13px;color:var(--muted)">Page Number</label>
              <input type="number" id="tbPastePageNum" class="modal-input" value="1" min="1" style="margin-top:4px" />
            </div>
            <div>
              <label style="font-size:13px;color:var(--muted)">Chapter (optional)</label>
              <input type="text" id="tbPasteChapter" class="modal-input" placeholder="e.g. Chapter 3" style="margin-top:4px" />
            </div>
          </div>
          <textarea id="tbPasteText" class="modal-input" rows="6"
            placeholder="Paste the textbook page text here…"
            style="width:100%;resize:vertical;margin-top:4px"></textarea>
          <button id="tbSavePaste" class="btn-primary" style="margin-top:10px;width:100%">
            💾 Save Page
          </button>
        </div>

        <!-- Library -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h4 style="margin:0;color:var(--accent)">📖 Imported Books</h4>
            <span style="font-size:12px;color:var(--muted)">${pages.length} / ${MAX_PAGES} pages used</span>
          </div>

          ${books.length === 0 ? `
            <div style="padding:30px;text-align:center;color:var(--muted);background:var(--panel);border-radius:10px">
              No books imported yet. Import a PDF or paste page text above.
            </div>
          ` : books.map(b => `
            <div style="padding:14px;background:var(--panel);border-radius:10px;margin-bottom:8px;
                 display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700;font-size:14px">📖 ${b.title}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:2px">
                  ${b.subject} · Grade ${b.grade || '?'} · ${b.pages} pages imported
                </div>
              </div>
              <button class="delete-book-btn" data-title="${b.title}"
                style="padding:6px 12px;background:#fee2e2;color:#dc2626;border:none;
                border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">
                🗑️ Delete
              </button>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:16px;text-align:center">
          <button id="closeTbManager2" class="btn-secondary">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close
    const close = () => overlay.remove();
    overlay.querySelector('#closeTbManager').addEventListener('click', close);
    overlay.querySelector('#closeTbManager2').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Paste panel toggle
    overlay.querySelector('#tbPasteBtn').addEventListener('click', () => {
      const panel = overlay.querySelector('#tbPastePanel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    overlay.querySelector('label:nth-of-type(3)').addEventListener('click', () => {
      const panel = overlay.querySelector('#tbPastePanel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // Save pasted text
    overlay.querySelector('#tbSavePaste').addEventListener('click', () => {
      const text    = overlay.querySelector('#tbPasteText').value.trim();
      const pageNum = parseInt(overlay.querySelector('#tbPastePageNum').value) || 1;
      const chapter = overlay.querySelector('#tbPasteChapter').value.trim();
      const title   = overlay.querySelector('#tbBookTitle').value.trim() || 'Untitled Book';
      const subject = overlay.querySelector('#tbSubject').value;
      const grade   = parseInt(overlay.querySelector('#tbGrade').value);

      if (!text) { alert('Please paste some text first.'); return; }

      addPage({ subject, grade, bookTitle: title, chapter, pageNumber: pageNum, pageText: text });
      overlay.querySelector('#tbPasteText').value = '';
      overlay.querySelector('#tbPastePageNum').value = pageNum + 1;
      showToast(`✅ Page ${pageNum} saved!`);
    });

    // PDF import
    overlay.querySelector('#tbPdfInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const title   = overlay.querySelector('#tbBookTitle').value.trim() || file.name.replace('.pdf','');
      const subject = overlay.querySelector('#tbSubject').value;
      const grade   = parseInt(overlay.querySelector('#tbGrade').value);
      const startPg = parseInt(overlay.querySelector('#tbStartPage').value) || 1;

      const progress = overlay.querySelector('#tbProgress');
      progress.style.display = 'block';
      progress.textContent = 'Starting import...';

      window.onTextbookImportProgress = (current, total) => {
        progress.textContent = `Importing page ${current} of ${total}...`;
      };

      try {
        // Inject pdf.js if not loaded
        if (!window.pdfjsLib) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const result = await importPDFFile(file, { subject, grade, bookTitle: title, startPage: startPg });
        progress.textContent = `✅ Imported ${result.imported} pages successfully!`;
        setTimeout(() => { close(); openTextbookManager(); }, 1500);
      } catch (err) {
        progress.textContent = `❌ Import failed: ${err.message}`;
        console.error(err);
      }
    });

    // Image import
    overlay.querySelector('#tbImageInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const title   = overlay.querySelector('#tbBookTitle').value.trim() || 'Scanned Book';
      const subject = overlay.querySelector('#tbSubject').value;
      const grade   = parseInt(overlay.querySelector('#tbGrade').value);
      const pageNum = parseInt(overlay.querySelector('#tbStartPage').value) || 1;

      const progress = overlay.querySelector('#tbProgress');
      progress.style.display = 'block';
      progress.textContent = 'Processing image...';

      try {
        await importImagePage(file, { subject, grade, bookTitle: title, pageNumber: pageNum });
        progress.textContent = `✅ Page ${pageNum} imported!`;
        setTimeout(() => { close(); openTextbookManager(); }, 1200);
      } catch (err) {
        progress.textContent = `❌ Failed: ${err.message}`;
      }
    });

    // Delete book
    overlay.querySelectorAll('.delete-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        if (confirm(`Delete all pages from "${title}"?`)) {
          deleteBook(title);
          close();
          openTextbookManager();
        }
      });
    });
  }

  // ----------------------------------------------------------------
  // INJECT TEXTBOOK BUTTON into sidebar
  // ----------------------------------------------------------------
  function injectTextbookButton() {
    const container = document.getElementById('studentToolsSection') ||
                      document.getElementById('teacherFeatureButtons');
    if (!container || document.getElementById('textbookBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'textbookBtn';
    btn.style.cssText = `width:100%;padding:10px;margin-top:8px;
      background:linear-gradient(135deg,#b45309,#92400e);
      color:white;border:none;border-radius:10px;font-weight:600;
      cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px`;
    btn.innerHTML = '<span>📚</span> Textbook Library';
    btn.addEventListener('click', openTextbookManager);
    container.appendChild(btn);
  }

  // ----------------------------------------------------------------
  // SET CURRENT PAGE  (teacher tells student "open page 47")
  // ----------------------------------------------------------------
  let _currentPage = null;
  let _currentSubject = null;

  function setCurrentPage(pageNumber, subject) {
    _currentPage    = pageNumber;
    _currentSubject = subject;
    console.log(`📖 Current page set: ${pageNumber} (${subject})`);
  }

  function getCurrentPageContext(query, subject) {
    return buildTextbookContext(query, subject || _currentSubject, _currentPage);
  }

  // ----------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function showToast(msg, color = '#16a34a') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:20px;right:20px;background:${color};color:white;
      padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:10000`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ----------------------------------------------------------------
  // INIT
  // ----------------------------------------------------------------
  setTimeout(injectTextbookButton, 1000);

  // ----------------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------------
  window.Textbook = {
    addPage,
    retrieveRelevantPages,
    buildTextbookContext,
    getCurrentPageContext,
    setCurrentPage,
    listBooks,
    deleteBook,
    openTextbookManager,
    importPDFFile,
    importImagePage
  };

  console.log(`✅ Textbook RAG system loaded — ${loadPages().length} pages in library`);
})();
