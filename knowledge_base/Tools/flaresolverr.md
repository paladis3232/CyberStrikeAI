# flaresolverr

## Overview
- Tool name: `flaresolverr`
- Enabled in config: `true`
- Executable: `flaresolverr-client`
- Summary: Cloudflare challenge-aware HTTP fetching via FlareSolverr API service

## Detailed Description
FlareSolverr is a browser-automation API service commonly used in authorized security testing when normal HTTP clients are blocked by anti-bot challenge pages.
FlareSolverr is also can be used in order to obtain cloudflare clearance cookies in order to reuse with other tools.

In CyberStrikeAI, `flaresolverr` is exposed as an API client wrapper that talks to:
- `http://127.0.0.1:8191/v1` (default)

Typical use is to fetch challenge-protected pages, preserve cookies/session state, and then continue testing with standard tools.

## Dependencies
- Docker (recommended runtime)
- Running FlareSolverr service container (`ghcr.io/flaresolverr/flaresolverr`)
- `flaresolverr-client` wrapper installed in `PATH`

## Parameters
### `cmd`
- Type: `string`
- Required: `false`
- Default: `request.get`
- Flag: `--cmd`
- Options: `request.get`, `request.post`, `sessions.create`, `sessions.destroy`

### `url`
- Type: `string`
- Required: `false` (required by `request.get` / `request.post`)
- Flag: `--url`

### `session_id`
- Type: `string`
- Required: `false`
- Flag: `--session-id`

### `max_timeout`
- Type: `integer`
- Required: `false`
- Default: `60000`
- Flag: `--max-timeout`

### `post_data`
- Type: `string`
- Required: `false`
- Flag: `--post-data`

### `proxy_url`
- Type: `string`
- Required: `false`
- Flag: `--proxy-url`

### `user_agent`
- Type: `string`
- Required: `false`
- Flag: `--user-agent`

### `headers_json`
- Type: `string`
- Required: `false`
- Flag: `--headers-json`

### `cookies_json`
- Type: `string`
- Required: `false`
- Flag: `--cookies-json`

### `download`
- Type: `bool`
- Required: `false`
- Default: `false`
- Flag: `--download`

### `endpoint`
- Type: `string`
- Required: `false`
- Default: `http://127.0.0.1:8191/v1`
- Flag: `--endpoint`

## Practical Examples
```bash
# Basic fetch behind challenge
flaresolverr --cmd request.get --url https://target.example/protected

# Create session, then use it for sticky requests
flaresolverr --cmd sessions.create
flaresolverr --cmd request.get --url https://target.example --session-id <session_id>

# POST request through solved browser context
flaresolverr --cmd request.post \
  --url https://target.example/login \
  --post-data "username=test&password=test"
```

## Model Usage Guidance
- Use FlareSolverr for access/bootstrap, then hand off discovered endpoints to scanners (`nuclei`, `ffuf`, etc.).

## References
- https://github.com/FlareSolverr/FlareSolverr
