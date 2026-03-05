# mimikatz

## Overview
- Tool name: `mimikatz`
- Enabled in config: `false`
- Executable: `mimikatz.exe`
- Default args: none
- Summary: Windows credential extraction tool for extracting passwords and hashes from memory

## Detailed Description
Mimikatz is a powerful Windows credential extraction tool that can extract plaintext passwords, hashes, tickets, and other sensitive information from memory.

**Key Features:**
- Extract plaintext passwords from memory
- Extract NTLM hashes
- Extract Kerberos tickets
- Pass-the-Hash attacks
- Pass-the-Ticket attacks
- Credential dumping

**Use Cases:**
- Post-exploitation
- Lateral movement
- Privilege escalation
- Security research

**Notes:**
- Requires administrator privileges
- May be detected by antivirus software
- For authorized security testing only
- Must enter the mimikatz interactive command line before use

## Parameters
### `command`
- Type: `string`
- Required: `true`
- Format: `positional`
- Description: Mimikatz command, e.g. 'privilege::debug sekurlsa::logonpasswords'

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional mimikatz parameters. Used to pass mimikatz options not defined in the parameter list.

## Invocation Template
```bash
mimikatz.exe <command> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
