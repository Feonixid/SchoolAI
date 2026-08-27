// tests/unit/hardware-profile.test.js
// Verifies hardware tier classification, adaptive rendering loop factory,
// debounce scaling, feature gating, and history pruning.

describe('HardwareProfile', () => {
  let HardwareProfile;

  beforeEach(() => {
    // Reset module for a clean slate each time
    delete window.HardwareProfile;
    jest.resetModules();

    // Stub browser APIs that hardware-profile.js depends on
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 4,
      configurable: true
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 8,
      configurable: true
    });

    // Load the module (sets window.HardwareProfile)
    require('../../js/hardware-profile.js');
    HardwareProfile = window.HardwareProfile;
  });


  // --- Profile Tiers ---

  test('has all five tier definitions', () => {
    const profiles = HardwareProfile.getProfiles();
    expect(Object.keys(profiles)).toEqual(
      expect.arrayContaining(['ultra', 'high', 'medium', 'low', 'minimal'])
    );
  });

  test('each tier carries numThreads and numBatch', () => {
    const profiles = HardwareProfile.getProfiles();
    for (const [name, tier] of Object.entries(profiles)) {
      expect(tier.numThreads).toBeGreaterThan(0);
      expect(tier.numBatch).toBeGreaterThan(0);
    }
  });


  // --- Profile Settings ---

  test('getProfileSettings falls back to medium when no detection ran', () => {
    const settings = HardwareProfile.getProfileSettings();
    expect(settings.profileName).toBe('medium');
  });

  test('custom settings override the base profile', () => {
    HardwareProfile.setCustomSettings({ profile: 'low', model: 'gemma3:1b' });
    const settings = HardwareProfile.getProfileSettings();
    expect(settings.profileName).toBe('low');
    expect(settings.model).toBe('gemma3:1b');
  });

  test('clearCustomSettings reverts to defaults', () => {
    HardwareProfile.setCustomSettings({ profile: 'ultra' });
    HardwareProfile.clearCustomSettings();
    const settings = HardwareProfile.getProfileSettings();
    expect(settings.profileName).toBe('medium');
  });


  // --- Adaptive Rendering Loop ---

  test('createThrottledLoop returns start/stop/fps interface', () => {
    const loop = HardwareProfile.createThrottledLoop(() => {});
    expect(typeof loop.start).toBe('function');
    expect(typeof loop.stop).toBe('function');
    expect(loop.fps).toBeGreaterThan(0);
  });

  test('medium tier throttledLoop targets 30fps', () => {
    const loop = HardwareProfile.createThrottledLoop(() => {});
    expect(loop.fps).toBe(30);
  });

  test('low tier with animations off targets 15fps', () => {
    HardwareProfile.setCustomSettings({ profile: 'low' });
    const loop = HardwareProfile.createThrottledLoop(() => {});
    expect(loop.fps).toBe(15);
  });


  // --- Adaptive Debounce ---

  test('adaptiveDebounce returns a function', () => {
    const debounced = HardwareProfile.adaptiveDebounce(() => {});
    expect(typeof debounced).toBe('function');
  });


  // --- Feature Flags ---

  test('canRun("docker") is false on medium tier', () => {
    expect(HardwareProfile.canRun('docker')).toBe(false);
  });

  test('canRun("animations") is true on medium tier', () => {
    expect(HardwareProfile.canRun('animations')).toBe(true);
  });

  test('canRun("particles") requires 8+ cores', () => {
    expect(HardwareProfile.canRun('particles')).toBe(false);
  });

  test('canRun("heavyCanvas") is true on 4-core systems', () => {
    expect(HardwareProfile.canRun('heavyCanvas')).toBe(true);
  });


  // --- History Pruning ---

  test('pruneHistory trims messages to the tier maxHistory cap', () => {
    const longHistory = Array.from({ length: 50 }, (_, i) => ({ role: 'user', content: `msg ${i}` }));
    const pruned = HardwareProfile.pruneHistory(longHistory);
    // Medium tier cap is 30
    expect(pruned.length).toBe(30);
    expect(pruned[0].content).toBe('msg 20');
  });

  test('pruneHistory keeps short histories intact', () => {
    const shortHistory = [{ role: 'user', content: 'hello' }];
    const pruned = HardwareProfile.pruneHistory(shortHistory);
    expect(pruned.length).toBe(1);
  });


  // --- Persistence ---

  test('loadSaved returns false when nothing is stored', () => {
    localStorage.removeItem('EduAI_hardware');
    expect(HardwareProfile.loadSaved()).toBe(false);
  });

  test('loadSaved returns true and restores data from localStorage', () => {
    const fakeHw = { cpu: { cores: 8, tier: 'high' }, profile: 'high' };
    localStorage.setItem('EduAI_hardware', JSON.stringify(fakeHw));
    expect(HardwareProfile.loadSaved()).toBe(true);
    expect(HardwareProfile.getHardwareInfo().profile).toBe('high');
  });
});
