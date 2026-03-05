# rustscan

## Overview
- Tool name: `rustscan`
- Enabled in config: `true`
- Executable: `rustscan`
- Default args: none
- Summary: Ultra-fast port scanning tool written in Rust

## Detailed Description
Rustscan is an ultra-fast port scanning tool written in Rust that can quickly scan large numbers of ports.

**Key Features:**
- Ultra-fast port scanning
- Configurable scan speed
- Nmap script integration support
- Batch scanning support

**Use Cases:**
- Fast port scanning
- Large-scale network scanning
- Penetration testing information gathering

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Flag: `-a`
- Format: `flag`
- Description: Target IP address or hostname

### `ports`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Ports to scan (e.g.: 22,80,443 or 1-1000)

### `ulimit`
- Type: `int`
- Required: `false`
- Flag: `-u`
- Format: `flag`
- Default: `5000`
- Description: File descriptor limit

### `scripts`
- Type: `bool`
- Required: `false`
- Flag: `--scripts`
- Format: `flag`
- Default: `False`
- Description: Run Nmap scripts on discovered ports

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional rustscan parameters. Used to pass rustscan options not defined in the parameter list.

## Invocation Template
```bash
rustscan <target> <ports> <ulimit> <scripts> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
