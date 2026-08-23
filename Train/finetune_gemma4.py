#!/usr/bin/env python3
"""
EduAI — Fine-tune Gemma 4 E4B for Educational Tutoring
=======================================================
Matches the official Unsloth Gemma 4 notebook format exactly.

Key differences from competition baseline:
  - 111K+ curated educational examples (vs 3K generic FineTome)
  - Anti-hallucination training (asks questions, admits uncertainty)
  - All 12 subjects covered with domain-specific system prompts
  - Socratic teaching style baked into the model

Hardware: Kaggle 2x T4 (14.5 GB VRAM each)
Model: Gemma 4 E4B (8B total, 4.5B effective params)

USAGE:
  1. Run prepare_training_data.py first to generate training_data_merged.jsonl
  2. Then: python finetune_gemma4.py --data training_data_merged.jsonl
"""

import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser(description="Fine-tune Gemma 4 E4B")
    parser.add_argument("--data", type=str, default="training_data_merged.jsonl",
                        help="Training data JSONL (ShareGPT conversations format)")
    parser.add_argument("--model", type=str, default="unsloth/gemma-4-E4B-it",
                        help="Model to fine-tune")
    parser.add_argument("--max-seq-length", type=int, default=4096,
                        help="Max sequence length")
    parser.add_argument("--epochs", type=int, default=1,
                        help="Number of training epochs")
    parser.add_argument("--max-steps", type=int, default=-1,
                        help="Max steps (-1 for full epochs)")
    parser.add_argument("--batch-size", type=int, default=1,
                        help="Per-device batch size")
    parser.add_argument("--grad-accum", type=int, default=4,
                        help="Gradient accumulation steps")
    parser.add_argument("--lr", type=float, default=2e-4,
                        help="Learning rate")
    parser.add_argument("--lora-r", type=int, default=8,
                        help="LoRA rank")
    parser.add_argument("--output-dir", type=str, default="eduai_gemma4_lora",
                        help="Output directory for LoRA adapters")
    parser.add_argument("--save-gguf", action="store_true",
                        help="Also save as GGUF for Ollama")
    parser.add_argument("--push-to-hub", type=str, default=None,
                        help="HuggingFace repo to push to")
    parser.add_argument("--hf-token", type=str, default=None,
                        help="HuggingFace token")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show config without training")
    # parse_known_args ignores Jupyter/Colab's -f kernel.json argument
    args, _ = parser.parse_known_args()

    # ================================================================
    # DRY RUN — show config
    # ================================================================
    if args.dry_run:
        print("=" * 60)
        print("  EduAI Fine-Tuning Config (DRY RUN)")
        print("=" * 60)
        print(f"  Model:           {args.model}")
        print(f"  Data:            {args.data}")
        data_exists = os.path.exists(args.data)
        if data_exists:
            with open(args.data, 'r') as f:
                count = sum(1 for _ in f)
            print(f"  Examples:        {count:,}")
        else:
            print(f"  Examples:        (file not found)")
        print(f"  Max seq length:  {args.max_seq_length}")
        print(f"  Epochs:          {args.epochs}")
        print(f"  Max steps:       {args.max_steps if args.max_steps > 0 else 'full epochs'}")
        print(f"  Batch size:      {args.batch_size}")
        print(f"  Grad accum:      {args.grad_accum}")
        print(f"  Effective batch: {args.batch_size * args.grad_accum}")
        print(f"  Learning rate:   {args.lr}")
        print(f"  LoRA rank:       {args.lora_r}")
        print(f"  LoRA alpha:      {args.lora_r}")
        print(f"  Output:          {args.output_dir}")
        print(f"  Save GGUF:       {args.save_gguf}")
        print(f"  Push to Hub:     {args.push_to_hub or 'no'}")
        print()
        print("  To train: remove --dry-run flag")
        print("  Required: pip install unsloth datasets trl")
        return

    # ================================================================
    # CHECK DATA EXISTS
    # ================================================================
    if not os.path.exists(args.data):
        print(f"ERROR: Data file not found: {args.data}")
        print("Run prepare_training_data.py first!")
        sys.exit(1)

    # ================================================================
    # STEP 1: LOAD MODEL
    # ================================================================
    print("\n" + "=" * 60)
    print("  STEP 1: Loading model...")
    print("=" * 60)

    from unsloth import FastModel
    import torch

    model, tokenizer = FastModel.from_pretrained(
        model_name=args.model,
        dtype=None,  # Auto detection
        max_seq_length=args.max_seq_length,
        load_in_4bit=True,  # QLoRA - 4bit quantization
        full_finetuning=False,
        device_map="balanced",  # Use 2x T4 on Kaggle
    )

    print(f"  Model loaded: {args.model}")
    print(f"  GPU: {torch.cuda.get_device_name(0)}")
    if torch.cuda.device_count() > 1:
        print(f"  GPUs: {torch.cuda.device_count()}")
    mem = torch.cuda.max_memory_reserved() / 1024**3
    print(f"  Memory reserved: {mem:.1f} GB")

    # ================================================================
    # STEP 2: ADD LoRA ADAPTERS
    # ================================================================
    print("\n" + "=" * 60)
    print("  STEP 2: Adding LoRA adapters...")
    print("=" * 60)

    model = FastModel.get_peft_model(
        model,
        finetune_vision_layers=False,     # Text only
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,

        r=args.lora_r,
        lora_alpha=args.lora_r,  # alpha == r recommended
        lora_dropout=0,
        bias="none",
        random_state=3407,
    )

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Trainable: {trainable:,} / {total:,} ({trainable/total*100:.2f}%)")

    # ================================================================
    # STEP 3: PREPARE DATA (Gemma 4 chat template)
    # ================================================================
    print("\n" + "=" * 60)
    print("  STEP 3: Preparing data...")
    print("=" * 60)

    from unsloth.chat_templates import get_chat_template
    tokenizer = get_chat_template(
        tokenizer,
        chat_template="gemma-4",  # Proper Gemma 4 format
    )

    # Load our JSONL training data
    from datasets import load_dataset
    dataset = load_dataset("json", data_files=args.data, split="train")
    print(f"  Loaded {len(dataset):,} examples from {args.data}")

    # Standardize the conversations format
    from unsloth.chat_templates import standardize_data_formats
    dataset = standardize_data_formats(dataset)

    # Apply the Gemma 4 chat template
    def formatting_prompts_func(examples):
        convos = examples["conversations"]
        texts = [
            tokenizer.apply_chat_template(
                convo,
                tokenize=False,
                add_generation_prompt=False
            ).removeprefix('<bos>')
            for convo in convos
        ]
        return {"text": texts}

    dataset = dataset.map(formatting_prompts_func, batched=True)

    # Show a sample
    print(f"\n  Sample (first 200 chars):")
    print(f"  {dataset[0]['text'][:200]}...")

    # ================================================================
    # STEP 4: TRAIN
    # ================================================================
    print("\n" + "=" * 60)
    print("  STEP 4: Training...")
    print("=" * 60)

    from trl import SFTTrainer, SFTConfig

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        eval_dataset=None,
        args=SFTConfig(
            dataset_text_field="text",
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.grad_accum,
            warmup_steps=10,
            num_train_epochs=args.epochs,
            max_steps=args.max_steps if args.max_steps > 0 else -1,
            learning_rate=args.lr,
            logging_steps=10,
            optim="adamw_8bit",
            weight_decay=0.001,
            lr_scheduler_type="linear",
            seed=3407,
            report_to="none",
            output_dir=args.output_dir,
            save_strategy="steps",
            save_steps=500,
        ),
    )

    # Train on completions only (mask user inputs from loss)
    from unsloth.chat_templates import train_on_responses_only
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|turn>user\n",
        response_part="<|turn>model\n",
    )

    # Verify masking works
    sample_labels = trainer.train_dataset[0]["labels"]
    masked_count = sum(1 for x in sample_labels if x == -100)
    total_tokens = len(sample_labels)
    print(f"  Masking check: {masked_count}/{total_tokens} tokens masked "
          f"({masked_count/total_tokens*100:.0f}% instruction, "
          f"{(total_tokens-masked_count)/total_tokens*100:.0f}% trained)")

    # Show memory before training
    mem_before = torch.cuda.max_memory_reserved() / 1024**3
    print(f"  Memory before training: {mem_before:.1f} GB")
    print(f"  Starting training...\n")

    # TRAIN!
    trainer_stats = trainer.train()

    # Show stats
    runtime = trainer_stats.metrics['train_runtime']
    mem_after = torch.cuda.max_memory_reserved() / 1024**3
    print(f"\n  Training complete!")
    print(f"  Time: {runtime:.0f}s ({runtime/60:.1f} min)")
    print(f"  Peak memory: {mem_after:.1f} GB")
    print(f"  Memory for training: {mem_after - mem_before:.1f} GB")

    # ================================================================
    # STEP 5: SAVE MODEL
    # ================================================================
    print("\n" + "=" * 60)
    print("  STEP 5: Saving model...")
    print("=" * 60)

    # Save LoRA adapters
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"  LoRA adapters saved to: {args.output_dir}/")

    # Save as GGUF for Ollama
    if args.save_gguf:
        print("  Converting to GGUF (Q8_0)...")
        model.save_pretrained_gguf(
            f"{args.output_dir}_gguf",
            tokenizer,
            quantization_method="Q8_0",
        )
        print(f"  GGUF saved to: {args.output_dir}_gguf/")

    # Push to HuggingFace Hub
    if args.push_to_hub:
        print(f"  Pushing to HuggingFace: {args.push_to_hub}...")
        token = args.hf_token or os.environ.get("HF_TOKEN")
        model.push_to_hub(args.push_to_hub, token=token)
        tokenizer.push_to_hub(args.push_to_hub, token=token)
        print(f"  Pushed to: https://huggingface.co/{args.push_to_hub}")

    # ================================================================
    # DONE
    # ================================================================
    print("\n" + "=" * 60)
    print("  ALL DONE!")
    print("=" * 60)
    print(f"  Model:       {args.model}")
    print(f"  Data:        {len(dataset):,} examples")
    print(f"  Time:        {runtime/60:.1f} minutes")
    print(f"  LoRA saved:  {args.output_dir}/")
    if args.save_gguf:
        print(f"  GGUF saved:  {args.output_dir}_gguf/")
    print()
    print("  To use with Ollama:")
    print(f"    1. Copy {args.output_dir}_gguf/*.gguf to your machine")
    print("    2. Create Modelfile:")
    print(f"       FROM ./{args.output_dir}_gguf/unsloth.Q8_0.gguf")
    print("    3. ollama create eduai -f Modelfile")
    print("    4. ollama run eduai")


if __name__ == "__main__":
    main()
