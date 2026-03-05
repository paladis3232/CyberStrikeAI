# hashcat

## Overview
- Tool name: `hashcat`
- Enabled in config: `true`
- Executable: `hashcat`
- Default args: none
- Summary: Advanced password cracking tool with GPU acceleration support

## Detailed Description
Hashcat is an advanced password recovery tool supporting multiple hash algorithms and attack modes.

**Key Features:**
- Support for multiple hash algorithms
- GPU acceleration
- Multiple attack modes (dictionary, combination, mask, etc.)
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

### `hash_type`
- Type: `string`
- Required: `true`
- Flag: `-m`
- Format: `flag`
- Description: Hash type number

### `attack_mode`
- Type: `string`
- Required: `false`
- Flag: `-a`
- Format: `flag`
- Default: `0`
- Description: Attack mode (0=dictionary, 1=combination, 3=mask, etc.)

### `wordlist`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: `/usr/share/wordlists/rockyou.txt`
- Description: Wordlist file

### `mask`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Description: Mask (for mask attack)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Hashcat parameters

## Invocation Template
```bash
hashcat <hash_file> <hash_type> <attack_mode> <wordlist> <mask> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
