# nmap-advanced

## Overview
- Tool name: `nmap-advanced`
- Enabled in config: `true`
- Executable: `nmap`
- Default args: none
- Summary: Advanced Nmap scanning with support for custom NSE scripts and optimized timing

## Detailed Description
Advanced Nmap scanning tool supporting custom NSE scripts, optimized timing, and multiple scanning techniques.

**Key Features:**
- Multiple scanning techniques (SYN, TCP, UDP, etc.)
- Custom NSE scripts
- Timing optimization
- OS detection and version detection

**Use Cases:**
- Advanced network scanning
- In-depth security assessment
- Penetration testing
- Network reconnaissance

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address or hostname

### `scan_type`
- Type: `string`
- Required: `false`
- Format: `template`
- Default: `-sS`
- Description: Scan type (-sS, -sT, -sU, etc.)

### `ports`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Ports to scan

### `timing`
- Type: `string`
- Required: `false`
- Format: `template`
- Default: `4`
- Description: Timing template (T0-T5)

### `nse_scripts`
- Type: `string`
- Required: `false`
- Flag: `--script`
- Format: `flag`
- Description: Custom NSE scripts to run

### `os_detection`
- Type: `bool`
- Required: `false`
- Flag: `-O`
- Format: `flag`
- Default: `False`
- Description: Enable OS detection

### `version_detection`
- Type: `bool`
- Required: `false`
- Flag: `-sV`
- Format: `flag`
- Default: `False`
- Description: Enable version detection

### `aggressive`
- Type: `bool`
- Required: `false`
- Flag: `-A`
- Format: `flag`
- Default: `False`
- Description: Enable aggressive scanning

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional nmap-advanced parameters. Used to pass nmap-advanced options not defined in the parameter list.

## Invocation Template
```bash
nmap <target> <scan_type> <ports> <timing> <nse_scripts> <os_detection> <version_detection> <aggressive> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
