# nikto

## Overview
- Tool name: `nikto`
- Enabled in config: `true`
- Executable: `nikto`
- Default args: none
- Summary: Web server scanning tool for detecting known vulnerabilities and misconfigurations in web servers and applications

## Detailed Description
Web server scanning tool for detecting known vulnerabilities, misconfigurations, and potential security issues in web servers and applications.

**Key Features:**
- Detect web server version and configuration issues
- Identify known web vulnerabilities and CVEs
- Detect dangerous files and directories
- Check server misconfigurations
- Identify outdated software versions
- Detect default files and scripts

**Use Cases:**
- Web application security assessment
- Server configuration auditing
- Vulnerability scanning and discovery
- Pre-penetration testing information gathering

**Notes:**
- Scanning may generate large amounts of logs; manage log storage carefully
- Some scans may trigger WAF or IDS alerts
- Recommended to use within authorized scope
- Scan results require manual verification

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Flag: `-h`
- Format: `flag`
- Description: Target URL or IP address. Can be a complete URL or IP address.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional nikto parameters. Used to pass nikto options not defined in the parameter list.

## Invocation Template
```bash
nikto <target> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
