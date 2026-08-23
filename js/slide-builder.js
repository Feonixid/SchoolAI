// js/slide-builder.js
// ===================================================================
// SIMPLE SLIDE BUILDER
// Create presentations with text, images, and basic formatting
// Works offline — no PowerPoint needed
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  const THEMES = {
    default:  { bg: '#ffffff', text: '#1a1a2e', accent: '#2563eb', name: 'Clean' },
    dark:     { bg: '#1e293b', text: '#e2e8f0', accent: '#60a5fa', name: 'Dark' },
    gradient: { bg: 'linear-gradient(135deg,#667eea,#764ba2)', text: '#ffffff', accent: '#fbbf24', name: 'Gradient' },
    minimal:  { bg: '#fafafa', text: '#333333', accent: '#10b981', name: 'Minimal' },
    ocean:    { bg: 'linear-gradient(180deg,#0f172a,#1e3a5f)', text: '#e0f2fe', accent: '#38bdf8', name: 'Ocean' },
    sunset:   { bg: 'linear-gradient(135deg,#f97316,#ec4899)', text: '#ffffff', accent: '#fbbf24', name: 'Sunset' }
  };

  let slides = [];
  let activeSlideIndex = 0;
  let activeTheme = 'default';
  let overlayRef = null;

  // ----------------------------------------------------------------
  // CREATE PRESENTATION
  // ----------------------------------------------------------------
  function openBuilder(assignmentContext = null) {
    if (overlayRef) return; // already open

    slides = [createSlide('Title Slide', 'Your Name', 'title')];
    activeSlideIndex = 0;
    activeTheme = 'default';

    const overlay = document.createElement('div');
    overlay.id = 'slideBuilderOverlay';
    overlay.className = 'workspace-overlay';
    overlayRef = overlay;

    render();
    document.body.appendChild(overlay);
  }

  function createSlide(title = '', body = '', layout = 'content') {
    return {
      id: Date.now() + Math.random(),
      title: title,
      body: body,
      layout: layout,  // 'title', 'content', 'two-column', 'image', 'blank'
      imageUrl: null,
      notes: ''
    };
  }

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------
  function render() {
    if (!overlayRef) return;
    const theme = THEMES[activeTheme] || THEMES.default;
    const currentSlide = slides[activeSlideIndex] || slides[0];

    overlayRef.innerHTML = `
      <!-- Header -->
      <div class="workspace-header">
        <div class="workspace-title-section">
          <span class="workspace-tool-icon" style="background:#b7472a">📊</span>
          <div>
            <div class="workspace-title">Slide Builder</div>
            <div class="workspace-subtitle">Slide ${activeSlideIndex + 1} of ${slides.length}</div>
          </div>
        </div>
        <div class="workspace-actions">
          <select id="slideTheme" style="padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-family:inherit;font-size:12px">
            ${Object.entries(THEMES).map(([id, t]) =>
              `<option value="${id}" ${id === activeTheme ? 'selected' : ''}>${t.name}</option>`
            ).join('')}
          </select>
          <button class="workspace-btn workspace-btn-secondary" id="addSlideBtn">+ Add Slide</button>
          <button class="workspace-btn workspace-btn-primary" id="exportSlides">📥 Export HTML</button>
          <button class="workspace-btn workspace-btn-close" id="closeSlideBuilder">✕</button>
        </div>
      </div>

      <!-- Main Area -->
      <div style="display:flex;flex:1;min-height:0">
        <!-- Slide Thumbnails -->
        <div id="slideThumbnails" style="width:160px;background:var(--panel);border-right:1px solid var(--border);overflow-y:auto;padding:8px;flex-shrink:0">
          ${slides.map((slide, idx) => `
            <div class="slide-thumb ${idx === activeSlideIndex ? 'active' : ''}" data-idx="${idx}"
              style="padding:8px;margin-bottom:6px;border-radius:8px;cursor:pointer;border:2px solid ${idx === activeSlideIndex ? 'var(--accent)' : 'transparent'};
              background:${idx === activeSlideIndex ? 'rgba(37,99,235,0.08)' : 'var(--card)'};transition:all 0.15s;position:relative">
              <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:2px">Slide ${idx + 1}</div>
              <div style="font-size:11px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${slide.title || '(untitled)'}</div>
              ${slides.length > 1 ? `<button class="delete-slide-btn" data-idx="${idx}" style="position:absolute;top:4px;right:4px;background:rgba(239,68,68,0.1);border:none;color:#ef4444;width:18px;height:18px;border-radius:50%;cursor:pointer;font-size:10px;display:none">×</button>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Slide Editor -->
        <div style="flex:1;display:flex;flex-direction:column;min-height:0">
          <!-- Toolbar -->
          <div style="padding:8px 16px;display:flex;gap:8px;border-bottom:1px solid var(--border);background:var(--card);flex-shrink:0">
            <select id="slideLayout" style="padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:12px;font-family:inherit">
              <option value="title" ${currentSlide.layout === 'title' ? 'selected' : ''}>Title Slide</option>
              <option value="content" ${currentSlide.layout === 'content' ? 'selected' : ''}>Content</option>
              <option value="two-column" ${currentSlide.layout === 'two-column' ? 'selected' : ''}>Two Column</option>
              <option value="image" ${currentSlide.layout === 'image' ? 'selected' : ''}>Image + Text</option>
              <option value="blank" ${currentSlide.layout === 'blank' ? 'selected' : ''}>Blank</option>
            </select>
            <button id="moveSlideUp" class="toolbar-btn" title="Move up" ${activeSlideIndex === 0 ? 'disabled' : ''}>↑</button>
            <button id="moveSlideDown" class="toolbar-btn" title="Move down" ${activeSlideIndex === slides.length - 1 ? 'disabled' : ''}>↓</button>
          </div>

          <!-- Slide Preview -->
          <div style="flex:1;display:flex;justify-content:center;align-items:center;padding:20px;background:#e5e7eb;overflow:auto">
            <div id="slideCanvas" style="width:720px;height:405px;border-radius:4px;box-shadow:0 4px 20px rgba(0,0,0,0.15);overflow:hidden;
              background:${theme.bg};color:${theme.text};display:flex;flex-direction:column;position:relative">

              ${renderSlideContent(currentSlide, theme)}
            </div>
          </div>

          <!-- Editor Fields -->
          <div style="padding:12px 16px;background:var(--card);border-top:1px solid var(--border);flex-shrink:0">
            <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
              <div>
                <label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Title</label>
                <input type="text" id="slideTitleInput" value="${(currentSlide.title || '').replace(/"/g, '&quot;')}"
                  style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:13px;font-family:inherit"
                  placeholder="Slide title...">
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Content</label>
                <textarea id="slideBodyInput" rows="2"
                  style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:13px;font-family:inherit;resize:none"
                  placeholder="Slide content... (use • for bullet points)">${currentSlide.body || ''}</textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    wireEvents();
  }

  function renderSlideContent(slide, theme) {
    const accentStyle = `color:${theme.accent}`;
    switch (slide.layout) {
      case 'title':
        return `
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px">
            <h1 style="font-size:32px;font-weight:800;margin:0;line-height:1.2">${slide.title || 'Title'}</h1>
            <p style="font-size:16px;margin-top:12px;opacity:0.7">${slide.body || 'Subtitle'}</p>
            <div style="width:60px;height:3px;background:${theme.accent};border-radius:2px;margin-top:20px"></div>
          </div>`;

      case 'content':
        return `
          <div style="padding:36px 40px">
            <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;${accentStyle}">${slide.title || 'Content'}</h2>
            <div style="font-size:16px;line-height:1.8">${formatBody(slide.body)}</div>
          </div>`;

      case 'two-column':
        const parts = (slide.body || '').split('---');
        return `
          <div style="padding:36px 40px">
            <h2 style="font-size:22px;font-weight:700;margin:0 0 16px;${accentStyle}">${slide.title || ''}</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;font-size:14px;line-height:1.7">
              <div>${formatBody(parts[0] || '')}</div>
              <div>${formatBody(parts[1] || '')}</div>
            </div>
          </div>`;

      case 'image':
        return `
          <div style="display:grid;grid-template-columns:1fr 1fr;height:100%">
            <div style="padding:36px;display:flex;flex-direction:column;justify-content:center">
              <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;${accentStyle}">${slide.title || ''}</h2>
              <div style="font-size:14px;line-height:1.7">${formatBody(slide.body)}</div>
            </div>
            <div style="background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:48px">
              ${slide.imageUrl ? `<img src="${slide.imageUrl}" style="max-width:100%;max-height:100%;object-fit:cover">` : '🖼️'}
            </div>
          </div>`;

      case 'blank':
        return `<div style="padding:36px;font-size:14px;line-height:1.7">${formatBody(slide.body)}</div>`;

      default:
        return `<div style="padding:36px"><h2>${slide.title}</h2><p>${slide.body}</p></div>`;
    }
  }

  function formatBody(text) {
    if (!text) return '';
    return text
      .split('\n')
      .map(line => {
        line = line.trim();
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          return `<div style="padding-left:16px;margin-bottom:4px">• ${line.substring(1).trim()}</div>`;
        }
        return `<div style="margin-bottom:4px">${line}</div>`;
      })
      .join('');
  }

  // ----------------------------------------------------------------
  // WIRE EVENTS
  // ----------------------------------------------------------------
  function wireEvents() {
    if (!overlayRef) return;

    // Theme
    overlayRef.querySelector('#slideTheme')?.addEventListener('change', e => {
      activeTheme = e.target.value;
      render();
    });

    // Layout
    overlayRef.querySelector('#slideLayout')?.addEventListener('change', e => {
      slides[activeSlideIndex].layout = e.target.value;
      render();
    });

    // Title + Body live update
    overlayRef.querySelector('#slideTitleInput')?.addEventListener('input', e => {
      slides[activeSlideIndex].title = e.target.value;
      updatePreview();
    });

    overlayRef.querySelector('#slideBodyInput')?.addEventListener('input', e => {
      slides[activeSlideIndex].body = e.target.value;
      updatePreview();
    });

    // Add slide
    overlayRef.querySelector('#addSlideBtn')?.addEventListener('click', () => {
      slides.splice(activeSlideIndex + 1, 0, createSlide('New Slide', '', 'content'));
      activeSlideIndex++;
      render();
    });

    // Thumbnails
    overlayRef.querySelectorAll('.slide-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        activeSlideIndex = parseInt(thumb.dataset.idx);
        render();
      });
      // Show delete button on hover
      thumb.addEventListener('mouseenter', () => {
        const delBtn = thumb.querySelector('.delete-slide-btn');
        if (delBtn) delBtn.style.display = 'block';
      });
      thumb.addEventListener('mouseleave', () => {
        const delBtn = thumb.querySelector('.delete-slide-btn');
        if (delBtn) delBtn.style.display = 'none';
      });
    });

    // Delete slide
    overlayRef.querySelectorAll('.delete-slide-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        if (slides.length <= 1) return;
        slides.splice(idx, 1);
        if (activeSlideIndex >= slides.length) activeSlideIndex = slides.length - 1;
        render();
      });
    });

    // Move up/down
    overlayRef.querySelector('#moveSlideUp')?.addEventListener('click', () => {
      if (activeSlideIndex > 0) {
        [slides[activeSlideIndex], slides[activeSlideIndex - 1]] = [slides[activeSlideIndex - 1], slides[activeSlideIndex]];
        activeSlideIndex--;
        render();
      }
    });

    overlayRef.querySelector('#moveSlideDown')?.addEventListener('click', () => {
      if (activeSlideIndex < slides.length - 1) {
        [slides[activeSlideIndex], slides[activeSlideIndex + 1]] = [slides[activeSlideIndex + 1], slides[activeSlideIndex]];
        activeSlideIndex++;
        render();
      }
    });

    // Export
    overlayRef.querySelector('#exportSlides')?.addEventListener('click', exportAsHTML);

    // Close
    overlayRef.querySelector('#closeSlideBuilder')?.addEventListener('click', () => {
      if (overlayRef) overlayRef.remove();
      overlayRef = null;
    });
  }

  function updatePreview() {
    const canvas = overlayRef?.querySelector('#slideCanvas');
    if (!canvas) return;
    const theme = THEMES[activeTheme] || THEMES.default;
    const slide = slides[activeSlideIndex];
    canvas.style.background = theme.bg;
    canvas.style.color = theme.text;
    canvas.innerHTML = renderSlideContent(slide, theme);
  }

  // ----------------------------------------------------------------
  // EXPORT AS HTML
  // ----------------------------------------------------------------
  function exportAsHTML() {
    const theme = THEMES[activeTheme] || THEMES.default;

    let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Presentation</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', 'Segoe UI', sans-serif; }
  .slide { width:100vw; height:100vh; display:flex; flex-direction:column; page-break-after:always;
    background:${theme.bg}; color:${theme.text}; overflow:hidden; }
  .slide h1 { font-size:48px; font-weight:800; }
  .slide h2 { font-size:36px; font-weight:700; color:${theme.accent}; }
  .slide p, .slide div { font-size:20px; line-height:1.7; }
  @media print { .slide { page-break-after: always; } }
</style></head><body>\n`;

    slides.forEach(slide => {
      html += `<div class="slide">${renderSlideContent(slide, theme)}</div>\n`;
    });

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(url);

    window.Toast?.success('Presentation exported!');
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.SlideBuilder = {
    openBuilder,
    getSlides: () => slides,
    isOpen: () => !!overlayRef
  };

  console.log('✅ Slide Builder module loaded');
})();
