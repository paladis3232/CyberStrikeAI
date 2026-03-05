# pwninit

## Overview
- Tool name: `pwninit`
- Enabled in config: `true`
- Executable: `pwninit`
- Default args: none
- Summary: CTF binary exploit setup tool

## Detailed Description
Pwninit is a tool for setting up CTF binary exploits, automatically configuring libc and loader.

**Key Features:**
- Automatic libc identification
- Loader configuration
- Template generation
- Environment setup

**Use Cases:**
- CTF challenges
- Exploit development
- Environment configuration
- Security research

## Parameters
### `binary`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Binary file path

### `libc`
- Type: `string`
- Required: `false`
- Flag: `--libc`
- Format: `flag`
- Description: libc file path

### `ld`
- Type: `string`
- Required: `false`
- Flag: `--ld`
- Format: `flag`
- Description: Loader file path

### `template_type`
- Type: `string`
- Required: `false`
- Flag: `--template`
- Format: `flag`
- Default: `python`
- Description: Template type (python, c)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional pwninit parameters. Used to pass pwninit options not defined in the parameter list.

## Invocation Template
```bash
pwninit <binary> <libc> <ld> <template_type> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
