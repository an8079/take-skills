#!/bin/bash
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="${HOME}/.claude"

echo "Installing Claude Dev Assistant..."

# Create directories
mkdir -p "${DEST_DIR}/commands"
mkdir -p "${DEST_DIR}/skills"
mkdir -p "${DEST_DIR}/agents"

# Copy commands
echo "Installing commands..."
cp -r "${REPO_DIR}/commands/"*.md "${DEST_DIR}/commands/" 2>/dev/null || true

# Copy skills
echo "Installing skills..."
cp -r "${REPO_DIR}/skills/"* "${DEST_DIR}/skills/" 2>/dev/null || true

# Copy agents
echo "Installing agents..."
cp -r "${REPO_DIR}/skills/agents/" "${DEST_DIR}/agents/" 2>/dev/null || true

# Copy docs
mkdir -p "${DEST_DIR}/docs"
cp -r "${REPO_DIR}/docs/" "${DEST_DIR}/docs/" 2>/dev/null || true

echo "Installation complete!"
echo "Run 'claude' to start using the assistant."
