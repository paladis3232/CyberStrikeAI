# anew

## Overview
- Tool name: `anew`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing input data\n")
    sys.exit(1)

input_data = sys.argv[1]
output_file = sys.argv[2] if len(sys.argv) > 2 else ""
additional = sys.argv[3] if len(sys.argv) > 3 else ""

cmd = ["anew"]
if additional:
    cmd.extend(shlex.split(additional))
if output_file:
    cmd.append(output_file)

proc = subprocess.run(
    cmd,
    input=input_data.encode("utf-8"),
    capture_output=True,
    text=True,
)

if proc.returncode != 0:
    sys.stderr.write(proc.stderr or proc.stdout)
    sys.exit(proc.returncode)

sys.stdout.write(proc.stdout)
`
- Summary: Data deduplication tool for appending new lines to files

## Detailed Description
Anew is a data deduplication tool that appends new lines to a file, automatically filtering duplicates.

**Key Features:**
- Data deduplication
- File appending
- Unique line filtering
- Fast processing

**Use Cases:**
- Data processing
- Result deduplication
- Data merging
- Tool chain integration

## Parameters
### `input_data`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Input data

### `output_file`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Output file path

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Additional anew parameters. Used to pass anew options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing input data\n")
    sys.exit(1)

input_data = sys.argv[1]
output_file = sys.argv[2] if len(sys.argv) > 2 else ""
additional = sys.argv[3] if len(sys.argv) > 3 else ""

cmd = ["anew"]
if additional:
    cmd.extend(shlex.split(additional))
if output_file:
    cmd.append(output_file)

proc = subprocess.run(
    cmd,
    input=input_data.encode("utf-8"),
    capture_output=True,
    text=True,
)

if proc.returncode != 0:
    sys.stderr.write(proc.stderr or proc.stdout)
    sys.exit(proc.returncode)

sys.stdout.write(proc.stdout)
 <input_data> <output_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
