# hakrawler

## Overview
- Tool name: `hakrawler`
- Enabled in config: `true`
- Executable: `hakrawler`
- Default args: none
- Summary: Web endpoint discovery tool

## Detailed Description
Hakrawler is a fast, simple web endpoint discovery tool.

**Key Features:**
- Web endpoint discovery
- Link extraction
- JavaScript file discovery
- Fast crawling

**Use Cases:**
- Web endpoint discovery
- Content crawling
- Security testing
- Bug bounty reconnaissance

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-url`
- Format: `flag`
- Description: Target URL

### `depth`
- Type: `int`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Default: `2`
- Description: Crawl depth

### `forms`
- Type: `bool`
- Required: `false`
- Flag: `-forms`
- Format: `flag`
- Default: `True`
- Description: Include forms

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional hakrawler parameters. Used to pass hakrawler options not defined in the parameter list.

## Invocation Template
```bash
hakrawler <url> <depth> <forms> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
