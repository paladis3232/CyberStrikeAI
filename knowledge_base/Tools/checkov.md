# checkov

## Overview
- Tool name: `checkov`
- Enabled in config: `true`
- Executable: `checkov`
- Default args: none
- Summary: Infrastructure as Code security scanning tool

## Detailed Description
Checkov is a static code analysis tool for security scanning of Infrastructure as Code (IaC).

**Key Features:**
- Support for multiple IaC frameworks (Terraform, CloudFormation, Kubernetes, etc.)
- Hundreds of built-in policies
- Custom policy support
- CI/CD integration

**Use Cases:**
- IaC security scanning
- Cloud configuration auditing
- Security policy checking
- Compliance checking

## Parameters
### `directory`
- Type: `string`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Default: `.`
- Description: Directory to scan

### `framework`
- Type: `string`
- Required: `false`
- Flag: `--framework`
- Format: `flag`
- Description: Framework to scan (terraform, cloudformation, kubernetes, etc.)

### `check`
- Type: `string`
- Required: `false`
- Flag: `--check`
- Format: `flag`
- Description: Specific checks to run

### `output_format`
- Type: `string`
- Required: `false`
- Flag: `--output`
- Format: `flag`
- Default: `json`
- Description: Output format (json, yaml, cli)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional checkov parameters. Used to pass checkov options not defined in the parameter list.

## Invocation Template
```bash
checkov <directory> <framework> <check> <output_format> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
