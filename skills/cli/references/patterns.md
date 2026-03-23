# Common Shell Patterns

## Variables

```bash
# Define variable
name="value"

# Read-only variable
readonly CONST="immutable"

# Array
files=("a.txt" "b.txt" "c.txt")

# Associative array (bash 4+)
declare -A config
config[key]="value"
```

## Conditionals

```bash
# String comparison
if [[ "$var" == "value" ]]; then
  echo "match"
fi

# File test
if [[ -f "$file" ]]; then
  echo "regular file"
fi

# Numeric comparison
if [[ $count -gt 10 ]]; then
  echo "large"
fi

# Logical operators
if [[ -f "$a" ]] && [[ -f "$b" ]]; then
  echo "both exist"
fi
```

## Loops

```bash
# For loop
for i in {1..10}; do
  echo "$i"
done

# For loop with glob
for f in *.txt; do
  echo "$f"
done

# While read
while IFS= read -r line; do
  echo "$line"
done < "file.txt"

# C-style for
for ((i=0; i<10; i++)); do
  echo "$i"
done
```

## Functions

```bash
# Basic function
greet() {
  echo "Hello, $1"
}

# Return value
get_status() {
  return 0  # or return 1 for error
}

# Capture output
result=$(command)
```

## Error Handling

```bash
# Exit on error
set -e

# Exit on undefined
set -u

# Exit on pipe fail
set -o pipefail

# Trap errors
trap 'echo "Error on line $LINENO"' ERR
```
