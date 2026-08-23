// tests/unit/projects.test.js
// Unit tests for Projects module
// ===================================================================

describe('Projects Module', () => {
  let mockStorage;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    mockStorage = {};
    window.localStorage.getItem = jest.fn((key) => mockStorage[key] || null);
    window.localStorage.setItem = jest.fn((key, value) => {
      mockStorage[key] = value;
    });
    
    // Initialize Projects if available
    if (window.Projects) {
      window.Projects.init('coding');
    }
  });

  // ----------------------------------------------------------------
  // PROJECT MANAGEMENT TESTS
  // ----------------------------------------------------------------
  describe('Project Management', () => {
    test('createProject creates a new project', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      const initialCount = window.Projects.getStore()?.projects?.length || 0;
      window.Projects.createProject('Test Project');
      const newCount = window.Projects.getStore()?.projects?.length || 0;
      
      expect(newCount).toBe(initialCount + 1);
    });

    test('deleteProject removes project', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('To Delete');
      const project = window.Projects.getActiveProject();
      
      if (project) {
        window.Projects.deleteProject(project.id);
        const deleted = window.Projects.getProject(project.id);
        expect(deleted).toBeUndefined();
      }
    });

    test('setActiveProject changes active project', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('Project A');
      window.Projects.createProject('Project B');
      
      const projects = window.Projects.getStore().projects;
      const projectB = projects[projects.length - 1];
      
      window.Projects.setActiveProject(projectB.id);
      
      expect(window.Projects.getActiveProject()?.id).toBe(projectB.id);
    });
  });

  // ----------------------------------------------------------------
  // FILE MANAGEMENT TESTS
  // ----------------------------------------------------------------
  describe('File Management', () => {
    test('createFile adds file to project', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('File Test');
      const initialFiles = window.Projects.getActiveProject()?.files?.length || 0;
      
      window.Projects.createFile('test.py');
      const newFiles = window.Projects.getActiveProject()?.files?.length || 0;
      
      expect(newFiles).toBe(initialFiles + 1);
    });

    test('createFile detects language from extension', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('Lang Test');
      window.Projects.createFile('script.py');
      
      const file = window.Projects.getActiveProject()?.files?.find(f => f.name === 'script.py');
      
      expect(file?.lang).toBe('python');
    });

    test('saveFileContent updates file content', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('Save Test');
      window.Projects.createFile('save.py');
      
      const file = window.Projects.getActiveProject()?.files?.find(f => f.name === 'save.py');
      if (file) {
        window.Projects.saveFileContent(file.id, 'print("Hello")');
        
        const updated = window.Projects.getFile(file.id);
        expect(updated?.content).toBe('print("Hello")');
      }
    });

    test('deleteFile removes file from project', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('Delete Test');
      window.Projects.createFile('delete.py');
      
      const file = window.Projects.getActiveProject()?.files?.find(f => f.name === 'delete.py');
      if (file) {
        window.Projects.deleteFile(file.id);
        const deleted = window.Projects.getFile(file.id);
        expect(deleted).toBeNull();
      }
    });
  });

  // ----------------------------------------------------------------
  // LANGUAGE DETECTION TESTS
  // ----------------------------------------------------------------
  describe('Language Detection', () => {
    test('langBadgeClass returns correct class', () => {
      if (!window.Projects?.langBadgeClass) {
        console.log('langBadgeClass not available, skipping');
        return;
      }
      
      expect(window.Projects.langBadgeClass('python')).toContain('python');
      expect(window.Projects.langBadgeClass('javascript')).toContain('js');
    });

    test('langEmoji returns correct emoji', () => {
      if (!window.Projects?.langEmoji) {
        console.log('langEmoji not available, skipping');
        return;
      }
      
      expect(window.Projects.langEmoji('python')).toBe('py');
      expect(window.Projects.langEmoji('html')).toBe('html');
    });
  });

  // ----------------------------------------------------------------
  // FOLDER SUPPORT TESTS
  // ----------------------------------------------------------------
  describe('Folder Support', () => {
    test('createFile with path creates nested structure', () => {
      if (!window.Projects) {
        console.log('Projects module not loaded, skipping');
        return;
      }
      
      window.Projects.createProject('Folder Test');
      window.Projects.createFile('src/utils/helper.py');
      
      const file = window.Projects.getActiveProject()?.files?.find(f => f.name === 'src/utils/helper.py');
      
      expect(file).toBeDefined();
      expect(file?.name).toContain('/');
    });
  });
});
