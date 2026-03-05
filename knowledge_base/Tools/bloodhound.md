# bloodhound

## Overview
- Tool name: `bloodhound`
- Enabled in config: `true`
- Executable: `bloodhound-python`
- Default args: none
- Summary: Active Directory attack path analysis and visualization tool

## Detailed Description
BloodHound is an Active Directory attack path analysis and visualization tool that collects domain information and analyzes attack paths.

**Key Features:**
- Domain information collection
- Attack path analysis
- Permission relationship visualization
- Shortest attack path calculation
- High-risk path identification

**Use Cases:**
- Active Directory security assessment
- Post-exploitation
- Domain environment auditing
- Red team exercises

**Notes:**
- Requires domain user credentials
- Requires Neo4j database support
- Collection process may take a long time
- Recommended to use in authorized environments

## Parameters
### `domain`
- Type: `string`
- Required: `false`
- Flag: `-d`
- Format: `flag`
- Description: Target domain name

### `username`
- Type: `string`
- Required: `false`
- Flag: `-u`
- Format: `flag`
- Description: Domain username

### `password`
- Type: `string`
- Required: `false`
- Flag: `-p`
- Format: `flag`
- Description: Domain user password

### `collection_method`
- Type: `string`
- Required: `false`
- Flag: `-c`
- Format: `flag`
- Default: `All`
- Description: Collection mode (All, ACL, DCOM, LocalAdmin, RDP, etc.)

### `dc`
- Type: `string`
- Required: `false`
- Flag: `-dc`
- Format: `flag`
- Description: Domain controller IP address

### `additional_args`
- Type: `string`
- Required: `false`
- Format: `positional`
- Description: Additional bloodhound parameters. Used to pass bloodhound options not defined in the parameter list.

## Invocation Template
```bash
bloodhound-python <domain> <username> <password> <collection_method> <dc> <additional_args>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
