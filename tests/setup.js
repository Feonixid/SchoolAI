// tests/setup.js
// Jest setup file for test environment configuration
// ===================================================================

// Mock Memory module
const MockMemory = {
  getIdentity: jest.fn(() => Promise.resolve({ name: 'Test User', gradeLevel: 10 })),
  setIdentity: jest.fn(() => Promise.resolve(true)),
  getSubjectMemory: jest.fn(() => Promise.resolve({
    conversationHistory: [],
    learnedConcepts: [],
    strugglingAreas: [],
    notes: ''
  })),
  addMessage: jest.fn(() => Promise.resolve(true)),
  autoUpdateConcepts: jest.fn(() => Promise.resolve()),
  buildAIContext: jest.fn(() => Promise.resolve('Test context')),
  clearCache: jest.fn(),
  syncWithBackend: jest.fn(() => Promise.resolve())
};

// Mock Projects module
const mockStore = {
  projects: [{ id: 'p1', name: 'Test Project', files: [{ id: 'f1', name: 'main.py', lang: 'python', content: '# test' }] }],
  activeProjectId: 'p1',
  activeFileId: 'f1'
};

const MockProjects = {
  init: jest.fn(),
  getStore: jest.fn(() => mockStore),
  save: jest.fn(),
  getActiveProject: jest.fn(() => mockStore.projects.find(p => p.id === mockStore.activeProjectId)),
  getActiveFile: jest.fn(() => {
    const proj = mockStore.projects.find(p => p.id === mockStore.activeProjectId);
    return proj?.files?.find(f => f.id === mockStore.activeFileId);
  }),
  getFile: jest.fn((id) => {
    for (const proj of mockStore.projects) {
      const file = proj.files.find(f => f.id === id);
      if (file) return file;
    }
    return null;
  }),
  getProject: jest.fn((id) => mockStore.projects.find(p => p.id === id)),
  setActiveFile: jest.fn((id) => { mockStore.activeFileId = id; }),
  setActiveProject: jest.fn((id) => { mockStore.activeProjectId = id; }),
  saveFileContent: jest.fn((id, content) => {
    for (const proj of mockStore.projects) {
      const file = proj.files.find(f => f.id === id);
      if (file) { file.content = content; return; }
    }
  }),
  createFile: jest.fn((name) => {
    const proj = mockStore.projects.find(p => p.id === mockStore.activeProjectId);
    if (proj) {
      const ext = name.split('.').pop();
      const langMap = { py: 'python', js: 'javascript', html: 'html', css: 'css' };
      const file = { id: 'f_' + Date.now(), name, lang: langMap[ext] || 'txt', content: '' };
      proj.files.push(file);
      mockStore.activeFileId = file.id;
      return file;
    }
    return null;
  }),
  deleteFile: jest.fn((id) => {
    for (const proj of mockStore.projects) {
      const idx = proj.files.findIndex(f => f.id === id);
      if (idx !== -1) {
        proj.files.splice(idx, 1);
        return true;
      }
    }
    return false;
  }),
  renameFile: jest.fn(),
  createProject: jest.fn((name) => {
    const proj = { id: 'p_' + Date.now(), name, files: [{ id: 'f_new', name: 'main.py', lang: 'python', content: '' }] };
    mockStore.projects.push(proj);
    mockStore.activeProjectId = proj.id;
    mockStore.activeFileId = 'f_new';
    return proj;
  }),
  deleteProject: jest.fn((id) => {
    mockStore.projects = mockStore.projects.filter(p => p.id !== id);
  }),
  renameProject: jest.fn(),
  langEmoji: jest.fn((lang) => {
    const map = { python: 'py', javascript: 'js', html: 'html', css: 'css' };
    return map[lang] || 'file';
  }),
  langBadgeClass: jest.fn((lang) => {
    const map = { python: 'lang-python', javascript: 'lang-js', html: 'lang-html', css: 'lang-css' };
    return map[lang] || 'lang-txt';
  })
};

// Mock Dialog module
const MockDialog = {
  confirm: jest.fn(() => Promise.resolve(true)),
  alert: jest.fn(() => Promise.resolve()),
  prompt: jest.fn(() => Promise.resolve('test'))
};

// Mock Toast module
const MockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

// Assign mocks to window (jsdom creates window, we extend it)
Object.assign(global.window, {
  Memory: MockMemory,
  Projects: MockProjects,
  Dialog: MockDialog,
  Toast: MockToast
});

// Also assign to global for direct access
global.Memory = MockMemory;
global.Projects = MockProjects;
global.Dialog = MockDialog;
global.Toast = MockToast;

// Mock document
global.document = {
  ...global.document,
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() }
  })),
  head: { appendChild: jest.fn() },
  body: { appendChild: jest.fn() }
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'node.js'
  },
  writable: true
});

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    })
  );
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Extend Jest matchers
expect.extend({
  toBeValidToken(received) {
    const pass = typeof received === 'string' && received.length > 10;
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not' : ''} to be a valid token`
    };
  },
  
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not' : ''} to be within range ${floor} - ${ceiling}`
    };
  }
});

// Standard Storage mock
const createStorageMock = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] !== undefined ? store[key] : null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock(), writable: true });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock(), writable: true });
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;

console.log('Jest test environment initialized');

