# Gemma 4 Good Hackathon Submission Checklist

## Track Targets

| Track | Prize | Status | Notes |
|-------|-------|--------|-------|
| **Ollama** | $10,000 | Ready | Primary - Built on Ollama, showcases local Gemma 4 |
| **WebLLM** | $10,000 | Ready | Zero-install browser inference via WebGPU |
| **Future of Education** | $10,000 | Ready | AI tutor that adapts to individual learners |
| **Digital Equity** | $10,000 | Ready | 10 languages, accessibility, offline-first |
| **Unsloth** | $10,000 | In Progress | Fine-tuned pedagogical model (see fine-tuning/README.md) |
| **Main Track** | $50,000 | Ready | Strong impact story + technical depth |

---

## Fine-Tuning Roadmap (Unsloth Track)

### Hardware Available
| Resource | Time | Best Use |
|----------|------|----------|
| T4 x2 | 30 hours | **MAIN TRAINING** - Gemma 4 E4B with Unsloth |
| P100 | 30 hours | Data preparation |
| TPU v5e8 | 20 hours | (Not needed for E4B) |
| RTX Pro 6000 | 9 hours | Alternative (Lightning AI) |

### Fine-Tuning Steps
1. [ ] Get Hugging Face token (huggingface.co/settings/tokens)
2. [ ] Run `phase1-data-prep.ipynb` on P100 (~30 min)
3. [ ] Run `phase2-e4b-unsloth.ipynb` on T4 x2 (~4 hours - 2x faster!)
4. [ ] Test with Ollama
5. [ ] Upload to Hugging Face with MODEL_CARD.md

### Notebooks Ready
- `fine-tuning/kaggle-notebooks/phase1-data-prep.ipynb`
- `fine-tuning/kaggle-notebooks/phase2-e4b-unsloth.ipynb` (RECOMMENDED)
- `fine-tuning/kaggle-notebooks/phase3-convert-gguf.ipynb`
- `fine-tuning/MODEL_CARD.md` (required documentation)
- `fine-tuning/README.md` (complete beginner guide)
