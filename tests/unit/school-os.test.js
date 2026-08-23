// tests/unit/school-os.test.js
// Unit tests for School Mini OS (Focus timer, unit conversion, planner, flashcards)
// ===================================================================

describe('School Mini OS Module', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="schoolOsBtn"></div>
      <div id="openSchoolOsSidebarBtn"></div>
      <div id="studentPortalBtn"></div>
    `;
    require('../../js/school-os.js');
  });

  test('SchoolOS attaches to window object', () => {
    expect(window.SchoolOS).toBeDefined();
    expect(typeof window.SchoolOS.open).toBe('function');
    expect(typeof window.SchoolOS.close).toBe('function');
    expect(typeof window.SchoolOS.switchTab).toBe('function');
  });

  test('SchoolOS.open creates and displays the modal overlay', () => {
    window.SchoolOS.open();
    const overlay = document.getElementById('schoolOsModalOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');
  });

  test('SchoolOS.close hides the modal overlay', () => {
    window.SchoolOS.open();
    const overlay = document.getElementById('schoolOsModalOverlay');
    expect(overlay.style.display).toBe('flex');

    window.SchoolOS.close();
    expect(overlay.style.display).toBe('none');
  });

  test('SchoolOS tab switching updates active tab views', () => {
    window.SchoolOS.open('scratchpad');
    const scratchpadView = document.getElementById('os-app-scratchpad');
    expect(scratchpadView.classList.contains('active')).toBe(true);

    window.SchoolOS.switchTab('flashcards');
    const flashcardsView = document.getElementById('os-app-flashcards');
    expect(flashcardsView.classList.contains('active')).toBe(true);
    expect(scratchpadView.classList.contains('active')).toBe(false);
  });

  test('Scratchpad persists content to localStorage', () => {
    window.SchoolOS.open('scratchpad');
    const textarea = document.getElementById('osScratchpadText');
    expect(textarea).not.toBeNull();

    textarea.value = 'My study formula: E = mc^2';
    textarea.dispatchEvent(new Event('input'));

    expect(localStorage.getItem('schoolos_scratchpad_v1')).toBe('My study formula: E = mc^2');
  });
});
