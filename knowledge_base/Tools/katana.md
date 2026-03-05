# katana

## Overview
- Tool name: `katana`
- Enabled in config: `true`
- Executable: `katana`
- Default args: none
- Summary: Next-generation web crawler and spider tool

## Detailed Description
Katana is a fast, intelligent web crawling tool for discovering endpoints and resources in web applications.

**Key Features:**
- Intelligent web crawling
- JavaScript rendering support
- Form extraction
- Endpoint discovery

**Use Cases:**
- Web application reconnaissance
- Endpoint discovery
- Content crawling
- Security testing

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL

### `depth`
- Type: `int`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Default: `3`
- Description: Crawl depth

### `js_crawl`
- Type: `bool`
- Required: `false`
- Flag: `-jc`
- Format: `flag`
- Default: `True`
- Description: Enable JavaScript crawling

### `form_extraction`
- Type: `bool`
- Required: `false`
- Flag: `-forms`
- Format: `flag`
- Default: `True`
- Description: Enable form extraction

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Katana parameters. Used to pass Katana options not defined in the parameter list.

## Invocation Template
```bash
katana <url> <depth> <js_crawl> <form_extraction> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
