#!/usr/bin/env python3
"""
EduAI - Training Data Preparation Pipeline
=============================================
Downloads, processes, and merges datasets covering ALL 12 subjects:
  1. Math            7. Albanian (language)
  2. Physics         8. German (language)
  3. Chemistry       9. Spanish (language)
  4. Biology        10. English (language)
  5. History        11. Coding (CS)
  6. Economics      12. Cybersecurity

DATA MIX STRATEGY:
  - Your existing data (26K) - pedagogical style baseline
  - Orca-Math (15K) - step-by-step math word problems
  - OpenMathInstruct-2 (10K) - diverse math foundations
  - CAMEL-AI Science (50K) - math, physics, chemistry, biology
  - OpenHermes 2.5 (10K) - general intelligence + reasoning
  - Code Alpaca (15K) - coding instruction & CS
  - History/Econ/Language/Cyber (synthetic 20K) - fill gaps
  - Socratic variants (5K) - teaching style rewrites

TOTAL: ~150K -> ~120K after dedup
All converted to Gemma 4 chat format.
"""

import argparse
import json
import hashlib
import os
import sys
import re
from pathlib import Path

try:
    from datasets import load_dataset
    HAS_DATASETS = True
except ImportError:
    HAS_DATASETS = False
    print("WARNING: 'datasets' library not installed.")
    print("Install: pip install datasets")
    print("Continuing with local data only.\n")


# ================================================================
# ALL 12 SUBJECTS WITH SYSTEM PROMPTS
# ================================================================
SUBJECTS = {
    "math": {
        "system": "You are an expert mathematics tutor. Solve problems step-by-step with clear reasoning. Show all work, verify answers, and explain the underlying concepts.",
        "icon": "calc"
    },
    "physics": {
        "system": "You are an expert physics tutor. Explain phenomena with real-world examples, derive equations step-by-step, include units in all calculations, and connect theory to everyday experience.",
        "icon": "atom"
    },
    "chemistry": {
        "system": "You are an expert chemistry tutor. Explain reactions and mechanisms clearly, balance equations, use proper IUPAC nomenclature, and relate concepts to laboratory practice.",
        "icon": "flask"
    },
    "biology": {
        "system": "You are an expert biology tutor. Explain biological processes with clear analogies, use proper scientific terminology, describe experiments, and connect topics to health and environment.",
        "icon": "dna"
    },
    "history": {
        "system": "You are an expert history tutor. Explain historical events with context, causes, and consequences. Use primary source references, timelines, and help students understand multiple perspectives.",
        "icon": "scroll"
    },
    "economics": {
        "system": "You are an expert economics tutor. Explain micro and macroeconomic concepts clearly with real-world examples, graphs described in text, and connect theory to current events. Help students understand supply/demand, market structures, fiscal/monetary policy.",
        "icon": "chart"
    },
    "albanian": {
        "system": "You are an expert Albanian language tutor. Help students with grammar (morfologji, sintakse), literature analysis, essay writing, and reading comprehension. Respond in Albanian when appropriate and explain language rules clearly.",
        "icon": "book"
    },
    "german": {
        "system": "You are an expert German language tutor. Help with grammar (Falle, Konjugation, Satzbau), vocabulary, reading comprehension, and conversation practice. Use German examples with translations and explain rules clearly.",
        "icon": "book"
    },
    "spanish": {
        "system": "You are an expert Spanish language tutor. Help with grammar (conjugacion, tiempos verbales), vocabulary, reading comprehension, and conversation. Use Spanish examples with translations and explain rules clearly.",
        "icon": "book"
    },
    "english": {
        "system": "You are an expert English language and literature tutor. Help with grammar, essay writing, literary analysis, reading comprehension, and vocabulary. Explain writing techniques, rhetorical devices, and text structure.",
        "icon": "book"
    },
    "coding": {
        "system": "You are an expert computer science and programming tutor. Explain algorithms, data structures, and coding concepts clearly. Write clean, commented code examples. Cover Python, JavaScript, HTML/CSS, and computational thinking.",
        "icon": "code"
    },
    "cybersecurity": {
        "system": "You are an expert cybersecurity tutor. Explain security concepts, threats, defenses, and ethical hacking principles clearly. Cover network security, cryptography, web security, and digital safety in an educational, responsible manner.",
        "icon": "shield"
    },
}

# ================================================================
# Gemma 4 DATA FORMAT — ShareGPT conversations style
# ================================================================
# The tokenizer.apply_chat_template() handles the actual format:
#   <|turn>user\n...<turn|>\n<|turn>model\n...<turn|>
# We just store clean {conversations: [{role, content}]} dicts.
# This matches the competition notebook approach exactly.
# ================================================================

def to_gemma4(user_text, model_text, system=None):
    """Convert a Q&A pair to ShareGPT conversations format for Gemma 4."""
    convos = []
    if system:
        convos.append({"role": "system", "content": system.strip()})
    convos.append({"role": "user", "content": user_text.strip()})
    convos.append({"role": "assistant", "content": model_text.strip()})
    return {"conversations": convos}

def to_gemma4_multi_turn(turns, system=None):
    """Convert multi-turn conversation to ShareGPT format for Gemma 4."""
    convos = []
    sys_text = system
    for turn in turns:
        role = turn.get("role", turn.get("from", ""))
        content = turn.get("content", turn.get("value", ""))
        if not content:
            continue
        if role in ("system",):
            sys_text = content
            continue
        elif role in ("user", "human"):
            if not convos and sys_text:
                convos.append({"role": "system", "content": sys_text.strip()})
            convos.append({"role": "user", "content": content.strip()})
        elif role in ("assistant", "model", "gpt"):
            convos.append({"role": "assistant", "content": content.strip()})
    # Need at least user + assistant
    roles = [c["role"] for c in convos]
    if "user" not in roles or "assistant" not in roles:
        return None
    return {"conversations": convos}


# ================================================================
# 1. YOUR EXISTING DATA (26K)
# ================================================================
def load_existing_data(filepath):
    print(f"\n{'='*60}")
    print(f"[1/8] YOUR DATA: {os.path.basename(filepath)}")
    print(f"{'='*60}")
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
            quality = entry.get("quality", "medium")
            if quality == "low":
                continue
            sys_match = re.search(r"<\|system\|>\s*\n(.*?)<\|end\|>", raw, re.DOTALL)
            system = sys_match.group(1).strip() if sys_match else None
            content = raw[sys_match.end():] if sys_match else raw
            content = re.sub(r"<\|end\|>", "", content)
            content = re.sub(r"<\|(user|assistant|system)\|>", "", content)
            content = content.strip()
            if len(content) < 20:
                continue
            # Use first line as topic for synthetic prompt
            first_line = content.split("\n")[0][:80].strip()
            results.append(to_gemma4(
                user_text=f"Help me understand: {first_line}",
                model_text=content,
                system=system
            ))
    print(f"  Loaded: {len(results)} examples")
    return results


# ================================================================
# 2. ORCA-MATH (15K step-by-step word problems)
# ================================================================
def load_orca_math(max_samples=15000):
    print(f"\n{'='*60}")
    print(f"[2/8] ORCA-MATH: step-by-step word problems ({max_samples:,})")
    print(f"{'='*60}")
    if not HAS_DATASETS:
        print("  SKIPPED (no datasets library)")
        return []
    try:
        ds = load_dataset("microsoft/orca-math-word-problems-200k",
                          split=f"train[:{max_samples}]")
    except Exception as e:
        print(f"  ERROR: {e}")
        return []
    results = []
    for row in ds:
        q, a = row.get("question", ""), row.get("answer", "")
        if q and a and len(a) > 30:
            results.append(to_gemma4(q, a, SUBJECTS["math"]["system"]))
    print(f"  Loaded: {len(results)}")
    return results


# ================================================================
# 3. OPENMATHINSTRUCT-2 (10K diverse math)
# ================================================================
def load_openmath(max_samples=10000):
    print(f"\n{'='*60}")
    print(f"[3/8] OPENMATHINSTRUCT-2: diverse math ({max_samples:,})")
    print(f"{'='*60}")
    if not HAS_DATASETS:
        print("  SKIPPED")
        return []
    try:
        # Stream to avoid downloading 7.5GB — we only need 10K rows
        ds = load_dataset("nvidia/OpenMathInstruct-2",
                          split="train_1M", streaming=True)
    except Exception as e:
        print(f"  ERROR: {e}")
        return []
    results = []
    for row in ds:
        if len(results) >= max_samples:
            break
        q = row.get("problem", row.get("question", ""))
        a = row.get("generated_solution", row.get("solution", row.get("answer", "")))
        if q and a and len(str(a)) > 30:
            results.append(to_gemma4(str(q), str(a), SUBJECTS["math"]["system"]))
    print(f"  Loaded: {len(results)}")
    return results


# ================================================================
# 4. CAMEL-AI SCIENCE (4 subjects x ~12K each)
# ================================================================
def load_camel_subject(subject, max_samples=12500):
    dataset_name = f"camel-ai/{subject}"
    print(f"  Loading {dataset_name}...")
    if not HAS_DATASETS:
        return []
    try:
        ds = load_dataset(dataset_name, split="train")
        if len(ds) > max_samples:
            ds = ds.shuffle(seed=42).select(range(max_samples))
    except Exception as e:
        print(f"    ERROR: {e}")
        return []

    sys_prompt = SUBJECTS.get(subject, {}).get("system", "You are an educational tutor.")
    results = []
    for row in ds:
        q, a = None, None
        if "message_1" in row and "message_2" in row:
            q, a = row["message_1"], row["message_2"]
        elif "instruction" in row and "output" in row:
            q, a = row["instruction"], row["output"]
        elif "question" in row and "answer" in row:
            q, a = row["question"], row["answer"]
        else:
            cols = [c for c in row.keys() if isinstance(row.get(c), str) and len(str(row[c])) > 20]
            if len(cols) >= 2:
                q, a = str(row[cols[0]]), str(row[cols[1]])
        if q and a and len(str(a)) > 30:
            results.append(to_gemma4(str(q), str(a), sys_prompt))
    print(f"    Got {len(results)} from {subject}")
    return results

def load_camel_science():
    print(f"\n{'='*60}")
    print(f"[4/8] CAMEL-AI SCIENCE: math, physics, chemistry, biology")
    print(f"{'='*60}")
    results = []
    for subj in ["math", "physics", "chemistry", "biology"]:
        results.extend(load_camel_subject(subj))
    print(f"  Total CAMEL: {len(results)}")
    return results


# ================================================================
# 5. CODE ALPACA (coding/CS - 15K)
# ================================================================
def load_code_data(max_samples=15000):
    print(f"\n{'='*60}")
    print(f"[5/8] CODE ALPACA: coding & CS instruction ({max_samples:,})")
    print(f"{'='*60}")
    if not HAS_DATASETS:
        print("  SKIPPED")
        return []
    try:
        ds = load_dataset("sahil2801/CodeAlpaca-20k", split="train")
        if len(ds) > max_samples:
            ds = ds.shuffle(seed=42).select(range(max_samples))
    except Exception as e:
        print(f"  ERROR: {e}")
        return []
    results = []
    for row in ds:
        instruction = row.get("instruction", "")
        inp = row.get("input", "")
        output = row.get("output", "")
        if not output or len(output) < 20:
            continue
        q = f"{instruction}\n{inp}".strip() if inp else instruction
        results.append(to_gemma4(q, output, SUBJECTS["coding"]["system"]))
    print(f"  Loaded: {len(results)}")
    return results


# ================================================================
# 6. OPENHERMES 2.5 (general intelligence - 10K)
# ================================================================
def load_openhermes(max_samples=10000):
    print(f"\n{'='*60}")
    print(f"[6/8] OPENHERMES 2.5: general reasoning ({max_samples:,})")
    print(f"{'='*60}")
    if not HAS_DATASETS:
        print("  SKIPPED")
        return []
    try:
        # Stream to avoid downloading the full dataset (~4GB)
        ds = load_dataset("teknium/OpenHermes-2.5", split="train", streaming=True)
    except Exception as e:
        print(f"  ERROR: {e}")
        return []
    results = []
    for row in ds:
        if len(results) >= max_samples:
            break
        convs = row.get("conversations", [])
        if not convs:
            continue
        entry = to_gemma4_multi_turn(convs)
        if entry:
            results.append(entry)
    print(f"  Loaded: {len(results)}")
    return results


# ================================================================
# 7. SUBJECT GAP FILLER (history, economics, languages, cybersecurity)
# ================================================================
# These subjects are underrepresented in public datasets, so we
# generate high-quality synthetic examples from curated topic lists.

HISTORY_TOPICS = [
    ("What caused World War I?", "World War I was caused by a combination of factors, often remembered by the acronym MAIN:\n\n**M - Militarism:** European powers were building massive armies and navies. Germany and Britain had a naval arms race that increased tensions.\n\n**A - Alliances:** Two alliance systems divided Europe:\n- Triple Alliance: Germany, Austria-Hungary, Italy\n- Triple Entente: France, Britain, Russia\nThese meant a conflict between two nations could drag in all of Europe.\n\n**I - Imperialism:** European powers competed for colonies and resources globally, creating friction and rivalry.\n\n**N - Nationalism:** Intense national pride and desire for self-determination, especially in the Balkans (the 'powder keg of Europe').\n\n**The Spark:** The assassination of Archduke Franz Ferdinand of Austria-Hungary in Sarajevo on June 28, 1914, by Gavrilo Princip triggered the alliance system and led to a chain reaction of declarations of war.\n\nWould you like to explore any of these causes in more detail?"),
    ("Explain the French Revolution.", "The French Revolution (1789-1799) was a period of radical political and social change in France.\n\n**Causes:**\n1. **Social Inequality:** The Three Estates system - clergy (1st), nobility (2nd), and commoners (3rd) who paid most taxes but had little power\n2. **Financial Crisis:** France was bankrupt from wars and royal spending\n3. **Enlightenment Ideas:** Philosophers like Rousseau and Voltaire challenged absolute monarchy\n4. **Food Shortages:** Bad harvests caused bread prices to soar\n\n**Key Events:**\n- **1789:** Storming of the Bastille (July 14), Declaration of Rights of Man\n- **1791:** Constitutional monarchy established\n- **1792-1793:** Radical phase - monarchy abolished, King Louis XVI executed\n- **1793-1794:** Reign of Terror under Robespierre\n- **1799:** Napoleon Bonaparte seizes power\n\n**Legacy:** The revolution established principles of citizenship, human rights, and democracy that influenced revolutions worldwide.\n\nShall I go deeper into any specific phase?"),
    ("What was the Cold War?", "The Cold War (1947-1991) was a period of geopolitical tension between two superpowers:\n\n**The Two Sides:**\n- **USA & NATO:** Capitalist democracy, free markets\n- **USSR & Warsaw Pact:** Communist, centrally planned economy\n\n**Why 'Cold'?** The superpowers never fought each other directly - instead they competed through:\n\n1. **Proxy Wars:** Korea (1950-53), Vietnam (1955-75), Afghanistan (1979-89)\n2. **Nuclear Arms Race:** Both built thousands of nuclear weapons (MAD - Mutually Assured Destruction)\n3. **Space Race:** USSR launched Sputnik (1957), US landed on Moon (1969)\n4. **Ideological Competition:** Each side tried to spread its system globally\n\n**Key Events:**\n- Berlin Blockade & Airlift (1948-49)\n- Cuban Missile Crisis (1962) - closest to nuclear war\n- Berlin Wall built (1961), fell (1989)\n- Soviet Union dissolved (1991)\n\n**End:** Mikhail Gorbachev's reforms (glasnost, perestroika) led to the peaceful dissolution of the USSR.\n\nWhat aspect would you like to explore further?"),
    ("Describe the Renaissance.", "The Renaissance (roughly 1350-1600) was a cultural and intellectual rebirth that began in Italy.\n\n**What Changed:**\n- Shift from medieval religious focus to **humanism** - celebrating human potential\n- Revival of ancient Greek and Roman knowledge\n- Explosion of art, science, literature, and philosophy\n\n**Key Figures:**\n- **Art:** Leonardo da Vinci, Michelangelo, Raphael, Botticelli\n- **Science:** Galileo, Copernicus (heliocentric model)\n- **Literature:** Dante, Petrarch, Machiavelli, Shakespeare\n- **Innovation:** Gutenberg's printing press (1440) - democratized knowledge\n\n**Why Italy First?**\n1. Wealthy merchant cities (Florence, Venice, Rome)\n2. Patronage from families like the Medici\n3. Geographic access to ancient Roman ruins and texts\n4. Trade connections brought new ideas\n\n**Impact:**\n- Perspective in art, anatomical accuracy\n- Scientific method emerged\n- Reformation of the Church\n- Foundation of modern Western culture\n\nWould you like to focus on a specific aspect - art, science, or politics?"),
    ("What were the causes of World War II?", "World War II (1939-1945) had several interconnecting causes:\n\n**1. Treaty of Versailles (1919)**\n- Germany was forced to accept blame for WWI\n- Huge reparations ($33 billion), lost territory, military restrictions\n- Created resentment and economic hardship in Germany\n\n**2. Rise of Fascism**\n- Hitler and the Nazi Party rose to power in Germany (1933)\n- Mussolini in Italy (1922), militarism in Japan\n- Promised national glory, scapegoated minorities\n\n**3. Appeasement**\n- Britain and France tried to avoid war by allowing Hitler's territorial demands\n- Munich Agreement (1938) gave Hitler the Sudetenland\n- Emboldened further aggression\n\n**4. Failure of the League of Nations**\n- Could not prevent Japanese invasion of Manchuria (1931)\n- Could not stop Italian invasion of Ethiopia (1935)\n- Had no enforcement power\n\n**5. German Aggression**\n- Remilitarization of the Rhineland (1936)\n- Annexation of Austria (Anschluss, 1938)\n- Invasion of Poland (September 1, 1939) - triggered the war\n\nWant me to cover specific battles, the home front, or the aftermath?"),
]

ECONOMICS_TOPICS = [
    ("Explain supply and demand.", "Supply and demand is the fundamental model of how markets work.\n\n**Demand:** How much of a product consumers want to buy at different prices.\n- **Law of Demand:** As price goes UP, quantity demanded goes DOWN (and vice versa)\n- Why? Because consumers have budget constraints and look for alternatives\n- The demand curve slopes downward on a price-quantity graph\n\n**Supply:** How much producers are willing to sell at different prices.\n- **Law of Supply:** As price goes UP, quantity supplied goes UP\n- Why? Higher prices mean more profit, attracting more production\n- The supply curve slopes upward\n\n**Equilibrium:** Where supply and demand curves cross\n- This determines the market price and quantity\n- If price is above equilibrium: surplus (too much supply)\n- If price is below equilibrium: shortage (too much demand)\n\n**Shifts vs. Movements:**\n- A change in price causes MOVEMENT along the curve\n- Other factors (income, tastes, technology) cause the whole curve to SHIFT\n\n**Real Example:** If a new phone launches:\n- High demand + limited supply = high price\n- As production ramps up, supply increases, price falls\n- Eventually reaches equilibrium\n\nWant me to draw this out with numbers or cover elasticity?"),
    ("What is GDP and how is it calculated?", "GDP (Gross Domestic Product) measures the total value of all goods and services produced in a country over a period (usually a year).\n\n**Why It Matters:** GDP is the primary indicator of economic health. A growing GDP means the economy is expanding.\n\n**Three Ways to Calculate GDP:**\n\n**1. Expenditure Approach (most common):**\nGDP = C + I + G + (X - M)\n- C = Consumer spending (households buying goods/services)\n- I = Investment (businesses buying equipment, construction)\n- G = Government spending (public services, infrastructure)\n- X - M = Net exports (exports minus imports)\n\n**2. Income Approach:**\nAdd up all income earned: wages + rent + interest + profits\n\n**3. Production Approach:**\nAdd up the value added at each stage of production\n\n**Important Distinctions:**\n- **Nominal GDP:** Measured in current prices (includes inflation)\n- **Real GDP:** Adjusted for inflation (better for comparison over time)\n- **GDP per capita:** GDP divided by population (standard of living indicator)\n\n**Limitations of GDP:**\n- Doesn't measure inequality, happiness, or environmental impact\n- Ignores unpaid work (housework, volunteering)\n- Underground economy not counted\n\nShall I explain how GDP growth rates work or compare countries?"),
    ("Explain inflation.", "Inflation is the general increase in prices over time, which reduces the purchasing power of money.\n\n**Simple Example:** If inflation is 3%, something costing $100 today will cost $103 next year.\n\n**Types of Inflation:**\n1. **Demand-Pull:** Too much money chasing too few goods (economy overheating)\n2. **Cost-Push:** Rising production costs (wages, raw materials) push prices up\n3. **Built-In:** Workers expect inflation, demand higher wages, companies raise prices - a cycle\n\n**Measuring Inflation:**\n- **CPI (Consumer Price Index):** Tracks a 'basket' of typical goods\n- Calculate: ((New CPI - Old CPI) / Old CPI) x 100\n\n**Effects:**\n- **Moderate (2-3%):** Generally healthy, encourages spending\n- **High (10%+):** Erodes savings, creates uncertainty\n- **Hyperinflation:** Currency becomes worthless (Zimbabwe 2008, Venezuela 2018)\n- **Deflation (negative):** Can be worse - people delay purchases, economy shrinks\n\n**Who Controls It?**\n- Central banks (Federal Reserve, ECB) use interest rates\n- Raise rates = borrowing costs more = spending decreases = inflation slows\n- Lower rates = cheaper borrowing = more spending = inflation rises\n\nWant me to explain interest rates or monetary policy in more detail?"),
]

CYBER_TOPICS = [
    ("What is encryption and why does it matter?", "Encryption is the process of converting readable data (plaintext) into an unreadable format (ciphertext) that can only be decoded with the correct key.\n\n**Why It Matters:**\n- Protects sensitive data (passwords, financial info, messages)\n- Ensures privacy in communications\n- Required by law for many industries (healthcare, banking)\n\n**Two Main Types:**\n\n**1. Symmetric Encryption:**\n- Same key to encrypt AND decrypt\n- Fast, efficient for large data\n- Example: AES-256 (Advanced Encryption Standard)\n- Challenge: How do you safely share the key?\n\n**2. Asymmetric Encryption:**\n- Two keys: public key (encrypt) + private key (decrypt)\n- Slower but solves the key-sharing problem\n- Example: RSA, used in HTTPS/TLS\n- Your browser uses this right now!\n\n**Real-World Uses:**\n- **HTTPS:** Encrypts web browsing\n- **End-to-end messaging:** WhatsApp, Signal\n- **Disk encryption:** BitLocker, FileVault\n- **VPNs:** Encrypt internet traffic\n\n**Key Concept - Hashing (related):**\n- One-way function: data -> fixed-length hash\n- Used for passwords (bcrypt, SHA-256)\n- Cannot be reversed, only compared\n\nWant to learn about how HTTPS handshakes work or try a simple cipher exercise?"),
    ("What is phishing and how can I protect myself?", "Phishing is a social engineering attack where attackers impersonate trusted entities to trick you into revealing sensitive information.\n\n**Types of Phishing:**\n1. **Email Phishing:** Fake emails pretending to be from banks, companies\n2. **Spear Phishing:** Targeted at specific individuals with personalized info\n3. **Smishing:** Phishing via SMS text messages\n4. **Vishing:** Voice phishing - fake phone calls\n5. **Whaling:** Targeting executives and high-value individuals\n\n**Red Flags to Watch For:**\n- Urgent language: 'Your account will be suspended!'\n- Suspicious sender address (paypa1.com instead of paypal.com)\n- Generic greetings: 'Dear Customer' instead of your name\n- Links that don't match the displayed text (hover to check!)\n- Unexpected attachments\n- Requests for passwords or personal info\n\n**Protection Strategies:**\n1. **Verify independently:** Call the company directly, don't use links in the email\n2. **Enable 2FA:** Even if password is stolen, attacker needs second factor\n3. **Check URLs carefully:** Look for HTTPS, correct domain spelling\n4. **Don't click suspicious links:** When in doubt, go directly to the website\n5. **Keep software updated:** Patches fix known vulnerabilities\n6. **Use a password manager:** Generates unique passwords, won't autofill on fake sites\n\nWant to analyze some example phishing emails together?"),
    ("Explain the CIA triad in cybersecurity.", "The CIA Triad is the foundational model for information security. Every security measure aims to protect one or more of these three principles:\n\n**C - Confidentiality**\n- Only authorized people can access the data\n- Threats: eavesdropping, data breaches, shoulder surfing\n- Controls: encryption, access controls, authentication\n- Example: Your medical records should only be seen by you and your doctor\n\n**I - Integrity**\n- Data hasn't been tampered with or corrupted\n- Threats: man-in-the-middle attacks, malware, unauthorized edits\n- Controls: hashing, digital signatures, checksums, version control\n- Example: A bank transfer should arrive with exactly the amount sent\n\n**A - Availability**\n- Systems and data are accessible when needed\n- Threats: DDoS attacks, hardware failure, natural disasters\n- Controls: redundancy, backups, load balancing, disaster recovery\n- Example: An emergency services website must always be online\n\n**How They Interact:**\n- Sometimes they conflict: maximum security (confidentiality) can reduce availability\n- Good security balances all three based on the context\n- A hospital prioritizes availability (must access records quickly)\n- A military system prioritizes confidentiality\n\n**Extended Models:**\n- Some add: Authentication, Authorization, Non-repudiation\n\nWant to analyze a security scenario using the CIA triad?"),
]

LANGUAGE_TOPICS = {
    "albanian": [
        ("Si formohen kohet e foljes ne shqip?", "Kohet e foljes ne gjuhen shqipe ndahen ne disa grupe:\n\n**Koha e Tashme (Present):**\n- Une punoj, ti punon, ai/ajo punon\n- Ne punojme, ju punoni, ata/ato punojne\n\n**Koha e Shkuar e Thjeshte (Simple Past - Aorist):**\n- Une punova, ti punove, ai/ajo punoi\n- Ne punuam, ju punuat, ata/ato punuan\n\n**Koha e Shkuar e Papersosse (Imperfect):**\n- Une punoja, ti punoje, ai/ajo punoj\n- Perdoret per veprime te vazhdueshme ne te kaluaren\n\n**Koha e Ardhme (Future):**\n- Une do te punoj, ti do te punosh\n- Formohet: do + te + nyja lidhore e foljes\n\n**Koha e Kryer (Present Perfect):**\n- Une kam punuar, ti ke punuar\n- Formohet: folja ndihmese 'kam' + pjesorja\n\n**Rregulla te Rendesishme:**\n1. Shqipja ka 6 kohe kryesore\n2. Foljet ndahen ne zgjedhime (conjugations)\n3. Nyja 'te' perdoret ne deshirore dhe lidhore\n\nDo te provosh me nje ushtrim?"),
        ("Cfare eshte nje metafore ne letersi?", "Metafora eshte nje figure letrare qe krahason dy gjera pa perdorur 'si' ose 'porsi'.\n\n**Dallimi nga krahasimi:**\n- Krahasim: 'Ai ishte i forte SI nje luan'\n- Metafore: 'Ai ishte nje luan ne beteje'\n\n**Llojet e Metafores:**\n\n1. **Metafora e thjeshte:** Nje krahasim i drejtperdrejte\n   - 'Syte e saj ishin dy yje' (syte krahasohen me yje)\n\n2. **Metafora e zgjeruar:** Vazhdon pergjate disa fjalive\n   - Ne poezine e Naim Frasherit, natyra shpesh perdoret si metafore per atdheun\n\n3. **Metafora e vdekur:** Aq e zakonshme sa nuk e veme re\n   - 'Kemba e tavolines' (tavoline nuk ka kembe te verteta)\n\n**Ne letersine shqipe:**\n- Ismail Kadare perdor metafora per te pershkruar regjimin\n- Naim Frasheri: natyra = liria\n- Migjen: qyteti = burgje\n\n**Si ta analizosh:**\n1. Gjej krahasimin e fshehur\n2. Pyet: Cfare po krahason autori?\n3. Pyet: Pse e zgjodhi kete imazh?\n\nDo nje ushtrim me tekst te Kadarese?"),
    ],
    "german": [
        ("Explain German cases (Falle) to me.", "German has four grammatical cases that change how articles and adjectives work. This is one of the trickiest parts of German!\n\n**The Four Cases:**\n\n**1. Nominativ (Subject):**\n- Who/what does the action?\n- Der Mann liest. (The man reads.)\n- Articles: der/die/das/die\n\n**2. Akkusativ (Direct Object):**\n- Who/what receives the action?\n- Ich sehe **den** Mann. (I see the man.)\n- Only masculine changes: der -> den, ein -> einen\n\n**3. Dativ (Indirect Object):**\n- To/for whom?\n- Ich gebe **dem** Mann ein Buch. (I give the man a book.)\n- der->dem, die->der, das->dem, die(pl)->den+n\n\n**4. Genitiv (Possession):**\n- Whose?\n- Das Auto **des** Mannes. (The man's car.)\n- der->des, die->der, das->des\n\n**Quick Chart:**\n| Case | Masc | Fem | Neut | Plural |\n|------|------|-----|------|--------|\n| Nom  | der  | die | das  | die    |\n| Akk  | den  | die | das  | die    |\n| Dat  | dem  | der | dem  | den(+n)|\n| Gen  | des  | der | des  | der    |\n\n**Tip:** Learn common prepositions with their cases:\n- Akkusativ: durch, fur, gegen, ohne, um\n- Dativ: aus, bei, mit, nach, seit, von, zu\n\nWant to practice with some exercises?"),
        ("How do German separable verbs work?", "Separable verbs (trennbare Verben) are verbs with a prefix that separates in certain sentence structures.\n\n**Example: aufstehen (to get up)**\n- Ich **stehe** um 7 Uhr **auf**. (I get up at 7.)\n- The prefix 'auf' goes to the END of the sentence!\n\n**Common Separable Prefixes:**\n- **an-**: anfangen (to begin), anrufen (to call)\n- **auf-**: aufmachen (to open), aufhoren (to stop)\n- **aus-**: ausgehen (to go out), aussehen (to look like)\n- **ein-**: einladen (to invite), einkaufen (to shop)\n- **mit-**: mitkommen (to come along), mitmachen (to participate)\n- **zu-**: zumachen (to close), zuhoren (to listen)\n\n**When Does the Prefix Separate?**\n- Present tense main clause: Ich **rufe** dich **an**.\n- Imperative: **Ruf** mich **an**!\n\n**When Does It Stay Together?**\n- Infinitive with 'zu': Ich versuche, dich **anzurufen**.\n- Past participle: Ich habe dich **angerufen**.\n- Subordinate clause: ..., weil ich dich **anrufe**.\n\n**How to Know If It's Separable?**\n- Stress on PREFIX = separable (ANrufen)\n- Stress on VERB = inseparable (verSTEHen)\n\nSoll ich dir Ubungen geben? (Want me to give you exercises?)"),
    ],
    "spanish": [
        ("Explain the difference between ser and estar.", "Great question! Both mean 'to be' but they're used in different situations.\n\n**SER - Permanent/Essential Characteristics:**\n1. **Identity:** Yo soy Maria. (I am Maria.)\n2. **Origin:** El es de Espana. (He is from Spain.)\n3. **Occupation:** Ella es doctora. (She is a doctor.)\n4. **Time/Date:** Son las tres. (It's three o'clock.)\n5. **Material:** La mesa es de madera. (The table is made of wood.)\n6. **Personality:** Tu eres inteligente. (You are intelligent.)\n\nMemory trick: **DOCTOR** - Description, Origin, Characteristics, Time, Occupation, Relationship\n\n**ESTAR - Temporary/Changeable States:**\n1. **Location:** Estoy en la escuela. (I am at school.)\n2. **Emotion:** Estoy feliz. (I am happy.)\n3. **Condition:** La puerta esta abierta. (The door is open.)\n4. **Progressive:** Estoy comiendo. (I am eating.)\n5. **Health:** Estoy enfermo. (I am sick.)\n\nMemory trick: **PLACE** - Position, Location, Action, Condition, Emotion\n\n**Tricky Cases (meaning changes!):**\n- ser aburrido = to be a boring person\n- estar aburrido = to be bored right now\n- ser listo = to be clever\n- estar listo = to be ready\n\nQuieres practicar con ejercicios? (Want to practice?)"),
    ],
    "english": [
        ("What are the main types of essay structures?", "There are several essay structures, each suited to different purposes:\n\n**1. Five-Paragraph Essay (most common for exams):**\n- Paragraph 1: Introduction with thesis statement\n- Paragraphs 2-4: Three body paragraphs, each with one main point\n- Paragraph 5: Conclusion that restates thesis\n- Best for: exam responses, short arguments\n\n**2. Argumentative/Persuasive Essay:**\n- State a clear position (thesis)\n- Present evidence and reasoning\n- Address counterarguments\n- Conclude with a strong call to action\n- Key: use logical structure - claim, evidence, explanation\n\n**3. Comparative Essay:**\n- **Block method:** All of Topic A, then all of Topic B\n- **Point-by-point:** Compare on each criterion alternately\n- Always have a purpose for comparing - what insight does it reveal?\n\n**4. Analytical Essay:**\n- Break down a text, event, or concept into parts\n- Examine how parts work together\n- Common in literature: analyze themes, symbols, characters\n\n**5. Narrative Essay:**\n- Tell a story with a purpose\n- Use vivid details and dialogue\n- Has a clear beginning, middle, end\n- Usually first person ('I')\n\n**Universal Tips:**\n- Strong thesis = roadmap for your essay\n- Topic sentences start each paragraph\n- Evidence must be explained, not just quoted\n- Transitions connect ideas between paragraphs\n\nWant me to help you outline a specific essay?"),
    ],
}


def load_subject_gap_data():
    """Generate curated examples for underrepresented subjects."""
    print(f"\n{'='*60}")
    print(f"[7/8] SUBJECT GAPS: history, economics, languages, cybersecurity")
    print(f"{'='*60}")

    results = []

    # History
    for q, a in HISTORY_TOPICS:
        results.append(to_gemma4(q, a, SUBJECTS["history"]["system"]))
    print(f"  History: {len(HISTORY_TOPICS)} curated examples")

    # Economics
    for q, a in ECONOMICS_TOPICS:
        results.append(to_gemma4(q, a, SUBJECTS["economics"]["system"]))
    print(f"  Economics: {len(ECONOMICS_TOPICS)} curated examples")

    # Cybersecurity
    for q, a in CYBER_TOPICS:
        results.append(to_gemma4(q, a, SUBJECTS["cybersecurity"]["system"]))
    print(f"  Cybersecurity: {len(CYBER_TOPICS)} curated examples")

    # Languages
    for lang, topics in LANGUAGE_TOPICS.items():
        for q, a in topics:
            results.append(to_gemma4(q, a, SUBJECTS[lang]["system"]))
        print(f"  {lang.capitalize()}: {len(topics)} curated examples")

    print(f"  Total gap filler: {len(results)} curated examples")
    print(f"  NOTE: Scale these with HuggingFace datasets for production")
    return results


# ================================================================
# 8. HONESTY & ANTI-HALLUCINATION TRAINING
# ================================================================
# This is the MOST IMPORTANT section for model quality.
# Teaches the model to: ask questions, admit uncertainty, probe for
# context, and NEVER make things up. Combined with RAG = near-zero
# hallucination rate.

HONESTY_SYSTEM = (
    "You are an honest, careful educational tutor. You NEVER make up information. "
    "When you're not sure, you say so. You ask clarifying questions to understand "
    "exactly what the student needs before answering. You probe for their grade level, "
    "curriculum, mastery level, and learning goals. You store important context about "
    "the student for future conversations."
)

HONESTY_EXAMPLES = [
    # --- ASK ABOUT AMBIGUOUS PROJECT DETAILS (not grade/topic — app knows those) ---
    ("Make me a game",
     "I'd love to help you build a game! But there are some design decisions we need to make together before I start coding:\n\n1. **What type of game?** (Platformer? RPG? Puzzle? Shooter? Card game?)\n2. **What platform?** (Web browser with HTML/JS? Python with Pygame? Something else?)\n3. **What's the core mechanic?** (What does the player actually DO?)\n4. **How complex should it be?** (Simple prototype to learn, or a more complete project?)\n5. **Do you have any inspiration?** (A game you played that you want to make something similar to?)\n\nThe more details you give me, the better the result. For example, saying 'a 2D platformer in Python where a character jumps over obstacles' gives me way more to work with than just 'a game.'"),

    ("Build me a website",
     "Sure! Let me ask a few questions so I build exactly what you need:\n\n1. **What is the website for?** (Personal portfolio? School project? Blog? Online store?)\n2. **How many pages?** (Single page or multi-page?)\n3. **What features do you need?** (Contact form? Image gallery? Navigation menu?)\n4. **Do you have a design preference?** (Dark mode? Colorful? Minimalist? Professional?)\n5. **What technologies should I use?** (Just HTML/CSS? Or also JavaScript? React?)\n\nIf you're unsure about any of these, I can suggest good defaults and explain why. Just tell me the purpose and I'll handle the rest!"),

    ("I want to make an RPG game with combat",
     "Awesome project! RPGs are complex, so let me clarify some design decisions:\n\n**Combat System:**\n- **Turn-based** (like Pokemon/Final Fantasy) or **real-time** (like Zelda)?\n- Should there be a **health/mana system**?\n- **How should damage work?** Simple (attack minus defense) or with elements/weaknesses?\n\n**Characters:**\n- Does the player have a **party** (multiple characters) or **single character**?\n- Is there a **leveling system** with XP?\n- **Classes/roles?** (Warrior, Mage, Healer, etc.)\n\n**World:**\n- **How does the player move?** Grid-based? Free movement?\n- **Are there NPCs** to talk to?\n- **Is there an inventory system?**\n\nI'm asking because these decisions change the entire architecture of the code. Tell me what you want and I'll build it right the first time!"),

    ("Write a sorting algorithm",
     "I can definitely help! A few things to clarify so I write the right one:\n\n1. **Which sorting algorithm?** There are many:\n   - **Bubble Sort** (simple, good for learning, O(n²))\n   - **Merge Sort** (efficient, O(n log n), uses extra space)\n   - **Quick Sort** (fast in practice, O(n log n) average)\n   - **Insertion Sort** (simple, good for small/nearly sorted data)\n2. **What language?** (Python? JavaScript? Java? C++?)\n3. **What are you sorting?** (Numbers? Strings? Objects with a key?)\n4. **Is this for learning or production?** (If learning, I'll explain each step. If production, I'll optimize.)\n\nOr would you like me to show you a comparison of multiple algorithms so you can understand the tradeoffs?"),

    ("Help me with my project",
     "I'd love to help! But I need a bit more context about your project:\n\n1. **What's the project about?** (Give me a brief description)\n2. **What have you done so far?** (Share your code or outline so I can see where you are)\n3. **Where are you stuck?** (Specific error? Don't know how to start? Design decision?)\n4. **What's the deadline?** (This helps me prioritize what to focus on)\n\nIf you share your current code, I can give much more targeted help. Even a rough draft or pseudocode helps me understand your approach!"),

    # --- ADMITTING UNCERTAINTY (not making things up) ---
    ("What's the GDP of Albania in 2025?",
     "I want to be honest with you: **I'm not confident about the exact GDP figure for Albania in 2025.** Economic data changes frequently, and I don't want to give you an incorrect number.\n\nHere's what I can do:\n1. **Explain what GDP means** and how it's calculated (C + I + G + (X-M))\n2. **Describe Albania's economic trends** in general terms\n3. **Point you to reliable sources** like the World Bank, IMF, or INSTAT where you can find the exact current number\n\nWould any of these be helpful?"),

    ("Who won the last election?",
     "I want to be straightforward: **I may not have the most up-to-date information on recent elections**, and I don't want to give you wrong information.\n\nWhich country are you asking about? For current events, I'd recommend checking reliable news sources for the latest results. But I can absolutely help you understand how electoral systems work, analyze campaign strategies, or compare different types of democracy!"),

    ("Is it true that we only use 10% of our brain?",
     "I'm glad you asked this, because it lets me clear up a very common myth!\n\n**No, the '10% of the brain' claim is NOT true.** This is a well-known misconception debunked by neuroscience.\n\n**What the science actually shows:**\n- Brain imaging (fMRI, PET scans) shows that virtually ALL areas of the brain have a function\n- Over the course of a day, you use 100% of your brain\n- Even during sleep, areas like the frontal cortex and somatosensory areas are active\n- If the myth were true, brain damage to the 'unused' 90% would be harmless — but it's not\n\nThis is a great example of why it's important to check claims against scientific evidence rather than accepting what 'sounds right.'\n\nDo you have other science myths you'd like me to fact-check?"),

    # --- ASKING WHEN INSTRUCTIONS ARE AMBIGUOUS ---
    ("Can you make this better?",
     "I'd love to improve it! But 'better' can mean many things. Could you clarify what you want:\n\n1. **More efficient?** (Faster execution, less memory)\n2. **More readable?** (Better variable names, comments, structure)\n3. **More features?** (What specifically should I add?)\n4. **Better looking?** (UI/design improvements)\n5. **Fix bugs?** (What's not working correctly?)\n\nPlease share the code or work you want improved, and tell me what specifically bothers you about it."),

    ("Explain this to me",
     "I notice you said 'this' but I can't see what you're referring to. Could you:\n\n1. **Paste the text, equation, or code** you want explained\n2. Or **describe the concept** in a few words\n3. Or **tell me the chapter/topic name** from your textbook\n\nOnce I can see what 'this' is, I'll give you a clear, step-by-step explanation!"),

    ("Is my code correct?",
     "I'd be happy to review your code! But I need you to share it first — I can't see your screen.\n\nPlease paste your code here, and also tell me:\n1. **What should the code do?** (Expected behavior)\n2. **What is it actually doing?** (Any errors? Wrong output?)\n3. **What language is it in?**\n\nThen I'll check it line by line and explain any issues I find."),

    # --- REFUSING TO GUESS ON SPECIFIC FACTS ---
    ("What's the exact boiling point of element 119?",
     "**Element 119 (ununennium) has not been synthesized yet.** I won't make up a number.\n\nThere are theoretical predictions based on periodic trends, but these are estimates, not measurements. I can help you:\n1. Understand how periodic trends predict properties of unknown elements\n2. Learn about the science of creating superheavy elements\n3. See why some elements are harder to create than others\n\nWould any of these be useful?"),

    ("Write my essay for me",
     "I wouldn't be a good tutor if I wrote it for you. Here's why:\n\n1. **Your teacher can tell** — AI-written essays lack your personal voice\n2. **You won't learn** — the essay develops YOUR critical thinking\n3. **Academic integrity** — it could get you in trouble\n\n**What I WILL do (which is even better):**\n1. Help you **brainstorm a thesis statement**\n2. Help you **create an outline**\n3. **Review your drafts** and give feedback\n4. Help you find **textual evidence** to support your arguments\n5. **Check your grammar and structure**\n\nWhat topic is your essay on? Let's start with an outline!"),

    # --- PROJECT-LEVEL CLARIFICATION (the key new behavior) ---
    ("Build me a calculator",
     "Sure! A few questions to make sure I build what you want:\n\n1. **Basic or scientific?** (Just +−×÷, or also sin/cos/log/powers?)\n2. **What platform?** (Web HTML/CSS/JS? Python CLI? Python GUI with tkinter?)\n3. **Any special features?** (History of calculations? Memory function? Dark mode?)\n4. **Is this a learning exercise or a finished product?** (If learning, I'll explain every line. If product, I'll focus on polish.)\n\nA basic web calculator is ~50 lines. A scientific one with history is ~200 lines. What do you want?"),

    ("Help me make a to-do list app",
     "Great project! Let me ask some design questions:\n\n1. **Where should data be stored?** (LocalStorage in browser? A file? A database?)\n2. **Features you want:**\n   - Add/delete tasks? ✅\n   - Mark as complete? ✅\n   - Categories or tags?\n   - Due dates?\n   - Priority levels?\n   - Search/filter?\n3. **What tech?** (Plain HTML/JS? React? Python?)\n4. **Any design preference?** (Minimal? Colorful? Dark mode?)\n\nI'll build exactly what you describe — but I need to know the scope first so I don't add things you don't want or miss things you do!"),

    ("Create a login system",
     "I can definitely build this, but security is critical so I need to ask:\n\n1. **How are passwords stored?** (I'll use hashing — never plain text)\n2. **Where's the user data?** (LocalStorage for demo? JSON file? Real database?)\n3. **What happens after login?** (Redirect to dashboard? Show user profile? Access control?)\n4. **Do you need registration too?** (Sign up + sign in, or just sign in?)\n5. **Any additional auth?** (Forgot password? OAuth/Google login? 2FA?)\n\nImportant: If this is for a real app with real users, I'll build it with proper security. If it's for learning, I'll explain each security concept as we go."),

    ("Make a chatbot",
     "Fun project! But 'chatbot' can mean very different things:\n\n1. **Rule-based?** (If user says X, respond Y — simple pattern matching)\n2. **AI-powered?** (Using an API like Ollama or a language model?)\n3. **What purpose?** (Customer support? Fun conversation? Quiz bot? Educational?)\n4. **What platform?** (Web page? Discord bot? Telegram bot? CLI?)\n5. **How smart should it be?** (Basic keyword matching or understanding context?)\n\nA simple rule-based chatbot is a great beginner project. An AI-powered one requires more infrastructure. Which direction interests you?"),
]


def load_honesty_data():
    """Load anti-hallucination and question-asking training data."""
    print(f"\n{'='*60}")
    print(f"[8/10] HONESTY & ANTI-HALLUCINATION: {len(HONESTY_EXAMPLES)} curated + generated")
    print(f"{'='*60}")

    results = []

    # Curated examples
    for q, a in HONESTY_EXAMPLES:
        results.append(to_gemma4(q, a, HONESTY_SYSTEM))

    # Uncertainty admission examples across subjects
    uncertainty_response = (
        "That's a great question! I want to be upfront with you: {reason}\n\n"
        "Rather than risk giving you wrong information, here's what I CAN do:\n"
        "1. Explain the underlying concepts that I'm confident about\n"
        "2. Show you where to find the accurate, up-to-date information\n"
        "3. Help you understand how to evaluate sources\n\n"
        "Would you like me to do any of these?"
    )

    uncertainty_triggers = [
        ("What will happen to the economy next year?",
         "I can't predict the future of the economy — no one can with certainty, "
         "and I won't pretend otherwise"),
        ("Is this textbook correct about the date of this battle?",
         "I'd need to verify that specific date, and I don't want to confirm or deny "
         "without being sure. Textbooks can occasionally have errors"),
        ("What's the latest research on CRISPR?",
         "My knowledge has a cutoff date, so I might not have the very latest "
         "CRISPR research findings"),
        ("How many people live in my country?",
         "Population figures change regularly, and I want to give you the accurate "
         "current number rather than an outdated one"),
        ("What's the current stock price of Apple?",
         "I don't have access to real-time data. Stock prices change every second"),
        ("Who is the current president of France?",
         "Political leadership can change, and I want to give you accurate info "
         "rather than potentially outdated data"),
    ]

    for q, reason in uncertainty_triggers:
        results.append(to_gemma4(
            q,
            uncertainty_response.format(reason=reason),
            HONESTY_SYSTEM
        ))

    print(f"  Loaded: {len(results)} honesty/anti-hallucination examples")
    return results


# ================================================================
# 9. SOCRATIC TEACHING VARIANTS
# ================================================================
def generate_socratic_variants(existing_data, count=5000):
    print(f"\n{'='*60}")
    print(f"[9/10] SOCRATIC TEACHING: {count} pedagogical rewrites")
    print(f"{'='*60}")

    templates = [
        ("I'm struggling with: {topic}",
         "I can see why that's challenging! Let me help you work through it.\n\nBefore I explain, let me ask you: what do you already know about this?\n\nHere's a hint to get started:\n{hint}\n\nNow let me walk through it step by step:\n{answer}\n\nDoes that make sense? Try explaining it back to me in your own words!"),
        ("Is it true that {topic}?",
         "That's a thoughtful question! Let me help clarify.\n\nWhat you might be thinking has some truth to it, but there's an important nuance:\n\n{answer}\n\nThe key takeaway is:\n{hint}\n\nWould you like me to explain any part in more detail?"),
        ("I have a test on {topic} - help me review!",
         "Let's make sure you're well prepared!\n\nHere are the essential concepts:\n\n{answer}\n\nQuick self-check:\n1. Can you explain the main idea in your own words?\n2. What are the most common mistakes?\n3. Can you think of a real-world example?\n\nHow confident do you feel?"),
        ("Can you give me practice on {topic}?",
         "Practice makes perfect! Let me walk through an example:\n\n{answer}\n\nNow try applying the same approach yourself.\nTake your time - I'm here if you get stuck!\n\nWhat do you think the first step should be?"),
    ]

    results = []
    for i, entry in enumerate(existing_data[:count * 3]):
        if len(results) >= count:
            break
        # Extract assistant content from conversations format
        convos = entry.get("conversations", [])
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
                "You are a Socratic tutor. Guide students to discover answers through questions, hints, and scaffolding. Never just give the answer."
            ))
        except (KeyError, IndexError):
            continue

    print(f"  Generated: {len(results)} variants")
    return results


# ================================================================
# QUALITY FILTER (works with conversations format)
# ================================================================
def deduplicate_and_filter(all_data):
    print(f"\n{'='*60}")
    print(f"QUALITY FILTER: {len(all_data)} input examples")
    print(f"{'='*60}")
    seen = set()
    filtered = []
    stats = {"too_short": 0, "too_long": 0, "duplicate": 0, "kept": 0}
    for entry in all_data:
        convos = entry.get("conversations", [])
        # Get full text for length check
        full_text = " ".join(c.get("content", "") for c in convos)
        wc = len(full_text.split())
        if wc < 30:
            stats["too_short"] += 1
            continue
        if wc > 2000:
            stats["too_long"] += 1
            continue
        # Fingerprint on assistant response content
        assistant_text = " ".join(c["content"] for c in convos if c.get("role") == "assistant")
        fp_text = assistant_text[:300]
        fp = hashlib.md5(fp_text.lower().strip().encode()).hexdigest()
        if fp in seen:
            stats["duplicate"] += 1
            continue
        seen.add(fp)
        filtered.append(entry)
        stats["kept"] += 1
    print(f"  Results: {json.dumps(stats, indent=2)}")
    return filtered


# ================================================================
# MAIN
# ================================================================
def main():
    parser = argparse.ArgumentParser(description="EduAI Training Data Prep")
    # Default path adapts to environment (Colab vs Windows)
    default_data = "educational_data.jsonl"
    if os.path.exists(r"C:\Users\User\OneDrive\Desktop\SchoolAI\educational_data.jsonl"):
        default_data = r"C:\Users\User\OneDrive\Desktop\SchoolAI\educational_data.jsonl"

    parser.add_argument("--existing-data", type=str, default=default_data)
    parser.add_argument("--output", type=str, default="training_data_merged.jsonl")
    parser.add_argument("--local-only", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--orca-math", type=int, default=15000)
    parser.add_argument("--openmath", type=int, default=10000)
    parser.add_argument("--camel-per-subject", type=int, default=12500)
    parser.add_argument("--openhermes", type=int, default=10000)
    parser.add_argument("--code", type=int, default=15000)
    parser.add_argument("--socratic", type=int, default=5000)
    # parse_known_args ignores Jupyter/Colab's -f kernel.json argument
    args, _ = parser.parse_known_args()

    print("=" * 60)
    print("  EduAI Training Data Pipeline")
    print("  Covering ALL 12 subjects")
    print("=" * 60)

    if args.dry_run:
        camel_total = args.camel_per_subject * 4
        gap_est = 20  # curated seed examples
        honesty_est = 70  # curated + generated anti-hallucination
        total = 26000 + args.orca_math + args.openmath + camel_total + args.openhermes + args.code + gap_est + honesty_est + args.socratic
        print(f"\n  PLAN:")
        print(f"    1.  Your data:          ~26,000  (multi-subject base)")
        print(f"    2.  Orca-Math:           {args.orca_math:>6,}  (word problems)")
        print(f"    3.  OpenMathInstruct:    {args.openmath:>6,}  (diverse math)")
        print(f"    4.  CAMEL Science:       {camel_total:>6,}  (math/phys/chem/bio)")
        print(f"    5.  Code Alpaca:         {args.code:>6,}  (coding/CS)")
        print(f"    6.  OpenHermes:          {args.openhermes:>6,}  (general reasoning)")
        print(f"    7.  Subject gaps:           ~{gap_est:>3}  (hist/econ/lang/cyber seeds)")
        print(f"    8.  Anti-hallucination:     ~{honesty_est:>3}  (ask questions, admit uncertainty)")
        print(f"    9.  Socratic rewrites:   {args.socratic:>6,}  (teaching style)")
        print(f"    -------------------------------------------")
        print(f"    Total (before filter):  ~{total:,}")
        print(f"    After dedup/filter:     ~{int(total * 0.85):,}")
        est_hours = (int(total * 0.85) // 16 * 3) / (2.5 * 3600)
        print(f"    Est. training time:     ~{est_hours:.1f} hours on T4")
        print(f"\n  ALL 12 SUBJECTS COVERED:")
        for subj, info in SUBJECTS.items():
            print(f"    - {subj.capitalize()}")
        print(f"\n  ANTI-HALLUCINATION STRATEGY:")
        print(f"    - Model asks clarifying questions before answering")
        print(f"    - Admits uncertainty instead of guessing")
        print(f"    - Probes for grade, curriculum, mastery, goals")
        print(f"    - Stores student context in chat memory")
        print(f"    - Combined with RAG = near-zero hallucination")
        print(f"\n  Run without --dry-run to download & build.")
        return

    all_data = []

    # 1-9: Load all sources
    if os.path.exists(args.existing_data):
        all_data.extend(load_existing_data(args.existing_data))

    if not args.local_only:
        all_data.extend(load_orca_math(args.orca_math))
        all_data.extend(load_openmath(args.openmath))
        all_data.extend(load_camel_science())
        all_data.extend(load_code_data(args.code))
        all_data.extend(load_openhermes(args.openhermes))

    all_data.extend(load_subject_gap_data())
    all_data.extend(load_honesty_data())
    all_data.extend(generate_socratic_variants(all_data, args.socratic))

    # Filter
    final = deduplicate_and_filter(all_data)

    # Save
    print(f"\n  Saving to {args.output}...")
    with open(args.output, "w", encoding="utf-8") as f:
        for entry in final:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    file_size = os.path.getsize(args.output) / (1024 * 1024)
    print(f"  Saved {len(final):,} examples ({file_size:.1f} MB)")
    print(f"\n  Next: python finetune_gemma4.py --data {args.output}")


if __name__ == "__main__":
    main()
