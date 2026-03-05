# one-gadget

## Overview
- Tool name: `one-gadget`
- Enabled in config: `true`
- Executable: `one_gadget`
- Default args: none
- Summary: Tool for finding one-shot RCE gadgets in libc

## Detailed Description
One-gadget is a tool for finding one-shot RCE gadgets in libc.

**Key Features:**
- One-shot gadget searching
- Constraint level checking
- Support for multiple libc versions

**Use Cases:**
- CTF challenges
- Exploit development
- ROP chain simplification
- Security research

## Parameters
### `libc_path`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Path to the libc binary file

### `level`
- Type: `int`
- Required: `false`
- Flag: `-l`
- Format: `flag`
- Default: `1`
- Description: Constraint level (0, 1, 2)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional one-gadget parameters. Used to pass one-gadget options not defined in the parameter list.

## Invocation Template
```bash
one_gadget <libc_path> <level> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
