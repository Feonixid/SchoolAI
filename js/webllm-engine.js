// js/webllm-engine.js
// ===================================================================
// WEBLLM ENGINE - Browser-based inference using WebGPU
// Runs Gemma entirely in browser - no server, no Ollama needed
// ===================================================================

(function () {
  'use strict';

  let engine = null;
  let isLoading = false;
  let loadProgress = 0;
  let isSupported = false;

  // Available models (MLC registry)
  const AVAILABLE_MODELS = {
    'gemma-3-1b-it-q4f32_1-MLC': {
      name: 'Gemma 3 1B (Fast)',
      size: '700MB',
      minRAM: 4,
      tier: 'minimal'
    },
    'gemma-3-4b-it-q4f32_1-MLC': {
      name: 'Gemma 3 4B (Balanced)',
      size: '2.3GB',
      minRAM: 8,
      tier: 'medium'
    },
    'gemma-3-12b-it-q4f32_1-MLC': {
      name: 'Gemma 3 12B (Best)',
      size: '7GB',
      minRAM: 16,
      tier: 'high'
    },
    // Gemma 4 models when available
    'gemma-4-1b-it-q4f32_1-MLC': {
      name: 'Gemma 4 1B',
      size: '~800MB',
      minRAM: 4,
      tier: 'minimal'
    }
  };

  // Check WebGPU support
  async function checkSupport() {
    if (!navigator.gpu) {
      console.warn('WebGPU not supported, WebLLM unavailable');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn('No WebGPU adapter found');
        return false;
      }
      const device = await adapter.requestDevice();
      isSupported = true;
      console.log('WebGPU supported, WebLLM available');
      return true;
    } catch (e) {
      console.warn('WebGPU check failed:', e);
      return false;
    }
  }

  // Initialize WebLLM engine
  async function init(modelId = null) {
    if (engine) return engine;
    if (isLoading) return null;

    const supported = await checkSupport();
    if (!supported) {
      throw new Error('WebGPU not supported in this browser');
    }

    // Select model based on hardware
    if (!modelId) {
      const hw = window.HardwareProfile?.getHardwareInfo();
      const tier = hw?.profile || 'medium';
      
      if (tier === 'ultra' || tier === 'high') {
        modelId = 'gemma-3-12b-it-q4f32_1-MLC';
      } else if (tier === 'medium' || tier === 'low') {
        modelId = 'gemma-3-4b-it-q4f32_1-MLC';
      } else {
        modelId = 'gemma-3-1b-it-q4f32_1-MLC';
      }
    }

    isLoading = true;
    console.log(`Loading WebLLM model: ${modelId}`);

    try {
      // Dynamically import WebLLM
      if (!window.webllm) {
        await loadWebLLM();
      }

      engine = await window.webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          loadProgress = progress.progress * 100;
          console.log(`WebLLM loading: ${loadProgress.toFixed(1)}%`);
          window.dispatchEvent(new CustomEvent('webllm-progress', {
            detail: { progress: loadProgress, text: progress.text }
          }));
        }
      });

      isLoading = false;
      console.log('WebLLM engine ready');
      return engine;

    } catch (e) {
      isLoading = false;
      console.error('WebLLM init failed:', e);
      throw e;
    }
  }

  // Load WebLLM library from CDN
  async function loadWebLLM() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
        window.webllm = webllm;
        window.dispatchEvent(new Event('webllm-loaded'));
      `;
      document.head.appendChild(script);

      window.addEventListener('webllm-loaded', () => {
        resolve();
      }, { once: true });

      setTimeout(() => reject(new Error('WebLLM load timeout')), 30000);
    });
  }

  // Generate response
  async function generate(messages, options = {}) {
    if (!engine) {
      await init();
    }

    const response = await engine.chat.completions.create({
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: options.stream || false
    });

    if (options.stream) {
      // Handle streaming
      let fullContent = '';
      for await (const chunk of response) {
        const content = chunk.choices?.[0]?.delta?.content || '';
        fullContent += content;
        if (options.onChunk) {
          options.onChunk(content, fullContent);
        }
      }
      return fullContent;
    }

    return response.choices[0]?.message?.content || '';
  }

  // Reset chat context
  async function reset() {
    if (engine) {
      await engine.resetChat();
    }
  }

  // Unload engine
  async function unload() {
    if (engine) {
      await engine.unload();
      engine = null;
    }
  }

  // Get available models
  function getModels() {
    return AVAILABLE_MODELS;
  }

  // Get status
  function getStatus() {
    return {
      supported: isSupported,
      loaded: engine !== null,
      loading: isLoading,
      progress: loadProgress
    };
  }

  // Export
  window.WebLLMEngine = {
    init,
    generate,
    reset,
    unload,
    checkSupport,
    getModels,
    getStatus,
    get isSupported() { return isSupported; },
    get isLoaded() { return engine !== null; },
    get progress() { return loadProgress; }
  };

  console.log('WebLLM Engine module loaded');
})();
