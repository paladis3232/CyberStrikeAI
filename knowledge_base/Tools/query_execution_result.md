# query_execution_result

## Overview
- Tool name: `query_execution_result`
- Enabled in config: `true`
- Executable: `internal:query_execution_result`
- Default args: none
- Summary: Query tool execution results with support for pagination, search, and filtering of large result sets

## Detailed Description
Tool for querying saved tool execution results. When the results returned by a tool are too large, the system automatically saves the complete results. This tool is used to query those results on demand.

**Key Features:**
- Paginated queries: Support paginated browsing of large result sets to avoid loading too much data at once
- Full-text search: Search for specific keywords in results
- Conditional filtering: Filter results based on conditions (e.g., only show lines containing "error")
- Metadata queries: Retrieve basic information about results (total lines, total pages, etc.)

**Use Cases:**
- When tool results exceed a threshold (e.g., 50KB), the system automatically saves the results
- Use this tool to query complete results on demand
- Use the search function to find specific information
- Use the filter function to filter specific types of content

**Workflow:**
1. After tool execution, if results are too large, the system saves the complete results and returns an execution ID
2. Use this tool to query results via execution_id
3. Browse pages, search keywords, or filter conditions

**Notes:**
- execution_id is a required parameter, obtained from the tool execution return message
- Default returns 100 lines per page, adjustable via the limit parameter
- Search and filter functions can be used together
- Results are retained for a period (default 7 days), after which they may be cleaned up

## Parameters
### `execution_id`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: The tool execution ID. Obtained from the return message after tool execution completes.

### `page`
- Type: `integer`
- Required: `false`
- Format: `flag`
- Default: `1`
- Description: Page number to query. Starts from 1.

### `limit`
- Type: `integer`
- Required: `false`
- Format: `flag`
- Default: `100`
- Description: Number of lines returned per page. Controls the amount of data returned in a single query.

### `search`
- Type: `string`
- Required: `false`
- Format: `flag`
- Description: Search keyword. Search for lines containing this keyword in results.

### `filter`
- Type: `string`
- Required: `false`
- Format: `flag`
- Description: Filter condition. Only return lines containing this keyword.

## Invocation Template
```bash
internal:query_execution_result <execution_id> <page> <limit> <search> <filter>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
