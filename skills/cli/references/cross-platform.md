# Cross-Platform Shell Scripting

## OS Detection

```bash
case "$(uname -s)" in
  Linux*)     OS=linux;;
  Darwin*)    OS=macos;;
  CYGWIN*|MINGW*|MSYS*) OS=windows;;
  *)          OS=unknown;;
esac
```

## Path Handling

```bash
# Path separator
if [[ "$OS" == "windows" ]]; then
  SEP=";"
else
  SEP=":"
fi

# Convert path
cygpath -u /c/path  # Windows to Unix
cygpath -w /unix/path  # Unix to Windows
```

## Shebang

```bash
# Portable shebang
#!/usr/bin/env bash

# Force bash (not sh)
#!/bin/bash
```

## Common Differences

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| `readlink -f` | Yes | No | N/A |
| `stat -c` | Yes | No | N/A |
| `read` | GNU | BSD | N/A |
| `seq` | GNU | BSD | N/A |

## Windows-Specific

```bash
# PowerShell from bash
powershell -Command "Get-Process"

# WSL path conversion
wslpath -w "/unix/path"
```
