# winpeas

## Overview
- Tool name: `winpeas`
- Enabled in config: `true`
- Executable: `winPEAS.exe`
- Default args: none
- Summary: Windows privilege escalation enumeration tool that automatically detects common privilege escalation paths

## Detailed Description
WinPEAS (Windows Privilege Escalation Awesome Script) is an automated privilege escalation enumeration tool for detecting common privilege escalation paths in Windows systems.

**Key Features:**
- System information gathering
- User and group permission checks
- Service configuration analysis
- Registry checks
- Scheduled task analysis
- Network configuration checks
- File permission checks
- Credential discovery

**Use Cases:**
- Privilege escalation during penetration testing
- Windows security auditing
- Post-exploitation
- CTF competitions

**Notes:**
- Requires winPEAS.exe to be downloaded on the target system
- May require administrator privileges
- Outputs a large amount of information; recommended to save to a file

## Parameters
### `quiet`
- Type: `bool`
- Required: `false`
- Flag: `-q`
- Format: `flag`
- Description: Quiet mode, shows only important information

### `notcolor`
- Type: `bool`
- Required: `false`
- Flag: `-notcolor`
- Format: `flag`
- Description: Disable color output

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional winpeas parameters. Used to pass winpeas options not defined in the parameter list.

## Invocation Template
```bash
winPEAS.exe <quiet> <notcolor> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
