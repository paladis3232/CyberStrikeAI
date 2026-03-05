# terrascan

## Overview
- Tool name: `terrascan`
- Enabled in config: `true`
- Executable: `terrascan`
- Default args: none
- Summary: Infrastructure as Code security scanning tool

## Detailed Description
Terrascan is an Infrastructure as Code security scanning tool for detecting security issues in IaC configurations.

**Key Features:**
- IaC security scanning
- Multiple framework support
- Policy checking
- Compliance validation

**Use Cases:**
- IaC security scanning
- Cloud configuration auditing
- Security policy checking
- Compliance checking

## Parameters
### `scan_type`
- Type: `string`
- Required: `false`
- Flag: `--scan-type`
- Format: `flag`
- Default: `all`
- Description: Scan type (all, terraform, k8s, etc.)

### `iac_dir`
- Type: `string`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Default: `.`
- Description: IaC directory

### `policy_type`
- Type: `string`
- Required: `false`
- Flag: `--policy-type`
- Format: `flag`
- Description: Policy type to use

### `output_format`
- Type: `string`
- Required: `false`
- Flag: `--output`
- Format: `flag`
- Default: `json`
- Description: Output format (json, yaml, xml)

### `severity`
- Type: `string`
- Required: `false`
- Flag: `--severity`
- Format: `flag`
- Description: Severity filter (high, medium, low)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional terrascan parameters. Used to pass terrascan options not defined in the parameter list.

## Invocation Template
```bash
terrascan <scan_type> <iac_dir> <policy_type> <output_format> <severity> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
