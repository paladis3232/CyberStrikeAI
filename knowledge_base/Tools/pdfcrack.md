# pdfcrack

## Overview
- Tool name: `pdfcrack`
- Enabled in config: `true`
- Executable: `pdfcrack`
- Default args: none
- Summary: PDF file password cracking tool supporting brute force and dictionary attacks

## Detailed Description
pdfcrack is a tool for cracking passwords on password-protected PDF files.

**Key Features:**
- Brute force attack
- Dictionary attack
- User password and owner password cracking
- Support for multiple encryption algorithms

**Use Cases:**
- CTF competitions
- PDF file password recovery
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
- Description: Path to the PDF file to crack

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `-w`
- Format: `flag`
- Description: Dictionary file path

### `min_length`
- Type: `int`
- Required: `false`
- Flag: `-n`
- Format: `flag`
- Description: Minimum password length

### `max_length`
- Type: `int`
- Required: `false`
- Flag: `-m`
- Format: `flag`
- Description: Maximum password length

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional pdfcrack parameters. Used to pass pdfcrack options not defined in the parameter list.

## Invocation Template
```bash
pdfcrack <file> <wordlist> <min_length> <max_length> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
