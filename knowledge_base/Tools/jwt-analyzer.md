# jwt-analyzer

## Overview
- Tool name: `jwt-analyzer`
- Enabled in config: `true`
- Executable: `jwt_tool`
- Default args: none
- Summary: JWT token analysis and vulnerability testing tool

## Detailed Description
Advanced JWT token analysis and vulnerability testing tool for detecting security issues in JWT implementations.

**Key Features:**
- JWT token analysis
- Vulnerability testing
- Attack vector detection
- Token manipulation

**Use Cases:**
- JWT security testing
- Token analysis
- Vulnerability discovery
- Security testing

## Parameters
### `jwt_token`
- Type: `string`
- Required: `true`
- Flag: `-t`
- Format: `flag`
- Description: JWT token to analyze

### `target_url`
- Type: `string`
- Required: `false`
- Flag: `-u`
- Format: `flag`
- Description: Optional target URL for testing token manipulation

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional jwt-analyzer parameters. Used to pass jwt-analyzer options not defined in the parameter list.

## Invocation Template
```bash
jwt_tool <jwt_token> <target_url> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
