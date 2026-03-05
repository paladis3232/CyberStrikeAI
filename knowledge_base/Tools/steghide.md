# steghide

## Overview
- Tool name: `steghide`
- Enabled in config: `true`
- Executable: `steghide`
- Default args: none
- Summary: Steganography analysis tool

## Detailed Description
Steghide is a steganography tool for hiding data within image and audio files.

**Key Features:**
- Data hiding
- Data extraction
- Information viewing
- Password protection

**Use Cases:**
- Steganography analysis
- Hidden data detection
- Forensic analysis
- CTF challenges

## Parameters
### `action`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Action type (extract, embed, info)

### `cover_file`
- Type: `string`
- Required: `false`
- Flag: `-cf`
- Format: `flag`
- Description: Cover file path (used with -cf for embed/info operations)

### `embed_file`
- Type: `string`
- Required: `false`
- Flag: `-ef`
- Format: `flag`
- Description: File to embed (for embed operation)

### `passphrase`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Passphrase

### `stego_file`
- Type: `string`
- Required: `false`
- Flag: `-sf`
- Format: `flag`
- Description: Stego file path (output for embed, input for extract)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional steghide parameters. Used to pass steghide options not defined in the parameter list.

## Invocation Template
```bash
steghide <action> <cover_file> <embed_file> <passphrase> <stego_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
