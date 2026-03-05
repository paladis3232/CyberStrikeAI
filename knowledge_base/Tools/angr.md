# angr

## Overview
- Tool name: `angr`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing script content\n")
    sys.exit(1)

script_content = sys.argv[1]
binary = sys.argv[2] if len(sys.argv) > 2 else ""
find_address = sys.argv[3] if len(sys.argv) > 3 else ""
avoid_addresses = sys.argv[4] if len(sys.argv) > 4 else ""
analysis_type = sys.argv[5] if len(sys.argv) > 5 else ""
extra = sys.argv[6] if len(sys.argv) > 6 else ""

context = {
    "binary_path": binary,
    "find_address": find_address,
    "avoid_addresses": [addr.strip() for addr in avoid_addresses.split(",") if addr.strip()],
    "analysis_type": analysis_type or "symbolic",
}

if extra:
    context["additional_args"] = shlex.split(extra)
else:
    context["additional_args"] = []

# Execute user script with context variables
exec(script_content, context)
`
- Summary: Symbolic execution and binary analysis framework

## Detailed Description
Angr is a symbolic execution and binary analysis framework for automated vulnerability discovery and exploitation.

**Usage:**
- Provide a Python script via the `script_content` parameter; can directly import `angr` and access the following variables:
  - `binary_path`: Target binary path
  - `find_address`: Address to find (can be empty)
  - `avoid_addresses`: List of addresses to avoid
  - `analysis_type`: Custom analysis type label (default: symbolic)
  - `additional_args`: Additional argument list (passed via `additional_args`)
- Control the analysis flow in the script and use `print()` to output results.

## Parameters
### `script_content`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Content of the angr Python script to execute

### `binary`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Path to the binary file to analyze, passed to the script as the binary_path variable

### `find_address`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Address to find in symbolic execution (optional, passed to script as find_address variable)

### `avoid_addresses`
- Type: `string`
- Required: `false`
- Position: `3`
- Format: `positional`
- Default: ``
- Description: Addresses to avoid (comma-separated, script variable avoid_addresses)

### `analysis_type`
- Type: `string`
- Required: `false`
- Position: `4`
- Format: `positional`
- Default: `symbolic`
- Description: Analysis type label for custom branching in the script (e.g. symbolic/cfg/static)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `5`
- Format: `positional`
- Default: ``
- Description: Additional arguments, accessible in the script via the `additional_args` list.

## Invocation Template
```bash
python3 -c import shlex
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing script content\n")
    sys.exit(1)

script_content = sys.argv[1]
binary = sys.argv[2] if len(sys.argv) > 2 else ""
find_address = sys.argv[3] if len(sys.argv) > 3 else ""
avoid_addresses = sys.argv[4] if len(sys.argv) > 4 else ""
analysis_type = sys.argv[5] if len(sys.argv) > 5 else ""
extra = sys.argv[6] if len(sys.argv) > 6 else ""

context = {
    "binary_path": binary,
    "find_address": find_address,
    "avoid_addresses": [addr.strip() for addr in avoid_addresses.split(",") if addr.strip()],
    "analysis_type": analysis_type or "symbolic",
}

if extra:
    context["additional_args"] = shlex.split(extra)
else:
    context["additional_args"] = []

# Execute user script with context variables
exec(script_content, context)
 <script_content> <binary> <find_address> <avoid_addresses> <analysis_type> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
