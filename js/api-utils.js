// js/api-utils.js
// API utilities with retry logic, offline handling, and error management
// ===================================================================

(function () {
  'use strict';

  // Dynamic API Base URL supporting LAN, Cloud, and Localhost
  function getApiBase() {
    const customTarget = localStorage.getItem('eduai_server_target');
    if (customTarget && customTarget.trim()) {
      return customTarget.trim().replace(/\/$/, '');
    }
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
      ? (window.location.protocol + '//' + window.location.hostname + ':3001')
      : window.location.origin;
  }

  function setServerTarget(url) {
    if (!url || url === 'auto' || url === 'default') {
      localStorage.removeItem('eduai_server_target');
    } else {
      localStorage.setItem('eduai_server_target', url.trim());
    }
    console.log('🌐 Server Target changed to:', getApiBase());
    window.dispatchEvent(new CustomEvent('serverTargetChanged', { detail: getApiBase() }));
  }

  // Offline operation queue
  const offlineQueue = [];
  let isOnline = navigator.onLine;

  // ----------------------------------------------------------------
  // AUTH HEADERS
  // ----------------------------------------------------------------
  function getAuthHeaders() {
    const token = sessionStorage.getItem('shqipai_session_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // ----------------------------------------------------------------
  // FETCH WITH RETRY
  // ----------------------------------------------------------------
  async function fetchWithRetry(url, options = {}, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          ...options,
          headers: {
            ...getAuthHeaders(),
            ...options.headers
          }
        });

        // Success
        if (res.ok) return res;

        // Client error (4xx) - don't retry
        if (res.status >= 400 && res.status < 500) {
          const error = await res.json().catch(() => ({ error: res.statusText }));
          throw new ApiError(error.error || `HTTP ${res.status}`, res.status, error);
        }

        // Server error (5xx) - retry
        lastError = new ApiError(`Server error: ${res.status}`, res.status);
        
        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          await delay(baseDelay * Math.pow(2, attempt));
        }

      } catch (err) {
        // Network error - retry
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          lastError = new ApiError('Network error', 0);
          if (attempt < maxRetries - 1) {
            await delay(baseDelay * Math.pow(2, attempt));
          }
        } else {
          throw err; // Re-throw non-network errors
        }
      }
    }

    throw lastError || new ApiError('Max retries exceeded', 0);
  }

  // ----------------------------------------------------------------
  // API ERROR CLASS
  // ----------------------------------------------------------------
  class ApiError extends Error {
    constructor(message, status, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  // ----------------------------------------------------------------
  // HELPER FUNCTIONS
  // ----------------------------------------------------------------
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ----------------------------------------------------------------
  // OFFLINE HANDLING
  // ----------------------------------------------------------------
  function queueOperation(operation) {
    if (!isOnline) {
      offlineQueue.push(operation);
      window.Toast?.warning('You are offline. Changes will sync when reconnected.');
      return false;
    }
    return true;
  }

  async function processOfflineQueue() {
    if (!isOnline || offlineQueue.length === 0) return;

    console.log(`Processing ${offlineQueue.length} queued operations...`);
    
    while (offlineQueue.length > 0) {
      const op = offlineQueue.shift();
      try {
        await op();
      } catch (err) {
        console.error('Failed to process queued operation:', err);
      }
    }

    window.Toast?.success('Offline changes synced!');
  }

  // Online/offline event listeners
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('Back online');
    processOfflineQueue();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    window.Toast?.warning('You are offline. Some features may be limited.');
  });

  // ----------------------------------------------------------------
  // CONVENIENCE METHODS
  // ----------------------------------------------------------------
  async function get(endpoint, options = {}) {
    const base = getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    return fetchWithRetry(url, { ...options, method: 'GET' });
  }

  async function post(endpoint, body, options = {}) {
    const base = getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    return fetchWithRetry(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async function put(endpoint, body, options = {}) {
    const base = getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    return fetchWithRetry(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async function del(endpoint, options = {}) {
    const base = getApiBase();
    const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    return fetchWithRetry(url, { ...options, method: 'DELETE' });
  }

  // Parse JSON response safely
  async function getJson(endpoint, options = {}) {
    const res = await get(endpoint, options);
    return res.json();
  }

  async function postJson(endpoint, body, options = {}) {
    const res = await post(endpoint, body, options);
    return res.json();
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.Api = {
    // Core
    fetch: fetchWithRetry,
    get,
    post,
    put,
    delete: del,
    getJson,
    postJson,

    // Utilities
    getAuthHeaders,
    queueOperation,
    processOfflineQueue,
    ApiError,

    // Dynamic Network Topology
    getBaseUrl: getApiBase,
    getApiBase,
    setServerTarget,
    isOnline: () => isOnline,
    queueLength: () => offlineQueue.length
  };

  console.log('API utilities initialized');
})();
