# EduAI — Autonomous Classroom-Deployed Educational AI Platform & School OS

**EduAI** is an offline-first, classroom-deployed educational operating system and autonomous AI learning platform. Engineered for schools with zero or intermittent internet connectivity, EduAI runs on a single teacher laptop and connects up to 30+ student devices over local classroom Wi-Fi with zero configuration, no app downloads, and no student account friction. When internet access is available, it reconciles and synchronizes attendance, grades, and progress to central school cloud servers using a multi-master conflict resolution engine.

---

## Why We Built This

1.8 billion students worldwide attend schools without reliable internet. Teachers in rural communities, developing nations, and resource-constrained environments shouldn't need $50/month SaaS subscriptions or always-on broadband to give their students access to state-of-the-art AI-powered learning. Student data should never leave the classroom network unless the school explicitly authorizes it. EduAI was designed from day one to eliminate administrative and instructional friction, automate repetitive grading and scheduling, and make high-quality, adaptive education universally accessible.

---

## Core Architecture: The Classroom Mesh Model

```
┌────────────────────────────────────────────────────────┐
│         Central School Cloud / District Server         │
│     - Multi-Master Sync Conflict Resolution Engine     │
│     - Authoritative Curriculum & Announcements         │
│     - District-Wide Analytics Dashboard                │
└───────────────────────────▲────────────────────────────┘
                            │ (Intermittent Sync — Full or Delta)
┌───────────────────────────▼────────────────────────────┐
│          Teacher Laptop (Local Classroom Hub)          │
│     - Runs EduAI Core + Local LLM (Ollama)             │
│     - Teacher Dashboard & Live Student Monitor         │
│     - Autonomous Grading & Socratic Tutoring Engine    │
│     - 100% Offline Database (JSON / Local Storage)     │
└───────────────────────────▲────────────────────────────┘
                            │ (Classroom Wi-Fi / LAN — Zero Internet Needed)
         ┌──────────────────┼──────────────────┬──────────────────┐
         │                  │                  │                  │
    ┌────┴────┐        ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
    │ Student │        │ Student │        │ Student │        │ Student │
    │ Laptop  │        │  iPad   │        │ Phone   │        │Chromebk │
    └─────────┘        └─────────┘        └─────────┘        └─────────┘
```

---

## The Autonomous School OS Suite

### 1. Autonomous Auto-Grading & Remediation Copilot
- Evaluates written answers, math derivations, essays, and lab steps against official standards (1–10 MAS, 1–7 IB Criterion, 0–100% US, 1–9 GCSE).
- Pinpoints the exact line or concept where the student went off track.
- Instantly constructs and assigns a tailored 3-question remedial drill targeting the specific misconception.

### 2. Adaptive Knowledge-Graph Mastery Engine
- Maps all curriculum competencies into a directed dependency graph using Bayesian Knowledge Tracing (BKT).
- Fast-tracks advanced learners ($\ge 85\%$ mastery) to Olympiad and Matura extension challenges; scaffolds struggling learners ($< 60\%$) with visual interactive simulators.

### 3. Autonomous Principal, Timetables & Dropout Risk Detector
- Generates conflict-free master weekly timetables across classrooms, teachers, and grade tiers (1–12).
- **Automated Substitute Teacher Mode**: Generates an automated 45-minute self-guided interactive lesson plan if a teacher is absent.
- **Early-Warning Dropout Predictor**: Calculates at-risk indices based on attendance velocity and grade trends.

### 4. Interactive Smartboard Classroom Conductor
- High-contrast, large-format smartboard interface for front-of-class projection.
- Live 5-phase countdown timer with 1-click interactive physics/chemistry simulator popouts, instant class polling, and live team buzzer battles.

### 5. Exam Lockdown & Anti-Cheat Integrity Engine
- Enforces fullscreen mode, intercepts tab switches (`visibilitychange`), logs window defocus (`blur`), and disables copy/paste/cut.
- Persists a timestamped audit log directly into the teacher's gradebook record.

### 6. Parent Offline Progress Card & SMS Exporter
- Generates formatted SMS/WhatsApp progress reports for parents in rural areas with 1 click.

### 7. Air-Gapped Sneakernet USB Sync Ledger
- Enables 100% air-gapped schools to export full offline snapshots to a portable JSON file on a USB flash drive.

---

## Hardware-Adaptive Optimization Engine

EduAI detects CPU cores, RAM, and GPU at startup and selects the right model, context window, thread count, and rendering strategy automatically:

| Tier | CPU | Model | Context | KV Cache | Threads | Batch | Rendering | Docker |
|---|---|---|---|---|---|---|---|---|
| **Ultra** | 16+ cores | `gemma3:12b` | 32,768 | f16 | 16 | 512 | 60fps | ✅ |
| **High** | 8 cores | `gemma3:8b` | 16,384 | q8_0 | 8 | 512 | 60fps | ✅ |
| **Medium** | 4 cores | `gemma3:4b` | 8,192 | q8_0 | 4 | 256 | 30fps | ❌ |
| **Low** | 2 cores | `gemma3:2b` | 4,096 | q4_0 | 2 | 128 | 15fps | ❌ |
| **Minimal** | 1 core | `gemma3:1b` | 2,048 | q4_0 | 1 | 64 | 15fps | ❌ |

---

## Quick Start

### Windows
Double-click `start_server.bat` to launch the classroom node.

### Linux / macOS / ChromeOS / Raspberry Pi
```bash
chmod +x start_server.sh
./start_server.sh
```

### Manual Node.js Launch
```bash
# 1. Install dependencies
npm install

# 2. Pull local educational model (Ollama)
ollama pull gemma3:4b

# 3. Start classroom server
node server.js
```

---

## Automated Test Suite

All 34 test suites are automated and executed with Jest:
```bash
npm test
```
```text
Test Suites: 34 passed, 34 total
Tests:       144 passed, 144 total
Snapshots:   0 total
Time:        29.352 s
```

---

## Security, FERPA & GDPR Compliance
- **Zero-Cloud Requirement**: Student PII, homework responses, and chat logs never leave the classroom network unless explicitly authorized.
- **1-Click Anonymized Exporter**: Strips student names and IP addresses with deterministic pseudonymization hashes for official research or district reporting.
- **Role-Based Access Control (RBAC)**: Teacher management tools and grading panels are guarded with cryptographic session verification.
- **Full Offline PWA**: Static assets and client-side computational labs are cached locally via Service Worker (`sw.js`).
