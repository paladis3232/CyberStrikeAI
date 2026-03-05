# ffuf

## Overview
- Tool name: `ffuf`
- Enabled in config: `true`
- Executable: `ffuf`
- Default args: none
- Summary: Fast web fuzzing tool for directory, parameter, and content discovery

## Detailed Description
FFuf is a fast web fuzzing tool for directory discovery, parameter fuzzing, and content discovery.

**Key Features:**
- Fast directory and file discovery
- Parameter fuzzing
- Virtual host discovery
- Custom filters and matchers
- Multi-threading support

**Use Cases:**
- Web application security testing
- Directory enumeration
- Parameter discovery
- Content discovery

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL (use FUZZ as placeholder)

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `-w`
- Format: `flag`
- Default: `/usr/share/wordlists/dirb/common.txt`
- Description: Wordlist file path

### `match_codes`
- Type: `string`
- Required: `false`
- Flag: `-mc`
- Format: `flag`
- Default: `200,204,301,302,307,401,403`
- Description: HTTP status codes to match (comma-separated)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional FFuf parameters

## Invocation Template
```bash
ffuf <url> <wordlist> <match_codes> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
