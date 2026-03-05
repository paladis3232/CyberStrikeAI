#!/usr/bin/env bash
set -euo pipefail

# Verifies enabled tool command availability from tools/*.yaml.
# Run from repo root:
#   bash scripts/verify-enabled-tools.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="$ROOT_DIR/tools"
VENV_BIN="$ROOT_DIR/venv/bin"

if [[ ! -d "$TOOLS_DIR" ]]; then
  echo "tools directory not found: $TOOLS_DIR" >&2
  exit 1
fi

if [[ -d "$VENV_BIN" ]]; then
  export PATH="$VENV_BIN:$PATH"
fi

enabled_count=0
missing_count=0

for f in "$TOOLS_DIR"/*.yaml; do
  [[ -f "$f" ]] || continue

  enabled="$(awk '/^enabled:[[:space:]]*/ {print $2; exit}' "$f" | tr -d '"')"
  command_name="$(awk -F'"' '/^command:[[:space:]]*/ {print $2; exit}' "$f")"
  if [[ -z "$command_name" ]]; then
    command_name="$(awk '/^command:[[:space:]]*/ {print $2; exit}' "$f" | tr -d '"')"
  fi

  if [[ "$enabled" != "true" ]]; then
    continue
  fi

  ((enabled_count+=1))

  if [[ -z "$command_name" || "$command_name" == internal:* ]]; then
    continue
  fi

  if command -v "$command_name" >/dev/null 2>&1; then
    printf "[OK]   %s (%s)\n" "$command_name" "$(basename "$f")"
  else
    ((missing_count+=1))
    printf "[MISS] %s (%s)\n" "$command_name" "$(basename "$f")"
  fi
done

echo
echo "enabled_tools=${enabled_count}"
echo "missing_enabled_commands=${missing_count}"

if ((missing_count > 0)); then
  exit 2
fi
