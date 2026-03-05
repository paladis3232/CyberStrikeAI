# libc-database

## Overview
- Tool name: `libc-database`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing action type (find/dump/download)\n")
    sys.exit(1)

action = sys.argv[1]
symbols = sys.argv[2] if len(sys.argv) > 2 else ""
libc_id = sys.argv[3] if len(sys.argv) > 3 else ""
extra = sys.argv[4] if len(sys.argv) > 4 else ""

cmd = ["libc-database", action]

if symbols:
    cmd.extend(shlex.split(symbols))

if libc_id:
    cmd.append(libc_id)

if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
`
- Summary: libc identification and offset lookup tool

## Detailed Description
Libc-database is a tool for libc identification and offset lookup.

**Key Features:**
- libc identification
- Symbol offset lookup
- libc download
- Database queries

**Use Cases:**
- CTF challenges
- Exploit development
- libc identification
- Security research

## Parameters
### `action`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Action to perform (find, dump, download)

### `symbols`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Symbols and offsets (format: symbol1:offset1 symbol2:offset2)

### `libc_id`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Libc ID (for dump/download operations)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `3`
- Format: `positional`
- Default: ``
- Description: Additional libc-database parameters. Used to pass libc-database options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing action type (find/dump/download)\n")
    sys.exit(1)

action = sys.argv[1]
symbols = sys.argv[2] if len(sys.argv) > 2 else ""
libc_id = sys.argv[3] if len(sys.argv) > 3 else ""
extra = sys.argv[4] if len(sys.argv) > 4 else ""

cmd = ["libc-database", action]

if symbols:
    cmd.extend(shlex.split(symbols))

if libc_id:
    cmd.append(libc_id)

if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
 <action> <symbols> <libc_id> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
