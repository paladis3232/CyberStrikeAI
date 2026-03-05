# fcrackzip

## Overview
- Tool name: `fcrackzip`
- Enabled in config: `true`
- Executable: `fcrackzip`
- Default args: none
- Summary: ZIP file password cracking tool supporting brute force and dictionary attacks

## Detailed Description
fcrackzip is a tool for cracking passwords on password-protected ZIP files.

**Key Features:**
- Brute force attack
- Dictionary attack
- Custom character sets
- Configurable password length range
- Multi-threading support

**Use Cases:**
- CTF competitions
- ZIP file password recovery
- Security testing
- Digital forensics

**Notes:**
- Cracking time depends on password complexity
- Recommended to use dictionary files to improve efficiency
- For authorized security testing only

## Parameters
### `file`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the ZIP file to crack

### `dictionary_mode`
- Type: `bool`
- Required: `false`
- Flag: `-D`
- Format: `flag`
- Default: `False`
- Description: Enable dictionary attack mode (equivalent to -D)

### `dictionary`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Dictionary file path (used with -D)

### `bruteforce`
- Type: `bool`
- Required: `false`
- Flag: `-b`
- Format: `flag`
- Description: Use brute force mode

### `charset`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Description: Character set, e.g. 'aA1' means lowercase letters, uppercase letters, and digits

### `length_range`
- Type: `string`
- Required: `false`
- Flag: `-l`
- Format: `flag`
- Description: Password length range in min-max format (e.g. 4-8)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional fcrackzip parameters. Used to pass fcrackzip options not defined in the parameter list.

## Invocation Template
```bash
fcrackzip <file> <dictionary_mode> <dictionary> <bruteforce> <charset> <length_range> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
