# strings

## Overview
- Tool name: `strings`
- Enabled in config: `true`
- Executable: `strings`
- Default args: none
- Summary: Extract strings from binary files

## Detailed Description
The strings tool extracts printable strings from binary files.

**Key Features:**
- String extraction
- Configurable minimum length
- Support for multiple file formats

**Use Cases:**
- Binary analysis
- Malware analysis
- Forensic analysis
- Reverse engineering

## Parameters
### `file_path`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the file to analyze

### `min_len`
- Type: `int`
- Required: `false`
- Flag: `-n`
- Format: `flag`
- Default: `4`
- Description: Minimum string length

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional strings parameters. Used to pass strings options not defined in the parameter list.

## Invocation Template
```bash
strings <file_path> <min_len> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
