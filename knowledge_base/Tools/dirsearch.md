# dirsearch

## Overview
- Tool name: `dirsearch`
- Enabled in config: `true`
- Executable: `dirsearch`
- Default args: none
- Summary: Advanced directory and file discovery tool

## Detailed Description
Dirsearch is an advanced web content scanner for discovering directories and files.

**Key Features:**
- Fast directory and file discovery
- Multi-threading support
- Recursive scanning
- Extension filtering

**Use Cases:**
- Web application security testing
- Directory enumeration
- File discovery
- Penetration testing

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL

### `extensions`
- Type: `string`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Default: `php,html,js,txt,xml,json`
- Description: File extensions (comma-separated)

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
- Default: `30`
- Description: Number of threads

### `recursive`
- Type: `bool`
- Required: `false`
- Flag: `-r`
- Format: `flag`
- Default: `False`
- Description: Enable recursive scanning

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional dirsearch parameters. Used to pass dirsearch options not defined in the parameter list.

## Invocation Template
```bash
dirsearch <url> <extensions> <wordlist> <threads> <recursive> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
