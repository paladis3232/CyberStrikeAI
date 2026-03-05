# feroxbuster

## Overview
- Tool name: `feroxbuster`
- Enabled in config: `true`
- Executable: `feroxbuster`
- Default args: none
- Summary: Recursive content discovery tool

## Detailed Description
Feroxbuster is a fast, simple recursive content discovery tool.

**Key Features:**
- Recursive directory discovery
- Multi-threading support
- Automatic filtering
- Multiple output formats

**Use Cases:**
- Web content discovery
- Directory enumeration
- File discovery
- Security testing

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `-w`
- Format: `flag`
- Description: Wordlist file path

### `threads`
- Type: `int`
- Required: `false`
- Flag: `-t`
- Format: `flag`
- Default: `10`
- Description: Number of threads

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional feroxbuster parameters. Used to pass feroxbuster options not defined in the parameter list.

## Invocation Template
```bash
feroxbuster <url> <wordlist> <threads> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
