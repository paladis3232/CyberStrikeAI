# api-fuzzer

## Overview
- Tool name: `api-fuzzer`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import pathlib
import sys
import textwrap
from urllib.parse import urljoin

import requests

if len(sys.argv) < 2:
    sys.stderr.write("Missing base_url parameter\n")
    sys.exit(1)

base_url = sys.argv[1]
endpoints_arg = sys.argv[2] if len(sys.argv) > 2 else ""
methods_arg = sys.argv[3] if len(sys.argv) > 3 else "GET,POST"
wordlist_path = sys.argv[4] if len(sys.argv) > 4 else ""
timeout = float(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else 10.0

methods = [m.strip().upper() for m in methods_arg.split(",") if m.strip()]
if not methods:
    methods = ["GET"]

endpoints = []
if endpoints_arg:
    endpoints = [ep.strip() for ep in endpoints_arg.split(",") if ep.strip()]
elif wordlist_path:
    path = pathlib.Path(wordlist_path)
    if not path.is_file():
        sys.stderr.write(f"Wordlist file does not exist: {path}\n")
        sys.exit(1)
    endpoints = [line.strip() for line in path.read_text().splitlines() if line.strip()]

if not endpoints:
    sys.stderr.write("No endpoint list or wordlist provided.\n")
    sys.exit(1)

results = []
for endpoint in endpoints:
    url = urljoin(base_url.rstrip("/") + "/", endpoint.lstrip("/"))
    for method in methods:
        try:
            resp = requests.request(method, url, timeout=timeout, allow_redirects=False)
            results.append({
                "method": method,
                "endpoint": endpoint,
                "status": resp.status_code,
                "length": len(resp.content),
                "redirect": resp.headers.get("Location", "")
            })
        except requests.RequestException as exc:
            results.append({
                "method": method,
                "endpoint": endpoint,
                "error": str(exc)
            })

for item in results:
    if "error" in item:
        print(f"[{item['method']}] {item['endpoint']} -> ERROR: {item['error']}")
    else:
        redirect = f" -> {item['redirect']}" if item.get("redirect") else ""
        print(f"[{item['method']}] {item['endpoint']} -> {item['status']} ({item['length']} bytes){redirect}")
`
- Summary: API endpoint fuzzing tool with intelligent parameter discovery support

## Detailed Description
A lightweight requests-based API endpoint probing script that probes multiple HTTP methods against provided endpoint lists or wordlists, recording status codes and response lengths.

## Parameters
### `base_url`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: API base URL, e.g. https://api.example.com/

### `endpoints`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: ``
- Description: Comma-separated endpoint list (e.g. /v1/users,/v1/auth/login)

### `methods`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: `GET,POST`
- Description: HTTP methods list, comma-separated (default: GET,POST)

### `wordlist`
- Type: `string`
- Required: `false`
- Position: `3`
- Format: `positional`
- Default: `/usr/share/wordlists/api/api-endpoints.txt`
- Description: Endpoint wordlist file path (used when endpoints not provided)

### `timeout`
- Type: `string`
- Required: `false`
- Position: `4`
- Format: `positional`
- Default: `10`
- Description: Timeout per request in seconds (default: 10)

## Invocation Template
```bash
python3 -c import pathlib
import sys
import textwrap
from urllib.parse import urljoin

import requests

if len(sys.argv) < 2:
    sys.stderr.write("Missing base_url parameter\n")
    sys.exit(1)

base_url = sys.argv[1]
endpoints_arg = sys.argv[2] if len(sys.argv) > 2 else ""
methods_arg = sys.argv[3] if len(sys.argv) > 3 else "GET,POST"
wordlist_path = sys.argv[4] if len(sys.argv) > 4 else ""
timeout = float(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else 10.0

methods = [m.strip().upper() for m in methods_arg.split(",") if m.strip()]
if not methods:
    methods = ["GET"]

endpoints = []
if endpoints_arg:
    endpoints = [ep.strip() for ep in endpoints_arg.split(",") if ep.strip()]
elif wordlist_path:
    path = pathlib.Path(wordlist_path)
    if not path.is_file():
        sys.stderr.write(f"Wordlist file does not exist: {path}\n")
        sys.exit(1)
    endpoints = [line.strip() for line in path.read_text().splitlines() if line.strip()]

if not endpoints:
    sys.stderr.write("No endpoint list or wordlist provided.\n")
    sys.exit(1)

results = []
for endpoint in endpoints:
    url = urljoin(base_url.rstrip("/") + "/", endpoint.lstrip("/"))
    for method in methods:
        try:
            resp = requests.request(method, url, timeout=timeout, allow_redirects=False)
            results.append({
                "method": method,
                "endpoint": endpoint,
                "status": resp.status_code,
                "length": len(resp.content),
                "redirect": resp.headers.get("Location", "")
            })
        except requests.RequestException as exc:
            results.append({
                "method": method,
                "endpoint": endpoint,
                "error": str(exc)
            })

for item in results:
    if "error" in item:
        print(f"[{item['method']}] {item['endpoint']} -> ERROR: {item['error']}")
    else:
        redirect = f" -> {item['redirect']}" if item.get("redirect") else ""
        print(f"[{item['method']}] {item['endpoint']} -> {item['status']} ({item['length']} bytes){redirect}")
 <base_url> <endpoints> <methods> <wordlist> <timeout>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
