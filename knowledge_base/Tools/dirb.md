# dirb

## Overview
- Tool name: `dirb`
- Enabled in config: `true`
- Executable: `dirb`
- Default args: none
- Summary: Web directory and file scanning tool that discovers hidden directories and files on web servers via brute force

## Detailed Description
Web directory and file scanning tool that discovers hidden directories and files on web servers via brute force.

**Key Features:**
- Directory and file discovery
- Custom wordlist support
- Detection of common web directory structures
- Identification of sensitive files such as backups and configuration files
- Support for multiple HTTP methods

**Use Cases:**
- Web application directory enumeration
- Discovering hidden admin interfaces
- Finding backup files and sensitive information
- Information gathering during penetration testing

**Notes:**
- Scanning may generate a large number of HTTP requests
- Some requests may be blocked by WAF
- Recommended to use appropriate wordlists to improve efficiency
- Scan results require manual verification

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target URL, the web server address to scan.

### `wordlist`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Description: Wordlist file path containing the list of directories and filenames to try.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Dirb parameters. Used to pass Dirb options not defined in the parameter list.

## Invocation Template
```bash
dirb <url> <wordlist> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
