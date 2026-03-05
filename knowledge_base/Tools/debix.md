# debix

## Overview
- Tool name: `debix`
- Enabled in config: `true`
- Executable: `debix`
- Default args: none
- Summary: Bitrix-focused PHP deobfuscation tool with backup and pattern-based cleanup

## Detailed Description
DeBix is a Bitrix-focused PHP deobfuscation tool that scans project directories for obfuscated files and rewrites them in place to improve readability.

**Key Features:**
- Recursive discovery of suspicious PHP files
- In-place deobfuscation with optional multi-pass processing
- Automatic ZIP backup before rewrite
- Variable/function mapping extraction and reuse
- Optional pattern learning from project codebase

**Use Cases:**
- Bitrix incident response and malware triage
- Cleanup of heavily obfuscated PHP implants
- Reverse engineering of suspicious project files
- Recovery of readable code from backdoored modules

**Important Safety Notes:**
- DeBix modifies files in place.
- Upstream project warns that it may execute `eval()` on some code blocks during parsing.
- Run only in authorized, isolated environments and keep backups.

## Parameters
### `project_path`
- Type: `string`
- Required: `true`
- Format: `positional`
- Description: Path to the target project directory containing Bitrix/PHP source files to deobfuscate.

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional DeBix arguments appended after the project path. Use only if your local wrapper/script supports extra runtime flags.

## Invocation Template
```bash
debix <project_path> <additional_args>
```

## Practical Examples
```bash
# Deobfuscate a local Bitrix codebase
debix /var/www/html

# Analyze a copied sample in a sandbox path
debix /opt/sandbox/bitrix-sample
```

## Model Usage Guidance
- Use only in explicitly authorized environments.
- Prefer working on a cloned copy of the target codebase.
- Verify backup ZIP creation before applying further changes.
- Treat output as analyst-assistance; manually review high-risk reconstructed code blocks.

## References
- Repo: https://github.com/FaLLenSkiLL1/DeBix
