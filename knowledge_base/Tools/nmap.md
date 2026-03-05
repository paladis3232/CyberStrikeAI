# nmap

## Overview
- Tool name: `nmap`
- Enabled in config: `true`
- Executable: `nmap`
- Default args: `-sT -sV -sC`
- Summary: Network scanning tool for discovering network hosts, open ports, and services

## Detailed Description
Network mapping and port scanning tool for discovering hosts, services, and open ports in a network.

**Key Features:**
- Host discovery: Detect active hosts in the network
- Port scanning: Identify open ports on target hosts
- Service identification: Detect service types and versions running on ports
- OS detection: Identify the operating system of target hosts
- Vulnerability detection: Use NSE scripts to detect common vulnerabilities

**Use Cases:**
- Network asset discovery and enumeration
- Security assessment and penetration testing
- Network troubleshooting
- Port and service auditing

**Notes:**
- Uses -sT (TCP connect scan) instead of -sS (SYN scan), because -sS requires root privileges
- Scan speed depends on network latency and target response
- Some scans may be detected by firewalls or IDS
- Ensure you have permission to scan the target network

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target IP address or domain name. Can be a single IP, IP range, CIDR format, or domain name.

### `ports`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Port range to scan. Can be a single port, port range, comma-separated port list, or special value.

### `scan_type`
- Type: `string`
- Required: `false`
- Format: `template`
- Description: Scan type options. Can override the default scan type.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Nmap parameters. Used to pass Nmap options not defined in the parameter list.

## Invocation Template
```bash
nmap -sT -sV -sC <target> <ports> <scan_type> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
