# subfinder

## Overview
- Tool name: `subfinder`
- Enabled in config: `true`
- Executable: `subfinder`
- Default args: none
- Summary: Passive subdomain discovery tool using multiple data sources

## Detailed Description
Subfinder is a passive subdomain discovery tool that finds subdomains by querying multiple data sources.

**Key Features:**
- Passive subdomain discovery
- Multiple data source integration
- Fast scanning
- API key configuration support

**Use Cases:**
- Subdomain enumeration
- Asset discovery
- Bug bounty reconnaissance
- Penetration testing reconnaissance

## Parameters
### `domain`
- Type: `string`
- Required: `true`
- Flag: `-d`
- Format: `flag`
- Description: Target domain name

### `silent`
- Type: `bool`
- Required: `false`
- Flag: `-silent`
- Format: `flag`
- Default: `True`
- Description: Silent mode

### `all_sources`
- Type: `bool`
- Required: `false`
- Flag: `-all`
- Format: `flag`
- Default: `False`
- Description: Use all data sources

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Subfinder parameters

## Invocation Template
```bash
subfinder <domain> <silent> <all_sources> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
