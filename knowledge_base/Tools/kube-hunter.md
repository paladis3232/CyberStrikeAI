# kube-hunter

## Overview
- Tool name: `kube-hunter`
- Enabled in config: `true`
- Executable: `kube-hunter`
- Default args: none
- Summary: Kubernetes penetration testing tool

## Detailed Description
Kube-hunter is a Kubernetes penetration testing tool for discovering security issues in Kubernetes clusters.

**Key Features:**
- Kubernetes security scanning
- Vulnerability discovery
- Configuration issue detection
- Active and passive modes

**Use Cases:**
- Kubernetes security testing
- Cluster security assessment
- Penetration testing
- Security auditing

## Parameters
### `target`
- Type: `string`
- Required: `false`
- Flag: `--remote`
- Format: `flag`
- Description: Specific target to scan

### `cidr`
- Type: `string`
- Required: `false`
- Flag: `--cidr`
- Format: `flag`
- Description: CIDR range to scan

### `interface`
- Type: `string`
- Required: `false`
- Flag: `--interface`
- Format: `flag`
- Description: Network interface to scan

### `active`
- Type: `bool`
- Required: `false`
- Flag: `--active`
- Format: `flag`
- Default: `False`
- Description: Enable active scanning (may be risky)

### `report`
- Type: `string`
- Required: `false`
- Flag: `--report`
- Format: `flag`
- Default: `json`
- Description: Report format (json, yaml)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional kube-hunter parameters. Used to pass kube-hunter options not defined in the parameter list.

## Invocation Template
```bash
kube-hunter <target> <cidr> <interface> <active> <report> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
