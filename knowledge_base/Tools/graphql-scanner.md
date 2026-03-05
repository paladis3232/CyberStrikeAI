# graphql-scanner

## Overview
- Tool name: `graphql-scanner`
- Enabled in config: `true`
- Executable: `graphqlmap`
- Default args: none
- Summary: GraphQL security scanning and introspection tool

## Detailed Description
Advanced GraphQL security scanning and introspection tool for detecting security issues in GraphQL APIs.

**Key Features:**
- GraphQL introspection
- Query depth testing
- Mutation operation testing
- Vulnerability assessment

**Use Cases:**
- GraphQL security testing
- API security assessment
- Vulnerability discovery
- Security testing

## Parameters
### `endpoint`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: GraphQL endpoint URL

### `introspection`
- Type: `bool`
- Required: `false`
- Flag: `--introspection`
- Format: `flag`
- Default: `True`
- Description: Test introspection queries

### `query_depth`
- Type: `int`
- Required: `false`
- Flag: `--depth`
- Format: `flag`
- Default: `10`
- Description: Maximum query depth to test

### `test_mutations`
- Type: `bool`
- Required: `false`
- Flag: `--mutations`
- Format: `flag`
- Default: `True`
- Description: Test mutation operations

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional graphql-scanner arguments. Used to pass graphql-scanner options not defined in the parameter list.

## Invocation Template
```bash
graphqlmap <endpoint> <introspection> <query_depth> <test_mutations> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
