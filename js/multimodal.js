// js/multimodal.js
// ===================================================================
// MULTIMODAL SUPPORT - Image input for visual learning
// Uses Gemma 4's native vision capabilities via Ollama
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  let imageInput = null;
  let imagePreview = null;
  let currentImage = null;

  // Supported image types
  const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  // Initialize multimodal UI
  function init() {
    // Create image input button
    const buttonRow = document.querySelector('.buttonRow');
    if (!buttonRow) return;

    // Image upload button
    const imageBtn = document.createElement('button');
    imageBtn.id = 'imageBtn';
    imageBtn.className = 'image-btn';
    imageBtn.title = 'Upload image for analysis';
    imageBtn.innerHTML = 'image';
    imageBtn.style.cssText = `
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 20px;
      transition: all 0.2s;
    `;
    imageBtn.addEventListener('click', () => imageInput?.click());
    buttonRow.insertBefore(imageBtn, buttonRow.firstChild);

    // Hidden file input
    imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.display = 'none';
    imageInput.addEventListener('change', handleImageSelect);
    document.body.appendChild(imageInput);

    // Image preview container
    imagePreview = document.createElement('div');
    imagePreview.id = 'imagePreview';
    imagePreview.style.cssText = `
      display: none;
      position: relative;
      margin: 10px 0;
      padding: 10px;
      background: var(--panel);
      border-radius: 12px;
      border: 1px solid var(--border);
    `;
    const chatContainer = document.querySelector('.chat-input-container') || document.querySelector('.input-container');
    if (chatContainer) {
      chatContainer.insertBefore(imagePreview, chatContainer.firstChild);
    }

    console.log('Multimodal module loaded');
  }

  // Handle image selection
  function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      window.Toast?.error('Unsupported image format. Use JPEG, PNG, or WebP.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      window.Toast?.error('Image too large. Maximum size is 10MB.');
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImage = e.target.result;
      showPreview(currentImage);
    };
    reader.readAsDataURL(file);
  }

  // Show image preview
  function showPreview(dataUrl) {
    if (!imagePreview) return;

    imagePreview.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${dataUrl}" style="max-width: 200px; max-height: 150px; border-radius: 8px; object-fit: contain;">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--text);">Image attached</div>
          <div style="font-size: 12px; color: var(--muted);">Ask a question about this image</div>
        </div>
        <button onclick="window.Multimodal.clearImage()" style="
          background: var(--danger);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
        ">Remove</button>
      </div>
    `;
    imagePreview.style.display = 'block';
  }

  // Clear current image
  function clearImage() {
    currentImage = null;
    if (imagePreview) {
      imagePreview.style.display = 'none';
      imagePreview.innerHTML = '';
    }
    if (imageInput) {
      imageInput.value = '';
    }
  }

  // Get current image as base64
  function getCurrentImage() {
    return currentImage;
  }

  // Check if image is attached
  function hasImage() {
    return currentImage !== null;
  }

  // Convert image to format for Ollama
  function getImageForOllama() {
    if (!currentImage) return null;
    
    // Ollama expects base64 without the data URL prefix
    const base64 = currentImage.split(',')[1];
    return base64;
  }

  // Build multimodal message for Ollama API
  function buildMultimodalMessage(text) {
    if (!currentImage) {
      return { role: 'user', content: text };
    }

    // Ollama format for images
    return {
      role: 'user',
      content: text,
      images: [getImageForOllama()]
    };
  }

  // Drag and drop support
  function setupDragDrop() {
    const chatContainer = document.querySelector('#chat, .chat-container');
    if (!chatContainer) return;

    chatContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      chatContainer.classList.add('drag-over');
    });

    chatContainer.addEventListener('dragleave', () => {
      chatContainer.classList.remove('drag-over');
    });

    chatContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      chatContainer.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (files?.length > 0) {
        const file = files[0];
        if (SUPPORTED_TYPES.includes(file.type)) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            currentImage = ev.target.result;
            showPreview(currentImage);
          };
          reader.readAsDataURL(file);
        }
      }
    });
  }

  // Export
  window.Multimodal = {
    init,
    clearImage,
    getCurrentImage,
    hasImage,
    getImageForOllama,
    buildMultimodalMessage
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      setupDragDrop();
    });
  } else {
    setTimeout(() => {
      init();
      setupDragDrop();
    }, 500);
  }
})();
