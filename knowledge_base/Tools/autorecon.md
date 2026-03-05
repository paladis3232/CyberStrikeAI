# autorecon

## Overview
- Tool name: `autorecon`
- Enabled in config: `true`
- Executable: `autorecon`
- Default args: none
- Summary: Automated comprehensive reconnaissance tool

## Detailed Description
AutoRecon is an automated comprehensive reconnaissance tool for performing thorough target enumeration.

**Key Features:**
- Automated port scanning
- Service identification
- Vulnerability scanning
- Comprehensive reports

**Use Cases:**
- Comprehensive security assessment
- Penetration testing
- Network reconnaissance
- Security auditing

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address or hostname

### `output_dir`
- Type: `string`
- Required: `false`
- Flag: `-o`
- Format: `flag`
- Default: `/tmp/autorecon`
- Description: Output directory

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional autorecon parameters. Used to pass autorecon options not defined in the parameter list.

## Invocation Template
```bash
autorecon <target> <output_dir> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
