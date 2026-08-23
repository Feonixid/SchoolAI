# ShqipAI: Offline-First Educational AI for Every Classroom

**Bridging the Digital Divide with Local Gemma 4**

---

## The Problem

2.6 billion people lack reliable internet access. In rural classrooms, developing regions, and underserved communities, students are left behind by cloud-dependent AI tools. A student in a remote village with an old laptop cannot use ChatGPT. A classroom with spotty WiFi cannot benefit from AI tutoring. Privacy concerns prevent many schools from adopting cloud AI solutions.

The digital divide in education is widening, and existing AI tools are making it worse.

## The Solution

**ShqipAI** is an offline-first educational AI platform powered by Gemma 4. It works anywhere, on any hardware, in any language - with **zero installation required**.

### Key Innovation 1: Dual Backend Architecture

ShqipAI supports two inference backends:

**Ollama Backend** (Primary):
- Full Gemma 4 model support (1B to 12B)
- KV cache compression for 50-75% memory savings
- SSE streaming for real-time responses

**WebLLM Backend** (Zero-Install):
- Runs entirely in browser via WebGPU
- No server, no Node.js, no installation
- Works on any laptop with a modern browser
- Even Intel N4500's UHD 600 graphics can accelerate it

This means a student opens a URL and gets AI tutoring - no IT department, no software installation, no technical knowledge required.

### Key Innovation 2: Hardware-Adaptive Performance

ShqipAI automatically detects CPU, RAM, and GPU capabilities, then optimizes itself:

| Profile | Hardware | Model | Context | Memory |
|---------|----------|-------|---------|--------|
| Ultra | i9, 32GB+ | gemma4:12b | 32K | Full |
| High | i7, 16GB | gemma4:8b | 16K | 50% savings |
| Medium | i5, 8GB | gemma4:4b | 8K | 50% savings |
| Low | Laptop, 4GB | gemma4:2b | 4K | 75% savings |
| Minimal | N4500, <4GB | gemma4:1b | 2K | 75% savings |

A student with a budget laptop gets the same quality experience as one with a high-end desktop.

### Key Innovation 3: Pedagogical Fine-Tuning

We fine-tune Gemma 4 once for **teaching style**, not subject content:

The model already knows biology. It already knows algebra. What it doesn't know is how to:
- Explain at the right difficulty level
- Guide without giving answers
- Handle misconceptions gently
- Respond naturally in multiple languages

Our Unsloth workflow creates a single LoRA adapter trained on ~2000 high-quality tutoring conversations across subjects. This adapter works for every subject because it adds the pedagogy layer, not the knowledge.

### Multi-Language Support

10 languages with separate controls for:
- **UI Language**: Interface localization
- **AI Response Language**: Responses in learner's native language
- **Proficiency Level**: Beginner/Intermediate/Advanced complexity

### Accessibility Built-In

- High contrast mode for visually impaired
- Dyslexia-friendly font option
- Text-to-speech for AI responses
- Full keyboard navigation

### Multimodal Learning

Students upload photos of homework, diagrams, or equations. Gemma 4's vision capabilities analyze and guide.

### Textbook RAG

Upload PDF textbooks for grounded answers with source citations. Prevents hallucination and aligns with curriculum.

---

## Technical Architecture

### Core Stack
- **AI Model**: Gemma 4 via Ollama or WebLLM
- **Backend**: Node.js/Express or pure browser (WebLLM mode)
- **Frontend**: Vanilla JS with modular architecture
- **Desktop**: Electron for cross-platform app
- **PWA**: Service worker for offline web access

### Key Technical Features

**1. SSE Streaming**: Real-time token display improves perceived performance.

**2. KV Cache Compression**: q8_0, q4_0 quantization enables larger models on constrained hardware.

**3. WebGPU Acceleration**: WebLLM uses the device's GPU - even integrated graphics on budget laptops.

**4. Learning Analytics**: Tracks progress by subject, visualizes patterns, exports reports.

---

## Impact

### Target Users
- Students in rural/developing areas
- Schools with privacy requirements
- Learners with accessibility needs
- Multilingual classrooms

### Privacy by Design
All data stays local. No cloud APIs, no tracking. Student conversations never leave their device.

---

## Why Gemma 4?

- **Model variety**: 1B to 12B for different hardware
- **Multimodal**: Native vision support
- **Open weights**: Fine-tunable with Unsloth
- **Licensing**: Open for educational use

---

## Competition Tracks

| Track | Why We Qualify |
|-------|----------------|
| **Ollama** | Primary backend, showcases local Gemma 4 |
| **WebLLM** | Zero-install browser inference via WebGPU |
| **Future of Education** | Adaptive AI tutor with analytics |
| **Digital Equity** | 10 languages, accessibility, offline-first |
| **Unsloth** | Fine-tuned pedagogical model |

---

## Code & Demo

- **GitHub**: Full source code with documentation
- **Live Demo**: Zero-install WebLLM version
- **Fine-tuned Model**: Hugging Face weights

---

## Conclusion

ShqipAI proves AI education doesn't need the cloud. With dual backend support (Ollama + WebLLM), hardware-adaptive optimization, and pedagogical fine-tuning, we bring AI tutoring to the 2.6 billion people currently excluded.

The technology exists. The models are open. The impact is waiting to happen.

---

*Word count: ~900 (within 1,500 limit)*
