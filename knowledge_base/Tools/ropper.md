# ropper

## Overview
- Tool name: `ropper`
- Enabled in config: `true`
- Executable: `ropper`
- Default args: none
- Summary: Advanced ROP/JOP gadget search tool

## Detailed Description
Ropper is an advanced ROP/JOP gadget search tool used for exploit development.

**Key Features:**
- ROP/JOP gadget searching
- Gadget quality assessment
- Multiple architecture support
- Exploit chain generation

**Use Cases:**
- Exploit development
- ROP chain building
- Binary analysis
- Security research

## Parameters
### `binary`
- Type: `string`
- Required: `true`
- Flag: `--file`
- Format: `flag`
- Description: Path to the binary file to analyze

### `gadget_type`
- Type: `string`
- Required: `false`
- Flag: `--type`
- Format: `flag`
- Default: `rop`
- Description: Gadget type (rop, jop, sys, all)

### `quality`
- Type: `int`
- Required: `false`
- Flag: `--quality`
- Format: `flag`
- Default: `1`
- Description: Gadget quality level (1-5)

### `arch`
- Type: `string`
- Required: `false`
- Flag: `--arch`
- Format: `flag`
- Description: Target architecture (x86, x86_64, arm, etc.)

### `search_string`
- Type: `string`
- Required: `false`
- Flag: `--search`
- Format: `flag`
- Description: Specific gadget pattern to search for

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional ropper arguments. Used to pass ropper options not defined in the parameter list.

## Invocation Template
```bash
ropper <binary> <gadget_type> <quality> <arch> <search_string> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
