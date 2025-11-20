#!/bin/bash
# Build script for Railway deployment with CPU-only PyTorch and ChromaDB
set -e

echo "🔧 Setting up Rust environment for ChromaDB..."
# Set Rust environment variables to writable locations
export CARGO_HOME=/tmp/cargo
export RUSTUP_HOME=/tmp/rustup
export CARGO_TARGET_DIR=/tmp/cargo-target
export CARGO_NET_GIT_FETCH_WITH_CLI=true

# Create writable directories
mkdir -p /tmp/cargo /tmp/rustup /tmp/cargo-target

echo "🔧 Installing CPU-only PyTorch (saves ~2GB)..."
pip install --upgrade pip setuptools wheel

# Install CPU-only PyTorch first (much smaller than GPU version)
pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    "torch>=2.0.0,<3.0.0" \
    "torchvision>=0.15.0,<1.0.0"

echo "📦 Installing other dependencies (including ChromaDB)..."
# Install remaining dependencies with Rust environment set
# ChromaDB will compile with Rust using the environment variables above
CARGO_HOME=/tmp/cargo RUSTUP_HOME=/tmp/rustup CARGO_TARGET_DIR=/tmp/cargo-target \
    pip install --no-cache-dir -r requirements.prod.txt

echo "✅ Build completed successfully"
