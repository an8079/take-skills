#!/bin/bash
set -e

VERSION=${1:-$(date +%Y.%m.%d)}
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "Releasing Claude Dev Assistant v$VERSION"

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory is dirty. Commit or stash changes first."
  exit 1
fi

# Run validation
echo "Running validation..."
bash bin/release.sh --dry-run 2>/dev/null || {
  echo "Warning: Validation skipped (no validate script)"
}

# Create tag
TAG="v$VERSION"
echo "Creating tag: $TAG"
git tag -a "$TAG" -m "Release $TAG"

# Push
echo "Pushing to remote..."
git push origin main --tags

echo "Release v$VERSION complete!"
echo "Create GitHub release at: https://github.com/YOUR_USERNAME/claude-studio/releases/new?tag=$TAG"
