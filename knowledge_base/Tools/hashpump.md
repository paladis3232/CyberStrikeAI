# hashpump

## Overview
- Tool name: `hashpump`
- Enabled in config: `true`
- Executable: `hashpump`
- Default args: none
- Summary: Hash length extension attack tool

## Detailed Description
HashPump is a tool for performing hash length extension attacks.

**Key Features:**
- Hash length extension attacks
- Support for multiple hash algorithms
- Signature generation
- Data appending

**Use Cases:**
- Cryptography attacks
- Hash function testing
- CTF challenges
- Security research

## Parameters
### `signature`
- Type: `string`
- Required: `true`
- Flag: `-s`
- Format: `flag`
- Description: Original hash signature

### `data`
- Type: `string`
- Required: `true`
- Flag: `-d`
- Format: `flag`
- Description: Original data

### `key_length`
- Type: `int`
- Required: `true`
- Flag: `-k`
- Format: `flag`
- Description: Key length

### `append_data`
- Type: `string`
- Required: `true`
- Flag: `-a`
- Format: `flag`
- Description: Data to append

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional hashpump parameters. Used to pass hashpump options not defined in the parameter list.

## Invocation Template
```bash
hashpump <signature> <data> <key_length> <append_data> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
