# cyberchef

## Overview
- Tool name: `cyberchef`
- Enabled in config: `true`
- Executable: `cyberchef`
- Default args: none
- Summary: Data transformation and analysis tool supporting encoding, encryption, and various data processing operations

## Detailed Description
CyberChef is a powerful data transformation and analysis tool supporting hundreds of data operations.

**Key Features:**
- Encoding/decoding (Base64, Hex, URL, etc.)
- Encryption/decryption (AES, DES, RSA, etc.)
- Hash computation
- Data format conversion
- Regular expression operations
- Data extraction and analysis

**Use Cases:**
- CTF competitions
- Data analysis and transformation
- Encryption algorithm research
- Digital forensics

**Notes:**
- Usually runs as a web interface
- Command line version may require Node.js
- Powerful but complex operations

## Parameters
### `recipe`
- Type: `string`
- Required: `true`
- Flag: `-Recipe`
- Format: `flag`
- Description: Operation recipe (JSON format), defining the sequence of operations to execute

### `input`
- Type: `string`
- Required: `true`
- Flag: `-Input`
- Format: `flag`
- Description: Input data (string or file path)

### `output`
- Type: `string`
- Required: `false`
- Flag: `-Output`
- Format: `flag`
- Description: Output file path (optional)

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional cyberchef parameters. Used to pass cyberchef options not defined in the parameter list.

## Invocation Template
```bash
cyberchef <recipe> <input> <output> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
