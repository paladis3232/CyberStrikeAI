# falco

## Overview
- Tool name: `falco`
- Enabled in config: `true`
- Executable: `falco`
- Default args: none
- Summary: Runtime security monitoring tool

## Detailed Description
Falco is a runtime security monitoring tool for detecting anomalous behavior in containers and hosts.

**Key Features:**
- Runtime monitoring
- Anomaly detection
- Rules engine
- Real-time alerting

**Use Cases:**
- Runtime security monitoring
- Anomaly detection
- Security incident response
- Compliance monitoring

## Parameters
### `config_file`
- Type: `string`
- Required: `false`
- Flag: `--config`
- Format: `flag`
- Default: `/etc/falco/falco.yaml`
- Description: Falco configuration file

### `rules_file`
- Type: `string`
- Required: `false`
- Flag: `--rules`
- Format: `flag`
- Description: Custom rules file

### `json_output`
- Type: `bool`
- Required: `false`
- Flag: `-o json_output=true`
- Format: `flag`
- Default: `True`
- Description: Output in JSON format (equivalent to -o json_output=true)

### `duration`
- Type: `int`
- Required: `false`
- Flag: `--duration`
- Format: `flag`
- Default: `60`
- Description: Monitoring duration in seconds

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional falco parameters. Used to pass falco options not defined in the parameter list.

## Invocation Template
```bash
falco <config_file> <rules_file> <json_output> <duration> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
