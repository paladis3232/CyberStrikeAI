# john

## Overview
- Tool name: `john`
- Enabled in config: `true`
- Executable: `john`
- Default args: none
- Summary: John the Ripper password cracking tool

## Detailed Description
John the Ripper is a fast password cracking tool supporting multiple hash algorithms.

**Key Features:**
- Support for multiple hash algorithms
- Dictionary attack
- Brute force cracking
- Rules engine

**Use Cases:**
- Password recovery
- Hash cracking
- Security testing
- Forensic analysis

## Parameters
### `hash_file`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: File containing hashes

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `--wordlist`
- Format: `flag`
- Default: `/usr/share/wordlists/rockyou.txt`
- Description: Wordlist file

### `format_type`
- Type: `string`
- Required: `false`
- Flag: `--format`
- Format: `flag`
- Description: Hash format type

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional John parameters

## Invocation Template
```bash
john <hash_file> <wordlist> <format_type> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
