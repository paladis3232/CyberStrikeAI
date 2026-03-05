# masscan

## Overview
- Tool name: `masscan`
- Enabled in config: `true`
- Executable: `masscan`
- Default args: none
- Summary: High-speed internet-scale port scanning tool

## Detailed Description
Masscan is a high-speed port scanning tool that can scan the entire internet in minutes.

**Key Features:**
- Extremely high scan speed
- Support for large-scale network scanning
- Banner grabbing
- Configurable scan rate

**Use Cases:**
- Large-scale network scanning
- Internet-scale scanning
- Rapid port discovery

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address or CIDR range

### `ports`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Default: `1-65535`
- Description: Port range (e.g.: 1-65535)

### `rate`
- Type: `int`
- Required: `false`
- Flag: `--rate`
- Format: `flag`
- Default: `1000`
- Description: Packets per second

### `interface`
- Type: `string`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Description: Network interface

### `banners`
- Type: `bool`
- Required: `false`
- Flag: `--banners`
- Format: `flag`
- Default: `False`
- Description: Enable banner grabbing

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional masscan parameters. Used to pass masscan options not defined in the parameter list.

## Invocation Template
```bash
masscan <target> <ports> <rate> <interface> <banners> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
