---
name: cli
description: "CLI tooling skill: includes shell scripting, process management, argument parsing, and terminal utilities. Use when user mentions 'cli', 'command line', 'shell', 'script', 'terminal', 'bash', 'args', or 'flags'."
---

# CLI Skill

Command-line interface development and automation skill.

## When to Use This Skill

Trigger when any of these applies:
- Writing shell scripts (bash, zsh, powershell)
- Processing command-line arguments
- Managing child processes
- Building CLI tools
- Terminal automation
- File I/O via shell

## Not For / Boundaries

- This skill does not cover IDE integration (see `editor` skill)
- Not for GUI automation
- Not for network programming (see `network` skill)

## Quick Reference

### Shell Scripting

```bash
# Basic script structure
#!/bin/bash
set -euo pipefail

# Arguments
args=("$@")
echo "${args[0]}"

# Conditionals
if [ -f "$file" ]; then
  echo "exists"
fi

# Loops
for f in *.txt; do
  echo "$f"
done
```

### Argument Parsing

```bash
# Simple argument handling
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      HELP=true
      ;;
    -v|--verbose)
      VERBOSE=true
      ;;
    -o|--output)
      OUTPUT="$2"
      shift
      ;;
    *)
      ARGS+=("$1")
      ;;
  esac
  shift
done
```

### Process Management

```bash
# Background process
command &

# Wait for process
wait $PID

# Job control
jobs
fg
bg

# Process substitution
while read line; do
  echo "$line"
done < <(command)
```

### Common Patterns

```bash
# Check if command exists
command -v git >/dev/null 2>&1 || { echo "git required"; exit 1; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read file line by line
while IFS= read -r line; do
  echo "$line"
done < "file.txt"

# Safe delete
rm -i files

# Dry-run mode
if [[ "$DRY_RUN" == "true" ]]; then
  echo "Would delete: $files"
else
  rm $files
fi
```

### Error Handling

```bash
# Exit on error
set -e

# Exit on undefined variable
set -u

# Exit on pipe failure
set -o pipefail

# Try-catch equivalent
run() { "$@"; } || echo "Failed: $*"

# Custom error function
error() { echo "ERROR: $*" >&2; exit 1; }
```

### Cross-Platform Considerations

```bash
# Detect OS
case "$(uname -s)" in
  Linux*)     OS=linux;;
  Darwin*)    OS=macos;;
  CYGWIN*)    OS=windows;;
  MINGW*)     OS=windows;;
  *)          OS=unknown;;
esac

# Cross-platform path
if [[ "$OS" == "windows" ]]; then
  sep=";"
else
  sep=":"
fi
```

## Examples

### Example 1: Simple CLI Tool

- Input: Create a CLI tool that counts lines in files
- Steps:
  1. Parse arguments (file paths)
  2. Loop through files
  3. Count lines with `wc -l`
  4. Print totals
- Expected output: Script that handles multiple files and shows total

### Example 2: Argument Parsing Script

- Input: Script with `-n`, `--name`, `-v` flags
- Steps:
  1. Parse flags
  2. Validate required args
  3. Execute based on flags
- Expected output: Properly parsed and validated arguments

### Example 3: Process Pipeline

- Input: Monitor a process and restart if it dies
- Steps:
  1. Start process in background
  2. Loop with health check
  3. Restart if dead
- Expected output: Auto-restarting service script

## References

- `references/index.md`: Navigation
- `references/patterns.md`: Common shell patterns
- `references/cross-platform.md`: Cross-platform scripting

## Maintenance

- Sources: Bash documentation, POSIX standards
- Last updated: 2026-03-01
- Known limits: Windows-specific PowerShell not covered
