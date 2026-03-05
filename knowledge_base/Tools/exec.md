# exec

## Overview
- Tool name: `exec`
- Enabled in config: `true`
- Executable: `sh`
- Default args: `-c`
- Summary: System command execution tool for running Shell commands and system operations (use with caution)

## Detailed Description
System command execution tool for running Shell commands and system operations.

**Key Features:**
- Execute arbitrary Shell commands
- Support for bash, sh, and other shells
- Can specify working directory
- Returns command execution results

**Use Cases:**
- System administration and maintenance
- Automated script execution
- File operations and processing
- System information gathering

**Security Warnings:**
- This tool can execute arbitrary system commands and poses security risks
- Should only be used in controlled environments
- All command executions will be logged
- Recommended to limit the range of executable commands
- Do not execute untrusted commands

## Parameters
### `command`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: System command to execute. Can be any valid Shell command.

### `shell`
- Type: `string`
- Required: `false`
- Format: `flag`
- Default: `sh`
- Description: Shell type to use, defaults to sh.

### `workdir`
- Type: `string`
- Required: `false`
- Format: `flag`
- Description: Working directory for command execution. If not specified, uses the current working directory.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional exec parameters. Used to pass exec options not defined in the parameter list.

## Invocation Template
```bash
sh -c <command> <shell> <workdir> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
