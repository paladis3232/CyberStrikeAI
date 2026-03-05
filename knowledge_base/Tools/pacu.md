# pacu

## Overview
- Tool name: `pacu`
- Enabled in config: `false`
- Executable: `pacu`
- Default args: none
- Summary: AWS penetration testing framework

## Detailed Description
Pacu is an AWS penetration testing framework for testing the security of AWS environments.

**Key Features:**
- AWS penetration testing
- Privilege escalation
- Data access
- Modular architecture

**Use Cases:**
- AWS security testing
- Penetration testing
- Privilege testing
- Security assessment

## Parameters
### `session_name`
- Type: `string`
- Required: `false`
- Flag: `--session`
- Format: `flag`
- Default: `hexstrike_session`
- Description: Pacu session name

### `modules`
- Type: `string`
- Required: `false`
- Flag: `--modules`
- Format: `flag`
- Description: Modules to run (comma-separated)

### `regions`
- Type: `string`
- Required: `false`
- Flag: `--regions`
- Format: `flag`
- Description: AWS regions (comma-separated)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional pacu parameters. Used to pass pacu options not defined in the parameter list.

## Invocation Template
```bash
pacu <session_name> <modules> <regions> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
