# wafw00f

## Overview
- Tool name: `wafw00f`
- Enabled in config: `true`
- Executable: `wafw00f`
- Default args: none
- Summary: WAF identification and fingerprinting tool

## Detailed Description
Wafw00f is a Web Application Firewall (WAF) identification and fingerprinting tool.

**Key Features:**
- WAF detection
- WAF fingerprinting
- Support for multiple WAFs
- Bypass technique detection

**Use Cases:**
- WAF identification
- Security testing
- Penetration testing
- Security assessment

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target URL or IP

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional wafw00f parameters. Used to pass wafw00f options not defined in the parameter list.

## Invocation Template
```bash
wafw00f <target> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
