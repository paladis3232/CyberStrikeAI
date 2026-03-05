# arjun

## Overview
- Tool name: `arjun`
- Enabled in config: `true`
- Executable: `arjun`
- Default args: none
- Summary: HTTP parameter discovery tool

## Detailed Description
Arjun is an HTTP parameter discovery tool for finding hidden parameters in web applications.

**Key Features:**
- HTTP parameter discovery
- Support for multiple HTTP methods
- Multi-threading support
- Stable mode

**Use Cases:**
- Parameter discovery
- Web application security testing
- Bug bounty reconnaissance
- Security testing

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL

### `method`
- Type: `string`
- Required: `false`
- Flag: `-m`
- Format: `flag`
- Default: `GET`
- Description: HTTP method (GET, POST, etc.)

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `-w`
- Format: `flag`
- Description: Custom wordlist file

### `threads`
- Type: `int`
- Required: `false`
- Flag: `-t`
- Format: `flag`
- Default: `25`
- Description: Number of threads

### `stable`
- Type: `bool`
- Required: `false`
- Flag: `--stable`
- Format: `flag`
- Default: `False`
- Description: Use stable mode

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Arjun parameters. Used to pass Arjun options not defined in the parameter list.

## Invocation Template
```bash
arjun <url> <method> <wordlist> <threads> <stable> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
