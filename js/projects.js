// js/projects.js
// ===================================================================
// PROJECT FILE SYSTEM
// Collections of files per project, stored in localStorage.
// Supports folders via path separators (e.g. "src/utils.py").
// ===================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'EduAI_projects_v2';

  // ----------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------
  function langFromName(filename) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    const map = {
      py: 'python', js: 'javascript', html: 'html', css: 'css',
      txt: 'txt', md: 'txt', json: 'javascript',
      sh: 'bash', c: 'c', cpp: 'c', ts: 'javascript'
    };
    return map[ext] || 'txt';
  }

  function langBadgeClass(lang) {
    const map = {
      python: 'lang-python', javascript: 'lang-javascript',
      html: 'lang-html', css: 'lang-css',
      bash: 'lang-other', c: 'lang-other', txt: 'lang-txt'
    };
    return map[lang] || 'lang-txt';
  }

  function langEmoji(lang) {
    const map = {
      python: '🐍', javascript: '🟨', html: '🌐',
      css: '🎨', bash: '🖥️', c: '⚙️', txt: '📄'
    };
    return map[lang] || '📄';
  }

  function uid() { return 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
  function pid() { return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

  // ----------------------------------------------------------------
  // DEFAULT STARTER PROJECTS
  // ----------------------------------------------------------------
  const DEFAULTS = {
    coding: [
      {
        id: 'proj_starter_coding',
        name: 'My First Project',
        files: [
          {
            id: 'f_py1', name: 'main.py', lang: 'python',
            content: '# Welcome to EduAI Coding!\n# Press Ctrl+Enter or click ▶ Run to execute\n\nname = input("What is your name? ")\nprint(f"Hello, {name}! Let\'s start coding.")\n'
          },
          {
            id: 'f_html1', name: 'index.html', lang: 'html',
            content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Page</title>\n  <style>\n    body { font-family: sans-serif; text-align: center; padding: 40px; background: #f0f4ff; }\n    h1 { color: #4a6cf7; }\n  </style>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>Edit me in EduAI.</p>\n</body>\n</html>\n'
          },
          {
            id: 'f_js1', name: 'script.js', lang: 'javascript',
            content: '// JavaScript runs instantly in your browser!\nconst nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log("Original:", nums);\nconsole.log("Doubled:", doubled);\nconsole.log("Sum:", nums.reduce((a, b) => a + b, 0));\n'
          }
        ]
      }
    ],
    cyber: [
      {
        id: 'proj_starter_cyber',
        name: 'Security Scripts',
        files: [
          {
            id: 'f_pass1', name: 'password_check.py', lang: 'python',
            content: '# Password Strength Checker\nimport re\n\ndef check_strength(password):\n    score = 0\n    checks = []\n    if len(password) >= 8:             score += 1; checks.append("✅ Length >= 8")\n    else:                               checks.append("❌ Too short (< 8 chars)")\n    if re.search(r\'[A-Z]\', password):   score += 1; checks.append("✅ Has uppercase")\n    else:                               checks.append("❌ No uppercase letter")\n    if re.search(r\'[0-9]\', password):   score += 1; checks.append("✅ Has number")\n    else:                               checks.append("❌ No number")\n    if re.search(r\'[^A-Za-z0-9]\', password): score += 1; checks.append("✅ Has symbol")\n    else:                               checks.append("❌ No symbol")\n    labels = {0:"Very Weak",1:"Weak",2:"Fair",3:"Good",4:"Strong"}\n    print(f"Strength: {labels[score]} ({score}/4)")\n    for c in checks: print(f"  {c}")\n\npassword = input("Enter a password to check: ")\ncheck_strength(password)\n'
          },
          {
            id: 'f_caesar1', name: 'caesar_cipher.py', lang: 'python',
            content: '# Caesar Cipher — Encode & Decode Messages\n\ndef caesar(text, shift, mode="encode"):\n    if mode == "decode": shift = -shift\n    result = ""\n    for ch in text:\n        if ch.isalpha():\n            base = ord("A") if ch.isupper() else ord("a")\n            result += chr((ord(ch) - base + shift) % 26 + base)\n        else:\n            result += ch\n    return result\n\nmode = input("Encode or decode? (e/d): ").lower()\nmessage = input("Enter message: ")\nshift = int(input("Enter shift (1-25): "))\nresult = caesar(message, shift, "encode" if mode == "e" else "decode")\nprint(f"Result: {result}")\n'
          }
        ]
      }
    ]
  };

  // ----------------------------------------------------------------
  // STORAGE
  // ----------------------------------------------------------------
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveStore(store) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
    catch (e) { console.warn('Projects: localStorage write failed', e); }
  }

  function getSubjectStore(subjectId) {
    const store = loadStore();
    if (!store[subjectId]) {
      const defaults = DEFAULTS[subjectId] || [];
      store[subjectId] = {
        projects: defaults.map(p => ({
          ...p,
          files: p.files.map(f => ({ ...f }))
        })),
        activeProjectId: defaults[0]?.id || null,
        activeFileId:    defaults[0]?.files?.[0]?.id || null
      };
      saveStore(store);
    }
    return store[subjectId];
  }

  function saveSubjectStore(subjectId, data) {
    const store = loadStore();
    store[subjectId] = data;
    saveStore(store);
  }

  // ----------------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------------
  const Projects = {
    _subjectId: null,

    init(subjectId) {
      this._subjectId = subjectId;
    },

    getStore() {
      return getSubjectStore(this._subjectId);
    },

    save(data) {
      saveSubjectStore(this._subjectId, data);
    },

    // ── Projects ──
    getActiveProject() {
      const s = this.getStore();
      return s.projects.find(p => p.id === s.activeProjectId) || s.projects[0] || null;
    },

    setActiveProject(projectId) {
      const s = this.getStore();
      s.activeProjectId = projectId;
      const proj = s.projects.find(p => p.id === projectId);
      s.activeFileId = proj?.files?.[0]?.id || null;
      this.save(s);
    },

    createProject(name) {
      const s = this.getStore();
      const defaultFile = { id: uid(), name: 'main.py', lang: 'python', content: '# New project\n' };
      const newProj = { id: pid(), name, files: [defaultFile] };
      s.projects.push(newProj);
      s.activeProjectId = newProj.id;
      s.activeFileId    = defaultFile.id;
      this.save(s);
      return newProj;
    },

    renameProject(projectId, newName) {
      const s = this.getStore();
      const proj = s.projects.find(p => p.id === projectId);
      if (proj) { proj.name = newName; this.save(s); }
    },

    deleteProject(projectId) {
      const s = this.getStore();
      s.projects = s.projects.filter(p => p.id !== projectId);
      if (s.activeProjectId === projectId) {
        s.activeProjectId = s.projects[0]?.id || null;
        s.activeFileId    = s.projects[0]?.files?.[0]?.id || null;
      }
      this.save(s);
    },

    // ── Files ──
    getActiveFile() {
      const proj = this.getActiveProject();
      if (!proj) return null;
      const s = this.getStore();
      return proj.files.find(f => f.id === s.activeFileId) || proj.files[0] || null;
    },

    setActiveFile(fileId) {
      const s = this.getStore();
      s.activeFileId = fileId;
      this.save(s);
    },

    getFile(fileId) {
      const s = this.getStore();
      for (const proj of s.projects) {
        const file = proj.files.find(f => f.id === fileId);
        if (file) return file;
      }
      return null;
    },

    saveFileContent(fileId, content) {
      const s = this.getStore();
      for (const proj of s.projects) {
        const file = proj.files.find(f => f.id === fileId);
        if (file) { file.content = content; break; }
      }
      this.save(s);
    },

    createFile(name) {
      const s = this.getStore();
      const proj = s.projects.find(p => p.id === s.activeProjectId);
      if (!proj) return null;
      // Prevent duplicate names
      const base = name.trim();
      let finalName = base;
      let counter   = 1;
      while (proj.files.some(f => f.name === finalName)) {
        const parts = base.split('.');
        if (parts.length > 1) {
          const ext = parts.pop();
          finalName = `${parts.join('.')}_${counter}.${ext}`;
        } else {
          finalName = `${base}_${counter}`;
        }
        counter++;
      }
      const lang = langFromName(finalName);
      const file = { id: uid(), name: finalName, lang, content: getTemplate(lang, finalName) };
      proj.files.push(file);
      s.activeFileId = file.id;
      this.save(s);
      return file;
    },

    renameFile(fileId, newName) {
      const s = this.getStore();
      for (const proj of s.projects) {
        const file = proj.files.find(f => f.id === fileId);
        if (file) {
          file.name = newName.trim();
          file.lang = langFromName(newName);
          break;
        }
      }
      this.save(s);
    },

    deleteFile(fileId) {
      const s = this.getStore();
      const proj = s.projects.find(p => p.id === s.activeProjectId);
      if (!proj) return;
      proj.files = proj.files.filter(f => f.id !== fileId);
      if (s.activeFileId === fileId) {
        s.activeFileId = proj.files[0]?.id || null;
      }
      this.save(s);
    },

    duplicateFile(fileId) {
      const s = this.getStore();
      const proj = s.projects.find(p => p.id === s.activeProjectId);
      if (!proj) return;
      const orig = proj.files.find(f => f.id === fileId);
      if (!orig) return;
      const parts = orig.name.split('.');
      const ext = parts.length > 1 ? '.' + parts.pop() : '';
      const copy = { id: uid(), name: parts.join('.') + '_copy' + ext, lang: orig.lang, content: orig.content };
      proj.files.push(copy);
      s.activeFileId = copy.id;
      this.save(s);
      return copy;
    },

    getAllProjects() {
      return this.getStore().projects;
    },

    langFromName,
    langBadgeClass,
    langEmoji
  };

  // ----------------------------------------------------------------
  // FILE TEMPLATES
  // ----------------------------------------------------------------
  function getTemplate(lang, name) {
    const templates = {
      python:     `# ${name}\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
      javascript: `// ${name}\n\nfunction main() {\n    console.log("Hello from ${name}!");\n}\n\nmain();\n`,
      html:       `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${name.replace('.html','')}</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n`,
      css:        `/* ${name} */\n\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n`,
      txt:        ``,
      bash:       `#!/bin/bash\n# ${name}\n\necho "Hello from ${name}"\n`,
      c:          `#include <stdio.h>\n\nint main() {\n    printf("Hello from ${name}!\\n");\n    return 0;\n}\n`
    };
    return templates[lang] || '';
  }

  window.Projects = Projects;
  console.log('✅ Projects file system loaded');
})();
