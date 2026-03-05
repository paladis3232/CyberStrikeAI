# xsser

## Overview
- Tool name: `xsser`
- Enabled in config: `true`
- Executable: `xsser`
- Default args: none
- Summary: XSS vulnerability testing tool

## Detailed Description
XSSer is an automated XSS vulnerability testing tool.

**Key Features:**
- XSS vulnerability detection
- Multiple XSS techniques
- Automated testing
- Report generation

**Use Cases:**
- XSS vulnerability testing
- Web application security testing
- Penetration testing
- Vulnerability verification

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `--url`
- Format: `flag`
- Description: Target URL

### `params`
- Type: `string`
- Required: `false`
- Flag: `--Fp`
- Format: `flag`
- Description: Parameters to test

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional xsser parameters. Used to pass xsser options not defined in the parameter list.

## Invocation Template
```bash
xsser <url> <params> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
