# sqlmap

## Overview
- Tool name: `sqlmap`
- Enabled in config: `true`
- Executable: `sqlmap`
- Default args: none
- Summary: Automated SQL injection detection and exploitation tool for discovering and exploiting SQL injection vulnerabilities

## Detailed Description
Automated SQL injection detection and exploitation tool for discovering and exploiting SQL injection vulnerabilities.

**Key Features:**
- Automatic SQL injection vulnerability detection
- Support for multiple database types (MySQL, PostgreSQL, Oracle, MSSQL, etc.)
- Automatic extraction of database information (tables, columns, data)
- Support for multiple injection techniques (boolean-based blind, time-based blind, union query, etc.)
- Support for advanced features such as file upload/download and command execution

**Use Cases:**
- Web application security testing
- SQL injection vulnerability detection
- Database information gathering
- Penetration testing and vulnerability verification

**Notes:**
- For authorized security testing only
- Some operations may affect the target system
- Recommended to verify in a test environment first
- Use --batch parameter to avoid interactive prompts

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL containing parameters that may be vulnerable to SQL injection.

### `batch`
- Type: `bool`
- Required: `false`
- Flag: `--batch`
- Format: `flag`
- Default: `True`
- Description: Non-interactive mode, automatically selects default options without requiring user input.

### `level`
- Type: `int`
- Required: `false`
- Flag: `--level`
- Format: `combined`
- Default: `3`
- Description: Test level, range 1-5. Higher level means more comprehensive testing but longer duration.

### `data`
- Type: `string`
- Required: `false`
- Flag: `--data`
- Format: `flag`
- Description: POST data string for SQL injection detection in POST requests.

### `cookie`
- Type: `string`
- Required: `false`
- Flag: `--cookie`
- Format: `flag`
- Description: Cookie string for cookie injection detection.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional SQLMap parameters. Used to pass SQLMap options not defined in the parameter list.

## Invocation Template
```bash
sqlmap <url> <batch> <level> <data> <cookie> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
