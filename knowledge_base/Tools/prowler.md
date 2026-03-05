# prowler

## Overview
- Tool name: `prowler`
- Enabled in config: `true`
- Executable: `prowler`
- Default args: none
- Summary: Cloud security assessment tool (AWS, Azure, GCP)

## Detailed Description
Prowler is a comprehensive cloud security assessment tool supporting AWS, Azure, and GCP.

**Key Features:**
- Cloud security assessment
- Compliance checks
- Security best practice checks
- Multiple output formats

**Use Cases:**
- Cloud security auditing
- Compliance checks
- Security assessment
- Cloud configuration auditing

## Parameters
### `provider`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `aws`
- Description: Cloud provider (aws, azure, gcp)

### `profile`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Default: `default`
- Description: AWS profile

### `region`
- Type: `string`
- Required: `false`
- Flag: `-r`
- Format: `flag`
- Description: Specific region to scan

### `checks`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Description: Specific checks to run

### `output_format`
- Type: `string`
- Required: `false`
- Flag: `-M`
- Format: `flag`
- Default: `json`
- Description: Output format (json, csv, html)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional prowler parameters. Used to pass prowler options not defined in the parameter list.

## Invocation Template
```bash
prowler <provider> <profile> <region> <checks> <output_format> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
