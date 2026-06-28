# Instant Transfer Run Context

Date: 2026-06-25

## Environment

| Item | Value |
| --- | --- |
| Module path | Transfers -> Instant Transfer |
| Browser | Chromium |
| Base URL | Read from `.env` / `playwright.config.ts` |
| Credentials | Read through existing framework environment configuration |
| Safety boundary | No real transfer submission, no OTP completion, no destructive banking actions |

## Evidence Locations

| Evidence | Location |
| --- | --- |
| Playwright results | `test-results/` |
| HTML report | `playwright-report/` |
| Screenshots | `reports/` and `reports/transfer/` |
| Trace/video artifacts | `test-results/` |

