# fierce

## Overview
- Tool name: `fierce`
- Enabled in config: `true`
- Executable: `fierce`
- Default args: none
- Summary: DNS reconnaissance tool

## Detailed Description
Fierce is a DNS reconnaissance tool for discovering subdomains of target domains.

**Key Features:**
- Subdomain discovery
- DNS brute forcing
- Zone transfer testing
- Network mapping

**Use Cases:**
- DNS reconnaissance
- Subdomain enumeration
- Network mapping
- Penetration testing

## Parameters
### `domain`
- Type: `string`
- Required: `true`
- Flag: `-dns`
- Format: `flag`
- Description: Target domain name

### `dns_server`
- Type: `string`
- Required: `false`
- Flag: `-dnsserver`
- Format: `flag`
- Description: DNS server to use

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional fierce parameters. Used to pass fierce options not defined in the parameter list.

## Invocation Template
```bash
fierce <domain> <dns_server> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
