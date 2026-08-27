/**
 * Hardware-Adaptive Model Loader for EduAI
 * Automatically selects optimal model based on available hardware
 * 
 * Model Tiers:
 * - Tier 1 (Server): Full precision, no quantization (requires 32GB+ VRAM)
 * - Tier 2 (Workstation): Q8 quantization (requires 16GB+ VRAM)
 * - Tier 3 (Gaming PC): Q4_K_M quantization (requires 8GB+ VRAM)
 * - Tier 4 (Budget Laptop): Q4_K_M Small model (requires 4GB+ RAM)
 * - Tier 5 (Old Laptop): Q2_K quantization (requires 2GB+ RAM)
 */

class ModelLoader {
    constructor() {
        this.hardwareProfile = null;
        this.selectedModel = null;
        this.modelConfigs = this.getModelConfigs();
    }

    /**
     * Get available model configurations
     */
    getModelConfigs() {
        return {
            // Full precision for servers
            'full': {
                name: 'EduAI-tutor-f16',
                file: 'EduAI-tutor-f16.gguf',
                minVram: 32,
                minRam: 64,
                description: 'Full precision (server-grade)',
                tier: 1
            },
            // Q8 for workstations
            'q8': {
                name: 'EduAI-tutor-q8',
                file: 'EduAI-tutor-q8_0.gguf',
                minVram: 16,
                minRam: 32,
                description: 'Q8 quantization (workstation)',
                tier: 2
            },
            // Q4_K_M for gaming PCs
            'q4': {
                name: 'EduAI-tutor-q4',
                file: 'EduAI-tutor-q4_k_m.gguf',
                minVram: 8,
                minRam: 16,
                description: 'Q4_K_M quantization (gaming PC)',
                tier: 3
            },
            // Q4_K_M Small for budget laptops
            'q4-small': {
                name: 'EduAI-tutor-e4b-q4',
                file: 'EduAI-tutor-e4b-q4_k_m.gguf',
                minVram: 4,
                minRam: 8,
                description: 'E4B Q4_K_M (budget laptop)',
                tier: 4
            },
            // Q2_K for old laptops
            'q2': {
                name: 'EduAI-tutor-e4b-q2',
                file: 'EduAI-tutor-e4b-q2_k.gguf',
                minVram: 2,
                minRam: 4,
                description: 'E4B Q2_K (old laptop)',
                tier: 5
            }
        };
    }

    /**
     * Detect hardware capabilities
     */
    async detectHardware() {
        const profile = {
            // GPU info
            gpu: {
                available: false,
                vram: 0,
                name: 'Unknown',
                vendor: 'Unknown'
            },
            // System memory
            memory: {
                total: 0,
                available: 0
            },
            // CPU info
            cpu: {
                cores: 1,
                performance: 'unknown'
            },
            // Browser capabilities (for WebLLM)
            browser: {
                webgpu: false,
                wasm: false,
                sharedArrayBuffer: false
            },
            // Overall tier
            tier: 5,
            tierName: 'Minimal'
        };

        // Detect WebGPU support (for browser inference)
        if (navigator.gpu) {
            try {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    profile.browser.webgpu = true;
                    const info = await adapter.requestAdapterInfo();
                    profile.gpu.vendor = info.vendor || 'Unknown';
                    profile.gpu.name = info.description || 'WebGPU Device';
                    // WebGPU doesn't expose VRAM directly, estimate from memory
                    profile.gpu.vram = 4; // Conservative estimate
                    profile.gpu.available = true;
                }
            } catch (e) {
                console.warn('WebGPU detection failed:', e);
            }
        }

        // Detect system memory
        if (navigator.deviceMemory) {
            profile.memory.total = navigator.deviceMemory;
            profile.memory.available = navigator.deviceMemory * 0.7; // Estimate available
        }

        // Detect CPU cores
        if (navigator.hardwareConcurrency) {
            profile.cpu.cores = navigator.hardwareConcurrency;
            // Estimate CPU performance based on cores
            if (profile.cpu.cores >= 8) {
                profile.cpu.performance = 'high';
            } else if (profile.cpu.cores >= 4) {
                profile.cpu.performance = 'medium';
            } else {
                profile.cpu.performance = 'low';
            }
        }

        // Check for SharedArrayBuffer (required for some WASM SIMD)
        try {
            new SharedArrayBuffer(1024);
            profile.browser.sharedArrayBuffer = true;
        } catch (e) {
            profile.browser.sharedArrayBuffer = false;
        }

        // Check for WebAssembly
        profile.browser.wasm = typeof WebAssembly !== 'undefined';

        // Determine overall tier
        profile.tier = this.calculateTier(profile);
        profile.tierName = this.getTierName(profile.tier);

        this.hardwareProfile = profile;
        return profile;
    }

    /**
     * Calculate hardware tier
     */
    calculateTier(profile) {
        // If we have WebGPU with good memory, higher tier
        if (profile.browser.webgpu && profile.memory.total >= 16) {
            return 2; // Workstation
        }
        
        // Gaming PC tier
        if (profile.browser.webgpu && profile.memory.total >= 8) {
            return 3;
        }
        
        // Budget laptop tier
        if (profile.memory.total >= 4) {
            return 4;
        }
        
        // Old laptop tier
        return 5;
    }

    /**
     * Get tier name
     */
    getTierName(tier) {
        const names = {
            1: 'Server',
            2: 'Workstation',
            3: 'Gaming PC',
            4: 'Budget Laptop',
            5: 'Old Laptop'
        };
        return names[tier] || 'Unknown';
    }

    /**
     * Select optimal model for current hardware
     */
    selectModel() {
        if (!this.hardwareProfile) {
            console.warn('Hardware not detected. Run detectHardware() first.');
            return this.modelConfigs['q4-small']; // Default to safe option
        }

        const tier = this.hardwareProfile.tier;
        
        // Select model based on tier
        const tierToModel = {
            1: 'full',
            2: 'q8',
            3: 'q4',
            4: 'q4-small',
            5: 'q2'
        };

        const modelKey = tierToModel[tier] || 'q4-small';
        this.selectedModel = this.modelConfigs[modelKey];
        
        console.log(`Selected model: ${this.selectedModel.name} (${this.selectedModel.description})`);
        return this.selectedModel;
    }

    /**
     * Get recommended Ollama command
     */
    getOllamaCommand() {
        if (!this.selectedModel) {
            this.selectModel();
        }

        return {
            pull: `ollama pull ${this.selectedModel.name}`,
            run: `ollama run ${this.selectedModel.name}`,
            modelfile: this.generateModelfile()
        };
    }

    /**
     * Generate Modelfile for Ollama
     */
    generateModelfile() {
        if (!this.selectedModel) {
            this.selectModel();
        }

        const contextSize = this.getContextSize();
        
        return `FROM ./${this.selectedModel.file}
TEMPLATE """{{ .System }}

{{ .Prompt }}"""
PARAMETER temperature 0.7
PARAMETER num_ctx ${contextSize}
SYSTEM You are a patient educational tutor. Explain clearly, use examples, and check understanding.`;
    }

    /**
     * Get optimal context size based on hardware
     */
    getContextSize() {
        if (!this.hardwareProfile) {
            return 2048; // Safe default
        }

        const tier = this.hardwareProfile.tier;
        
        const contextSizes = {
            1: 32768,  // Server: 32K context
            2: 16384,  // Workstation: 16K context
            3: 8192,   // Gaming PC: 8K context
            4: 4096,   // Budget laptop: 4K context
            5: 2048    // Old laptop: 2K context
        };

        return contextSizes[tier] || 2048;
    }

    /**
     * Get hardware report for display
     */
    getHardwareReport() {
        if (!this.hardwareProfile) {
            return 'Hardware not detected. Run detectHardware() first.';
        }

        const p = this.hardwareProfile;
        
        return `
# Hardware Profile

## Detected Hardware
- **Tier**: ${p.tierName} (Tier ${p.tier})
- **System Memory**: ${p.memory.total} GB
- **CPU Cores**: ${p.cpu.cores} (${p.cpu.performance} performance)

## Browser Capabilities
- **WebGPU**: ${p.browser.webgpu ? 'Yes' : 'No'}
- **WebAssembly**: ${p.browser.wasm ? 'Yes' : 'No'}
- **SharedArrayBuffer**: ${p.browser.sharedArrayBuffer ? 'Yes' : 'No'}

## Recommended Model
- **Model**: ${this.selectedModel?.name || 'Not selected'}
- **Quantization**: ${this.selectedModel?.description || 'N/A'}
- **Context Size**: ${this.getContextSize()} tokens

## Instructions for Server Deployment

### Option 1: Use Ollama (Recommended)
\`\`\`bash
${this.getOllamaCommand().pull}
${this.getOllamaCommand().run}
\`\`\`

### Option 2: Create Custom Model
Save this as \`Modelfile\`:
\`\`\`
${this.generateModelfile()}
\`\`\`

Then run:
\`\`\`bash
ollama create EduAI-tutor -f Modelfile
ollama run EduAI-tutor
\`\`\`
`;
    }

    /**
     * Check if hardware supports a specific model
     */
    canRunModel(modelKey) {
        const model = this.modelConfigs[modelKey];
        if (!model) return false;

        if (!this.hardwareProfile) return true; // Assume yes if not detected

        // Check RAM requirement
        if (this.hardwareProfile.memory.total < model.minRam) {
            return false;
        }

        // Check VRAM requirement (if GPU available)
        if (this.hardwareProfile.gpu.available && 
            this.hardwareProfile.gpu.vram < model.minVram) {
            return false;
        }

        return true;
    }

    /**
     * Get all compatible models
     */
    getCompatibleModels() {
        if (!this.hardwareProfile) {
            return Object.values(this.modelConfigs);
        }

        return Object.entries(this.modelConfigs)
            .filter(([key, model]) => this.canRunModel(key))
            .map(([key, model]) => model);
    }
}

// Export for use in EduAI
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModelLoader };
}

// Also make available globally
if (typeof window !== 'undefined') {
    window.ModelLoader = ModelLoader;
}
