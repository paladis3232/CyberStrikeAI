# cloudmapper

## Overview
- Tool name: `cloudmapper`
- Enabled in config: `true`
- Executable: `cloudmapper`
- Default args: none
- Summary: AWS network visualization and security analysis tool

## Detailed Description
CloudMapper is an AWS network visualization and security analysis tool.

**Key Features:**
- AWS network visualization
- Security analysis
- Network mapping
- Admin discovery

**Use Cases:**
- AWS network analysis
- Security assessment
- Network visualization
- Security auditing

## Parameters
### `action`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `collect`
- Description: Action to perform (collect, prepare, webserver, find_admins, etc.)

### `account`
- Type: `string`
- Required: `false`
- Flag: `--account`
- Format: `flag`
- Description: AWS account to analyze

### `config`
- Type: `string`
- Required: `false`
- Flag: `--config`
- Format: `flag`
- Default: `config.json`
- Description: Configuration file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional cloudmapper parameters. Used to pass cloudmapper options not defined in the parameter list.

## Invocation Template
```bash
cloudmapper <action> <account> <config> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
