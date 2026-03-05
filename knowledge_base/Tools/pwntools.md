# pwntools

## Overview
- Tool name: `pwntools`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import os
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing script content\n")
    sys.exit(1)

script_content = sys.argv[1]
target_binary = sys.argv[2] if len(sys.argv) > 2 else ""
target_host = sys.argv[3] if len(sys.argv) > 3 else ""
target_port = sys.argv[4] if len(sys.argv) > 4 else ""
exploit_type = sys.argv[5] if len(sys.argv) > 5 else "local"

if target_binary:
    os.environ["PWN_BINARY"] = target_binary
if target_host:
    os.environ["PWN_HOST"] = target_host
if target_port:
    os.environ["PWN_PORT"] = str(target_port)
if exploit_type:
    os.environ["PWN_EXPLOIT_TYPE"] = exploit_type

exec(script_content, {})
`
- Summary: CTF and exploit development framework

## Detailed Description
Executes custom pwntools scripts with common target information injected via environment variables:
- `PWN_BINARY`, `PWN_HOST`, `PWN_PORT`, `PWN_EXPLOIT_TYPE`

## Parameters
### `script_content`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Python script content (using pwntools)

### `target_binary`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Local binary file path (injected as PWN_BINARY)

### `target_host`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Remote host address (PWN_HOST)

### `target_port`
- Type: `string`
- Required: `false`
- Position: `3`
- Format: `positional`
- Default: ``
- Description: Remote port (PWN_PORT)

### `exploit_type`
- Type: `string`
- Required: `false`
- Position: `4`
- Format: `positional`
- Default: `local`
- Description: Exploit type label (PWN_EXPLOIT_TYPE)

## Invocation Template
```bash
python3 -c import os
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing script content\n")
    sys.exit(1)

script_content = sys.argv[1]
target_binary = sys.argv[2] if len(sys.argv) > 2 else ""
target_host = sys.argv[3] if len(sys.argv) > 3 else ""
target_port = sys.argv[4] if len(sys.argv) > 4 else ""
exploit_type = sys.argv[5] if len(sys.argv) > 5 else "local"

if target_binary:
    os.environ["PWN_BINARY"] = target_binary
if target_host:
    os.environ["PWN_HOST"] = target_host
if target_port:
    os.environ["PWN_PORT"] = str(target_port)
if exploit_type:
    os.environ["PWN_EXPLOIT_TYPE"] = exploit_type

exec(script_content, {})
 <script_content> <target_binary> <target_host> <target_port> <exploit_type>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
