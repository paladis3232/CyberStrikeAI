# jaeles

## Overview
- Tool name: `jaeles`
- Enabled in config: `true`
- Executable: `jaeles`
- Default args: `scan`
- Summary: Advanced vulnerability scanner with support for custom signatures

## Detailed Description
Jaeles is an advanced vulnerability scanner that supports custom signatures for vulnerability detection.

**Key Features:**
- Custom signature support
- Multiple vulnerability detection types
- Fast scanning
- Detailed reports

**Use Cases:**
- Vulnerability scanning
- Web application security testing
- Custom detection rules
- Security testing

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL

### `signatures`
- Type: `string`
- Required: `false`
- Flag: `-s`
- Format: `flag`
- Description: Custom signature path

### `config`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Description: Configuration file

### `threads`
- Type: `int`
- Required: `false`
- Flag: `-t`
- Format: `flag`
- Default: `20`
- Description: Number of threads

### `timeout`
- Type: `int`
- Required: `false`
- Flag: `--timeout`
- Format: `flag`
- Default: `20`
- Description: Request timeout in seconds

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional jaeles parameters. Used to pass jaeles options not defined in the parameter list.

## Invocation Template
```bash
jaeles scan <url> <signatures> <config> <threads> <timeout> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
