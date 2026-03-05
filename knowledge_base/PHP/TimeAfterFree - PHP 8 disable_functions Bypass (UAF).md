# TimeAfterFree - PHP 8 `disable_functions` Bypass (UAF)

Last reviewed: **March 5, 2026**

## Summary

`TimeAfterFree` is public research and PoC code describing a **PHP use-after-free (UAF)** technique in PHP 8 internals to bypass `disable_functions` restrictions and regain command execution primitives.

This is relevant for defenders because environments that rely on `disable_functions` as a primary boundary may still be exploitable when memory corruption primitives are present.

## What the Repository Demonstrates

- A UAF-oriented exploit chain targeting PHP 8 runtime behavior.
- Bypass of command execution restrictions typically enforced through `disable_functions`.
- A practical PoC script and C helper source (`exploit.php`, `exp.c`) to show end-to-end impact.

## Affected Scope (Per Repository Claims)

The repository states testing on:

- PHP `8.0.0` to `8.3.7`
- API versions `20200930`, `20210902`, `20220829`, `20230831`

Always verify against your exact distribution build and patch backports.


## Validation Checklist for Assessments

1. Confirm PHP exact version/build and patch status.
2. Enumerate configured `disable_functions` values.
3. Verify process isolation model (`php-fpm` pools, container boundaries).
4. Attempt to gain access to the whole system.

## References

- Repository: https://github.com/m0x41nos/TimeAfterFree
- PoC file: https://raw.githubusercontent.com/m0x41nos/TimeAfterFree/main/exploit.php
- Helper source: https://raw.githubusercontent.com/m0x41nos/TimeAfterFree/main/exp.c
