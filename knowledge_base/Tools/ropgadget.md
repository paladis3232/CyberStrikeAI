# ropgadget

## Overview
- Tool name: `ropgadget`
- Enabled in config: `true`
- Executable: `ROPgadget`
- Default args: none
- Summary: ROP gadget search tool

## Detailed Description
ROPgadget is a tool for searching ROP gadgets in binary files.

**Key Features:**
- ROP gadget searching
- Support for multiple architectures
- Gadget classification
- Exploit chain generation

**Use Cases:**
- Binary analysis
- Exploit development
- ROP chain construction
- Security research

## Parameters
### `binary`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the binary file to analyze

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional ropgadget parameters. Used to pass ropgadget options not defined in the parameter list.

## Invocation Template
```bash
ROPgadget <binary> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
