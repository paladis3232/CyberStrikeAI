# rpcclient

## Overview
- Tool name: `rpcclient`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing target address\n")
    sys.exit(1)

target = sys.argv[1]
username = sys.argv[2] if len(sys.argv) > 2 else ""
password = sys.argv[3] if len(sys.argv) > 3 else ""
domain = sys.argv[4] if len(sys.argv) > 4 else ""
commands = sys.argv[5] if len(sys.argv) > 5 else ""
extra = sys.argv[6] if len(sys.argv) > 6 else ""

cmd = ["rpcclient"]

if username:
    cred = username
    if password:
        cred = f"{username}%{password}"
    cmd.extend(["-U", cred])
elif password:
    # If only password is provided, still attempt connection with empty username
    cmd.extend(["-U", f"%{password}"])

if domain:
    cmd.extend(["-W", domain])

if commands:
    cmd.extend(["-c", commands])

if extra:
    cmd.extend(shlex.split(extra))

cmd.append(target)

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
`
- Summary: RPC enumeration tool

## Detailed Description
rpcclient is an RPC client tool for enumerating Windows/Samba system information.

**Key Features:**
- RPC enumeration
- User and group enumeration
- Domain information queries
- System information gathering

**Use Cases:**
- Windows system penetration testing
- Samba enumeration
- Domain environment reconnaissance
- Security testing

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address

### `username`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Username

### `password`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: ``
- Description: Password

### `domain`
- Type: `string`
- Required: `false`
- Position: `3`
- Format: `positional`
- Default: ``
- Description: Domain name

### `commands`
- Type: `string`
- Required: `false`
- Position: `4`
- Format: `positional`
- Default: `enumdomusers;enumdomgroups;querydominfo`
- Description: RPC commands (semicolon-separated)

### `additional_args`
- Type: `string`
- Required: `false`
- Position: `5`
- Format: `positional`
- Default: ``
- Description: Additional rpcclient parameters. Used to pass rpcclient options not defined in the parameter list.

## Invocation Template
```bash
python3 -c import shlex
import subprocess
import sys

if len(sys.argv) < 2:
    sys.stderr.write("Missing target address\n")
    sys.exit(1)

target = sys.argv[1]
username = sys.argv[2] if len(sys.argv) > 2 else ""
password = sys.argv[3] if len(sys.argv) > 3 else ""
domain = sys.argv[4] if len(sys.argv) > 4 else ""
commands = sys.argv[5] if len(sys.argv) > 5 else ""
extra = sys.argv[6] if len(sys.argv) > 6 else ""

cmd = ["rpcclient"]

if username:
    cred = username
    if password:
        cred = f"{username}%{password}"
    cmd.extend(["-U", cred])
elif password:
    # If only password is provided, still attempt connection with empty username
    cmd.extend(["-U", f"%{password}"])

if domain:
    cmd.extend(["-W", domain])

if commands:
    cmd.extend(["-c", commands])

if extra:
    cmd.extend(shlex.split(extra))

cmd.append(target)

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.stdout:
    sys.stdout.write(proc.stdout)
if proc.stderr:
    sys.stderr.write(proc.stderr)
sys.exit(proc.returncode)
 <target> <username> <password> <domain> <commands> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
