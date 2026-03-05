# paramspider

## Overview
- Tool name: `paramspider`
- Enabled in config: `true`
- Executable: `paramspider`
- Default args: none
- Summary: Mine parameters from web archives

## Detailed Description
ParamSpider mines parameters from web archives to discover hidden parameters.

**Key Features:**
- Parameter mining
- Web archive queries
- Multi-level depth support
- Extension filtering

**Use Cases:**
- Parameter discovery
- Bug bounty reconnaissance
- Web application security testing
- Security testing

## Parameters
### `domain`
- Type: `string`
- Required: `true`
- Flag: `-d`
- Format: `flag`
- Description: Target domain

### `level`
- Type: `int`
- Required: `false`
- Flag: `-l`
- Format: `flag`
- Default: `2`
- Description: Mining depth level

### `exclude`
- Type: `string`
- Required: `false`
- Flag: `-e`
- Format: `flag`
- Description: File extensions to exclude

### `output`
- Type: `string`
- Required: `false`
- Flag: `-o`
- Format: `flag`
- Description: Output file path

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional paramspider arguments. Used to pass paramspider options not defined in the parameter list.

## Invocation Template
```bash
paramspider <domain> <level> <exclude> <output> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
