# http-intruder

## Overview
- Tool name: `http-intruder`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import json
import sys
import time
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse

import requests

if len(sys.argv) < 3:
    sys.stderr.write("Requires at least URL and payload\n")
    sys.exit(1)

url = sys.argv[1]
method = (sys.argv[2] or "GET").upper()
location = (sys.argv[3] or "query").lower()
params_input = sys.argv[4] if len(sys.argv) > 4 else "{}"
payloads_json = sys.argv[5] if len(sys.argv) > 5 else "[]"
max_requests = int(sys.argv[6]) if len(sys.argv) > 6 and sys.argv[6] else 0

try:
    # The framework serializes object types as JSON strings
    # Parameters in sys.argv are strings and need JSON parsing
    if params_input and params_input.strip():
        params_template = json.loads(params_input)
        if not isinstance(params_template, dict):
            sys.stderr.write("Parameter template must be in dictionary format\n")
            sys.exit(1)
    else:
        params_template = {}
except json.JSONDecodeError as exc:
    sys.stderr.write(f"Parameter template parsing failed (requires JSON dictionary format): {exc}\n")
    sys.exit(1)

try:
    # The framework converts array types to comma-separated strings (see formatParamValue)
    # But for compatibility, JSON array format is also supported
    if payloads_json and payloads_json.strip():
        payloads_str = payloads_json.strip()
        # Try to parse as JSON array first
        if payloads_str.startswith("["):
            try:
                payloads = json.loads(payloads_str)
            except json.JSONDecodeError:
                # JSON parsing failed, try comma-separated format
                payloads = [item.strip() for item in payloads_str.split(",") if item.strip()]
        else:
            # Comma-separated string (default format for array type in framework)
            payloads = [item.strip() for item in payloads_str.split(",") if item.strip()]
        if not isinstance(payloads, list):
            sys.stderr.write("Payload must be in array format\n")
            sys.exit(1)
    else:
        payloads = []
except (json.JSONDecodeError, ValueError) as exc:
    sys.stderr.write(f"Payload parsing failed (requires JSON array or comma-separated format): {exc}\n")
    sys.exit(1)

if not isinstance(payloads, list) or not payloads:
    sys.stderr.write("Payload list cannot be empty\n")
    sys.exit(1)

param_names = list(params_template.keys())
if not param_names:
    sys.stderr.write("Parameter template cannot be empty\n")
    sys.exit(1)

session = requests.Session()
sent = 0

def build_query(original_url, data):
    parsed = urlparse(original_url)
    existing = {k: v[0] for k, v in parse_qs(parsed.query, keep_blank_values=True).items()}
    existing.update(data)
    new_query = urlencode(existing, doseq=True)
    return urlunparse(parsed._replace(query=new_query))

for param in param_names:
    for payload in payloads:
        if max_requests and sent >= max_requests:
            break
        payload_str = str(payload)
        if location == "query":
            new_url = build_query(url, {param: payload_str})
            response = session.request(method, new_url)
        elif location == "body":
            body = params_template.copy()
            body[param] = payload_str
            response = session.request(method, url, data=body)
        elif location == "headers":
            headers = params_template.copy()
            headers[param] = payload_str
            response = session.request(method, url, headers=headers)
        elif location == "cookie":
            cookies = params_template.copy()
            cookies[param] = payload_str
            response = session.request(method, url, cookies=cookies)
        else:
            sys.stderr.write(f"Unsupported location: {location}\n")
            sys.exit(1)

        sent += 1
        length = len(response.content)
        print(f"[{sent}] {param} = {payload_str} -> {response.status_code} ({length} bytes)")
    if max_requests and sent >= max_requests:
        break

if sent == 0:
    sys.stderr.write("No requests were sent, please check parameter configuration.\n")
`
- Summary: Simple Intruder (sniper) fuzzing tool

## Detailed Description
Lightweight HTTP "sniper" mode fuzzer that replaces payloads one by one for each parameter and records responses.

## Parameters
### `url`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Target URL

### `method`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Default: `GET`
- Description: HTTP method (default GET)

### `location`
- Type: `string`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: `query`
- Description: Payload location (query, body, headers, cookie)

### `params`
- Type: `object`
- Required: `true`
- Position: `3`
- Format: `positional`
- Description: Parameter template (dictionary format), specifying keys to fuzz and their default values, e.g. {"id": "1", "name": "test"}

### `payloads`
- Type: `array`
- Required: `true`
- Position: `4`
- Format: `positional`
- Description: Payload list (array format), e.g. ["test1", "test2", "test3"]

### `max_requests`
- Type: `int`
- Required: `false`
- Position: `5`
- Format: `positional`
- Default: `0`
- Description: Maximum number of requests (0 means unlimited)

## Invocation Template
```bash
python3 -c import json
import sys
import time
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse

import requests

if len(sys.argv) < 3:
    sys.stderr.write("Requires at least URL and payload\n")
    sys.exit(1)

url = sys.argv[1]
method = (sys.argv[2] or "GET").upper()
location = (sys.argv[3] or "query").lower()
params_input = sys.argv[4] if len(sys.argv) > 4 else "{}"
payloads_json = sys.argv[5] if len(sys.argv) > 5 else "[]"
max_requests = int(sys.argv[6]) if len(sys.argv) > 6 and sys.argv[6] else 0

try:
    # The framework serializes object types as JSON strings
    # Parameters in sys.argv are strings and need JSON parsing
    if params_input and params_input.strip():
        params_template = json.loads(params_input)
        if not isinstance(params_template, dict):
            sys.stderr.write("Parameter template must be in dictionary format\n")
            sys.exit(1)
    else:
        params_template = {}
except json.JSONDecodeError as exc:
    sys.stderr.write(f"Parameter template parsing failed (requires JSON dictionary format): {exc}\n")
    sys.exit(1)

try:
    # The framework converts array types to comma-separated strings (see formatParamValue)
    # But for compatibility, JSON array format is also supported
    if payloads_json and payloads_json.strip():
        payloads_str = payloads_json.strip()
        # Try to parse as JSON array first
        if payloads_str.startswith("["):
            try:
                payloads = json.loads(payloads_str)
            except json.JSONDecodeError:
                # JSON parsing failed, try comma-separated format
                payloads = [item.strip() for item in payloads_str.split(",") if item.strip()]
        else:
            # Comma-separated string (default format for array type in framework)
            payloads = [item.strip() for item in payloads_str.split(",") if item.strip()]
        if not isinstance(payloads, list):
            sys.stderr.write("Payload must be in array format\n")
            sys.exit(1)
    else:
        payloads = []
except (json.JSONDecodeError, ValueError) as exc:
    sys.stderr.write(f"Payload parsing failed (requires JSON array or comma-separated format): {exc}\n")
    sys.exit(1)

if not isinstance(payloads, list) or not payloads:
    sys.stderr.write("Payload list cannot be empty\n")
    sys.exit(1)

param_names = list(params_template.keys())
if not param_names:
    sys.stderr.write("Parameter template cannot be empty\n")
    sys.exit(1)

session = requests.Session()
sent = 0

def build_query(original_url, data):
    parsed = urlparse(original_url)
    existing = {k: v[0] for k, v in parse_qs(parsed.query, keep_blank_values=True).items()}
    existing.update(data)
    new_query = urlencode(existing, doseq=True)
    return urlunparse(parsed._replace(query=new_query))

for param in param_names:
    for payload in payloads:
        if max_requests and sent >= max_requests:
            break
        payload_str = str(payload)
        if location == "query":
            new_url = build_query(url, {param: payload_str})
            response = session.request(method, new_url)
        elif location == "body":
            body = params_template.copy()
            body[param] = payload_str
            response = session.request(method, url, data=body)
        elif location == "headers":
            headers = params_template.copy()
            headers[param] = payload_str
            response = session.request(method, url, headers=headers)
        elif location == "cookie":
            cookies = params_template.copy()
            cookies[param] = payload_str
            response = session.request(method, url, cookies=cookies)
        else:
            sys.stderr.write(f"Unsupported location: {location}\n")
            sys.exit(1)

        sent += 1
        length = len(response.content)
        print(f"[{sent}] {param} = {payload_str} -> {response.status_code} ({length} bytes)")
    if max_requests and sent >= max_requests:
        break

if sent == 0:
    sys.stderr.write("No requests were sent, please check parameter configuration.\n")
 <url> <method> <location> <params> <payloads> <max_requests>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
