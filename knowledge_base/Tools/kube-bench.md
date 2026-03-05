# kube-bench

## Overview
- Tool name: `kube-bench`
- Enabled in config: `true`
- Executable: `kube-bench`
- Default args: none
- Summary: CIS Kubernetes benchmark checking tool

## Detailed Description
Kube-bench is a CIS Kubernetes benchmark checking tool for verifying whether a Kubernetes cluster meets CIS benchmarks.

**Key Features:**
- CIS benchmark checks
- Multiple target support (master, node, etcd, policies)
- Detailed reports
- Configuration validation

**Use Cases:**
- Kubernetes compliance checking
- Security configuration auditing
- CIS benchmark validation
- Security assessment

## Parameters
### `targets`
- Type: `string`
- Required: `false`
- Flag: `--targets`
- Format: `flag`
- Description: Targets to check (master, node, etcd, policies)

### `version`
- Type: `string`
- Required: `false`
- Flag: `--version`
- Format: `flag`
- Description: Kubernetes version

### `config_dir`
- Type: `string`
- Required: `false`
- Flag: `--config-dir`
- Format: `flag`
- Description: Configuration directory

### `output_format`
- Type: `string`
- Required: `false`
- Flag: `--output`
- Format: `flag`
- Default: `json`
- Description: Output format (json, yaml)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional kube-bench parameters. Used to pass kube-bench options not defined in the parameter list.

## Invocation Template
```bash
kube-bench <targets> <version> <config_dir> <output_format> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
