# Bitrix Nuclei Templates Pack

Last reviewed: **March 5, 2026**

Template source:

- https://github.com/jhonnybonny/bitrix-nuclei-templates

Installed path (CyberStrike installer):

- `/opt/cyberstrike-tools/bitrix-nuclei-templates`

## Recommended Usage

```bash
# Direct run
nuclei -t /opt/cyberstrike-tools/bitrix-nuclei-templates -u https://target

# Via CyberStrike tool profile
nuclei-bitrix -u https://target
```

## Template Coverage Summary

The pack focuses on:

- Bitrix installer/admin exposure checks
- Common LFI/RCE/path-disclosure findings
- Content spoofing and XSS checks in older Bitrix24 ranges
- Selected CVE templates relevant to Bitrix deployments

## Template List and Descriptions

| Template File | Template ID | Purpose |
|---|---|---|
| `bitrix-panel.yaml` | `bitrix-login-panel` | Detect exposed Bitrix login panel |
| `bitrix24-installer.yaml` | `bitrix24-installer` | Detect exposed Bitrix24 installer page |
| `Bitrixsetup0DAY.yaml` | `bitrix-bitrixsetup-panel` | Detect exposed `bitrixsetup` panel |
| `bitrixrestorerce.yaml` | `bitrix_restore_rce` | Detect potentially dangerous restore endpoint exposure |
| `Bitrix_server_testcheck.yaml` | `Bitrix_server_test_check` | Detect exposed Bitrix server test files |
| `Bitrix_Full_Path_Disclosure.yaml` | `bitrix_full_path_disclosure` | Check for full-path disclosure behavior |
| `Bitrix_LFI.yaml` | `bitrix_LFI` | Test for local file inclusion indicators |
| `Bitrix_aspro_rce.yaml` | `Bitrix_aspro_rce` | Check Aspro-related RCE exposure patterns |
| `bitrix-landing-rce.yaml` | `bitrix-landing-rce` | Landing module RCE version-based detection |
| `bitrix_excel_RCE.yaml` | `bitrix-esol-excel-rce` | Search for potentially vulnerable Esol Excel module points |
| `Bitrix_Account_UIDH.yaml` | `Bitrix-Account-Enumeration_UIDH_login_admin` | Detect account enumeration signal (UIDH/login flow) |
| `bitrix-open-redirect.yaml` | `bitrix-open-redirect` | Detect open redirect behavior |
| `bitrix_sessid_phpssid.yaml` | `bitrix_sessid_and_phpssid` | Check session token/cookie handling exposures |
| `bitrix_content_spoofing_ajax.yaml` | `bitrix_content_spoofing_ajax` | Detect content spoofing path in `mobileapp.list/ajax.php` |
| `bitrix_content_spoofing_imagepg.yaml` | `bitrix_content_spoofing_imagepg` | Detect content spoofing path in `bitrix/tools/imagepg.php` |
| `bitrix_recalc_xss_galleries.yaml` | `bitrix_recalc_xss_galleries` | Detect XSS vector in `galleries_recalc.php` endpoint |
| `CVE-2020-13483.yaml` | `CVE-2020-13483` | Bitrix24 WAF bypass XSS check |
| `CVE-2023-1719.yaml` | `CVE-2023-1719` | Bitrix component XSS check |
| `CVE-2024-4577.yaml` | `CVE-2024-4577` | PHP CGI argument injection check (environment-level risk relevant to PHP stacks) |
| `Bitrix_check_env.yaml` | `Bitrix_check_env_file` | Detect exposed `.env` file |
| `bitrix_bak_check.yaml` | `bitrix_bak_check` | Detect exposed backup/config-like files (`.env` style check) |
| `Bitrix_laravel_log.yaml` | `Bitrix_check_log_laravel_file` | Detect exposed Laravel log files on mixed stacks |

## Analyst Notes

- Treat detections as triage signals; manually validate impact before reporting.
- Some templates are generic PHP/environment checks included for practical Bitrix hosting scenarios.
- Prioritize confirmed findings on internet-exposed systems and admin paths first.
