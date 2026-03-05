# zoomeye_search

## Overview
- Tool name: `zoomeye_search`
- Enabled in config: `true`
- Executable: `python3`
- API endpoint: `https://api.zoomeye.ai/v2/search`
- Auth header: `API-KEY: <zoomeye_api_key>`
- Request method: `POST`

## Official Request Shape (Important)

Use JSON body with at least:
- `qbase64` (base64 of query string)
- `page` (integer, starts from 1)

Canonical form:

```bash
curl -X POST 'https://api.zoomeye.ai/v2/search' \
  -H "API-KEY: $YOUR_API_KEY" \
  -H 'content-type: application/json' \
  -d '{
    "qbase64": "",
    "page": 1
  }'
```

## How CyberStrikeAI Should Use It

1. Build plain query string (example: `app="Apache"`).
2. Base64-encode it into `qbase64`.
3. Send POST to `https://api.zoomeye.ai/v2/search`.
4. Start with minimal payload: `qbase64` + `page`.
5. Add optional fields (`pagesize`, `fields`, `sub_type`, etc.) only when needed.

## Query Notes

- Query forms like `app="Apache"` and `app:"Apache"` are accepted.
- Prefer simple expressions first; then compose with operators.
- Common operators: `&&`, `||`, `!=`, parentheses.

## Error Handling Guidance

- `400 Bad Request`: usually payload/query formatting issue.
  - Retry with minimal body (`qbase64`, `page`) first.
  - Re-check base64 encoding and query syntax.
- Auth errors: verify `API-KEY` value and account status.
- Non-200 with JSON body: capture and surface API message directly.

## Practical Examples

```bash
# app query
query='app="Apache"'
qbase64=$(printf '%s' "$query" | base64 -w0)
curl -X POST 'https://api.zoomeye.ai/v2/search' \
  -H "API-KEY: $ZOOMEYE_API_KEY" \
  -H 'content-type: application/json' \
  -d "{\"qbase64\":\"$qbase64\",\"page\":1}"
```

```bash
# title query
query='title="login"'
qbase64=$(printf '%s' "$query" | base64 -w0)
curl -X POST 'https://api.zoomeye.ai/v2/search' \
  -H "API-KEY: $ZOOMEYE_API_KEY" \
  -H 'content-type: application/json' \
  -d "{\"qbase64\":\"$qbase64\",\"page\":1}"
```

## References

- ZoomEye docs: https://www.zoomeye.ai/doc
