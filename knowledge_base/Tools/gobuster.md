# gobuster

## Overview
- Tool name: `gobuster`
- Enabled in config: `true`
- Executable: `gobuster`
- Default args: none
- Summary: Web content scanning tool for discovering directories, files, and subdomains

## Detailed Description
Gobuster is a fast content discovery tool for directory, file, and subdomain enumeration in web applications.

**Key Features:**
- Directory and file discovery
- DNS subdomain enumeration
- Virtual host discovery
- Support for multiple modes (dir, dns, fuzz, vhost)

**Use Cases:**
- Web application security testing
- Directory enumeration and file discovery
- Subdomain discovery
- Penetration testing reconnaissance

## Parameters
### `mode`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `dir`
- Description: Scan mode (Gobuster subcommand), with the following values:
- `dir`: Directory/file enumeration
- `dns`: DNS subdomain enumeration
- `fuzz`: Template FUZZ scanning
- `vhost`: Virtual host discovery

### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL

### `wordlist`
- Type: `string`
- Required: `false`
- Flag: `-w`
- Format: `flag`
- Default: `/usr/share/wordlists/dirb/common.txt`
- Description: Wordlist file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Gobuster parameters

## Invocation Template
```bash
gobuster <mode> <url> <wordlist> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
