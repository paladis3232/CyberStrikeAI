# netexec

## Overview
- Tool name: `netexec`
- Enabled in config: `true`
- Executable: `netexec`
- Default args: none
- Summary: Network enumeration and exploitation framework (formerly CrackMapExec)

## Detailed Description
NetExec (formerly CrackMapExec) is a network enumeration and exploitation framework supporting multiple protocols.

**Key Features:**
- Support for multiple protocols (SMB, SSH, WinRM, etc.)
- Credential validation
- Lateral movement
- Modular architecture

**Use Cases:**
- Network penetration testing
- Domain environment testing
- Lateral movement testing
- Credential validation

## Parameters
### `protocol`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `smb`
- Description: Protocol type (smb, ssh, winrm, etc.)

### `target`
- Type: `string`
- Required: `true`
- Position: `1`
- Format: `positional`
- Description: Target IP or network

### `username`
- Type: `string`
- Required: `false`
- Flag: `-u`
- Format: `flag`
- Description: Username

### `password`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Password

### `hash_value`
- Type: `string`
- Required: `false`
- Flag: `-H`
- Format: `flag`
- Description: NTLM hash (for Pass-the-Hash)

### `module`
- Type: `string`
- Required: `false`
- Flag: `-M`
- Format: `flag`
- Description: Module to execute

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional NetExec parameters

## Invocation Template
```bash
netexec <protocol> <target> <username> <password> <hash_value> <module> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
