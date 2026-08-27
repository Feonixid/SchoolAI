# Hardware-Adaptive Model Loader

EduAI automatically selects the optimal model based on available hardware, ensuring schools can run the AI tutor on any device.

## How It Works

### 1. Hardware Detection

When EduAI loads, it detects:
- **System Memory** (RAM)
- **GPU** (WebGPU support, VRAM estimation)
- **CPU Cores** (performance estimation)
- **Browser Capabilities** (WebGPU, WebAssembly, SharedArrayBuffer)

### 2. Tier Classification

Based on hardware, devices are classified into 5 tiers:

| Tier | Name | Requirements | Model | Context |
|------|------|--------------|-------|---------|
| **1** | Server | 32GB+ VRAM, 64GB+ RAM | Full precision (F16) | 32K |
| **2** | Workstation | 16GB+ VRAM, 32GB+ RAM | Q8 quantization | 16K |
| **3** | Gaming PC | 8GB+ VRAM, 16GB+ RAM | Q4_K_M quantization | 8K |
| **4** | Budget Laptop | 4GB+ RAM | E4B Q4_K_M | 4K |
| **5** | Old Laptop | 2GB+ RAM | E4B Q2_K | 2K |

### 3. Model Selection

The system automatically selects the best model:

```javascript
const loader = new ModelLoader();
const profile = await loader.detectHardware();
const model = loader.selectModel();
// Returns: { name, file, minVram, minRam, description, tier }
```

## Model Files

### For Schools with Servers

**Full Precision (F16)**
- File: `EduAI-tutor-f16.gguf`
- Size: ~18GB
- Quality: Maximum
- Requires: Server with 32GB+ VRAM

**Q8 Quantization**
- File: `EduAI-tutor-q8_0.gguf`
- Size: ~9GB
- Quality: Near-maximum
- Requires: Workstation with 16GB+ VRAM

### For Schools with Gaming PCs

**Q4_K_M Quantization**
- File: `EduAI-tutor-q4_k_m.gguf`
- Size: ~5GB
- Quality: High
- Requires: Gaming PC with 8GB+ VRAM

### For Schools with Budget Laptops

**E4B Q4_K_M** (Recommended for most schools)
- File: `EduAI-tutor-e4b-q4_k_m.gguf`
- Size: ~2.5GB
- Quality: Good
- Requires: Any laptop with 4GB+ RAM

**E4B Q2_K** (For very old hardware)
- File: `EduAI-tutor-e4b-q2_k.gguf`
- Size: ~1.5GB
- Quality: Acceptable
- Requires: Old laptop with 2GB+ RAM

## Deployment Guide

### Option 1: Automatic (Recommended)

EduAI automatically selects the model when you first load it:

1. Install Ollama: https://ollama.ai
2. Open EduAI in browser
3. The system detects hardware and recommends model
4. Follow the instructions shown

### Option 2: Manual Selection

If you know your hardware:

**For Server (32GB+ VRAM):**
```bash
ollama pull EduAI-tutor-f16
ollama run EduAI-tutor-f16
```

**For Workstation (16GB+ VRAM):**
```bash
ollama pull EduAI-tutor-q8
ollama run EduAI-tutor-q8
```

**For Gaming PC (8GB+ VRAM):**
```bash
ollama pull EduAI-tutor-q4
ollama run EduAI-tutor-q4
```

**For Budget Laptop (4GB+ RAM):**
```bash
ollama pull EduAI-tutor-e4b-q4
ollama run EduAI-tutor-e4b-q4
```

**For Old Laptop (2GB+ RAM):**
```bash
ollama pull EduAI-tutor-e4b-q2
ollama run EduAI-tutor-e4b-q2
```

### Option 3: Custom Modelfile

Create a `Modelfile` for your hardware:

```bash
# Download the appropriate GGUF file
wget https://huggingface.co/YOUR_USERNAME/EduAI-tutor/resolve/main/EduAI-tutor-e4b-q4_k_m.gguf

# Create Modelfile
cat > Modelfile << EOF
FROM ./EduAI-tutor-e4b-q4_k_m.gguf
TEMPLATE """{{ .System }}

{{ .Prompt }}"""
PARAMETER temperature 0.7
PARAMETER num_ctx 4096
SYSTEM You are a patient educational tutor.
EOF

# Create and run
ollama create EduAI-tutor -f Modelfile
ollama run EduAI-tutor
```

## Quality vs Performance

| Model | Quality Score | Speed (tokens/sec) | Memory Usage |
|-------|---------------|-------------------|--------------|
| F16 | 100% | 5-10 | 18GB |
| Q8 | 98% | 10-20 | 9GB |
| Q4_K_M | 95% | 20-40 | 5GB |
| E4B Q4_K_M | 90% | 30-60 | 2.5GB |
| E4B Q2_K | 80% | 40-80 | 1.5GB |

## School Deployment Scenarios

### Scenario 1: Rural School with Old Laptops

**Hardware**: Old laptops with 2-4GB RAM
**Model**: E4B Q2_K or E4B Q4_K_M
**Performance**: 40-60 tokens/sec
**Quality**: Good enough for tutoring

### Scenario 2: Urban School with Computer Lab

**Hardware**: Desktop PCs with 8GB RAM
**Model**: Q4_K_M
**Performance**: 20-40 tokens/sec
**Quality**: High quality tutoring

### Scenario 3: Private School with Server

**Hardware**: Dedicated server with GPU
**Model**: Q8 or F16
**Performance**: 5-20 tokens/sec
**Quality**: Maximum quality

### Scenario 4: Student's Home Computer

**Hardware**: Varies (budget to gaming)
**Model**: Auto-detected
**Performance**: Varies
**Quality**: Optimized for hardware

## Offline Deployment

All models work **completely offline** after download:

1. Download model once (internet required)
2. Model runs locally (no internet needed)
3. Data stays on device (privacy)

## Privacy & Security

- **No cloud processing**: All inference happens locally
- **No data collection**: Conversations never leave the device
- **No account required**: Fully anonymous usage
- **COPPA compliant**: Safe for students under 13

## Troubleshooting

### "Model not found"

Make sure you've pulled the model:
```bash
ollama pull EduAI-tutor-e4b-q4
```

### "Out of memory"

Try a smaller model:
```bash
ollama run EduAI-tutor-e4b-q2
```

### "Slow response"

Check if model is too large for your hardware. Use `window.modelLoader.getHardwareReport()` in browser console.

### "Quality is poor"

Try a larger model if your hardware supports it. Use `window.modelLoader.getCompatibleModels()` to see options.
