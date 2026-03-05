# modify-file

## Overview
- Tool name: `modify-file`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import sys
from pathlib import Path

if len(sys.argv) < 3:
    sys.stderr.write("Usage: modify-file <filename> <content> [append]\n")
    sys.exit(1)

filename = sys.argv[1]
content = sys.argv[2]
append_arg = sys.argv[3].lower() if len(sys.argv) > 3 else "false"
append = append_arg in ("1", "true", "yes", "on")

path = Path(filename)
if not path.is_absolute():
    path = Path.cwd() / path
path.parent.mkdir(parents=True, exist_ok=True)

mode = "a" if append else "w"
with path.open(mode, encoding="utf-8") as f:
    f.write(content)

action = "Appended" if append else "Overwritten"
print(f"{action} write complete: {path}")
`
- Summary: File modification tool

## Detailed Description
Modify existing files on the server.

**Key Features:**
- Modify files
- Append content
- Overwrite content

**Use Cases:**
- File editing
- Content appending
- Configuration modification

## Parameters
### `filename`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Filename to modify

### `content`
- Type: `string`
- Required: `true`
- Position: `1`
- Format: `positional`
- Description: Content to write or append

### `append`
- Type: `bool`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: `False`
- Description: Whether to append (true) or overwrite (false)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional modify-file parameters. Used to pass modify-file options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import sys
from pathlib import Path

if len(sys.argv) < 3:
    sys.stderr.write("Usage: modify-file <filename> <content> [append]\n")
    sys.exit(1)

filename = sys.argv[1]
content = sys.argv[2]
append_arg = sys.argv[3].lower() if len(sys.argv) > 3 else "false"
append = append_arg in ("1", "true", "yes", "on")

path = Path(filename)
if not path.is_absolute():
    path = Path.cwd() / path
path.parent.mkdir(parents=True, exist_ok=True)

mode = "a" if append else "w"
with path.open(mode, encoding="utf-8") as f:
    f.write(content)

action = "Appended" if append else "Overwritten"
print(f"{action} write complete: {path}")
 <filename> <content> <append> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
