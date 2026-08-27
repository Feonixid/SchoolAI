// js/hardware-profile.js
// ===================================================================
// HARDWARE DETECTION & PERFORMANCE PROFILING
// Auto-detects CPU, RAM, GPU and recommends optimal settings
// ===================================================================

(function () {
  'use strict';

  // Performance profiles configuration
  const PROFILES = {
    ultra: {
      name: 'Ultra',
      description: 'Maximum performance for high-end systems',
      minCores: 16,
      minMemory: 32,
      model: 'gemma3:12b',
      contextLength: 32768,
      kvCacheType: 'f16',
      numThreads: 16,
      numBatch: 512,
      streaming: true,
      docker: true,
      analytics: true,
      animations: true,
      maxHistory: 100
    },
    high: {
      name: 'High',
      description: 'Great performance for powerful systems',
      minCores: 8,
      minMemory: 16,
      model: 'gemma3:8b',
      contextLength: 16384,
      kvCacheType: 'q8_0',
      numThreads: 8,
      numBatch: 512,
      streaming: true,
      docker: true,
      analytics: true,
      animations: true,
      maxHistory: 50
    },
    medium: {
      name: 'Medium',
      description: 'Balanced performance for mid-range systems (e.g. Core i5)',
      minCores: 4,
      minMemory: 8,
      model: 'gemma3:4b',
      contextLength: 8192,
      kvCacheType: 'q8_0',
      numThreads: 4,
      numBatch: 256,
      streaming: true,
      docker: false,
      analytics: true,
      animations: true,
      maxHistory: 30
    },
    low: {
      name: 'Low',
      description: 'Optimized for budget systems',
      minCores: 2,
      minMemory: 4,
      model: 'gemma3:2b',
      contextLength: 4096,
      kvCacheType: 'q4_0',
      numThreads: 2,
      numBatch: 128,
      streaming: false,
      docker: false,
      analytics: false,
      animations: false,
      maxHistory: 15
    },
    minimal: {
      name: 'Minimal',
      description: 'Essential features for low-end devices',
      minCores: 1,
      minMemory: 2,
      model: 'gemma3:1b',
      contextLength: 2048,
      kvCacheType: 'q4_0',
      numThreads: 1,
      numBatch: 64,
      streaming: false,
      docker: false,
      analytics: false,
      animations: false,
      maxHistory: 10
    }
  };

  // Detected hardware info
  let hardwareInfo = {
    cpu: { cores: 0, tier: 'unknown', model: 'Unknown' },
    memory: { gb: 0, tier: 'unknown' },
    gpu: { available: false, vendor: 'Unknown', renderer: 'Unknown', vram: 0 },
    platform: { type: 'unknown', os: 'Unknown' },
    profile: null,
    customSettings: null
  };

  // Detect CPU information
  function detectCPU() {
    const cores = navigator.hardwareConcurrency || 2;
    
    // Estimate CPU tier based on cores
    let tier = 'minimal';
    if (cores >= 16) tier = 'ultra';
    else if (cores >= 8) tier = 'high';
    else if (cores >= 4) tier = 'medium';
    else if (cores >= 2) tier = 'low';

    // Try to get more specific CPU info from user agent
    const ua = navigator.userAgent;
    let model = 'Unknown CPU';
    
    if (ua.includes('Intel')) {
      if (cores >= 16) model = 'Intel Core i9 / Xeon';
      else if (cores >= 8) model = 'Intel Core i7';
      else if (cores >= 4) model = 'Intel Core i5';
      else if (cores >= 2) model = 'Intel Core i3 / Laptop CPU';
      else model = 'Intel Celeron / Pentium';
    } else if (ua.includes('AMD')) {
      if (cores >= 16) model = 'AMD Ryzen 9 / Threadripper';
      else if (cores >= 8) model = 'AMD Ryzen 7';
      else if (cores >= 4) model = 'AMD Ryzen 5';
      else if (cores >= 2) model = 'AMD Ryzen 3 / Athlon';
      else model = 'AMD A-Series';
    }

    return { cores, tier, model };
  }

  // Detect memory
  function detectMemory() {
    const gb = navigator.deviceMemory || 4;
    
    let tier = 'minimal';
    if (gb >= 32) tier = 'ultra';
    else if (gb >= 16) tier = 'high';
    else if (gb >= 8) tier = 'medium';
    else if (gb >= 4) tier = 'low';

    return { gb, tier };
  }

  // Detect GPU via WebGL
  async function detectGPU() {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          resolve({ available: false, vendor: 'None', renderer: 'None', vram: 0 });
          return;
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        let vendor = 'Unknown';
        let renderer = 'Unknown';
        let vram = 0;

        if (debugInfo) {
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
          
          // Estimate VRAM from renderer string
          if (renderer.includes('RTX 4090') || renderer.includes('RX 7900')) vram = 24;
          else if (renderer.includes('RTX 4080') || renderer.includes('RTX 3090')) vram = 16;
          else if (renderer.includes('RTX 3080') || renderer.includes('RTX 4070')) vram = 10;
          else if (renderer.includes('RTX 3070') || renderer.includes('RTX 4060')) vram = 8;
          else if (renderer.includes('RTX 3060') || renderer.includes('GTX 1080')) vram = 6;
          else if (renderer.includes('GTX 1060') || renderer.includes('GTX 1650')) vram = 4;
          else if (renderer.includes('Intel')) vram = 2; // Integrated
          else vram = 4; // Default assumption
        }

        resolve({ available: true, vendor, renderer, vram });
      } catch (e) {
        resolve({ available: false, vendor: 'Unknown', renderer: 'Unknown', vram: 0 });
      }
    });
  }

  // Detect platform type
  function detectPlatform() {
    const ua = navigator.userAgent;
    let type = 'desktop';
    let os = 'Unknown';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    // Detect device type
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
      type = 'mobile';
    } else if (ua.includes('Tablet') || ua.includes('iPad')) {
      type = 'tablet';
    } else if (ua.includes('Laptop') || (os === 'macOS' && navigator.maxTouchPoints > 0)) {
      type = 'laptop';
    } else {
      type = 'desktop';
    }

    // Check for touch capability
    const hasTouch = navigator.maxTouchPoints > 0;
    if (hasTouch && type === 'desktop') {
      type = 'laptop'; // Touch desktop likely a laptop
    }

    return { type, os };
  }

  // Calculate recommended profile
  function calculateRecommendedProfile(cpu, memory, gpu) {
    // Score each component
    const cpuScore = cpu.tier === 'ultra' ? 5 : cpu.tier === 'high' ? 4 : cpu.tier === 'medium' ? 3 : cpu.tier === 'low' ? 2 : 1;
    const memScore = memory.tier === 'ultra' ? 5 : memory.tier === 'high' ? 4 : memory.tier === 'medium' ? 3 : memory.tier === 'low' ? 2 : 1;
    const gpuScore = gpu.available ? (gpu.vram >= 8 ? 4 : gpu.vram >= 4 ? 3 : gpu.vram >= 2 ? 2 : 1) : 1;

    // Average score
    const avgScore = (cpuScore + memScore + gpuScore) / 3;

    // Determine profile
    if (avgScore >= 4.5) return 'ultra';
    if (avgScore >= 3.5) return 'high';
    if (avgScore >= 2.5) return 'medium';
    if (avgScore >= 1.5) return 'low';
    return 'minimal';
  }

  // Main detection function
  async function detect() {
    console.log('Detecting hardware...');

    const cpu = detectCPU();
    const memory = detectMemory();
    const gpu = await detectGPU();
    const platform = detectPlatform();

    const profile = calculateRecommendedProfile(cpu, memory, gpu);

    hardwareInfo = {
      cpu,
      memory,
      gpu,
      platform,
      profile,
      customSettings: null
    };

    // Save to localStorage
    localStorage.setItem('shqipai_hardware', JSON.stringify(hardwareInfo));
    
    console.log('Hardware detected:', hardwareInfo);
    return hardwareInfo;
  }

  // Get current profile settings
  function getProfileSettings() {
    const profileName = hardwareInfo.customSettings?.profile || hardwareInfo.profile || 'medium';
    const baseProfile = PROFILES[profileName] || PROFILES.medium;
    
    // Allow overrides
    return {
      ...baseProfile,
      ...hardwareInfo.customSettings,
      profileName
    };
  }

  // Set custom settings
  function setCustomSettings(settings) {
    hardwareInfo.customSettings = {
      ...hardwareInfo.customSettings,
      ...settings
    };
    localStorage.setItem('shqipai_hardware', JSON.stringify(hardwareInfo));
  }

  // Clear custom settings
  function clearCustomSettings() {
    hardwareInfo.customSettings = null;
    localStorage.setItem('shqipai_hardware', JSON.stringify(hardwareInfo));
  }

  // Get all profiles
  function getProfiles() {
    return PROFILES;
  }

  // Get hardware info
  function getHardwareInfo() {
    return hardwareInfo;
  }

  // Load saved hardware info
  function loadSaved() {
    const saved = localStorage.getItem('shqipai_hardware');
    if (saved) {
      try {
        hardwareInfo = JSON.parse(saved);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // Export
  window.HardwareProfile = {
    detect,
    getHardwareInfo,
    getProfileSettings,
    setCustomSettings,
    clearCustomSettings,
    getProfiles,
    loadSaved,
    get PROFILES() { return PROFILES; }
  };

  console.log('Hardware Profile module loaded');
})();
