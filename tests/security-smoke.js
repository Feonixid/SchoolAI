const fs = require('fs');
const path = require('path');

function assertIncludes(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(`Assertion failed: ${message}\nMissing: ${needle}`);
  }
}

function run() {
  const serverPath = path.join(__dirname, '..', 'server.js');
  const server = fs.readFileSync(serverPath, 'utf8');

  assertIncludes(server, "function requireAuth", "requireAuth middleware should exist");
  assertIncludes(server, "function requireRole", "requireRole middleware should exist");
  assertIncludes(server, "app.get('/api/users', requireAuth, requireRole('admin')", "admin route should require session + role");
  assertIncludes(server, "app.post('/api/update-key', requireAuth", "update-key should require authentication");
  assertIncludes(server, "app.post('/api/run-cyber', requireAuth", "run-cyber should require authentication");
  assertIncludes(server, "const CYBER_ALLOWED = new Set", "cyber endpoint should use allowlist");
  assertIncludes(server, "const CYBER_META =", "cyber endpoint should block command chaining");

  console.log('Security smoke checks passed.');
}

run();
