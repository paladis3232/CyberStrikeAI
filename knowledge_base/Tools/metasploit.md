# metasploit

## Overview
- Tool name: `metasploit`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import json
import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing module name\n")
    sys.exit(1)

module = sys.argv[1]
options_raw = sys.argv[2] if len(sys.argv) > 2 else "{}"
extra = sys.argv[3] if len(sys.argv) > 3 else ""

try:
    options = json.loads(options_raw) if options_raw else {}
except json.JSONDecodeError as exc:
    sys.stderr.write(f"Failed to parse options: {exc}\n")
    sys.exit(1)

commands = [f"use {module}"]
for key, value in options.items():
    commands.append(f"set {key} {value}")
commands.append("run")
commands.append("exit")

cmd = ["msfconsole", "-q", "-x", "; ".join(commands)]
if extra:
    cmd.extend(shlex.split(extra))

subprocess.run(cmd, check=False)
`
- Summary: Metasploit penetration testing framework

## Detailed Description
Executes modules non-interactively via `msfconsole -q -x`. Module options can be provided in JSON format; the script automatically constructs `set` and `run` commands.

## Parameters
### `module`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Metasploit module to use (e.g. exploit/windows/smb/ms17_010_eternalblue)

### `options`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: `{}`
- Description: Module options (JSON object, key-value pairs corresponding to set commands)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Additional msfconsole parameters (appended to the end of the command)

## Invocation Template
```bash
python3 -c import json
import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing module name\n")
    sys.exit(1)

module = sys.argv[1]
options_raw = sys.argv[2] if len(sys.argv) > 2 else "{}"
extra = sys.argv[3] if len(sys.argv) > 3 else ""

try:
    options = json.loads(options_raw) if options_raw else {}
except json.JSONDecodeError as exc:
    sys.stderr.write(f"Failed to parse options: {exc}\n")
    sys.exit(1)

commands = [f"use {module}"]
for key, value in options.items():
    commands.append(f"set {key} {value}")
commands.append("run")
commands.append("exit")

cmd = ["msfconsole", "-q", "-x", "; ".join(commands)]
if extra:
    cmd.extend(shlex.split(extra))

subprocess.run(cmd, check=False)
 <module> <options> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
