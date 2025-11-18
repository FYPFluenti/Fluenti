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

# Create Cargo config file to force use of writable directories
mkdir -p /tmp/cargo
cat > /tmp/cargo/config.toml << EOF
[build]
target-dir = "$CARGO_TARGET_DIR"

[net]
git-fetch-with-cli = true
EOF

# Verify environment variables are set
echo "🔧 Rust environment configured:"
echo "   CARGO_HOME=$CARGO_HOME"
echo "   RUSTUP_HOME=$RUSTUP_HOME"
echo "   CARGO_TARGET_DIR=$CARGO_TARGET_DIR"
echo "   Cargo config created at /tmp/cargo/config.toml"

# Export environment variables to ensure they're available to all subprocesses
export CARGO_HOME=/tmp/cargo
export RUSTUP_HOME=/tmp/rustup
export CARGO_TARGET_DIR=/tmp/cargo-target
export CARGO_NET_GIT_FETCH_WITH_CLI=true

# Upgrade pip and build tools first
echo "📦 Upgrading pip and build tools..."
CARGO_HOME=/tmp/cargo RUSTUP_HOME=/tmp/rustup CARGO_TARGET_DIR=/tmp/cargo-target pip install --upgrade pip setuptools wheel

# Install dependencies preferring binary wheels
# Use --prefer-binary to avoid building from source when possible
# Explicitly set environment variables in the command to ensure they're passed to subprocesses
echo "📦 Installing dependencies from requirements.prod.txt..."
env CARGO_HOME=/tmp/cargo RUSTUP_HOME=/tmp/rustup CARGO_TARGET_DIR=/tmp/cargo-target CARGO_NET_GIT_FETCH_WITH_CLI=true pip install --prefer-binary -r requirements.prod.txt

echo "✅ Build completed successfully"

