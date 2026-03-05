# docker-bench-security

## Overview
- Tool name: `docker-bench-security`
- Enabled in config: `true`
- Executable: `docker-bench-security`
- Default args: none
- Summary: Docker security benchmark checking tool

## Detailed Description
Docker Bench for Security is a Docker security benchmark checking tool that verifies whether Docker configurations follow security best practices.

**Key Features:**
- Docker security benchmark checks
- Configuration auditing
- Security best practice checks
- Detailed reports

**Use Cases:**
- Docker security auditing
- Configuration checking
- Compliance verification
- Security assessment

## Parameters
### `checks`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Description: Specific checks to run

### `exclude`
- Type: `string`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Description: Checks to exclude

### `output_file`
- Type: `string`
- Required: `false`
- Flag: `-l`
- Format: `flag`
- Description: Output file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional docker-bench-security arguments. Used to pass docker-bench-security options not defined in the parameter list.

## Invocation Template
```bash
docker-bench-security <checks> <exclude> <output_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
