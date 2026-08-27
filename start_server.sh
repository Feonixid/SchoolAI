#!/usr/bin/env bash
# ===================================================================
# EduAI — Classroom Server Launcher (Linux / macOS / ChromeOS)
# ===================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================================================"
echo "                   [+] Starting EduAI Server...                        "
echo "========================================================================"

# 1. Verify Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    echo "   Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detected: $NODE_VERSION"

# 2. Check for Ollama (optional warning)
if ! command -v ollama &> /dev/null; then
    echo "⚠️ Warning: 'ollama' CLI not found in PATH."
    echo "   Ensure Ollama is running at http://127.0.0.1:11434 for local AI inference."
else
    echo "✅ Ollama detected in PATH."
fi

# 3. Launch Server
echo "🚀 Launching EduAI Classroom Node on port ${PORT:-3001}..."
node server.js
