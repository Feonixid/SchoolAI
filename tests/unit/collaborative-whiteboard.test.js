describe('Collaborative Class Whiteboard & Annotation Studio', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="openWhiteboardSidebarBtn"></div>
    `;
    require('../../js/collaborative-whiteboard.js');
  });

  test('CollaborativeWhiteboard attaches to window and opens/closes correctly', () => {
    expect(window.CollaborativeWhiteboard).toBeDefined();
    expect(typeof window.CollaborativeWhiteboard.open).toBe('function');
    expect(typeof window.CollaborativeWhiteboard.close).toBe('function');

    window.CollaborativeWhiteboard.open();
    const overlay = document.getElementById('whiteboardOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const canvas = document.getElementById('whiteboardCanvas');
    expect(canvas).not.toBeNull();

    window.CollaborativeWhiteboard.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Tool selection and grid toggle operate as expected', () => {
    window.CollaborativeWhiteboard.open();
    const lineBtn = document.querySelector('.whiteboard-tool-btn[data-tool="line"]');
    expect(lineBtn).not.toBeNull();
    lineBtn.click();
    expect(lineBtn.classList.contains('active')).toBe(true);

    const gridBtn = document.getElementById('wbGridToggleBtn');
    expect(gridBtn).not.toBeNull();
    gridBtn.click();
    expect(gridBtn.textContent).toContain('Rrjeta: Off');

    window.CollaborativeWhiteboard.close();
  });
});
