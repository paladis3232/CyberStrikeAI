# wpscan

## Overview
- Tool name: `wpscan`
- Enabled in config: `true`
- Executable: `wpscan`
- Default args: none
- Summary: WordPress security scanner for detecting WordPress vulnerabilities

## Detailed Description
WPScan is a tool specifically designed for WordPress security scanning, capable of detecting themes, plugins, and core vulnerabilities.

**Key Features:**
- WordPress core vulnerability detection
- Theme and plugin vulnerability scanning
- User enumeration
- Password brute forcing
- Security configuration checks

**Use Cases:**
- WordPress security assessment
- Vulnerability scanning
- Penetration testing
- Security auditing

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `--url`
- Format: `flag`
- Description: WordPress site URL

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional WPScan parameters

## Invocation Template
```bash
wpscan <url> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
