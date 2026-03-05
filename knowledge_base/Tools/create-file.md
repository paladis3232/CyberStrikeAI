# create-file

## Overview
- Tool name: `create-file`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import base64
import sys
from pathlib import Path

if len(sys.argv) < 3:
    sys.stderr.write("Usage: create-file <filename> <content> [binary]\n")
    sys.exit(1)

filename = sys.argv[1]
content = sys.argv[2]
binary_arg = sys.argv[3].lower() if len(sys.argv) > 3 else "false"
binary = binary_arg in ("1", "true", "yes", "on")

path = Path(filename)
if not path.is_absolute():
    path = Path.cwd() / path
path.parent.mkdir(parents=True, exist_ok=True)

if binary:
    data = base64.b64decode(content)
    path.write_bytes(data)
else:
    path.write_text(content, encoding="utf-8")

print(f"File created: {path}")
`
- Summary: File creation tool

## Detailed Description
Create files with specified content on the server.

**Key Features:**
- Create files
- Write content
- Support for binary files

**Use Cases:**
- File creation
- Script generation
- Data saving

## Parameters
### `filename`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Filename to create

### `content`
- Type: `string`
- Required: `true`
- Position: `1`
- Format: `positional`
- Description: File content

### `binary`
- Type: `bool`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: `False`
- Description: Whether content is Base64-encoded binary

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional create-file parameters. Used to pass create-file options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import base64
import sys
from pathlib import Path

if len(sys.argv) < 3:
    sys.stderr.write("Usage: create-file <filename> <content> [binary]\n")
    sys.exit(1)

filename = sys.argv[1]
content = sys.argv[2]
binary_arg = sys.argv[3].lower() if len(sys.argv) > 3 else "false"
binary = binary_arg in ("1", "true", "yes", "on")

path = Path(filename)
if not path.is_absolute():
    path = Path.cwd() / path
path.parent.mkdir(parents=True, exist_ok=True)

if binary:
    data = base64.b64decode(content)
    path.write_bytes(data)
else:
    path.write_text(content, encoding="utf-8")

print(f"File created: {path}")
 <filename> <content> <binary> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
