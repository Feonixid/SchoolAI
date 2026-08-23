#!/usr/bin/env python3
"""
Generate synthetic training data for ShqipAI Tutor fine-tuning.

This script generates high-quality educational conversations across
subjects, levels, and languages for pedagogical fine-tuning.
"""

import json
import random
from typing import List, Dict

# Configuration
SUBJECTS = [
    "math", "algebra", "geometry", "calculus",
    "biology", "chemistry", "physics",
    "history", "geography", "civics",
    "English language", "Albanian language", "German language", "French language",
    "computer science", "programming",
]

LEVELS = ["primary school", "middle school", "high school", "GCSE", "A-level", "IB", "university"]

LANGUAGES = ["English", "Albanian", "German", "French", "Spanish"]

PROFICIENCIES = ["beginner", "intermediate", "advanced"]

# System prompt templates
SYSTEM_TEMPLATES = {
    "patient": "You are a patient {subject} tutor helping a {level} student. Explain clearly, use examples, and check understanding.",
    "encouraging": "You are an encouraging {subject} teacher. Guide the student to discover answers step by step. Celebrate their progress.",
    "practice": "You are a {subject} tutor in practice mode. Ask guiding questions, don't give direct answers. Help the student think through problems.",
    "exam_prep": "You are a {subject} tutor helping a {level} student prepare for exams. Focus on key concepts, common mistakes, and exam techniques.",
    "multilingual": "You are a multilingual {subject} tutor. Respond in {language} at a {proficiency} level. Explain clearly with cultural context.",
}

# Question templates by subject
QUESTION_TEMPLATES = {
    "math": [
        "I don't understand how to solve {problem}",
        "Can you explain {concept}?",
        "Why does {formula} work?",
        "I keep getting wrong answers for {topic}",
        "What's the difference between {concept1} and {concept2}?",
    ],
    "biology": [
        "How does {process} work?",
        "Why do {organisms} {behavior}?",
        "What is the function of {organ}?",
        "I'm confused about {concept}",
        "Can you explain {topic} in simple terms?",
    ],
    "chemistry": [
        "Why does {reaction} happen?",
        "What's the difference between {concept1} and {concept2}?",
        "How do I balance this equation: {equation}?",
        "I don't understand {concept}",
        "What are the properties of {element}?",
    ],
    "physics": [
        "Why does {phenomenon} occur?",
        "How does {device} work?",
        "I'm struggling with {concept}",
        "Can you explain {law}?",
        "What's the relationship between {quantity1} and {quantity2}?",
    ],
    "history": [
        "What caused {event}?",
        "Why did {person} {action}?",
        "What was the significance of {event}?",
        "How did {period} affect {region}?",
        "Compare {event1} and {event2}",
    ],
    "language": [
        "How do I use {grammar_point}?",
        "What's the difference between {word1} and {word2}?",
        "Can you correct my sentence: {sentence}",
        "How do you say {phrase} in {language}?",
        "Explain the grammar in: {sentence}",
    ],
    "computer science": [
        "How does {concept} work?",
        "Why do we use {technique}?",
        "I'm getting an error: {error}",
        "What's the best way to {task}?",
        "Explain {algorithm} in simple terms",
    ],
}

# Response patterns for good tutoring
RESPONSE_PATTERNS = {
    "explanation": [
        "Let me explain this step by step.\n\n",
        "Great question! Here's how it works:\n\n",
        "I'll break this down into parts:\n\n",
    ],
    "check_understanding": [
        "\n\nDoes that make sense?",
        "\n\nWould you like me to clarify anything?",
        "\n\nShall we try an example together?",
        "\n\nDo you want to practice this?",
    ],
    "encouragement": [
        "You're doing great! ",
        "Good question! ",
        "I can see you're thinking carefully about this. ",
    ],
    "misconception": [
        "I see what you're thinking, but let me clarify: ",
        "That's a common misunderstanding! Here's what's actually happening: ",
        "Almost there! The key point is: ",
    ],
    "guiding_question": [
        "What do you think would happen if...?",
        "Can you think of an example where...?",
        "What's the first step in solving this?",
        "What do you already know about this topic?",
    ],
}


def generate_example(
    subject: str,
    level: str,
    language: str = "English",
    proficiency: str = "intermediate",
    mode: str = "patient"
) -> Dict:
    """Generate a single training example."""
    
    # Select system prompt
    if language != "English":
        template_key = "multilingual"
    elif mode == "practice":
        template_key = "practice"
    elif "exam" in level.lower():
        template_key = "exam_prep"
    else:
        template_key = random.choice(["patient", "encouraging"])
    
    system_prompt = SYSTEM_TEMPLATES[template_key].format(
        subject=subject,
        level=level,
        language=language,
        proficiency=proficiency
    )
    
    # Generate question
    if subject in ["English language", "Albanian language", "German language", "French language"]:
        question_type = "language"
    else:
        question_type = subject.split()[0] if " " in subject else subject
    
    question_templates = QUESTION_TEMPLATES.get(question_type, QUESTION_TEMPLATES["math"])
    question = random.choice(question_templates)
    
    # Fill in placeholders (simplified - in production use more sophisticated generation)
    placeholders = {
        "{problem}": "this equation",
        "{concept}": "this concept",
        "{formula}": "this formula",
        "{topic}": "this topic",
        "{process}": "this process",
        "{concept1}": "concept A",
        "{concept2}": "concept B",
    }
    for ph, val in placeholders.items():
        question = question.replace(ph, val)
    
    # Generate response (simplified - in production use Claude/GPT-4)
    response_intro = random.choice(RESPONSE_PATTERNS["explanation"])
    response_check = random.choice(RESPONSE_PATTERNS["check_understanding"])
    
    response = f"""{response_intro}Here is a clear explanation of {subject} at the {level} level.

When students ask about this topic, the key things to understand are:
1. Start with the foundational concept and build up from there
2. Use concrete examples that relate to everyday experience
3. Break complex ideas into smaller, manageable steps

Let me know if you'd like me to go deeper on any part of this, or if you'd like to try a practice question!{response_check}"""
    
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
            {"role": "assistant", "content": response}
        ]
    }


def generate_dataset(
    num_examples: int = 2000,
    output_file: str = "training_data.jsonl"
) -> List[Dict]:
    """Generate a complete training dataset."""
    
    examples = []
    
    # Distribution targets
    subject_weights = {s: 1.0 for s in SUBJECTS}
    subject_weights["math"] = 2.0  # More math examples
    subject_weights["biology"] = 1.5
    
    for i in range(num_examples):
        # Weighted random selection
        subject = random.choices(
            SUBJECTS,
            weights=[subject_weights.get(s, 1.0) for s in SUBJECTS]
        )[0]
        
        level = random.choice(LEVELS)
        language = random.choice(LANGUAGES + ["English"] * 5)  # Bias toward English
        proficiency = random.choice(PROFICIENCIES)
        mode = random.choice(["patient", "encouraging", "practice", "exam_prep"])
        
        example = generate_example(subject, level, language, proficiency, mode)
        examples.append(example)
        
        if (i + 1) % 100 == 0:
            print(f"Generated {i + 1}/{num_examples} examples")
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')
    
    print(f"Saved {len(examples)} examples to {output_file}")
    return examples


def generate_with_claude(api_key: str, num_examples: int = 2000):
    """
    Generate high-quality examples using Claude API.
    
    This produces much better training data than the template-based approach.
    """
    import anthropic
    
    client = anthropic.Anthropic(api_key=api_key)
    
    examples = []
    
    for subject in SUBJECTS:
        for level in ["middle school", "high school", "GCSE"]:
            prompt = f"""Generate 10 tutoring conversations for {subject} at {level} level.

Each conversation should:
1. Show a student asking a realistic question
2. Show a tutor explaining clearly with examples
3. Include a check for understanding
4. Be pedagogically sound (guide, don't lecture)

Format each as JSON:
{{"messages": [{{"role": "system", "content": "..."}}, {{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}

Return a JSON array of 10 conversations."""

            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse response
            try:
                data = json.loads(message.content[0].text)
                examples.extend(data)
                print(f"Generated {len(data)} examples for {subject} at {level}")
            except:
                print(f"Failed to parse response for {subject}")
    
    # Save
    with open("training_data_claude.jsonl", 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')
    
    print(f"Total: {len(examples)} examples saved to training_data_claude.jsonl")
    return examples


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate training data for ShqipAI")
    parser.add_argument("--num", type=int, default=2000, help="Number of examples")
    parser.add_argument("--output", type=str, default="training_data.jsonl", help="Output file")
    parser.add_argument("--claude", type=str, help="Claude API key for high-quality generation")
    
    args = parser.parse_args()
    
    if args.claude:
        generate_with_claude(args.claude, args.num)
    else:
        generate_dataset(args.num, args.output)
