# execute-python-script

## Overview
- Tool name: `execute-python-script`
- Enabled in config: `true`
- Executable: `/bin/bash`
- Default args: `-c set -euo pipefail

SCRIPT_CONTENT="$1"
ENV_NAME="${2:-default}"
ADDITIONAL_ARGS="${3:-}"

BASE_DIR="${HOME}/.cyberstrike/venvs"

detect_project_root() {
  if [ -n "${CYBERSTRIKE_ROOT:-}" ] && [ -d "${CYBERSTRIKE_ROOT}" ]; then
    printf '%s\n' "${CYBERSTRIKE_ROOT}"
    return
  fi
  if command -v git >/dev/null 2>&1; then
    local root_path
    if root_path=$(git rev-parse --show-toplevel 2>/dev/null); then
      printf '%s\n' "$root_path"
      return
    fi
  fi
  printf '%s\n' "$(pwd)"
}

resolve_env_dir() {
  local requested="$1"
  if [ -n "${VIRTUAL_ENV:-}" ] && { [ -z "$requested" ] || [ "$requested" = "default" ]; }; then
    printf '%s\n' "$VIRTUAL_ENV"
    return
  fi
  if [ -z "$requested" ] || [ "$requested" = "default" ]; then
    local root
    root="$(detect_project_root)"
    printf '%s/venv\n' "$root"
    return
  fi
  printf '%s/%s\n' "$BASE_DIR" "$requested"
}

ENV_DIR="$(resolve_env_dir "$ENV_NAME")"
mkdir -p "$(dirname "$ENV_DIR")"
if [ ! -d "$ENV_DIR" ]; then
  python3 -m venv "$ENV_DIR"
fi

# shellcheck disable=SC1090
source "$ENV_DIR/bin/activate"

if [ -n "$ADDITIONAL_ARGS" ]; then
  python3 $ADDITIONAL_ARGS -c "$SCRIPT_CONTENT"
else
  python3 -c "$SCRIPT_CONTENT"
fi
 _`
- Summary: Write and execute Python scripts in a specified virtual environment

## Detailed Description
Execute Python scripts in a virtual environment.

**Key Features:**
- Execute Python scripts
- Virtual environment support
- Script content execution

**Use Cases:**
- Script execution
- Automation tasks
- Data processing

## Parameters
### `script`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Python script content to execute, supports multiple lines.

### `env_name`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: `default`
- Description: Virtual environment name (default: default)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Default: ``
- Description: Additional execute-python-script parameters. Used to pass execute-python-script options not defined in the parameter list.

## Invocation Template
```bash
/bin/bash -c set -euo pipefail

SCRIPT_CONTENT="$1"
ENV_NAME="${2:-default}"
ADDITIONAL_ARGS="${3:-}"

BASE_DIR="${HOME}/.cyberstrike/venvs"

detect_project_root() {
  if [ -n "${CYBERSTRIKE_ROOT:-}" ] && [ -d "${CYBERSTRIKE_ROOT}" ]; then
    printf '%s\n' "${CYBERSTRIKE_ROOT}"
    return
  fi
  if command -v git >/dev/null 2>&1; then
    local root_path
    if root_path=$(git rev-parse --show-toplevel 2>/dev/null); then
      printf '%s\n' "$root_path"
      return
    fi
  fi
  printf '%s\n' "$(pwd)"
}

resolve_env_dir() {
  local requested="$1"
  if [ -n "${VIRTUAL_ENV:-}" ] && { [ -z "$requested" ] || [ "$requested" = "default" ]; }; then
    printf '%s\n' "$VIRTUAL_ENV"
    return
  fi
  if [ -z "$requested" ] || [ "$requested" = "default" ]; then
    local root
    root="$(detect_project_root)"
    printf '%s/venv\n' "$root"
    return
  fi
  printf '%s/%s\n' "$BASE_DIR" "$requested"
}

ENV_DIR="$(resolve_env_dir "$ENV_NAME")"
mkdir -p "$(dirname "$ENV_DIR")"
if [ ! -d "$ENV_DIR" ]; then
  python3 -m venv "$ENV_DIR"
fi

# shellcheck disable=SC1090
source "$ENV_DIR/bin/activate"

if [ -n "$ADDITIONAL_ARGS" ]; then
  python3 $ADDITIONAL_ARGS -c "$SCRIPT_CONTENT"
else
  python3 -c "$SCRIPT_CONTENT"
fi
 _ <script> <env_name> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
