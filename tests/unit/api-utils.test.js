// tests/unit/api-utils.test.js
// Unit tests for API Utilities & StorageGuard Quota Protection

describe('API Utilities & StorageGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/api-utils.js');
  });

  test('Attaches to window with API methods and StorageGuard', () => {
    expect(window.Api).toBeDefined();
    expect(typeof window.Api.get).toBe('function');
    expect(typeof window.Api.post).toBe('function');
    expect(typeof window.Api.safeSetItem).toBe('function');
  });

  test('safeSetItem writes to localStorage normally', () => {
    const success = window.Api.safeSetItem('test_key', 'test_value');
    expect(success).toBe(true);
    expect(localStorage.getItem('test_key')).toBe('test_value');
  });

  test('StorageGuard prunes oversized lesson chats when quota exceeded', () => {
    const oversizedChat = {
      'test_chat': {
        messages: Array.from({ length: 30 }, (_, i) => ({ role: 'user', content: `Message ${i}` }))
      }
    };
    localStorage.setItem('eduai_lesson_chats', JSON.stringify(oversizedChat));

    window.Api.pruneOldStorage();

    const pruned = JSON.parse(localStorage.getItem('eduai_lesson_chats'));
    expect(pruned.test_chat.messages.length).toBe(10);
  });
});
