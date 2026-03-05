# uro

## Overview
- Tool name: `uro`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing URL list\n")
    sys.exit(1)

urls = sys.argv[1]
extra = sys.argv[2] if len(sys.argv) > 2 else ""

cmd = ["uro"]
if extra:
    cmd.extend(shlex.split(extra))

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
- Summary: URL filtering tool for deduplicating similar URLs

## Detailed Description
Uro is a URL filtering tool that removes similar URLs and deduplicates results.

**Key Features:**
- URL deduplication
- Similar URL filtering
- Whitelist/blacklist support
- Fast processing

**Use Cases:**
- URL deduplication
- Result filtering
- Data cleanup
- Tool chain integration

## Parameters
### `urls`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: URLs to filter (one per line)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Additional uro arguments. Used to pass uro options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing URL list\n")
    sys.exit(1)

urls = sys.argv[1]
extra = sys.argv[2] if len(sys.argv) > 2 else ""

cmd = ["uro"]
if extra:
    cmd.extend(shlex.split(extra))

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
 <urls> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
