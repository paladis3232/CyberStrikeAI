# gdb-peda

## Overview
- Tool name: `gdb-peda`
- Enabled in config: `true`
- Executable: `gdb`
- Default args: none
- Summary: GDB debugger with PEDA enhancements

## Detailed Description
GDB-PEDA is the GDB debugger enhanced with PEDA (Python Exploit Development Assistance).

**Key Features:**
- Enhanced GDB functionality
- Automated analysis
- Exploit development assistance
- Visual display

**Use Cases:**
- Binary debugging
- Exploit development
- Reverse engineering
- Security research

## Parameters
### `binary`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Description: Binary file to debug

### `commands`
- Type: `string`
- Required: `false`
- Flag: `-ex`
- Format: `flag`
- Description: GDB commands (semicolon-separated)

### `attach_pid`
- Type: `int`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Process ID to attach to

### `core_file`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Description: Core dump file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional gdb-peda arguments. Used to pass gdb-peda options not defined in the parameter list.

## Invocation Template
```bash
gdb <binary> <commands> <attach_pid> <core_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
