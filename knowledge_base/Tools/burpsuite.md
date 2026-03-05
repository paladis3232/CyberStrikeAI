# burpsuite

## Overview
- Tool name: `burpsuite`
- Enabled in config: `true`
- Executable: `burpsuite`
- Default args: none
- Summary: Web application security testing platform

## Detailed Description
Burp Suite is a web application security testing platform providing comprehensive web security testing functionality.

**Key Features:**
- Web application security scanning
- Proxy interception
- Vulnerability scanning
- Manual testing tools

**Use Cases:**
- Web application security testing
- Penetration testing
- Vulnerability scanning
- Security assessment

## Parameters
### `project_file`
- Type: `string`
- Required: `false`
- Flag: `--project-file`
- Format: `flag`
- Description: Burp Suite project file path (--project-file)

### `config_file`
- Type: `string`
- Required: `false`
- Flag: `--config-file`
- Format: `flag`
- Description: Automation/scan configuration file (--config-file)

### `user_config_file`
- Type: `string`
- Required: `false`
- Flag: `--user-config-file`
- Format: `flag`
- Description: User configuration file (--user-config-file)

### `headless`
- Type: `bool`
- Required: `false`
- Flag: `--headless`
- Format: `flag`
- Default: `False`
- Description: Run in headless mode

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional burpsuite parameters. Used to pass burpsuite options not defined in the parameter list (e.g. --project-config, --log-config, etc.).

## Invocation Template
```bash
burpsuite <project_file> <config_file> <user_config_file> <headless> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
