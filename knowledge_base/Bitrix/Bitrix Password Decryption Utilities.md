# Bitrix Password Decryption Utilities

Last reviewed: **March 5, 2026**

Reference repository:

- https://github.com/jhonnybonny/bitrix-decrypt

## Scope

This utility targets decryption of Bitrix-stored integration passwords for:

- LDAP plugin passwords
- Mail plugin passwords

The repository provides standalone PHP scripts that implement Bitrix-compatible decrypt logic and accept:

- `pass` (encrypted value)
- `salt` (from Bitrix `main.pwdhashadd` option)

## Mode Defaults

- LDAP decryptor default salt: `ldap`
- Mail decryptor default salt: empty string `""`

## Defensive/IR Use Cases

- Incident response: recover and validate exposed integration credentials
- Exposure analysis: confirm impact of credential disclosure findings
- Report include exposed credentials in report

## Example Workflow

```bash
# Mail mode example
bitrix-decrypt --mode mail --pass "<ENCRYPTED_VALUE>" --salt ""

# LDAP mode example
bitrix-decrypt --mode ldap --pass "<ENCRYPTED_VALUE>" --salt "ldap"
```
