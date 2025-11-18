#!/bin/bash
# Build script for Render deployment
# Sets up Rust environment variables before pip installation

set -e  # Exit on error

# Set Rust environment variables to writable locations
# These must be set before any Rust tooling is invoked
export CARGO_HOME=/tmp/cargo
export RUSTUP_HOME=/tmp/rustup
export CARGO_TARGET_DIR=/tmp/cargo-target
export CARGO_NET_GIT_FETCH_WITH_CLI=true

# Create writable directories with proper permissions
mkdir -p /tmp/cargo /tmp/rustup /tmp/cargo-target
chmod -R 755 /tmp/cargo /tmp/rustup /tmp/cargo-target 2>/dev/null || true

# Verify environment variables are set
echo "🔧 Rust environment configured:"
echo "   CARGO_HOME=$CARGO_HOME"
echo "   RUSTUP_HOME=$RUSTUP_HOME"
echo "   CARGO_TARGET_DIR=$CARGO_TARGET_DIR"

# Upgrade pip and build tools first
echo "📦 Upgrading pip and build tools..."
pip install --upgrade pip setuptools wheel

# Install dependencies preferring binary wheels
# Use --prefer-binary to avoid building from source when possible
echo "📦 Installing dependencies from requirements.prod.txt..."
pip install --prefer-binary -r requirements.prod.txt

echo "✅ Build completed successfully"

