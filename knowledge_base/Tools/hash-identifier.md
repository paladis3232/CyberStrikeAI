# hash-identifier

## Overview
- Tool name: `hash-identifier`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing hash value\n")
    sys.exit(1)

hash_value = sys.argv[1]
extra = sys.argv[2] if len(sys.argv) > 2 else ""

cmd = ["hash-identifier"]
if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.run(
    cmd,
    input=f"{hash_value}\n",
    capture_output=True,
    text=True,
)

if proc.returncode != 0:
    sys.stderr.write(proc.stderr or proc.stdout)
    sys.exit(proc.returncode)

sys.stdout.write(proc.stdout)
`
- Summary: Hash type identification tool for identifying the type of unknown hash values

## Detailed Description
hash-identifier is a tool for identifying the type of hash values, helping determine the algorithm used by an unknown hash.

**Key Features:**
- Identify multiple hash algorithms
- Supports MD5, SHA1, SHA256, bcrypt, and more
- Interactive identification
- Quickly identify common hash types

**Supported Hash Types:**
- MD5
- SHA1, SHA256, SHA512
- bcrypt
- NTLM
- MySQL
- PostgreSQL
- And many more hash algorithms

**Use Cases:**
- CTF password cracking
- Hash value analysis
- Cryptography research
- Security auditing

**Notes:**
- Requires Python environment
- Interactive tool, may require special handling

## Parameters
### `hash`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: The hash value to identify

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Additional hash-identifier parameters. Used to pass hash-identifier options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing hash value\n")
    sys.exit(1)

hash_value = sys.argv[1]
extra = sys.argv[2] if len(sys.argv) > 2 else ""

cmd = ["hash-identifier"]
if extra:
    cmd.extend(shlex.split(extra))

proc = subprocess.run(
    cmd,
    input=f"{hash_value}\n",
    capture_output=True,
    text=True,
)

if proc.returncode != 0:
    sys.stderr.write(proc.stderr or proc.stdout)
    sys.exit(proc.returncode)

sys.stdout.write(proc.stdout)
 <hash> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
