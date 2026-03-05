# nbtscan

## Overview
- Tool name: `nbtscan`
- Enabled in config: `true`
- Executable: `nbtscan`
- Default args: none
- Summary: NetBIOS name scanning tool

## Detailed Description
Nbtscan is a NetBIOS name scanning tool for discovering Windows systems on the network.

**Key Features:**
- NetBIOS name scanning
- Windows system discovery
- Network mapping
- Fast scanning

**Use Cases:**
- Windows network discovery
- NetBIOS enumeration
- Network mapping
- Penetration testing

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address or range

### `verbose`
- Type: `bool`
- Required: `false`
- Flag: `-v`
- Format: `flag`
- Default: `False`
- Description: Verbose output

### `timeout`
- Type: `int`
- Required: `false`
- Flag: `-t`
- Format: `flag`
- Default: `2`
- Description: Timeout in seconds

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional nbtscan parameters. Used to pass nbtscan options not defined in the parameter list.

## Invocation Template
```bash
nbtscan <target> <verbose> <timeout> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
