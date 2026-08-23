// js/memory.js
// ===================================================================
// AI MEMORY SYSTEM
// Persistent identity and per-subject memory for personalized AI context
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('AppState not loaded for memory module');
    return;
  }

  // API Base URL
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
    ? (window.location.protocol + '//' + window.location.hostname + ':3001')
    : window.location.origin;

  // Local cache
  let identityCache = null;
  let subjectCache = {};
  let pendingSync = false;

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
  // IDENTITY MEMORY
  // ----------------------------------------------------------------
  async function getIdentity() {
    if (identityCache) return identityCache;
    
    if (!window.Accounts?.isLoggedIn()) {
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/api/memory/identity`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      identityCache = data.identity;
      return identityCache;
    } catch (err) {
      console.warn('Could not load identity memory:', err.message);
      return null;
    }
  }

  async function setIdentity(updates) {
    if (!window.Accounts?.isLoggedIn()) return false;

    try {
      const res = await fetch(`${API_BASE}/api/memory/identity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      identityCache = data.identity;
      return true;
    } catch (err) {
      console.warn('Could not save identity memory:', err.message);
      return false;
    }
  }

  // ----------------------------------------------------------------
  // SUBJECT MEMORY
  // ----------------------------------------------------------------
  async function getSubjectMemory(subjectId) {
    const key = subjectId || state.subjects.active;
    if (!key) return null;

    if (subjectCache[key]) return subjectCache[key];

    if (!window.Accounts?.isLoggedIn()) {
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/api/memory/subject/${key}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      subjectCache[key] = data.memory;
      return subjectCache[key];
    } catch (err) {
      console.warn('Could not load subject memory:', err.message);
      return null;
    }
  }

  async function updateSubjectMemory(subjectId, updates) {
    const key = subjectId || state.subjects.active;
    if (!key) return false;

    if (!window.Accounts?.isLoggedIn()) return false;

    try {
      const res = await fetch(`${API_BASE}/api/memory/subject/${key}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      subjectCache[key] = data.memory;
      return true;
    } catch (err) {
      console.warn('Could not save subject memory:', err.message);
      return false;
    }
  }

  async function addMessage(subjectId, role, content) {
    const key = subjectId || state.subjects.active;
    if (!key) return false;

    if (!window.Accounts?.isLoggedIn()) return false;

    try {
      const res = await fetch(`${API_BASE}/api/memory/subject/${key}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, content })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Update local cache
      if (!subjectCache[key]) {
        subjectCache[key] = { conversationHistory: [], learnedConcepts: [], strugglingAreas: [], notes: [] };
      }
      subjectCache[key].conversationHistory.push({ role, content, timestamp: Date.now() });

      return true;
    } catch (err) {
      console.warn('Could not add message to memory:', err.message);
      return false;
    }
  }

  // ----------------------------------------------------------------
  // STUDENT DATA FOR AI CONTEXT
  // ----------------------------------------------------------------
  async function getStudentContext(studentId) {
    if (!window.Accounts?.isLoggedIn()) return null;

    try {
      const endpoint = studentId 
        ? `${API_BASE}/api/memory/student-context/${studentId}`
        : `${API_BASE}/api/memory/my-context`;

      const res = await fetch(endpoint, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data.context;
    } catch (err) {
      console.warn('Could not load student context:', err.message);
      return null;
    }
  }

  // ----------------------------------------------------------------
  // BUILD AI CONTEXT STRING
  // ----------------------------------------------------------------
  async function buildAIContext(subjectId) {
    const key = subjectId || state.subjects.active;
    let context = '';

    // Add identity context
    const identity = await getIdentity();
    if (identity && identity.name) {
      context += `--- USER IDENTITY ---\n`;
      context += `Name: ${identity.name}\n`;
      if (identity.gradeLevel) context += `Grade Level: ${identity.gradeLevel}\n`;
      if (identity.learningStyle) context += `Learning Style: ${identity.learningStyle}\n`;
      if (identity.strengths?.length) context += `Known Strengths: ${identity.strengths.join(', ')}\n`;
      if (identity.weaknesses?.length) context += `Areas to Work On: ${identity.weaknesses.join(', ')}\n`;
      if (identity.goals?.length) context += `Goals: ${identity.goals.join(', ')}\n`;
      context += '\n';
    }

    // Add subject memory
    const subjectMem = await getSubjectMemory(key);
    if (subjectMem) {
      context += `--- SUBJECT MEMORY (${key}) ---\n`;
      if (subjectMem.learnedConcepts?.length) {
        context += `Concepts Learned: ${subjectMem.learnedConcepts.join(', ')}\n`;
      }
      if (subjectMem.strugglingAreas?.length) {
        context += `Struggling With: ${subjectMem.strugglingAreas.join(', ')}\n`;
      }
      if (subjectMem.notes?.length) {
        context += `Notes: ${subjectMem.notes.slice(-3).join('; ')}\n`;
      }
      context += '\n';
    }

    // Add student data if in teacher mode or for self
    if (state.ui.teacherMode && state.students?.selectedId) {
      const studentData = await getStudentContext(state.students.selectedId);
      if (studentData) {
        context += formatStudentData(studentData);
      }
    }

    return context;
  }

  // Format student data for AI context
  function formatStudentData(data) {
    if (!data || !data.student) return '';

    let context = `--- STUDENT DATA ---\n`;
    context += `Student: ${data.student.name}\n`;
    if (data.student.gradeLevel) context += `Grade: ${data.student.gradeLevel}\n`;

    // Grades
    if (data.student.semesters) {
      context += `Academic Performance:\n`;
      Object.entries(data.student.semesters).forEach(([sem, grades]) => {
        const detyra = grades.detyra || [];
        if (detyra.length > 0) {
          const avg = detyra.reduce((a, b) => a + b, 0) / detyra.length;
          context += `  ${sem}: avg ${avg.toFixed(1)} (${detyra.length} assignments)\n`;
        }
      });
      if (data.student.finalAverage) {
        context += `  Final Average: ${data.student.finalAverage.toFixed(2)}\n`;
      }
    }

    // Attendance summary
    if (data.attendance?.length > 0) {
      const present = data.attendance.filter(a => a.status === 'present').length;
      const total = data.attendance.length;
      context += `Attendance: ${present}/${total} (${Math.round(present/total*100)}%)\n`;
    }

    // Behavior summary
    if (data.behavior?.length > 0) {
      const positive = data.behavior.filter(b => b.type === 'positive').length;
      const negative = data.behavior.filter(b => b.type === 'negative').length;
      context += `Behavior: ${positive} positive, ${negative} negative notes\n`;
    }

    // Gamification
    if (data.gamification) {
      context += `Level: ${data.gamification.level || 1}, Points: ${data.gamification.points || 0}\n`;
      if (data.gamification.achievements?.length) {
        context += `Achievements: ${data.gamification.achievements.length} earned\n`;
      }
    }

    // Teacher notes
    if (data.student.teacherNotes) {
      context += `Teacher Notes: ${data.student.teacherNotes.substring(0, 200)}...\n`;
    }

    context += '\n';
    return context;
  }

  // ----------------------------------------------------------------
  // SYNC WITH BACKEND
  // ----------------------------------------------------------------
  async function syncWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;

    // Load identity
    await getIdentity();

    // Load current subject memory
    if (state.subjects.active) {
      await getSubjectMemory(state.subjects.active);
    }

    console.log('Memory synced with backend');
  }

  // ----------------------------------------------------------------
  // CLEAR LOCAL CACHE
  // ----------------------------------------------------------------
  function clearCache() {
    identityCache = null;
    subjectCache = {};
  }

  // ----------------------------------------------------------------
  // GET CONVERSATION HISTORY FOR AI
  // ----------------------------------------------------------------
  async function getConversationHistory(subjectId, limit = 10) {
    const key = subjectId || state.subjects.active;
    const mem = await getSubjectMemory(key);
    
    if (!mem || !mem.conversationHistory?.length) return [];
    
    return mem.conversationHistory.slice(-limit).map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  // ----------------------------------------------------------------
  // AUTO-EXTRACT LEARNED CONCEPTS (simple heuristic)
  // ----------------------------------------------------------------
  function extractConcepts(message, role) {
    if (role !== 'assistant') return [];

    // Simple keyword extraction for concepts
    const conceptPatterns = [
      /you (now understand|learned about|know) ([^.]+)/gi,
      /concept[:\s]+([^.]+)/gi,
      /key (point|idea)[:\s]+([^.]+)/gi,
      /remember[:\s]+([^.]+)/gi
    ];

    const concepts = [];
    conceptPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        concepts.push(match[2] || match[1]);
      }
    });

    return concepts.map(c => c.trim().substring(0, 50)).filter(c => c.length > 3);
  }

  // Auto-update learned concepts after AI response
  async function autoUpdateConcepts(subjectId, message) {
    const concepts = extractConcepts(message, 'assistant');
    if (concepts.length === 0) return;

    const mem = await getSubjectMemory(subjectId);
    if (!mem) return;

    const existing = new Set(mem.learnedConcepts || []);
    concepts.forEach(c => existing.add(c));

    await updateSubjectMemory(subjectId, { learnedConcepts: Array.from(existing) });
  }

  // ----------------------------------------------------------------
  // EVENT LISTENERS
  // ----------------------------------------------------------------
  
  // Sync on login (accounts.js fires 'shqipai-login')
  window.addEventListener('shqipai-login', () => {
    syncWithBackend();
  });

  // Clear cache on logout (accounts.js fires 'shqipai-logout')
  window.addEventListener('shqipai-logout', () => {
    clearCache();
  });

  // Load subject memory on subject switch
  window.addEventListener('subjectSwitched', (e) => {
    if (e.detail && window.Accounts?.isLoggedIn()) {
      getSubjectMemory(e.detail);
    }
  });

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.Memory = {
    // Identity
    getIdentity,
    setIdentity,

    // Subject Memory
    getSubjectMemory,
    updateSubjectMemory,
    addMessage,
    getConversationHistory,

    // Student Data
    getStudentContext,

    // AI Context Building
    buildAIContext,
    formatStudentData,

    // Sync
    syncWithBackend,
    clearCache,

    // Auto-learning
    autoUpdateConcepts
  };

  // Initial sync if already logged in
  if (window.Accounts?.isLoggedIn()) {
    setTimeout(syncWithBackend, 500);
  }

  console.log('AI Memory module initialized');
})();
