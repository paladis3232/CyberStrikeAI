# binwalk

## Overview
- Tool name: `binwalk`
- Enabled in config: `true`
- Executable: `binwalk`
- Default args: none
- Summary: Firmware and file analysis tool

## Detailed Description
Binwalk is a firmware analysis tool for analyzing, extracting, and reverse engineering firmware images.

**Key Features:**
- File signature identification
- File extraction
- Entropy analysis
- Firmware analysis

**Use Cases:**
- Firmware analysis
- File format identification
- Data extraction
- Reverse engineering

## Parameters
### `file_path`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the file to analyze

### `extract`
- Type: `bool`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Default: `False`
- Description: Extract discovered files

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional binwalk parameters. Used to pass binwalk options not defined in the parameter list.

## Invocation Template
```bash
binwalk <file_path> <extract> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
