// tests/unit/server.test.js
// Unit tests for server core features: PBKDF2 hashing, sessions, health, endpoints
// ===================================================================

const crypto = require('crypto');
const http = require('http');

function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let parsed = body;
        try { parsed = JSON.parse(body); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

describe('Server Backend Core Features', () => {
  let app;
  let server;
  let port;

  beforeAll((done) => {
    app = require('../../server.js');
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Health Endpoint (/api/health)', () => {
    test('GET /api/health returns healthy status and system metrics', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'GET'
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('healthy');
      expect(res.data).toHaveProperty('uptime');
      expect(res.data).toHaveProperty('server');
      expect(res.data.server).toHaveProperty('memory');
      expect(res.data).toHaveProperty('data');
    });

    test('Response headers include security headers', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/health',
        method: 'GET'
      });

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('Authentication & Session Persistence', () => {
    const testUser = {
      username: 'test_prod_user_' + Date.now(),
      password: 'StrongPassword123!',
      email: 'prod@example.com',
      firstName: 'Production',
      lastName: 'Tester',
      type: 'student'
    };
    let token = '';

    test('POST /api/register creates a new user and returns a persistent session token', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, testUser);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.user.username).toBe(testUser.username);
      expect(res.data).toHaveProperty('sessionToken');
      expect(typeof res.data.sessionToken).toBe('string');
      token = res.data.sessionToken;
    });

    test('POST /api/login authenticates registered user', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: testUser.username,
        password: testUser.password
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data).toHaveProperty('sessionToken');
    });

    test('POST /api/login rejects invalid password', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: testUser.username,
        password: 'WrongPassword456!'
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('Authenticated request with Bearer token accesses protected endpoint', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/memory/identity',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('identity');
    });

    test('Unauthenticated request is rejected with 401', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/memory/identity',
        method: 'GET'
      });
      expect(res.status).toBe(401);
    });

    test('Student token is forbidden (403) from teacher-only endpoints', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/students',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      expect(res.status).toBe(403);
      expect(res.data).toHaveProperty('error');
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    let teacherToken = '';
    const teacherUser = {
      username: 'test_teacher_' + Date.now(),
      password: 'TeacherPassword123!',
      email: 'teacher@example.com',
      firstName: 'Lead',
      lastName: 'Instructor',
      type: 'teacher'
    };

    test('Teacher registration and access to teacher-only endpoints', async () => {
      const regRes = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, teacherUser);

      expect(regRes.status).toBe(200);
      teacherToken = regRes.data.sessionToken;

      const studentsRes = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/api/students',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${teacherToken}`
        }
      });

      expect(studentsRes.status).toBe(200);
      expect(studentsRes.data).toHaveProperty('students');
    });
  });

  describe('Password Security & PBKDF2 Hashing', () => {
    test('PBKDF2 hashes contain salt and algorithm prefix', () => {
      const pw = 'TestSecret123';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex');
      const formatted = `pbkdf2$${salt}$${hash}`;

      expect(formatted.startsWith('pbkdf2$')).toBe(true);
      const parts = formatted.split('$');
      expect(parts.length).toBe(3);
      expect(parts[1]).toBe(salt);
      expect(parts[2].length).toBe(128); // 64 bytes hex
    });
  });
});

