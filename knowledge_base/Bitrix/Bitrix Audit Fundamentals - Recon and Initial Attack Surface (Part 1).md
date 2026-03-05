# Bitrix Audit Fundamentals - Recon and Initial Attack Surface (Part 1)

Last reviewed: **March 5, 2026**

Original source (Ukrainian):
- https://hackyourmom.com/kibervijna/audyt-bitrix-fundament-rozvidka-ta-pochatkovi-tochky-ataky-chastyna-1/

English source page:
- https://hackyourmom.com/en/kibervijna/audyt-bitrix-fundament-rozvidka-ta-pochatkovi-tochky-ataky-chastyna-1/

## Purpose

This entry captures the core reconnaissance and initial attack-surface ideas from Part 1 of the HackYourMom Bitrix audit series, translated and normalized for CyberStrikeAI knowledge retrieval.

## Key Points (English Translation + Structured Notes)

## 1. Bitrix Product Model and Shared Codebase

- 1C-Bitrix editions (Start, Standard, Small Business, Business, Bitrix24, Online Store + CRM) are described as being built on a largely shared core codebase with feature/module differences.
- Practical implication for assessments: findings in one edition can often indicate similar risk patterns in others (subject to module presence, deployment specifics, and patch level).
- BitrixVM is highlighted as a prebuilt deployment environment that may change operational behavior, but not the overall testing logic.

## 2. Built-in WAF (Proactive Filter) Behavior

- Bitrix includes a built-in filtering layer intended to mitigate common classes such as XSS, LFI, and SQLi.
- The article notes recursive normalization/decoding behavior in filtering logic, which can both block obvious probes and create edge-case bypass opportunities.
- Assessment implication: include normalization/bypass-aware test cases and compare behavior across request locations (query/body/cookies/headers).

## 3. Multisite Architecture and Access Mapping

- Bitrix deployments may run multiple domains/subdomains with shared/symlinked platform paths.
- The article emphasizes that access control outcomes can differ across related host/path combinations.
- Assessment implication:
  - map every domain/subdomain/path variant;
  - do not assume one denied path means equivalent denial everywhere.

## 4. Version Fingerprinting via Indirect Signals

- The article states there is no single reliable external method for precise version/edition detection.
- It recommends indirect fingerprinting:
  - presence/absence of modules/components;
  - static asset paths;
  - behavior differences;
  - year-correlated admin/static endpoint artifacts.
- Assessment implication: build confidence by combining multiple weak signals rather than relying on one marker.

## 5. Alternative Authentication Endpoints

- The article highlights that restricting only `/bitrix/admin/` at web server level may be incomplete if additional scripts expose login handling or admin-related checks.
- Assessment implication:
  - enumerate authorization-related scripts and components;
  - validate effective controls across all discovered auth-capable endpoints.

## 6. Initial Attack Classes to Validate Early

Part 1 frames early-stage testing around:
- weak/alternate auth entry points;
- open redirect behavior in legacy/utility routes;
- reflected/stored XSS opportunities in component/settings flows;
- SSRF/LFI candidate endpoints discovered during recon.

Assessment implication: these should be part of baseline recon-to-validation flow before deeper exploit work.

## Practical Audit Checklist (Defensive Use)

1. Identify edition/deployment model and module footprint.
2. Enumerate all domains/subdomains/path variants in multisite setups.
3. Fingerprint version using combined static + behavioral heuristics.
4. Enumerate and test all auth-related endpoints, not only `/bitrix/admin/`.
5. Run controlled validation for redirect/XSS/SSRF/LFI indicators.
6. Record exact affected endpoint, required privileges, and patch status.

## Notes

- This article is Part 1 (recon/foundation). Part 2 in the same series is focused on deeper exploitation scenarios.
