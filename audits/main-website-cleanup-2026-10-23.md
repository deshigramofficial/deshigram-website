# DeshiGram MAIN Website + MAIN Admin — safe cleanup audit (2026-10-23)

## Scope and safeguards
- In scope: MAIN website and MAIN admin only.
- Explicitly excluded: DeshiGram NOW app, its admin, database, files, assets and integrations.
- Do not delete or modify customer accounts, orders, payments, products, reviews, production database rows, admin settings, or active assets.
- Do not delete any legacy file without checking imports/references, production usage, and an independently testable rollback.
- No destructive cleanup or deployment authorized until the hosting origin and production release path are verified.

## Source backup / rollback point
- Immutable starting point: branch `backup/main-before-legacy-cleanup-20261023`, created from `main` before cleanup changes.
- This is a **Git source snapshot**, NOT a production database/storage backup. DB/storage backups still required before any relevant changes.
- Audit work is isolated in branch `audit/main-legacy-cleanup-20261023`.

## Deployment investigation
- GitHub repo: `deshigramofficial/deshigram-website`, default branch `main`.
- Repo root `CNAME` contains `deshigram.in`; GitHub Pages is plausible but NOT verified as current production origin.
- Connected Vercel project search returned only delivery-related projects, not a verified MAIN website project.
- Must confirm active DNS/response headers or GitHub Pages settings and actual published commit before release.

## Initial findings (non-destructive)
- `index.html`: ~100,459 characters; 15 inline style blocks, ~1,633 `!important` occurrences; repeated banner frame rules including 1536/819 and 2048/738. Treat as CSS specificity conflict candidate.
- `js/site-shell.js`: dynamically replaces header/footer on DOMContentLoaded, potential flash/layout-shift source.
- `js/website-customization.js`: fetches admin banners asynchronously, replacing static slides after page paint; likely old-banner flash source.
- `js/premium-final.js`: slider initializes on initial DOM and again after banner update event.
- `sw.js`: caches media, network-fetches pages/scripts; browser bypass test reportedly did not remove blinking/gap.
- None of these findings proves a file is unused. No production code or assets have been deleted.

## Next gates
1. Confirm deployment source and active production commit.
2. Inventory all MAIN pages/scripts/styles/assets and cross-reference dynamic imports, admin and backend usage.
3. Identify verified unused files only, with evidence and rollback list.
4. Prepare narrow cleanup PR, test mobile banner frame, refresh without legacy flash, admin banners, checkout, payments, orders, reviews and login.
5. Only then merge and deploy via confirmed hosting path, monitor and retain rollback branch.
