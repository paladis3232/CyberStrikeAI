# amass

## Overview
- Tool name: `amass`
- Enabled in config: `true`
- Executable: `amass`
- Default args: none
- Summary: Subdomain enumeration and network mapping tool

## Detailed Description
Amass is a deep subdomain enumeration and network mapping tool that discovers subdomains for target domains using multiple techniques.

**Key Features:**
- Passive and active subdomain enumeration
- Multiple data source integration
- Network mapping and visualization
- Certificate transparency log queries

**Use Cases:**
- Subdomain discovery
- Asset discovery
- Penetration testing reconnaissance
- Bug bounty reconnaissance

## Parameters
### `mode`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `enum`
- Description: Run mode (Amass subcommand):
- `enum`: Subdomain enumeration
- `intel`: Threat intelligence mode
- `viz`: Result visualization

### `domain`
- Type: `string`
- Required: `true`
- Flag: `-d`
- Format: `flag`
- Description: Target domain name

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Amass parameters

## Invocation Template
```bash
amass <mode> <domain> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
