# EduAI — Classroom-Deployed Zero-Internet Educational AI Platform

**EduAI** is an offline-first, classroom-deployed educational operating system and AI learning platform. Built for schools with zero or intermittent internet connectivity, EduAI runs on a single teacher laptop and connects up to 30+ student devices over local classroom Wi-Fi with zero configuration, no app downloads, and no student account friction. When internet access is available, it reconciles and synchronizes attendance, grades, and progress to central school cloud servers using a multi-master conflict resolution engine.

---

## 💡 Why We Built This

1.8 billion students worldwide attend schools without reliable internet. Teachers in rural communities, developing nations, and conflict zones shouldn't need $50/month SaaS subscriptions or always-on broadband to give their students access to AI-powered learning. Student data should never leave the classroom network unless the school explicitly authorizes it. EduAI was designed from day one for environments where connectivity is measured in hours per week — or zero. It's the only educational AI platform that gets *better* in low-bandwidth environments, not worse.

---

## 🏫 Core Architecture: The Classroom Mesh Model

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
│     - Runs EduAI Core + Local LLM (Ollama)          │
│     - Teacher Dashboard & Live Student Monitor         │
│     - Generates 6-Letter Room Code (e.g. "TEACH7A")   │
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

## 🎯 Deployment Scenarios

### 1. Pure Offline Classroom (No Internet)
- Teacher starts the application on a laptop (`npm start` or desktop installer).
- Generates a local room code and QR code.
- 30+ students connect via browser (e.g., `http://192.168.1.50:3001`).
- All interactive simulations, AI tutoring, quiz battles, and assignments run entirely offline without consuming bandwidth.

### 2. Intermittent Cloud Synchronization
- Teacher conducts classes offline Monday through Friday.
- When connected to internet (e.g., school office or home), teacher clicks **"Sync to Central Cloud"**.
- The Multi-Master Conflict Resolution Engine reconciles attendance records, homework submissions, student profiles, and gamification points using timestamps and note-preservation rules without race conditions.
- **Delta sync**: Pass a `since` timestamp to only upload records modified after the last sync, cutting payload size from 10–50 MB to a few kilobytes on routine syncs.

### 3. District & Central Server Mode
- Central school servers run with `IS_CENTRAL_SERVER=true` to aggregate analytics across multiple school branches.
- Distributes authoritative curriculum packs, announcements, and district exams to local teacher laptops via `/api/sync/cloud-export`.

---

## 🔄 Sync Conflict Resolution Algorithm

When two classroom nodes (teachers) sync simultaneously, the engine handles conflicts at the field level:

| Entity Type | Strategy | Edge Case Handling |
|---|---|---|
| **Attendance** | Latest timestamp wins | Same-timestamp tie-break: record with a note wins |
| **Submissions / Grades** | Latest timestamp wins (tie goes to incoming) | Grade override is always auditable |
| **Students** | Field-level merge (spread both records) | Divergent `finalGrade` values trigger a `syncConflictWarning` flag for admin review |
| **Gamification** | Additive — `Math.max(points)`, `Math.max(streak)`, union of badge arrays | Badges are append-only; XP never decreases |
| **Announcements** | Deduplicated by `id` — new IDs are appended | No destructive overwrites |

### Why gamification is append-only
A student who earns the "Circuit Master" badge in classroom A and the "Biology Ace" badge in classroom B should keep both. Points and streaks always resolve to the higher value because undoing earned progress destroys student trust and motivation.

### Example: Teacher A vs Teacher B grading conflict
```
Teacher A marks Endrit → finalGrade: "A"
Teacher B marks Endrit → finalGrade: "C"
Both sync to central cloud simultaneously.

Result:
  - Merged student record keeps Teacher B's fields (newer timestamp)
  - syncConflictWarning: "Grade conflict: Teacher1='A', Teacher2='C'"
  - Admin reviews and resolves in the central dashboard
```

---

## ⚙️ Hardware-Adaptive Optimization Engine

EduAI detects CPU cores, RAM, and GPU at startup and selects the right model, context window, thread count, and rendering strategy automatically. An Intel Core i5-4500 (4 cores, 8GB RAM) runs fundamentally different code paths than a Ryzen 9 (16 cores, 32GB RAM):

| Tier | CPU | Model | Context | KV Cache | Threads | Batch | Rendering | Docker |
|---|---|---|---|---|---|---|---|---|
| **Ultra** | 16+ cores | `gemma3:12b` | 32,768 | f16 | 16 | 512 | 60fps | ✅ |
| **High** | 8 cores | `gemma3:8b` | 16,384 | q8_0 | 8 | 512 | 60fps | ✅ |
| **Medium** | 4 cores | `gemma3:4b` | 8,192 | q8_0 | 4 | 256 | 30fps | ❌ |
| **Low** | 2 cores | `gemma3:2b` | 4,096 | q4_0 | 2 | 128 | 15fps | ❌ |
| **Minimal** | 1 core | `gemma3:1b` | 2,048 | q4_0 | 1 | 64 | 15fps | ❌ |

**What actually changes at runtime:**
- `createThrottledLoop()` — Canvas simulations tick at 60, 30, or 15 fps depending on tier.
- `adaptiveDebounce()` — Input handlers fire at 150ms (high-end) to 600ms (low-end).
- `batchDomWrite()` — DOM mutations batch into a single `requestAnimationFrame` on slower chips.
- `canRun('particles')` — Particle effects disabled below 8 cores.
- `pruneHistory()` — Chat history capped at 100 messages (ultra) down to 10 (minimal) to prevent OOM.
- `num_thread` / `num_batch` — Ollama inference parameters matched to physical core count.

---

## 🌟 Comprehensive Educational Feature Suite

### 🔬 Interactive Learning & Simulation Labs
- **⚡ DC Circuit Lab**: Ohm's Law, series/parallel resistors, live electron flow, and dynamic bulb luminescence.
- **⚗️ Chemical Equation Balancer**: Automatic stoichiometric balancing with atomic conservation audit.
- **📊 Market Equilibrium (Microeconomics)**: Real-time supply & demand curves with surplus calculations.
- **🧬 DNA & Protein Synthesis**: Central dogma simulator with point mutation tester.
- **🪐 Gravity & Orbital Mechanics**: 2D N-body orbital physics demonstrating Kepler's laws.
- **🤖 AI Neural Network Playground**: Interactive perceptron with decision boundary classifier.
- **🚀 Projectile Motion**: Trajectory calculations with launch angle adjustments.
- **📈 Function Grapher**: Real-time 2D mathematical function visualizer.

### 📚 Academic Tools & Pedagogy
- **💡 Socratic Pedagogy Engine**: Misconception detection with structured inquiry.
- **✍️ AI Essay & Writing Studio**: 4-dimensional rubric with readability metrics.
- **📝 Teacher Assignment Grading Studio**: Interactive rubric sliders and gradebook sync.
- **🗂️ Spaced Repetition Flashcards**: Leitner 5-box system with 3D card flips.
- **⚔️ Gamified Live Quiz Battle Arena**: 60-second challenges with streak multipliers and power-ups.
- **🗣️ Multi-Language Pronunciation Coach**: 5-language phonetic scoring with native TTS.
- **🗺️ Visual Learning Roadmaps**: Subject skill trees with prerequisite tracking.
- **🏆 Interactive Subject Challenges**: Tiered difficulty with step-by-step explanations.
- **📅 Study Calendar & Timetable**: Monthly schedule with exam countdowns.
- **🎨 Collaborative Whiteboard**: Freehand pen, shapes, eraser, grid toggle, undo/redo, PNG export.
- **🔬 Scientific Calculator**: Trigonometric/logarithmic evaluation with physical constants explorer.

---

## 🚀 Quick Start

### Teacher / Host Computer
```bash
# 1. Install dependencies
npm install

# 2. Pull local educational model
ollama pull gemma3:4b

# 3. Start the classroom server
npm start
```
The server outputs the local loopback (`http://localhost:3001`) and the classroom LAN IP address (`http://192.168.x.x:3001`).

### Student Devices
1. Connect to the classroom Wi-Fi.
2. Open any browser and navigate to the displayed classroom address or enter the room code.
3. Start learning with zero account setup friction.

---

## 🧪 Automated Test Suite

All test suites are automated and executed with Jest:
```bash
npm test
```
```text
Test Suites: 20 passed, 20 total
Tests:       100+ passed
Snapshots:   0 total
```

---

## 🔒 Security & Privacy
- **Zero-Cloud Requirement**: Student PII, homework responses, and chat logs never leave the classroom network unless explicitly authorized by the school administrator.
- **Role-Based Access Control (RBAC)**: Teacher management tools and grading panels are guarded against student privilege escalation.
- **Full Offline PWA**: Static assets and client-side computational labs are cached locally via Service Worker (`sw.js`).

---

## 🏷️ Topics

`offline-first` · `zero-internet` · `education` · `developing-countries` · `edtech` · `ai-tutor` · `classroom` · `pwa` · `ollama` · `local-llm`
