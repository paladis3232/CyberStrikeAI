# ghidra

## Overview
- Tool name: `ghidra`
- Enabled in config: `true`
- Executable: `analyzeHeadless`
- Default args: none
- Summary: Advanced binary analysis and reverse engineering tool

## Detailed Description
Ghidra is a free binary analysis and reverse engineering tool developed by the NSA.

**Key Features:**
- Disassembly and decompilation
- Advanced analysis
- Script support
- Collaboration features

**Use Cases:**
- Binary analysis
- Reverse engineering
- Malware analysis
- Vulnerability research

## Parameters
### `project_dir`
- Type: `string`
- Required: `false`
- Position: `0`
- Format: `positional`
- Default: `/tmp/ghidra_projects`
- Description: Directory for storing Ghidra projects

### `project_name`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: `cyberstrike_analysis`
- Description: Ghidra project name

### `binary`
- Type: `string`
- Required: `true`
- Flag: `-import`
- Format: `flag`
- Description: Path to the binary file to analyze

### `script_file`
- Type: `string`
- Required: `false`
- Flag: `-postScript`
- Format: `flag`
- Description: Optional Ghidra script file (executed via -postScript)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional ghidra parameters. Used to pass ghidra options not defined in the parameter list.

## Invocation Template
```bash
analyzeHeadless <project_dir> <project_name> <binary> <script_file> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
