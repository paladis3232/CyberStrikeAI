# api-schema-analyzer

## Overview
- Tool name: `api-schema-analyzer`
- Enabled in config: `true`
- Executable: `spectral`
- Default args: `lint`
- Summary: API schema analysis tool for identifying potential security issues

## Detailed Description
Invokes `spectral lint` for static analysis of OpenAPI/Swagger/GraphQL schemas, compatible with custom rulesets and output formats.

## Parameters
### `schema_url`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: API schema file or URL (target passed to spectral lint)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Spectral parameters, e.g. `--ruleset`, `--format`, `--fail-severity`, etc.

## Invocation Template
```bash
spectral lint <schema_url> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
