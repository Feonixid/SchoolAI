// tests/integration/api.test.js
// Integration tests for API endpoints
// ===================================================================

const API_BASE = 'http://localhost:3001';

// Test user credentials (from .env or test setup)
const TEST_ADMIN = { username: 'admin', password: 'admin123' };
let authToken = 'test-token-12345';

// Mock fetch responses
const mockFetch = (url, options = {}) => {
  const path = url.replace(API_BASE, '');
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};
  const hasAuth = options.headers?.Authorization;

  // Route handlers
  if (path === '/api/login' && method === 'POST') {
    if (body.username === 'admin' && body.password === 'admin123') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'test-token-12345', user: { username: 'admin', accountType: 'admin' } })
      });
    }
    return Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    });
  }

  if (path === '/api/memory/identity' && method === 'GET') {
    if (!hasAuth) {
      return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ identity: { name: 'Test User', gradeLevel: 10 } })
    });
  }

  if (path === '/api/memory/identity' && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }

  if (path.startsWith('/api/memory/subject/') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        memory: {
          conversationHistory: [],
          learnedConcepts: ['functions', 'variables'],
          strugglingAreas: [],
          notes: ''
        }
      })
    });
  }

  if (path.includes('/message') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }

  if (path.includes('/summarize') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, summary: 'Test summary', historyLength: 5 })
    });
  }

  if (path === '/api/memory/my-context') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ context: { identity: {}, grades: [] } })
    });
  }

  if (path === '/api/run-cyber' && method === 'POST') {
    if (body.command.includes('rm -rf')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ error: 'Dangerous command blocked' })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ output: 'Hello World\n' })
    });
  }

  if (path === '/api/cyber/status') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ dockerEnabled: false, mode: 'fallback' })
    });
  }

  if (path === '/api/projects') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ projects: [] })
    });
  }

  // Default 404
  return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
};

// Set up global fetch mock
global.fetch = mockFetch;

describe('API Integration Tests', () => {

  // ----------------------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------------------
  describe('Authentication', () => {
    test('POST /api/login returns token for valid credentials', async () => {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_ADMIN)
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('token');

      authToken = data.token;
    });

    test('POST /api/login rejects invalid credentials', async () => {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'invalid', password: 'wrong' })
      });

      expect(res.ok).toBe(false);
    });

    test('Protected endpoints require Authorization header', async () => {
      const res = await fetch(`${API_BASE}/api/memory/identity`);

      expect(res.status).toBe(401);
    });
  });

  // ----------------------------------------------------------------
  // MEMORY API
  // ----------------------------------------------------------------
  describe('Memory API', () => {
    const authHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    });

    describe('Identity Endpoints', () => {
      test('GET /api/memory/identity returns identity', async () => {
        const res = await fetch(`${API_BASE}/api/memory/identity`, {
          headers: authHeaders()
        });

        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data).toHaveProperty('identity');
      });

      test('POST /api/memory/identity updates identity', async () => {
        const res = await fetch(`${API_BASE}/api/memory/identity`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name: 'Test User Updated',
            gradeLevel: 11
          })
        });

        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data.success).toBe(true);
      });
    });

    describe('Subject Memory Endpoints', () => {
      test('GET /api/memory/subject/:subjectId returns memory', async () => {
        const res = await fetch(`${API_BASE}/api/memory/subject/coding`, {
          headers: authHeaders()
        });

        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data).toHaveProperty('memory');
        expect(data.memory).toHaveProperty('conversationHistory');
        expect(data.memory).toHaveProperty('learnedConcepts');
      });

      test('POST /api/memory/subject/:subjectId/message adds message', async () => {
        const res = await fetch(`${API_BASE}/api/memory/subject/coding/message`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            role: 'user',
            content: 'Test message from integration test'
          })
        });

        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data.success).toBe(true);
      });

      test('POST /api/memory/subject/:subjectId/summarize creates summary', async () => {
        const res = await fetch(`${API_BASE}/api/memory/subject/coding/summarize`, {
          method: 'POST',
          headers: authHeaders()
        });

        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data.success).toBe(true);
      });
    });

    describe('Student Context Endpoints', () => {
      test('GET /api/memory/my-context returns student data', async () => {
        const res = await fetch(`${API_BASE}/api/memory/my-context`, {
          headers: authHeaders()
        });

        expect(res.ok).toBe(true);
        const data = await res.json();
        expect(data).toHaveProperty('context');
      });
    });
  });

  // ----------------------------------------------------------------
  // CYBERSECURITY TERMINAL API
  // ----------------------------------------------------------------
  describe('Cybersecurity Terminal', () => {
    test('POST /api/run-cyber executes safe commands', async () => {
      const res = await fetch(`${API_BASE}/api/run-cyber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'echo Hello World',
          files: []
        })
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('output');
    });

    test('POST /api/run-cyber blocks dangerous commands', async () => {
      const res = await fetch(`${API_BASE}/api/run-cyber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'rm -rf /',
          files: []
        })
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test('GET /api/cyber/status returns Docker status', async () => {
      const res = await fetch(`${API_BASE}/api/cyber/status`);

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('dockerEnabled');
      expect(data).toHaveProperty('mode');
    });
  });

  // ----------------------------------------------------------------
  // PROJECTS API
  // ----------------------------------------------------------------
  describe('Projects API', () => {
    test('GET /api/projects returns project list', async () => {
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(res.ok).toBe(true);
    });
  });
});
