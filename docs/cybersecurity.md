# Cybersecurity baseline

Project type: **Standalone Vue PWA with PHP API**. Default branch: `v2`.

Added scans: zizmor, Trivy (weekly/manual on private repos). Existing checks are retained.
One Linux job shares setup across tools; timeout is 15 minutes and superseded runs
are cancelled. Private repos run fast source/secret/workflow checks on PRs, with
Trivy and WordPress PHPCS on weekly/manual runs. There is no duplicate private
push run. Public repositories also scan default-branch pushes and run heavy checks
on PRs. These conditions use the verified visibility at rollout; review them if
visibility changes. A weekly scan can detect dependency issues after a PR merges:
manually run the full baseline on a release candidate before shipping.

Budget planning: target 500 minutes/month for new private security checks, leaving
headroom for existing CI within the account's 2,000-minute Free allowance. This is
an estimate, not an enforced cap: measure actual durations and count all existing
workflows, dependabot PRs and retries. Example: 20 PR runs/week at 4 minutes plus
8 weekly scans at 5 minutes is about 516 minutes/month (4.3 weeks).
New Dependabot schedules are monthly with at most two open PRs per ecosystem.
Security updates remain urgent; do not defer an exploited vulnerability to that schedule.

All new scan findings fail the job. Installation, parsing or database errors are
incomplete coverage, never a clean result. Legacy findings need review; do not add
broad exclusions merely to make CI green. Review narrow exceptions with an owner,
reason and expiry. Existing advisory workflows remain explicitly advisory.

Source paths are in `.github/security/profile.json`. Generated/minified code and
vendor/node_modules are excluded from custom-code SAST; Trivy scans supported
lockfiles separately. Semgrep's engine is pinned; upstream registry packs may
evolve independently. A green scan does not establish that the application is safe.

Existing Gitleaks is preserved where present. New TruffleHog scans use PR commit
ranges or all fetched history otherwise, without credential verification. Output
contains only detector/file/line, never secret values. Deleted/unfetched refs are
not covered. Rotate a real leak before removing it from history.

Psalm taint analysis is a subsequent tuned phase: framework hooks/stubs, sources,
sinks and test cases must be modeled first. Existing PHPStan/Larastan is retained.
CodeQL does not scan PHP. ZAP/WPScan require an isolated staging target and WPScan
vulnerability API access; no production-targeted scan or deployment is added.

CLI failures work on private GitHub Free without paid SARIF features. Protected
branches on private repositories are unavailable on that plan. This change does
not alter release triggers; maintainers must verify the exact release commit.
Never ship `.github/security` or its tooling in application packages.

Public conversion is a separate decision. Review full history, release assets,
credentials, personal data, licensing and fork restrictions before changing
visibility. No visibility changes are part of this rollout.

## Security gate

`.github/workflows/security-gate.yml` is the only workflow that triggers security
scans (PRs and pushes to `v2`, weekly on Tuesday, and manually). It calls the
reusable `cybersecurity.yml` (zizmor, Trivy, actionlint), `security.yml`
(config.php guard, token patterns, Gitleaks, Semgrep) and `codeql.yml`
(JavaScript/TypeScript), and adds `npm audit` (shipped dependencies at moderate,
all at high) and, on PRs, dependency review (moderate). Its final job,
**All security checks passed**, fails unless every one of those succeeded;
a cancelled or unexpectedly skipped check counts as a failure.

Branch protection on `v2` should require **All security checks passed** and the
code-scanning **CodeQL** check (which fails on new CodeQL alerts; the Actions
job only runs the analysis). The CI checks in `ci.yml` remain separately
required. To check a release candidate, run the gate manually on that commit.

The admin panel's GitHub updater enforces the same gate at deploy time. It
resolves the chosen commit or release to a full SHA and refuses it unless the
commit is on the configured branch (GitHub serves fork-only commits through this
repository's URLs, so a bare SHA is not proof of origin) and a successful
**All security checks passed** check run exists on it. It then downloads that
SHA, not the requested name. For an emergency rollback to a commit from before
the gate existed, set `'github_require_security_checks' => false` in
`api/config.php` and switch it back afterwards; the branch requirement stays.

## Request and upload hardening

- POST/PUT/DELETE requests to the API are rejected when `Sec-Fetch-Site`/`Origin`
  show they came from another origin. This includes other `*.adventistai.lt`
  sites, which `SameSite=Lax` cookies do not stop. Extra trusted origins go in
  `allowed_origins` in `api/config.php`.
- Uploaded or ZIP-imported SVGs with scripts, event handlers, `javascript:` URLs,
  `foreignObject` or entity declarations are refused. This is a denylist backing
  up the CSP `sandbox` header for `/files/` in `deploy/nginx-site.conf.example`,
  which must also be applied to the live nginx/Virtualmin config by hand. Files
  uploaded before this change are not rescanned.

## WordPress checks and link checking (2026-10-06)
- **Links**: `links.yml` checks the links in Markdown and `readme.txt` files with [lychee](https://github.com/lycheeverse/lychee). It runs on pull requests that change them, monthly and on demand. It is not part of the security gate, because a third-party site being down should not block a merge. Exclusions are in `.lychee.toml`; adventistai.lt is excluded because its Cloudflare bot protection answers GitHub runners with 403.
