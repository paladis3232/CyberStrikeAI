# qsreplace

## Overview
- Tool name: `qsreplace`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing URL list\n")
    sys.exit(1)

urls = sys.argv[1]
replacement = sys.argv[2] if len(sys.argv) > 2 else ""
extra = sys.argv[3] if len(sys.argv) > 3 else ""

cmd = ["qsreplace"]
if extra:
    cmd.extend(shlex.split(extra))
if replacement:
    cmd.append(replacement)

proc = subprocess.run(
    cmd,
    input=urls,
    capture_output=True,
    text=True,
)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
`
- Summary: Query string parameter replacement tool

## Detailed Description
Qsreplace is a tool for replacing query string parameters in URLs, commonly used for fuzzing.

**Key Features:**
- Parameter replacement
- Batch processing
- Multiple replacement modes
- Fast processing

**Use Cases:**
- Parameter fuzzing
- URL processing
- Tool chain integration
- Security testing

## Parameters
### `urls`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: URLs to process (one per line)

### `replacement`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Replacement string

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Additional Qsreplace parameters. Used to pass Qsreplace options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing URL list\n")
    sys.exit(1)

urls = sys.argv[1]
replacement = sys.argv[2] if len(sys.argv) > 2 else ""
extra = sys.argv[3] if len(sys.argv) > 3 else ""

cmd = ["qsreplace"]
if extra:
    cmd.extend(shlex.split(extra))
if replacement:
    cmd.append(replacement)

proc = subprocess.run(
    cmd,
    input=urls,
    capture_output=True,
    text=True,
)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
 <urls> <replacement> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
