# ShqipAI Fine-Tuning Guide (Complete Beginner Edition)

## What You Need (All Free!)

1. **Kaggle Account** - kaggle.com (free)
2. **Hugging Face Account** - huggingface.co (free)
3. **Hugging Face Token** - Get from huggingface.co/settings/tokens

---

## Model Selection: Gemma 4 E4B

**Why E4B?**
- Runs on budget laptops (MacBook Air, T4 GPU, older hardware)
- Supports audio input (speech recognition)
- 128K context window
- **Beats Gemma 3 27B on benchmarks**
- Perfect for ShqipAI's target users

**Benchmarks:**
- E4B outperforms Gemma 3 27B on reasoning
- Handles OCR, image grounding, coding well
- Designed for edge deployment

---

## Your Hardware Resources

| Resource | Time Available | Best Use |
|----------|---------------|----------|
| **T4 x2** | 30 hours | **MAIN TRAINING (Gemma 4 E4B)** |
| **P100** | 30 hours | Data preparation |
| **TPU v5e8** | 20 hours | (Not needed for E4B) |
| **RTX Pro 6000** | 9 hours | Alternative (Lightning AI) |

## Recommended Strategy

```
P100 (30 min)   -->  Prepare free training data
T4 x2 (4 hours) -->  Train Gemma 4 E4B with Unsloth (2x faster!)
T4 (1 hour)     -->  Convert to GGUF (or use Unsloth's built-in export)
```

**Why Unsloth?**
- **2x faster** training than standard methods
- **70% less memory** usage
- Works perfectly on **T4 GPU**
- Direct GGUF export for Ollama

---

## Maximum Quality Training Settings

| Setting | Value | Why |
|---------|-------|-----|
| **Epochs** | 5 | More learning passes = smarter model |
| **Learning Rate** | 2e-4 | Unsloth optimal rate |
| **Warmup** | 10% | Smooth start, prevents instability |
| **LR Schedule** | Cosine | Better convergence |
| **Batch Size** | 2 | Fits in T4 memory |
| **Gradient Accumulation** | 8 | Effective batch = 16 |
| **LoRA Rank** | 64 | Maximum capacity = better learning |
| **Max Length** | 2048 | Full context for tutoring |

---

## Step-by-Step Instructions

### STEP 1: Get Hugging Face Token

1. Go to **huggingface.co**
2. Sign up / Log in
3. Click your profile picture > **Settings**
4. Click **Access Tokens** on the left
5. Click **Create new token**
6. Name it: `shqipai-training`
7. Select **Read** permission
8. Click **Generate token**
9. **COPY THE TOKEN** - you'll need it!

### STEP 2: Prepare Training Data (P100)

1. Go to **kaggle.com**
2. Click **Create** > **New Notebook**
3. Click **Settings** (gear icon) on right
4. Set **Accelerator** to **GPU P100**
5. Click **File** > **Import Notebook**
6. Upload: `phase1-data-prep.ipynb`
7. Click **Run All**
8. Wait ~30 minutes
9. Download `educational_data.jsonl` from Output panel

### STEP 3: Train Gemma 4 E4B with Unsloth (MAXIMUM QUALITY)

1. Create new Kaggle notebook
2. **Settings** > **Accelerator** > **GPU T4 x2**
3. **File** > **Import Notebook**
4. Upload: `phase2-e4b-unsloth.ipynb`
5. Upload your `educational_data.jsonl` (Add Data > Upload)
6. Edit the notebook: Replace `YOUR_HUGGING_FACE_TOKEN_HERE` with your token
7. Click **Run All**
8. **WAIT ~4 HOURS** - Unsloth is 2x faster!
9. Download `shqipai-tutor-e4b/unsloth.Q4_K_M.gguf`

### STEP 4: Convert to GGUF

1. Create new Kaggle notebook
2. **Settings** > **Accelerator** > **GPU T4 x2**
3. Upload: `phase3-convert-gguf.ipynb`
4. Upload your trained model files
5. Click **Run All**
6. Download `shqipai-tutor-q4_k_m.gguf`

### STEP 5: Use with Ollama

On your computer:

```bash
# Create Modelfile
echo 'FROM ./shqipai-tutor-q4_k_m.gguf
TEMPLATE """{{ .System }}

{{ .Prompt }}"""
PARAMETER temperature 0.7
PARAMETER num_ctx 4096
SYSTEM You are a patient educational tutor.' > Modelfile

# Create model
ollama create shqipai-tutor -f Modelfile

# Run it!
ollama run shqipai-tutor
```

---

## Files in This Folder

| File | Purpose |
|------|---------|
| `phase1-data-prep.ipynb` | Download and prepare training data |
| `phase2-e4b-unsloth.ipynb` | **Train Gemma 4 E4B with Unsloth (RECOMMENDED)** |
| `phase2-tpu-training.ipynb` | Alternative: Train larger model on TPU |
| `phase3-convert-gguf.ipynb` | Convert to GGUF format |
| `MODEL_CARD.md` | **Required documentation for competition** |

---

## How to Know It's Working

### During Training:
- Watch the **loss** number
- Starts around **1.5-2.0**
- Should decrease to **0.3-0.5**
- Lower = better learning

### After Training:
- Test with a question
- Compare to original Gemma
- Should sound more like a tutor

---

## Timeline Summary

| Day | Task | Time |
|-----|------|------|
| Day 1 | Get HF token, run Phase 1 | 1 hour |
| Day 2 | Start Phase 2 training | 30 min setup |
| Day 2-3 | Wait for training (Unsloth) | 4 hours |
| Day 3 | Test and deploy | 1 hour |

**Total active time: ~2.5 hours**
**Total waiting time: ~4 hours (2x faster with Unsloth!)**
