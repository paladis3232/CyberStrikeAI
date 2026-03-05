# delete-file

## Overview
- Tool name: `delete-file`
- Enabled in config: `true`
- Executable: `rm`
- Default args: none
- Summary: File or directory deletion tool

## Detailed Description
Delete files or directories on the server.

**Key Features:**
- Delete files
- Delete directories
- Recursive deletion

**Use Cases:**
- File cleanup
- Temporary file deletion
- Directory cleanup

## Parameters
### `filename`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Filename or directory name to delete

### `recursive`
- Type: `bool`
- Required: `false`
- Flag: `-r`
- Format: `flag`
- Default: `False`
- Description: Recursively delete directory

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional delete-file parameters. Used to pass delete-file options not defined in the parameter list.

## Invocation Template
```bash
rm <filename> <recursive> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
