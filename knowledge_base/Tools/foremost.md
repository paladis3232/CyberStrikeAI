# foremost

## Overview
- Tool name: `foremost`
- Enabled in config: `true`
- Executable: `foremost`
- Default args: none
- Summary: File recovery tool

## Detailed Description
Foremost is a file recovery tool based on file headers and footers.

**Key Features:**
- File recovery
- Support for multiple file types
- Disk image analysis
- Data recovery

**Use Cases:**
- Data recovery
- Forensic analysis
- File extraction
- Disk analysis

## Parameters
### `input_file`
- Type: `string`
- Required: `true`
- Flag: `-i`
- Format: `flag`
- Description: Input file or device

### `output_dir`
- Type: `string`
- Required: `false`
- Flag: `-o`
- Format: `flag`
- Default: `/tmp/foremost_output`
- Description: Output directory

### `file_types`
- Type: `string`
- Required: `false`
- Flag: `-t`
- Format: `flag`
- Description: File types to recover (jpg,gif,png, etc.)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional foremost parameters. Used to pass foremost options not defined in the parameter list.

## Invocation Template
```bash
foremost <input_file> <output_dir> <file_types> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
