# gau

## Overview
- Tool name: `gau`
- Enabled in config: `true`
- Executable: `gau`
- Default args: none
- Summary: Fetch all URLs from multiple data sources

## Detailed Description
Gau (Get All URLs) fetches all URLs for a target domain from multiple data sources.

**Key Features:**
- Fetch URLs from Wayback Machine
- Fetch URLs from CommonCrawl
- Fetch URLs from OTX
- Fetch URLs from URLScan

**Use Cases:**
- URL discovery
- Historical URL collection
- Bug bounty reconnaissance
- Security testing

## Parameters
### `domain`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target domain name

### `providers`
- Type: `string`
- Required: `false`
- Flag: `-providers`
- Format: `flag`
- Description: Data sources (wayback,commoncrawl,otx,urlscan)

### `include_subs`
- Type: `bool`
- Required: `false`
- Flag: `-subs`
- Format: `flag`
- Default: `True`
- Description: Include subdomains

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Gau parameters. Used to pass Gau options not defined in the parameter list.

## Invocation Template
```bash
gau <domain> <providers> <include_subs> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
