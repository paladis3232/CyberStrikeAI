# smbmap

## Overview
- Tool name: `smbmap`
- Enabled in config: `true`
- Executable: `smbmap`
- Default args: none
- Summary: SMB share enumeration and access tool

## Detailed Description
SMBMap is a tool for enumerating SMB shares and providing file access functionality.

**Key Features:**
- SMB share enumeration
- File listing and download
- Permission checking
- Support for multiple authentication methods

**Use Cases:**
- SMB security testing
- File share auditing
- Penetration testing
- Network reconnaissance

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Flag: `-H`
- Format: `flag`
- Description: Target IP address

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

### `domain`
- Type: `string`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Description: Domain name

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional SMBMap parameters

## Invocation Template
```bash
smbmap <target> <username> <password> <domain> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
