# clair

## Overview
- Tool name: `clair`
- Enabled in config: `false`
- Executable: `clair`
- Default args: none
- Summary: Container vulnerability analysis tool

## Detailed Description
Clair is a container vulnerability analysis tool for scanning container images for vulnerabilities.

**Key Features:**
- Container image scanning
- Vulnerability detection
- Support for multiple databases
- API interface

**Use Cases:**
- Container security scanning
- Vulnerability detection
- CI/CD integration
- Security auditing

## Parameters
### `image`
- Type: `string`
- Required: `true`
- Flag: `--image`
- Format: `flag`
- Description: Container image to scan

### `config`
- Type: `string`
- Required: `false`
- Flag: `--config`
- Format: `flag`
- Default: `/etc/clair/config.yaml`
- Description: Clair configuration file

### `output_format`
- Type: `string`
- Required: `false`
- Flag: `--format`
- Format: `flag`
- Default: `json`
- Description: Output format (json, yaml)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional clair parameters. Used to pass clair options not defined in the parameter list.

## Invocation Template
```bash
clair <image> <config> <output_format> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
