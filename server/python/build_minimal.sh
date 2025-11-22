#!/bin/bash
# Emergency Railway build script when sentence-transformers fails
# This script uses minimal requirements to avoid dependency issues

set -e

echo "🚨 Emergency build mode: Using minimal requirements to avoid sentence-transformers issues"

# Update pip and essential tools
pip install --upgrade pip setuptools wheel

echo "📦 Installing minimal dependencies..."
pip install --no-cache-dir -r requirements.minimal.txt

# Skip sentence-transformers installation entirely
echo "⚠️ Skipping sentence-transformers and vector embeddings"
echo "   Therapy bot will run in fallback mode without knowledge base"

echo "✅ Emergency build completed - therapy bot will work without vector embeddings"