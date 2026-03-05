# scout-suite

## Overview
- Tool name: `scout-suite`
- Enabled in config: `true`
- Executable: `scout`
- Default args: none
- Summary: Multi-cloud security assessment tool

## Detailed Description
Scout Suite is a multi-cloud security assessment tool supporting AWS, Azure, GCP, Aliyun, and OCI.

**Key Features:**
- Multi-cloud security assessment
- Configuration auditing
- Security best practice checks
- Detailed report generation

**Use Cases:**
- Cloud security auditing
- Compliance checks
- Security assessment
- Cloud configuration auditing

## Parameters
### `provider`
- Type: `string`
- Required: `false`
- Flag: `--provider`
- Format: `flag`
- Default: `aws`
- Description: Cloud provider (aws, azure, gcp, aliyun, oci)

### `profile`
- Type: `string`
- Required: `false`
- Flag: `--profile`
- Format: `flag`
- Default: `default`
- Description: AWS profile

### `report_dir`
- Type: `string`
- Required: `false`
- Flag: `--report-dir`
- Format: `flag`
- Default: `/tmp/scout-suite`
- Description: Directory to save reports

### `services`
- Type: `string`
- Required: `false`
- Flag: `--services`
- Format: `flag`
- Description: Specific services to assess

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional scout-suite parameters. Used to pass scout-suite options not defined in the parameter list.

## Invocation Template
```bash
scout <provider> <profile> <report_dir> <services> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
