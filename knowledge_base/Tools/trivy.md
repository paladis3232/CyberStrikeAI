# trivy

## Overview
- Tool name: `trivy`
- Enabled in config: `true`
- Executable: `trivy`
- Default args: none
- Summary: Container and filesystem vulnerability scanner

## Detailed Description
Trivy is a simple and comprehensive vulnerability scanner for containers and filesystems.

**Key Features:**
- Container image scanning
- Filesystem scanning
- Code repository scanning
- Configuration file scanning

**Use Cases:**
- Container security scanning
- CI/CD integration
- Vulnerability detection
- Security auditing

## Parameters
### `scan_type`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `image`
- Description: Scan type (image, fs, repo, config)

### `target`
- Type: `string`
- Required: `true`
- Position: `1`
- Format: `positional`
- Description: Scan target (image name, directory, or repository)

### `severity`
- Type: `string`
- Required: `false`
- Flag: `--severity`
- Format: `flag`
- Description: Severity filter (UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL)

### `output_format`
- Type: `string`
- Required: `false`
- Flag: `--format`
- Format: `flag`
- Default: `json`
- Description: Output format (json, table, sarif)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Trivy parameters. Used to pass Trivy options not defined in the parameter list.

## Invocation Template
```bash
trivy <scan_type> <target> <severity> <output_format> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
