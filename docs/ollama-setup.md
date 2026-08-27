# Ollama Setup Guide for EduAI

This guide covers setting up Ollama with optimal settings for EduAI, including KV cache compression for memory efficiency.

## Prerequisites

1. **Install Ollama** from https://ollama.com
2. **Pull the model**: `ollama pull gemma3:4b`
3. **Verify installation**: `ollama list`

## KV Cache Compression

The KV (Key-Value) cache stores attention computations for faster generation. Enabling compression reduces memory usage significantly.

### Available Options

| Setting | Memory Usage | Quality Impact | Recommended For |
|---------|--------------|----------------|-----------------|
| `f16` (default) | 100% | None | Maximum quality |
| `q8_0` | ~50% | Minimal | **Recommended for most users** |
| `q4_0` | ~25% | Noticeable at high context | Limited VRAM |

### Windows Setup (PowerShell)

```powershell
# Set KV cache to 8-bit quantization (recommended)
setx OLLAMA_KV_CACHE_TYPE "q8_0"

# Enable Flash Attention for additional speedup
setx OLLAMA_FLASH_ATTENTION "1"

# Set context window (adjust based on VRAM)
# 8GB VRAM: 8192, 16GB VRAM: 16384, 32GB+ VRAM: 32768
setx OLLAMA_CONTEXT_LENGTH "8192"
```

**Important**: After setting environment variables, restart Ollama:
1. Close any running Ollama processes (system tray)
2. Restart from Start Menu or run `ollama serve`

### Linux/macOS Setup

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
export OLLAMA_KV_CACHE_TYPE="q8_0"
export OLLAMA_FLASH_ATTENTION="1"
export OLLAMA_CONTEXT_LENGTH="8192"
```

Then restart Ollama:
```bash
ollama stop
ollama serve
```

## Verify Configuration

Check if settings are applied:

```bash
# Windows (PowerShell)
ollama show --model gemma3:4b --system

# Or check environment
echo $env:OLLAMA_KV_CACHE_TYPE
```

## Memory Requirements

With `q8_0` KV cache compression:

| Model | Context | Approx. VRAM |
|-------|---------|--------------|
| gemma3:4b | 4K | ~3GB |
| gemma3:4b | 8K | ~4GB |
| gemma3:4b | 16K | ~6GB |
| gemma3:4b | 32K | ~10GB |

## Troubleshooting

### "Model not found" Error
```bash
ollama pull gemma3:4b
```

### Slow Response Times
- Enable Flash Attention: `setx OLLAMA_FLASH_ATTENTION "1"`
- Reduce context length if VRAM is limited

### Quality Degradation
- If using `q4_0`, switch to `q8_0` for better quality
- Ensure model is properly loaded: `ollama run gemma3:4b ""`

## Future: TurboQuant

TurboQuant is a new algorithm achieving near-optimal compression (3-bit keys, 2-bit values) with virtually no quality loss. It's currently being integrated into llama.cpp and will be available in Ollama in a future release.

Track progress: https://github.com/ggml-org/llama.cpp/discussions/20969

When available, expected usage:
```powershell
setx OLLAMA_KV_CACHE_TYPE "tq3"  # TurboQuant 3-bit
```

## Additional Resources

- [Ollama Documentation](https://docs.ollama.com)
- [Ollama FAQ - KV Cache](https://docs.ollama.com/faq)
- [TurboQuant Paper](https://arxiv.org/abs/2504.19874)
