# zsteg

## Overview
- Tool name: `zsteg`
- Enabled in config: `true`
- Executable: `zsteg`
- Default args: none
- Summary: LSB steganography detection tool for detecting hidden data in PNG/BMP images

## Detailed Description
zsteg is a tool for detecting LSB (Least Significant Bit) steganography in PNG and BMP images.

**Key Features:**
- LSB steganography detection
- Support for multiple steganography algorithms
- Automatic extraction of hidden data
- Support for multiple image formats

**Use Cases:**
- CTF steganography challenges
- Image steganography analysis
- Digital forensics
- Security research

**Notes:**
- Requires Ruby environment
- Supports PNG and BMP formats
- Can detect multiple steganography algorithms

## Parameters
### `file`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the image file to analyze

### `all`
- Type: `bool`
- Required: `false`
- Flag: `--all`
- Format: `flag`
- Description: Detect all possible steganography methods

### `lsb`
- Type: `bool`
- Required: `false`
- Flag: `--lsb`
- Format: `flag`
- Description: Only detect LSB steganography

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional zsteg parameters. Used to pass zsteg options not defined in the parameter list.

## Invocation Template
```bash
zsteg <file> <all> <lsb> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
