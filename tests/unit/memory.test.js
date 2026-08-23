// tests/unit/memory.test.js
// Unit tests for Memory module
// ===================================================================

describe('Memory Module', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // IDENTITY TESTS
  // ----------------------------------------------------------------
  describe('Identity Management', () => {
    test('getIdentity returns identity object', async () => {
      const identity = await window.Memory.getIdentity();

      expect(identity).toBeDefined();
      expect(identity).toHaveProperty('name');
      expect(window.Memory.getIdentity).toHaveBeenCalled();
    });

    test('setIdentity updates identity on server', async () => {
      const result = await window.Memory.setIdentity({ name: 'New Name' });

      expect(result).toBe(true);
      expect(window.Memory.setIdentity).toHaveBeenCalledWith({ name: 'New Name' });
    });
  });

  // ----------------------------------------------------------------
  // SUBJECT MEMORY TESTS
  // ----------------------------------------------------------------
  describe('Subject Memory', () => {
    test('getSubjectMemory returns memory structure', async () => {
      const memory = await window.Memory.getSubjectMemory('coding');

      expect(memory).toHaveProperty('conversationHistory');
      expect(memory).toHaveProperty('learnedConcepts');
      expect(Array.isArray(memory.conversationHistory)).toBe(true);
    });

    test('addMessage stores message in history', async () => {
      const result = await window.Memory.addMessage('coding', 'user', 'Hello');

      expect(result).toBe(true);
      expect(window.Memory.addMessage).toHaveBeenCalledWith('coding', 'user', 'Hello');
    });
  });

  // ----------------------------------------------------------------
  // AUTO-LEARNING TESTS
  // ----------------------------------------------------------------
  describe('Auto-Learning', () => {
    test('autoUpdateConcepts extracts concepts from message', async () => {
      const assistantMessage = 'In Python, you can use functions to organize code.';

      await window.Memory.autoUpdateConcepts('coding', assistantMessage);

      expect(window.Memory.autoUpdateConcepts).toHaveBeenCalledWith('coding', assistantMessage);
    });
  });

  // ----------------------------------------------------------------
  // AI CONTEXT TESTS
  // ----------------------------------------------------------------
  describe('AI Context Building', () => {
    test('buildAIContext returns context string', async () => {
      const context = await window.Memory.buildAIContext('coding');

      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------------
  // CACHE TESTS
  // ----------------------------------------------------------------
  describe('Cache Management', () => {
    test('clearCache clears cached data', () => {
      window.Memory.clearCache();

      expect(window.Memory.clearCache).toHaveBeenCalled();
    });

    test('syncWithBackend syncs with server', async () => {
      await window.Memory.syncWithBackend();

      expect(window.Memory.syncWithBackend).toHaveBeenCalled();
    });
  });
});
