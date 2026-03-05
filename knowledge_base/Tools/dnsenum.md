# dnsenum

## Overview
- Tool name: `dnsenum`
- Enabled in config: `true`
- Executable: `dnsenum`
- Default args: none
- Summary: DNS enumeration tool

## Detailed Description
DNSenum is a DNS information gathering tool for enumerating DNS information.

**Key Features:**
- DNS information gathering
- Subdomain enumeration
- Zone transfer testing
- Reverse lookup

**Use Cases:**
- DNS enumeration
- Subdomain discovery
- Network reconnaissance
- Penetration testing

## Parameters
### `domain`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target domain name

### `dns_server`
- Type: `string`
- Required: `false`
- Flag: `-n`
- Format: `flag`
- Description: DNS server to use

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `-f`
- Format: `flag`
- Description: Wordlist file for brute forcing

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional dnsenum parameters. Used to pass dnsenum options not defined in the parameter list.

## Invocation Template
```bash
dnsenum <domain> <dns_server> <wordlist> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
