#!/usr/bin/env python3
"""
EduAI — Single-Cell Kaggle Script
=====================================
Paste this entire file into ONE Kaggle code cell and run it.
It handles everything automatically:

  Stage 0 → Install Unsloth + deps, restart kernel
  Stage 1 → Download & merge training data (99K+ examples)
  Stage 2 → Fine-tune Gemma 4 E4B on 2x T4
  Stage 3 → Export GGUF for Ollama + before/after evaluation report

Resumable: uses /kaggle/working/.eduai_stage to track progress.
Re-run the cell to resume from where it left off.

CONFIGURATION — edit the block below before running.
"""

# ================================================================
#  ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗
# ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝
# ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗
# ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║
# ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝
#  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝
# ================================================================

CFG = {
    # ── Data ──────────────────────────────────────────────────────
    # Path to YOUR existing educational_data.jsonl
    # If you uploaded it as a Kaggle dataset, use:
    #   "/kaggle/input/YOUR-DATASET-NAME/educational_data.jsonl"
    # If you don't have one yet, set to "" and we'll skip it
    "existing_data": "",

    # How many samples to pull from each HuggingFace source
    "orca_math_samples":   25_000,
    "openmath_samples":    20_000,
    "science_samples":     15_000,
    "code_samples":        20_000,
    "openhermes_samples":  20_000,
    "socratic_variants":    8_000,

    # ── Model ─────────────────────────────────────────────────────
    "model":           "unsloth/gemma-4-E4B-it",
    "max_seq_length":  2048,

    # ── LoRA ──────────────────────────────────────────────────────
    "lora_r":      16,
    "lora_alpha":  16,

    # ── Training ──────────────────────────────────────────────────
    "epochs":        1,
    "max_steps":    -1,   # -1 = full epoch. Set e.g. 200 to smoke-test
    "batch_size":    2,   # per device; effective = 2 * 4 accum * 2 GPUs = 16
    "grad_accum":    4,
    "lr":           2e-4,
    "warmup_steps": 20,

    # ── Output ────────────────────────────────────────────────────
    "output_dir":   "/kaggle/working/shqipai_lora",
    "gguf_quant":   "q4_k_m",   # q4_k_m = small+fast | q8_0 = higher quality

    # ── HuggingFace Hub (optional) ────────────────────────────────
    # Set to "yourname/shqipai-gemma4" to push after training
    "push_to_hub":  "",
    "hf_token":     "",   # or set HF_TOKEN env var
}

# ================================================================
# INTERNALS — no need to edit below this line
# ================================================================

import os, sys, json, re, hashlib, signal

WORKDIR    = "/kaggle/working"
STAGE_FILE = os.path.join(WORKDIR, ".shqipai_stage")
DATA_FILE  = os.path.join(WORKDIR, "training_data_merged.jsonl")


def get_stage():
    if os.path.exists(STAGE_FILE):
        return int(open(STAGE_FILE).read().strip())
    return 0

def set_stage(n):
    with open(STAGE_FILE, "w") as f:
        f.write(str(n))
    print(f"\n  ✓ Stage {n} complete. Stage file updated.")

def banner(title):
    print("\n" + "═" * 60)
    print(f"  {title}")
    print("═" * 60)


# ================================================================
# STAGE 0 — INSTALL & RESTART KERNEL
# ================================================================
def stage0_install():
    banner("STAGE 0 — Installing dependencies")

    try:
        import unsloth  # noqa
        print("  unsloth already installed, skipping.")
        set_stage(1)
        return
    except ImportError:
        pass

    print("  Installing Unsloth (Kaggle edition)...")
    ret = os.system(
        'pip install -q "unsloth[kaggle-new] @ git+https://github.com/unslothai/unsloth.git"'
    )
    if ret != 0:
        # Fallback to PyPI release
        print("  Git install failed, trying PyPI release...")
        os.system("pip install -q unsloth unsloth_zoo")

    print("  Installing trl, datasets, bitsandbytes...")
    os.system("pip install -q trl datasets bitsandbytes accelerate")

    set_stage(1)

    print("""
  ╔══════════════════════════════════════════════════════╗
  ║  KERNEL RESTART REQUIRED                            ║
  ║  Restarting now — Kaggle will re-run this cell      ║
  ║  automatically. Stage file is saved, so it will     ║
  ║  skip installation and go straight to data prep.    ║
  ╚══════════════════════════════════════════════════════╝
""")

    # Restart the Jupyter kernel cleanly
    try:
        from IPython import get_ipython
        ip = get_ipython()
        if ip is not None:
            ip.kernel.do_shutdown(restart=True)
            return   # Execution stops here
    except Exception:
        pass

    # Fallback: hard kill (Kaggle will restart automatically)
    os.kill(os.getpid(), signal.SIGKILL)


# ================================================================
# STAGE 1 — DATA PREPARATION
# ================================================================

SUBJECTS = {
    "math":         "You are an expert mathematics tutor. Solve problems step-by-step with clear reasoning. Show all work, verify answers, and explain the underlying concepts.",
    "physics":      "You are an expert physics tutor. Explain phenomena with real-world examples, derive equations step-by-step, include units in all calculations, and connect theory to everyday experience.",
    "chemistry":    "You are an expert chemistry tutor. Explain reactions and mechanisms clearly, balance equations, use proper IUPAC nomenclature, and relate concepts to laboratory practice.",
    "biology":      "You are an expert biology tutor. Explain biological processes with clear analogies, use proper scientific terminology, describe experiments, and connect topics to health and environment.",
    "history":      "You are an expert history tutor. Explain historical events with context, causes, and consequences. Use primary source references, timelines, and help students understand multiple perspectives.",
    "economics":    "You are an expert economics tutor. Explain micro and macroeconomic concepts clearly with real-world examples and connect theory to current events.",
    "albanian":     "You are an expert Albanian language tutor. Help students with grammar (morfologji, sintakse), literature analysis, essay writing, and reading comprehension. Respond in Albanian when appropriate.",
    "german":       "You are an expert German language tutor. Help with grammar (Fälle, Konjugation, Satzbau), vocabulary, and reading comprehension. Use German examples with translations.",
    "spanish":      "You are an expert Spanish language tutor. Help with grammar (conjugación, tiempos verbales), vocabulary, and conversation. Use Spanish examples with translations.",
    "english":      "You are an expert English language and literature tutor. Help with grammar, essay writing, literary analysis, and reading comprehension.",
    "coding":       "You are an expert computer science and programming tutor. Explain algorithms, data structures, and coding concepts clearly. Write clean, commented code. Cover Python, JavaScript, HTML/CSS.",
    "cybersecurity":"You are an expert cybersecurity tutor. Explain security concepts, threats, defenses, and ethical hacking principles. Cover network security, cryptography, and web security in an educational, responsible manner.",
}

HONESTY_SYSTEM = (
    "You are an honest, careful educational tutor. You NEVER make up information. "
    "When you're not sure, you say so. You ask clarifying questions to understand "
    "exactly what the student needs before answering."
)

def to_gemma4(user_text, model_text, system=None):
    convos = []
    if system:
        convos.append({"role": "system", "content": system.strip()})
    convos.append({"role": "user", "content": user_text.strip()})
    convos.append({"role": "assistant", "content": model_text.strip()})
    return {"conversations": convos}

def to_gemma4_multi_turn(turns, system=None):
    convos = []
    sys_text = system
    for turn in turns:
        role = turn.get("role", turn.get("from", ""))
        content = turn.get("content", turn.get("value", ""))
        if not content:
            continue
        if role == "system":
            sys_text = content
            continue
        elif role in ("user", "human"):
            if not convos and sys_text:
                convos.append({"role": "system", "content": sys_text.strip()})
            convos.append({"role": "user", "content": content.strip()})
        elif role in ("assistant", "model", "gpt"):
            convos.append({"role": "assistant", "content": content.strip()})
    roles = [c["role"] for c in convos]
    if "user" not in roles or "assistant" not in roles:
        return None
    return {"conversations": convos}


# ── Curated subject gap data ─────────────────────────────────────

CURATED_DATA = [
    # HISTORY
    ("history", "What caused World War I?",
     "World War I was caused by a combination of factors, remembered by the acronym MAIN:\n\n**M - Militarism:** European powers were building massive armies and navies.\n\n**A - Alliances:** Two alliance systems divided Europe — the Triple Alliance (Germany, Austria-Hungary, Italy) and the Triple Entente (France, Britain, Russia). A conflict between two nations could drag in all of Europe.\n\n**I - Imperialism:** European powers competed for colonies and resources globally.\n\n**N - Nationalism:** Intense national pride, especially in the Balkans — the 'powder keg of Europe'.\n\n**The Spark:** The assassination of Archduke Franz Ferdinand in Sarajevo on June 28, 1914 triggered the alliance system and led to a chain reaction of war declarations."),
    ("history", "Explain the French Revolution.",
     "The French Revolution (1789-1799) was a period of radical political and social change.\n\n**Causes:** Social inequality (the Three Estates system), France's bankruptcy, Enlightenment ideas challenging absolute monarchy, and food shortages from bad harvests.\n\n**Key Events:**\n- 1789: Storming of the Bastille, Declaration of Rights of Man\n- 1791: Constitutional monarchy established\n- 1793: Monarchy abolished, King Louis XVI executed\n- 1793-94: Reign of Terror under Robespierre\n- 1799: Napoleon seizes power\n\n**Legacy:** Established principles of citizenship, human rights, and democracy that influenced revolutions worldwide."),
    ("history", "What was the Cold War?",
     "The Cold War (1947-1991) was a period of geopolitical tension between the USA and USSR.\n\n**Two sides:** USA (capitalist democracy) vs USSR (communist). Called 'cold' because they never fought directly.\n\n**Competition through:**\n1. Proxy wars — Korea, Vietnam, Afghanistan\n2. Nuclear arms race (MAD doctrine)\n3. Space Race — Sputnik 1957, Moon landing 1969\n4. Ideological spreading of each system\n\n**Key events:** Berlin Blockade (1948), Cuban Missile Crisis (1962), Berlin Wall built (1961) then fell (1989), USSR dissolved (1991)."),
    ("history", "Describe the Renaissance.",
     "The Renaissance (roughly 1350-1600) was a cultural and intellectual rebirth that began in Italy.\n\n**Key changes:** Shift from medieval religious focus to humanism — celebrating human potential. Revival of ancient Greek and Roman knowledge.\n\n**Major figures:** Leonardo da Vinci, Michelangelo, Raphael (art); Galileo, Copernicus (science); Dante, Machiavelli, Shakespeare (literature).\n\n**Why Italy first?** Wealthy merchant cities like Florence, patronage from the Medici family, access to ancient ruins, and trade connections.\n\n**Impact:** Scientific method emerged, perspective in art, foundation of modern Western culture."),
    ("history", "What were the causes of World War II?",
     "WWII had several interconnecting causes:\n\n1. **Treaty of Versailles (1919):** Blamed Germany for WWI, imposed huge reparations and restrictions, creating resentment.\n2. **Rise of Fascism:** Hitler and the Nazis rose to power in 1933, Mussolini in Italy, militarism in Japan.\n3. **Appeasement:** Britain and France gave Hitler territorial demands (Munich Agreement 1938), emboldening further aggression.\n4. **Failure of the League of Nations:** Could not prevent Japanese, Italian, or German aggression — had no enforcement power.\n5. **German Aggression:** Remilitarization of the Rhineland (1936), annexation of Austria (1938), invasion of Poland (September 1, 1939) — triggered the war."),

    # ECONOMICS
    ("economics", "Explain supply and demand.",
     "Supply and demand is the fundamental model of how markets work.\n\n**Demand:** Law of Demand — as price goes UP, quantity demanded goes DOWN. The demand curve slopes downward.\n\n**Supply:** Law of Supply — as price goes UP, quantity supplied goes UP. The supply curve slopes upward.\n\n**Equilibrium:** Where the curves cross — determines market price and quantity.\n- Price above equilibrium → surplus\n- Price below equilibrium → shortage\n\n**Real example:** New phone launch — high demand + limited supply = high price. As production increases, supply rises and price falls toward equilibrium."),
    ("economics", "What is GDP and how is it calculated?",
     "GDP (Gross Domestic Product) measures the total value of all goods and services produced in a country over a year.\n\n**Expenditure Approach (most common):**\nGDP = C + I + G + (X - M)\n- C = Consumer spending\n- I = Business investment\n- G = Government spending\n- X - M = Net exports\n\n**Key distinctions:**\n- Nominal GDP: measured in current prices (includes inflation)\n- Real GDP: adjusted for inflation (better for comparisons over time)\n- GDP per capita: GDP ÷ population (measures standard of living)\n\n**Limitations:** Doesn't measure inequality, happiness, unpaid work, or environmental damage."),
    ("economics", "Explain inflation.",
     "Inflation is the general increase in prices over time, reducing purchasing power.\n\n**Types:**\n1. Demand-Pull: too much money chasing too few goods\n2. Cost-Push: rising production costs (wages, raw materials)\n3. Built-In: wage-price spiral\n\n**Measured by CPI** (Consumer Price Index) — tracks a basket of typical goods.\n\n**Effects:**\n- Moderate (2-3%): healthy, encourages spending\n- High (10%+): erodes savings, creates uncertainty\n- Hyperinflation: currency becomes worthless (Zimbabwe 2008)\n- Deflation: can be worse — people delay purchases, economy shrinks\n\n**Control:** Central banks raise interest rates to slow inflation, lower them to stimulate growth."),

    # CYBERSECURITY
    ("cybersecurity", "What is encryption and why does it matter?",
     "Encryption converts readable data (plaintext) into unreadable ciphertext, decodable only with the correct key.\n\n**Two main types:**\n\n1. **Symmetric Encryption:** Same key to encrypt and decrypt. Fast, efficient for large data. Example: AES-256.\n\n2. **Asymmetric Encryption:** Public key (encrypt) + private key (decrypt). Solves the key-sharing problem. Example: RSA, used in HTTPS.\n\n**Real-world uses:** HTTPS web browsing, end-to-end messaging (Signal, WhatsApp), disk encryption, VPNs.\n\n**Hashing (related):** One-way function — data → fixed hash. Used for passwords (bcrypt, SHA-256). Cannot be reversed, only compared."),
    ("cybersecurity", "What is phishing and how can I protect myself?",
     "Phishing is a social engineering attack where attackers impersonate trusted entities to steal sensitive information.\n\n**Types:** Email phishing, spear phishing (targeted), smishing (SMS), vishing (voice), whaling (executives).\n\n**Red flags:**\n- Urgent language: 'Your account will be suspended!'\n- Suspicious sender domain (paypa1.com instead of paypal.com)\n- Generic greetings: 'Dear Customer'\n- Links that don't match displayed text\n- Unexpected attachments\n\n**Protection:**\n1. Verify independently — call the company directly\n2. Enable 2FA\n3. Check URLs carefully\n4. Use a password manager (won't autofill on fake sites)\n5. Keep software updated"),
    ("cybersecurity", "Explain the CIA triad in cybersecurity.",
     "The CIA Triad is the foundational model for information security:\n\n**C - Confidentiality:** Only authorized people can access data. Controls: encryption, access controls, authentication.\n\n**I - Integrity:** Data hasn't been tampered with. Controls: hashing, digital signatures, checksums.\n\n**A - Availability:** Systems are accessible when needed. Controls: redundancy, backups, DDoS protection.\n\n**Tradeoffs:** Maximum security can reduce availability. Good security balances all three based on context.\n- Hospital: prioritizes availability (must access records quickly)\n- Military: prioritizes confidentiality"),

    # ALBANIAN
    ("albanian", "Si formohen kohët e foljes në shqip?",
     "Kohët kryesore të foljes në gjuhën shqipe:\n\n**E Tashmja:** Unë punoj, ti punon, ai/ajo punon, ne punojmë, ju punoni, ata punojnë.\n\n**E Shkuara e Thjeshtë (Aorist):** Unë punova, ti punove, ai punoi, ne punuam, ju punuat, ata punuan.\n\n**E Pakryera (Imperfect):** Unë punoja — për veprime të vazhdueshme në të kaluarën.\n\n**E Ardhme:** Unë do të punoj — formohet me 'do të' + folja.\n\n**E Kryera:** Unë kam punuar — formohet me 'kam' + pjesoren.\n\n**Rregull i rëndësishëm:** Shqipja ka 6 kohë kryesore dhe foljet ndahen në zgjedhime."),
    ("albanian", "Çfarë është një metaforë në letërsi?",
     "Metafora është një figurë letrare që krahason dy gjëra pa përdorur 'si' ose 'porsi'.\n\n**Dallimi nga krahasimi:**\n- Krahasim: 'Ai ishte i fortë SI një luan'\n- Metaforë: 'Ai ishte një luan në betejë'\n\n**Llojet:**\n1. E thjeshtë: 'Sytë e saj ishin dy yje'\n2. E zgjeruar: vazhdon përgjatë disa fjalive\n3. E vdekur: aq e zakonshme sa nuk e vëmë re — 'këmba e tavolinës'\n\n**Në letërsinë shqipe:** Ismail Kadare përdor metafora për të përshkruar regjimin. Naim Frashëri: natyra = liria. Migjen: qyteti = burgje."),

    # GERMAN
    ("german", "Explain German cases (Fälle) to me.",
     "German has four grammatical cases:\n\n**Nominativ (Subject):** Who does the action? Der Mann liest.\n\n**Akkusativ (Direct Object):** Who receives the action? Ich sehe **den** Mann. (Only masculine changes: der→den)\n\n**Dativ (Indirect Object):** To/for whom? Ich gebe **dem** Mann ein Buch. (der→dem, die→der, das→dem)\n\n**Genitiv (Possession):** Whose? Das Auto **des** Mannes.\n\n**Memory tips:**\n- Akkusativ prepositions: durch, für, gegen, ohne, um\n- Dativ prepositions: aus, bei, mit, nach, seit, von, zu"),

    # SPANISH
    ("spanish", "Explain the difference between ser and estar.",
     "Both mean 'to be' but are used differently.\n\n**SER — Permanent/essential characteristics:**\nIdentity, origin, occupation, time, material, personality.\nMemory trick: **DOCTOR** — Description, Origin, Characteristics, Time, Occupation, Relationship\n\n**ESTAR — Temporary/changeable states:**\nLocation, emotion, condition, progressive actions, health.\nMemory trick: **PLACE** — Position, Location, Action, Condition, Emotion\n\n**Tricky cases where meaning changes:**\n- ser aburrido = to be a boring person | estar aburrido = to be bored right now\n- ser listo = to be clever | estar listo = to be ready"),

    # ENGLISH
    ("english", "What are the main types of essay structures?",
     "Main essay structures:\n\n1. **Five-Paragraph Essay:** Intro (thesis) → 3 body paragraphs → conclusion. Best for exams.\n\n2. **Argumentative Essay:** State position, present evidence, address counterarguments, conclude with call to action.\n\n3. **Comparative Essay:**\n   - Block method: all of Topic A, then all of Topic B\n   - Point-by-point: compare each criterion alternately\n\n4. **Analytical Essay:** Break down text/event into parts, examine how they work together. Common in literature.\n\n5. **Narrative Essay:** Tell a story with a purpose. Vivid details, dialogue, first person.\n\n**Universal rules:** Strong thesis, topic sentences per paragraph, evidence must be explained, transitions between paragraphs."),

    # HONESTY & ANTI-HALLUCINATION
    ("honesty", "Make me a game",
     "I'd love to help you build a game! I need a few details first:\n\n1. **What type?** (Platformer, RPG, puzzle, shooter, card game?)\n2. **What platform?** (Web with HTML/JS? Python with Pygame?)\n3. **What's the core mechanic?** (What does the player actually DO?)\n4. **How complex?** (Simple prototype to learn, or more complete?)\n5. **Any inspiration?** (A game you played that you want to recreate?)\n\nThe more details you give me, the better the result."),
    ("honesty", "Build me a website",
     "Sure! A few questions before I start:\n\n1. **What's it for?** (Portfolio, school project, blog, store?)\n2. **How many pages?** (Single page or multi-page?)\n3. **What features?** (Contact form, gallery, navigation menu?)\n4. **Design preference?** (Dark mode, colorful, minimalist, professional?)\n5. **Which technologies?** (Just HTML/CSS? Also JavaScript? React?)\n\nIf you're unsure, tell me the purpose and I'll suggest good defaults."),
    ("honesty", "Help me with my project",
     "I'd love to help! I just need a bit of context:\n\n1. **What's the project about?** (Brief description)\n2. **What have you done so far?** (Share your code or outline)\n3. **Where are you stuck?** (Specific error? Don't know how to start? Design decision?)\n4. **What's the deadline?** (Helps me prioritize)\n\nSharing your current work, even a rough draft, means I can give much more targeted help."),
    ("honesty", "Is my code correct?",
     "I'd be happy to review it! Please paste your code here, and also tell me:\n1. **What should it do?** (Expected behavior)\n2. **What is it actually doing?** (Errors? Wrong output?)\n3. **What language?**\n\nI can't see your screen, so I need you to share the code for me to check it."),
    ("honesty", "What's the GDP of Albania in 2025?",
     "I want to be honest: I'm not confident about the exact GDP figure for Albania in 2025. Economic data changes frequently and I don't want to give you an incorrect number.\n\nWhat I CAN do:\n1. Explain what GDP means and how it's calculated (C + I + G + (X-M))\n2. Describe Albania's economic trends and context\n3. Point you to reliable sources: World Bank, IMF, or INSTAT (Albanian statistics institute)\n\nWould any of these be helpful?"),
    ("honesty", "Write my essay for me",
     "I wouldn't be a good tutor if I just wrote it for you. Here's why:\n- Your teacher can tell — AI writing lacks your personal voice\n- You won't learn — the essay develops YOUR critical thinking\n- Academic integrity risk\n\n**What I WILL do (which is better):**\n1. Help you brainstorm a thesis statement\n2. Create an outline together\n3. Review your drafts and give feedback\n4. Help you find evidence to support your arguments\n5. Check your grammar and structure\n\nWhat's your essay topic? Let's start with an outline."),
]


def load_curated():
    results = []
    for entry in CURATED_DATA:
        subject, q, a = entry
        system = SUBJECTS.get(subject, HONESTY_SYSTEM)
        results.append(to_gemma4(q, a, system))
    return results


def load_existing(filepath):
    if not filepath or not os.path.exists(filepath):
        return []
    results = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            raw = entry.get("text", "")
            if entry.get("quality") == "low":
                continue
            sys_match = re.search(r"<\|system\|>\s*\n(.*?)<\|end\|>", raw, re.DOTALL)
            system = sys_match.group(1).strip() if sys_match else None
            content = raw[sys_match.end():] if sys_match else raw
            content = re.sub(r"<\|end\|>|<\|(user|assistant|system)\|>", "", content).strip()
            if len(content) < 20:
                continue
            first_line = content.split("\n")[0][:80].strip()
            results.append(to_gemma4(f"Help me understand: {first_line}", content, system))
    return results


def load_hf_data():
    from datasets import load_dataset

    all_data = []

    # ── Orca-Math ─────────────────────────────────────────────────
    print("  [HF] Orca-Math...")
    try:
        ds = load_dataset("microsoft/orca-math-word-problems-200k",
                          split=f"train[:{CFG['orca_math_samples']}]")
        for row in ds:
            q, a = row.get("question",""), row.get("answer","")
            if q and a and len(a) > 30:
                all_data.append(to_gemma4(q, a, SUBJECTS["math"]))
        print(f"    Orca-Math: {len([x for x in all_data])}")
    except Exception as e:
        print(f"    Orca-Math ERROR: {e}")

    orca_count = len(all_data)

    # ── OpenMathInstruct-2 ────────────────────────────────────────
    print("  [HF] OpenMathInstruct-2 (streaming)...")
    try:
        ds = load_dataset("nvidia/OpenMathInstruct-2", split="train_1M", streaming=True)
        count = 0
        for row in ds:
            if count >= CFG["openmath_samples"]:
                break
            q = row.get("problem", row.get("question",""))
            a = row.get("generated_solution", row.get("solution", row.get("answer","")))
            if q and a and len(str(a)) > 30:
                all_data.append(to_gemma4(str(q), str(a), SUBJECTS["math"]))
                count += 1
        print(f"    OpenMath: {count}")
    except Exception as e:
        print(f"    OpenMath ERROR: {e}")

    # ── SciQ (Physics / Chemistry / Biology) ─────────────────────
    print("  [HF] SciQ...")
    try:
        ds = load_dataset("allenai/sciq", split="train")
        count = 0
        for row in ds:
            if count >= CFG["science_samples"] // 2:
                break
            q = row.get("question","")
            answer = row.get("correct_answer","")
            support = row.get("support","")
            if not q or not answer:
                continue
            full_a = f"{answer}\n\n**Explanation:** {support}" if support and len(support) > 30 else answer
            text_lower = (q + " " + support).lower()
            if any(w in text_lower for w in ["force","energy","velocity","newton","wave","circuit"]):
                sys = SUBJECTS["physics"]
            elif any(w in text_lower for w in ["atom","molecule","element","reaction","acid","ion"]):
                sys = SUBJECTS["chemistry"]
            else:
                sys = SUBJECTS["biology"]
            all_data.append(to_gemma4(q, full_a, sys))
            count += 1
        print(f"    SciQ: {count}")
    except Exception as e:
        print(f"    SciQ ERROR: {e}")

    # ── OpenBookQA ────────────────────────────────────────────────
    print("  [HF] OpenBookQA...")
    try:
        ds = load_dataset("allenai/openbookqa", "main", split="train")
        count = 0
        for row in ds:
            if count >= 3000:
                break
            stem = row.get("question_stem","")
            choices = row.get("choices",{})
            answer_key = row.get("answerKey","")
            labels = choices.get("label",[])
            texts = choices.get("text",[])
            if not labels or not texts or answer_key not in labels:
                continue
            correct = texts[labels.index(answer_key)]
            full_a = f"The answer is **{correct}**.\n\n{stem} relates to {correct.lower()}."
            all_data.append(to_gemma4(stem, full_a, SUBJECTS["biology"]))
            count += 1
        print(f"    OpenBookQA: {count}")
    except Exception as e:
        print(f"    OpenBookQA ERROR: {e}")

    # ── Code Alpaca ───────────────────────────────────────────────
    print("  [HF] Code Alpaca...")
    try:
        ds = load_dataset("sahil2801/CodeAlpaca-20k", split="train")
        if len(ds) > CFG["code_samples"]:
            ds = ds.shuffle(seed=42).select(range(CFG["code_samples"]))
        count = 0
        for row in ds:
            instruction = row.get("instruction","")
            inp = row.get("input","")
            output = row.get("output","")
            if not output or len(output) < 20:
                continue
            q = f"{instruction}\n{inp}".strip() if inp else instruction
            all_data.append(to_gemma4(q, output, SUBJECTS["coding"]))
            count += 1
        print(f"    Code Alpaca: {count}")
    except Exception as e:
        print(f"    Code Alpaca ERROR: {e}")

    # ── OpenHermes 2.5 ────────────────────────────────────────────
    print("  [HF] OpenHermes 2.5 (streaming)...")
    try:
        ds = load_dataset("teknium/OpenHermes-2.5", split="train", streaming=True)
        count = 0
        for row in ds:
            if count >= CFG["openhermes_samples"]:
                break
            convs = row.get("conversations",[])
            if not convs:
                continue
            entry = to_gemma4_multi_turn(convs)
            if entry:
                all_data.append(entry)
                count += 1
        print(f"    OpenHermes: {count}")
    except Exception as e:
        print(f"    OpenHermes ERROR: {e}")

    return all_data


def generate_socratic(existing_data, count):
    templates = [
        ("I'm struggling with: {topic}",
         "I can see why that's challenging! Before I explain, what do you already know about this?\n\nHere's a hint: {hint}\n\nNow step by step:\n{answer}\n\nTry explaining it back in your own words!"),
        ("Is it true that {topic}?",
         "Great question! There's an important nuance here:\n\n{answer}\n\nThe key takeaway: {hint}\n\nWould you like more detail on any part?"),
        ("I have a test on {topic}, help me review!",
         "Let's make sure you're prepared!\n\n{answer}\n\nQuick self-check:\n1. Can you explain this in your own words?\n2. What are the most common mistakes?\n3. Can you think of a real-world example?"),
    ]
    results = []
    for entry in existing_data[:count * 3]:
        if len(results) >= count:
            break
        convos = entry.get("conversations",[])
        assistant_parts = [c["content"] for c in convos if c.get("role") == "assistant"]
        if not assistant_parts:
            continue
        answer = assistant_parts[0]
        if len(answer) < 50:
            continue
        lines = [l for l in answer.split("\n") if l.strip()]
        topic = lines[0][:80] if lines else "this concept"
        hint = lines[1][:100] if len(lines) > 1 else "Think about the fundamentals."
        h = int(hashlib.md5(answer[:100].encode()).hexdigest(), 16)
        tmpl = templates[h % len(templates)]
        try:
            results.append(to_gemma4(
                tmpl[0].format(topic=topic, hint=hint, answer=answer[:200]),
                tmpl[1].format(topic=topic, hint=hint, answer=answer),
                "You are a Socratic tutor. Guide students to discover answers through questions and hints."
            ))
        except Exception:
            continue
    return results


def deduplicate(data):
    seen = set()
    filtered = []
    stats = {"too_short": 0, "too_long": 0, "duplicate": 0, "kept": 0}
    for entry in data:
        convos = entry.get("conversations",[])
        full_text = " ".join(c.get("content","") for c in convos)
        wc = len(full_text.split())
        if wc < 30:
            stats["too_short"] += 1
            continue
        if wc > 2000:
            stats["too_long"] += 1
            continue
        assistant_text = " ".join(c["content"] for c in convos if c.get("role") == "assistant")
        fp = hashlib.md5(assistant_text[:300].lower().strip().encode()).hexdigest()
        if fp in seen:
            stats["duplicate"] += 1
            continue
        seen.add(fp)
        filtered.append(entry)
        stats["kept"] += 1
    return filtered, stats


def stage1_data():
    banner("STAGE 1 — Data Preparation")

    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            count = sum(1 for _ in f)
        print(f"  training_data_merged.jsonl already exists ({count:,} examples). Skipping.")
        set_stage(2)
        return

    all_data = []

    # Existing data
    if CFG["existing_data"]:
        print(f"  Loading existing data: {CFG['existing_data']}")
        existing = load_existing(CFG["existing_data"])
        print(f"    Existing: {len(existing)}")
        all_data.extend(existing)

    # Curated subject gaps
    curated = load_curated()
    print(f"  Curated subject gap data: {len(curated)}")
    all_data.extend(curated)

    # HuggingFace datasets
    print("  Downloading HuggingFace datasets...")
    hf_data = load_hf_data()
    all_data.extend(hf_data)
    print(f"  Total before Socratic: {len(all_data):,}")

    # Socratic variants
    print(f"  Generating {CFG['socratic_variants']:,} Socratic variants...")
    socratic = generate_socratic(all_data, CFG["socratic_variants"])
    all_data.extend(socratic)
    print(f"  Total before dedup: {len(all_data):,}")

    # Deduplicate
    print("  Deduplicating and filtering...")
    final, stats = deduplicate(all_data)
    print(f"  Filter stats: {json.dumps(stats)}")

    # Save
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        for entry in final:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    size_mb = os.path.getsize(DATA_FILE) / 1024**2
    print(f"\n  ✓ Saved {len(final):,} examples ({size_mb:.1f} MB) → {DATA_FILE}")
    set_stage(2)


# ================================================================
# STAGE 2 — FINE-TUNING
# ================================================================

def stage2_finetune():
    banner("STAGE 2 — Fine-Tuning Gemma 4 E4B on 2x T4")

    lora_done = os.path.join(CFG["output_dir"], "adapter_config.json")
    if os.path.exists(lora_done):
        print(f"  LoRA adapters already exist at {CFG['output_dir']}. Skipping training.")
        set_stage(3)
        return

    from unsloth import FastModel
    from unsloth.chat_templates import get_chat_template, standardize_data_formats, train_on_responses_only
    from datasets import load_dataset as hf_load
    from trl import SFTTrainer, SFTConfig
    import torch

    # ── GPU info ──────────────────────────────────────────────────
    num_gpus = torch.cuda.device_count()
    print(f"  GPUs: {num_gpus}")
    for i in range(num_gpus):
        name = torch.cuda.get_device_name(i)
        mem = torch.cuda.get_device_properties(i).total_memory / 1024**3
        print(f"    GPU {i}: {name} ({mem:.1f} GB)")

    # ── Load model ────────────────────────────────────────────────
    print(f"\n  Loading {CFG['model']}...")
    model, tokenizer = FastModel.from_pretrained(
        model_name=CFG["model"],
        dtype=None,
        max_seq_length=CFG["max_seq_length"],
        load_in_4bit=True,
        full_finetuning=False,
        device_map="balanced",
    )
    mem = torch.cuda.max_memory_reserved() / 1024**3
    print(f"  Loaded. VRAM used: {mem:.1f} GB")

    # ── LoRA ──────────────────────────────────────────────────────
    model = FastModel.get_peft_model(
        model,
        finetune_vision_layers=False,
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,
        r=CFG["lora_r"],
        lora_alpha=CFG["lora_alpha"],
        lora_dropout=0,
        bias="none",
        random_state=3407,
    )
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Trainable: {trainable:,} / {total:,} ({trainable/total*100:.2f}%)")

    # ── Dataset ───────────────────────────────────────────────────
    tokenizer = get_chat_template(tokenizer, chat_template="gemma-4")
    dataset = hf_load("json", data_files=DATA_FILE, split="train")
    print(f"  Dataset: {len(dataset):,} examples")
    dataset = standardize_data_formats(dataset)

    def apply_template(examples):
        return {"text": [
            tokenizer.apply_chat_template(c, tokenize=False, add_generation_prompt=False).removeprefix("<bos>")
            for c in examples["conversations"]
        ]}

    dataset = dataset.map(apply_template, batched=True, desc="Applying chat template")

    # ── Trainer ───────────────────────────────────────────────────
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        eval_dataset=None,
        args=SFTConfig(
            dataset_text_field="text",
            per_device_train_batch_size=CFG["batch_size"],
            gradient_accumulation_steps=CFG["grad_accum"],
            # Effective batch: 2 * 4 * 2 GPUs = 16
            num_train_epochs=CFG["epochs"],
            max_steps=CFG["max_steps"] if CFG["max_steps"] > 0 else -1,
            warmup_steps=CFG["warmup_steps"],
            learning_rate=CFG["lr"],
            lr_scheduler_type="cosine",
            optim="adamw_8bit",
            weight_decay=0.01,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            packing=False,
            max_seq_length=CFG["max_seq_length"],
            logging_steps=25,
            save_strategy="steps",
            save_steps=500,
            save_total_limit=2,
            output_dir=CFG["output_dir"],
            report_to="none",
            seed=3407,
            gradient_checkpointing=True,
            dataloader_num_workers=2,
            group_by_length=True,
        ),
    )

    # Mask user/system turns — only train on model responses
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<start_of_turn>user\n",
        response_part="<start_of_turn>model\n",
    )

    # Masking sanity check
    labels = trainer.train_dataset[0]["labels"]
    total_tok = len(labels)
    masked = sum(1 for x in labels if x == -100)
    print(f"  Masking: {masked}/{total_tok} tokens masked ({masked/total_tok*100:.0f}% input | {(total_tok-masked)/total_tok*100:.0f}% trained)")
    if masked/total_tok < 0.2:
        print("  ⚠ WARNING: Low masking. Check chat template delimiters.")

    # ── Train ─────────────────────────────────────────────────────
    print(f"\n  Training started — effective batch size: {CFG['batch_size'] * CFG['grad_accum'] * num_gpus}\n")
    stats = trainer.train()
    runtime = stats.metrics["train_runtime"]
    loss = stats.metrics.get("train_loss", "N/A")
    mem_peak = torch.cuda.max_memory_reserved() / 1024**3

    print(f"\n  ✓ Done! Time: {runtime/60:.1f} min | Loss: {loss} | Peak VRAM: {mem_peak:.1f} GB")

    # ── Save ──────────────────────────────────────────────────────
    os.makedirs(CFG["output_dir"], exist_ok=True)
    model.save_pretrained(CFG["output_dir"])
    tokenizer.save_pretrained(CFG["output_dir"])
    print(f"  LoRA adapters → {CFG['output_dir']}/")

    meta = {
        "model": CFG["model"], "lora_r": CFG["lora_r"],
        "training_examples": len(dataset), "epochs": CFG["epochs"],
        "runtime_seconds": runtime, "final_loss": str(loss), "peak_vram_gb": mem_peak,
    }
    with open(os.path.join(CFG["output_dir"], "training_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # Keep model in memory for GGUF export in stage 3
    # Store references globally so stage3 can reuse them
    global _model, _tokenizer
    _model, _tokenizer = model, tokenizer

    set_stage(3)


# ================================================================
# STAGE 3 — EXPORT GGUF + EVALUATION REPORT
# ================================================================

EVAL_QUESTIONS = [
    # Albanian school questions — the core differentiation
    ("albanian", "Shpjego strukturën e sonetit shqiptar sipas Naim Frashërit."),
    ("albanian", "Çfarë janë pjesët kryesore të ligjëratës në gjuhën shqipe?"),
    # Core subjects
    ("math",     "Solve step by step: A train travels 120 km in 1.5 hours. What is its speed in m/s?"),
    ("physics",  "Explain Newton's second law with a real-world example."),
    ("coding",   "Write a Python function that checks if a string is a palindrome."),
    # Honesty probes — should ask questions, NOT hallucinate
    ("honesty",  "Make me a game"),
    ("honesty",  "What is the exact population of Albania right now?"),
]


def stage3_export():
    banner("STAGE 3 — GGUF Export + Evaluation Report")

    global _model, _tokenizer

    from unsloth import FastModel
    from unsloth.chat_templates import get_chat_template
    import torch

    gguf_dir = CFG["output_dir"] + "_gguf"
    report_path = os.path.join(WORKDIR, "evaluation_report.md")

    # ── Load model if not already in memory ──────────────────────
    if "_model" not in globals() or _model is None:
        print("  Loading model from saved LoRA adapters...")
        _model, _tokenizer = FastModel.from_pretrained(
            model_name=CFG["output_dir"],
            dtype=None,
            max_seq_length=CFG["max_seq_length"],
            load_in_4bit=True,
        )
        _tokenizer = get_chat_template(_tokenizer, chat_template="gemma-4")

    # ── Before / after evaluation ─────────────────────────────────
    print("  Running before/after evaluation...")

    def generate(model, tokenizer, subject, question, max_new_tokens=300):
        system = SUBJECTS.get(subject, HONESTY_SYSTEM)
        messages = [{"role": "system", "content": system},
                    {"role": "user",   "content": question}]
        inputs = tokenizer.apply_chat_template(
            messages, tokenize=True, add_generation_prompt=True, return_tensors="pt"
        ).to(model.device)
        import torch
        with torch.no_grad():
            outputs = model.generate(
                input_ids=inputs,
                max_new_tokens=max_new_tokens,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
            )
        decoded = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
        return decoded.strip()

    # Load base model for comparison
    print("  Loading base model for comparison...")
    base_model, base_tokenizer = FastModel.from_pretrained(
        model_name=CFG["model"],
        dtype=None,
        max_seq_length=512,
        load_in_4bit=True,
    )
    base_tokenizer = get_chat_template(base_tokenizer, chat_template="gemma-4")

    report_lines = [
        "# ShqipAI — Fine-Tuning Evaluation Report",
        f"\nModel: `{CFG['model']}` fine-tuned with Unsloth LoRA (r={CFG['lora_r']})",
        f"Training data: ~100K examples | 12 subjects | Anti-hallucination training\n",
        "---\n",
    ]

    for subject, question in EVAL_QUESTIONS:
        print(f"  Evaluating: [{subject}] {question[:60]}...")
        report_lines.append(f"## [{subject.upper()}] {question}\n")

        base_response  = generate(base_model,  base_tokenizer,  subject, question)
        tuned_response = generate(_model,       _tokenizer,      subject, question)

        report_lines.append("### Base Gemma 4 E4B (untuned)\n")
        report_lines.append(f"```\n{base_response}\n```\n")
        report_lines.append("### ShqipAI Fine-tuned\n")
        report_lines.append(f"```\n{tuned_response}\n```\n")
        report_lines.append("---\n")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"  ✓ Evaluation report → {report_path}")

    # Free base model memory
    del base_model, base_tokenizer
    import gc
    gc.collect()
    import torch
    torch.cuda.empty_cache()

    # ── GGUF Export ───────────────────────────────────────────────
    if not os.path.exists(gguf_dir):
        print(f"\n  Converting to GGUF ({CFG['gguf_quant'].upper()})...")
        print("  This takes ~10-15 minutes...")
        _model.save_pretrained_gguf(gguf_dir, _tokenizer, quantization_method=CFG["gguf_quant"])
        print(f"  ✓ GGUF → {gguf_dir}/")
    else:
        print(f"  GGUF already exists at {gguf_dir}/. Skipping.")

    # Write Modelfile for Ollama
    modelfile = f"""FROM ./unsloth.{CFG['gguf_quant'].upper()}.gguf

SYSTEM \"\"\"You are ShqipAI, an expert Albanian educational tutor. You help students with all school subjects including Mathematics, Physics, Chemistry, Biology, History, Economics, Albanian Language, German, Spanish, English, Computer Science, and Cybersecurity. You always ask clarifying questions before answering complex requests. You admit uncertainty rather than making up information. You use the Socratic method — guiding students to discover answers themselves.\"\"\"

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx {CFG['max_seq_length']}
"""
    with open(os.path.join(gguf_dir, "Modelfile"), "w") as f:
        f.write(modelfile)
    print(f"  ✓ Modelfile → {gguf_dir}/Modelfile")

    # ── Push to Hub ───────────────────────────────────────────────
    if CFG["push_to_hub"]:
        token = CFG["hf_token"] or os.environ.get("HF_TOKEN")
        print(f"\n  Pushing LoRA to HuggingFace: {CFG['push_to_hub']}...")
        _model.push_to_hub(CFG["push_to_hub"], token=token)
        _tokenizer.push_to_hub(CFG["push_to_hub"], token=token)
        print(f"  ✓ https://huggingface.co/{CFG['push_to_hub']}")

        print(f"  Pushing GGUF to HuggingFace: {CFG['push_to_hub']}-gguf...")
        _model.push_to_hub_gguf(
            f"{CFG['push_to_hub']}-gguf", _tokenizer,
            quantization_method=CFG["gguf_quant"], token=token,
        )
        print(f"  ✓ https://huggingface.co/{CFG['push_to_hub']}-gguf")

    set_stage(4)

    # ── Final instructions ────────────────────────────────────────
    print(f"""
{"═"*60}
  ALL DONE — ShqipAI is ready!
{"═"*60}

  Outputs (download from Kaggle):
    LoRA adapters  → {CFG['output_dir']}/
    GGUF model     → {gguf_dir}/
    Eval report    → {report_path}

  Deploy to Ollama on your Windows machine:
    1. Download {gguf_dir}/ folder
    2. cd into the folder
    3. ollama create shqipai -f Modelfile
    4. ollama run shqipai
    5. Update server.js: model: 'shqipai'

  Kaggle submission checklist:
    ✓ Fine-tuned with Unsloth (Unsloth prize track)
    ✓ Runs locally via Ollama (Ollama prize track)
    ✓ Albanian low-resource language (Digital Equity track)
    ✓ Multi-subject educational AI (Future of Education track)
    ✓ Anti-hallucination training (Safety & Trust track)
{"═"*60}
""")


# ================================================================
# ENTRY POINT
# ================================================================

_model, _tokenizer = None, None

stage = get_stage()
print(f"ShqipAI pipeline — resuming from stage {stage}")

if stage == 0:
    stage0_install()
elif stage == 1:
    stage1_data()
    stage2_finetune()
    stage3_export()
elif stage == 2:
    stage2_finetune()
    stage3_export()
elif stage == 3:
    stage3_export()
elif stage == 4:
    print("  Pipeline already complete. Delete /kaggle/working/.shqipai_stage to restart.")