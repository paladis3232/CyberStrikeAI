# nuclei-bitrix

## Overview
- Tool name: `nuclei-bitrix`
- Enabled in config: `true`
- Executable: `nuclei`
- Default args: `-t /opt/cyberstrike-tools/bitrix-nuclei-templates`
- Summary: Nuclei Bitrix template pack scanner for Bitrix exposure and CVE checks

## Detailed Description
Nuclei Bitrix profile that runs templates from:
`https://github.com/jhonnybonny/bitrix-nuclei-templates`

**Key Features:**
- Bitrix-focused endpoint and exposure checks
- Coverage for multiple Bitrix/Bitrix24 CVE-style detections
- Quick baseline scan for installer remnants and common weak points
- Works with standard Nuclei filters (`-s`, `-tags`, custom args)

## Parameters
### `target`
- Type: `string`
- Required: `true`
- Flag: `-u`
- Format: `flag`
- Description: Target URL or IP

### `severity`
- Type: `string`
- Required: `false`
- Flag: `-s`
- Format: `flag`
- Description: Severity filter (critical,high,medium,low,info)

### `tags`
- Type: `string`
- Required: `false`
- Flag: `-tags`
- Format: `flag`
- Description: Tag filter (e.g. cve,rce,lfi,xss,bitrix)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional Nuclei parameters

## Invocation Template
```bash
nuclei -t /opt/cyberstrike-tools/bitrix-nuclei-templates -u <target> <severity> <tags> <additional_args>
```

## Practical Examples
```bash
# Full Bitrix pack scan
nuclei-bitrix -u https://target.example

# Severity-focused run
nuclei-bitrix -u https://target.example -s high,critical
```

## Model Usage Guidance
- Use only in authorized scope.
- Validate template path existence before scanning.
- Start with a single target and narrow filters before broad runs.

## References
- https://github.com/jhonnybonny/bitrix-nuclei-templates
