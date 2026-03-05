# Bitrix Module and Installation Vulnerabilities

Last reviewed: **March 5, 2026**

Use this knowledge only for authorized security testing.

## Installation / Setup Phase

### `restore.php` - Unauthenticated Shell Upload

Confirmed on Bitrix release `7.5.0`: the `restore.php` installation script accepts file uploads without authentication.

Attack flow observed:

1. Navigate to `/restore.php?lang=en`
2. Click `Continue`
3. Select `Upload from local disk`
4. Upload `shell.php`
5. Skip errors
6. Shell lands at `/shell.php`

This is a classic installer residue issue: setup scripts are left reachable after installation.

Other dangerous leftover install paths:

- `/bitrix/install/index.php`
- `/bitrix/wizard/`
- `/restore.php`
- `/bitrix/updates/`
- `/bitrix/setup/`

### Unauthenticated Update Delivery - DNS Poisoning

Bitrix Site Manager `4.1.x` update functionality does not verify authenticity of downloaded updates. Remote attackers can abuse DNS cache poisoning to redirect update downloads to malicious hosts and reach arbitrary PHP code execution.

### Update Log Exposure

Bitrix Site Manager `4.1.x` stores `updater.log` under web root with weak access controls, exposing sensitive update and installation information.

## Core Modules

### `main` Module - CVE-2023-1719 (Critical, CVSS 9.8) - Global Variable Extraction

`FormDecode` in `bitrix/modules/main/tools.php` (invoked by `bitrix/modules/main/start.php`) can extract request variables into `$GLOBALS` without safe initialization. Unauthenticated attackers can overwrite uninitialized variables, enumerate attachment IDs, and inject JavaScript into victim browsers. If an admin is targeted, this can chain to PHP RCE.

Detection evasion note:

- Payload can be split across query string, cookie, and POST body, aiding WAF bypass.

XSS filter bypass note:

- `bitrix/modules/security/lib/filter/auditor/xss.php` uses regex-based event-handler neutralization.
- Edge cases around whitespace and HTML parsing can bypass this logic.

### `main` Module - CVE-2023-1714 - Unsafe Variable Extraction to RCE

`init` in `bitrix/modules/main/lib/controller/export.php` trusts data from `CUserOptions::GetOption`. Attackers can control `filePath` and append near-arbitrary content to PHP files, resulting in RCE.

Endpoint:

- `POST /bitrix/services/main/ajax.php?action=bitrix:crm.api.export.export`

Detection:

- Look for recently modified PHP files.
- Review logs for `BITRIX_SM_LAST_SETTINGS` cookie values containing `filePath`.

### `main` Module - CVE-2023-1714 (PHAR Deserialization Variant)

`bitrix/components/bitrix/crm.contact.list/stexport.ajax.php` calls `file_exists()` on attacker-controlled data from `CUserOptions::GetOption`. On PHP `< 8`, `phar://` can trigger deserialization and PHP Object Injection.

### `vote` Module - CVE-2022-27228 (Critical, Unauthenticated RCE)

Input validation flaws in Polls/Votes allow unauthenticated remote code execution. Fixed in vote module version `21.0.100`.

Publicly documented exploitation vectors include:

- Direct RCE via file upload
- PHAR deserialization (Nginx/Apache)
- `.htaccess` injection (Apache only)

### `crm` Module - CVE-2023-1713 - Insecure Temp File Creation to RCE (Apache)

`importAjax` in `bitrix/components/bitrix/crm.order.import.instagram.view/class.php` downloads attacker-controlled files into `/upload/tmp/xxx/` using attacker-controlled names. Uploading a malicious `.htaccess` can make Apache execute files in that path as PHP.

Notes:

- Exploitable by low-privilege users
- Temp path uses `xxx` (3 alphanumeric chars) -> `46,656` brute-force candidates

Endpoint:

- `POST /bitrix/services/main/ajax.php?mode=class&c=bitrix:crm.order.import.instagram.view&action=importAjax`

Detection:

- Monitor for requests to `/upload/tmp/xxx/.htaccess`

### `advertising` Module - Stored XSS and File Path Traversal

`makeFileArrayFromArray()` in `/bitrix/modules/advertising/classes/general/advertising.php` does not sanitize upload filenames. Authenticated users with "Advertising and banners" access can use `../` traversal in filenames and overwrite files outside expected directories.

Stored XSS also reported in:

- `/bitrix/admin/adv_contract_edit.php`
- `/bitrix/admin/adv_banner_edit.php`

Parameters:

- `NOT_SHOW_PAGE`
- `SHOW_PAGE`

### `security` Module - WAF Bypass

In `modules/security/classes/general.post_filter.php` through Bitrix24 `20.0.950`, WAF checks can be bypassed by injecting a non-breaking space (`&nbsp;` / `\xc2\xa0`) before XSS payloads.

### `mpbuilder` Module - Directory Traversal / Local File Include

Before `1.0.12`, `bitrix.mpbuilder` allows remote administrators to include local files via `../` in `work[]` element names sent to `admin/bitrix.mpbuilder_step2.php`.

### `xscan` Module - Directory Traversal / File Rename

Before `1.0.4`, `bitrix.xscan` allows authenticated users to rename arbitrary files via `../` in `file` parameter sent to `admin/bitrix.xscan_worker.php`.

### `sale` (e-Store) Module - Session Brute Force

Before `14.0.1`, sequential integer values in `BITRIX_SM_SALE_UID` make session brute forcing and hijacking significantly easier.

## Credential Exposure in Integration Modules (Bitrix24 `23.300.100`)

Multiple CVEs in integration settings can expose secrets:

- SMTP account credentials retrievable
- AD/LDAP admin credentials exfiltrable
- DAV/Exchange/proxy credentials exposed

Root cause pattern: weak protection of stored credentials.

### CVE-2022-43959 - AD/LDAP Password in HTML Source

In `/bitrix/admin/ldap_server_edit.php`, masked password fields may still contain plaintext credentials in HTML source.

## `main/tools.php` - MIME Type Bypass to JS/PHP Execution

Missing strict MIME response handling in Bitrix24 `22.0.300` allows crafted HTML upload via:

- `/desktop_app/file.ajax.php?action=uploadfile`

Browsers may execute attacker-supplied JavaScript. If admin context is involved, this can chain to PHP execution.

## Prototype Pollution

`bitrix/templates/bitrix24/components/bitrix/menu/left_vertical/script.js` contains a prototype pollution issue that can poison `__proto__[tag]` / `__proto__[text]`, trigger browser JavaScript execution, and potentially chain to server-side compromise through admin actions.

## Practical Scanning Approach

```bash
# Nuclei - full Bitrix template suite
nuclei -u https://target -t cves/ -tags bitrix

# Nuclei - Bitrix community template pack (if installed)
nuclei -u https://target -t /opt/cyberstrike-tools/bitrix-nuclei-templates

# Check exposed installer remnants
for path in restore.php bitrix/install/index.php bitrix/wizard/ bitrix/setup/; do
  curl -so /dev/null -w "%{http_code} $path\n" https://target/$path
done

# Check vote module version (look for <21.0.100)
curl https://target/bitrix/modules/vote/install/index.php

# check_bitrix toolkit (covers CVE-2022-27228 + 2023 chain)
python3 test_bitrix.py -t https://target scan
```

## Priority Exploitation Chain for Assessments

| Step | Vector | Auth Required |
|---|---|---|
| 1 | `restore.php` shell upload (if installer left) | None |
| 2 | CVE-2022-27228 vote module RCE | None |
| 3 | CVE-2023-1719 variable extraction + admin XSS | None |
| 4 | CVE-2023-1713 `.htaccess` upload via CRM Instagram import | Low (any user) |
| 5 | CVE-2023-1714 file append / PHAR deserialization | Low (any user) |
| 6 | LDAP/SMTP/DAV credential harvest from settings pages | Admin |

High-risk observed chain on unpatched `22.x` installs:

- CVE-2023-1719 (unauthenticated XSS to admin session) + CVE-2023-1714 (authenticated file append to RCE)
