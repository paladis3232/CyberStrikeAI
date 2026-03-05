# impacket

## Overview
- Tool name: `impacket`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import json
import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing Impacket script path\n")
    sys.exit(1)

script_path = sys.argv[1]
args_raw = sys.argv[2] if len(sys.argv) > 2 else ""
extra = sys.argv[3] if len(sys.argv) > 3 else ""

cmd = [script_path]

if args_raw:
    parsed = []
    try:
        candidate = json.loads(args_raw)
        if isinstance(candidate, list):
            parsed = [str(item) for item in candidate]
        elif isinstance(candidate, str):
            parsed = shlex.split(candidate)
    except (json.JSONDecodeError, ValueError):
        parsed = shlex.split(args_raw)
    cmd.extend(parsed)

if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
`
- Summary: Impacket network protocol toolkit for network protocol attacks and lateral movement

## Detailed Description
Impacket is a Python toolkit for handling network protocols, commonly used in penetration testing and lateral movement.

**Key Features:**
- SMB protocol attacks
- Kerberos protocol attacks
- RPC protocol attacks
- Remote command execution
- Credential dumping
- Pass-the-ticket attacks

**Common Tools:**
- psexec: Remote command execution
- smbexec: SMB remote execution
- wmiexec: WMI remote execution
- secretsdump: Credential dumping
- getTGT: Kerberos ticket retrieval

**Use Cases:**
- Lateral movement
- Credential dumping
- Remote command execution
- Post-exploitation

**Notes:**
- Requires Python environment
- Requires appropriate credentials
- For authorized security testing only
- Tool paths are typically at /usr/share/doc/python3-impacket/examples/ or installed via pip

## Parameters
### `script`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Impacket script path, e.g. '/usr/share/doc/python3-impacket/examples/psexec.py'

### `args`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Script parameters (JSON array or space-separated string)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Additional impacket parameters. Used to pass impacket options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import json
import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing Impacket script path\n")
    sys.exit(1)

script_path = sys.argv[1]
args_raw = sys.argv[2] if len(sys.argv) > 2 else ""
extra = sys.argv[3] if len(sys.argv) > 3 else ""

cmd = [script_path]

if args_raw:
    parsed = []
    try:
        candidate = json.loads(args_raw)
        if isinstance(candidate, list):
            parsed = [str(item) for item in candidate]
        elif isinstance(candidate, str):
            parsed = shlex.split(candidate)
    except (json.JSONDecodeError, ValueError):
        parsed = shlex.split(args_raw)
    cmd.extend(parsed)

if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
 <script> <args> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
