# Final Optimization Report

**Date:** 2026-04-12  
**Scope:** Safe production hardening and cost-oriented tuning for MongoDB Atlas M5/Flex (~$10/mo), scaling toward ~1000 users.  
**Constraint:** No business logic, financial math, API response shapes, Mongoose `startSession`/`withTransaction` usage, or BullMQ job handler semantics were intentionally changed.

---

## 1. Executive Summary

This pass focused on **bounded list pagination**, **safer global settings cache**, **API rate-limit defaults**, **BullMQ worker concurrency caps**, **staggered daily crons**, **leaner read paths where sums are unchanged**, **admin help-link aggregations that paginate before `$lookup`**, and a **short client-side TTL** for public common settings to cut duplicate reads. Heavy batch/cron paths that must scan real business sets were **left unchanged** to avoid any risk to payouts or eligibility.

The repository may contain **other uncommitted optimizations** from prior work (indexes, admin/client axios, dashboards, DDF helpers, etc.); this document emphasizes the **delta applied in this hardening pass**. Validate in your environment with integration tests and staging traffic before production.

---

## 2. Server Improvements

| Area | Change | Risk |
|------|--------|------|
| Pagination | New `server/utils/paginationLimits.js` with `clampListPageSize` / `clampPositivePage` used across admin and user list endpoints to reject abusive `limit`/`page` values and avoid `NaN` skips. Admin lists cap at **50**; user-facing lists cap at **100** where applied. | **VERY LOW** — same JSON shapes; only bounds invalid or oversized page sizes. |
| Wallet balance read | `fetchCurrentBalanceByUserID` loads only `type` and `amount` for transaction rows used in sum loops (same arithmetic). | **VERY LOW** |
| Wallet transactions | User wallet transaction list uses clamped page/skip and consistent `current_page` metadata. | **VERY LOW** |
| Help links (user) | Sender/receiver list endpoints: clamped pagination; metadata uses normalized page number. | **VERY LOW** |
| Team (user) | Direct downline: max page size **100** after validation; my team / my leg lists use clamped pagination. | **LOW** — clients requesting `limit` > 100 receive 100 rows per page. |
| Admin wallet | All paginated admin wallet reports use clamped limits and `pageNum` for skip/metadata. | **VERY LOW** |
| Admin help links | Three list aggregations: **`$match` → `$facet`** with **`$sort` / `$skip` / `$limit` before `$lookup`**, so joins run only on the current page. Response fields preserved. | **LOW** — same pipeline result for typical `orderBy` on payment link fields; if a future caller sorts on a joined-only field, behavior could differ (none in current UI defaults). |
| Seva Kendra / common | Admin + public Seva list: `skip` uses `clampPositivePage`; shared pagination helper. | **VERY LOW** |
| Withdrawals service | User list max **100** per page; admin list max **50**; `currentPage` reflects normalized page. | **VERY LOW** |
| Admin EPIN / First Pay | Pagination clamp + metadata alignment. | **VERY LOW** |
| User EPIN | Transfer report + list pagination clamped. | **VERY LOW** |
| Rate limiting | `express-rate-limit` default **`max`** from env `API_RATE_LIMIT_MAX` with fallback **2000** / 15 min (was 10000). Tune per deployment. | **LOW** — raise env if legitimate traffic hits 429s. |
| BullMQ | Workers use `concurrency` from `BULLMQ_WORKER_CONCURRENCY` or default **2** (same job processors; only parallelism cap). | **LOW** — slower under burst load, same eventual outcomes. |
| Cron stagger | `setupCronJob.js`: system check **01:05 UTC**, deactivate unpaid **03:10 UTC** (was 01:00 / 03:00). | **VERY LOW** — timing only. |
| Settings cache | Global `getSetting` map: **LRU-style cap** (default **50** keys, `SETTING_GLOBAL_CACHE_MAX_KEYS`); refresh entry on hit to approximate LRU. `saveSetting` still invalidates by key. | **VERY LOW** |

**Already present (not introduced here but relevant):** `connectDB` uses `maxPoolSize` default **8** and `minPoolSize` **0** (`MONGO_MAX_POOL_SIZE` / `MONGO_MIN_POOL_SIZE`); per-request AsyncLocalStorage cache middleware; public common-settings TTL cache; compound indexes on `WalletTransaction`, `PaymentLink`, and `user_uplines.user`.

---

## 3. Admin Improvements

- **Admin help-link APIs:** Aggregation pipelines reordered so **lookups run after pagination** inside the `data` facet branch — large reduction in work per request for busy collections.
- **Shared pagination helper** on admin wallet, EPIN, First Pay, Seva Kendra, help links — consistent **max 50** page size.
- **Note:** The admin app already had debounced user filters, axios dedupe, and GET in-flight reuse from earlier work; this pass did not duplicate those edits.

---

## 4. Client Improvements

- **`getCommonSettings`:** **8s in-memory TTL** (plus existing in-flight dedupe) to avoid hammering `/api/common/settings` on remounts; still dispatches the same reducer shape. Stale window is short; admin updates may take up to TTL to appear without a hard refresh (acceptable for marquee/footer-style data).

---

## 5. Database Optimization

- **Indexes:** `UserUpline` (`user`), `WalletTransaction` (`user` + `type` + `createdAt` and related), and `PaymentLink` (sender/receiver compound with status/recency) were **already defined** in models; no automatic index drops were performed.
- **Unused indexes:** Not removed automatically (per instruction); recommend periodic review in Atlas Performance Advisor.

---

## 6. BullMQ & Cron Optimization

- **Worker concurrency:** Default **2** concurrent jobs per queue (override with `BULLMQ_WORKER_CONCURRENCY`). Reduces concurrent MongoDB pressure on small tiers.
- **Cron stagger:** Two daily jobs offset by minutes to reduce simultaneous Redis enqueue + DB load spikes.

**Not changed:** Job payloads, retry wrappers, `handleCornJobs` / `handleDeactiveUnpaidCornJobs` internals, or transaction blocks in DDF / deactivation flows.

---

## 7. Performance Gains (%)

No production A/B benchmark was run in this environment. **Qualitative expectations:**

- Admin help-link list routes: **large** reduction in documents passing through `$lookup` (often **80–95%** fewer joined docs when total ≫ page size).
- Balance-by-user endpoint: **moderate** reduction in BSON decoded per request proportional to transaction count (field projection only).
- Client common settings: **up to ~100%** fewer network calls for repeated mounts within 8s.
- BullMQ concurrency: may **increase tail latency** under backlog while **lowering** peak connections and CPU.

For Atlas bill impact, monitor **Query Targeting**, **Opcounters**, and **max pool wait** after deploy.

---

## 8. Cost Reduction Impact

- Fewer **full-collection joins** on admin help-link pages → lower **RU** and CPU on M5/Flex.
- Bounded **`limit`** → fewer **large scans** from malicious or buggy clients.
- **Rate limit** default → less abuse-driven load (tune `API_RATE_LIMIT_MAX` if needed).
- **Smaller connection bursts** from capped BullMQ concurrency and existing pool settings.

---

## 9. Risk Analysis

| Item | Level |
|------|--------|
| Pagination caps (admin 50 / user 100) | **LOW** for anyone relying on `limit` > cap |
| Admin help-link aggregation reorder | **LOW** (see §2) |
| Rate limit 2000/15m | **LOW** — env tunable |
| BullMQ concurrency 2 | **LOW** — throughput only |
| Client 8s settings cache | **VERY LOW** |
| Cron minute offsets | **VERY LOW** |
| Settings global LRU | **VERY LOW** |

---

## 10. Rollback Plan

1. **Git:** `git checkout -- <file>` for each changed file, or revert the merge commit.
2. **Env-only rollback:** Set `API_RATE_LIMIT_MAX=10000`, `BULLMQ_WORKER_CONCURRENCY=32` (or unset), `SETTING_GLOBAL_CACHE_MAX_KEYS` very high, and restore previous cron strings in `setupCronJob.js` if timing must match exactly.
3. **Client:** Remove TTL branch in `getCommonSettings` and redeploy client bundle.
4. **Mongo:** No index drops were done; no rollback required for indexes from this pass.

---

## Appendix: Files Touched in This Pass

- `server/utils/paginationLimits.js` (new)
- `server/models/Setting.js`
- `server/server.js`
- `server/queueSystem/queueFactories/queueWorkers.js`
- `server/cron/jobs/setupCronJob.js`
- `server/routes/User/Controllers/WalletController.js`
- `server/routes/User/Controllers/HelpLinkController.js`
- `server/routes/User/Controllers/TeamController.js`
- `server/routes/User/Controllers/EPinsController.js`
- `server/routes/Admin/Controllers/AdminWalletController.js`
- `server/routes/Admin/Controllers/AdminHelpLinksController.js`
- `server/routes/Admin/Controllers/AdminEPinsController.js`
- `server/routes/Admin/Controllers/AdminFirstPayUsersController.js`
- `server/routes/Admin/Controllers/SevaKendraController.js`
- `server/routes/Admin/Controllers/CommonController.js`
- `server/services/withdrawal/withdrawalService.js`
- `client/src/actions/commonActions.js`

---

## Appendix: Environment Variables (Optional)

| Variable | Purpose |
|----------|---------|
| `API_RATE_LIMIT_MAX` | Max requests per IP per 15 minutes (default 2000). |
| `BULLMQ_WORKER_CONCURRENCY` | Worker parallelism (default 2). |
| `SETTING_GLOBAL_CACHE_MAX_KEYS` | LRU cap for `getSetting` global cache (default 50). |
| `MONGO_MAX_POOL_SIZE` / `MONGO_MIN_POOL_SIZE` | Connection pool (existing `db.js` behavior). |
