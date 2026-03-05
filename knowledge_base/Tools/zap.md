# zap

## Overview
- Tool name: `zap`
- Enabled in config: `false`
- Executable: `zap-cli`
- Default args: none
- Summary: OWASP ZAP web application security scanner

## Detailed Description
OWASP ZAP is a web application security scanner for discovering security vulnerabilities in web applications.

**Key Features:**
- Web application security scanning
- Active and passive scanning
- API testing
- Detailed reports

**Use Cases:**
- Web application security testing
- Vulnerability scanning
- Security assessment
- Penetration testing

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Flag: `-t`
- Format: `flag`
- Description: Target URL

### `scan_type`
- Type: `string`
- Required: `false`
- Flag: `--scan-type`
- Format: `flag`
- Default: `baseline`
- Description: Scan type (baseline, full, api)

### `api_key`
- Type: `string`
- Required: `false`
- Flag: `--api-key`
- Format: `flag`
- Description: ZAP API key

### `daemon`
- Type: `bool`
- Required: `false`
- Flag: `--daemon`
- Format: `flag`
- Default: `False`
- Description: Run in daemon mode

### `port`
- Type: `string`
- Required: `false`
- Flag: `--port`
- Format: `flag`
- Default: `8090`
- Description: ZAP daemon port

### `format_type`
- Type: `string`
- Required: `false`
- Flag: `--format`
- Format: `flag`
- Default: `xml`
- Description: Output format (xml, json, html)

### `output_file`
- Type: `string`
- Required: `false`
- Flag: `--output`
- Format: `flag`
- Description: Output file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional zap parameters. Used to pass zap options not defined in the parameter list.

## Invocation Template
```bash
zap-cli <target> <scan_type> <api_key> <daemon> <port> <format_type> <output_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
