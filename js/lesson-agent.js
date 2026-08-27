// js/lesson-agent.js
// ===================================================================
// LESSON-SPECIFIC ISOLATED AI AGENT & CHAT SESSIONS
// Provides isolated, granular chat sessions per lesson/chapter.
// Prevents full-book context dumping: only queries and injects
// specific lesson chunks into the AI prompt.
// ===================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'eduai_lesson_chats';

  function loadLessonChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveLessonChats(chats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }

  let activeLessonId = null;
  let activeLessonData = null;

  // ----------------------------------------------------------------
  // SESSION MANAGEMENT
  // ----------------------------------------------------------------
  function getLessonKey(subjectId, grade, chapterId) {
    return `${subjectId || 'general'}_g${grade || 9}_ch_${chapterId || 'default'}`;
  }

  function getLessonChat(subjectId, grade, chapterId) {
    const key = getLessonKey(subjectId, grade, chapterId);
    const chats = loadLessonChats();
    return chats[key] || {
      subjectId,
      grade,
      chapterId,
      messages: [],
      notes: [],
      updatedAt: Date.now()
    };
  }

  function addMessageToLesson(subjectId, grade, chapterId, role, content) {
    const key = getLessonKey(subjectId, grade, chapterId);
    const chats = loadLessonChats();
    if (!chats[key]) {
      chats[key] = {
        subjectId,
        grade,
        chapterId,
        messages: [],
        notes: [],
        updatedAt: Date.now()
      };
    }

    chats[key].messages.push({
      role,
      content,
      timestamp: Date.now()
    });
    chats[key].updatedAt = Date.now();

    // Bound per-lesson history to 40 messages to keep lightweight
    if (chats[key].messages.length > 40) {
      chats[key].messages = chats[key].messages.slice(-40);
    }

    saveLessonChats(chats);
    return chats[key];
  }

  function clearLessonChat(subjectId, grade, chapterId) {
    const key = getLessonKey(subjectId, grade, chapterId);
    const chats = loadLessonChats();
    if (chats[key]) {
      chats[key].messages = [];
      chats[key].updatedAt = Date.now();
      saveLessonChats(chats);
    }
  }

  // ----------------------------------------------------------------
  // LESSON CHUNK RETRIEVAL (Granular — Never dumps whole book)
  // ----------------------------------------------------------------
  function getLessonContext(subjectId, grade, chapterTitle, query) {
    // 1. Fetch relevant chunks from Textbook system if available
    let chunkContext = '';
    if (window.Textbook) {
      const pages = window.Textbook.getPages ? window.Textbook.getPages(subjectId, grade) : [];
      const chapterPages = pages.filter(p => p.chapter && chapterTitle && p.chapter.toLowerCase().includes(chapterTitle.toLowerCase()));
      if (chapterPages.length > 0) {
        chunkContext = chapterPages.slice(0, 3).map(p => `[Libri: ${p.bookTitle} | Fq. ${p.pageNumber}]\n${p.pageText}`).join('\n\n');
      }
    }

    // 2. Fallback to Curriculum RAG lesson units
    if (!chunkContext && window.CurriculumRAG) {
      const pacing = window.CurriculumRAG.getGradePacing ? window.CurriculumRAG.getGradePacing(grade) : { tierName: 'Standard' };
      chunkContext = `[MËSIMI AKTIV: ${chapterTitle || 'Kapitulli'} | Lënda: ${subjectId} | ${pacing.tierName}]\nFokusohu rreptësisht te ky kapitull. Mos kalo në tema të paeksploruara pa e lidhur me konceptet bazë.`;
    }

    return chunkContext;
  }

  // ----------------------------------------------------------------
  // UI DIALOG / LESSON CHAT WINDOW
  // ----------------------------------------------------------------
  function openLessonWorkspace(lesson) {
    activeLessonData = lesson || {
      id: 'ch_1',
      title: 'Mësimi 1: Konceptet Bazë',
      subject: 'Matematikë',
      subjectId: 'matematike',
      grade: 9
    };
    activeLessonId = activeLessonData.id;

    // Remove existing if open
    document.getElementById('lessonAgentOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lessonAgentOverlay';
    overlay.className = 'lesson-agent-overlay';
    overlay.innerHTML = `
      <div class="lesson-agent-window" role="dialog" aria-modal="true">
        <div class="lesson-agent-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="lesson-badge-icon">📖</div>
            <div>
              <h2 style="margin:0;font-size:17px;font-weight:800;color:var(--text)">${activeLessonData.title}</h2>
              <div style="font-size:12px;color:var(--text-muted)">${activeLessonData.subject} · Klasa ${activeLessonData.grade} · Asistent i Përkushtuar i Mësimit</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button id="lessonClearChatBtn" class="os-btn-secondary" style="padding:5px 10px;font-size:12px" title="Pastro bisedën e këtij mësimi">🗑️ Pastro</button>
            <button id="lessonCloseBtn" class="school-os-close-btn" title="Mbyll">&times;</button>
          </div>
        </div>

        <div class="lesson-agent-body">
          <!-- Sidebar: Key Lesson Resources & Objectives -->
          <div class="lesson-sidebar">
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">🎯 OBJEKTIVAT E MËSIMIT:</div>
            <div class="lesson-objective-card">
              <div style="font-weight:600;font-size:12.5px;color:var(--text)">Përvetësimi i formulave & ligjeve kyçe</div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Zgjidhje hap pas hapi me arsyetim logjik.</div>
            </div>

            <div style="margin-top:16px;font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">📚 TEKSTI & FORMULAT:</div>
            <div class="lesson-excerpt-card" id="lessonExcerptBox">
              Duke ngarkuar materialet e kapitullit...
            </div>

            <div style="margin-top:16px">
              <button id="lessonLaunchLabBtn" class="os-btn-primary" style="width:100%;font-size:12px;padding:8px">⚡ Eksperimento në Laborator</button>
            </div>
          </div>

          <!-- Main: Lesson Isolated Chat Thread -->
          <div class="lesson-chat-container">
            <div class="lesson-chat-messages" id="lessonChatMessages"></div>
            
            <div class="lesson-chat-input-row">
              <input type="text" id="lessonChatInput" class="lesson-input" placeholder="Bëj një pyetje rreth këtij mësimi..." />
              <button id="lessonChatSendBtn" class="os-btn-primary" style="padding:0 18px;font-weight:700">Dërgo</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderLessonMessages();
    renderLessonExcerpt();
  }

  function wireEvents() {
    const overlay = document.getElementById('lessonAgentOverlay');
    document.getElementById('lessonCloseBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.getElementById('lessonClearChatBtn')?.addEventListener('click', () => {
      if (confirm('A dëshironi të fshini bisedën për këtë mësim?')) {
        clearLessonChat(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.id);
        renderLessonMessages();
      }
    });

    const input = document.getElementById('lessonChatInput');
    const sendBtn = document.getElementById('lessonChatSendBtn');

    sendBtn?.addEventListener('click', handleSend);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    document.getElementById('lessonLaunchLabBtn')?.addEventListener('click', () => {
      close();
      if (window.InteractiveLab?.open) {
        window.InteractiveLab.open();
      }
    });
  }

  function renderLessonMessages() {
    const container = document.getElementById('lessonChatMessages');
    if (!container) return;

    const chat = getLessonChat(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.id);
    if (chat.messages.length === 0) {
      container.innerHTML = `
        <div class="lesson-empty-state">
          <div style="font-size:32px;margin-bottom:8px">💡</div>
          <div style="font-weight:700;font-size:14px;color:var(--text)">Mirësevini te Asistenti i Mësimit!</div>
          <div style="font-size:12px;color:var(--text-muted);max-width:320px;margin-top:4px">
            Pyet për konceptet, formulat, ushtrimet dhe keqkuptimet kryesore vetëm për këtë kapitull.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = chat.messages.map(m => `
      <div class="lesson-msg-row ${m.role}">
        <div class="lesson-msg-bubble ${m.role}">
          <div style="font-size:11px;font-weight:700;opacity:0.7;margin-bottom:3px">${m.role === 'user' ? 'Nxënësi' : 'EduAI Mësuesi'}</div>
          <div>${escapeHtml(m.content)}</div>
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  function renderLessonExcerpt() {
    const box = document.getElementById('lessonExcerptBox');
    if (!box) return;

    const excerpt = getLessonContext(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.title, '');
    box.textContent = excerpt ? excerpt.slice(0, 300) + '...' : 'Materialet e integruara të mësimit janë aktive në memorie.';
  }

  async function handleSend() {
    const input = document.getElementById('lessonChatInput');
    const sendBtn = document.getElementById('lessonChatSendBtn');
    const text = (input?.value || '').trim();
    if (!text) return;

    input.value = '';
    sendBtn.disabled = true;

    // 1. Add user message to lesson chat
    addMessageToLesson(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.id, 'user', text);
    renderLessonMessages();

    // 2. Build isolated prompt
    const lessonCtx = getLessonContext(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.title, text);
    const systemPrompt = `Ti je EduAI, asistent pedagogjik i përkushtuar VETËM për mësimin: "${activeLessonData.title}" (Klasa ${activeLessonData.grade}, Lënda: ${activeLessonData.subject}).\n` +
      `KONTEKSTI I MËSIMIT (Pjesë e nxjerrë nga libri):\n${lessonCtx}\n` +
      `RREGULLA: Përgjigju shkurt, saktë dhe me arsyetim pedagogjik Sokratik. Mos bëj hyrje të gjata. Përdor formulat e këtij mësimi.`;

    const chatHistory = getLessonChat(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.id).messages.slice(-6);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      let assistantResponse = '';
      const endpoint = window.AppState?.api?.endpoint || 'http://localhost:11434/v1/chat/completions';
      const model = window.HardwareProfile?.getProfileSettings()?.model || 'gemma3:4b';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama' },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 600
        })
      });

      if (res.ok) {
        const data = await res.json();
        assistantResponse = data.choices?.[0]?.message?.content || 'Përgjigja nuk u mor.';
      } else {
        assistantResponse = `E kuptoj pyetjen tënde për ${activeLessonData.title}. Le ta analizojmë së bashku hap pas hapi: Cili është hapi i parë që do të zbatoje duke u bazuar te formula kryesore?`;
      }

      addMessageToLesson(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.id, 'assistant', assistantResponse);
      renderLessonMessages();
    } catch {
      const fallback = `Te mësimi "${activeLessonData.title}", vëzhgojmë se rregulli kryesor bazohet në konceptet themelore. Provo të zbatosh hapat një nga një!`;
      addMessageToLesson(activeLessonData.subjectId, activeLessonData.grade, activeLessonData.id, 'assistant', fallback);
      renderLessonMessages();
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      input?.focus();
    }
  }

  function close() {
    document.getElementById('lessonAgentOverlay')?.remove();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Export
  window.LessonAgent = {
    open: openLessonWorkspace,
    close,
    getLessonChat,
    addMessageToLesson,
    clearLessonChat,
    getLessonContext
  };

  console.log('✅ Lesson-Specific Isolated AI Agent loaded');
})();
