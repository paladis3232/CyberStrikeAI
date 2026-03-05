# waybackurls

## Overview
- Tool name: `waybackurls`
- Enabled in config: `true`
- Executable: `waybackurls`
- Default args: none
- Summary: Fetch historical URLs from the Wayback Machine

## Detailed Description
Waybackurls fetches historical URLs for a target domain from the Wayback Machine.

**Key Features:**
- Historical URL discovery
- Version retrieval
- Subdomain support

**Use Cases:**
- Historical URL collection
- Bug bounty reconnaissance
- Security testing
- Content discovery

## Parameters
### `domain`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target domain name

### `get_versions`
- Type: `bool`
- Required: `false`
- Flag: `-get-versions`
- Format: `flag`
- Default: `False`
- Description: Get all versions of URLs

### `no_subs`
- Type: `bool`
- Required: `false`
- Flag: `-no-subs`
- Format: `flag`
- Default: `False`
- Description: Exclude subdomains

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional waybackurls parameters. Used to pass waybackurls options not defined in the parameter list.

## Invocation Template
```bash
waybackurls <domain> <get_versions> <no_subs> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
