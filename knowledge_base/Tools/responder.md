# responder

## Overview
- Tool name: `responder`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys
import time

interface = sys.argv[1] if len(sys.argv) > 1 else "eth0"
analyze = sys.argv[2].lower() == "true" if len(sys.argv) > 2 else False
wpad = sys.argv[3].lower() == "true" if len(sys.argv) > 3 else True
fingerprint = sys.argv[4].lower() == "true" if len(sys.argv) > 4 else False
duration = int(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else 300
extra = sys.argv[6] if len(sys.argv) > 6 else ""

cmd = ["responder", "-I", interface]
if analyze:
    cmd.append("-A")
if wpad:
    cmd.append("-w")
if fingerprint:
    cmd.append("-f")
if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.Popen(cmd)
try:
    if duration > 0:
        time.sleep(duration)
        proc.terminate()
        proc.wait(timeout=10)
    else:
        proc.wait()
except KeyboardInterrupt:
    proc.terminate()
    proc.wait(timeout=10)
`
- Summary: LLMNR/NBT-NS/MDNS poisoning and credential capture tool

## Detailed Description
Wraps Responder with support for automatically stopping the process after a specified duration to avoid occupying the network.

## Parameters
### `interface`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `eth0`
- Description: Network interface (-I)

### `analyze`
- Type: `bool`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: `False`
- Description: Analyze-only mode (-A)

### `wpad`
- Type: `bool`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: `True`
- Description: Enable WPAD rogue proxy (-w)

### `fingerprint`
- Type: `bool`
- Required: `false`
- Position: `3`
- Format: `positional`
- Default: `False`
- Description: Fingerprinting mode (-f)

### `duration`
- Type: `int`
- Required: `false`
- Position: `4`
- Format: `positional`
- Default: `300`
- Description: Run duration in seconds (0 = until manually stopped)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `5`
- Format: `positional`
- Default: ``
- Description: Additional Responder parameters (appended directly)

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys
import time

interface = sys.argv[1] if len(sys.argv) > 1 else "eth0"
analyze = sys.argv[2].lower() == "true" if len(sys.argv) > 2 else False
wpad = sys.argv[3].lower() == "true" if len(sys.argv) > 3 else True
fingerprint = sys.argv[4].lower() == "true" if len(sys.argv) > 4 else False
duration = int(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else 300
extra = sys.argv[6] if len(sys.argv) > 6 else ""

cmd = ["responder", "-I", interface]
if analyze:
    cmd.append("-A")
if wpad:
    cmd.append("-w")
if fingerprint:
    cmd.append("-f")
if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.Popen(cmd)
try:
    if duration > 0:
        time.sleep(duration)
        proc.terminate()
        proc.wait(timeout=10)
    else:
        proc.wait()
except KeyboardInterrupt:
    proc.terminate()
    proc.wait(timeout=10)
 <interface> <analyze> <wpad> <fingerprint> <duration> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
