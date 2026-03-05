# dotdotpwn

## Overview
- Tool name: `dotdotpwn`
- Enabled in config: `true`
- Executable: `dotdotpwn`
- Default args: none
- Summary: Directory traversal vulnerability testing tool

## Detailed Description
DotDotPwn is a directory traversal vulnerability testing tool that supports multiple protocols.

**Key Features:**
- Directory traversal testing
- Multiple protocol support (HTTP, FTP, TFTP, etc.)
- Automated testing
- Report generation

**Use Cases:**
- Directory traversal vulnerability testing
- Web application security testing
- Penetration testing
- Vulnerability verification

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Flag: `-h`
- Format: `flag`
- Description: Target hostname or IP

### `module`
- Type: `string`
- Required: `false`
- Flag: `-m`
- Format: `flag`
- Default: `http`
- Description: Module to use (http, ftp, tftp, etc.)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional dotdotpwn arguments. Used to pass dotdotpwn options not defined in the parameter list.

## Invocation Template
```bash
dotdotpwn <target> <module> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
