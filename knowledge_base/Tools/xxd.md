# xxd

## Overview
- Tool name: `xxd`
- Enabled in config: `true`
- Executable: `xxd`
- Default args: none
- Summary: Hex dump tool

## Detailed Description
xxd is a hex dump tool for displaying file contents in hexadecimal format.

**Key Features:**
- Hex dump
- Configurable offset and length
- Reverse conversion
- Multiple output formats

**Use Cases:**
- Binary analysis
- File inspection
- Data extraction
- Forensic analysis

## Parameters
### `file_path`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the file to dump

### `offset`
- Type: `string`
- Required: `false`
- Flag: `-s`
- Format: `flag`
- Default: `0`
- Description: Offset to start reading from

### `length`
- Type: `string`
- Required: `false`
- Flag: `-l`
- Format: `flag`
- Description: Number of bytes to read

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional xxd parameters. Used to pass xxd options not defined in the parameter list.

## Invocation Template
```bash
xxd <file_path> <offset> <length> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
