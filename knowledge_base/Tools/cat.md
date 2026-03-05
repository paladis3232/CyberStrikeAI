# cat

## Overview
- Tool name: `cat`
- Enabled in config: `true`
- Executable: `cat`
- Default args: none
- Summary: Read and output file contents

## Detailed Description
Read file contents and output to standard output. Used for viewing file contents.

**Use Cases:**
- View text file contents
- Read configuration files
- View log files

**Notes:**
- If the file is large, results may be saved to storage
- Only text files can be read; binary files may display garbled output

## Parameters
### `file`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the file to read

## Invocation Template
```bash
cat <file>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
