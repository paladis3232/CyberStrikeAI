# arp-scan

## Overview
- Tool name: `arp-scan`
- Enabled in config: `true`
- Executable: `arp-scan`
- Default args: none
- Summary: ARP network discovery tool

## Detailed Description
Arp-scan is an ARP network discovery tool for discovering active hosts on the local network.

**Key Features:**
- ARP scanning
- Local network discovery
- MAC address identification
- Fast scanning

**Use Cases:**
- Local network discovery
- Host discovery
- Network mapping
- Penetration testing

## Parameters
### `target`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Description: Target IP range (if not using local_network)

### `interface`
- Type: `string`
- Required: `false`
- Flag: `-I`
- Format: `flag`
- Description: Network interface

### `local_network`
- Type: `bool`
- Required: `false`
- Flag: `-l`
- Format: `flag`
- Default: `False`
- Description: Scan local network

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional arp-scan parameters. Used to pass arp-scan options not defined in the parameter list.

## Invocation Template
```bash
arp-scan <target> <interface> <local_network> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
