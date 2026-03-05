# exiftool

## Overview
- Tool name: `exiftool`
- Enabled in config: `true`
- Executable: `exiftool`
- Default args: none
- Summary: Metadata extraction tool

## Detailed Description
ExifTool is used for reading, writing, and editing metadata in various file formats.

**Key Features:**
- Metadata extraction
- Multiple file format support
- Metadata editing
- Batch processing

**Use Cases:**
- Forensic analysis
- Metadata inspection
- Privacy protection
- File analysis

## Parameters
### `file_path`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the file to analyze

### `output_json`
- Type: `bool`
- Required: `false`
- Flag: `-json`
- Format: `flag`
- Default: `False`
- Description: Output in JSON format (equivalent to -json)

### `output_xml`
- Type: `bool`
- Required: `false`
- Flag: `-X`
- Format: `flag`
- Default: `False`
- Description: Output in XML format (equivalent to -X)

### `output_csv`
- Type: `bool`
- Required: `false`
- Flag: `-csv`
- Format: `flag`
- Default: `False`
- Description: Output in CSV format (equivalent to -csv)

### `tags`
- Type: `string`
- Required: `false`
- Format: `template`
- Description: Specific tags to extract

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional exiftool parameters. Used to pass exiftool options not defined in the parameter list.

## Invocation Template
```bash
exiftool <file_path> <output_json> <output_xml> <output_csv> <tags> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
