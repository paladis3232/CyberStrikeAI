# wfuzz

## Overview
- Tool name: `wfuzz`
- Enabled in config: `true`
- Executable: `wfuzz`
- Default args: none
- Summary: Web application fuzzing tool

## Detailed Description
Wfuzz is a web application fuzzing tool for discovering vulnerabilities in web applications.

**Key Features:**
- Web application fuzzing
- Parameter discovery
- Directory discovery
- Multiple filters

**Use Cases:**
- Web application security testing
- Parameter fuzzing
- Directory enumeration
- Vulnerability discovery

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
- Description: Wordlist file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional wfuzz arguments. Used to pass wfuzz options not defined in the parameter list.

## Invocation Template
```bash
wfuzz <url> <wordlist> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
