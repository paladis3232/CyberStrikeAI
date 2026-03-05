# enum4linux-ng

## Overview
- Tool name: `enum4linux-ng`
- Enabled in config: `true`
- Executable: `enum4linux-ng`
- Default args: none
- Summary: Advanced SMB enumeration tool (next-generation version of Enum4linux)

## Detailed Description
Enum4linux-ng is the next-generation version of Enum4linux, providing more powerful SMB enumeration capabilities.

**Key Features:**
- SMB share enumeration
- User and group enumeration
- Policy enumeration
- System information gathering

**Use Cases:**
- Windows system penetration testing
- SMB security assessment
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

### `shares`
- Type: `bool`
- Required: `false`
- Flag: `-S`
- Format: `flag`
- Default: `True`
- Description: Enumerate shares

### `users`
- Type: `bool`
- Required: `false`
- Flag: `-U`
- Format: `flag`
- Default: `True`
- Description: Enumerate users

### `groups`
- Type: `bool`
- Required: `false`
- Flag: `-G`
- Format: `flag`
- Default: `True`
- Description: Enumerate groups

### `policy`
- Type: `bool`
- Required: `false`
- Flag: `-P`
- Format: `flag`
- Default: `True`
- Description: Enumerate policies

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional enum4linux-ng parameters. Used to pass enum4linux-ng options not defined in the parameter list.

## Invocation Template
```bash
enum4linux-ng <target> <username> <password> <domain> <shares> <users> <groups> <policy> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
