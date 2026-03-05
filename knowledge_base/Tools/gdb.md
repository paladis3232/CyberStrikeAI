# gdb

## Overview
- Tool name: `gdb`
- Enabled in config: `true`
- Executable: `gdb`
- Default args: none
- Summary: GNU debugger for binary analysis and debugging

## Detailed Description
GDB is the GNU debugger for debugging and analyzing binary programs.

**Key Features:**
- Program debugging
- Memory analysis
- Disassembly
- Breakpoint setting

**Use Cases:**
- Binary analysis
- Vulnerability research
- Reverse engineering
- Program debugging

## Parameters
### `binary`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the binary file to analyze

### `commands`
- Type: `string`
- Required: `false`
- Flag: `-ex`
- Format: `flag`
- Description: GDB commands to execute (semicolon-separated)

### `script_file`
- Type: `string`
- Required: `false`
- Flag: `-x`
- Format: `flag`
- Description: GDB script file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional gdb parameters. Used to pass gdb options not defined in the parameter list.

## Invocation Template
```bash
gdb <binary> <commands> <script_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
