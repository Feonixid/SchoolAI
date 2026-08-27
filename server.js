// server.js - ShqipAI Backend Server
// ===================================================================
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const crypto   = require('crypto');
const fs       = require('fs');
const path     = require('path');
const os       = require('os');
const { spawn } = require('child_process');

const app  = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'accounts-data.json');

// Docker container pool for cybersecurity lab
let DockerPool = null;
let dockerEnabled = false;

async function initDocker() {
  try {
    DockerPool = require('./docker/docker-pool');
    dockerEnabled = await DockerPool.initialize();
    if (dockerEnabled) {
      console.log('🐳 Docker cybersecurity lab enabled');
    } else {
      console.log('⚠️ Docker not available - using fallback sandbox mode');
    }
  } catch (err) {
    console.warn('Docker module not loaded:', err.message);
    dockerEnabled = false;
  }
}

initDocker();

// Log Ollama KV cache configuration
const KV_CACHE_TYPE = process.env.OLLAMA_KV_CACHE_TYPE || 'f16';
const FLASH_ATTENTION = process.env.OLLAMA_FLASH_ATTENTION || '0';
const CONTEXT_LENGTH = process.env.OLLAMA_CONTEXT_LENGTH || '4096';
console.log(`\nOllama Configuration:`);
console.log(`   KV Cache Type: ${KV_CACHE_TYPE}${KV_CACHE_TYPE === 'f16' ? ' (default)' : KV_CACHE_TYPE === 'q8_0' ? ' (50% memory savings)' : KV_CACHE_TYPE === 'q4_0' ? ' (75% memory savings)' : ''}`);
console.log(`   Flash Attention: ${FLASH_ATTENTION === '1' ? 'Enabled' : 'Disabled'}`);
console.log(`   Context Length: ${CONTEXT_LENGTH}`);
if (KV_CACHE_TYPE === 'f16') {
  console.log(`   Tip: Set OLLAMA_KV_CACHE_TYPE=q8_0 for 50% memory savings with minimal quality loss`);
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.static(__dirname));

// ===================================================================
// RATE LIMITING
// ===================================================================
const rateLimitBuckets = new Map();

function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 60;
  const message = options.message || { error: 'Too many requests, please try again later.' };

  return (req, res, next) => {
    const ip = getClientIP(req);
    const now = Date.now();
    const bucket = rateLimitBuckets.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > bucket.resetTime) {
      bucket.count = 1;
      bucket.resetTime = now + windowMs;
    } else {
      bucket.count++;
    }

    rateLimitBuckets.set(ip, bucket);

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetTime - now) / 1000));
      return res.status(429).json(message);
    }
    next();
  };
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many auth attempts. Please wait 15 minutes.' } });
const codeExecLimiter = rateLimit({ windowMs: 60 * 1000, max: 40, message: { error: 'Too many execution requests. Please slow down.' } });

// Periodic cleanup of rate limit buckets
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitBuckets.entries()) {
    if (now > bucket.resetTime) rateLimitBuckets.delete(ip);
  }
}, 5 * 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

// ===================================================================
// DATA MANAGEMENT & ATOMIC PERSISTENCE
// ===================================================================
const DATA_BACKUP_FILE = path.join(__dirname, 'accounts-data.json.bak');
let lastBackupTime = 0;

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      if (raw.trim().length > 0) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.error('⚠️ Primary data file corrupt or unreadable:', e.message);
    if (fs.existsSync(DATA_BACKUP_FILE)) {
      try {
        console.log('🔄 Restoring database from accounts-data.json.bak...');
        const backupRaw = fs.readFileSync(DATA_BACKUP_FILE, 'utf8');
        const restored = JSON.parse(backupRaw);
        saveData(restored);
        return restored;
      } catch (bkErr) {
        console.error('❌ Backup restore failed:', bkErr.message);
      }
    }
  }
  return { users: {}, adminConfigured: false, sessions: {}, teacherData: {}, userMemory: {} };
}

function saveData(data) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const tmpFile = `${DATA_FILE}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpFile, jsonStr, 'utf8');
    fs.renameSync(tmpFile, DATA_FILE);

    const now = Date.now();
    if (now - lastBackupTime > 3600000 || lastBackupTime === 0) {
      try {
        fs.writeFileSync(DATA_BACKUP_FILE, jsonStr, 'utf8');
        lastBackupTime = now;
      } catch {}
    }
  } catch (e) {
    console.error('❌ Error saving data atomically:', e);
  }
}

// Salted PBKDF2 Password Hashing with legacy SHA-256 fallback
function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

function legacyHashSHA256(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function verifyPassword(pw, storedHash) {
  if (!storedHash || !pw) return false;
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const expectedHash = parts[2];
    const computedHash = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(computedHash, 'hex'));
  }
  // Legacy SHA-256 compatibility check
  return storedHash === legacyHashSHA256(pw);
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || 'unknown';
}

// ===================================================================
// ADMIN CREDENTIALS
// ===================================================================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_API_KEY  = process.env.ADMIN_API_KEY || '';

// ===================================================================
// PERSISTENT SESSION AUTH
// ===================================================================
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const data = loadData();
  if (!data.sessions) data.sessions = {};
  
  data.sessions[token] = {
    username: user.username,
    accountType: user.accountType,
    createdAt: Date.now(),
    lastSeen: Date.now()
  };

  // Clean expired sessions
  const now = Date.now();
  for (const [t, s] of Object.entries(data.sessions)) {
    if (now - (s.lastSeen || s.createdAt) > SESSION_TTL_MS) {
      delete data.sessions[t];
    }
  }

  saveData(data);
  return token;
}

function resolveSession(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const data = loadData();
  const session = data.sessions?.[token];
  if (!session) return null;

  if (Date.now() - (session.lastSeen || session.createdAt) > SESSION_TTL_MS) {
    delete data.sessions[token];
    saveData(data);
    return null;
  }

  session.lastSeen = Date.now();
  saveData(data);
  return { token, ...session };
}

function requireAuth(req, res, next) {
  const authUser = resolveSession(req);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });
  req.authUser = authUser;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.authUser.accountType)) return res.status(403).json({ error: 'Unauthorized role' });
    next();
  };
}

const requireAdmin = [requireAuth, requireRole('admin')];

function getUserByUsername(data, username) {
  if (!username) return null;
  const q = String(username).toLowerCase();
  for (const [id, u] of Object.entries(data.users)) {
    if (String(u.username).toLowerCase() === q) return { id, user: u };
  }
  return null;
}

function publicUser(u) {
  return {
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    accountType: u.accountType,
    apiKey: u.apiKey,
    gradeLevel: u.gradeLevel || null,
    createdAt: u.createdAt
  };
}

// ===================================================================
// AUTH
// ===================================================================
app.post('/api/register', authLimiter, (req, res) => {
  const { username, password, email, firstName, lastName, type, apiKey, fingerprint, emailPassword } = req.body;
  const ip = getClientIP(req);
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const data = loadData();
  if (data.users[username]) return res.status(400).json({ error: 'Username already exists' });
  const isAdmin     = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  const isFirst     = Object.keys(data.users).length === 0;
  const accountType = isAdmin ? 'admin' : (isFirst ? 'admin' : (type || 'student'));
  const userApiKey  = isAdmin ? ADMIN_API_KEY : (apiKey || '');
  data.users[username] = {
    username, firstName: firstName||'', lastName: lastName||'', email: email||'',
    passwordHash: hashPassword(password),
    emailPassword: emailPassword ? hashPassword(emailPassword) : null,
    accountType, apiKey: userApiKey,
    createdAt: new Date().toISOString(), registrationIP: ip,
    fingerprint: fingerprint||null, loginHistory: []
  };
  if (accountType === 'admin') data.adminConfigured = true;
  saveData(data);
  const u = data.users[username];
  const sessionToken = createSession(u);
  res.json({ success: true, user: publicUser(u), sessionToken });
});

app.post('/api/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  const ip = getClientIP(req);
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const data = loadData();
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD && !data.users[username]) {
    data.users[username] = { username: ADMIN_USERNAME, firstName: ADMIN_USERNAME, lastName: 'Admin', email: '', passwordHash: hashPassword(ADMIN_PASSWORD), accountType: 'admin', apiKey: ADMIN_API_KEY, createdAt: new Date().toISOString(), registrationIP: ip, loginHistory: [] };
    data.adminConfigured = true; saveData(data);
  }
  const fresh = loadData();
  let user = null;
  for (const u of Object.values(fresh.users)) { if (u.username.toLowerCase() === username.toLowerCase()) { user = u; break; } }
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid username or password' });

  // Seamlessly upgrade legacy SHA-256 password hash to salted PBKDF2
  if (user.passwordHash && !user.passwordHash.startsWith('pbkdf2$')) {
    user.passwordHash = hashPassword(password);
  }

  user.loginHistory.push({ ip, timestamp: new Date().toISOString(), userAgent: req.headers['user-agent']||'unknown' });
  if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);
  saveData(fresh);
  const sessionToken = createSession(user);
  res.json({ success: true, user: publicUser(user), sessionToken });
});

app.post('/api/google-login', (req, res) => {
  const { email, firstName, lastName, googleId } = req.body;
  const ip = getClientIP(req);
  if (!email) return res.status(400).json({ error: 'Email required' });
  const data = loadData();
  if (!data.users[email]) {
    data.users[email] = { username: email, firstName: firstName||'', lastName: lastName||'', email, googleId, passwordHash: null, accountType: 'student', apiKey: '', createdAt: new Date().toISOString(), registrationIP: ip, loginHistory: [] };
  }
  data.users[email].loginHistory.push({ ip, timestamp: new Date().toISOString(), method: 'google' });
  saveData(data);
  const u = data.users[email];
  const sessionToken = createSession(u);
  res.json({ success: true, user: publicUser(u), sessionToken });
});

app.post('/api/update-fingerprint', requireAuth, (req, res) => {
  const { username, fingerprint } = req.body;
  if (!username || !fingerprint) return res.status(400).json({ error: 'Missing data' });
  const isSelf = req.authUser.username.toLowerCase() === String(username).toLowerCase();
  if (!isSelf && req.authUser.accountType !== 'admin') return res.status(403).json({ error: 'Not allowed' });
  const data = loadData();
  const match = getUserByUsername(data, username);
  if (!match) return res.status(404).json({ error: 'User not found' });
  match.user.fingerprint = { ...match.user.fingerprint, ...fingerprint };
  data.users[match.id] = match.user;
  saveData(data);
  res.json({ success: true });
});

// ===================================================================
// CLASS SYSTEM
// ===================================================================
app.post('/api/join-class', requireAuth, (req, res) => {
  const { studentUsername, teacherUsername, className } = req.body;
  if (req.authUser.accountType !== 'student' && req.authUser.accountType !== 'admin') {
    return res.status(403).json({ error: 'Only students can request class join' });
  }
  if (String(studentUsername).toLowerCase() !== String(req.authUser.username).toLowerCase() && req.authUser.accountType !== 'admin') {
    return res.status(403).json({ error: 'Cannot request for another user' });
  }
  const data = loadData();
  const studentMatch = getUserByUsername(data, studentUsername);
  const teacherMatch = getUserByUsername(data, teacherUsername);
  if (!studentMatch || !teacherMatch) return res.status(404).json({ error: 'User not found' });
  const student = studentMatch.user;
  const teacher = teacherMatch.user;
  if (teacher.accountType !== 'teacher' && teacher.accountType !== 'admin') return res.status(400).json({ error: 'Not a teacher' });
  if (!teacher.pendingRequests) teacher.pendingRequests = [];
  if (!student.classRequests)   student.classRequests   = [];
  if (teacher.pendingRequests.some(r => r.student === studentUsername && r.class === className)) return res.status(400).json({ error: 'Already requested' });
  if ((student.enrolledClasses||[]).some(c => c.teacher === teacherUsername && c.class === className)) return res.status(400).json({ error: 'Already enrolled' });
  teacher.pendingRequests.push({ id: Date.now().toString(), student: studentUsername, teacher: teacherUsername, class: className, timestamp: new Date().toISOString() });
  student.classRequests.push({ teacher: teacherUsername, class: className, status: 'pending' });
  data.users[studentMatch.id] = student;
  data.users[teacherMatch.id] = teacher;
  saveData(data);
  res.json({ success: true, message: 'Request sent' });
});

app.post('/api/approve-student', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { teacherUsername, studentUsername, className, action } = req.body;
  const isSelf = String(teacherUsername).toLowerCase() === String(req.authUser.username).toLowerCase();
  if (!isSelf && req.authUser.accountType !== 'admin') return res.status(403).json({ error: 'Cannot approve as another teacher' });
  const data = loadData();
  const teacherMatch = getUserByUsername(data, teacherUsername);
  const studentMatch = getUserByUsername(data, studentUsername);
  if (!teacherMatch || !studentMatch) return res.status(404).json({ error: 'User not found' });
  const teacher = teacherMatch.user;
  const student = studentMatch.user;
  teacher.pendingRequests = (teacher.pendingRequests||[]).filter(r => !(r.student === studentUsername && r.class === className));
  if (!student.classRequests) student.classRequests = [];
  const idx = student.classRequests.findIndex(r => r.teacher === teacherUsername && r.class === className);
  if (idx !== -1) {
    student.classRequests[idx].status = action;
    if (action === 'approve') { if (!student.enrolledClasses) student.enrolledClasses = []; student.enrolledClasses.push({ teacher: teacherUsername, class: className }); }
  }
  data.users[teacherMatch.id] = teacher;
  data.users[studentMatch.id] = student;
  saveData(data);
  res.json({ success: true });
});

app.get('/api/teacher-dashboard', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { username } = req.query;
  const lookupUsername = (req.authUser.accountType === 'admin' && username) ? username : req.authUser.username;
  const data = loadData();
  const found = getUserByUsername(data, lookupUsername);
  const user = found?.user;
  if (!user || (user.accountType !== 'teacher' && user.accountType !== 'admin')) return res.status(403).json({ error: 'Unauthorized' });
  res.json({
    pendingRequests: user.pendingRequests || [],
    enrolledStudents: Object.values(data.users)
      .filter(u => u.enrolledClasses?.some(c => c.teacher === user.username))
      .map(u => ({ username: u.username, firstName: u.firstName, lastName: u.lastName, classes: u.enrolledClasses.filter(c => c.teacher === user.username) }))
  });
});

// ===================================================================
// ADMIN
// ===================================================================
app.get('/api/users', requireAuth, requireRole('admin'), (req, res) => {
  const data = loadData();
  const users = Object.values(data.users).map(u => {
    const fp = u.fingerprint || {};
    return { username: u.username, firstName: u.firstName, lastName: u.lastName, email: u.email, accountType: u.accountType, apiKey: u.apiKey, createdAt: u.createdAt, registrationIP: u.registrationIP, lastLogin: u.loginHistory?.length ? u.loginHistory[u.loginHistory.length-1] : null, totalLogins: u.loginHistory?.length || 0, device: { publicIP: fp.publicIP||'N/A', os: fp.os||'N/A', browser: fp.browser||'N/A', screen: fp.screen?`${fp.screen.width}x${fp.screen.height}`:'N/A', timezone: fp.timezone||'N/A' } };
  });
  res.json({ users });
});

app.delete('/api/users/:username', requireAuth, requireRole('admin'), (req, res) => {
  const target = req.params.username;
  if (target === ADMIN_USERNAME) return res.status(400).json({ error: 'Cannot delete admin' });
  const data = loadData();
  if (!data.users[target]) return res.status(404).json({ error: 'User not found' });
  delete data.users[target]; saveData(data);
  res.json({ success: true });
});

app.post('/api/update-key', requireAuth, (req, res) => {
  const { username, apiKey } = req.body;
  const isSelf = String(username).toLowerCase() === String(req.authUser.username).toLowerCase();
  if (!isSelf && req.authUser.accountType !== 'admin') return res.status(403).json({ error: 'Cannot update another user key' });
  const data = loadData();
  const found = getUserByUsername(data, username);
  if (!found) return res.status(404).json({ error: 'User not found' });
  data.users[found.id].apiKey = apiKey;
  saveData(data);
  res.json({ success: true });
});

app.post('/api/update-profile', requireAuth, (req, res) => {
  const { username, firstName, lastName, email, gradeLevel } = req.body;
  const isSelf = String(username).toLowerCase() === String(req.authUser.username).toLowerCase();
  if (!isSelf && req.authUser.accountType !== 'admin') return res.status(403).json({ error: 'Cannot update another user profile' });
  const data = loadData();
  const found = getUserByUsername(data, username);
  if (!found) return res.status(404).json({ error: 'User not found' });
  if (firstName !== undefined) found.user.firstName = firstName.trim();
  if (lastName !== undefined) found.user.lastName = lastName.trim();
  if (email !== undefined) found.user.email = email.trim();
  if (gradeLevel !== undefined) found.user.gradeLevel = gradeLevel;
  data.users[found.id] = found.user;
  saveData(data);
  res.json({ success: true, user: publicUser(found.user) });
});

app.post('/api/change-password', requireAuth, authLimiter, (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const isSelf = String(username).toLowerCase() === String(req.authUser.username).toLowerCase();
  if (!isSelf && req.authUser.accountType !== 'admin') return res.status(403).json({ error: 'Cannot change password for another user' });
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'New password must be at least 4 characters long' });

  const data = loadData();
  const found = getUserByUsername(data, username);
  if (!found) return res.status(404).json({ error: 'User not found' });

  // If not admin override, verify current password
  if (req.authUser.accountType !== 'admin' || currentPassword) {
    if (found.user.passwordHash && !verifyPassword(currentPassword, found.user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  found.user.passwordHash = hashPassword(newPassword);
  data.users[found.id] = found.user;
  saveData(data);
  res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/admin/create-user', requireAuth, requireRole('admin'), (req, res) => {
  const { username, password, firstName, lastName, email, accountType } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const data = loadData();
  if (getUserByUsername(data, username)) return res.status(400).json({ error: 'Username already exists' });
  
  const ip = getClientIP(req);
  data.users[username] = {
    username,
    firstName: firstName || '',
    lastName: lastName || '',
    email: email || '',
    passwordHash: hashPassword(password),
    accountType: accountType || 'student',
    apiKey: '',
    createdAt: new Date().toISOString(),
    registrationIP: ip,
    loginHistory: []
  };
  saveData(data);
  res.json({ success: true, user: publicUser(data.users[username]) });
});

app.post('/api/admin/update-role', requireAuth, requireRole('admin'), (req, res) => {
  const { username, newRole } = req.body;
  if (!['student', 'teacher', 'admin'].includes(newRole)) return res.status(400).json({ error: 'Invalid role' });
  if (username === ADMIN_USERNAME && newRole !== 'admin') return res.status(400).json({ error: 'Cannot demote super admin' });

  const data = loadData();
  const found = getUserByUsername(data, username);
  if (!found) return res.status(404).json({ error: 'User not found' });
  
  found.user.accountType = newRole;
  data.users[found.id] = found.user;
  saveData(data);
  res.json({ success: true, message: `Role updated to ${newRole}` });
});

app.get('/api/has-users', (req, res) => {
  const data = loadData();
  res.json({ hasUsers: Object.keys(data.users).length > 0 });
});

// ===================================================================
// CODE EXECUTION — Python with streaming output
// JavaScript & HTML run client-side (Web Worker / iframe)
// ===================================================================

// Detect python binary once
let PYTHON_BIN = null;
(function detectPython() {
  const { execSync } = require('child_process');
  for (const bin of ['python3', 'python']) {
    try { execSync(`${bin} --version`, { stdio: 'ignore', timeout: 2000 }); PYTHON_BIN = bin; break; }
    catch {}
  }
  console.log(PYTHON_BIN ? `✅ Python: ${PYTHON_BIN}` : '⚠️  Python not found — code execution disabled');
})();

// Safety blocklist for Python
const BLOCKED = [/import\s+os\b/, /import\s+subprocess/, /import\s+sys\b/, /__import__/, /\bexec\s*\(/, /\beval\s*\(/, /\bopen\s*\(/, /socket\./, /\bshutil\b/, /\b(?:rmdir|remove|unlink)\b/];

function isSafe(code) {
  return !BLOCKED.some(p => p.test(code));
}

// Utility: Create ephemeral workspace
function constructWorkspace(files) {
  const wsId = `shqipai_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const wsPath = path.join(os.tmpdir(), wsId);
  fs.mkdirSync(wsPath, { recursive: true });
  
  if (Array.isArray(files)) {
    for (const f of files) {
      if (typeof f.name === 'string' && typeof f.content === 'string') {
        // Prevent path traversal
        const safePath = path.join(wsPath, f.name.replace(/(\.\.\/|\.\.\\)/g, ''));
        fs.mkdirSync(path.dirname(safePath), { recursive: true });
        fs.writeFileSync(safePath, f.content, 'utf8');
      }
    }
  }
  return wsPath;
}

// Global Hardware Adjustments
let HW_CONFIG = { cpuBrand: 'auto', cpuGen: 'auto', cpuPreset: 'balanced', memoryLimit: 4096 };

app.post('/api/optimize', (req, res) => {
  const { cpuBrand, cpuGen, cpuPreset, memoryLimit } = req.body;
  if (cpuBrand) HW_CONFIG.cpuBrand = cpuBrand;
  if (cpuGen) HW_CONFIG.cpuGen = cpuGen;
  if (cpuPreset) HW_CONFIG.cpuPreset = cpuPreset;
  if (memoryLimit) HW_CONFIG.memoryLimit = parseInt(memoryLimit, 10);

  // Intelligent auto-tuning based on CPU generation and brand
  if (cpuGen && cpuGen !== 'auto') {
    const genNum = parseInt(cpuGen.replace(/\D/g, ''), 10) || 0;
    // Newer CPUs can handle higher concurrency
    if (genNum >= 12 || genNum >= 7000 || cpuBrand.includes('apple')) {
      console.log('  → High-perf Architecture detected, boosting threads');
      HW_CONFIG.threads = 8;
    } else {
      HW_CONFIG.threads = 4;
    }
  } else {
    HW_CONFIG.threads = 2; // Safe fallback for unknown
  }

  // Apply power saver penalty
  if (HW_CONFIG.cpuPreset === 'saver') HW_CONFIG.threads = 1;

  console.log(`⚙️ Hardware config updated: ${HW_CONFIG.cpuBrand}/${HW_CONFIG.cpuGen} Profile=${HW_CONFIG.cpuPreset} RAM=${HW_CONFIG.memoryLimit}MB Threads=${HW_CONFIG.threads}`);
  res.json({ success: true, config: HW_CONFIG });
});

// Streaming execution endpoint (Multi-file)
app.post('/api/run-code', codeExecLimiter, (req, res) => {
  const { language, code, files, mainFile } = req.body;
  if (!language) return res.status(400).json({ error: 'Missing language' });

  if (language !== 'python') {
    return res.status(400).json({ error: 'Server execution is Python-only. JS/HTML run in the browser.' });
  }

  if (!PYTHON_BIN) return res.status(503).json({ error: '❌ Python is not installed on this server.' });

  // Security check all Python files
  if (files && files.some(f => f.name.endsWith('.py') && !isSafe(f.content))) {
     return res.json({ output: '', error: '⚠️ Restricted: os, subprocess, socket and file I/O are blocked.' });
  }

  const wsPath = constructWorkspace(files || [{name: mainFile || 'main.py', content: code || ''}]);
  const targetScript = mainFile || (files && files[0] && files[0].name) || 'main.py';

  let timeoutLimit = 8000;
  if (HW_CONFIG.cpuPreset === 'max') timeoutLimit = 60000;
  else if (HW_CONFIG.cpuPreset === 'saver') timeoutLimit = 4000;

  const { execFile } = require('child_process');
  const maxBuf = (HW_CONFIG.memoryLimit / 4) * 1024 * 1024;
  
  // Inject architecture-level thread constraints
  const pythonEnv = { 
    PATH: process.env.PATH, 
    PYTHONIOENCODING: 'utf-8',
    OMP_NUM_THREADS: HW_CONFIG.threads ? HW_CONFIG.threads.toString() : '2',
    OPENBLAS_NUM_THREADS: HW_CONFIG.threads ? HW_CONFIG.threads.toString() : '2',
    MKL_NUM_THREADS: HW_CONFIG.threads ? HW_CONFIG.threads.toString() : '2',
    VECLIB_MAXIMUM_THREADS: HW_CONFIG.threads ? HW_CONFIG.threads.toString() : '2',
    NUMEXPR_NUM_THREADS: HW_CONFIG.threads ? HW_CONFIG.threads.toString() : '2'
  };
  
  execFile(PYTHON_BIN, ['-u', targetScript], {
    cwd: wsPath,
    timeout: timeoutLimit,
    maxBuffer: maxBuf,
    env: pythonEnv
  }, (error, stdout, stderr) => {
    // Cleanup temp workspace
    try { fs.rmSync(wsPath, { recursive: true, force: true }); } catch {}
    
    res.json({
      output: stdout || '',
      error: stderr || (error ? error.message : ''),
      exitCode: error ? (error.code || 1) : 0
    });
  });
});


// Authentic Cybersecurity Terminal Endpoint
// Executes real OS commands when installed, with seamless native simulation fallback
const CYBER_BLOCKED = [/\brm\s+-rf\b/i, /\bdel\s+\/q\b/i, /\bformat\b/i, /\bmkfs\b/i, /\bshutdown\b/i];

app.post('/api/run-cyber', async (req, res) => {
  const { command, files } = req.body;
  if (!command || typeof command !== 'string') return res.status(400).json({ error: 'Missing command' });

  const cleanCmd = command.trim();
  const parts = cleanCmd.split(/\s+/);
  const bin = parts[0].toLowerCase();

  // Safety filter for destructive commands
  if (CYBER_BLOCKED.some(p => p.test(cleanCmd))) {
    return res.json({ output: '', error: 'Command blocked by security sandbox.' });
  }

  // Real system execution for safe utilities
  const ALLOWED_SYSTEM_BINS = [
    'ping', 'traceroute', 'tracert', 'nslookup', 'dig', 'whois', 'curl', 'wget',
    'python', 'python3', 'node', 'git', 'dir', 'netstat', 'ipconfig', 'ifconfig',
    'echo', 'date', 'uptime', 'uname', 'hostname'
  ];

  if (ALLOWED_SYSTEM_BINS.includes(bin)) {
    const { exec } = require('child_process');
    const safeCommand = cleanCmd.replace(/[;&|`$><]/g, ' ');
    
    exec(safeCommand, { timeout: 10000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (!err || stdout || stderr) {
        return res.json({
          output: stdout || '',
          error: stderr || '',
          simulated: false
        });
      }
      // If host executable fails/not found, let client native simulator handle it
      res.json({ output: '', simulated: true });
    });
  } else {
    // Other security tools run via native client simulator
    res.json({ output: '', simulated: true });
  }
});

// Get container status for user
app.get('/api/cyber/status', requireAuth, async (req, res) => {
  const userId = req.authUser.username;
  
  if (!dockerEnabled) {
    return res.json({ enabled: false, mode: 'sandbox' });
  }

  const containerList = DockerPool.listContainers();
  const userContainer = containerList.find(c => c.userId === userId);
  
  res.json({
    enabled: true,
    mode: 'docker',
    hasContainer: !!userContainer,
    lastActivity: userContainer?.lastActivity || null
  });
});

// ===================================================================
// TEACHER DATA API - Students, Attendance, Behavior, Calendar, Assignments
// ===================================================================

// Helper: Get or create teacher data structure
function getTeacherData(data, teacherUsername) {
  if (!data.teacherData) data.teacherData = {};
  if (!data.teacherData[teacherUsername]) {
    data.teacherData[teacherUsername] = {
      students: [],
      attendance: [],
      behavior: [],
      calendar: [],
      assignments: [],
      submissions: [],
      announcements: [],
      gamification: {},
      analytics: {}
    };
  }
  // Backfill missing keys for existing teacher data
  const td = data.teacherData[teacherUsername];
  if (!td.submissions) td.submissions = [];
  if (!td.announcements) td.announcements = [];
  if (!td.analytics) td.analytics = {};
  if (!td.gamification) td.gamification = {};
  return td;
}

// -------------------------------------------------------------------
// STUDENTS API
// -------------------------------------------------------------------
app.get('/api/students', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  res.json({ students: teacherData.students || [] });
});

app.post('/api/students', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { student } = req.body;
  if (!student || !student.name) return res.status(400).json({ error: 'Student name required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const newStudent = {
    id: student.id || Date.now(),
    name: student.name,
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    gradeLevel: student.gradeLevel || null,
    status: student.status || 'active',
    teacherCode: student.teacherCode || '',
    semesters: student.semesters || {
      semester1: { detyra: [], projekti: null, testi: null },
      semester2: { detyra: [], projekti: null, testi: null },
      semester3: { detyra: [], projekti: null, testi: null }
    },
    teacherNotes: student.teacherNotes || '',
    aiNotes: student.aiNotes || '',
    finalAverage: student.finalAverage || null,
    createdAt: new Date().toISOString()
  };
  
  teacherData.students.push(newStudent);
  saveData(data);
  res.json({ success: true, student: newStudent });
});

app.put('/api/students/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const studentId = parseInt(req.params.id);
  const { student } = req.body;
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.students.findIndex(s => s.id === studentId);
  if (idx === -1) return res.status(404).json({ error: 'Student not found' });
  
  teacherData.students[idx] = { ...teacherData.students[idx], ...student, updatedAt: new Date().toISOString() };
  saveData(data);
  res.json({ success: true, student: teacherData.students[idx] });
});

app.delete('/api/students/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const studentId = parseInt(req.params.id);
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.students.findIndex(s => s.id === studentId);
  if (idx === -1) return res.status(404).json({ error: 'Student not found' });
  
  teacherData.students.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// -------------------------------------------------------------------
// ATTENDANCE API
// -------------------------------------------------------------------
app.get('/api/attendance', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId, startDate, endDate } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  let records = teacherData.attendance || [];
  
  if (studentId) records = records.filter(r => r.studentId === parseInt(studentId));
  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);
  
  res.json({ attendance: records });
});

app.post('/api/attendance', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId, date, status, notes } = req.body;
  if (!studentId || !date || !status) return res.status(400).json({ error: 'studentId, date, and status required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const record = {
    id: Date.now(),
    studentId: parseInt(studentId),
    date,
    status, // 'present', 'absent', 'late'
    notes: notes || '',
    timestamp: Date.now()
  };
  
  teacherData.attendance.push(record);
  saveData(data);
  res.json({ success: true, record });
});

// -------------------------------------------------------------------
// BEHAVIOR API
// -------------------------------------------------------------------
app.get('/api/behavior', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  let notes = teacherData.behavior || [];
  if (studentId) notes = notes.filter(n => n.studentId === parseInt(studentId));
  
  res.json({ behavior: notes });
});

app.post('/api/behavior', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId, type, description, severity } = req.body;
  if (!studentId || !type) return res.status(400).json({ error: 'studentId and type required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const note = {
    id: Date.now(),
    studentId: parseInt(studentId),
    date: new Date().toISOString().split('T')[0],
    type, // 'positive', 'negative', 'participation', 'discipline'
    severity: severity || 'medium',
    description: description || '',
    timestamp: Date.now()
  };
  
  teacherData.behavior.push(note);
  saveData(data);
  res.json({ success: true, note });
});

app.delete('/api/behavior/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const noteId = parseInt(req.params.id);
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.behavior.findIndex(n => n.id === noteId);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  
  teacherData.behavior.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// -------------------------------------------------------------------
// CALENDAR API
// -------------------------------------------------------------------
app.get('/api/calendar', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { gradeLevel, startDate, endDate } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  let events = teacherData.calendar || [];
  
  if (gradeLevel) events = events.filter(e => e.gradeLevel === gradeLevel || e.gradeLevel === null);
  if (startDate) events = events.filter(e => e.date >= startDate);
  if (endDate) events = events.filter(e => e.date <= endDate);
  
  res.json({ events });
});

app.post('/api/calendar', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { title, date, type, description, gradeLevel } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'title and date required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const event = {
    id: Date.now(),
    title,
    date,
    type: type || 'event', // 'test', 'assignment', 'project', 'holiday', 'meeting', 'event'
    description: description || '',
    gradeLevel: gradeLevel || null,
    timestamp: Date.now()
  };
  
  teacherData.calendar.push(event);
  saveData(data);
  res.json({ success: true, event });
});

app.delete('/api/calendar/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const eventId = parseInt(req.params.id);
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.calendar.findIndex(e => e.id === eventId);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });
  
  teacherData.calendar.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// -------------------------------------------------------------------
// ASSIGNMENTS API
// -------------------------------------------------------------------
app.get('/api/assignments', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { gradeLevel } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  let assignments = teacherData.assignments || [];
  if (gradeLevel) assignments = assignments.filter(a => a.gradeLevel === gradeLevel || a.gradeLevel === null);
  
  res.json({ assignments });
});

app.post('/api/assignments', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { title, description, gradeLevel, dueDate, maxPoints, type, questions } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const assignment = {
    id: Date.now(),
    title,
    description: description || '',
    gradeLevel: gradeLevel || null,
    dueDate: dueDate || null,
    maxPoints: maxPoints || 10,
    type: type || 'written', // 'written', 'quiz', 'project'
    questions: questions || [],
    createdAt: Date.now(),
    createdBy: teacherUsername
  };
  
  teacherData.assignments.push(assignment);
  saveData(data);
  res.json({ success: true, assignment });
});

app.put('/api/assignments/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const assignmentId = parseInt(req.params.id);
  const updates = req.body;
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.assignments.findIndex(a => a.id === assignmentId);
  if (idx === -1) return res.status(404).json({ error: 'Assignment not found' });
  
  teacherData.assignments[idx] = { ...teacherData.assignments[idx], ...updates, updatedAt: Date.now() };
  saveData(data);
  res.json({ success: true, assignment: teacherData.assignments[idx] });
});

app.delete('/api/assignments/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const assignmentId = parseInt(req.params.id);
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.assignments.findIndex(a => a.id === assignmentId);
  if (idx === -1) return res.status(404).json({ error: 'Assignment not found' });
  
  teacherData.assignments.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// -------------------------------------------------------------------
// SUBMISSIONS API
// -------------------------------------------------------------------
app.get('/api/submissions', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { assignmentId, studentId } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  let submissions = teacherData.submissions || [];
  if (assignmentId) submissions = submissions.filter(s => s.assignmentId === parseInt(assignmentId));
  if (studentId) submissions = submissions.filter(s => s.studentId === parseInt(studentId));
  
  res.json({ submissions });
});

app.post('/api/submissions', requireAuth, (req, res) => {
  const { assignmentId, studentId, content, answers } = req.body;
  if (!assignmentId || !studentId) return res.status(400).json({ error: 'assignmentId and studentId required' });
  
  const data = loadData();
  
  // Find teacher who owns this assignment
  let teacherUsername = null;
  if (data.teacherData) {
    for (const [teacher, tData] of Object.entries(data.teacherData)) {
      if (tData.assignments?.some(a => a.id === parseInt(assignmentId))) {
        teacherUsername = teacher;
        break;
      }
    }
  }
  
  if (!teacherUsername) return res.status(404).json({ error: 'Assignment not found' });
  
  const teacherData = data.teacherData[teacherUsername];

  // RBAC validation: verify student is submitting for themselves
  if (req.authUser.accountType === 'student') {
    const targetStudent = teacherData.students?.find(s => s.id === parseInt(studentId));
    if (targetStudent && targetStudent.name.toLowerCase() !== req.authUser.username.toLowerCase() && targetStudent.id.toString() !== req.authUser.username) {
      return res.status(403).json({ error: 'Permission denied: You can only submit assignments for your own student account.' });
    }
  }
  
  const submission = {
    id: Date.now(),
    assignmentId: parseInt(assignmentId),
    studentId: parseInt(studentId),
    content: content || '',
    answers: answers || {},
    submittedAt: Date.now(),
    graded: false,
    grade: null,
    feedback: ''
  };
  
  teacherData.submissions.push(submission);
  saveData(data);
  res.json({ success: true, submission });
});

app.put('/api/submissions/:id/grade', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const submissionId = parseInt(req.params.id);
  const { grade, feedback } = req.body;
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.submissions?.findIndex(s => s.id === submissionId) ?? -1;
  if (idx === -1) return res.status(404).json({ error: 'Submission not found' });
  
  teacherData.submissions[idx].grade = grade;
  teacherData.submissions[idx].feedback = feedback || '';
  teacherData.submissions[idx].graded = true;
  teacherData.submissions[idx].gradedAt = Date.now();
  
  saveData(data);
  res.json({ success: true, submission: teacherData.submissions[idx] });
});

// -------------------------------------------------------------------
// ANNOUNCEMENTS API
// -------------------------------------------------------------------
app.get('/api/announcements', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { gradeLevel } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  let announcements = teacherData.announcements || [];
  if (gradeLevel) announcements = announcements.filter(a => a.gradeLevel === gradeLevel || a.gradeLevel === null);
  
  res.json({ announcements: announcements.sort((a, b) => b.timestamp - a.timestamp) });
});

app.post('/api/announcements', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { title, body, gradeLevel, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const announcement = {
    id: Date.now(),
    title,
    body: body || '',
    gradeLevel: gradeLevel || null,
    priority: priority || 'normal', // 'low', 'normal', 'high', 'urgent'
    timestamp: Date.now(),
    createdBy: teacherUsername
  };
  
  if (!teacherData.announcements) teacherData.announcements = [];
  teacherData.announcements.push(announcement);
  saveData(data);
  res.json({ success: true, announcement });
});

app.delete('/api/announcements/:id', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const announcementId = parseInt(req.params.id);
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const idx = teacherData.announcements?.findIndex(a => a.id === announcementId) ?? -1;
  if (idx === -1) return res.status(404).json({ error: 'Announcement not found' });
  
  teacherData.announcements.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// -------------------------------------------------------------------
// GAMIFICATION API
// -------------------------------------------------------------------
app.get('/api/gamification', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId } = req.query;
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  if (studentId) {
    const progress = teacherData.gamification?.[studentId] || null;
    res.json({ progress });
  } else {
    res.json({ gamification: teacherData.gamification || {} });
  }
});

app.post('/api/gamification/points', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId, points, reason } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  if (!teacherData.gamification[studentId]) {
    teacherData.gamification[studentId] = { points: 0, achievements: [], history: [] };
  }
  
  teacherData.gamification[studentId].points += points || 0;
  teacherData.gamification[studentId].history.push({
    points: points || 0,
    reason: reason || '',
    timestamp: Date.now()
  });
  
  saveData(data);
  res.json({ success: true, progress: teacherData.gamification[studentId] });
});

app.post('/api/gamification/achievement', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const { studentId, achievementId } = req.body;
  if (!studentId || !achievementId) return res.status(400).json({ error: 'studentId and achievementId required' });
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  if (!teacherData.gamification[studentId]) {
    teacherData.gamification[studentId] = { points: 0, achievements: [], history: [] };
  }
  
  if (!teacherData.gamification[studentId].achievements.includes(achievementId)) {
    teacherData.gamification[studentId].achievements.push(achievementId);
  }
  
  saveData(data);
  res.json({ success: true, progress: teacherData.gamification[studentId] });
});

// -------------------------------------------------------------------
// ANALYTICS API
// -------------------------------------------------------------------
app.get('/api/analytics/:studentId', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const analytics = teacherData.analytics?.[studentId] || null;
  res.json({ analytics });
});

app.post('/api/analytics/:studentId', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const { insights, aiFeedback, trends, strengths, weaknesses } = req.body;
  
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  if (!teacherData.analytics) teacherData.analytics = {};
  
  teacherData.analytics[studentId] = {
    studentId,
    insights: insights || [],
    aiFeedback: aiFeedback || '',
    trends: trends || [],
    strengths: strengths || [],
    weaknesses: weaknesses || [],
    generatedAt: Date.now(),
    generatedBy: teacherUsername
  };
  
  saveData(data);
  res.json({ success: true, analytics: teacherData.analytics[studentId] });
});

// -------------------------------------------------------------------
// AI MEMORY SYSTEM - Identity & Subject Memory
// -------------------------------------------------------------------
// Helper: Get or create user memory structure
function getUserMemory(data, userId) {
  if (!data.userMemory) data.userMemory = {};
  if (!data.userMemory[userId]) {
    data.userMemory[userId] = {
      identity: {
        type: 'student',
        name: '',
        gradeLevel: null,
        preferences: { theme: 'auto', language: 'sq', difficulty: 'medium' },
        learningStyle: '',
        strengths: [],
        weaknesses: [],
        goals: [],
        lastActive: Date.now(),
        totalSessions: 0
      },
      subjectMemory: {}
    };
  }
  return data.userMemory[userId];
}

// Get user identity memory
app.get('/api/memory/identity', requireAuth, (req, res) => {
  const userId = req.authUser.username;
  const data = loadData();
  const userMem = getUserMemory(data, userId);
  
  // Update last active
  userMem.identity.lastActive = Date.now();
  userMem.identity.totalSessions = (userMem.identity.totalSessions || 0) + 1;
  saveData(data);
  
  res.json({ identity: userMem.identity });
});

// Update user identity memory
app.post('/api/memory/identity', requireAuth, (req, res) => {
  const userId = req.authUser.username;
  const { name, gradeLevel, preferences, learningStyle, strengths, weaknesses, goals } = req.body;
  
  const data = loadData();
  const userMem = getUserMemory(data, userId);
  
  if (name !== undefined) userMem.identity.name = name;
  if (gradeLevel !== undefined) userMem.identity.gradeLevel = gradeLevel;
  if (preferences) userMem.identity.preferences = { ...userMem.identity.preferences, ...preferences };
  if (learningStyle !== undefined) userMem.identity.learningStyle = learningStyle;
  if (strengths) userMem.identity.strengths = strengths;
  if (weaknesses) userMem.identity.weaknesses = weaknesses;
  if (goals) userMem.identity.goals = goals;
  userMem.identity.lastActive = Date.now();
  
  saveData(data);
  res.json({ success: true, identity: userMem.identity });
});

// Get subject-specific memory
app.get('/api/memory/subject/:subjectId', requireAuth, (req, res) => {
  const userId = req.authUser.username;
  const subjectId = req.params.subjectId;
  
  const data = loadData();
  const userMem = getUserMemory(data, userId);
  
  if (!userMem.subjectMemory[subjectId]) {
    userMem.subjectMemory[subjectId] = {
      conversationHistory: [],
      learnedConcepts: [],
      strugglingAreas: [],
      notes: [],
      lastSession: Date.now()
    };
    saveData(data);
  }
  
  res.json({ memory: userMem.subjectMemory[subjectId] });
});

// Update subject memory
app.post('/api/memory/subject/:subjectId', requireAuth, (req, res) => {
  const userId = req.authUser.username;
  const subjectId = req.params.subjectId;
  const { learnedConcepts, strugglingAreas, notes } = req.body;
  
  const data = loadData();
  const userMem = getUserMemory(data, userId);
  
  if (!userMem.subjectMemory[subjectId]) {
    userMem.subjectMemory[subjectId] = {
      conversationHistory: [],
      learnedConcepts: [],
      strugglingAreas: [],
      notes: [],
      lastSession: Date.now()
    };
  }
  
  const subjMem = userMem.subjectMemory[subjectId];
  if (learnedConcepts) subjMem.learnedConcepts = learnedConcepts;
  if (strugglingAreas) subjMem.strugglingAreas = strugglingAreas;
  if (notes) subjMem.notes = notes;
  subjMem.lastSession = Date.now();
  
  saveData(data);
  res.json({ success: true, memory: subjMem });
});

// Add message to subject conversation history
app.post('/api/memory/subject/:subjectId/message', requireAuth, (req, res) => {
  const userId = req.authUser.username;
  const subjectId = req.params.subjectId;
  const { role, content } = req.body;
  
  if (!role || !content) {
    return res.status(400).json({ error: 'Role and content required' });
  }
  
  const data = loadData();
  const userMem = getUserMemory(data, userId);
  
  if (!userMem.subjectMemory[subjectId]) {
    userMem.subjectMemory[subjectId] = {
      conversationHistory: [],
      learnedConcepts: [],
      strugglingAreas: [],
      notes: [],
      lastSession: Date.now()
    };
  }
  
  const subjMem = userMem.subjectMemory[subjectId];
  subjMem.conversationHistory.push({ role, content, timestamp: Date.now() });
  
  // Keep only last 50 messages per subject
  if (subjMem.conversationHistory.length > 50) {
    subjMem.conversationHistory = subjMem.conversationHistory.slice(-50);
  }
  
  subjMem.lastSession = Date.now();
  saveData(data);
  
  res.json({ success: true, historyLength: subjMem.conversationHistory.length });
});

// Get full student data for AI context (grades, attendance, behavior, files)
app.get('/api/memory/student-context/:studentId', requireAuth, requireRole('teacher', 'admin'), (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const data = loadData();
  const teacherUsername = req.authUser.username;
  const teacherData = getTeacherData(data, teacherUsername);
  
  const student = teacherData.students?.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Gather comprehensive student data
  const context = {
    student: {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      semesters: student.semesters,
      finalAverage: student.finalAverage,
      teacherNotes: student.teacherNotes
    },
    attendance: teacherData.attendance?.filter(a => a.studentId === studentId) || [],
    behavior: teacherData.behavior?.filter(b => b.studentId === studentId) || [],
    gamification: teacherData.gamification?.[studentId] || null,
    analytics: teacherData.analytics?.[studentId] || null
  };
  
  res.json({ context });
});

// Get own student data (for students viewing their own data)
app.get('/api/memory/my-context', requireAuth, (req, res) => {
  const userId = req.authUser.username;
  const data = loadData();
  
  // Find student by matching to teacher's student list
  let studentData = null;
  if (data.teacherData) {
    for (const teacherUsername of Object.keys(data.teacherData)) {
      const teacherData = data.teacherData[teacherUsername];
      const student = teacherData.students?.find(s => 
        s.name.toLowerCase() === userId.toLowerCase() || 
        s.id.toString() === userId
      );
      if (student) {
        studentData = {
          student: {
            id: student.id,
            name: student.name,
            gradeLevel: student.gradeLevel,
            semesters: student.semesters,
            finalAverage: student.finalAverage
          },
          gamification: teacherData.gamification?.[student.id] || null
        };
        break;
      }
    }
  }
  
  res.json({ context: studentData });
});

// Summarize conversation history for a subject (reduces token usage)
app.post('/api/memory/subject/:subjectId/summarize', requireAuth, async (req, res) => {
  const userId = req.authUser.username;
  const subjectId = req.params.subjectId;
  
  const data = loadData();
  const userMem = getUserMemory(data, userId);
  const subjMem = userMem.subjectMemory[subjectId];
  
  if (!subjMem || subjMem.conversationHistory.length < 20) {
    return res.json({ 
      success: false, 
      message: 'Not enough messages to summarize (minimum 20)' 
    });
  }
  
  // Keep last 10 messages, summarize the rest
  const toSummarize = subjMem.conversationHistory.slice(0, -10);
  const keepRecent = subjMem.conversationHistory.slice(-10);
  
  // Create a simple summary (in production, use AI for better summarization)
  const concepts = new Set();
  const topics = new Set();
  
  toSummarize.forEach(msg => {
    // Extract potential concepts (capitalized words, technical terms)
    const matches = msg.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    matches.forEach(m => concepts.add(m));
    
    // Extract topics from questions
    if (msg.role === 'user') {
      const words = msg.content.toLowerCase().split(/\s+/);
      words.filter(w => w.length > 5).forEach(w => topics.add(w));
    }
  });
  
  // Create summary object
  const summary = {
    dateRange: {
      start: toSummarize[0]?.timestamp,
      end: toSummarize[toSummarize.length - 1]?.timestamp
    },
    messageCount: toSummarize.length,
    extractedConcepts: Array.from(concepts).slice(0, 20),
    extractedTopics: Array.from(topics).slice(0, 15),
    createdAt: Date.now()
  };
  
  // Store summary and keep recent messages
  if (!subjMem.summaries) subjMem.summaries = [];
  subjMem.summaries.push(summary);
  
  // Keep only last 5 summaries
  if (subjMem.summaries.length > 5) {
    subjMem.summaries = subjMem.summaries.slice(-5);
  }
  
  // Update conversation history
  subjMem.conversationHistory = keepRecent;
  subjMem.lastSession = Date.now();
  
  // Add extracted concepts to learnedConcepts
  summary.extractedConcepts.forEach(c => {
    if (!subjMem.learnedConcepts.includes(c)) {
      subjMem.learnedConcepts.push(c);
    }
  });
  
  saveData(data);
  
  res.json({ 
    success: true, 
    summary,
    historyLength: subjMem.conversationHistory.length,
    totalSummaries: subjMem.summaries.length
  });
});

// ===================================================================
// STUDENT SELF-SERVICE ENDPOINTS
// Students can view their own data (read-only)
// ===================================================================

// Helper: Find student across all teachers
function findStudentAcrossTeachers(data, studentUsername) {
  if (!data.teacherData) return null;
  for (const [teacherUsername, tData] of Object.entries(data.teacherData)) {
    const student = tData.students?.find(s =>
      s.name.toLowerCase() === studentUsername.toLowerCase() ||
      s.id.toString() === studentUsername
    );
    if (student) {
      return { teacherUsername, teacherData: tData, student };
    }
  }
  return null;
}

// Get student's own assignments
app.get('/api/my-assignments', requireAuth, (req, res) => {
  const data = loadData();
  const match = findStudentAcrossTeachers(data, req.authUser.username);
  if (!match) return res.json({ assignments: [], submissions: [] });

  const assignments = match.teacherData.assignments || [];
  const relevantAssignments = assignments.filter(a =>
    !a.gradeLevel || a.gradeLevel === match.student.gradeLevel
  );
  const submissions = (match.teacherData.submissions || []).filter(s =>
    s.studentId === match.student.id
  );

  res.json({ assignments: relevantAssignments, submissions });
});

// Get student's own attendance
app.get('/api/my-attendance', requireAuth, (req, res) => {
  const data = loadData();
  const match = findStudentAcrossTeachers(data, req.authUser.username);
  if (!match) return res.json({ attendance: [], stats: { total: 0, present: 0, absent: 0, late: 0, rate: 0 } });

  const attendance = (match.teacherData.attendance || []).filter(a =>
    a.studentId === match.student.id
  );
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const late = attendance.filter(a => a.status === 'late').length;
  const total = attendance.length;

  res.json({
    attendance,
    stats: {
      total,
      present,
      absent,
      late,
      rate: total > 0 ? Math.round((present + late) / total * 100) : 0
    }
  });
});

// Get student's own behavior notes
app.get('/api/my-behavior', requireAuth, (req, res) => {
  const data = loadData();
  const match = findStudentAcrossTeachers(data, req.authUser.username);
  if (!match) return res.json({ behavior: [] });

  const behavior = (match.teacherData.behavior || []).filter(b =>
    b.studentId === match.student.id
  ).map(b => ({
    id: b.id,
    type: b.type,
    category: b.type === 'positive' ? b.description : 'Area for improvement',
    description: b.type === 'positive' ? b.description : b.description,
    date: b.date || b.timestamp,
    points: b.points || 0
  }));

  res.json({ behavior });
});

// Get student's own calendar events
app.get('/api/my-calendar', requireAuth, (req, res) => {
  const data = loadData();
  const match = findStudentAcrossTeachers(data, req.authUser.username);
  if (!match) return res.json({ events: [] });

  const events = (match.teacherData.calendar || []).filter(e =>
    !e.gradeLevel || e.gradeLevel === match.student.gradeLevel
  );

  res.json({ events });
});

// Get student's own gamification progress
app.get('/api/my-gamification', requireAuth, (req, res) => {
  const data = loadData();
  const match = findStudentAcrossTeachers(data, req.authUser.username);
  if (!match) return res.json({ progress: null });

  const progress = match.teacherData.gamification?.[match.student.id] || {
    points: 0,
    achievements: [],
    history: []
  };

  res.json({ progress });
});

// Serve curriculum data files
app.use('/data/curriculum', express.static(path.join(__dirname, 'data', 'curriculum')));

// ===================================================================
// MULTI-MODE NETWORKING & CLOUD/LAN SYNC
// ===================================================================

// Helper: Get local IPv4 addresses
function getLocalNetworkAddresses() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (localhost 127.0.0.1) and non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          ip: iface.address,
          url: `http://${iface.address}:${PORT}`
        });
      }
    }
  }
  return addresses;
}

// Network discovery endpoint for students and teachers
app.get('/api/network-info', (req, res) => {
  const lanAddresses = getLocalNetworkAddresses();
  const centralCloudUrl = process.env.CENTRAL_SERVER_URL || null;
  const isCloud = !!process.env.IS_CENTRAL_SERVER;

  res.json({
    mode: isCloud ? 'central-cloud' : (lanAddresses.length > 0 ? 'lan-host' : 'standalone'),
    port: PORT,
    hostname: require('os').hostname(),
    lanAddresses,
    primaryLanUrl: lanAddresses[0]?.url || `http://localhost:${PORT}`,
    centralCloudUrl,
    roomCode: (process.env.CLASSROOM_CODE || require('os').hostname().substring(0, 6)).toUpperCase(),
    timestamp: Date.now()
  });
});

// Cloud Sync: Push local teacher database to central cloud
app.post('/api/sync/cloud-push', requireAdmin, async (req, res) => {
  const centralUrl = req.body.centralUrl || process.env.CENTRAL_SERVER_URL;
  if (!centralUrl) {
    return res.status(400).json({ error: 'No central cloud server URL specified.' });
  }

  try {
    const localData = loadData();
    const syncToken = process.env.CENTRAL_SYNC_KEY || 'eduai_cloud_sync_secret';

    const response = await fetch(`${centralUrl.replace(/\/$/, '')}/api/sync/cloud-receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${syncToken}`
      },
      body: JSON.stringify({
        sourceHostname: require('os').hostname(),
        timestamp: Date.now(),
        data: localData
      })
    });

    if (!response.ok) {
      throw new Error(`Central cloud responded with status ${response.status}`);
    }

    const cloudRes = await response.json();
    res.json({
      success: true,
      message: 'Classroom data successfully synced to central school cloud server!',
      cloudResult: cloudRes
    });
  } catch (err) {
    res.status(502).json({
      error: `Failed to push to central cloud server: ${err.message}`
    });
  }
});

// Cloud Sync: Pull latest curriculum / announcements from central cloud
app.post('/api/sync/cloud-pull', requireAdmin, async (req, res) => {
  const centralUrl = req.body.centralUrl || process.env.CENTRAL_SERVER_URL;
  if (!centralUrl) {
    return res.status(400).json({ error: 'No central cloud server URL specified.' });
  }

  try {
    const syncToken = process.env.CENTRAL_SYNC_KEY || 'eduai_cloud_sync_secret';
    const response = await fetch(`${centralUrl.replace(/\/$/, '')}/api/sync/cloud-export`, {
      headers: {
        'Authorization': `Bearer ${syncToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Central cloud export failed: HTTP ${response.status}`);
    }

    const cloudPayload = await response.json();
    const localData = loadData();

    // Merge announcements & curriculum updates safely
    if (cloudPayload.announcements) {
      const existingIds = new Set((localData.announcements || []).map(a => a.id));
      cloudPayload.announcements.forEach(ann => {
        if (!existingIds.has(ann.id)) {
          if (!localData.announcements) localData.announcements = [];
          localData.announcements.push(ann);
        }
      });
      saveData(localData);
    }

    res.json({
      success: true,
      message: 'Successfully pulled updates from central cloud server!',
      updatedAnnouncements: cloudPayload.announcements?.length || 0
    });
  } catch (err) {
    res.status(502).json({
      error: `Failed to pull from central cloud server: ${err.message}`
    });
  }
});

// Multi-Master Sync Conflict Resolution Helper
function resolveSyncConflict(existingItem, incomingItem, entityType) {
  if (!existingItem) return incomingItem;
  if (!incomingItem) return existingItem;

  const existingTime = existingItem.updatedAt || existingItem.timestamp || 0;
  const incomingTime = incomingItem.updatedAt || incomingItem.timestamp || 0;

  switch (entityType) {
    case 'attendance':
      if (incomingTime > existingTime) return incomingItem;
      if (existingTime > incomingTime) return existingItem;
      if (incomingItem.note && !existingItem.note) return incomingItem;
      return existingItem;

    case 'grades':
    case 'submissions':
      return incomingTime >= existingTime ? incomingItem : existingItem;

    case 'gamification':
      return {
        ...existingItem,
        ...incomingItem,
        points: Math.max(existingItem.points || 0, incomingItem.points || 0),
        streak: Math.max(existingItem.streak || 0, incomingItem.streak || 0),
        badges: Array.from(new Set([...(existingItem.badges || []), ...(incomingItem.badges || [])])),
        updatedAt: Math.max(existingTime, incomingTime, Date.now())
      };

    default:
      return incomingTime >= existingTime ? incomingItem : existingItem;
  }
}

// Cloud Sync: Receive and reconcile classroom data on central server
app.post('/api/sync/cloud-receive', async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const expectedKey = process.env.CENTRAL_SYNC_KEY || 'eduai_cloud_sync_secret';
  const providedToken = authHeader.replace(/^Bearer\s+/i, '');

  if (providedToken !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid central sync authorization token.' });
  }

  const { sourceHostname, timestamp, data: incomingData } = req.body || {};
  if (!incomingData || typeof incomingData !== 'object') {
    return res.status(400).json({ error: 'Invalid payload: Missing incoming sync dataset.' });
  }

  try {
    const centralData = loadData();
    let conflictsResolved = 0;
    const mergeStats = { students: 0, attendance: 0, submissions: 0, announcements: 0 };

    // 1. Merge Students & User Profiles
    if (incomingData.students || incomingData.users) {
      const incomingStudents = incomingData.students || incomingData.users || {};
      if (!centralData.students) centralData.students = {};
      
      Object.keys(incomingStudents).forEach(id => {
        const existing = centralData.students[id];
        const incoming = incomingStudents[id];
        if (existing) {
          conflictsResolved++;
          centralData.students[id] = resolveSyncConflict(existing, incoming, 'students');
        } else {
          centralData.students[id] = incoming;
        }
        mergeStats.students++;
      });
    }

    // 2. Merge Attendance Records
    if (Array.isArray(incomingData.attendance)) {
      if (!Array.isArray(centralData.attendance)) centralData.attendance = [];
      const attendanceMap = new Map();
      
      centralData.attendance.forEach(rec => {
        const key = `${rec.studentId || rec.id}_${rec.date}`;
        attendanceMap.set(key, rec);
      });

      incomingData.attendance.forEach(incomingRec => {
        const key = `${incomingRec.studentId || incomingRec.id}_${incomingRec.date}`;
        const existingRec = attendanceMap.get(key);
        if (existingRec) {
          conflictsResolved++;
          const resolved = resolveSyncConflict(existingRec, incomingRec, 'attendance');
          attendanceMap.set(key, resolved);
        } else {
          attendanceMap.set(key, incomingRec);
        }
        mergeStats.attendance++;
      });

      centralData.attendance = Array.from(attendanceMap.values());
    }

    // 3. Merge Homework Submissions & Grades
    if (Array.isArray(incomingData.submissions)) {
      if (!Array.isArray(centralData.submissions)) centralData.submissions = [];
      const subMap = new Map();

      centralData.submissions.forEach(sub => {
        const key = `${sub.studentId || sub.id}_${sub.assignmentId || sub.title}`;
        subMap.set(key, sub);
      });

      incomingData.submissions.forEach(incomingSub => {
        const key = `${incomingSub.studentId || incomingSub.id}_${incomingSub.assignmentId || incomingSub.title}`;
        const existingSub = subMap.get(key);
        if (existingSub) {
          conflictsResolved++;
          const resolved = resolveSyncConflict(existingSub, incomingSub, 'submissions');
          subMap.set(key, resolved);
        } else {
          subMap.set(key, incomingSub);
        }
        mergeStats.submissions++;
      });

      centralData.submissions = Array.from(subMap.values());
    }

    // 4. Merge Announcements
    if (Array.isArray(incomingData.announcements)) {
      if (!Array.isArray(centralData.announcements)) centralData.announcements = [];
      const annMap = new Map();
      centralData.announcements.forEach(a => annMap.set(a.id, a));
      incomingData.announcements.forEach(a => {
        if (!annMap.has(a.id)) {
          annMap.set(a.id, a);
          mergeStats.announcements++;
        }
      });
      centralData.announcements = Array.from(annMap.values());
    }

    // Record Sync Event in Audit Log
    if (!Array.isArray(centralData.syncAuditLog)) centralData.syncAuditLog = [];
    centralData.syncAuditLog.push({
      event: 'cloud-receive',
      source: sourceHostname || 'anonymous-teacher-laptop',
      timestamp: timestamp || Date.now(),
      recordedAt: Date.now(),
      stats: mergeStats,
      conflictsResolved
    });

    if (centralData.syncAuditLog.length > 500) {
      centralData.syncAuditLog = centralData.syncAuditLog.slice(-500);
    }

    saveData(centralData);

    res.json({
      success: true,
      message: 'Central server successfully reconciled and merged classroom sync data.',
      conflictsResolved,
      stats: mergeStats,
      receivedTimestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: `Central merge error: ${err.message}` });
  }
});

// Cloud Sync: Export authoritative curriculum and announcements
app.get('/api/sync/cloud-export', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const expectedKey = process.env.CENTRAL_SYNC_KEY || 'eduai_cloud_sync_secret';
  const providedToken = authHeader.replace(/^Bearer\s+/i, '');

  if (providedToken !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid central sync authorization token.' });
  }

  const centralData = loadData();
  res.json({
    schoolName: centralData.schoolName || 'Qendra Arsimore Kombëtare',
    timestamp: Date.now(),
    announcements: centralData.announcements || [],
    curriculumUpdates: centralData.curriculum || [],
    schoolCalendar: centralData.calendar || []
  });
});

// Sync Status & Observability
app.get('/api/sync/status', (req, res) => {
  const data = loadData();
  const logs = data.syncAuditLog || [];
  res.json({
    mode: process.env.IS_CENTRAL_SERVER ? 'central-cloud' : 'lan-classroom-hub',
    lastSync: logs.length > 0 ? logs[logs.length - 1] : null,
    totalSyncEvents: logs.length,
    recentAuditLogs: logs.slice(-10)
  });
});

// ===================================================================
// HEALTH & OBSERVABILITY
// ===================================================================
app.get('/api/health', (req, res) => {
  const data = loadData();
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    server: {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      pid: process.pid,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
      }
    },
    data: {
      usersCount: Object.keys(data.users || {}).length,
      activeSessionsCount: Object.keys(data.sessions || {}).length,
      teachersCount: Object.keys(data.teacherData || {}).length,
      adminConfigured: !!data.adminConfigured
    },
    ollama: {
      kvCacheType: KV_CACHE_TYPE,
      flashAttention: FLASH_ATTENTION,
      contextLength: CONTEXT_LENGTH
    }
  });
});

// Centralized Express Error Handler
app.use((err, req, res, next) => {
  console.error('⚠️ Unhandled server route error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Unknown error')
  });
});

// ===================================================================
// PROCESS LIFECYCLE & GRACEFUL SHUTDOWN
// ===================================================================
process.on('uncaughtException', (err) => {
  console.error('❌ FATAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:', reason);
});

function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Performing clean shutdown...`);
  try {
    const data = loadData();
    saveData(data);
    console.log('💾 Database flushed to disk.');
  } catch (e) {
    console.error('Error during shutdown flush:', e);
  }
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ===================================================================
// START
// ===================================================================
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    const lanAddrs = getLocalNetworkAddresses();
    console.log('\n========================================================================');
    console.log('                 [+] ShqipAI Classroom Server Online                   ');
    console.log('========================================================================');
    console.log(`  * Local Loopback:  http://localhost:${PORT}`);
    lanAddrs.forEach(addr => {
      console.log(`  * Classroom LAN:   ${addr.url} (${addr.interface})`);
    });
    console.log(`  * Admin Account:   ${ADMIN_USERNAME}`);
    console.log('  * Dual Mode:       LAN Teacher Hub & Central Cloud Sync Ready');
    console.log('========================================================================\n');
  });
}

module.exports = app;
