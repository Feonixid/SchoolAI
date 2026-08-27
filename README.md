# ShqipAI — Classroom-Deployed Zero-Internet Educational AI Platform

**ShqipAI** is an offline-first, classroom-deployed educational operating system and AI learning platform. Built for schools with zero or intermittent internet connectivity, ShqipAI runs on a single teacher laptop and connects up to 30+ student devices over local classroom Wi-Fi with zero configuration, no app downloads, and no student account friction. When internet access is available, it reconciles and synchronizes attendance, grades, and progress to central school cloud servers using a multi-master conflict resolution engine.

---

## 🏫 Core Architecture: The Classroom Mesh Model

```
┌────────────────────────────────────────────────────────┐
│         Central School Cloud / District Server         │
│     - Multi-Master Sync Conflict Resolution Engine     │
│     - Authoritative Curriculum & Announcements         │
│     - District-Wide Analytics Dashboard                │
└───────────────────────────▲────────────────────────────┘
                            │ (Intermittent Sync via /api/sync/cloud-push)
┌───────────────────────────▼────────────────────────────┐
│          Teacher Laptop (Local Classroom Hub)          │
│     - Runs ShqipAI Core + Local LLM                    │
│     - Teacher Dashboard & Live Student Monitor         │
│     - Generates 6-Letter Room Code (e.g. "TEACH7A")    │
│     - 100% Offline Database (JSON / Local Storage)     │
└───────────────────────────▲────────────────────────────┘
                            │ (Classroom Wi-Fi / LAN - Zero Internet Needed)
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
- The Multi-Master Conflict Resolution Engine reconciles attendance records, homework submissions, and gamification points using timestamps and note-preservation rules without race conditions.

### 3. District & Central Server Mode
- Central school servers run with `IS_CENTRAL_SERVER=true` to aggregate analytics across multiple school branches.
- Distributes authoritative curriculum packs, announcements, and district exams to local teacher laptops via `/api/sync/cloud-export`.

---

## 🌟 Comprehensive Educational Feature Suite

### 🔬 Interactive Learning & Simulation Labs
- **⚡ DC Circuit Lab**: Ohm's Law ($V = I \cdot R$), series/parallel resistors, live electron flow, and dynamic bulb luminescence.
- **⚗️ Chemical Equation Balancer**: Automatic stoichiometric balancing with atomic conservation audit table ($m_{\text{reactants}} = m_{\text{products}}$).
- **📊 Market Equilibrium (Microeconomics)**: Real-time supply & demand curves with consumer/producer surplus calculations.
- **🧬 DNA & Protein Synthesis**: Central dogma simulator ($DNA \rightarrow mRNA \rightarrow \text{Polypeptide Chain}$) with point mutation tester.
- **🪐 Gravity & Orbital Mechanics**: 2D N-body orbital physics ($F = G \frac{M m}{r^2}$) demonstrating Kepler's laws and escape trajectories.
- **🤖 AI Neural Network Playground**: Interactive 2D multi-layer perceptron with decision boundary classifier, $L_1/L_2$ regularization, and activation function explorer (ReLU, Sigmoid, Tanh, GELU).
- **🚀 Projectile Motion**: Trajectory calculations, launch angle adjustments, and 2D canvas trajectory rendering.
- **📈 Function Grapher**: Real-time 2D mathematical function visualizer.

### 📚 Academic Tools & Pedagogy
- **💡 Socratic Pedagogy Engine**: Active misconception detection that guides students with structured inquiry instead of immediately revealing answers.
- **✍️ AI Essay & Writing Studio**: 4-dimensional rubric evaluation (Thesis, Evidence, Structure, Vocabulary) with readability metrics.
- **📝 Teacher Assignment Grading Studio**: Interactive rubric grading sliders, AI evaluation suggestions, and gradebook synchronization.
- **🗂️ Spaced Repetition Flashcards**: Leitner 5-box cognitive spaced repetition engine with 3D card flips.
- **⚔️ Gamified Live Quiz Battle Arena**: 60-second real-time knowledge challenges with streak multipliers and tactical power-ups (Shield, Freeze, 50/50, 2x XP).
- **🗣️ Multi-Language Speech & Pronunciation Coach**: Phonetic accuracy scoring in 5 languages (Albanian, English, German, French, Spanish) with native TTS modeling.
- **🗺️ Visual Learning Roadmaps**: Subject skill trees with prerequisite tracking across STEM and humanities.
- **🏆 Interactive Subject Challenges**: Tiered difficulty problem sets (Easy, Medium, Hard) with step-by-step mathematical explanations.
- **📅 Study Calendar & Timetable**: Interactive monthly schedule with exam countdowns, assignment deadlines, and timetable planner.

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
Test Suites: 16 passed, 16 total
Tests:       76 passed, 76 total
Snapshots:   0 total
Time:        ~25 s
```

---

## 🔒 Security & Privacy
- **Zero-Cloud Requirement**: Student PII, homework responses, and chat logs never leave the classroom network unless explicitly authorized by the school administrator.
- **Role-Based Access Control (RBAC)**: Teacher management tools and grading panels are guarded against student privilege escalation.
- **Full Offline PWA**: Static assets and client-side computational labs are cached locally via Service Worker (`sw.js`).
