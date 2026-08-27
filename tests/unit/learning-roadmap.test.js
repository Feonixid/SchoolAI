// tests/unit/learning-roadmap.test.js
// Unit tests for Visual Learning Roadmaps & Skill Trees

describe('Visual Learning Roadmaps & Skill Trees', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openRoadmapSidebarBtn"></div>
    `;
    require('../../js/learning-roadmap.js');
  });

  test('LearningRoadmap attaches to window and opens/closes correctly', () => {
    expect(window.LearningRoadmap).toBeDefined();
    expect(typeof window.LearningRoadmap.open).toBe('function');
    expect(typeof window.LearningRoadmap.close).toBe('function');

    window.LearningRoadmap.open();
    const overlay = document.getElementById('roadmapOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const treeArea = document.getElementById('roadmapTreeArea');
    expect(treeArea).not.toBeNull();
    expect(treeArea.children.length).toBeGreaterThan(0);

    window.LearningRoadmap.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Subject switching updates roadmap tree', () => {
    window.LearningRoadmap.open();
    const physBtn = document.querySelector('.roadmap-subject-btn[data-subject="physics"]');
    expect(physBtn).not.toBeNull();
    physBtn.click();

    const treeArea = document.getElementById('roadmapTreeArea');
    expect(treeArea.textContent).toContain('Fizikë');
    window.LearningRoadmap.close();
  });
});
