# ShqipAI - Educational AI Platform

**ShqipAI** is an offline-first educational AI platform powered by Gemma 4, running locally via Ollama. Designed for global use with multi-language support and hardware-adaptive performance.

## Features

- **AI Tutor**: Powered by Gemma 4 running locally via Ollama
- **Multi-Language**: 10 supported languages with AI response language control
- **Hardware-Adaptive**: Auto-optimizes based on your CPU, RAM, and GPU
- **Multimodal**: Upload photos of homework/equations for visual learning
- **Textbook RAG**: Upload PDFs and get grounded answers with citations
- **Learning Analytics**: Track progress, visualize strengths/weaknesses
- **Code Editor**: Monaco Editor with syntax highlighting
- **Cybersecurity Lab**: Docker-isolated terminal for security exercises
- **Memory System**: Persistent learning context across sessions
- **Text-to-Speech**: Read aloud AI responses in any supported language
- **Accessibility**: High contrast, dyslexia font, screen reader support
- **PWA**: Installable as a desktop or mobile app
- **Offline**: Runs completely offline after initial setup

## Quick Start

### Prerequisites

1. **Node.js** 18+ installed
2. **Ollama** from https://ollama.com
3. **Docker** (optional, for cybersecurity lab)

### Installation

```bash
# Clone or download
cd shqipai

# Install dependencies
npm install

# Pull the AI model
ollama pull gemma3:4b

# Start the server
npm start
```

Open http://localhost:3001 in your browser.

### Electron App

```bash
npm run electron
```

## KV Cache Compression (Memory Optimization)

ShqipAI supports Ollama's KV cache quantization for significant memory savings.

### Quick Setup (Windows)

```powershell
# Recommended: 50% memory savings with minimal quality loss
setx OLLAMA_KV_CACHE_TYPE "q8_0"

# Enable Flash Attention for speedup
setx OLLAMA_FLASH_ATTENTION "1"

# Restart Ollama (close from system tray, then reopen)
```

### Memory Comparison

| Setting | Memory Usage | Quality |
|---------|--------------|---------|
| f16 (default) | 100% | Perfect |
| q8_0 | ~50% | Minimal loss |
| q4_0 | ~25% | Some loss |

See [docs/ollama-setup.md](docs/ollama-setup.md) for detailed configuration.

## Multi-Language Support

ShqipAI supports 10 languages for both the UI and AI responses:

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Albanian | sq | Shqip |
| Spanish | es | Español |
| French | fr | Français |
| German | de | Deutsch |
| Portuguese | pt | Português |
| Chinese | zh | Chinese |
| Japanese | ja | Japanese |
| Arabic | ar | Arabic |
| Russian | ru | Russian |

### Language Settings

- **App Language**: UI language for buttons, labels, menus
- **AI Response Language**: Language for AI responses (can differ from app language)
- **Proficiency Level**: Beginner, Intermediate, Advanced (adjusts AI language complexity)

## Hardware-Adaptive Performance

ShqipAI automatically detects your hardware and optimizes settings:

| Profile | CPU | RAM | AI Model | Context | Features |
|---------|-----|-----|----------|---------|----------|
| Ultra | 16+ cores | 32GB+ | gemma3:12b | 32K | All features |
| High | 8-16 cores | 16-32GB | gemma3:8b | 16K | Most features |
| Medium | 4-8 cores | 8-16GB | gemma3:4b | 8K | Core features |
| Low | 2-4 cores | 4-8GB | gemma3:2b | 4K | Essential features |
| Minimal | 2 cores | <4GB | gemma3:1b | 2K | Basic chat |

Access Settings (gear icon) to view detected hardware and adjust profile.

## Accessibility

- **High Contrast Mode**: Enhanced visibility
- **Dyslexia Font**: OpenDyslexic font for easier reading
- **Font Size**: Adjustable from 12px to 24px
- **Screen Reader Mode**: Optimized ARIA labels
- **Read Aloud**: Text-to-speech for AI responses
- **Keyboard Shortcuts**: Full keyboard navigation

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` | Open Settings |
| `/` | Focus chat input |
| `Ctrl+Shift+H` | Toggle high contrast |
| `Escape` | Stop TTS / Close modals |

## Project Structure

```
shqipai/
  index.html          # Main application
  manifest.json       # PWA manifest
  sw.js               # Service worker
  server.js           # Express backend
  js/
    ai-core.js        # AI chat with streaming
    i18n.js           # Internationalization
    hardware-profile.js # Hardware detection
    settings.js       # Settings panel
    tts.js            # Text-to-speech
    accessibility.js  # Accessibility features
    multimodal.js     # Image input support
    textbook-rag.js   # PDF textbook RAG
    learning-analytics.js # Progress tracking
    memory.js         # Learning memory system
    projects.js       # Project/file management
    terminal.js       # Code editor & terminal
    accounts.js       # Authentication
    state.js          # Application state
  css/
    style.css         # Main styles
    settings.css      # Settings & accessibility
  docker/             # Docker container pool
  electron/           # Electron app config
  tests/              # Jest test suites
  docs/               # Documentation
    kaggle-writeup.md # Competition submission
    video-script.md   # YouTube video script
    ollama-setup.md   # Ollama configuration
  icons/              # PWA icons
```

## Testing

```bash
npm test
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
PORT=3001
```

### Ollama Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_KV_CACHE_TYPE` | f16 | KV cache quantization (f16, q8_0, q4_0) |
| `OLLAMA_FLASH_ATTENTION` | 0 | Flash Attention (0 or 1) |
| `OLLAMA_CONTEXT_LENGTH` | 4096 | Maximum context window |

## Future: TurboQuant

TurboQuant is a new algorithm achieving near-optimal KV cache compression (3-bit keys, 2-bit values) with virtually no quality loss. Currently being integrated into llama.cpp and will be available in Ollama soon.

Track progress: [llama.cpp Discussion #20969](https://github.com/ggml-org/llama.cpp/discussions/20969)

## License

MIT License - See LICENSE file for details.

## Credits

- AI Model: [Gemma 4](https://ai.google.dev/gemma) by Google
- Runtime: [Ollama](https://ollama.com)
- Editor: [Monaco Editor](https://microsoft.github.io/monaco-editor/) by Microsoft
