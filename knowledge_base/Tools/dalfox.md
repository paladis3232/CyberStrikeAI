# dalfox

## Overview
- Tool name: `dalfox`
- Enabled in config: `true`
- Executable: `dalfox`
- Default args: none
- Summary: Advanced XSS vulnerability scanner

## Detailed Description
Dalfox is an advanced XSS vulnerability scanner supporting multiple XSS detection techniques.

**Key Features:**
- XSS vulnerability detection
- Blind XSS testing
- DOM mining
- Dictionary mining

**Use Cases:**
- XSS vulnerability testing
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

### `pipe_mode`
- Type: `bool`
- Required: `false`
- Flag: `--pipe`
- Format: `flag`
- Default: `False`
- Description: Use pipe mode input

### `blind`
- Type: `string`
- Required: `false`
- Flag: `--blind`
- Format: `flag`
- Description: Blind XSS callback address (e.g. Burp Collaborator URL)

### `mining_dom`
- Type: `bool`
- Required: `false`
- Flag: `--mining-dom`
- Format: `flag`
- Default: `True`
- Description: Enable DOM mining

### `mining_dict`
- Type: `bool`
- Required: `false`
- Flag: `--mining-dict`
- Format: `flag`
- Default: `True`
- Description: Enable dictionary mining

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional dalfox parameters. Used to pass dalfox options not defined in the parameter list.

## Invocation Template
```bash
dalfox <url> <pipe_mode> <blind> <mining_dom> <mining_dict> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
