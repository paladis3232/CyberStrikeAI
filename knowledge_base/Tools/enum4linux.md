# enum4linux

## Overview
- Tool name: `enum4linux`
- Enabled in config: `true`
- Executable: `enum4linux`
- Default args: none
- Summary: SMB enumeration tool for Windows/Samba system information gathering

## Detailed Description
Enum4linux is a tool for enumerating SMB shares and Windows system information.

**Key Features:**
- SMB share enumeration
- User and group enumeration
- Password policy information
- System information gathering

**Use Cases:**
- Windows system penetration testing
- SMB security assessment
- Network information gathering
- Domain environment reconnaissance

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Default: `-a`
- Description: Additional Enum4linux parameters (default: -a)

## Invocation Template
```bash
enum4linux <target> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
