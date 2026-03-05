# bitrix-decrypt

## Overview
- Tool name: `bitrix-decrypt`
- Enabled in config: `true`
- Executable: `bitrix-decrypt`
- Default args: none
- Summary: Decrypt Bitrix LDAP/Mail plugin passwords from DB-encrypted values

## Detailed Description
Bitrix Decrypt is a helper utility based on the public `bitrix-decrypt` repository that decrypts Bitrix-stored plugin passwords for LDAP and Mail integrations.

**Key Features:**
- Supports decryptor modes `ldap` and `mail`
- Decrypts Bitrix password values from DB/API exports
- Accepts custom salt values
- Useful in authorized IR and security review workflows

**Important Notes:**
- Handles sensitive credentials; protect command history and output files.
- Use only in explicitly authorized environments.

## Parameters
### `mode`
- Type: `string`
- Required: `false`
- Flag: `--mode`
- Format: `flag`
- Default: `mail`
- Options: `ldap`, `mail`
- Description: Decryptor mode

### `pass`
- Type: `string`
- Required: `true`
- Flag: `--pass`
- Format: `flag`
- Description: Encrypted Bitrix password value

### `salt`
- Type: `string`
- Required: `false`
- Flag: `--salt`
- Format: `flag`
- Default: empty string
- Description: Salt from Bitrix `main.pwdhashadd` option

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional wrapper arguments

## Invocation Template
```bash
bitrix-decrypt --mode <mode> --pass <encrypted_value> --salt <salt> <additional_args>
```

## Practical Examples
```bash
# Mail mode (empty salt default)
bitrix-decrypt --mode mail --pass "oHXp4Mxs12qd1Q==" --salt ""

# LDAP mode (default salt often "ldap")
bitrix-decrypt --mode ldap --pass "RwYJ9nAzUN53LA==" --salt "ldap"
```

## Model Usage Guidance
- Never run against data outside authorized scope.
- Redact decrypted output from tickets/chat logs.
- Rotate exposed credentials immediately after validation.

## References
- https://github.com/jhonnybonny/bitrix-decrypt
