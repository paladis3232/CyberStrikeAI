# radare2

## Overview
- Tool name: `radare2`
- Enabled in config: `true`
- Executable: `r2`
- Default args: none
- Summary: Binary analysis and reverse engineering framework with disassembly, debugging, and scripting support

## Detailed Description
Radare2 is a complete binary analysis and reverse engineering framework supporting multiple architectures and file formats.

**Key Features:**
- Disassembly and decompilation: supports multiple architectures (x86, ARM, MIPS, etc.)
- Debugging support: local and remote debugging
- Scripting support: r2pipe scripts and r2 command scripts
- Multiple file formats: ELF, PE, Mach-O, firmware, etc.
- Interactive analysis: command-line interface and visual mode
- Automated analysis: batch analysis and scripted analysis

**Use Cases:**
- Binary file analysis
- Reverse engineering and vulnerability research
- Malware analysis
- CTF reverse engineering challenges
- Firmware analysis
- Exploit development

**Notes:**
- Use the -c parameter to execute commands and exit (non-interactive mode)
- Use the -i parameter to execute a script file
- Use the -q parameter for quiet mode (suppresses startup messages)
- Use the -A parameter to automatically analyze the binary file
- Use the -d parameter to attach to a process for debugging

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `1`
- Format: `positional`
- Description: Target file, process ID, or special value.

### `commands`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Description: Radare2 commands to execute. Can be a single command or multiple commands separated by semicolons.

### `script_file`
- Type: `string`
- Required: `false`
- Flag: `-i`
- Format: `flag`
- Description: Path to a script file to execute. The script file contains Radare2 commands, one per line.

### `arch`
- Type: `string`
- Required: `false`
- Flag: `-a`
- Format: `flag`
- Description: Specify target architecture.

### `bits`
- Type: `int`
- Required: `false`
- Flag: `-b`
- Format: `flag`
- Description: Specify target bit width (16, 32, 64).

### `auto_analyze`
- Type: `bool`
- Required: `false`
- Flag: `-A`
- Format: `flag`
- Default: `False`
- Description: Automatically analyze the binary file. Equivalent to executing the "aaa" command.

### `debug`
- Type: `bool`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Default: `False`
- Description: Debug mode. Can attach to a process or debug a file.

### `quiet`
- Type: `bool`
- Required: `false`
- Flag: `-q`
- Format: `flag`
- Default: `False`
- Description: Quiet mode. Suppresses startup messages and prompt.

### `seek`
- Type: `string`
- Required: `false`
- Flag: `-s`
- Format: `flag`
- Description: Set the starting address. Can be a hexadecimal address or expression.

### `base_address`
- Type: `string`
- Required: `false`
- Flag: `-B`
- Format: `flag`
- Description: Set the base address. Used for the load address.

### `eval`
- Type: `string`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Description: Set configuration variables. Format is key=value.

### `project`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Load or save a project file.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional radare2 arguments. Used to pass radare2 options not defined in the parameter list.

## Invocation Template
```bash
r2 <target> <commands> <script_file> <arch> <bits> <auto_analyze> <debug> <quiet> <seek> <base_address> <eval> <project> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
