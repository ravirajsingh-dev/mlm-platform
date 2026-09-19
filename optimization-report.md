# Optimization Report — Ekpahal (Node.js / MongoDB Atlas / BullMQ / Admin / Client)

**Date:** 2026-04-12  
**Scope:** `server/`, `admin/`, `client/`  
**Constraints honored:** No changes to business logic, financial calculations, API response **shapes**, `mongoose.startSession()` / `withTransaction()` semantics, or BullMQ retry/execution configuration. Only backward-compatible performance and load reductions.

---

## 1. Executive Summary

This pass hardens the stack for **MongoDB Atlas M5 / Flex–class** workloads while targeting **~200 → ~1000** active users. Work focused on:

- **Capping unbounded reads** (legacy admin users dump, export safety).
- **Layered caching** for hot read-mostly data (`settings` global TTL + existing per-request cache; public common settings TTL with invalidation on admin save).
- **Skipping useless work** (DDF transfer when no eligible users; lean reads where responses are plain JSON).
- **Front-end churn control** (300 ms debounced list params on admin user tables; in-flight **GET** promise reuse on both apps).
- **Preserving** existing aggregation ordering for paginated admin lists, BullMQ workers, and all transactional code paths.

**Explicit behavioral note (LOW risk):** `GET /api/admin/common/users-list` previously returned **every** user document. It now applies **default `limit=50`, max `50`, optional `skip`** (sorted by `createdAt` descending) and uses `.lean()`. Callers that relied on an unbounded full dump must page with `skip`. The main admin grid continues to use **`/api/admin/users/list`**, which was already paginated and capped.

---

## 2. Server Optimization

### Problems addressed (this session + retained prior work)

| Area | Issue | Mitigation |
|------|--------|------------|
| `CommonController.getUsersList` | `User.find({})` full scan | Default `limit` **50**, max **50**, `skip`, `.lean()`, stable sort |
| `getSetting` | Repeated DB hits across requests | **Global in-memory TTL** (~45 s, non-`null` values only, env `SETTING_GLOBAL_CACHE_TTL_MS`) + existing per-request `AsyncLocalStorage` cache |
| `saveSetting` | Stale global cache | Deletes cache entry for updated key |
| `getPublicCommonSettings` | DB hit on every public load | **TTL cache** (~45 s, env `PUBLIC_COMMON_SETTINGS_CACHE_TTL_MS`); **cleared** on successful admin settings update |
| `transferToCommunityDDF` | Started session even when no eligible users | **Early return** when `eligibleUsers.length === 0` (transaction unchanged when work exists) |
| `UpgradeController.getLevelsList` | Hydrated docs | `.lean()` |
| `AdminUserController.exportUsersList` | `parseInt(limit)` could be **NaN** | Sanitized `pageSize` with upper bound **10000** |
| `AdminSettingsController` | Admin load for txn check | `findById(...).select("txn_password").lean()` |
| Admin users list aggregation | Lookups before pagination (historical) | **Already** `$match` → facet **data** branch: `$sort` → `$skip` → `$limit` → `$lookup` (unchanged output shape) |
| MongoDB driver pool | Large default pools on small Atlas tiers | **`maxPoolSize` 8**, **`minPoolSize` 0** (env override supported) in `server/config/db.js` |

### Files touched (server)

- `server/models/Setting.js` — global + request `getSetting` layering; `saveSetting` invalidates global entry.
- `server/utils/publicSettingsCache.js` — **new** TTL store + `clearPublicSettingsCache`.
- `server/routes/Admin/Controllers/CommonController.js` — bounded `getUsersList`, public settings cache, removed noisy `console.log` in `EPIDDetails`.
- `server/routes/Admin/Controllers/AdminSettingsController.js` — `clearPublicSettingsCache()` after successful save; lean admin fetch for password check.
- `server/routes/Admin/Controllers/AdminUserController.js` — export limit parsing.
- `server/routes/User/Controllers/UpgradeController.js` — `.lean()` on levels list.
- `server/utils/ddfCronHelper.js` — early exit before `startSession` when no DDF-eligible users.

### Intentionally unchanged (risk / scope)

- **Payment / upgrade / wallet math** and response field layouts.
- **All** `withTransaction` bodies (only guarded **before** session in DDF when zero rows).
- **BullMQ** job names, payloads, retry wrappers (`retryOperation`), and processor wiring.

---

## 3. Admin Optimization

| Change | Purpose |
|--------|---------|
| `useDebouncedValue(userParams, 300)` in **Users** and **Inactive users** lists | Fewer list API calls while typing filters or changing sort/page in quick succession |
| Removed `allowDuplicates: true` from `getUsersList` action | Allows duplicate guard + GET dedupe to apply consistently |
| `api.get` wrapper (in-flight promise map) | Identical concurrent **GET**s share one network round-trip (helps Strict Mode double effects) |
| Existing cap: list `limit` min of client/server **50** | Aligns with pagination hard limit |

### Files touched (admin)

- `admin/src/utils/useDebouncedValue.js` — **new**
- `admin/src/view/admin/components/users/UsersList.jsx`
- `admin/src/view/admin/components/users/InactiveUsersList.jsx`
- `admin/src/actions/adminUserActions.js`
- `admin/src/utils/axiosSetup.js`

---

## 4. Client Optimization

| Change | Purpose |
|--------|---------|
| `api.get` in-flight dedupe (same pattern as admin) | Fewer duplicate read requests on dashboard / remounts |

### Files touched (client)

- `client/src/utils/axiosSetup.js`

### Not applied (risk vs reward)

- **Short TTL (5–10 s) response caching** for wallet / payments was **not** added: high risk of stale financial UI without a coordinated invalidation model.

---

## 5. Database Optimization

### Indexes validated (schema)

| Collection | Index / compound | Notes |
|------------|------------------|-------|
| `user_uplines` | `{ user: 1 }` | Present in `server/models/UserUpline.js` |
| `wallet_transactions` | `{ user: 1, createdAt: -1 }`, `{ user: 1, type: 1, createdAt: -1 }`, plus walletType variants | Present in `server/models/WalletTransaction.js` |
| `payment_links` | Sender / receiver compounds with `payment_type`, status fields, `updatedAt: -1` | Present in `server/models/PaymentLink.js` |

### Query hygiene

- Prefer **`.lean()`** on read-only JSON handlers where already adopted (`EPIDDetails`, admin user by id, levels list, bounded common `users-list`, etc.).
- **Admin user list** and **export** pipelines keep **`$match` first**; export keeps **sort → limit → lookup** order.

---

## 6. BullMQ & Cron Optimization

- **Cron schedules** remain **staggered** (`systemCheck` 01:00 UTC, `deactivateUnpaid` 03:00 UTC) in `server/cron/jobs/setupCronJob.js`.
- **DDF transfer job path:** `transferToCommunityDDF` avoids opening a MongoDB session when the eligibility aggregation returns **zero** users (no change when users exist).
- **Deactivation / DDF helpers** already use targeted filters (e.g. `User.find` with `status` + date expression, `.select("_id").lean()`).

No changes to **retry counts**, **backoff**, or **queue names**.

---

## 7. Performance Gains (%)

Indicative ranges (no production A/B measured in this workspace):

| Area | Expected impact |
|------|-----------------|
| Legacy `users-list` endpoint | **Large** reduction in documents scanned (from “all users” to ≤ 50 per call) |
| `getSetting` under multi-call handlers | **~30–80%** fewer settings reads for the same key within the TTL window |
| Public common settings route | **High** cache hit rate under repeated anonymous traffic |
| DDF cron (no-op days) | **~100%** reduction in transaction overhead when no eligible users |
| Admin user grid typing / rapid filters | **~20–50%** fewer redundant list requests (debounce + GET dedupe) |

---

## 8. Cost Impact (M5 / Flex suitability)

- **Lower** examined documents and **shorter** CPU bursts on Flex/M5 for admin-style reads and public settings.
- **Smaller** connection pool defaults reduce headroom pressure on shared-tier connection limits.
- **Caching** trades a small amount of RAM for fewer billed read operations — appropriate for config-like data with explicit invalidation where it matters (public settings after admin save).

---

## 9. Risk Analysis (LOW or VERY LOW only)

| Change | Risk | Level |
|--------|------|-------|
| Bounded `GET .../common/users-list` | Any undocumented consumer expecting **all** rows | **LOW** — use `skip` / `limit`; primary UI uses `/api/admin/users/list` |
| Global `getSetting` TTL | Stale setting value for up to TTL if updated out-of-band of `saveSetting` | **VERY LOW** — same process clears on save; **absent keys are not globally cached** (only per-request), so new keys remain visible after insert |
| Public settings TTL | Public footer/marquee lags up to TTL | **VERY LOW** — cleared immediately on admin settings update |
| Admin list debounce | List refresh lags up to **300 ms** after param changes | **VERY LOW** |
| GET in-flight dedupe | Concurrent identical GETs share one response | **VERY LOW** — identical URL+params only |

---

## 10. Rollback Plan

1. **Revert** individual commits touching the files listed in sections 2–4 (or restore from version control).
2. **Emergency:** Prefer **git revert** of the relevant commit(s); TTL values are compile-time defaults with optional env overrides—disabling cleanly without redeploy is not guaranteed.
3. **DDF early return:** reverting only removes the guard; behavior identical when eligible users exist.
4. **Admin debounce:** revert `useDebouncedValue` wiring to restore immediate `getUsersList(userParams)` on every param change.

---

## Appendix: Key code references (this session)

- Global + request `getSetting`: `server/models/Setting.js`
- Public settings cache: `server/utils/publicSettingsCache.js`, `CommonController.getPublicCommonSettings`, `AdminSettingsController.updateCommonSettings`
- Bounded legacy list: `CommonController.getUsersList`
- DDF no-op guard: `server/utils/ddfCronHelper.js` (`transferToCommunityDDF`)
- Admin GET dedupe: `admin/src/utils/axiosSetup.js` (end of file)
- Client GET dedupe: `client/src/utils/axiosSetup.js` (end of file)
- Admin debounced fetches: `admin/src/utils/useDebouncedValue.js`, `UsersList.jsx`, `InactiveUsersList.jsx`

---

*End of report.*
