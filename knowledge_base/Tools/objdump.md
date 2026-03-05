# objdump

## Overview
- Tool name: `objdump`
- Enabled in config: `true`
- Executable: `objdump`
- Default args: none
- Summary: Binary file disassembly tool

## Detailed Description
Objdump is part of GNU binutils, used for disassembling binary files.

**Key Features:**
- Disassembly
- Symbol table display
- Section information display
- Multiple architecture support

**Use Cases:**
- Binary analysis
- Reverse engineering
- Program comprehension
- Debugging assistance

## Parameters
### `binary`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the binary file to analyze

### `disassemble`
- Type: `bool`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Default: `True`
- Description: Disassemble the binary file

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional objdump arguments. Used to pass objdump options not defined in the parameter list.

## Invocation Template
```bash
objdump <binary> <disassemble> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
