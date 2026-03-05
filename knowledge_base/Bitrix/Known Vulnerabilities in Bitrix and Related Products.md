# Known Vulnerabilities in Bitrix and Related Products

Last reviewed: **March 5, 2026**

This is a curated vulnerability tracker.
Always confirm affected versions and patch status in your own environment.

## Prioritization Guidance

- Prioritize vulnerabilities involving credential disclosure, authentication bypass, and admin-level impact.
- For Bitrix deployments, treat integration settings (SMTP, AD/LDAP, webhooks) as high-value targets.
- After patching, rotate credentials/tokens potentially exposed before remediation.

## Curated CVE Matrix

| CVE | Product / Area | Vulnerability Type | Affected Version Info (as published) | Source |
|---|---|---|---|---|
| CVE-2024-34882 | Bitrix24, SMTP settings | Credential transmission to attacker-controlled server (admin context) | Bitrix24 23.300.100 | https://nvd.nist.gov/vuln/detail/CVE-2024-34882 |
| CVE-2024-34885 | Bitrix24, SMTP settings | Sensitive information exposure (SMTP credentials retrievable) | Bitrix24 23.300.100 | https://nvd.nist.gov/vuln/detail/CVE-2024-34885 |
| CVE-2024-34887 | Bitrix24, AD/LDAP settings | Credential transmission to attacker-controlled server (admin context) | Bitrix24 23.300.100 | https://nvd.nist.gov/vuln/detail/CVE-2024-34887 |
| CVE-2024-34891 | Bitrix24, AD/LDAP settings | Sensitive information exposure (bind password retrieval) | Bitrix24 23.300.100 | https://nvd.nist.gov/vuln/detail/CVE-2024-34891 |
| CVE-2023-1713 | Bitrix24 | Open redirect | Bitrix24 before 22.0.300 | https://nvd.nist.gov/vuln/detail/CVE-2023-1713 |
| CVE-2023-1714 | Bitrix24 | Reflected XSS | Bitrix24 before 22.0.300 | https://nvd.nist.gov/vuln/detail/CVE-2023-1714 |
| CVE-2023-1715 | Bitrix24 | Reflected XSS | Bitrix24 before 22.0.300 | https://nvd.nist.gov/vuln/detail/CVE-2023-1715 |
| CVE-2023-1716 | Bitrix24 | Reflected XSS | Bitrix24 before 22.0.300 | https://nvd.nist.gov/vuln/detail/CVE-2023-1716 |
| CVE-2023-1717 | Bitrix24 | Reflected XSS | Bitrix24 before 22.0.300 | https://nvd.nist.gov/vuln/detail/CVE-2023-1717 |
| CVE-2022-27228 | 1C-Bitrix Site Manager (vote module) | Improper neutralization of special elements used in command (RCE class) | Up to 21.400.100 | https://nvd.nist.gov/vuln/detail/CVE-2022-27228 |
| CVE-2022-43959 | Bitrix24 | Stored XSS | Through 22.200.0 | https://nvd.nist.gov/vuln/detail/CVE-2022-43959 |
| CVE-2020-13483 | Bitrix24 (WAF module) | XSS | 19.0.0 | https://nvd.nist.gov/vuln/detail/CVE-2020-13483 |
| CVE-2020-13484 | Bitrix24 | SSRF | 19.0.0 | https://nvd.nist.gov/vuln/detail/CVE-2020-13484 |

## Validation Checklist Per CVE

For each potentially matching CVE:

1. Confirm product edition and exact version/build.
2. Confirm vulnerable module/component is present and enabled.
3. Reproduce checks.
4. Record required privileges and reachable attack path.
5. Use collected data and gain the access.

## Notes for Knowledge Maintenance

- Maintain this list as a curated baseline, not a complete feed.
- During each assessment, re-check NVD and vendor advisories for newly published CVEs.
