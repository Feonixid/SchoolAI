// js/ai-core.js
// ===================================================================
// AI CHAT CORE - Message handling and API communication
// Powered by Gemma 4 running locally via Ollama
// Supports: multi-subject, test mode, classroom language routing
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) { console.error('❌ AppState not loaded!'); return; }

  const chatDiv   = document.getElementById('chat');
  const inputArea = document.getElementById('input');
  const sendBtn   = document.getElementById('sendBtn');
  const clearBtn  = document.getElementById('clearBtn');

  // ----------------------------------------------------------------
  // RENDER MESSAGE
  // ----------------------------------------------------------------
  function renderMathFormulas(html) {
    if (!window.katex) return html;

    // 1. Block math: $$ ... $$
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
      try {
        return `<div class="katex-block">${window.katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return match;
      }
    });

    // 2. Inline math: $ ... $ (excluding currency like $50)
    html = html.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, expr) => {
      // Avoid currency or pure numbers
      if (/^\s*\d+([.,]\d+)?\s*$/.test(expr)) return match;
      try {
        return `${prefix}<span class="katex-inline">${window.katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch (e) {
        return match;
      }
    });

    return html;
  }

  function enhanceCodeBlocks(container) {
    container.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (!code) return;

      const rawCode = code.textContent;
      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
      const lang = langClass ? langClass.replace('language-', '').toUpperCase() : 'CODE';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span class="code-lang-badge">${lang}</span>
        <div class="code-block-actions">
          <button class="code-copy-btn" title="Copy code">📋 Copy</button>
          ${['PYTHON', 'JAVASCRIPT', 'JS', 'HTML'].includes(lang) ? `<button class="code-run-btn" title="Open and run in Dev Panel">▶ Run</button>` : ''}
        </div>
      `;

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      // Copy button event
      header.querySelector('.code-copy-btn')?.addEventListener('click', (e) => {
        navigator.clipboard.writeText(rawCode).then(() => {
          const btn = e.target;
          const orig = btn.innerHTML;
          btn.innerHTML = '✅ Copied!';
          btn.style.color = '#34c759';
          setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
        });
      });

      // Run in Dev Panel event
      header.querySelector('.code-run-btn')?.addEventListener('click', () => {
        if (window.TerminalUI?.openPanel) {
          window.TerminalUI.injectPanel?.();
          window.TerminalUI.openPanel('coding');
          const editor = document.getElementById('dpEditor');
          if (editor) {
            editor.value = rawCode;
            editor.dispatchEvent(new Event('input'));
          }
        }
      });
    });
  }

  function appendMessageToolbar(bubble, content) {
    const bar = document.createElement('div');
    bar.className = 'message-action-bar';
    bar.innerHTML = `
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
        <button class="followup-pill" data-prompt="Më jep një shembull praktik dhe të thjeshtë për këtë koncept.">💡 Shembull</button>
        <button class="followup-pill" data-prompt="A mund ta shpjegosh më thjeshtë hap pas hapi?">📖 Më Thjeshtë</button>
        <button class="followup-pill" data-prompt="Më bëj një pyetje të shpejtë për të testuar nëse e kuptova siç duhet.">🧪 Më Testo</button>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="msg-action-btn copy-msg" title="Copy response">📋 Kopjo</button>
        <button class="msg-action-btn speak-msg" title="Lexo me zë (TTS)">🔊 Dëgjo</button>
        <button class="msg-action-btn note-msg" title="Ruaj në Shënime">📝 Shënime</button>
      </div>
    `;

    // Wire follow-up pills
    bar.querySelectorAll('.followup-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        if (inputArea) {
          inputArea.value = pill.dataset.prompt;
          sendBtn?.click();
        }
      });
    });

    bar.querySelector('.copy-msg')?.addEventListener('click', (e) => {
      navigator.clipboard.writeText(content).then(() => {
        const btn = e.currentTarget;
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ Kopjuar!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
      });
    });

    bar.querySelector('.speak-msg')?.addEventListener('click', () => {
      if (window.TTS) window.TTS.speak(content);
      else if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(content.replace(/[#*`_]/g, ''));
        window.speechSynthesis.speak(u);
      }
    });

    bar.querySelector('.note-msg')?.addEventListener('click', () => {
      if (window.Workspace?.addNote) {
        window.Workspace.addNote(content.substring(0, 40) + '...', content);
        if (window.Toast?.success) window.Toast.success('U ruajt në Shënimet e Studimit!');
      } else {
        const notes = JSON.parse(localStorage.getItem('eduai_saved_notes') || '[]');
        notes.push({ date: new Date().toISOString(), text: content });
        localStorage.setItem('eduai_saved_notes', JSON.stringify(notes));
        if (window.Toast?.success) window.Toast.success('U ruajt në Shënime!');
      }
    });

    bubble.appendChild(bar);
  }

  function addMessage(role, content) {
    if (!chatDiv) return;
    const row    = document.createElement('div');
    row.className = `row ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'assistant') {
      let html = '';
      if (window.markdownit) {
        html = window.markdownit().render(content);
      } else {
        html = content.replace(/\n/g, '<br>');
      }
      
      html = renderMathFormulas(html);
      bubble.innerHTML = html;
      applyGrammarHighlighting(bubble);
      enhanceCodeBlocks(bubble);
      appendMessageToolbar(bubble, content);

      // Socratic scaffolding: append interactive ladder if Socratic mode is on
      if (window.SocraticTutor && window.SocraticTutor.isEnabled()) {
        const badge = document.createElement('div');
        badge.className = 'socratic-badge';
        badge.innerHTML = '🧠 Socratic Mode';
        bubble.insertBefore(badge, bubble.firstChild);
      }
    } else {
      bubble.textContent = content;

      // Check for common misconceptions in student messages
      if (window.SocraticTutor && window.SocraticTutor.isEnabled()) {
        const misconception = window.SocraticTutor.detectMisconception(content);
        if (misconception) {
          const warning = document.createElement('div');
          warning.className = 'metacognition-box';
          warning.innerHTML = `
            <div class="metacognition-title">💡 Learning Tip: ${misconception.concept}</div>
            <div>${misconception.explanation}</div>
          `;
          row.appendChild(bubble);
          row.appendChild(warning);
          chatDiv.appendChild(row);
          chatDiv.scrollTop = chatDiv.scrollHeight;
          return;
        }
      }
    }

    row.appendChild(bubble);
    chatDiv.appendChild(row);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }

  function applyGrammarHighlighting(element) {
    if (!window.grammarKeywords) return;
    let html = element.innerHTML;
    window.grammarKeywords.forEach(kw => {
      const re = new RegExp(`\\b${kw.word}\\b`, 'gi');
      html = html.replace(re, m => `<span class="grammar-keyword ${kw.key}" style="color:${kw.color}" title="${kw.explanation}">${m}</span>`);
    });
    element.innerHTML = html;
  }

  function addThinking() {
    if (!chatDiv) return;
    const row    = document.createElement('div');
    row.className = 'row assistant';
    row.id        = 'thinking-indicator';
    const bubble  = document.createElement('div');
    bubble.className = 'bubble thinking';
    const subjectLabel = window.Subjects ? window.Subjects.getActive().label : 'ShqipAI';
    bubble.textContent = `${subjectLabel} is thinking…`;
    row.appendChild(bubble);
    chatDiv.appendChild(row);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }

  function removeThinking() {
    const t = document.getElementById('thinking-indicator');
    if (t) t.remove();
  }

  // ----------------------------------------------------------------
  // BUILD SYSTEM PROMPT
  // Priority: test mode > subject prompt > Albanian language prompt
  // Always appends: language instruction
  // ----------------------------------------------------------------
  async function buildSystemPrompt() {
    let systemPrompt = '';

    // 1. TEST MODE — overrides everything
    if (window.Classroom && window.Classroom.isTestModeActive()) {
      const testPrompt = window.Classroom.getTestModePrompt();
      if (testPrompt) {
        systemPrompt = testPrompt;
        // Still append language instruction
        if (window.Classroom.getLanguageInstruction) {
          systemPrompt += '\n\n' + window.Classroom.getLanguageInstruction();
        }
        return systemPrompt;
      }
    }

    // 2. SUBJECT OVERRIDE (non-Albanian subjects)
    if (window.getSubjectSystemPrompt) {
      const subjectPrompt = await window.getSubjectSystemPrompt();
      if (subjectPrompt) {
        systemPrompt = subjectPrompt;
        // Append language instruction
        if (window.Classroom && window.Classroom.getLanguageInstruction) {
          systemPrompt += '\n\n--- LANGUAGE RULE ---\n' + window.Classroom.getLanguageInstruction();
        }
        return systemPrompt;
      }
    }

    // 3. ALBANIAN LANGUAGE SUBJECT — use existing .txt prompt files
    if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
      const tp = await window.Security.loadPromptSecure('teacher');
      if (!tp) { console.error('Failed to load teacher prompt'); return null; }
      systemPrompt = tp;
    } else {
      const sp = await window.Security.loadPromptSecure('student');
      if (!sp) { console.error('Failed to load student prompt'); return null; }
      systemPrompt = sp;
    }

    if (state.ui.includeDeveloper) {
      const dp = await window.Security.loadPromptSecure('developer');
      if (dp) systemPrompt += '\n\n' + dp;
    }

    // Mode flags
    let modeInstructions = '\n\n---\n\n';
    if (state.ui.teacherMode) {
      modeInstructions += 'TEACHER_MODE: true\n';
      if (state.academic.activeGrade)      modeInstructions += `GRADE: ${state.academic.activeGrade}\n`;
      if (state.academic.activeChapter)    modeInstructions += `CHAPTER: ${state.academic.activeChapter.title}\n`;
      if (state.academic.focusInstruction) modeInstructions += `\n${state.academic.focusInstruction}\n`;
    } else {
      modeInstructions += `MODE: ${state.ui.activeTool}\nDIFFICULTY: ${state.ui.difficulty}\n`;
    }
    if (state.modes.practice) {
      modeInstructions += '\nPRACTICE_MODE: true — give only questions, no solutions unless requested.\n';
    }
    
    if (state.classroom && state.classroom.enrolledClass) {
      const lockSubj = state.classroom.enrolledClass.subject || (window.Subjects && window.Subjects.getActive().label) || 'këtë lëndë';
      modeInstructions += `\nSTRICT SUBJECT LOCK: You are currently an assistant ONLY for ${lockSubj}. If the student asks anything outside of this topic, you MUST refuse to answer and redirect them to focus on the current subject.\n`;
    }
    
    systemPrompt += modeInstructions;

    // Language instruction (always last) - use I18n if available
    if (window.I18n && window.I18n.getAILanguageInstruction) {
      systemPrompt += '\n\n--- LANGUAGE RULE ---\n' + window.I18n.getAILanguageInstruction();
    } else if (window.Classroom && window.Classroom.getLanguageInstruction) {
      systemPrompt += '\n\n--- LANGUAGE RULE ---\n' + window.Classroom.getLanguageInstruction();
    }

    // Add AI Memory context (identity, subject memory, student data)
    if (window.Memory) {
      const memoryContext = await window.Memory.buildAIContext();
      if (memoryContext) {
        systemPrompt += '\n\n' + memoryContext;
      }
    }

    // Add Curriculum RAG context (grade + subject + curriculum specific knowledge)
    if (window.CurriculumRAG) {
      const activeSubject = window.Subjects?.getActive();
      const currContext = await window.CurriculumRAG.buildContext('', {
        grade: state.academic?.activeGrade,
        subjectId: activeSubject?.id,
        curriculum: window.CurriculumRAG.activeCurriculum
      });
      if (currContext) {
        systemPrompt += '\n\n' + currContext;
      }
    }

    // Add Smart Context: student profile, grades, assignments, workspace,
    // terminal, analytics — all modular based on active subject tab
    if (window.AIContext) {
      const smartCtx = await window.AIContext.build();
      if (smartCtx) {
        systemPrompt += smartCtx;
      }
    }

    // SOCRATIC TUTOR — when enabled, inject master pedagogy instructions
    // that transform the AI from an answer machine into a thinking coach
    if (window.SocraticTutor && window.SocraticTutor.isEnabled()) {
      const socraticInstructions = window.SocraticTutor.getSocraticPrompt();
      if (socraticInstructions) {
        systemPrompt += '\n\n' + socraticInstructions;
      }
    }

    return systemPrompt;
  }

  // ----------------------------------------------------------------
  // SEND MESSAGE → Gemma 4 via Ollama
  // ----------------------------------------------------------------
  async function sendMessage() {
    const userMessage = (inputArea.value || '').trim();
    if (!userMessage) return;

    // Intercept /graph commands for economics tools
    if (userMessage.startsWith('/graph') && window.EconTools) {
      if (window.EconTools.interceptGraphCommand(userMessage)) {
        inputArea.value = '';
        inputArea.style.height = 'auto';
        return;
      }
    }

    state.chat.isProcessing = true;
    sendBtn.disabled   = true;
    inputArea.disabled = true;

    addMessage('user', userMessage);
    inputArea.value      = '';
    inputArea.style.height = 'auto';

    if (!state.modes.privacy) {
      state.chat.history.push({ role: 'user', content: userMessage });
      // Save to memory module
      if (window.Memory) {
        window.Memory.addMessage(null, 'user', userMessage);
      }
    }

    addThinking();

    try {
      const systemPrompt = await buildSystemPrompt();
      if (!systemPrompt) throw new Error('Failed to build system prompt');

      const messages = [{ role: 'system', content: systemPrompt }];
      if (!state.modes.privacy && state.chat.history.length > 0) {
        messages.push(...state.chat.history.slice(-10));
      }

      // Add textbook RAG context if available
      const ragContext = window.TextbookRAG?.buildContext(userMessage);
      if (ragContext) {
        systemPrompt += ragContext;
        messages[0].content = systemPrompt;
      }

      // Build user message (with image if attached)
      let userMsg;
      if (window.Multimodal?.hasImage()) {
        userMsg = window.Multimodal.buildMultimodalMessage(userMessage);
      } else {
        userMsg = { role: 'user', content: userMessage };
      }
      messages.push(userMsg);

      // Get hardware-optimized settings
      const profileSettings = window.HardwareProfile?.getProfileSettings() || {};
      const model = profileSettings.model || state.api.model;
      const contextLength = profileSettings.contextLength || 8192;
      const useStreaming = profileSettings.streaming !== false;

      // Determine backend (Ollama vs WebLLM)
      const preferWebLLM = localStorage.getItem('shqipai_backend') === 'webllm';
      let assistantMessage = '';

      // Try WebLLM first if preferred and available
      if (preferWebLLM && window.WebLLMEngine?.isSupported) {
        console.log('Using WebLLM backend (browser-based inference)');
        try {
          assistantMessage = await generateWithWebLLM(messages, useStreaming);
        } catch (webllmErr) {
          console.warn('WebLLM failed, falling back to Ollama:', webllmErr);
          assistantMessage = await generateWithOllama(messages, model, contextLength, useStreaming);
        }
      } else {
        // Use Ollama backend
        assistantMessage = await generateWithOllama(messages, model, contextLength, useStreaming);
      }

      removeThinking();
      addMessage('assistant', assistantMessage);

      // Track learning analytics
      const activeSubject = window.Subjects?.getActive()?.label || 'General';
      window.LearningAnalytics?.trackQuestion(activeSubject, userMessage, assistantMessage);

      // Clear multimodal image after successful response
      window.Multimodal?.clearImage();

      // Auto-read if enabled
      if (window.TTS && localStorage.getItem('shqipai_readAloud') === 'true') {
        window.TTS.speak(assistantMessage);
      }

      if (!state.modes.privacy) {
        state.chat.history.push({ role: 'assistant', content: assistantMessage });
        // Save to memory module and auto-extract concepts
        if (window.Memory) {
          window.Memory.addMessage(null, 'assistant', assistantMessage);
          window.Memory.autoUpdateConcepts(null, assistantMessage);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      removeThinking();
      addMessage('assistant', `❌ ${error.message}`);
    } finally {
      state.chat.isProcessing = false;
      sendBtn.disabled   = false;
      inputArea.disabled = false;
      inputArea.focus();
    }
  }

  // ----------------------------------------------------------------
  // HANDLE SSE STREAMING RESPONSE
  // ----------------------------------------------------------------
  async function handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let currentRow = null;
    let currentBubble = null;

    // Create streaming message container
    if (chatDiv) {
      currentRow = document.createElement('div');
      currentRow.className = 'row assistant streaming';
      currentBubble = document.createElement('div');
      currentBubble.className = 'bubble';
      currentRow.appendChild(currentBubble);
      chatDiv.appendChild(currentRow);
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;

                // Update UI in real-time
                if (currentBubble) {
                  if (window.markdownit) {
                    currentBubble.innerHTML = window.markdownit().render(fullContent);
                  } else {
                    currentBubble.textContent = fullContent;
                  }
                  chatDiv.scrollTop = chatDiv.scrollHeight;
                }
              }
            } catch (parseErr) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (streamErr) {
      console.error('Streaming error:', streamErr);
    }

    // Finalize - remove streaming class
    if (currentRow) {
      currentRow.classList.remove('streaming');
      applyGrammarHighlighting(currentBubble);
    }

    return fullContent || 'No response received.';
  }

  // ----------------------------------------------------------------
  // GENERATE WITH OLLAMA
  // ----------------------------------------------------------------
  async function generateWithOllama(messages, model, contextLength, useStreaming) {
    const profileSettings = window.HardwareProfile?.getProfileSettings() || {};
    const numThreads = profileSettings.numThreads || Math.min(navigator.hardwareConcurrency || 4, 8);
    const numBatch = profileSettings.numBatch || 256;

    let response;
    try {
      response = await fetch(state.api.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama' },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens:  2000,
          stream:      useStreaming,
          options: {
            num_ctx: contextLength,
            num_thread: numThreads,
            num_batch: numBatch
          }
        })
      });
    } catch {
      throw new Error(
        'Could not connect to Ollama.\n\n' +
        'Steps to fix:\n' +
        '1. Download Ollama from https://ollama.com\n' +
        '2. Open terminal: ollama serve\n' +
        '3. Pull model: ollama pull gemma3:4b\n' +
        '4. Refresh the page and try again.\n\n' +
        'Tip: Enable WebLLM in Settings for browser-based inference!'
      );
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 404) {
        throw new Error(`Model "${model}" not found.\nRun: ollama pull ${model}`);
      }
      throw new Error(`Ollama error (${response.status}): ${errText}`);
    }

    if (useStreaming) {
      return await handleStreamingResponse(response);
    } else {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response received.';
    }
  }

  // ----------------------------------------------------------------
  // GENERATE WITH WEBLLM (Browser-based inference)
  // ----------------------------------------------------------------
  async function generateWithWebLLM(messages, useStreaming) {
    if (!window.WebLLMEngine?.isSupported) {
      throw new Error('WebGPU not supported in this browser');
    }

    // Initialize engine if needed
    if (!window.WebLLMEngine.isLoaded) {
      window.Toast?.info('Loading AI model in browser (first time only)...');
      await window.WebLLMEngine.init();
    }

    if (useStreaming) {
      // Create streaming container
      let currentRow = null;
      let currentBubble = null;
      let fullContent = '';

      if (chatDiv) {
        currentRow = document.createElement('div');
        currentRow.className = 'row assistant streaming';
        currentBubble = document.createElement('div');
        currentBubble.className = 'bubble';
        currentRow.appendChild(currentBubble);
        chatDiv.appendChild(currentRow);
      }

      const response = await window.WebLLMEngine.generate(messages, {
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
        onChunk: (chunk, full) => {
          fullContent = full;
          if (currentBubble) {
            if (window.markdownit) {
              currentBubble.innerHTML = window.markdownit().render(full);
            } else {
              currentBubble.textContent = full;
            }
            chatDiv.scrollTop = chatDiv.scrollHeight;
          }
        }
      });

      if (currentRow) {
        currentRow.classList.remove('streaming');
        applyGrammarHighlighting(currentBubble);
      }

      return response;
    } else {
      return await window.WebLLMEngine.generate(messages, {
        temperature: 0.7,
        max_tokens: 2000
      });
    }
  }

  // ----------------------------------------------------------------
  // CHECK OLLAMA AVAILABILITY
  // ----------------------------------------------------------------
  async function checkOllamaAvailable() {
    try {
      const response = await fetch(state.api.endpoint.replace('/chat', '/tags'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------------------
  // EXPORT CHAT SESSION (PDF / Markdown / Study Notes)
  // ----------------------------------------------------------------
  function exportChatSession() {
    const history = state.chat.history || [];
    if (history.length === 0) {
      if (window.Toast?.info) window.Toast.info('Biseda është bosh. Nuk ka të dhëna për eksportim.');
      else alert('Biseda është bosh.');
      return;
    }

    const activeSubj = window.Subjects ? window.Subjects.getActive() : { label: 'Studim', emoji: '📚' };
    const dateStr = new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let mdContent = `# 📚 EduAI Përmbledhje Studimi — ${activeSubj.label}\nData: ${dateStr}\nModeli: Gemma 4\n\n---\n\n`;
    history.forEach(m => {
      const sender = m.role === 'user' ? '👤 Nxënësi' : '🤖 EduAI Tutor';
      mdContent += `### ${sender}\n${m.content}\n\n`;
    });

    // Create modal for download options
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:9000;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);';
    overlay.innerHTML = `
      <div class="modal" style="max-width:440px;padding:24px;border-radius:16px;background:var(--panel);border:1px solid var(--border);box-shadow:0 20px 40px rgba(0,0,0,0.3)">
        <h3 style="margin:0 0 6px;color:var(--text);font-size:17px">📑 Eksporto Seancën e Studimit</h3>
        <p style="margin:0 0 16px;font-size:12.5px;color:var(--muted)">Zgjidhni formatin e dëshiruar për të ruajtur bisedën dhe shënimet:</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button id="expPdfBtn" class="btn-primary" style="padding:10px 14px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:8px;justify-content:center">
            <span>🖨️</span> Printo ose Ruaj si PDF
          </button>
          <button id="expMdBtn" class="btn-secondary" style="padding:10px 14px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:8px;justify-content:center">
            <span>💾</span> Shkarko Dokument (.md)
          </button>
          <button id="expCopyBtn" class="btn-secondary" style="padding:10px 14px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:8px;justify-content:center">
            <span>📋</span> Kopjo të Gjithë Tekstin
          </button>
        </div>
        <div style="margin-top:16px;text-align:right">
          <button id="expCloseBtn" class="btn-secondary" style="padding:6px 14px;font-size:12px">Mbyll</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#expCloseBtn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // 1. PDF / Print
    overlay.querySelector('#expPdfBtn').addEventListener('click', () => {
      overlay.remove();
      const printWin = window.open('', '_blank');
      if (!printWin) return;
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>EduAI — ${activeSubj.label} (${dateStr})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center; }
            .title { font-size: 22px; font-weight: 800; color: #1e3a8a; }
            .meta { font-size: 12px; color: #6b7280; }
            .msg { margin-bottom: 18px; padding: 14px; border-radius: 8px; }
            .user { background: #eff6ff; border-left: 4px solid #2563eb; }
            .assistant { background: #f8fafc; border-left: 4px solid #10b981; }
            .role { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
            pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${activeSubj.emoji} EduAI Përmbledhje Studimi — ${activeSubj.label}</div>
              <div class="meta">Data: ${dateStr} · Inteligjenca Artificiale: Gemma 4</div>
            </div>
            <div style="font-weight:700;color:#2563eb">EduAI School Platform</div>
          </div>
          ${history.map(m => `
            <div class="msg ${m.role}">
              <div class="role">${m.role === 'user' ? '👤 Nxënësi:' : '🤖 EduAI Tutori:'}</div>
              <div>${m.content.replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')}
        </body>
        </html>
      `);
      printWin.document.close();
      setTimeout(() => { printWin.print(); }, 500);
    });

    // 2. Download .md
    overlay.querySelector('#expMdBtn').addEventListener('click', () => {
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `EduAI-${activeSubj.id}-${Date.now()}.md`;
      a.click();
      overlay.remove();
      if (window.Toast?.success) window.Toast.success('Dokumenti .md u shkarkua me sukses!');
    });

    // 3. Copy Text
    overlay.querySelector('#expCopyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(mdContent).then(() => {
        overlay.remove();
        if (window.Toast?.success) window.Toast.success('Seanca u kopjua në clipboard!');
      });
    });
  }

  // ----------------------------------------------------------------
  // CLEAR CHAT
  // ----------------------------------------------------------------
  function clearChat() {
    if (!chatDiv) return;
    if (confirm('Clear the current chat?')) {
      chatDiv.innerHTML      = '';
      state.chat.history     = [];
    }
  }

  function autoResizeTextarea() {
    if (!inputArea) return;
    inputArea.style.height = 'auto';
    inputArea.style.height = Math.min(inputArea.scrollHeight, 120) + 'px';
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (clearBtn) clearBtn.addEventListener('click', clearChat);
  const exportChatBtn = document.getElementById('exportChatBtn');
  if (exportChatBtn) exportChatBtn.addEventListener('click', exportChatSession);

  if (inputArea) {
    inputArea.addEventListener('input', autoResizeTextarea);
    inputArea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!state.chat.isProcessing) sendMessage();
      }
    });
  }

  console.log(`✅ AI Core → Gemma 4 via Ollama (${state.api.model}) · Subject routing · Test mode enabled`);
})();
