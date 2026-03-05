# msfvenom

## Overview
- Tool name: `msfvenom`
- Enabled in config: `true`
- Executable: `msfvenom`
- Default args: none
- Summary: Metasploit payload generation tool

## Detailed Description
MSFVenom is Metasploit framework's payload generation tool for creating various types of attack payloads.

**Key Features:**
- Multiple payload types
- Encoder support
- Multiple output formats
- Platform support

**Use Cases:**
- Penetration testing
- Payload generation
- Exploit development
- Security testing

## Parameters
### `payload`
- Type: `string`
- Required: `true`
- Flag: `-p`
- Format: `flag`
- Description: Payload to generate (e.g. windows/meterpreter/reverse_tcp)

### `format_type`
- Type: `string`
- Required: `false`
- Flag: `-f`
- Format: `flag`
- Description: Output format (exe, elf, raw, etc.)

### `output_file`
- Type: `string`
- Required: `false`
- Flag: `-o`
- Format: `flag`
- Description: Output file path

### `encoder`
- Type: `string`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Description: Encoder (e.g. x86/shikata_ga_nai)

### `iterations`
- Type: `string`
- Required: `false`
- Flag: `-i`
- Format: `flag`
- Description: Number of encoding iterations

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional msfvenom parameters. Used to pass msfvenom options not defined in the parameter list.

## Invocation Template
```bash
msfvenom <payload> <format_type> <output_file> <encoder> <iterations> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
