# linpeas

## Overview
- Tool name: `linpeas`
- Enabled in config: `true`
- Executable: `linpeas.sh`
- Default args: none
- Summary: Linux privilege escalation enumeration script that automatically detects common privilege escalation paths

## Detailed Description
LinPEAS (Linux Privilege Escalation Awesome Script) is an automated privilege escalation enumeration script for detecting common privilege escalation paths in Linux systems.

**Key Features:**
- System information gathering
- Permission and group checks
- Writable file and directory detection
- SUID/SGID file discovery
- Environment variable checks
- Cron job analysis
- Network configuration checks
- Sensitive file discovery

**Use Cases:**
- Privilege escalation during penetration testing
- Security auditing
- Post-exploitation
- CTF competitions

**Notes:**
- Requires the linpeas.sh script to be downloaded on the target system
- Execution time may be long
- Outputs a large amount of information; recommended to save to a file

## Parameters
### `output`
- Type: `string`
- Required: `false`
- Flag: `-o`
- Format: `flag`
- Description: Output file path (optional)

### `fast`
- Type: `bool`
- Required: `false`
- Flag: `-fast`
- Format: `flag`
- Description: Fast mode, skips time-consuming checks

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional linpeas parameters. Used to pass linpeas options not defined in the parameter list.

## Invocation Template
```bash
linpeas.sh <output> <fast> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
